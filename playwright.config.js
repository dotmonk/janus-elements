import {
  defineConfig,
  devices,
} from "@playwright/test";

export default defineConfig(
  {
    testDir: "src/tests",
    testMatch: "*.spec.js",
    forbidOnly: true,
    reporter: "list",
    use: {
      baseURL: "http://localhost:8000",
    },
    projects: [
      {
        name: "chromium",
        use: devices["Desktop Chrome"],
      },
      {
        name: "firefox",
        use: devices["Desktop Firefox"],
      },
      {
        name: "webkit",
        use: devices["Desktop Safari"],
      },
    ],
    webServer: {
      command: "node bin/januse.mjs dev --watch src --watch docs --sync \"src/janus:docs/lib/janus\" docs",
      url: "http://localhost:8000/docs/",
      stderr: "ignore",
    },
  },
);
