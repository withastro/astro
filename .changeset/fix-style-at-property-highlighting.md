---
'astro-vscode': patch
---

Fixes syntax highlighting breaking when using CSS `@property` at-rules inside `<style>` blocks. The `</style>` closing tag and all subsequent blocks are now correctly recognized regardless of CSS content.
