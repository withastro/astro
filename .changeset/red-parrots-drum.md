---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Updates the default `subsets` to `["latin"]`

Subsets have been a common source of confusion: they caused a lot of files to be downloaded by default. You now have to manually pick extra subsets.

Review your Astro config and update subsets if you need, for example if you need greek characters:

```diff
import { defineConfig, fontProviders } from "astro/config"

export default defineConfig({
    experimental: {
        fonts: [{
            name: "Roboto",
            cssVariable: "--font-roboto",
            provider: fontProviders.google(),
+            subsets: ["latin", "greek"]
        }]
    }
})
```