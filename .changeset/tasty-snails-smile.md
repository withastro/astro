---
'astro': patch
---

Adds missing "rendered" property to experimental live collections entry type

Live collections support a "rendered" property that allows you to provide pre-rendered HTML for each entry. While this property was documented and implemented, it was missing from the TypeScript types, which could lead to type errors when trying to use it in a TypeScript project. This patch adds the "rendered" property to the live collections entry type definition, as well as adding tests for the feature to ensure it works as expected.
