---
'astro': major
---

Merges the `output: 'hybrid'` and `output: 'static'` configurations into one single configuration (now called `'static'`) that works the same way as the previous `hybrid` option.

It is no longer necessary to specify `output: 'hybrid'` in your Astro config to use server-rendered pages. The new `output: 'static'` has this capability included. Astro will now automatically provide the ability to opt out of prerendering in your static site with no change to your `output` configuration required. Any page route or endpoint can include `export const prerender = false` to be server-rendered, while the rest of your site is statically-generated.

If your project used hybrid rendering, you must now remove the `output: 'hybrid'` option from your Astro config as it no longer exists. However, no other changes to your project are required, and you should have no breaking changes. The previous `'hybrid'` behavior is now the default, under a new name `'static'`.

If you were using the `output: 'static'` (default) option, you can continue to use it as before. By default, all of your pages will continue to be prerendered and you will have a completely static site. You should have no breaking changes to your project.

```diff
import { defineConfig } from "astro/config";

export default defineConfig({
-  output: 'hybrid',
});
```

An adapter is still required to deploy an Astro project with any server-rendered pages. Failure to include an adapter will result in a warning in development and an error at build time.
