---
'astro': patch
---

Allows experimental Font providers to specify family options

Previously, an Astro `FontProvider` could only accept options at the provider level when called. That could result in weird data structures for family specific options.

Astro `FontProvider`s can now declare family specific options, by specifying a generic:

```diff
// font-provider.ts
import type { FontProvider } from "astro";
import { retrieveFonts, type Fonts } from "./utils.js",

interface Config {
  token: string;
}

+interface FamilyOptions {
+    minimal?: boolean;
+}

-export function registryFontProvider(config: Config): FontProvider {
+export function registryFontProvider(config: Config): FontProvider<FamilyOptions> {
  let data: Fonts = {}

  return {
    name: "registry",
    config,
    init: async () => {
      data = await retrieveFonts(token);
    },
    listFonts: () => {
      return Object.keys(data);
    },
-    resolveFont: ({ familyName, ...rest }) => {
+    // options is typed as FamilyOptions
+    resolveFont: ({ familyName, options, ...rest }) => {
      const fonts = data[familyName];
      if (fonts) {
        return { fonts };
      }
      return undefined;
    },
  };
}
```

Once the font provider is registered in the Astro config, types are automatically inferred:

```diff
// astro.config.ts
import { defineConfig } from "astro/config";
import { registryFontProvider } from "./font-provider";

export default defineConfig({
    experimental: {
        fonts: [{
            provider: registryFontProvider({
              token: "..."
            }),
            name: "Custom",
            cssVariable: "--font-custom",
+            options: {
+                minimal: true
+            }
        }]
    }
});
```
