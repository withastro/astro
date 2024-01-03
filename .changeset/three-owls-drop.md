---
"astro": minor
---

Adds the ability to set a [`rootMargin`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin) setting when using the `client:visible` directive. This allows a component to be hydrated when it is _near_ the viewport, rather than hydrated when it has _entered_ the viewport.

```astro
<!-- Load component when it's within 200px away from entering the viewport -->
<Component client:visible={{ rootMargin: "200px" }} />
```
