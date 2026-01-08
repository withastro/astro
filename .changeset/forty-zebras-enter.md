---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Changes the `FontProvider` type, which makes it incompatible with `unifont`

Previously, an Astro `FontProvider` was made of a config and a runtime part.

It is now only made of a config part with dedicated hooks, making it incompatible with `unifont` types.

#### What should I do?

If you were using a 3rd-party `unifont` font provider, you will now need to write an Astro `FontProvider` using it under the hood. For example:

```diff
// astro.config.ts
import { defineConfig } from "astro/config";
-import { providers } from "unifont";
+import type { FontProvider } from "astro";
+import { type GoogleiconsOptions, type InitializedProvider, providers } from 'unifont';

+function googleicons(config?: GoogleiconsOptions): FontProvider {
+	const provider = providers.googleicons(config);
+	let initializedProvider: InitializedProvider | undefined;
+	return {
+		name: provider._name,
+		config,
+		async init(context) {
+			initializedProvider = await provider(context);
+		},
+		async resolveFont({ familyName, ...rest }) {
+			return await initializedProvider?.resolveFont(familyName, rest);
+		},
+		async listFonts() {
+			return await initializedProvider?.listFonts?.();
+		},
+	};
+}

export default defineConfig({
    experimental: {
        fonts: [{
-            provider: providers.googleicons({ /* ... */ }),
+            provider: googleicons({ /* ... */ }),
            name: "Material Symbols Outlined",
            cssVariable: "--font-material"
        }]
    }
});
```
