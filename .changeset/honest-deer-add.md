---
'astro': major
---

Changes the values allowed in `params` returned by `getStaticPaths()`.

In Astro 5.x, `getStaticPaths()` could return `params` of type number, which would always be stringified by Astro. However, that could be confusing because it conflicted with `Astro.params` types.

Astro 6.0 removes this behavior: `getStaticPaths()` must now return string or undefined `params` values.

#### What should I do?

Review your dynamic routes using `getStaticPaths()` and convert any number params to strings.

For more guidance, see [the v6 upgrade guide entry for this breaking change](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-getstaticpaths-cannot-return-params-of-type-number).
