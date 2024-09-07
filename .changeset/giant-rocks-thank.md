---
'astro': major
---

Merges the `output: 'hybrid'` and `output: 'static'` option. It is no longer necessary to specify `output: 'hybrid'` in your Astro config to use server rendered pages. Astro will now automatically determine if the build output should be static or hybrid based on the presence of server-rendered pages in your project.

If your project used hybrid rendering, you can now remove the `output: 'hybrid'` option from your Astro config. If you were using the `output: 'static'` option, you can continue to use it as before.

```diff
import { defineConfig } from "astro/config";

export default defineConfig({
-  output: 'hybrid',
});
```

An adapter is still required to deploy an Astro project with server-rendered pages, failure to include an adapter will result in a warning in development and an error at build time.
