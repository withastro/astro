---
'astro': minor
---

Astro integrations now accept a logger. The logger is available to all hooks as 
an additional parameter:

```js
// integration.js
export function myIntegration(): AstroIntegration {
    return {
        name: "my-integration",
        hooks: {
            "astro:config:done": (options, { logger }) => {
                logger.info("Configure integration...");
            }
        }
    }
}
```
