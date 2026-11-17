import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { repeatGlyph } from '../support/titles';

// Steps for EPMCDMETST-72136 (ENH-13..ENH-17) and EPMCDMETST-72162: health, CORS, request logging,
// POST error handling, POST title length and POST status validation.
//
// Most request steps exist twice: against the shared server started by playwright.config.ts (default
// configuration) and, with the suffix " on the separate server", against a throwaway backend whose
// environment (ALLOWED_ORIGINS, TITLE_MAX_LENGTH) the scenario chooses.

const SEPARATE = ' on the separate server';
const targets = [{ suffix: '' }, { suffix: SEPARATE }] as const;

// ---- Separate server lifecycle -------------------------------------------------------------------

Given('a separate API server is started with default configuration', async ({ isolated }) => {
  await isolated.start({});
});

Given('a separate API server is started with environment:', async ({ isolated }, table) => {
  await isolated.start(Object.fromEntries(table.raw().map(([k, v]: string[]) => [k, v ?? ''])));
});

// ---- Requests, against either server ---------------------------------------------------------------

for (const t of targets) {
  When(`I send a GET request to {string}${t.suffix}`, async ({ api, isolated, world }, url: string) => {
    world.response = await (t.suffix ? isolated.client : api).send('GET', url);
  });

  When(`I send a GET request to {string} with origin {string}${t.suffix}`, async ({ api, isolated, world }, url: string, origin: string) => {
    world.response = await (t.suffix ? isolated.client : api).send('GET', url, { headers: { Origin: origin } });
  });

  When(
    `I send a preflight request to {string} from origin {string} for method {string}${t.suffix}`,
    async ({ api, isolated, world }, url: string, origin: string, method: string) => {
      world.response = await (t.suffix ? isolated.client : api).send('OPTIONS', url, {
        headers: { Origin: origin, 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': 'content-type' },
      });
    },
  );

  // The shared-server variants of the next steps already live in api.steps.ts.
  if (t.suffix) {
    Given(`a task titled {string} exists${t.suffix}`, async ({ api, isolated, world }, title: string) => {
      world.currentId = (await (t.suffix ? isolated.client : api).create(title)).id;
    });

    When(`I create a task titled {string}${t.suffix}`, async ({ api, isolated, world }, title: string) => {
      world.response = await (t.suffix ? isolated.client : api).send('POST', '/api/tasks', { data: { title } });
      if (world.response!.status === 201) world.currentId = world.response!.json.id;
    });

    When(
      `I patch the current task with a title made of {int} copies of {string}${t.suffix}`,
      async ({ api, isolated, world }, count: number, glyph: string) => {
        world.response = await (t.suffix ? isolated.client : api).send('PATCH', `/api/tasks/${world.currentId}`, {
          data: { title: repeatGlyph(count, glyph) },
        });
      },
    );

    When(`I list all tasks${t.suffix}`, async ({ api, isolated, world }) => {
      world.response = await (t.suffix ? isolated.client : api).send('GET', '/api/tasks');
    });
  }

  When(`I create a task whose title is {int} copies of {string}${t.suffix}`, async ({ api, isolated, world }, count: number, glyph: string) => {
    world.response = await (t.suffix ? isolated.client : api).send('POST', '/api/tasks', { data: { title: repeatGlyph(count, glyph) } });
    if (world.response!.status === 201) world.currentId = world.response!.json.id;
  });

  When(
    `I create a task whose title is {int} copies of {string} surrounded by spaces${t.suffix}`,
    async ({ api, isolated, world }, count: number, glyph: string) => {
      world.response = await (t.suffix ? isolated.client : api).send('POST', '/api/tasks', { data: { title: `   ${repeatGlyph(count, glyph)}   ` } });
    },
  );

  Then(`the backend holds {int} tasks${t.suffix}`, async ({ api, isolated, world }, n: number) => {
    expect(await (t.suffix ? isolated.client : api).list()).toHaveLength(n);
  });
}

// ---- POST /api/tasks: raw bodies ------------------------------------------------------------------

When('I post raw JSON to the tasks endpoint:', async ({ api, world }, doc: string) => {
  world.response = await api.send('POST', '/api/tasks', { raw: doc.trim() });
});

When('I post an oversized body of about {int} KB to the tasks endpoint', async ({ api, world }, kb: number) => {
  world.response = await api.send('POST', '/api/tasks', { data: { title: 'a'.repeat(kb * 1024) } });
});

When(
  'I post to the tasks endpoint with content encoding {string} and raw JSON:',
  async ({ api, world }, enc: string, doc: string) => {
    world.response = await api.send('POST', '/api/tasks', { raw: doc.trim(), headers: { 'Content-Encoding': enc } });
  },
);

When('I delete the task with id {string} sending raw JSON:', async ({ api, world }, id: string, doc: string) => {
  world.response = await api.send('DELETE', `/api/tasks/${id}`, { raw: doc.trim() });
});

// ---- POST /api/tasks: status as an arbitrary JSON value ----------------------------------------------

When('I create a task titled {string} with the JSON status value {}', async ({ api, world }, title: string, literal: string) => {
  world.response = await api.send('POST', '/api/tasks', { data: { title, status: JSON.parse(literal) } });
  if (world.response.status === 201) world.currentId = world.response.json.id;
});

// ---- Response assertions ------------------------------------------------------------------------------

Then('the response JSON is:', async ({ world }, doc: string) => {
  expect(world.response!.json).toEqual(JSON.parse(doc));
});

Then('the response header {string} is {string}', async ({ world }, name: string, value: string) => {
  expect(world.response!.headers[name.toLowerCase()]).toBe(value);
});

Then('the response header {string} contains {string}', async ({ world }, name: string, value: string) => {
  expect(world.response!.headers[name.toLowerCase()] ?? '').toContain(value);
});

Then('the response has no header {string}', async ({ world }, name: string) => {
  expect(world.response!.headers[name.toLowerCase()]).toBeUndefined();
});

// ---- Request logging (ENH-15) ----------------------------------------------------------------------

Then(
  'the separate server log has a {string} entry for {string} with status {int}',
  async ({ isolated }, method: string, url: string, status: number) => {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Format: "<METHOD> <originalUrl> <status> <ms>ms", written when the response finishes.
    const line = new RegExp(`^${method} ${escaped} ${status} \\d+(\\.\\d+)?ms$`, 'm');
    await expect.poll(() => isolated.server.log).toMatch(line);
  },
);
