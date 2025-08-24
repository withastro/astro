1. Pick a project:

- Example: https://github.com/withastro/astro/tree/fryuni/tracing-hooks/examples/with-telemetry
- New project
- Existing project

2. Use this version of Astro: https://pkg.pr.new/withastro/astro@fc5a126
3. Add this integration: https://pkg.pr.new/withastro/astro/@astrojs/opentelemetry@fc5a126
4. Add the integration to `astro.config.mjs/ts`:

```ts
import node from '@astrojs/node';
import opentelemetry from '@astrojs/opentelemetry';
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  integrations: [opentelemetry()],
});
```

5. Start this docker compose: https://github.com/withastro/astro/blob/fryuni/tracing-hooks/examples/with-telemetry/docker-compose.yml

   Or run `otel-tui`, if you have that installed.

6. Have fun!

## See the data

Traces will be available on http://localhost:16686/

Metrics will be availabe on http://localhost:9090/query

Logs will be shown on the console

## New APIs:

```ts
import tracer from 'astro:otel:tracer';
import meter from 'astro:otel:meter';
import logger from 'astro:otel:logger';
```
