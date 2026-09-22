# No Dependencies

Scope: this rule governs the **shipped app** — `index.html`, `styles.css`, `app.js`.

- The shipped app has zero runtime dependencies. No frameworks, no build step, no npm
  packages, no CDN scripts. Ever.
- It ships as static files opened directly in a browser.
- No TypeScript, no JSX, no bundler. Browser-native syntax only.
- Need a utility? Write the ~10 lines yourself.
- Adding a file means adding a `<script>`/`<link>` tag by hand — prefer extending an existing file.

Dev tooling (test runners, MCP servers, scripts under `tools/`) may use npm packages, as long
as it never becomes a runtime dependency of the app and `index.html` stays framework-free.
