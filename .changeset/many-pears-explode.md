---
'astro': major
---

Export experimental `dev`, `build`, `preview`, and `sync` APIs from `astro`. These APIs allow you to run Astro's commands programmatically, and replaces the previous entrypoint that runs the Astro CLI.

While these APIs are experimental, the inline config parameter is relatively stable without foreseeable changes. However, the returned results of these APIs are more likely to change in the future.

```ts
import { dev, build, preview, sync, type AstroInlineConfig } from 'astro';

// Inline Astro config that takes highest priority over the user config
const inlineConfig: AstroInlineConfig = {
  // Inline-specific options...
  configFile: './astro.config.mjs',
  logLevel: 'info',
  // Other Astro options...
  site: 'https://example.com',
};

// Start the Astro dev server
const devServer = await dev(inlineConfig);
await devServer.stop();

// Build your Astro project
await build(inlineConfig);

// Preview your built project
const previewServer = await preview(inlineConfig);
await previewServer.stop();

// Generate types for your Astro project
await sync(inlineConfig);
```
