---
'astro': major
---

Removes the deprecated `<ViewTransitions />` component

In Astro 5.0, the `<ViewTransitions />` component was renamed to `<ClientRouter />` to clarify the role of the component. The new name makes it more clear that the features you get from Astro's `<ClientRouter />` routing component are slightly different from the native CSS-based MPA router. However, a deprecated version of the `<ViewTransitions />` component still existed and may have functioned in Astro 5.x.
	
Astro 6.0 removes the `<ViewTransitions />` component entirely and can no longer be used in your project. Update to the `<ClientRouter />` component to continue to use these features.

#### What should I do?

Replace all occurrences of the `ViewTransitions` import and component with `ClientRouter`:

```diff
// src/layouts/MyLayout.astro"
- import { ViewTransitions } from 'astro:transitions';
+ import { ClientRouter } from 'astro:transitions';
<html>
  <head>
    ...
-    <ViewTransitions />
+    <ClientRouter />
  </head>
</html>
```
