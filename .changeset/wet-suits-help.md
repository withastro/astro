---
'astro': major
---

Updates `import.meta.env` values to always be inlined

In Astro 5.13, the `experimental.staticImportMetaEnv` was introduced to update the behavior when accessing `import.meta.env` directly to align with [Vite's handling of environment variables](https://vite.dev/guide/env-and-mode.html#env-variables) and ensures that `import.meta.env` values are always inlined.

In Astro 5.x, non-public environment variables were replaced by a reference to `process.env`. Additionally, Astro could also convert the value type of your environment variables used through `import.meta.env`, which could prevent access to some values such as the strings `"true"` (which was converted to a boolean value), and `"1"` (which was converted to a number).

Astro 6 removes this experimental flag and makes this the new default behavior in Astro: `import.meta.env` values are always inlined and never coerced.

#### What should I do?

If you were previously using this experimental feature, you must remove this experimental flag from your configuration as it no longer exists:

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
-    staticImportMetaEnv: true,
  },
})
```

If you were relying on coercion, you may need to update your project code to apply it manually:

```diff
// src/components/MyComponent.astro
-const enabled: boolean = import.meta.env.ENABLED;
+const enabled: boolean = import.meta.env.ENABLED === "true";
```

If you were relying on the transformation into `process.env`, you may need to update your project code to apply it manually:

```diff
// src/components/MyComponent.astro
-const enabled: boolean = import.meta.env.DB_PASSWORD;
+const enabled: boolean = process.env.DB_PASSWORD;
```

You may also need to update types:

```diff
// src/env.d.ts
interface ImportMetaEnv {
  readonly PUBLIC_POKEAPI: string;
-  readonly DB_PASSWORD: string;
-  readonly ENABLED: boolean;
+  readonly ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

+namespace NodeJS {
+  interface ProcessEnv {
+    DB_PASSWORD: string;
+  }
+}
```

If you need more control over environment variables in Astro, we recommend you use `astro:env`.
