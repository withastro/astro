---
'astro-vscode': patch
---

Fixes syntax highlighting for `<style>` blocks containing CSS `@property` at-rules. Previously, using `@property` would break syntax highlighting for the closing `</style>` tag and all subsequent `<style>` and `<script>` blocks in the file. The style injection patterns now use the same robust `while`-based approach already used by script injection patterns, ensuring that `</style>` is always detected regardless of the embedded CSS grammar's internal state.
