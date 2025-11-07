---
'astro': major
---

Removes the `handleForms` prop for the `<ClientRouter />` component - ([v6 upgrade guidance](https://deploy-preview-12322--astro-docs-2.netlify.app/en/guides/upgrade-to/v6/#removed-handleforms-prop-for-the-clientrouter--component))
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
