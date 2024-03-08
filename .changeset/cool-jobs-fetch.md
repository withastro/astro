---
"astro": minor
---

Adds a new `experimental.directRenderScript` configuration option which provides a more reliable strategy to prevent scripts from being executed in pages where they are not used. 

This replaces the `experimental.optimizeHoistedScript` flag introduced in v2.10.4 to prevent unused components' scripts from being included in a page unexpectedly. That experimental option no longer exists and must be removed from your configuration, whether or not you enable `directRenderScript`:

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
-		optimizeHoistedScript: true,
+		directRenderScript: true
	}
});
```

With `experimental.directRenderScript` configured, scripts are now directly rendered as declared in Astro files (including existing features like TypeScript, importing `node_modules`, and deduplicating scripts). You can also now conditionally render scripts in your Astro file.

However, this means scripts are no longer hoisted to the `<head>` and multiple scripts on a page are no longer bundled together. If you enable this option, you should check that all your `<script>` tags behave as expected.

This option will be enabled by default in Astro 5.0.
