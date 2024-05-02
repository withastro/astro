---
"astro": minor
"@astrojs/db": minor
---

Adds a new `defineIntegration` helper and reworks typings for integrations authors extending Astro DB.

This release adds a new `defineIntegration` helper through the `astro/integration` import that allows to define a type-safe integration and handle options validation (not required):

```ts
import { defineIntegration } from "astro/integration"
import { z } from "astro/zod"

export const integration = defineIntegration({
    name: "my-integration",
    // optional
    optionsSchema: z.object({ id: z.string() }),
    setup({ options }) {
        return {
            hooks: {
                "astro:config:setup": (params) => {
                    // ...
                }
            }
        }
    }
})
```

Astro DB `defineDbIntegration` has been removed in favor of a way that works with this new `defineIntegration` (but also the `AstroIntegration` type):

```ts
import {} from "astro"
import { defineIntegration } from "astro/integration"
import type { AstroDbHooks } from "@astrojs/db/types"

declare module "astro" {
	interface AstroIntegrationHooks extends AstroDbHooks {}
}

export default defineIntegration({
	name: "db-test-integration",
	setup() {
		return {
					hooks: {
			'astro:db:setup': ({ extendDb }) => {
				extendDb({
					configEntrypoint: './integration/config.ts',
					seedEntrypoint: './integration/seed.ts',
				});
			},
		},
		}
	}
})

```