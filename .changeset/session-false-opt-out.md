---
'astro': minor
---

Adds `session: false` in `astro.config` to opt out of session support. Projects that do not set `session: false` see no behavior change.

```js title="astro.config.mjs"
import { defineConfig } from 'astro/config';

export default defineConfig({
  session: false,
});
```

The session runtime and dependencies (`unstorage`) are now tree-shaken out of the SSR bundle for any project where no session driver is wired via:

* `session: false`
* no `session` config at all
* a `session` config without a driver

Useful for serverless/edge runtimes where cold-start parse time is sensitive.
