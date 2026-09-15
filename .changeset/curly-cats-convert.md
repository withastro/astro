---
'@astrojs/language-server': minor
'astro-vscode': minor
---

Improves type checking and editor support for `.astro` files with the dedicated Astro-to-TSX converter

The language server now uses `@astrojs/astro2tsx` to generate virtual TypeScript for Astro components. This removes duplicate compiler work and provides more precise generated types, including generic component props that were previously weakened during conversion.

Recoverable Astro syntax errors now preserve the generated virtual file, allowing TypeScript diagnostics and editor features to continue working alongside parser diagnostics instead of being disabled for the entire document.
