---
'@astrojs/svelte': patch
---

Adjusted the generated Svelte editor wrapper to avoid intersecting with the original `$$Component` type and instead use an explicit wrapper type with distinct Astro prop and Svelte internals call signatures. The change preserves generic inference by using `GenericPropsWithClientDirectives` for generic components, restores invalid prop errors in astro check, and maintains compatibility with `@testing-library/svelte`.
