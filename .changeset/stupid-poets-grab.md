---
'@astrojs/markdoc': minor
---

Adds an "allowHTML" Markdoc integration option.

When enabled, all Markdoc markup is processed via the htmlparser2 library to detect
HTML elements and creating a modified set of markdown-it tokens which seamlessly interleave
HTML markup elements with any Markdoc tags and nodes.

This is a potential XSS vector as HTML in Markdoc markup will be rendered as real HTML nodes
once this is enabled (it should be noted this is already the case for Markdoc and MDX integrations
as-is, by default.)

Example of enabling this feature:

```js
export default defineConfig({
	integrations: [markdoc({ allowHTML: true })],
});
```
