---
'astro': patch
---

Fixes head metadata propagation in dev for adapters that load modules in the `prerender` Vite environment, such as `@astrojs/cloudflare`. The `astro:head-metadata` plugin previously only tracked the `ssr` environment, so `maybeRenderHead()` could fire inside an unrelated component's `<template>` element, trapping subsequent hoisted `<style>` blocks.
