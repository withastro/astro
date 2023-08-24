---
'astro': major
---

Export experimental `dev`, `build`, `preview`, and `sync` APIs from `astro`. These APIs allow you to run Astro's commands programmatically, and replaces the previous entry point that runs the Astro CLI.

While these APIs are experimental, the inline config parameter is relatively stable without foreseeable changes. However, the returned results of these APIs are more likely to change in the future.

```ts
import { dev, build, preview, sync, type AstroInlineConfig } from 'astro';

// Inline Astro config object.
// Provide a path to a configuration file to load or set options directly inline.
const inlineConfig: AstroInlineConfig = {
  // Inline-specific options...
  configFile: './astro.config.mjs',
  logLevel: 'info',
  // Standard Astro config options...
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
