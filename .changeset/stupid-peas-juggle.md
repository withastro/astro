---
'astro': minor
---

Extends the `client:visible` directive by adding an optional `rootMargin` property. This allows a component to be hydrated when it is close to the viewport instead of waiting for it to become visible.

```html
<!-- Load component when it's within 200px away from entering the viewport -->
<Component client:visible="200px" />
```
