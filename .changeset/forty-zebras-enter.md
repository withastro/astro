---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Changes how font providers are implemented with updates to the `FontProvider` type

This is an implementation detail that changes how font providers are created. This process allows Astro to take more control rather than relying directly on `unifont` types. **All of Astro's built-in font providers have been updated to reflect this new type, and can be configured as before**. However, using third-party unifont providers that rely on `unifont` types will require an update to your project code.

Previously, an Astro `FontProvider` was made of a config and a runtime part. It relied directly on `unifont` types, which allowed a simple configuration for third-party unifont providers, but also coupled Astro's implementation to unifont, which was limiting.

Astro's font provider implementation is now only made of a config part with dedicated hooks. This allows for the separation of config and runtime, but requires you to create a font provider object in order to use custom font providers (e.g. third-party unifont providers, or private font registeries).

#### What should I do?

If you were using a 3rd-party `unifont` font provider, you will now need to write an Astro `FontProvider` using it under the hood. For example:

```diff
// astro.config.ts
import { defineConfig } from "astro/config";
import { acmeProvider, type AcmeOptions } from '@acme/unifont-provider'
+import type { FontProvider } from "astro";
+import type { InitializedProvider } from 'unifont';

+function acme(config?: AcmeOptions): FontProvider {
+	const provider = acmeProvider(config);
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
-            provider: acmeProvider({ /* ... */ }),
+            provider: acme({ /* ... */ }),
            name: "Material Symbols Outlined",
            cssVariable: "--font-material"
        }]
    }
});
```
