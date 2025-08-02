---
'astro': minor
---

Adds experimental support for automatic [Chrome DevTools workspace folders](https://developer.chrome.com/docs/devtools/workspaces)

This adds a new experimental flag `chromeDevtoolsWorkspace`. When enabled, the dev server will automatically configure a Chrome DevTools workspace for your project, allowing you to edit files directly in the browser and have those changes reflected in your local file system.

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    chromeDevtoolsWorkspace: true,
  },
});
```

See the [Chrome DevTools workspace documentation](https://developer.chrome.com/docs/devtools/workspaces) for more information.
