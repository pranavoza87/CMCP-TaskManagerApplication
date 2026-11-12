import { test as base, createBdd } from 'playwright-bdd';
import { TaskPage } from '../pages/TaskPage';
import { ApiClient, type ApiResult } from '../support/ApiClient';
import { API_URL } from '../support/env';

/** Per-scenario shared state (a Cucumber "world"). */
export interface World {
  response?: ApiResult;
  currentId?: number;
}

export const test = base.extend<{ api: ApiClient; taskPage: TaskPage; world: World }>({
  api: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: API_URL });
    await use(new ApiClient(ctx));
    await ctx.dispose();
  },
  taskPage: async ({ page }, use) => {
    await use(new TaskPage(page));
  },
  world: async ({}, use) => {
    await use({});
  },
});

export const { Given, When, Then } = createBdd(test);
