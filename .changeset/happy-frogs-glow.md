---
'@astrojs/markdown-remark': major
'astro': major
---

The styles that belong to code blocks, emitted via markdown code block or `Code.astro` component, are now hoisted to the head of the file in a `style` tag, instead of using inline styles. This refactor allows to support CSP out of the box when `security.csp` is enabled.
