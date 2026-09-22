import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'list' : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry'
  },
  // Focus-on-click is Chromium-specific and focus restoration is a core assertion here.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'ignore',
    timeout: 30000
  }
});
