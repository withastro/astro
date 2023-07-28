---
'astro': minor
---

Integrations can now log messages using Astro’s built-in logger.

The logger is available to all hooks as an additional parameter:

```ts
import {AstroIntegration} from "./astro";

// integration.js
export function myIntegration(): AstroIntegration {
    return {
        name: "my-integration",
        hooks: {
            "astro:config:done": ({ logger }) => {
                logger.info("Configure integration...");
            }
        }
    }
}
```
