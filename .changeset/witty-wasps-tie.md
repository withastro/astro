---
'astro': patch
---

Improved the error message when a redirect can't be mapped to its destination. For example, the following redirect
will throw a new error because `/category/[categories]/` contains one dynamic segment, while `/category/[categories]/[page]` has two dynamic segments,
and Astro doesn't know how map the parameters:

```js
export default defineConfig({
  "/category/[categories]": "/category/[categories]/[page]"
})
```
