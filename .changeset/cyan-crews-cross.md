---
'astro': major
---

Removes the old `app.render()` signature (Adapter API)

In Astro 4.0, the `app.render()` signature that allowed passing `routeData` and `locals` as optional arguments was deprecated in favor of a single optional `renderOptions` argument.

Astro 6.0 removes this signature entirely. Attempting to pass these separate arguments will now cause an error in your project.

#### What should I do?

Review your `app.render` calls and pass `routeData` and `locals` as properties of an object instead of as multiple independent arguments:

```diff
// my-adapter/entrypoint.ts
-app.render(request, routeData, locals)
+app.render(request, { routeData, locals })
```
