---
'astro': minor
---

Adds `session: false` in `astro.config` to opt out of session support. When set, Astro skips bundling the session runtime into the SSR output, adapters skip wiring their default session driver, and reading `Astro.session` (or `context.session`) throws a `SessionDisabledError` with a clear hint instead of being `undefined`. Useful for serverless/edge runtimes where cold-start parse time is sensitive.

```js title="astro.config.mjs"
import { defineConfig } from 'astro/config';

export default defineConfig({
  session: false,
});
```

Projects that do not set `session: false` see no behavior change.
