---
'astro': major
---

The previously experimental features `--experimental-error-overlay` and `--experimental-prerender`, both added in v1.7.0, are now the default.

You'll notice that the error overlay during `astro dev` has a refreshed visual design and provides more context for your errors.

The `prerender` feature is now enabled by default when using `output: 'server'`. To prerender a particular page, add `export const prerender = true` to your frontmatter.

> **Warning**
> Integration authors that previously relied on the exact structure of Astro's v1.0 build output may notice some changes to our output file structure. Please test your integrations to ensure compatability.
> Users that have configured a custom `vite.build.rollupOptions.output.chunkFileNames` should ensure that their Astro project is configured as an ESM Node project. Either include `"type": "module"` in your root `package.json` file or use the `.mjs` extension for `chunkFileNames`.
