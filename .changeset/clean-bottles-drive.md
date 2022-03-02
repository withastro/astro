---
'astro': minor
---

Update `Astro.slots` API with new public `has` and `render` methods.

```ts
if (Astro.slots.has("default")) {
  const content = await Astro.slots.render("default");
}
```
