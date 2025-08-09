---
'astro': minor
---

Adds experimental support for automatic [Chrome DevTools workspace folders](https://developer.chrome.com/docs/devtools/workspaces)

This feature allows you to edit files directly in the browser and have those changes reflected in your local file system via a connected workspace folder. This allows you to apply edits such as CSS tweaks without leaving your browser tab!

With this feature enabled, the Astro dev server will automatically configure a Chrome DevTools workspace for your project. Your project will then appear as a workspace source, ready to connect. Then, changes that you make in the "Sources" panel are automatically saved to your project source code.

To enable this feature, add the experimental flag `chromeDevtoolsWorkspace` to your Astro config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    chromeDevtoolsWorkspace: true,
  },
});
```

See the [experimental Chrome DevTools workspace feature documentation](https://docs.astro.build/en/reference/experimental-flags/chrome-devtools-workspace/) for more information.
