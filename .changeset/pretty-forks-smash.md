---
'astro': major
---

Removes the `handleForms` prop for the `<ClientRouter />` component

In Astro 4.0, the `handleForms` prop of the `<ClientRouter />` component was deprecated, as it was no longer necessary to opt in to handling `submit` events for `form` elements. This functionality has been built in by default and the property, if still included in your project, silently had no impact on form submission.

Astro 6.0 removes this prop entirely and it now must be removed to avoid errors in your project.

#### What should I do?

Remove the `handleForms` property from your `<ClientRouter />` component if it exists. It has provided no additional functionality, and so removing it should not change any behavior in your project:

```diff
---
// title="src/pages/index.astro
import { ClientRouter } from "astro:transitions";
---
<html>
  <head>
-    <ClientRouter handleForms />
+    <ClientRouter />
  </head>
  <body>
    <!-- stuff here -->
  </body>
</html>
```
