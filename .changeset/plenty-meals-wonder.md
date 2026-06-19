---
'astro': minor
---

The custom logger feature introduced behind a flag in [v6.2.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#620) is no longer experimental and is available for general use.

This feature provides better control over Astro's logging infrastructure by allowing you to replace the default console output with custom logging implementations (e.g., structured JSON). This is particularly useful for on-demand rendering when connecting to log aggregation services such as Kibana, Logstash, CloudWatch, Grafana, or Loki.

Astro provides three built-in log handlers (`json`, `node`, and `console`), and you can also create your own.

#### JSON logging

```js
import { defineConfig, logHandlers } from 'astro/config';

export default defineConfig({
  logger: logHandlers.json({
    pretty: true,
    level: 'warn',
  }),
});
```

#### Custom logger

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  logger: {
    entrypoint: '@org/custom-logger',
  },
});
```

Additionally, `context.logger` is now always available in API routes and middleware, even without a custom logger configured.

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
-  experimental: {
-    logger: {
-      entrypoint: '@org/custom-logger',
-    },
-  },
+  logger: {
+    entrypoint: '@org/custom-logger',
+  },
});
```

If you have been waiting for stabilization before using custom loggers, you can now do so.

Please see the [Logger docs](https://docs.astro.build/en/reference/configuration-reference/#logger) for more about this feature.
