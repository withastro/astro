---
'astro': major
---

### [changed]: `RouteData.distURL` is now an array
In Astro v4.x, `RouteData.distURL` was `undefined` or a `URL`

Astro v5.0, `RouteData.distURL` is `undefined` or an array of `URL`. This was a bug, because a route can generate multiple files on disk, especially when using dynamic routes such as `[slug]` or `[...slug]`.

#### What should I do?
Update your code to handle `RouteData.distURL` as an array.

```diff
if (route.distURL) {
-  if (route.distURL.endsWith('index.html')) {
-    // do something
-  }
+  for (const url of route.distURL) {
+    if (url.endsWith('index.html')) {
+      // do something
+    }
+  }
}
```
