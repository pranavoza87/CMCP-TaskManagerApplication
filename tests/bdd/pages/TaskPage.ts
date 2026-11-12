import { expect, type Locator, type Page } from '@playwright/test';

/** Page Object for the single-page Task Manager UI (frontend/src/App.jsx). */
export class TaskPage {
  /** URLs of every PATCH request the page has issued since it was created. */
  readonly patchRequests: string[] = [];

  readonly heading: Locator;
  readonly newTaskInput: Locator;
  readonly addButton: Locator;
  readonly taskTitles: Locator;
  readonly emptyMessage: Locator;
  readonly pageError: Locator;
  readonly editInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly editError: Locator;

  constructor(readonly page: Page) {
    page.on('request', (r) => {
      if (r.method() === 'PATCH' && r.url().includes('/api/tasks/')) this.patchRequests.push(r.url());
    });
    this.heading = page.getByRole('heading', { name: 'Task Manager' });
    this.newTaskInput = page.getByPlaceholder('New task title');
    this.addButton = page.getByRole('button', { name: 'Add', exact: true });
    this.taskTitles = page.locator('ul.task-list > li > span:first-child');
    this.emptyMessage = page.getByText('No tasks yet.');
    this.pageError = page.locator('main > p.error');
    this.editInput = page.getByRole('textbox', { name: /^Edit title for / });
    this.saveButton = page.getByRole('button', { name: /^Save title for / });
    this.cancelButton = page.getByRole('button', { name: /^Cancel editing / });
    this.editError = page.locator('li span.error[id^="edit-error-"]');
  }

  async goto(): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => r.request().method() === 'GET' && new URL(r.url()).pathname === '/api/tasks'),
      this.page.goto('/'),
    ]);
    await expect(this.heading).toBeVisible();
  }

  taskTitle(title: string): Locator {
    return this.page.getByText(title, { exact: true });
  }
  editButton(title: string): Locator {
    return this.page.getByRole('button', { name: `Edit ${title}`, exact: true });
  }
  deleteButton(title: string): Locator {
    return this.page.getByRole('button', { name: `Delete ${title}`, exact: true });
  }

  async addTask(title: string, how: 'button' | 'enter' = 'button'): Promise<void> {
    await this.newTaskInput.fill(title);
    if (how === 'enter') await this.newTaskInput.press('Enter');
    else await this.addButton.click();
  }

  async startEdit(title: string): Promise<void> {
    // The UI ignores Edit/Delete clicks for ~600ms after leaving edit mode (stray-click guard in
    // App.jsx), so retry the click until the edit field actually appears.
    await expect(async () => {
      await this.editButton(title).click({ timeout: 1_000 });
      await expect(this.editInput).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 8_000 });
  }

  async inputCodePoints(): Promise<number> {
    return [...(await this.editInput.inputValue())].length;
  }

  /** Delay every PATCH response so in-flight behaviour (double submit) can be observed. */
  async slowDownPatches(ms: number): Promise<void> {
    await this.page.route('**/api/tasks/*', async (route) => {
      if (route.request().method() === 'PATCH') await new Promise((r) => setTimeout(r, ms));
      await route.continue();
    });
  }

  // ---- IME simulation -------------------------------------------------------------------------
  // Headless Chromium has no real IME, so composition is simulated with the same DOM events a
  // browser fires: compositionstart / input (isComposing) / keydown (isComposing or keyCode 229) /
  // compositionend. React consumes them through its normal synthetic-event pipeline.

  async compositionStart(): Promise<void> {
    await this.editInput.evaluate((el) => {
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    });
  }

  async compositionUpdate(text: string): Promise<void> {
    await this.editInput.evaluate((el: HTMLInputElement, value) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(el, value);
      el.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: value }));
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, isComposing: true, inputType: 'insertCompositionText' }));
    }, text);
  }

  async compositionEnd(text: string): Promise<void> {
    await this.editInput.evaluate((el: HTMLInputElement, value) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(el, value);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, isComposing: true, inputType: 'insertCompositionText' }));
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: value }));
    }, text);
  }

  /** Dispatches a keydown the way a browser reports a key consumed by an IME. */
  async imeKeyDown(key: 'Enter' | 'Escape', mode: 'isComposing' | 'keyCode229'): Promise<void> {
    await this.editInput.evaluate(
      (el, args) => {
        const init: KeyboardEventInit & { keyCode?: number } = {
          key: args.key,
          bubbles: true,
          cancelable: true,
          isComposing: args.mode === 'isComposing',
          keyCode: args.mode === 'keyCode229' ? 229 : args.key === 'Enter' ? 13 : 27,
        };
        el.dispatchEvent(new KeyboardEvent('keydown', init));
      },
      { key, mode },
    );
  }
}
