---
'astro': minor
---

The virtual module `astro:config` introduced behind a flag in [v5.2.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#520) is no longer experimental and is available for general use.

This virtual module exposes two sub-paths for type-safe, controlled access to your configuration:

- `astro:config/client`: exposes config information that is safe to expose to the client.
- `astro:config/server`: exposes additional information that is safe to expose to the server, such as file and directory paths.

Access these in any file inside your project to import and use select values from your Astro config:

  ```js
  // src/utils.js
  import { trailingSlash } from 'astro:config/client';

  function addForwardSlash(path) {
    if (trailingSlash === 'always') {
      return path.endsWith('/') ? path : path + '/';
    } else {
      return path;
    }
  }
  ```

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
// astro.config.mjs
export default defineConfig({
-  experimental: {
-    serializeConfig: true
-  }
})
```

If you have been waiting for feature stabilization before using configuration imports, you can now do so.

Please see [the `astro:config` reference](https://docs.astro.build/en/my-feature/) for more about this feature.
