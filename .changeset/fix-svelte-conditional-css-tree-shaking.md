---
'astro': patch
---

Fixes CSS for conditionally rendered Svelte components being missing from production builds. When Svelte components are rendered behind `{#if}` blocks where the condition is `false` during SSR, Vite's `cssScopeTo` feature would tree-shake their CSS in the server build. The client build's CSS deduplication logic then incorrectly deleted the client CSS asset (which had the full styles) before the recovery code could use it. CSS assets are now saved before deletion and restored if they're needed by the `cssScopeTo` recovery logic.
