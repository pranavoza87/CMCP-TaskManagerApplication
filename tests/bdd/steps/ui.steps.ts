import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { codePoints, repeatGlyph, titleOfKind } from '../support/titles';

// ---- Navigation / list -----------------------------------------------------------------------

Given('I open the task manager', async ({ taskPage }) => {
  await taskPage.goto();
});

Given('the server answers task updates slowly', async ({ taskPage }) => {
  await taskPage.slowDownPatches(800);
});

When('I add a task titled {string}', async ({ taskPage }, title: string) => {
  await taskPage.addTask(title, 'button');
});

When('I add a task titled {string} by pressing Enter', async ({ taskPage }, title: string) => {
  await taskPage.addTask(title, 'enter');
});

When('I delete {string} from the list', async ({ taskPage }, title: string) => {
  await taskPage.deleteButton(title).click();
});

Then('the task list shows {string}', async ({ taskPage }, title: string) => {
  await expect(taskPage.taskTitle(title)).toBeVisible();
});

Then('the task list does not show {string}', async ({ taskPage }, title: string) => {
  await expect(taskPage.taskTitle(title)).toHaveCount(0);
});

Then('the task list shows exactly the titles {string} in order', async ({ taskPage }, csv: string) => {
  await expect(taskPage.taskTitles).toHaveText(csv.split(','));
});

Then('the task list shows no tasks', async ({ taskPage }) => {
  await expect(taskPage.taskTitles).toHaveCount(0);
  await expect(taskPage.emptyMessage).toBeVisible();
});

Then('the new task field is empty', async ({ taskPage }) => {
  await expect(taskPage.newTaskInput).toHaveValue('');
});

Then('the page shows the error {string}', async ({ taskPage }, text: string) => {
  await expect(taskPage.pageError).toHaveText(text);
});

// ---- Inline title editing ----------------------------------------------------------------------

When('I click Edit for {string}', async ({ taskPage }, title: string) => {
  await taskPage.startEdit(title);
});

When('I replace the title with {string}', async ({ taskPage }, text: string) => {
  await taskPage.editInput.fill(text);
});

When('I replace the title with a title of kind {string}', async ({ taskPage }, kind: string) => {
  await taskPage.editInput.fill(titleOfKind(kind));
});

When('I replace the title with {int} copies of {string}', async ({ taskPage }, count: number, glyph: string) => {
  await taskPage.editInput.fill(repeatGlyph(count, glyph));
});

When('I press {string} in the edit field', async ({ taskPage }, key: string) => {
  await taskPage.editInput.press(key);
});

When('I press Enter twice in quick succession in the edit field', async ({ taskPage }) => {
  await taskPage.editInput.press('Enter');
  await taskPage.page.keyboard.press('Enter');
});

When('I click Save', async ({ taskPage }) => {
  await taskPage.saveButton.click();
});

When('I click Cancel', async ({ taskPage }) => {
  await taskPage.cancelButton.click();
});

Then('the edit field is visible', async ({ taskPage }) => {
  await expect(taskPage.editInput).toBeVisible();
});

Then('the edit field is not visible', async ({ taskPage }) => {
  await expect(taskPage.editInput).toHaveCount(0);
});

Then('the edit field contains {string}', async ({ taskPage }, text: string) => {
  await expect(taskPage.editInput).toHaveValue(text);
});

Then('the edit field has {int} code points', async ({ taskPage }, n: number) => {
  await expect(taskPage.editInput).toBeVisible();
  expect(await taskPage.inputCodePoints()).toBe(n);
});

Then('the edit field is focused', async ({ taskPage }) => {
  await expect(taskPage.editInput).toBeFocused();
});

Then('the edit error contains {string}', async ({ taskPage }, text: string) => {
  await expect(taskPage.editError).toContainText(text);
});

Then('the Edit button for {string} has focus', async ({ taskPage }, title: string) => {
  await expect(taskPage.editButton(title)).toBeFocused();
});

Then('{int} update requests were sent to the server', async ({ taskPage }, n: number) => {
  // Give any stray request a moment to surface before asserting a negative/exact count.
  await taskPage.page.waitForTimeout(300);
  expect(taskPage.patchRequests).toHaveLength(n);
});

Then('the saved title in the backend has {int} code points', async ({ api, world }, n: number) => {
  await expect
    .poll(async () => {
      const t = (await api.list()).find((x) => x.id === world.currentId);
      return t ? codePoints(t.title) : -1;
    })
    .toBe(n);
});

// ---- IME composition (simulated events) ---------------------------------------------------------

When('I start an IME composition in the edit field', async ({ taskPage }) => {
  await taskPage.compositionStart();
});

When('the IME composition text becomes {string}', async ({ taskPage }, text: string) => {
  await taskPage.compositionUpdate(text);
});

When('the IME composition text becomes {int} copies of {string}', async ({ taskPage }, count: number, glyph: string) => {
  await taskPage.compositionUpdate(repeatGlyph(count, glyph));
});

When('I commit the IME composition with {string}', async ({ taskPage }, text: string) => {
  await taskPage.compositionEnd(text);
});

When('I commit the IME composition with {int} copies of {string}', async ({ taskPage }, count: number, glyph: string) => {
  await taskPage.compositionEnd(repeatGlyph(count, glyph));
});

When('the browser reports an Enter key while composing', async ({ taskPage }) => {
  await taskPage.imeKeyDown('Enter', 'isComposing');
});

When('the browser reports an Enter key with legacy key code 229', async ({ taskPage }) => {
  await taskPage.imeKeyDown('Enter', 'keyCode229');
});

When('the browser reports an Escape key while composing', async ({ taskPage }) => {
  await taskPage.imeKeyDown('Escape', 'isComposing');
});

When('the browser reports an Escape key with legacy key code 229', async ({ taskPage }) => {
  await taskPage.imeKeyDown('Escape', 'keyCode229');
});
