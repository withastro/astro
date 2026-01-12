---
'astro': patch
---

Adds Google Icons to built-in font providers

To start using it, access it on `fontProviders`:

```ts
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
    experimental: {
        fonts: [{
            name: "Material Symbols Outlined",
            provider: fontProviders.googleicons(),
            cssVariable: "--font-material"
        }]
    }
})
```