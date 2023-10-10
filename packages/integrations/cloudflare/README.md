# @astrojs/cloudflare

An SSR adapter for use with Cloudflare Pages Functions targets. Write your code in Astro/Javascript and deploy to Cloudflare Pages.

## Install

Add the Cloudflare adapter to enable SSR in your Astro project with the following `astro add` command. This will install the adapter and make the appropriate changes to your `astro.config.mjs` file in one step.

```sh
# Using NPM
npx astro add cloudflare
# Using Yarn
yarn astro add cloudflare
# Using PNPM
pnpm astro add cloudflare
```

If you prefer to install the adapter manually instead, complete the following two steps:

1. Add the Cloudflare adapter to your project's dependencies using your preferred package manager. If you’re using npm or aren’t sure, run this in the terminal:

```bash
npm install @astrojs/cloudflare
```

2. Add the following to your `astro.config.mjs` file:

```diff lang="js"
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
+ import cloudflare from '@astrojs/cloudflare';

  export default defineConfig({
+   output: 'server',
+   adapter: cloudflare(),
  });
```

## Options

### `mode`

`mode: "advanced" | "directory"`

default `"advanced"`

This configuration option defines how your Astro project is deployed to Cloudflare Pages.

- `advanced` mode picks up the `_worker.js` file in the `dist` folder
- `directory` mode picks up the files in the `functions` folder, by default only one `[[path]].js` file is generated

Switching to directory mode allows you to add additional files manually such as [Cloudflare Pages Plugins](https://developers.cloudflare.com/pages/platform/functions/plugins/), [Cloudflare Pages Middleware](https://developers.cloudflare.com/pages/platform/functions/middleware/) or custom functions using [Cloudflare Pages Functions Routing](https://developers.cloudflare.com/pages/platform/functions/routing/).

```js
// astro.config.mjs
export default defineConfig({
  adapter: cloudflare({ mode: 'directory' }),
});
```

To compile a separate bundle for each page, set the `functionPerRoute` option in your Cloudflare adapter config. This option requires some manual maintenance of the `functions` folder. Files emitted by Astro will overwrite existing files with identical names in the `functions` folder, so you must choose unique file names for each file you manually add. Additionally, the adapter will never empty the `functions` folder of outdated files, so you must clean up the folder manually when you remove pages.

```diff lang="js"
  // astro.config.mjs
  import {defineConfig} from "astro/config";
  import cloudflare from '@astrojs/cloudflare';

  export default defineConfig({
    adapter: cloudflare({
      mode: 'directory',
+     functionPerRoute: true
    })
  })
```

This adapter doesn't support the [`edgeMiddleware`](https://docs.astro.build/en/reference/adapter-reference/#edgemiddleware) option.

### `routes.strategy`

`routes.strategy: "auto" | "include" | "exclude"`

default `"auto"`

Determines how `routes.json` will be generated if no [custom `_routes.json`](#custom-_routesjson) is provided.

There are three options available:

- **`"auto"` (default):** Will automatically select the strategy that generates the fewest entries. This should almost always be sufficient, so choose this option unless you have a specific reason not to.

- **`include`:** Pages and endpoints that are not pre-rendered are listed as `include` entries, telling Cloudflare to invoke these routes as functions. `exclude` entries are only used to resolve conflicts. Usually the best strategy when your website has mostly static pages and only a few dynamic pages or endpoints.

  Example: For `src/pages/index.astro` (static), `src/pages/company.astro` (static), `src/pages/users/faq.astro` (static) and `/src/pages/users/[id].astro` (SSR) this will produce the following `_routes.json`:

  ```json
  {
    "version": 1,
    "include": [
      "/_image", // Astro's image endpoint
      "/users/*" // Dynamic route
    ],
    "exclude": [
      // Static routes that needs to be exempted from the dynamic wildcard route above
      "/users/faq/",
      "/users/faq/index.html"
    ]
  }
  ```

- **`exclude`:** Pre-rendered pages are listed as `exclude` entries (telling Cloudflare to handle these routes as static assets). Usually the best strategy when your website has mostly dynamic pages or endpoints and only a few static pages.

  Example: For the same pages as in the previous example this will produce the following `_routes.json`:

  ```json
  {
    "version": 1,
    "include": [
      "/*" // Handle everything as function except the routes below
    ],
    "exclude": [
      // All static assets
      "/",
      "/company/",
      "/index.html",
      "/users/faq/",
      "/favicon.png",
      "/company/index.html",
      "/users/faq/index.html"
    ]
  }
  ```

### `routes.include`

`routes.include: string[]`

default `[]`

If you want to use the automatic `_routes.json` generation, but want to include additional routes (e.g. when having custom functions in the `functions` folder), you can use the `routes.include` option to add additional routes to the `include` array.

### `routes.exclude`

`routes.exclude: string[]`

default `[]`

If you want to use the automatic `_routes.json` generation, but want to exclude additional routes, you can use the `routes.exclude` option to add additional routes to the `exclude` array.

The following example automatically generates `_routes.json` while including and excluding additional routes. Note that that is only necessary if you have custom functions in the `functions` folder that are not handled by Astro.

```diff lang="js"
  // astro.config.mjs
  export default defineConfig({
    adapter: cloudflare({
      mode: 'directory',
+     routes: {
+       strategy: 'include',
+       include: ['/users/*'], // handled by custom function: functions/users/[id].js
+       exclude: ['/users/faq'], // handled by static page: pages/users/faq.astro
+     },
    }),
  });
```

### `wasmModuleImports`

`wasmModuleImports: boolean`

default: `false`

Whether or not to import `.wasm` files [directly as ES modules](https://github.com/WebAssembly/esm-integration/tree/main/proposals/esm-integration) using the `.wasm?module` import syntax.

Add `wasmModuleImports: true` to `astro.config.mjs` to enable this functionality in both the Cloudflare build and the Astro dev server. Read more about [using Wasm modules](#use-wasm-modules)

```diff lang="js"
// astro.config.mjs
import {defineConfig} from "astro/config";
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    adapter: cloudflare({
+      wasmModuleImports: true
    }),
    output: 'server'
})
```

### `runtime`

`runtime: "off" | "local"`

default `"off"`

Determines whether and how the Cloudflare Runtime is added to `astro dev`.

The Cloudflare Runtime includes [Cloudflare bindings](https://developers.cloudflare.com/pages/platform/functions/bindings), [environment variables](https://developers.cloudflare.com/pages/platform/functions/bindings/#environment-variables), and the [cf object](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties). Read more about [accessing the Cloudflare Runtime](#cloudflare-runtime).

- `local`: uses bindings mocking and locally static placeholders
- `off`: no access to the Cloudflare runtime using `astro dev`. You can alternatively use [Preview with Wrangler](#preview-with-wrangler)

```diff lang="js"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
+   runtime: 'local',
  }),
});
```

## Cloudflare runtime

Gives you access to [environment variables](https://developers.cloudflare.com/pages/platform/functions/bindings/#environment-variables), and [Cloudflare bindings](https://developers.cloudflare.com/pages/platform/functions/bindings).

Currently supported bindings:

- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Workers KV](https://developers.cloudflare.com/kv/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)

You can access the runtime from Astro components through `Astro.locals` inside any .astro` file.

```astro
---
// src/pages/index.astro
const runtime = Astro.locals.runtime;
---

<pre>{JSON.stringify(runtime.env)}</pre>
```

You can access the runtime from API endpoints through `context.locals`:

```js
// src/pages/api/someFile.js
export function GET(context) {
  const runtime = context.locals.runtime;

  return new Response('Some body');
}
```

### Typing

If you have configured `mode: advanced`, you can type the `runtime` object using `AdvancedRuntime`:

```ts
// src/env.d.ts
/// <reference types="astro/client" />

type KVNamespace = import('@cloudflare/workers-types/experimental').KVNamespace;
type ENV = {
  SERVER_URL: string;
  KV_BINDING: KVNamespace;
};

type Runtime = import('@astrojs/cloudflare').AdvancedRuntime<ENV>;

declare namespace App {
  interface Locals extends Runtime {
    user: {
      name: string;
      surname: string;
    };
  }
}
```

If you have configured `mode: directory`, you can type the `runtime` object using `DirectoryRuntime`:

```ts
// src/env.d.ts
/// <reference types="astro/client" />

type KVNamespace = import('@cloudflare/workers-types/experimental').KVNamespace;
type ENV = {
  SERVER_URL: string;
  KV_BINDING: KVNamespace;
};

type Runtime = import('@astrojs/cloudflare').DirectoryRuntime<ENV>;

declare namespace App {
  interface Locals extends Runtime {
    user: {
      name: string;
      surname: string;
    };
  }
}
```

## Platform

### Headers

You can attach [custom headers](https://developers.cloudflare.com/pages/platform/headers/) to your responses by adding a `_headers` file in your Astro project's `public/` folder. This file will be copied to your build output directory.

### Redirects

You can declare [custom redirects](https://developers.cloudflare.com/pages/platform/redirects/) using Cloudflare Pages. This allows you to redirect requests to a different URL. You can add a `_redirects` file in your Astro project's `public/` folder. This file will be copied to your build output directory.

### Routes

You can define which routes are invoking functions and which are static assets, using [Cloudflare routing](https://developers.cloudflare.com/pages/platform/functions/routing/#functions-invocation-routes) via a `_routes.json` file. This file is automatically generated by Astro.

#### Custom `_routes.json`

By default, `@astrojs/cloudflare` will generate a `_routes.json` file with `include` and `exclude` rules based on your applications's dynamic and static routes.
This will enable Cloudflare to serve files and process static redirects without a function invocation. Creating a custom `_routes.json` will override this automatic optimization. See [Cloudflare's documentation on creating a custom `routes.json`](https://developers.cloudflare.com/pages/platform/functions/routing/#create-a-_routesjson-file) for more details.

## Use Wasm modules

The following is an example of importing a Wasm module that then responds to requests by adding the request's number parameters together.

```js
// pages/add/[a]/[b].js
import mod from '../util/add.wasm?module';

// instantiate ahead of time to share module
const addModule: any = new WebAssembly.Instance(mod);

export async function GET(context) {
  const a = Number.parseInt(context.params.a);
  const b = Number.parseInt(context.params.b);
  return new Response(`${addModule.exports.add(a, b)}`);
}
```

While this example is trivial, Wasm can be used to accelerate computationally intensive operations which do not involve significant I/O such as embedding an image processing library.

## Node.js compatibility

Astro's Cloudflare adapter allows you to use any Node.js runtime API supported by Cloudflare:

- assert
- AsyncLocalStorage
- Buffer
- Crypto
- Diagnostics Channel
- EventEmitter
- path
- process
- Streams
- StringDecoder
- util

To use these APIs, your page or endpoint must be server-side rendered (not pre-rendered) and must use the the `import {} from 'node:*'` import syntax.

```js
// pages/api/endpoint.js
export const prerender = false;
import { Buffer } from 'node:buffer';
```

Additionally, you'll need to enable the Compatibility Flag in Cloudflare. The configuration for this flag may vary based on where you deploy your Astro site. For detailed guidance, please refer to the [Cloudflare documentation on enabling Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs).

## Cloudflare module support

All Cloudflare namespaced packages (e.g. `cloudflare:sockets`) are allowlisted for use. Note that the package `cloudflare:sockets` does not work locally without using Wrangler dev mode.

## Preview with Wrangler

To use [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) to run your application locally, update the preview script:

```json
//package.json
"preview": "wrangler pages dev ./dist"
```

[`wrangler`](https://developers.cloudflare.com/workers/wrangler/) gives you access to [Cloudflare bindings](https://developers.cloudflare.com/pages/platform/functions/bindings), [environment variables](https://developers.cloudflare.com/pages/platform/functions/bindings/#environment-variables), and the [cf object](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties). Getting hot reloading or the astro dev server to work with Wrangler might require custom setup. See [community examples](https://github.com/withastro/roadmap/discussions/590).

### Meaningful error messages

Currently, errors during running your application in Wrangler are not very useful, due to the minification of your code. For better debugging, you can add `vite.build.minify = false` setting to your `astro.config.mjs`.

```diff lang="js"
  // astro.config.mjs
  export default defineConfig({
    adapter: cloudflare(),
    output: 'server',

+   vite: {
+     build: {
+       minify: false,
+     },
+   },
  });
```

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
