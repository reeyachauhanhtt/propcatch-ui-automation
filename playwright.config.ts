import { defineConfig, devices } from '@playwright/test';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const USER_AUTH_FILE = path.join(__dirname, 'playwright/.auth/user.json');
const ADMIN_AUTH_FILE = path.join(__dirname, 'playwright/.auth/admin.json');

const USER_BASE_URL =
  process.env.BASE_URL || 'https://propcatchwebapp.vercel.app';
const ADMIN_BASE_URL =
  process.env.ADMIN_BASE_URL || 'https://propcatch-admin.vercel.app';

const desktopViewport = {
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
};

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Projects:
 * - User:  user-setup → chromium / firefox / webkit  (tests/user)
 * - Admin modules: admin-setup → admin-chromium       (tests/admin except auth)
 * - Admin auth:    admin-auth                         (login/logout specs only)
 *
 * Module tests reuse playwright/.auth/admin.json (same pattern as User).
 * Do not depend admin-setup on admin-auth — auth specs login/logout and would
 * force a full re-login suite on every builders/dashboard run.
 */
export default defineConfig({
  /* User: tests/user | Admin: tests/admin | Cross-platform: tests/cross-platform */
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never', host: 'localhost' }]],
  use: {
    baseURL: USER_BASE_URL,
    headless: true,
    screenshot: {
      mode: 'on',
      fullPage: true,
    },
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 },
    },
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'user-setup',
      testMatch: /tests\/user\/auth\/auth\.setup\.ts/,
      use: { baseURL: USER_BASE_URL },
    },

    {
      name: 'admin-setup',
      testMatch: /tests\/admin\/auth\/auth\.setup\.ts/,
      use: { baseURL: ADMIN_BASE_URL },
    },

    /* Alias so existing `npm test` / --project=setup keeps working for User. */
    {
      name: 'setup',
      testMatch: /tests\/user\/auth\/auth\.setup\.ts/,
      use: { baseURL: USER_BASE_URL },
    },

    {
      name: 'chromium',
      dependencies: ['user-setup'],
      testMatch: /tests\/user\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...desktopViewport,
        baseURL: USER_BASE_URL,
        storageState: USER_AUTH_FILE,
      },
    },

    {
      name: 'firefox',
      dependencies: ['user-setup'],
      testMatch: /tests\/user\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        ...desktopViewport,
        baseURL: USER_BASE_URL,
        storageState: USER_AUTH_FILE,
      },
    },

    {
      name: 'webkit',
      dependencies: ['user-setup'],
      testMatch: /tests\/user\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        ...desktopViewport,
        baseURL: USER_BASE_URL,
        storageState: USER_AUTH_FILE,
      },
    },

    /**
     * Auth specs use anonymous storage and login/logout themselves.
     * Keep separate from admin-chromium so logout cannot revoke the
     * shared storageState used by module tests.
     */
    {
      name: 'admin-auth',
      testMatch: /tests\/admin\/auth\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...desktopViewport,
        baseURL: ADMIN_BASE_URL,
      },
    },

    {
      name: 'admin-chromium',
      dependencies: ['admin-setup'],
      testMatch: /tests\/(admin\/(?!auth\/)|cross-platform\/).*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...desktopViewport,
        baseURL: ADMIN_BASE_URL,
        storageState: ADMIN_AUTH_FILE,
      },
    },
  ],
});
