---
'astro': minor
---

Adds experimental support for configurable log handlers.

This experimental feature provides better control over Astro's logging infrastructure by allowing users to replace the default console output with custom logging implementations (e.g., structured JSON). This is particularly useful for users using on-demand rendering and wishing to connect their log aggregation services, such as Kibana, Logstash, CloudWatch, Grafana, or Loki.

By default, Astro provides three built-in log handlers (`json`, `node`, and `console`), but you can also create your own.

#### JSON logging

JSON logging can be enabled via the CLI for the `build`, `dev`, and `sync` commands using the `experimentalJson` flag:


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
});
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
});
```

```ts
// @org/custom-logger.js
import type { AstroLoggerDestination, AstroLoggerMessage } from "astro";
import { matchesLevel } from "astor/logger";

function customLogger(level = 'info'): AstroLoggerDestination {
  return {
    write(message: AstroLoggerMessage) {
      if (matchesLevel(message.level, level)) {
        // write message somewhere
      }
    }
  }
}

export default customLogger;
```

For more information on enabling and using this feature in your project, see the [Experimental Logger docs](https://docs.astro.build/en/reference/experimental-flags/logger/).

For a complete overview and to give feedback on this experimental API, see the [Custom logger RFC](https://github.com/withastro/roadmap/blob/logger/proposals/0059-custom-logger.md).
