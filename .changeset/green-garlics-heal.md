---
'astro': major
---

Deprecates `import.meta.env.ASSETS_PREFIX`

In Astro 5.x, it was possible to access `build.assetsPrefix` in your Astro config via the built-in environment variable `import.meta.env.ASSETS_PREFIX`. However, Astro v5.7.0 introduced the `astro:config` virtual model to expose a non-exhaustive, serializable, type-safe version of the Astro configuration which included access to `build.assetsPrefix` directly. This became the preferred way to access the prefix for Astro-generated asset links when set, although the environment variable still existed.

Astro 6.0 deprecates this variable in favor of `build.assetsPrefix` from the `astro:config/server` module.

#### What should I do?

Replace any occurances of `import.meta.env.ASSETS_PREFIX` with the `build.assetsPrefix` import from `astro:config/server`. This is a drop-in replacement to provide the existing value, and no other changes to your code should be necessary:

```diff
import { someLogic } from "./utils"
+import { build } from "astro:config/server"

-someLogic(import.meta.env.ASSETS_PREFIX)
+someLogic(build.assetsPrefix)
```
