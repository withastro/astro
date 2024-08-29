---
"astro": minor
---

The Astro Actions API introduced behind a flag in [v4.8.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#480) is no longer experimental and is available for general use.

Astro Actions allow you to define and call backend functions with type-safety, performing data fetching, JSON parsing, and input validation for you.

Actions can be called from client-side components and HTML forms. This gives you to flexibility to build apps using any technology: React, Svelte, HTMX, or just plain Astro components. This example calls a newsletter action and renders the result using an Astro component:

```astro
---
// src/pages/newsletter.astro
import { actions } from 'astro:actions';
const result = Astro.getActionResult(actions.newsletter);
---
{result && !result.error && <p>Thanks for signing up!</p>}
<form method="POST" action={actions.newsletter}>
  <input type="email" name="email" />
  <button>Sign up</button>
</form>
```

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
import { defineConfig } from 'astro'

export default defineConfig({
-  experimental: {
-    actions: true,
-  }
})
```

If you have been waiting for stabilization before using Actions, you can now do so.

For more information and usage examples, see our [brand new Actions guide](https://docs.astro.build/en/guides/actions).
