---
'astro': major
---

The adapter API now offers a simpler signature for rendering. The `render()` method on App now accepts an `options` object.

```diff
- app.render(request, undefined, locals)
+ app.render(request, { locals })
```
The current signature is deprecated but will continue to function until next major version.
