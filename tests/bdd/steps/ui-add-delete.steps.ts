import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { codePoints, repeatGlyph } from '../support/titles';

// UI steps for EPMCDMETST-72136: add-field length limit (ENH-16) and delete resiliency (ENH-13).

Given('the server fails task deletion with an internal error', async ({ taskPage }) => {
  await taskPage.failDeletesWithServerError();
});

When('I paste {int} copies of {string} into the new task field', async ({ taskPage }, count: number, glyph: string) => {
  await taskPage.fillNewTask(repeatGlyph(count, glyph));
});

When('I type {int} copies of {string} into the new task field', async ({ taskPage }, count: number, glyph: string) => {
  await taskPage.typeNewTask(repeatGlyph(count, glyph));
});

When('I click Add', async ({ taskPage }) => {
  await taskPage.addButton.click();
});

Then('the new task field has {int} code points', async ({ taskPage }, n: number) => {
  expect(await taskPage.newTaskCodePoints()).toBe(n);
});

Then('the only backend task has {int} title code points', async ({ api }, n: number) => {
  await expect
    .poll(async () => {
      const tasks = await api.list();
      return tasks.length === 1 ? codePoints(tasks[0].title) : -1;
    })
    .toBe(n);
});

Then('the page shows no error', async ({ taskPage }) => {
  await expect(taskPage.pageError).toHaveCount(0);
});
