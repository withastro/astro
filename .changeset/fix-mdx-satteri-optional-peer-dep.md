---
'@astrojs/mdx': patch
---

Fixes a build error (`[MISSING_EXPORT] "satteriCollectImagesPlugin"`) when using `@astrojs/mdx` without `@astrojs/markdown-satteri` installed.

The error occurred because Rolldown (Vite 8's bundler) eagerly follows dynamic imports and encountered static imports from the optional peer dep `@astrojs/markdown-satteri` in `satteri/index.js`. This was triggered when user code imported `getContainerRenderer` from `@astrojs/mdx` (e.g. for RSS feeds using the Container API).

The fix:
1. Converts static imports from `@astrojs/markdown-satteri` and `satteri` to lazy dynamic imports in `satteri/index.ts`
2. Makes the Vite plugin imports in `index.ts` lazy to avoid dragging the satteri code path into the bundle
3. Externalizes `@astrojs/markdown-satteri` and `satteri` in the Rolldown build config to prevent bundling of uninstalled optional peer deps
