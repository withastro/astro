---
'@astrojs/markdown-remark': major
---

Renames the following CSS variables theme color token names to better align with the Shiki v1 defaults:

- `--astro-code-color-text` => `--astro-code-foreground`
- `--astro-code-color-background` => `--astro-code-background`

You can perform a global find and replace in your project to migrate to the new token names.
