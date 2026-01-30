---
'astro': major
---

Moves `buildOutput` from `astro:config:done` hook to `astro:build:done` hook in the Integration API.

This change allows Astro to correctly detect when server output is needed for server islands, even when all pages are statically prerendered. Previously, adapters would receive `buildOutput: 'static'` in `astro:config:done` even when server islands were present, causing them to skip building the SSR entrypoint needed for those islands.

#### What should I do?

If your integration uses `buildOutput` from the `astro:config:done` hook, you'll need to move that logic to the `astro:build:done` hook instead:

**Before:**
```js
'astro:config:done': ({ buildOutput }) => {
  if (buildOutput === 'server') {
    // server-specific logic
  }
}
```

**After:**
```js
'astro:build:done': ({ buildOutput }) => {
  if (buildOutput === 'server') {
    // server-specific logic
  }
}
```
