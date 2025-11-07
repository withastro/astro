---
'astro': major
---

Removes the `handleForms` prop for the `<ClientRouter />` component - ([v6 upgrade guidance](https://deploy-preview-12322--astro-docs-2.netlify.app/en/guides/upgrade-to/v6/#removed-handleforms-prop-for-the-clientrouter--component))
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
