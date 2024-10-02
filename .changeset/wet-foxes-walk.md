---
'astro': major
---

`params` passed in `getStaticPaths` are no longer automatically decoded.

### [changed]: `params` aren't decoded anymore.
In Astro v4.x, `params` in were automatically decoded using `decodeURIComponent`. 

Astro v5.0 doesn't automatically decode `params` in `getStaticPaths` anymore, so you'll need to manually decode them yourself if needed

#### What should I do?
If you were relying on the automatic decode, you'll need to manually decode it using `decodeURI`.

Note that the use of [`decodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)) is discouraged for `getStaticPaths` because it decodes more characters than it should, for example `/`, `?`, `#` and more.

```diff
---
export function getStaticPaths() {
  return [
+    { params: { id: decodeURI("%5Bpage%5D") } },
-    { params: { id: "%5Bpage%5D" } },
  ]
}

const { id } = Astro.params;
---
```
