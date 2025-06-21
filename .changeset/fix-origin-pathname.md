---
'astro': patch
---

Fix `Astro.originPathname` so it honours `trailingSlash` + `build.format`.

When using `Astro.rewrite()`, the `originPathname` now correctly respects the `trailingSlash` configuration:
- `trailingSlash: "always"` - always appends trailing slash
- `trailingSlash: "never"` - always removes trailing slash  
- `trailingSlash: "ignore"` - defers to `build.format` (directory = slash, file = no slash)

Closes #13860