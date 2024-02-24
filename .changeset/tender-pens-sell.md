---
"astro": minor
---

Adds a 2 news option to the Integrations API `astro:config:setup` hook: `codegenDir` and `injectDts`. 

Integrations authors can now interact with the `.astro` directory more easily! Its path is now available as `codegenDir` (of type `URL`) inside of `astro:config:setup`:

```ts
import type { AstroIntegration } from "astro"

export function integration(): AstroIntegration {
    return {
        name: "my-integration",
        hooks: {
            "astro:config:setup": ({ codegenDir }) => {
                const filePath = new URL("./data.json", codegenDir)
            }
        }
    }
}
```

The `.astro` directory is now created before any integration runs so you don't have to anymore!

To make things even easier, a new utility is now available in `astro:config:setup` as well: `injectDts`! It allows you to add `.d.ts` files inside your users project and it will be automatically included.

```ts
import type { AstroIntegration } from "astro"

export function integration({ param }: { param: string }): AstroIntegration {
    return {
        name: "my-integration",
        hooks: {
            "astro:config:setup": ({ injectDts }) => {
                injectDts({
                    name: "my-integration.d.ts",
                    content: `declare module "virtual:my-integration/config" {
                        export const param: string;
                    }`
                })
            }
        }
    }
}
```