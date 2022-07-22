---
'astro': minor
'@astrojs/markdown-component': minor
'@astrojs/markdown-remark': minor
---

The use of components and JSX expressions in Markdown are no longer supported by default.

For long term support, migrate to the `@astrojs/mdx` integration for MDX support (including `.mdx` pages!).

Not ready to migrate to MDX? Add the legacy flag to your Astro config to re-enable the previous Markdown support.

```js
// https://astro.build/config
export default defineConfig({
	legacy: {
		astroFlavoredMarkdown: true,
	}
});
```
