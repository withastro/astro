---
'astro': minor
---

Adds an experimental flag `staticImportMetaEnv` to disable the replacement of `import.meta.env` values with `process.env` calls and their coercion of environment variable values. This supersedes the `rawEnvValues` experimental flag, which is now removed.

Astro allows you to configure a [type-safe schema for your environment variables](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables), and converts variables imported via `astro:env` into the expected type. This is the recommended way to use environment variables in Astro, as it allows you to easily see and manage whether your variables are public or secret, available on the client or only on the server at build time, and the data type of your values.

However, you can still access environment variables through `process.env` and `import.meta.env` directly when needed. This was the only way to use environment variables in Astro before `astro:env` was added in Astro 5.0, and Astro's default handling of `import.meta.env` includes some logic that was only needed for earlier versions of Astro.

The `experimental.staticImportMetaEnv` flag updates the behavior of `import.meta.env` to align with [Vite's handling of environment variables](https://vite.dev/guide/env-and-mode.html#env-variables) and for better ease of use with Astro's current implementations and features. **This will become the default behavior in Astro 6.0**, and this early preview is introduced as an experimental feature.

Currently, non-public `import.meta.env` environment variables are replaced by a reference to `process.env`. Additionally, Astro may also convert the value type of your environment variables used through `import.meta.env`, which can prevent access to some values such as the strings `"true"` (which is converted to a boolean value), and `"1"` (which is converted to a number).

The `experimental.staticImportMetaEnv` flag simplifies Astro's default behavior, making it easier to understand and use. Astro will no longer replace any `import.meta.env` environment variables with a `process.env` call, nor will it coerce values.

To enable this feature, add the experimental flag in your Astro config and remove `rawEnvValues` if it was enabled:

```diff
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
+  experimental: {
+    staticImportMetaEnv: true
-    rawEnvValues: false   
+  }
});
```

#### Updating your project

If you were relying on Astro's default coercion, you may need to update your project code to apply it manually:

```diff
// src/components/MyComponent.astro
- const enabled: boolean = import.meta.env.ENABLED;
+ const enabled: boolean = import.meta.env.ENABLED === "true";
```

If you were relying on the transformation into `process.env` calls, you may need to update your project code to apply it manually:

```diff
// src/components/MyComponent.astro
- const enabled: boolean = import.meta.env.DB_PASSWORD;
+ const enabled: boolean = process.env.DB_PASSWORD;
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

+ namespace NodeJS {
+  interface ProcessEnv {
+    DB_PASSWORD: string;
+  }
+ }
```

See the [experimental static `import.meta.env` documentation](https://docs.astro.build/en/reference/experimental-flags/static-import-meta-env/) for more information about this feature. You can learn more about using environment variables in Astro, including `astro:env`, in the [environment variables documentation](https://docs.astro.build/en/guides/environment-variables/).
