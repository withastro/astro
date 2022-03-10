---
'astro': patch
---

Update `Astro.slots` API with new public `has` and `render` methods. 

This is a backwards-compatible change—`Astro.slots.default` will still be `true` if the component has been passed a `default` slot.

```ts
if (Astro.slots.has("default")) {
  const content = await Astro.slots.render("default");
}
```
