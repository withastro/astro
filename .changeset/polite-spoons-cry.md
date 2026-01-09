---
'astro': minor
---

Improves `APIContext`, `astro:config/server` and `astro:config/client` types

Before Astro types would always account for the fact that you may not be using a given feature. For example if you enabled sessions in your Astro config, you'd still have to check for access at runtime.

```ts
// Notice the question mark
context.session?.set()
```

Now Astro generates higher fidelity types during sync, making your life easier:

```diff
-context.session?.set()
+context.session.set()
```
