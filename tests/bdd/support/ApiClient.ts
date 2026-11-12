import type { APIRequestContext } from '@playwright/test';

export interface ApiResult {
  status: number;
  text: string;
  json: any;
}

export interface Task {
  id: number;
  title: string;
  status: string;
}

export class ApiClient {
  constructor(private readonly ctx: APIRequestContext) {}

  async send(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    opts: { data?: unknown; raw?: string; headers?: Record<string, string> } = {},
  ): Promise<ApiResult> {
    const hasBody = opts.raw !== undefined || opts.data !== undefined;
    const headers = { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...opts.headers };
    const res = await this.ctx.fetch(url, {
      method,
      headers,
      data: opts.raw !== undefined ? opts.raw : opts.data,
    });
    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }
    return { status: res.status(), text, json };
  }

  async list(): Promise<Task[]> {
    return (await this.send('GET', '/api/tasks')).json as Task[];
  }

  async create(title: string, status?: string): Promise<Task> {
    const r = await this.send('POST', '/api/tasks', { data: status ? { title, status } : { title } });
    if (r.status !== 201) throw new Error(`Seeding task "${title}" failed: ${r.status} ${r.text}`);
    return r.json as Task;
  }

  async remove(id: number | string): Promise<ApiResult> {
    return this.send('DELETE', `/api/tasks/${id}`);
  }

  async reset(): Promise<void> {
    for (const t of await this.list()) await this.remove(t.id);
  }

  async findByTitle(title: string): Promise<Task | undefined> {
    return (await this.list()).find((t) => t.title === title);
  }
}
