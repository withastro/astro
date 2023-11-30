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

### `imageService`

`imageService: "passthrough" | "cloudflare"`

Determines which image service is used by the adapter. The adapter will default to `passthrough` mode when an incompatible image service is configured. Otherwise, it will use the globally configured image service:

- **`cloudflare`:** Uses the [Cloudflare Image Resizing](https://developers.cloudflare.com/images/image-resizing/) service.
- **`passthrough`:** Uses the existing [`noop`](https://docs.astro.build/en/guides/images/#configure-no-op-passthrough-service) service.

### `wasmModuleImports`

`wasmModuleImports: boolean`

default: `false`

Whether or not to import `.wasm` files [directly as ES modules](https://github.com/WebAssembly/esm-integration/tree/main/proposals/esm-integration) using the `.wasm?module` import syntax.

Add `wasmModuleImports: true` to `astro.config.mjs` to enable this functionality in both the Cloudflare build and the Astro dev server. Read more about [using Wasm modules](#use-wasm-modules).

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

See Cloudflare's repository for more type information about [CF_BINDING](https://github.com/cloudflare/workers-sdk/blob/eaa16db25103d26ef31499634a31b86caccdf7aa/packages/wrangler/src/api/startDevWorker/types.ts#L190-L219)

`runtime: { mode: 'off' } | { mode: 'local'; type: 'pages'; persistTo?: string; bindings?: Record<string, CF_BINDING> } | { mode: 'local'; type: 'workers'; persistTo?: string; };`

default `{ mode: 'off', persistTo: '' }`

Determines whether and how the Cloudflare Runtime is added to `astro dev`.
Read more about [the Cloudflare Runtime](#cloudflare-runtime).

The `type` property defines where your Astro project is deployed to:

- `pages`: Deployed to [Cloudflare Pages](https://pages.cloudflare.com/)
- `workers`: Deployed to [Cloudflare Workers](https://workers.cloudflare.com/)

The `mode` property defines what you want the runtime to support in `astro dev`:

- `off`: no access to the runtime using `astro dev`. You can choose [Preview with Wrangler](#preview-with-wrangler) when you need access to the runtime, to simulate the production environment locally.
- `local`: uses a local runtime powered by miniflare and workerd, which supports Cloudflare's Bindings. Only if you want to use unsupported features, such as `eval`, bindings with no local support choose [Preview with Wrangler](#preview-with-wrangler)

In `mode: local`, you have access to the `persistTo` property which defines where the local bindings state is saved. This avoids fresh bindings on every restart of the dev server. This value is a directory relative to your `astro dev` execution path. By default it is set to `.wrangler/state/v3` to allow usage of `wrangler` cli commands (e.g. for migrations). Add this path to your `.gitignore`.

## Cloudflare runtime

The Cloudflare runtime gives you access to environment variables and Cloudflare bindings. You can find more information in Cloudflare's [Workers](https://developers.cloudflare.com/workers/configuration/bindings/) and [Pages](https://developers.cloudflare.com/pages/platform/functions/bindings/) docs. Depending on your deployment type (`pages` or `workers`), you need to configure the bindings differently.

Currently supported bindings:

- Environment Variables
- [Cloudflare Workers KV](https://developers.cloudflare.com/kv/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)

### Config

#### Cloudflare Pages

Cloudflare Pages does not support a configuration file.

To deploy your pages project to production, you need to configure the bindings using Cloudflare's Dashboard. To be able to access bindings locally, you need to configure them using the adpater's `runtime` option.

```diff lang="js"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
+   runtime: {
+     mode: 'local',
+     type: 'pages',
+     bindings: {
        // example of a var binding (environment variable)
+       "URL": {
+         type: "var",
+         value: "https://example.com",
+       },
        // example of a KV binding
+       "KV": {
+         type: "kv",
+       },
        // example of a D1 binding
+       "D1": {
+         type: "d1",
+       },
        // example of a R2 binding
+       "R2": {
+         type: "r2",
+       },
        // example of a Durable Object binding
+       "DO": {
+         type: "durable-object",
+         className: "DO",
+       },
+     },
+   },
  }),
});
```

If you also need to define `secrets` in addition to enviroment variables, you need to add a `.dev.vars` file to the root of the Astro project:

```
# .dev.vars
DB_PASSWORD=myPassword
```

If you want to use `wrangler` for cli commands, e.g. D1 migrations, you also need to add a `wrangler.toml` to the root of the Astro project with the correct content. Consult [Cloudflare's documentation](https://developers.cloudflare.com/) for further details.

```toml
# wrangler.toml
name = "example"
compatibility_date = "2023-06-14"

# example for D1 Binding
[[d1_databases]]
binding = "D1"
database_name = "D1"
database_id = "D1"
preview_database_id = "D1"
```

#### Cloudflare Workers

To deploy your workers project to production, you need to configure the bindings using a `wrangler.toml` config file in the root directory of your Astro project. To be able to access bindings locally, the `@astrojs/cloudflare` adapter will also read the `wrangler.toml` file.

```toml
# wrangler.toml
name = "example"

# example of a KV Binding
kv_namespaces = [
    { binding = "KV", id = "KV", preview_id = "KV" },
]

# example of a var binding (environment variables)
[vars]
URL = "example.com"

# example of a D1 Binding
[[d1_databases]]
binding = "D1"
database_name = "D1"
database_id = "D1"
preview_database_id = "D1"

# example of a R2 Binding
[[r2_buckets]]
binding = 'R2'
bucket_name = 'R2'

# example of a Durable Object Binding
[[durable_objects.bindings]]
name = "DO"
class_name = "DO"
```

If you also need to define `secrets` in addition to enviroment variables, you need to add a `.dev.vars` file to the root of the Astro project:

```
# .dev.vars
DB_PASSWORD=myPassword
```

### Usage

You can access the runtime from Astro components through `Astro.locals` inside any `.astro` file.

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
