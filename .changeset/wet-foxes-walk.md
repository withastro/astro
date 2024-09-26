---
'astro': major
---

`Astro.params` aren't decoded anymore. 

### [changed]: `Astro.params` aren't decoded anymore.
In Astro v4.x, `Astro.params` were decoded using `decodeURIComponent`. 

Astro v5.0 doesn't decode `Astro.params` anymore, so you'll need to manually decode them yourself.

#### What should I do?
If you were relying on `Astro.params` being decoded for you, you'll need to manually decode it using `decodeURI`.

The use of [`decodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)) is discouraged because it decodes more characters than it should, for example `/`, `?`, `#` and more.

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
