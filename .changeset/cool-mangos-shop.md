---
'astro': major
---

The locals object can no longer be overridden

Middleware, API endpoints, and pages can no longer override the `locals` object in its entirety. You can still append locals onto the object, but you can not replace the entire object, wiping out old values.

If you were previously overwriting like so:

```js
ctx.locals = {
  one: 1,
  two: 2
}
```

This can be changed to an assignment on the existing object instead:

```js
Object.assign(ctx.locals, {
  one: 1,
  two: 2
})
```
