---
'astro': patch
---

Fixes incorrect config update when calling `updateConfig` from `astro:build:setup` hook.

The function previously called a custom update config function made for merging an Astro config. Now it calls the appropriate `mergeConfig()` utility exported by Vite that updates functional options correctly.
