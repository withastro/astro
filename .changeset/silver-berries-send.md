---
'astro': minor
---

Adds a new experimental logger, which allows to provide better controls over Astro's logging infrastructure.

#### JSON logging

JSON logging can be enabled via CLI or via configuration:

```shell
astro dev --experimentalJson
astro build --experimentalJson
astro sync --experimentalJson
```

```js
// astro.config.mjs
import { defineConfig, logHandlers } from "astro/config";

export default defineConfig({
  experimental: {
    logger: logHandlers.json({
      pretty: true,
      level: 'warn'
    }) 
  }
})
```

#### Custom logger

You can also create your own custom logger by implementing the correct interface:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
    logger: {
      entrypoint: "@org/custom-logger"
    }
  }
})
```

```ts
// @org/custom-logger.js
import type { AstroLoggerDestination, AstroLoggerMessage } from "astro"

const customLogger: AstroLoggerDestination = {
  write(message: AstroLoggerMessage) {
    // write message somewhere
  }
} 
export default customLogger
```
