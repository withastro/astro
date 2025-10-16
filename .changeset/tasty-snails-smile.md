---
'astro': patch
---

Adds missing `rendered` property to experimental live collections entry type

Live collections support a `rendered` property that allows you to provide pre-rendered HTML for each entry. While this property was documented and implemented, it was missing from the TypeScript types. This could lead to type errors when trying to use it in a TypeScript project.

No changes to your project code are necessary. You can continue to use the `rendered` property as before, and it will no longer produce TypeScript errors.
