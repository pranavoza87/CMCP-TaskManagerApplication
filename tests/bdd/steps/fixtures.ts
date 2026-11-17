import { test as base, createBdd } from 'playwright-bdd';
import { TaskPage } from '../pages/TaskPage';
import { ApiClient, type ApiResult } from '../support/ApiClient';
import { API_URL } from '../support/env';
import { IsolatedServer } from '../support/IsolatedServer';

/** Per-scenario shared state (a Cucumber "world"). */
export interface World {
  response?: ApiResult;
  currentId?: number;
}

/** A scenario-owned backend started with custom configuration (see IsolatedServer). */
export interface IsolatedApi {
  /** Starts the server; the previous one, if any, is stopped first. */
  start(env: Record<string, string>): Promise<void>;
  /** The server must have been started in the scenario. */
  readonly server: IsolatedServer;
  readonly client: ApiClient;
}

export const test = base.extend<{ api: ApiClient; taskPage: TaskPage; world: World; isolated: IsolatedApi }>({
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
  isolated: async ({ playwright }, use) => {
    let server: IsolatedServer | undefined;
    let client: ApiClient | undefined;
    let ctx: Awaited<ReturnType<typeof playwright.request.newContext>> | undefined;
    await use({
      async start(env) {
        await ctx?.dispose();
        await server?.stop();
        server = new IsolatedServer();
        await server.start(env);
        ctx = await playwright.request.newContext({ baseURL: server.url });
        client = new ApiClient(ctx);
      },
      get server() {
        if (!server) throw new Error('No isolated server running: add a "Given a separate API server is started ..." step first.');
        return server;
      },
      get client() {
        if (!client) throw new Error('No isolated server running: add a "Given a separate API server is started ..." step first.');
        return client;
      },
    });
    await ctx?.dispose();
    await server?.stop();
  },
});

export const { Given, When, Then } = createBdd(test);
