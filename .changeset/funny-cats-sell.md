---
'@astrojs/underscore-redirects': patch
---

Adds support for forced redirects

Redirects can be forced by setting `force` to `true`:

```ts
redirects.add({
    // ...
    force: true
})
```

It will append a `!` after the status.