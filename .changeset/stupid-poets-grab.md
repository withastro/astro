---
'@astrojs/markdoc': patch
---

Adds an "allowHTML" Markdoc integration option.

When enabled, all HTML in Markdoc files will be processed, including HTML elements within Markdoc tags and nodes.

Enable this feature in the `markdoc` integration configuration:

```js
// astro.config.mjs
export default defineConfig({
	integrations: [markdoc({ allowHTML: true })],
});
```
