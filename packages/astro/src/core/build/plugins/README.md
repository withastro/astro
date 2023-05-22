# Plugin directory (WIP)

This file serves as developer documentation to explain how the internal plugins work


## `plugin-middleware`

This plugin is responsible to retrieve the `src/middleware.{ts.js}` file and emit an entry point during the SSR build.

The final file is emitted only if the user has the middleware file. The final name of  the file is `middleware.mjs`.

The file emitted has this content, more or less:

```js
import { onRequest } from "@astro-middleware";
export { onRequest }
```

## `plugin-renderers`

This plugin is responsible to collect all the renderers inside an Astro application and emit them in a single file.

The emitted file is called `renderers.mjs`.

The emitted file has content similar to:

```js
const renderers = [Object.assign({"name":"astro:jsx","serverEntrypoint":"astro/jsx/server.js","jsxImportSource":"astro"}, { ssr: server_default }),];

export { renderers };
```

## `plugin-pages`