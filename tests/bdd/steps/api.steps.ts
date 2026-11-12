import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { codePoints, repeatGlyph, titleOfKind } from '../support/titles';

// ---- Shared Givens (API and UI features) -----------------------------------------------------

Given('the task list is empty', async ({ api }) => {
  await api.reset();
});

Given('a task titled {string} exists', async ({ api, world }, title: string) => {
  world.currentId = (await api.create(title)).id;
});

Given('a task titled {string} with status {string} exists', async ({ api, world }, title: string, status: string) => {
  world.currentId = (await api.create(title, status)).id;
});

Given('the following tasks exist in this order:', async ({ api, world }, table) => {
  for (const [title] of table.raw()) world.currentId = (await api.create(title)).id;
});

Given('the current task is deleted behind the scenes', async ({ api, world }) => {
  await api.remove(world.currentId!);
});

// ---- Core CRUD ---------------------------------------------------------------------------------

When('I list all tasks', async ({ api, world }) => {
  world.response = await api.send('GET', '/api/tasks');
});

When('I create a task titled {string}', async ({ api, world }, title: string) => {
  world.response = await api.send('POST', '/api/tasks', { data: { title } });
  if (world.response.status === 201) world.currentId = world.response.json.id;
});

When('I create a task titled {string} with status {string}', async ({ api, world }, title: string, status: string) => {
  world.response = await api.send('POST', '/api/tasks', { data: { title, status } });
  if (world.response.status === 201) world.currentId = world.response.json.id;
});

When('I create a task with no title field', async ({ api, world }) => {
  world.response = await api.send('POST', '/api/tasks', { data: {} });
});

When('I delete the current task', async ({ api, world }) => {
  world.response = await api.remove(world.currentId!);
});

When('I delete the task with id {string}', async ({ api, world }, id: string) => {
  world.response = await api.remove(id);
});

// ---- PATCH /api/tasks/:id ----------------------------------------------------------------------

const patch = (api: any, id: string | number, data: unknown) => api.send('PATCH', `/api/tasks/${id}`, { data });

When('I patch the current task with status {string}', async ({ api, world }, status: string) => {
  world.response = await patch(api, world.currentId!, { status });
});

When('I patch the current task with title {string}', async ({ api, world }, title: string) => {
  world.response = await patch(api, world.currentId!, { title });
});

When('I patch the current task with title {string} and status {string}', async ({ api, world }, title: string, status: string) => {
  world.response = await patch(api, world.currentId!, { title, status });
});

When('I patch the current task with a title of kind {string}', async ({ api, world }, kind: string) => {
  world.response = await patch(api, world.currentId!, { title: titleOfKind(kind) });
});

When('I patch the current task with a title made of {int} copies of {string}', async ({ api, world }, count: number, glyph: string) => {
  world.response = await patch(api, world.currentId!, { title: repeatGlyph(count, glyph) });
});

When('I patch the current task with an oversized body of about {int} KB', async ({ api, world }, kb: number) => {
  world.response = await patch(api, world.currentId!, { title: 'a'.repeat(kb * 1024) });
});

When('I patch the current task with raw JSON:', async ({ api, world }, doc: string) => {
  world.response = await api.send('PATCH', `/api/tasks/${world.currentId}`, { raw: doc.trim() });
});

When('I patch task id {string} with raw JSON:', async ({ api, world }, id: string, doc: string) => {
  world.response = await api.send('PATCH', `/api/tasks/${id}`, { raw: doc.trim() });
});

When('I patch the current task with content encoding {string} and raw JSON:', async ({ api, world }, enc: string, doc: string) => {
  world.response = await api.send('PATCH', `/api/tasks/${world.currentId}`, { raw: doc.trim(), headers: { 'Content-Encoding': enc } });
});

// ---- Assertions --------------------------------------------------------------------------------

Then('the response status is {int}', async ({ world }, status: number) => {
  expect(world.response!.status, world.response!.text).toBe(status);
});

Then('the response has no body', async ({ world }) => {
  expect(world.response!.text).toBe('');
});

Then('the response error code is {string}', async ({ world }, code: string) => {
  expect(world.response!.json.error.code).toBe(code);
});

Then('the response error message is {string}', async ({ world }, message: string) => {
  expect(world.response!.json.error.message).toBe(message);
});

Then('the response error details include field {string} with issue {string}', async ({ world }, field: string, issue: string) => {
  expect(world.response!.json.error.details).toContainEqual({ field, issue });
});

Then('the legacy error text is {string}', async ({ world }, text: string) => {
  expect(world.response!.json).toEqual({ error: text });
});

Then('the response task has title {string}', async ({ world }, title: string) => {
  expect(world.response!.json.title).toBe(title);
});

Then('the response task has title of kind {string}', async ({ world }, kind: string) => {
  expect(world.response!.json.title).toBe(titleOfKind(kind));
});

Then('the response task has status {string}', async ({ world }, status: string) => {
  expect(world.response!.json.status).toBe(status);
});

Then('the response task has {int} title code points', async ({ world }, n: number) => {
  expect(codePoints(world.response!.json.title)).toBe(n);
});

Then('the response task is the current task', async ({ world }) => {
  expect(world.response!.json.id).toBe(world.currentId);
});

Then('the response lists {int} tasks', async ({ world }, n: number) => {
  expect(world.response!.json).toHaveLength(n);
});

Then('the response lists task titles in order {string}', async ({ world }, csv: string) => {
  expect((world.response!.json as { title: string }[]).map((t) => t.title)).toEqual(csv.split(','));
});

Then('the response task has a numeric id', async ({ world }) => {
  expect(typeof world.response!.json.id).toBe('number');
});

// ---- Persistence checks ------------------------------------------------------------------------

Then('the stored current task has title {string}', async ({ api, world }, title: string) => {
  const t = (await api.list()).find((x) => x.id === world.currentId);
  expect(t?.title).toBe(title);
});

Then('the stored current task has status {string}', async ({ api, world }, status: string) => {
  const t = (await api.list()).find((x) => x.id === world.currentId);
  expect(t?.status).toBe(status);
});

Then('the backend has no task titled {string}', async ({ api }, title: string) => {
  expect(await api.findByTitle(title)).toBeUndefined();
});

Then('the stored current task has title of kind {string}', async ({ api, world }, kind: string) => {
  const t = (await api.list()).find((x) => x.id === world.currentId);
  expect(t?.title).toBe(titleOfKind(kind));
});
