import { spawn, type ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';

const BACKEND_DIR = path.join(__dirname, '..', '..', '..', 'backend');
// Environment variables that change API behaviour; never inherited from the host shell.
const CONFIG_VARS = ['ALLOWED_ORIGINS', 'TITLE_MAX_LENGTH'];

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

/**
 * A throwaway backend process with its own port, its own SQLite file and caller-supplied
 * configuration (ALLOWED_ORIGINS, TITLE_MAX_LENGTH, ...). The shared server started by
 * playwright.config.ts is configured once for the whole run, so configuration scenarios use this.
 * Stdout and stderr are captured so request logging can be asserted.
 */
export class IsolatedServer {
  private child?: ChildProcess;
  private dbDir?: string;
  private output = '';
  url = '';

  async start(env: Record<string, string> = {}): Promise<void> {
    const port = await freePort();
    this.url = `http://127.0.0.1:${port}`;
    this.dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-manager-bdd-iso-'));
    const inherited = { ...process.env };
    for (const k of CONFIG_VARS) delete inherited[k];
    this.child = spawn(process.execPath, ['src/server.js'], {
      cwd: BACKEND_DIR,
      env: { ...inherited, PORT: String(port), DB_PATH: path.join(this.dbDir, 'iso.db'), ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.child.stdout!.on('data', (d) => (this.output += d.toString()));
    this.child.stderr!.on('data', (d) => (this.output += d.toString()));
    await this.waitUntilReady();
  }

  get log(): string {
    return this.output;
  }

  private async waitUntilReady(): Promise<void> {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (this.child!.exitCode !== null) throw new Error(`Isolated API exited early:\n${this.output}`);
      if (/API listening/.test(this.output)) return;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Isolated API did not start within 15s:\n${this.output}`);
  }

  async stop(): Promise<void> {
    const child = this.child;
    if (child && child.exitCode === null) {
      await new Promise<void>((resolve) => {
        child.once('exit', () => resolve());
        child.kill();
      });
    }
    if (this.dbDir) fs.rmSync(this.dbDir, { recursive: true, force: true });
    this.child = undefined;
    this.dbDir = undefined;
  }
}
