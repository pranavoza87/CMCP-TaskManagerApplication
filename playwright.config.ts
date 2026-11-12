import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import * as os from 'node:os';
import * as path from 'node:path';
import { API_PORT, WEB_PORT } from './tests/bdd/support/env';

const REPORT_ROOT = path.join(__dirname, 'tests', 'Test Execution & Reporting');
// Throwaway SQLite file so the suite never touches backend/tasks.db.
const E2E_DB = path.join(os.tmpdir(), 'task-manager-bdd-e2e.db');

const testDir = defineBddConfig({
  features: 'tests/bdd/features/**/*.feature',
  steps: 'tests/bdd/steps/**/*.ts',
  outputDir: 'tests/bdd/.features-gen',
});

export default defineConfig({
  testDir,
  outputDir: path.join(REPORT_ROOT, 'test-results'),
  // All scenarios share one SQLite database, so run them serially.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(REPORT_ROOT, 'html-report'), open: 'never' }],
    ['json', { outputFile: path.join(REPORT_ROOT, 'results.json') }],
    ['junit', { outputFile: path.join(REPORT_ROOT, 'junit.xml') }],
  ],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node src/server.js',
      cwd: path.join(__dirname, 'backend'),
      env: { PORT: String(API_PORT), DB_PATH: E2E_DB },
      url: `http://localhost:${API_PORT}/api/tasks`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      cwd: path.join(__dirname, 'frontend'),
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 90_000,
    },
  ],
});
