# @astrojs/cloudflare

## 12.6.10

### Patch Changes

- [`b8ca69b`](https://github.com/withastro/astro/commit/b8ca69b97149becefaf89bf21853de9c905cdbb7) Thanks [@ascorbic](https://github.com/ascorbic)! - Refactor remote path detection

- Updated dependencies [[`b8ca69b`](https://github.com/withastro/astro/commit/b8ca69b97149becefaf89bf21853de9c905cdbb7)]:
  - @astrojs/internal-helpers@0.7.4
  - @astrojs/underscore-redirects@1.0.0

## 12.6.9

### Patch Changes

- Updated dependencies [[`1e2499e`](https://github.com/withastro/astro/commit/1e2499e8ea83ebfa233a18a7499e1ccf169e56f4)]:
  - @astrojs/internal-helpers@0.7.3
  - @astrojs/underscore-redirects@1.0.0

## 12.6.8

### Patch Changes

- [#14326](https://github.com/withastro/astro/pull/14326) [`c24a8f4`](https://github.com/withastro/astro/commit/c24a8f42a17410ea78fc2d68ff0105b931a381eb) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Updates `vite` version to fix CVE

- Updated dependencies []:
  - @astrojs/underscore-redirects@1.0.0

## 12.6.7

### Patch Changes

- [#14281](https://github.com/withastro/astro/pull/14281) [`dfd88de`](https://github.com/withastro/astro/commit/dfd88de3ca9a6cda75b05534b0f78dab0227abe7) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a regression that broke sites that used the compile image service without nodejs_compat set

- Updated dependencies []:
  - @astrojs/underscore-redirects@1.0.0

## 12.6.6

### Patch Changes

- [`9ecf359`](https://github.com/withastro/astro/commit/9ecf3598e2b29dd74614328fde3047ea90e67252) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Improves the image proxy endpoint when using the default compile option to adhere to user configuration regarding the allowed remote domains

- Updated dependencies []:
  - @astrojs/underscore-redirects@1.0.0

## 12.6.5

### Patch Changes

- [#14259](https://github.com/withastro/astro/pull/14259) [`02366e9`](https://github.com/withastro/astro/commit/02366e9ce38df8e7362817c095ff05ae61dc7b56) Thanks [@ascorbic](https://github.com/ascorbic)! - Removes warning when using the adapter with a static build.

  The Cloudflare adapter now has several uses outside of on-demand rendered pages, so this warning is misleading. Similar warnings have already been removed from other adapters.

- [#14234](https://github.com/withastro/astro/pull/14234) [`15b55f3`](https://github.com/withastro/astro/commit/15b55f34cb84ecfb99d2e76918a567a00bbb13f6) Thanks [@yanthomasdev](https://github.com/yanthomasdev)! - Fixes an issue that could cause duplicate exports when configuring `workerEntrypoint.namedExports`

- [#14240](https://github.com/withastro/astro/pull/14240) [`77b18fb`](https://github.com/withastro/astro/commit/77b18fb1f85cf1a0c8842bb6e32fd16a9198b974) Thanks [@delucis](https://github.com/delucis)! - Increases the minimum supported version of Astro to 5.7.0

- Updated dependencies []:
  - @astrojs/underscore-redirects@1.0.0

## 12.6.4

### Patch Changes

- Updated dependencies [[`4d16de7`](https://github.com/withastro/astro/commit/4d16de7f95db5d1ec1ce88610d2a95e606e83820)]:
  - @astrojs/internal-helpers@0.7.2
  - @astrojs/underscore-redirects@1.0.0

## 12.6.3

### Patch Changes

- [#14066](https://github.com/withastro/astro/pull/14066) [`7abde79`](https://github.com/withastro/astro/commit/7abde7921fb21058d99180d6a0c897c5fa23ff14) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Refactors the internal solution which powers Astro Sessions when running local development with ˋastro devˋ.

  The adapter now utilizes Cloudflare's local support for Cloudflare KV. This internal change is a drop-in replacement and does not require any change to your projectct code.

  However, you now have the ability to connect to the remote Cloudflare KV Namespace if desired and use production data during local development.

- Updated dependencies []:
  - @astrojs/underscore-redirects@1.0.0

## 12.6.2

### Patch Changes

- [#13894](https://github.com/withastro/astro/pull/13894) [`b36e72f`](https://github.com/withastro/astro/commit/b36e72f11fbcc0f3d5826f2b1939084f1fb1e3a8) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes special handling of the `ASTRO_STUDIO_APP_TOKEN` environment variable

- Updated dependencies [[`0567fb7`](https://github.com/withastro/astro/commit/0567fb7b50c0c452be387dd7c7264b96bedab48f)]:
  - @astrojs/internal-helpers@0.7.1
  - @astrojs/underscore-redirects@1.0.0

## 12.6.1

### Patch Changes

- Updated dependencies [[`f4e8889`](https://github.com/withastro/astro/commit/f4e8889c10c25aeb7650b389c35a70780d5ed172)]:
  - @astrojs/internal-helpers@0.7.0
  - @astrojs/underscore-redirects@1.0.0

## 12.6.0

### Minor Changes

- [#13837](https://github.com/withastro/astro/pull/13837) [`7cef86f`](https://github.com/withastro/astro/commit/7cef86f9e31c9207620df74a72bfe96db8fa457a) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Adds new configuration options to allow you to set a custom `workerEntryPoint` for Cloudflare Workers. This is useful if you want to use features that require handlers (e.g. Durable Objects, Cloudflare Queues, Scheduled Invocations) not supported by the basic generic entry file.

  This feature is not supported when running the Astro dev server. However, you can run `astro build` followed by either `wrangler deploy` (to deploy it) or `wrangler dev` to preview it.

  The following example configures a custom entry file that registers a Durable Object and a queue handler:

  ```ts
  // astro.config.ts
  import cloudflare from '@astrojs/cloudflare';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    adapter: cloudflare({
      workerEntryPoint: {
        path: 'src/worker.ts',
        namedExports: ['MyDurableObject'],
      },
    }),
  });
  ```

  ```ts
  // src/worker.ts
  import type { SSRManifest } from 'astro';

  import { App } from 'astro/app';
  import { handle } from '@astrojs/cloudflare/handler';
  import { DurableObject } from 'cloudflare:workers';

  class MyDurableObject extends DurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
      super(ctx, env);
    }
  }

  export function createExports(manifest: SSRManifest) {
    const app = new App(manifest);
    return {
      default: {
        async fetch(request, env, ctx) {
          await env.MY_QUEUE.send('log');
          return handle(manifest, app, request, env, ctx);
        },
        async queue(batch, _env) {
          let messages = JSON.stringify(batch.messages);
          console.log(`consumed from our queue: ${messages}`);
        },
      } satisfies ExportedHandler<Env>,
      MyDurableObject,
    };
  }
  ```

### Patch Changes

- [#13963](https://github.com/withastro/astro/pull/13963) [`c667c55`](https://github.com/withastro/astro/commit/c667c554726102620e0115612a6347ddc0183d08) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where the platform proxy would not be disposed when the dev process ended

- Updated dependencies []:
  - @astrojs/underscore-redirects@1.0.0

## 12.5.5

### Patch Changes

- [#13930](https://github.com/withastro/astro/pull/13930) [`acb9b30`](https://github.com/withastro/astro/commit/acb9b302f56e38833a1ab01147f7fde0bf967889) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an issue where setting values for `Astro.response` resulted in a Cloudflare runtime exception.

- Updated dependencies [[`de82ef2`](https://github.com/withastro/astro/commit/de82ef24540752f1a838b6b0534d80c7cebd88a3), [`de82ef2`](https://github.com/withastro/astro/commit/de82ef24540752f1a838b6b0534d80c7cebd88a3), [`de82ef2`](https://github.com/withastro/astro/commit/de82ef24540752f1a838b6b0534d80c7cebd88a3)]:
  - @astrojs/underscore-redirects@1.0.0

## 12.5.4

### Patch Changes

- [#13817](https://github.com/withastro/astro/pull/13817) [`b7258f1`](https://github.com/withastro/astro/commit/b7258f1243189218604346f5e0301dbdd363a57f) Thanks [@yanthomasdev](https://github.com/yanthomasdev)! - Clarifies and reduces a few logs when starting the dev server with `@astrojs/cloudflare`.

  Warnings about sharp support will now be suppressed when you have explicitly set an `imageService` option.

- Updated dependencies []:
  - @astrojs/underscore-redirects@0.6.1

## 12.5.3

### Patch Changes

- [#13792](https://github.com/withastro/astro/pull/13792) [`7910fea`](https://github.com/withastro/astro/commit/7910feaf4f9895b67ea9eb3242ba451928bd6cda) Thanks [@alexeyzimarev](https://github.com/alexeyzimarev)! - Unify imported images detection across adapters

- Updated dependencies []:
  - @astrojs/underscore-redirects@0.6.1

## 12.5.2

### Patch Changes

- [#13731](https://github.com/withastro/astro/pull/13731) [`c3e80c2`](https://github.com/withastro/astro/commit/c3e80c25b90c803e2798b752583a8e77cdad3146) Thanks [@jsparkdev](https://github.com/jsparkdev)! - update vite to latest version for fixing CVE

- Updated dependencies []:
  - @astrojs/underscore-redirects@0.6.1

## 12.5.1

### Patch Changes

- [#13591](https://github.com/withastro/astro/pull/13591) [`5dd2d3f`](https://github.com/withastro/astro/commit/5dd2d3fde8a138ed611dedf39ffa5dfeeed315f8) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes unused code

- Updated dependencies [[`5dd2d3f`](https://github.com/withastro/astro/commit/5dd2d3fde8a138ed611dedf39ffa5dfeeed315f8)]:
  - @astrojs/underscore-redirects@0.6.1

## 12.5.0

### Minor Changes

- [#13527](https://github.com/withastro/astro/pull/13527) [`2fd6a6b`](https://github.com/withastro/astro/commit/2fd6a6b7aa51a4713af7fac37d5dfd824543c1bc) Thanks [@ascorbic](https://github.com/ascorbic)! - The experimental session API introduced in Astro 5.1 is now stable and ready for production use.

  Sessions are used to store user state between requests for [on-demand rendered pages](https://astro.build/en/guides/on-demand-rendering/). You can use them to store user data, such as authentication tokens, shopping cart contents, or any other data that needs to persist across requests:

  ```astro
  ---
  export const prerender = false; // Not needed with 'server' output
  const cart = await Astro.session.get('cart');
  ---

  <a href="/checkout">🛒 {cart?.length ?? 0} items</a>
  ```

  #### Configuring session storage

  Sessions require a storage driver to store the data. The Node, Cloudflare and Netlify adapters automatically configure a default driver for you, but other adapters currently require you to specify a custom storage driver in your configuration.

  If you are using an adapter that doesn't have a default driver, or if you want to choose a different driver, you can configure it using the `session` configuration option:

  ```js
  import { defineConfig } from 'astro/config';
  import vercel from '@astrojs/vercel';

  export default defineConfig({
    adapter: vercel(),
    session: {
      driver: 'upstash',
    },
  });
  ```

  #### Using sessions

  Sessions are available in on-demand rendered pages, API endpoints, actions and middleware.

  In pages and components, you can access the session using `Astro.session`:

  ```astro
  ---
  const cart = await Astro.session.get('cart');
  ---

  <a href="/checkout">🛒 {cart?.length ?? 0} items</a>
  ```

  In endpoints, actions, and middleware, you can access the session using `context.session`:

  ```js
  export async function GET(context) {
    const cart = await context.session.get('cart');
    return Response.json({ cart });
  }
  ```

  If you attempt to access the session when there is no storage driver configured, or in a prerendered page, the session object will be `undefined` and an error will be logged in the console:

  ```astro
  ---
  export const prerender = true;
  const cart = await Astro.session?.get('cart'); // Logs an error. Astro.session is undefined
  ---
  ```

  #### Upgrading from Experimental to Stable

  If you were previously using the experimental API, please remove the `experimental.session` flag from your configuration:

  ```diff
  import { defineConfig } from 'astro/config';
  import node from '@astrojs/node';

  export default defineConfig({
     adapter: node({
       mode: "standalone",
     }),
  -  experimental: {
  -    session: true,
  -  },
  });
  ```

  See [the sessions guide](https://docs.astro.build/en/guides/sessions/) for more information.

### Patch Changes

- Updated dependencies []:
  - @astrojs/underscore-redirects@0.6.0

## 12.4.1

### Patch Changes

- [#13596](https://github.com/withastro/astro/pull/13596) [`3752519`](https://github.com/withastro/astro/commit/375251966d1b28a570bff45ff0fe7e7d2fe46f72) Thanks [@jsparkdev](https://github.com/jsparkdev)! - update vite to latest version to fix CVE

- [#13547](https://github.com/withastro/astro/pull/13547) [`360cb91`](https://github.com/withastro/astro/commit/360cb9199a4314f90825c5639ff4396760e9cfcc) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Updates vite to the latest version

- Updated dependencies []:
  - @astrojs/underscore-redirects@0.6.0

## 12.4.0

### Minor Changes

- [#13514](https://github.com/withastro/astro/pull/13514) [`a9aafec`](https://github.com/withastro/astro/commit/a9aafec47a4d8a92c826663dca2f9850643651ec) Thanks [@ascorbic](https://github.com/ascorbic)! - Automatically configures Cloudflare KV storage when experimental sessions are enabled

  If the `experimental.session` flag is enabled when using the Cloudflare adapter, Astro will automatically configure the session storage using the Cloudflare KV driver. You can still manually configure the session storage if you need to use a different driver or want to customize the session storage configuration. If you want to use sessions, you will need to create the KV namespace and declare it in your wrangler config. You can do this using the Wrangler CLI:

  ```sh
  npx wrangler kv namespace create SESSION
  ```

  This will log the id of the created namespace. You can then add it to your `wrangler.json`/`wrangler.toml` file like this:

  ```jsonc
  // wrangler.json
  {
    "kv_namespaces": [
      {
        "binding": "SESSION",
        "id": "<your kv namespace id here>",
      },
    ],
  }
  ```

  By default it uses the binding name `SESSION`, but if you want to use a different binding name you can do so by passing the `sessionKVBindingName` option to the adapter. For example:

  ```js
  import { defineConfig } from 'astro/config';
  import cloudflare from '@astrojs/cloudflare';
  export default defineConfig({
    output: 'server',
    site: `http://example.com`,
    adapter: cloudflare({
      platformProxy: {
        enabled: true,
      },
      sessionKVBindingName: 'MY_SESSION',
    }),
    experimental: {
      session: true,
    },
  });
  ```

  See [the Cloudflare KV docs](https://developers.cloudflare.com/kv/concepts/kv-namespaces/) for more details on setting up KV namespaces.

  See [the experimental session docs](https://docs.astro.build/en/reference/experimental-flags/sessions/) for more information on configuring session storage.

### Patch Changes

- [#13526](https://github.com/withastro/astro/pull/13526) [`ff9d69e`](https://github.com/withastro/astro/commit/ff9d69e3443c80059c54f6296d19f66bb068ead3) Thanks [@jsparkdev](https://github.com/jsparkdev)! - update `vite` to the latest version

- Updated dependencies []:
  - @astrojs/underscore-redirects@0.6.0

## 12.3.1

### Patch Changes

- [#13505](https://github.com/withastro/astro/pull/13505) [`a98ae5b`](https://github.com/withastro/astro/commit/a98ae5b8f5c33900379012e9e253a755c0a8927e) Thanks [@ematipico](https://github.com/ematipico)! - Updates the dependency `vite` to the latest.

- Updated dependencies []:
  - @astrojs/underscore-redirects@0.6.0

## 12.3.0

### Minor Changes

- [#13444](https://github.com/withastro/astro/pull/13444) [`9721f4a`](https://github.com/withastro/astro/commit/9721f4a69f0fca389f146a5b8051cc17a34cdb0f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds global `astro:env` support

  Cloudflare workers [now support importing `env` in the global scope](https://developers.cloudflare.com/changelog/2025-03-17-importable-env/). Until now, calling `astro:env` APIs had to be done within request scope or the values were `undefined`.

  With this release, they can be called anywhere server-side, like any other official adapter.

### Patch Changes

- [#13463](https://github.com/withastro/astro/pull/13463) [`d5ad591`](https://github.com/withastro/astro/commit/d5ad591230918db302edc89c1a98436c16a4e0d2) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused builds to fail when a base directory is configured

- Updated dependencies []:
  - @astrojs/underscore-redirects@0.6.0

## 12.2.4

### Patch Changes

- Updated dependencies [[`042d1de`](https://github.com/withastro/astro/commit/042d1de901fd9aa66157ce078b28bcd9786e1373)]:
  - @astrojs/internal-helpers@0.6.1
  - @astrojs/underscore-redirects@0.6.0

## 12.2.3

### Patch Changes

- [#13323](https://github.com/withastro/astro/pull/13323) [`80926fa`](https://github.com/withastro/astro/commit/80926fadc06492fcae55f105582b9dc8279da6b3) Thanks [@ematipico](https://github.com/ematipico)! - Updates `esbuild` and `vite` to the latest to avoid false positives audits warnings caused by `esbuild`.

- Updated dependencies [[`1e11f5e`](https://github.com/withastro/astro/commit/1e11f5e8b722b179e382f3c792cd961b2b51f61b)]:
  - @astrojs/internal-helpers@0.6.0
  - @astrojs/underscore-redirects@0.6.0

## 12.2.2

### Patch Changes

- [#13304](https://github.com/withastro/astro/pull/13304) [`6efd57d`](https://github.com/withastro/astro/commit/6efd57d1747052e9a61d8867dd5941d0bf65ff22) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a small issue where the package was pulling an outdated version of its internal dependencies.

- [#13201](https://github.com/withastro/astro/pull/13201) [`065157c`](https://github.com/withastro/astro/commit/065157cac73e176cd6da9b8b0a157359a20ebebd) Thanks [@ekwoka](https://github.com/ekwoka)! - Includes onerror passthrough param for Cloudflare Image Service

- [#13299](https://github.com/withastro/astro/pull/13299) [`2e1321e`](https://github.com/withastro/astro/commit/2e1321e9d5b27da3e86bc4021e4136661a8055aa) Thanks [@bluwy](https://github.com/bluwy)! - Uses `tinyglobby` for globbing files

- Updated dependencies []:
  - @astrojs/underscore-redirects@0.6.0

## 12.2.1

### Patch Changes

- [#506](https://github.com/withastro/adapters/pull/506) [`ce66003`](https://github.com/withastro/adapters/commit/ce66003c093daa0e53a7ab1cf46ddd1d4ddcbee4) Thanks [@bluwy](https://github.com/bluwy)! - Removes internal `vue` handling

## 12.2.0

### Minor Changes

- [#496](https://github.com/withastro/adapters/pull/496) [`4b5cd22`](https://github.com/withastro/adapters/commit/4b5cd2268e8ed5e720772f50241b299762ea1eb8) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Stabilizes `astro:env` secrets support

### Patch Changes

- [#454](https://github.com/withastro/adapters/pull/454) [`83cedad`](https://github.com/withastro/adapters/commit/83cedad780bf7a23ae9f6ca0c44a7b7f1c1767e1) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Improves Astro 5 support

- [#501](https://github.com/withastro/adapters/pull/501) [`012b31d`](https://github.com/withastro/adapters/commit/012b31d98ce87c1199eb38b7aba2a28b7c1cf8cc) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Refactor of the redirects logic

## 12.1.0

### Minor Changes

- [#455](https://github.com/withastro/adapters/pull/455) [`1d4e6fc`](https://github.com/withastro/adapters/commit/1d4e6fca41b67277a21dcf2a42910e12206a0299) Thanks [@meyer](https://github.com/meyer)! - Adds `wrangler.jsonc` to the default watched config files. If a config file is specified in `platformProxy.configPath`, that file location is watched instead of the defaults.

### Patch Changes

- [#476](https://github.com/withastro/adapters/pull/476) [`a8a8ab1`](https://github.com/withastro/adapters/commit/a8a8ab12d9cfb5157e6a350b93a505010367b8e4) Thanks [@bluwy](https://github.com/bluwy)! - Removes resolving with "node" conditionto fix Vue imports

## 12.0.1

### Patch Changes

- [#465](https://github.com/withastro/adapters/pull/465) [`70e0054`](https://github.com/withastro/adapters/commit/70e0054aade5368f1bd9b1595766826af7e9ec8d) Thanks [@bluwy](https://github.com/bluwy)! - Fixes setting custom `workerd` and `worker` conditions for the ssr environment only

## 12.0.0

### Major Changes

- [#367](https://github.com/withastro/adapters/pull/367) [`e02b54a`](https://github.com/withastro/adapters/commit/e02b54ad864ea25cb972f6196496b5aee36a47a3) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removed support for the Squoosh image service. As the underlying library `libsquoosh` is no longer maintained, and the image service sees very little usage we have decided to remove it from Astro.

  Our recommendation is to use the base Sharp image service, which is more powerful, faster, and more actively maintained.

  ```diff
  - import { squooshImageService } from "astro/config";
  import { defineConfig } from "astro/config";

  export default defineConfig({
  -  image: {
  -    service: squooshImageService()
  -  }
  });
  ```

  If you are using this service, and cannot migrate to the base Sharp image service, a third-party extraction of the previous service is available here: https://github.com/Princesseuh/astro-image-service-squoosh

- [#367](https://github.com/withastro/adapters/pull/367) [`e02b54a`](https://github.com/withastro/adapters/commit/e02b54ad864ea25cb972f6196496b5aee36a47a3) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Deprecates the `functionPerRoute` option

  This option is now deprecated, and will be removed entirely in Astro v5.0. We suggest removing this option from your configuration as soon as you are able to:

  ```diff
  import { defineConfig } from 'astro/config';
  import vercel from '@astrojs/vercel/serverless';

  export default defineConfig({
    // ...
    output: 'server',
    adapter: vercel({
  -     functionPerRoute: true,
    }),
  });
  ```

- [#375](https://github.com/withastro/adapters/pull/375) [`e7881f7`](https://github.com/withastro/adapters/commit/e7881f7928c6ca62d43c763033f9ed065a907f3b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates internal code to works with Astro 5 changes to hybrid rendering. No changes are necessary to your project, apart from using Astro 5

- [#397](https://github.com/withastro/adapters/pull/397) [`776a266`](https://github.com/withastro/adapters/commit/776a26670cf483e37ec0e6eba27a0bde09db0146) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Welcome to the Astro 5 beta! This release has no changes from the latest alpha of this package, but it does bring us one step closer to the final, stable release.

  Starting from this release, no breaking changes will be introduced unless absolutely necessary.

  To learn how to upgrade, check out the [Astro v5.0 upgrade guide in our beta docs site](https://5-0-0-beta.docs.astro.build/en/guides/upgrade-to/v5/).

- [#451](https://github.com/withastro/adapters/pull/451) [`f248546`](https://github.com/withastro/adapters/commit/f24854669a2a3da79d8bf1e89b0b54063df0668c) Thanks [@ematipico](https://github.com/ematipico)! - Updates esbuild dependency to v0.24.0

- [#392](https://github.com/withastro/adapters/pull/392) [`3a49eb7`](https://github.com/withastro/adapters/commit/3a49eb7802c44212ccfab06034b7dc5f2b060e94) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates internal code for Astro 5 changes. No changes is required to your project, apart from using Astro 5

### Patch Changes

- [#431](https://github.com/withastro/adapters/pull/431) [`9cedc9b`](https://github.com/withastro/adapters/commit/9cedc9b23175e3b1d74f2d1d10410c2beac1b774) Thanks [@renovate](https://github.com/apps/renovate)! - Inherits `platformProxy` option types from `wrangler`

## 12.0.0-beta.1

### Major Changes

- [`f248546`](https://github.com/withastro/adapters/commit/f24854669a2a3da79d8bf1e89b0b54063df0668c) Thanks [@bluwy](https://github.com/bluwy)! - Updates esbuild dependency to v0.24.0

## 12.0.0-beta.0

### Major Changes

- [#367](https://github.com/withastro/adapters/pull/367) [`e02b54a`](https://github.com/withastro/adapters/commit/e02b54ad864ea25cb972f6196496b5aee36a47a3) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removed support for the Squoosh image service. As the underlying library `libsquoosh` is no longer maintained, and the image service sees very little usage we have decided to remove it from Astro.

  Our recommendation is to use the base Sharp image service, which is more powerful, faster, and more actively maintained.

  ```diff
  - import { squooshImageService } from "astro/config";
  import { defineConfig } from "astro/config";

  export default defineConfig({
  -  image: {
  -    service: squooshImageService()
  -  }
  });
  ```

  If you are using this service, and cannot migrate to the base Sharp image service, a third-party extraction of the previous service is available here: https://github.com/Princesseuh/astro-image-service-squoosh

- [#367](https://github.com/withastro/adapters/pull/367) [`e02b54a`](https://github.com/withastro/adapters/commit/e02b54ad864ea25cb972f6196496b5aee36a47a3) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Deprecates the `functionPerRoute` option

  This option is now deprecated, and will be removed entirely in Astro v5.0. We suggest removing this option from your configuration as soon as you are able to:

  ```diff
  import { defineConfig } from 'astro/config';
  import vercel from '@astrojs/vercel/serverless';

  export default defineConfig({
    // ...
    output: 'server',
    adapter: vercel({
  -     functionPerRoute: true,
    }),
  });
  ```

- [#375](https://github.com/withastro/adapters/pull/375) [`e7881f7`](https://github.com/withastro/adapters/commit/e7881f7928c6ca62d43c763033f9ed065a907f3b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates internal code to works with Astro 5 changes to hybrid rendering. No changes are necessary to your project, apart from using Astro 5

- [#397](https://github.com/withastro/adapters/pull/397) [`776a266`](https://github.com/withastro/adapters/commit/776a26670cf483e37ec0e6eba27a0bde09db0146) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Welcome to the Astro 5 beta! This release has no changes from the latest alpha of this package, but it does bring us one step closer to the final, stable release.

  Starting from this release, no breaking changes will be introduced unless absolutely necessary.

  To learn how to upgrade, check out the [Astro v5.0 upgrade guide in our beta docs site](https://5-0-0-beta.docs.astro.build/en/guides/upgrade-to/v5/).

- [#392](https://github.com/withastro/adapters/pull/392) [`3a49eb7`](https://github.com/withastro/adapters/commit/3a49eb7802c44212ccfab06034b7dc5f2b060e94) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates internal code for Astro 5 changes. No changes is required to your project, apart from using Astro 5

## 11.2.0

### Minor Changes

- [#423](https://github.com/withastro/adapters/pull/423) [`169ac24`](https://github.com/withastro/adapters/commit/169ac24451d8ac0e47dda27f7148d2ddad66e3dc) Thanks [@schummar](https://github.com/schummar)! - Changes the logic which generates the `_routes.json` file to improve generation for projects with many static pages, while still making sure all routes work as expected.

### Patch Changes

- [#409](https://github.com/withastro/adapters/pull/409) [`d63bed8`](https://github.com/withastro/adapters/commit/d63bed81afe549f98d705573d365de5204cab134) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an issue where `cloudflare:` scoped imports made the build fail. We externalize all imports with the `cloudflare:` scope by default now.

## 11.1.0

### Minor Changes

- [#394](https://github.com/withastro/adapters/pull/394) [`44dfa99`](https://github.com/withastro/adapters/commit/44dfa9935e22edab16490d625a88aaa0f1942a19) Thanks [@veitbjarsch](https://github.com/veitbjarsch)! - Added functionality to compare include and exclude rules to reduce the amount of cloudflare rules

## 11.0.5

### Patch Changes

- [#387](https://github.com/withastro/adapters/pull/387) [`04e5c38`](https://github.com/withastro/adapters/commit/04e5c389f251efa02fe7b973ed95cdc61fad3389) Thanks [@veitbjarsch](https://github.com/veitbjarsch)! - Fixes a bug which was caused on windows when splitting static file paths

## 11.0.4

### Patch Changes

- [#344](https://github.com/withastro/adapters/pull/344) [`8d7766e`](https://github.com/withastro/adapters/commit/8d7766ea89e7663f7de4edf7d0ee3e74b79e73af) Thanks [@Fryuni](https://github.com/Fryuni)! - Updates a dependency to align the peer dependency version for Astro

## 11.0.3

### Patch Changes

- [#341](https://github.com/withastro/adapters/pull/341) [`a430ab1`](https://github.com/withastro/adapters/commit/a430ab17e525492db2ff9ecc4d00eb710dd92874) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an issue if environment variables where used inside the middleware and a prerendering occured.

- [#335](https://github.com/withastro/adapters/pull/335) [`237f332`](https://github.com/withastro/adapters/commit/237f332a819a92cdc2128d1564f5b8558318ad2b) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an issue displaying images which are optimized during `astro build`

## 11.0.2

### Patch Changes

- [#340](https://github.com/withastro/adapters/pull/340) [`45d0abb`](https://github.com/withastro/adapters/commit/45d0abb52b8e940a7c702a148be779428836396c) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an issue if environment variables where used inside the middleware and a prerendering occured.

## 11.0.1

### Patch Changes

- [#302](https://github.com/withastro/adapters/pull/302) [`dc0039f`](https://github.com/withastro/adapters/commit/dc0039fa23de59c95f2943186b403c82eacf6f7a) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an issue where projects break when no `wrangler.toml` file was present

## 11.0.0

### Major Changes

- [#290](https://github.com/withastro/adapters/pull/290) [`1c4145e`](https://github.com/withastro/adapters/commit/1c4145e1f9a27b2eee1f17f0689bf29345ba2ca6) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Cloudflare v11

  ## Upgrades

  ### Supported Astro versions

  This release drops support for Astro versions `<= 4.10.2`. The new supported and required Astro versions are `>= 4.10.3`. This allowed us to remove additional workarounds related to projects with many prerendered pages. This should fix all bundling issues that are not caused by an upstream package.

  #### What should I do?

  If you still observe an issue, please check current open issues or create a new one in the repository.

  To upgrade an existing project, use the automated `@astrojs/upgrade` CLI tool. Alternatively, upgrade manually by running the upgrade command from your package manager:

  ```
  # Recommended:
  npx @astrojs/upgrade

  # Manual:
  npm install astro@latest
  pnpm upgrade astro --latest
  yarn upgrade astro --latest
  ```

  ## Changes

  ### `astro:env`

  This release adds experimental support for `astro:env`, which helps to streamline the usage of environment variables for Astro projects. You can read more about it in [Astro Docs](https://docs.astro.build/en/reference/configuration-reference/#experimentalenv). **IMPORTANT:** Cloudflare Bindings are not supported by `astro:env`, and still should be accessed by using `Astro.locals.runtime.env` or `context.locals.runtime.env`. `astro:env` supports environment variables only.

  #### What should I do?

  If you observe any issues, please check current open issues or create a new one in the repository.

  To add environment variables to your project, you still need to make sure they are available in three places. You're setup might require different steps to achieve this, so we can't give you a complete step-by-step guide, on how to achieve the requirements, but here are some guidance to get you started:
  - `process.env` during build in your node process (`astro build`)
  - `wrangler.toml` for local development (`astro dev`)
  - `Cloudflare Pages Dashboard` for production deployments

  Add "public" environment variables to your `wrangler.toml`. _(If you add `pages_build_output_dir = "./dist"` to your `wrangler.toml`, these will be synced to your Cloudflare Pages Dashboard, and you don't have to add them there manually)_:

  ```diff
  # wrangler.toml
  name = "test"

  +[vars]
  +API_URL = "https://google.de"
  +PORT = 4322

  # ...
  ```

  If you also need "secret" environment variables _(e.g. API Keys, etc.)_, you add them to your `.dev.vars` file. _(These won't be synced automatically, and you need to add them manually as encrypted variables to the Cloudflare Pages Dashboard or use `wrangler` CLI to push them)_:

  ```diff
  # .dev.vars
  + API_SECRET=123456789
  ```

  With your environment variables added to those two files and synced to the Cloudflare Pages Dashboard, you should be able to use them with `astro:env` when running `astro dev` & `astro build`, **but** you need to use Cloudflare's Build Pipeline and Cloudflare's GitHub App connection.

  However if you build your project locally or inside a custom GitHub Action and deploy with direct upload to Cloudflare, you need to ensure that the environment variables are also available for your build process. The simplest but not safest is to use your shell, e.g. `API_URL=https://google.de PORT=4322 API_SECRET=123456789 astro build`. For more complex setups, you should find out the way for your specific setup to provide environment variables to the build process.

  Additionally, you need to define your schema inside your `astro.config.mjs` file:

  ```diff
  import { defineConfig, envField } from "astro/config"

  export default defineConfig({
  +  experimental: {
  +    env: {
  +      schema: {
  +        API_URL: envField.string({ context: "client", access: "public", optional: true }),
  +        PORT: envField.number({ context: "server", access: "public", default: 4321 }),
  +        API_SECRET: envField.string({ context: "server", access: "secret" }),
  +      }
  +    }
  +  }
  })
  ```

  Finally, you should be able to access your environment variables in your Astro project, according to the [Astro Docs](https://docs.astro.build/en/reference/configuration-reference/#experimentalenv), e.g. `import { API_URL } from "astro:env/client"` or `import { PORT, API_SECRET } from "astro:env/server"`.

  **NOTE:** If you want to use environment variables in other files that are not `.astro` or `middleware` files, you still need to make sure you don't access the variable in a global scope. We recommend wrapping your logic with a function, which you then call from your `.astro` or `middleware` files inside the request scope.

  ```ts
  // foo.ts
  import { MY_SECRET } from 'astro:env/server';

  // DOESN'T WORK
  const client = myLib(MY_SECRET);

  // WORKS
  export const bar = () => {
    const client = myLib(MY_SECRET);
    return client;
  };
  ```

  ### watch config files

  This release starts monitoring your `wrangler.toml` and `.dev.vars` files for changes and restarting the dev server if you update them.

  #### What should I do?

  If you observe any issues, please check current open issues or create a new one in the repository.

  ### BREAKING: `imageService`

  This release changes the default behavior of `imageService`. In the past the default behavior was falling back to a `noop` service, which disabled image optimization for your project, because Cloudflare doesn's support it. The new default is `compile`, which enables image optimization for prerendered pages during build, but disallows the usage of any `astro:assets` feature inside of on-demand pages.

  #### What should I do?

  If you experience issues with the new setting, you can revert back to the old setting by setting `imageService` to `passthrough`. Furthermore if you observe any issues, please check current open issues or create a new one in the repository.

  ```diff
  // astro.config.mjs

  // ...
  adapter: cloudflare({
  -  imageService: 'compile',
  }),
  // ...
  ```

  ### BREAKING: `platformProxy`

  This release enables `platformProxy` by default. While most projects shouldn't be affected, this is a breaking change on paper.

  #### What should I do?

  If you experience issues with the new default, you can deactivate it by setting `platformProxy.enabled` to `false`. Furthermore if you observe any issues, please check current open issues or create a new one in the repository.

  ```diff
  // astro.config.mjs

  // ...
  adapter: cloudflare({
  -  platformProxy: {
  -    enabled: true,
  -  },
  }),
  // ...
  ```

  ### BREAKING: `passThroughOnException`

  This release throws an error if you use Cloudflare's `passThroughOnException` function because, as stated in [Cloudflare docs](https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions), the function doesn't work with Cloudflare Pages.

  #### What should I do?

  If you observe any issues, please check current open issues or create a new one in the repository.

  ## Deprecations

  ### `wasmModuleImports`

  This release removes the previous deprecated `wasmModuleImports` adapter option and replaces it with the `cloudflareModules` option, which offers flexibility and support for more file types.

  #### What should I do?

  If you observe any issues, please check current open issues or create a new one in the repository.

  ```diff
  // astro.config.mjs

  // ...
  adapter: cloudflare({
  -  wasmModuleImports: true,
  }),
  // ...
  ```

## 10.4.2

### Patch Changes

- [#292](https://github.com/withastro/adapters/pull/292) [`8972d60`](https://github.com/withastro/adapters/commit/8972d60c45af7cd163c193457baff49b0346f155) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes experimental support for `astro:env`

## 10.4.1

### Patch Changes

- [#282](https://github.com/withastro/adapters/pull/282) [`65337f3`](https://github.com/withastro/adapters/commit/65337f3aa67a1f2a40ea8c20a6fcc462e8cbfe94) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes backwards compatibility with Astro <= 4.9

## 10.4.0

### Minor Changes

- [#258](https://github.com/withastro/adapters/pull/258) [`033847d`](https://github.com/withastro/adapters/commit/033847d6b58333a40a6a3da0eba49c4f41360dd8) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Adds support for experimental `astro:env` released in Astro 4.10

## 10.3.0

### Minor Changes

- [#251](https://github.com/withastro/adapters/pull/251) [`b826675`](https://github.com/withastro/adapters/commit/b826675e845c2115daa774ee697013de4ce5690f) Thanks [@adrianlyjak](https://github.com/adrianlyjak)! - Adds support for `.bin` and `.txt` files

## 10.2.6

### Patch Changes

- [#226](https://github.com/withastro/adapters/pull/226) [`de6f3eb`](https://github.com/withastro/adapters/commit/de6f3eba4ad4135fd762320b1219850ba9b3d7e9) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes chunk issues when bundling node_modules dependencies

## 10.2.5

### Patch Changes

- [#249](https://github.com/withastro/adapters/pull/249) [`72fc8ac`](https://github.com/withastro/adapters/commit/72fc8ac6faee9eae2463bab23407c2b619abb39f) Thanks [@adrianlyjak](https://github.com/adrianlyjak)! - Fixes build errors when wasm modules are imported from a file that is shared in both prerendered static pages and server side rendered pages

## 10.2.4

### Patch Changes

- [#247](https://github.com/withastro/adapters/pull/247) [`e08cd4c`](https://github.com/withastro/adapters/commit/e08cd4ca6cf9a517941576f54a4b60ed17b6f077) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an issue where redirect rules where not excluded from routing due to ordering issues

## 10.2.3

### Patch Changes

- [#243](https://github.com/withastro/adapters/pull/243) [`71ba51d`](https://github.com/withastro/adapters/commit/71ba51d2983eef89b5692f351724081507c2f82f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an issue where the bundle was not cleaned up correctly

## 10.2.2

### Patch Changes

- [#241](https://github.com/withastro/adapters/pull/241) [`82d81d9`](https://github.com/withastro/adapters/commit/82d81d9a55da93792d7f9244fb5aa3ec86939620) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removes a debug log

## 10.2.1

### Patch Changes

- [#238](https://github.com/withastro/adapters/pull/238) [`1927f94`](https://github.com/withastro/adapters/commit/1927f941b41ac7156054c337edb031be8132e3e2) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes `astro build` which throws an error if it can't clean up dynamic imports for prerendered pages.

## 10.2.0

### Minor Changes

- [#222](https://github.com/withastro/adapters/pull/222) [`8f312da`](https://github.com/withastro/adapters/commit/8f312dabc31bd17a699d172d1366ef63a5e0f8f4) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes an issue, where unused code was not removed from the output, which led to issues with large projects with a lot of prerendered pages.

## 10.1.0

### Minor Changes

- [#229](https://github.com/withastro/adapters/pull/229) [`1f4e40b`](https://github.com/withastro/adapters/commit/1f4e40b7c1ad586b58159b12b8f5b6a2da7ce1d9) Thanks [@FlorianFlatscher](https://github.com/FlorianFlatscher)! - Adds a new option for the Image service to the Cloudflare adapter. `imageService: 'custom'` does use the user defined settings, without applying any modification to it. **You need to make sure that the configured settings are compatible with Cloudflare's `workerd` runtime yourself.**

## 10.0.3

### Patch Changes

- [#225](https://github.com/withastro/adapters/pull/225) [`9e7d0ea`](https://github.com/withastro/adapters/commit/9e7d0eae05a2ba8d7234e909e724b220b602fc5a) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes `locals.runtime` API to match between `astro dev` and `astro build`

## 10.0.2

### Patch Changes

- [#217](https://github.com/withastro/adapters/pull/217) [`0349bd4`](https://github.com/withastro/adapters/commit/0349bd41a9d10421907eb0e46bd6472c85a10ec7) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - fixes an issue where the automatic `_routes.json` generation was not working as expected for some projects, which had a dynamic route as the first segment

- [#217](https://github.com/withastro/adapters/pull/217) [`0349bd4`](https://github.com/withastro/adapters/commit/0349bd41a9d10421907eb0e46bd6472c85a10ec7) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - fixes an issue where the automatic `_routes.json` generation was not limited correctly, which had manual extend patterns

## 10.0.1

### Patch Changes

- [#212](https://github.com/withastro/adapters/pull/212) [`c22bb21`](https://github.com/withastro/adapters/commit/c22bb21f6bb0fece2bf29b9acaff08a78a6fce43) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - fixes an issue where projects using `@astrojs/solid-js` were unusable, due to wrong vite config

- [#210](https://github.com/withastro/adapters/pull/210) [`317bd95`](https://github.com/withastro/adapters/commit/317bd9533b32558f481c50ec807d72ce1aa12cbb) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - fixes an issue where projects using `@astrojs/vue` were unusable, due to marking dependencies as external

## 10.0.0

### Major Changes

- [#159](https://github.com/withastro/adapters/pull/159) [`adb8bf2a4caeead9a1a255740c7abe8666a6f852`](https://github.com/withastro/adapters/commit/adb8bf2a4caeead9a1a255740c7abe8666a6f852) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Updates and prepares the adapter to be more flexibile, stable and composable for the future. Includes several breaking changes.

  ## Upgrade Guide

  We are commited to provide a smooth upgrade path for our users. This guide will describe what has changed from v9.x to v10 to help you to migrate your existing projects to the latest version of the adapter. For complete documentation of all v10 configuration settings and usage, please see [the current, updated Cloudflare adapter documentation](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).

  We will provide at least 4 weeks of limited maintanance support for the previous version 9 of the adapter. Please plan to upgrade your project within this time frame, using the instructions below.

  ### Adapter's `mode` option & Cloudflare Functions

  The `mode` option has been removed from the adapter. The adapter now defaults to the previous `advanced` mode and this is the only official supported option moving forward.

  If you are already using `mode: 'advanced'` in your `astro.config.mjs` file, you can safely remove it.

  ```diff
  import cloudflare from '@astrojs/cloudflare';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	adapter: cloudflare({
  -		mode: 'advanced',
  	}),
  });
  ```

  If you are using `mode: 'directory'`, and don't have any custom Cloudflare functions in the `/function` folder, you should be able to remove the `mode` option, without any issues.

  ```diff
  import cloudflare from '@astrojs/cloudflare';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	adapter: cloudflare({
  -		mode: 'directory',
  	}),
  });
  ```

  If you are using `mode: 'directory'`, **and you have custom Cloudflare functions in the `/function` folder**, you will need to manually migrate them to [Astro Server Endpoints (API Routes)](https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes). If you need to access Cloudflare Bindings, you can use `ctx.locals`. For further reference, please check the [Adapters Documentation on Cloudflare Runtime Usage](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#usage).

  ### Adapter's `functionPerRoute` option

  The `functionPerRoute` option has been removed from the adapter. The adapter now defaults to the previous `false` value. If you are using `functionPerRoute: true` in your `astro.config.mjs` file, you can safely remove it. This change will not break any existing projects, but you will no longer be generating a single function for each route.

  ```diff
  import cloudflare from '@astrojs/cloudflare';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	adapter: cloudflare({
  -		functionPerRoute: true,
  	}),
  });
  ```

  ### Local Runtime

  The adapter replaces the `runtime` options with a new set of `platformProxy` options to enable local runtime support when using `astro dev`.

  If you are already using a `wrangler.toml` file, you can safely replace your existing `runtime` options with the appropriate `platformProxy` options.

  ```diff
  import cloudflare from '@astrojs/cloudflare';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	adapter: cloudflare({
  -		runtime: {
  -			mode: 'local',
  -			type: 'workers',
  -		},
  +		platformProxy: {
  +			enabled: true,
  +		},
  	}),
  });
  ```

  If you define your bindings in the `astro.config.mjs` file, you need to first migrate your project to use a `wrangler.toml` configuration file for defining your bindings. You can find more information on how to do this in the [Cloudflare docs about wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/#d1-databases). Then, replace `runtime` options with the new corresponding `platformProxy` options as above.

  ```diff
  import cloudflare from '@astrojs/cloudflare';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	adapter: cloudflare({
  -		runtime: {
  -			mode: 'local',
  -			type: 'pages',
  -			bindings: {
  -				// ...
  -			},
  -		},
  +		platformProxy: {
  +			enabled: true,
  +		},
  	}),
  });
  ```

  If you have typed `locals` in your `./src/env.d.ts` file, you need to run `wrangler types` in your project and update the file.

  ```diff
  /// <reference types="astro/client" />

  - type KVNamespace = import('@cloudflare/workers-types/experimental').KVNamespace;
  - type ENV = {
  -   SERVER_URL: string;
  -   KV_BINDING: KVNamespace;
  - };

  - type Runtime = import('@astrojs/cloudflare').AdvancedRuntime<ENV>;
  + type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

  declare namespace App {
    interface Locals extends Runtime {

        name: string;
        surname: string;
      };
    }
  }
  ```

  ### Routes

  The `routes.strategy` option has been removed as you will no longer have the option to choose a strategy in v10 of this adpater.

  If you are using `routes.strategy`, you can remove it. You might observe a different `dist/_routes.json` file, but it should not affect your project's behavior.

  ```diff
  import cloudflare from '@astrojs/cloudflare';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	adapter: cloudflare({
  -		routes: {
  -			strategy: 'include',
  -		},
  	}),
  });
  ```

  Additionally the `routes.include` & `routes.exclude` options have changed their name and type. If you were previously using them, move these to the new `routes.extend` property and update their types:

  ```diff
  import cloudflare from '@astrojs/cloudflare';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	adapter: cloudflare({
  		routes: {
  -			include: ['/api/*'],
  -			exclude: ['/fonts/*'],
  +			extend: {
  +				include: [{ pattern: '/api/*' }],
  +				exclude: [{ pattern: '/fonts/*' }],
  +			},
  		},
  	}),
  });
  ```

  ### process.env

  In the old version of the adapter we used to expose all the environment variables to `process.env`. This is no longer the case, as it was unsafe. If you need to use environment variables, you need to use either `Astro.locals.runtime.env` or `context.locals.runtime.env`. There is no way to access the environment variables directly from `process.env` or in the global scope.

  If you need to access the environment variables in global scope, you should refactor your code to pass the environment variables as arguments to your function or file.

  If you rely on any third library that uses `process.env`, please open an issue and we can investigate what the best way to handle this is.

  ### Node.js APIs compatibility

  The adapter still supports the same Node.js APIs as Cloudflare does, but you need to adapt your vite configuration and enable the Cloudflare `nodejs_compat` flag.

  ```diff
  import {defineConfig} from "astro/config";
  import cloudflare from '@astrojs/cloudflare';

  export default defineConfig({
    adapter: cloudflare({}),
    output: 'server',
  +  vite: {
  +    ssr: {
  +      external: ['node:buffer'],
  +    },
  +  },
  })
  ```

## 9.2.1

### Patch Changes

- [#204](https://github.com/withastro/adapters/pull/204) [`826bb4fe1fa2a95a38397f927210cdf37079c38a`](https://github.com/withastro/adapters/commit/826bb4fe1fa2a95a38397f927210cdf37079c38a) Thanks [@dario-piotrowicz](https://github.com/dario-piotrowicz)! - Fixes a typo for a Cloudflare runtime .dev.vars warning

## 9.2.0

### Minor Changes

- [#192](https://github.com/withastro/adapters/pull/192) [`256b7024624ab45d5087d774cb4c30b117f1636a`](https://github.com/withastro/adapters/commit/256b7024624ab45d5087d774cb4c30b117f1636a) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Prepares for major breaking changes to adapter configuration in the upcoming v10 release.

  _(Full documentation to help you migrate your project to the upgraded Cloudflare adapter will be provided with the release of v10.0.)_

  **Deprecates** the following adapter configuration options (to be **removed entirely in v10**):
  - **`mode`:** All projects will deploy to Cloudflare pages using [advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/) (the previous default setting). This is no longer a configurable option. [Cloudflare Functions](https://developers.cloudflare.com/pages/functions/get-started/) will no longer be supported. If you were using `mode: 'directory'`, please migrate to [Astro Endpoints](https://docs.astro.build/en/guides/endpoints/).
  - **`functionPerRoute`:** Discontinued due to Cloudflare's single execution context approach. You will no longer have the option to compile a separate bundle for each page.
  - **`routes.strategy`:** Projects will use the auto-generated `_route.json` for route management unless you [provide your own `public/_routes.json`](/en/guides/integrations-guide/cloudflare/#custom-_routesjson). This change aims to eliminate confusion and promote consistency.
  - **`routes.include`:** Will be replaced by a new `routes.extend.include` option to allow you to include additional routes.
  - **`routes.exclude`:** Will be replaced by a new `routes.extend.exclude` option to allow you to exclude additional routes.
  - **`runtime`:** Local runtime bindings will be configured in `wrangler.toml` at the root of your project as described in the [adapters documentation](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#cloudflare-workers). You will no longer configure these directly in the adapter configuration. A new `platformProxy` setting will be introduced to enable and configure the platformProxy (local runtime) provided by wrangler.

  These changes are part of ongoing efforts to streamline functionality, improve performance, and align with best practices and platform capabilities.

  We strongly recommend upgrading to v10 upon its release. To ensure a smooth migration, we commit to at least 4 weeks of additional maintenance for v9 following the release of v10. During this period, we will actively assist with migration efforts to ensure that all users can transition without major issues.

## 9.1.0

### Minor Changes

- [#179](https://github.com/withastro/adapters/pull/179) [`6ad25929ce37344d9de7063643434ca0b01df306`](https://github.com/withastro/adapters/commit/6ad25929ce37344d9de7063643434ca0b01df306) Thanks [@F0rce](https://github.com/F0rce)! - Adds [Service bindings](https://developers.cloudflare.com/workers/configuration/bindings/about-service-bindings/) to the runtime bindings.

## 9.0.2

### Patch Changes

- [#171](https://github.com/withastro/adapters/pull/171) [`0463483141c2a09ed983fd8053e6bee6d4b0567d`](https://github.com/withastro/adapters/commit/0463483141c2a09ed983fd8053e6bee6d4b0567d) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an error with automatic deduplication of `_routes.json` for more complex project structures

## 9.0.1

### Patch Changes

- [#168](https://github.com/withastro/adapters/pull/168) [`25908149cd5b9e82d6746529e44473ae93be6e32`](https://github.com/withastro/adapters/commit/25908149cd5b9e82d6746529e44473ae93be6e32) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an error where the `astro dev` command would fail if the cache directory already existed

## 9.0.0

### Major Changes

- [#130](https://github.com/withastro/adapters/pull/130) [`2b5aaa4cfeda4bc7f1bf8db6210162c495866a95`](https://github.com/withastro/adapters/commit/2b5aaa4cfeda4bc7f1bf8db6210162c495866a95) Thanks [@asdfjkalsdfla](https://github.com/asdfjkalsdfla)! - Updates the internals of the integration to support Astro 4.0. See this [upstream pull request](https://github.com/withastro/astro/pull/9199) for additional details. **Warning:** Make sure to upgrade your Astro version to `>4.2` as previous versions are no longer supported.

### Patch Changes

- [#137](https://github.com/withastro/adapters/pull/137) [`d67df0e24ad0d9fca317f01e877f3dc650831488`](https://github.com/withastro/adapters/commit/d67df0e24ad0d9fca317f01e877f3dc650831488) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes an issue with `_routes.json` generation, where duplicates where not removed correctly and an explicit user strategy setting was ignored.

## 8.1.0

### Minor Changes

- [#58](https://github.com/withastro/adapters/pull/58) [`ecdb8f5bc21b19cc86e581711a1c360fc723a007`](https://github.com/withastro/adapters/commit/ecdb8f5bc21b19cc86e581711a1c360fc723a007) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Adds the option to only run image optimization on images during build-time. **Warning:** This mode does not work with on-demand (SSR) image optimization.

  ```diff
  import {defineConfig} from "astro/config";
  import cloudflare from '@astrojs/cloudflare';

  export default defineConfig({
    output: 'server'
    adapter: cloudflare({
  +   imageService: 'compile'
    }),
  })
  ```

## 8.0.2

### Patch Changes

- [#125](https://github.com/withastro/adapters/pull/125) [`200dea9`](https://github.com/withastro/adapters/commit/200dea9d5a98e9348b2368b846f385ab850ca053) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Updates miniflare version

## 8.0.1

### Patch Changes

- [#108](https://github.com/withastro/adapters/pull/108) [`63fa4e6`](https://github.com/withastro/adapters/commit/63fa4e6acfabc398460be788120c03329198a02d) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates Cloudflare README.md

## 8.0.0

### Major Changes

- [#94](https://github.com/withastro/adapters/pull/94) [`13ddae8`](https://github.com/withastro/adapters/commit/13ddae81d31922e4e7bf096eea44148dbcc246c8) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removes deprecated option `build.split`. Use `functionPerRoute` instead.

- [#94](https://github.com/withastro/adapters/pull/94) [`13ddae8`](https://github.com/withastro/adapters/commit/13ddae81d31922e4e7bf096eea44148dbcc246c8) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Changes the way that bindings are configured for the local runtime using `astro dev`. This change is developed in cooperation with Cloudflare and aligns Astro more closely to the behavior of Wrangler.

  :warning: This is a breaking change for anyone deploying to Cloudflare Pages. You need to update your astro config file to set new the bindings. Follow the updated docs for [configuring `@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#cloudflare-pages)

### Patch Changes

- [#94](https://github.com/withastro/adapters/pull/94) [`13ddae8`](https://github.com/withastro/adapters/commit/13ddae81d31922e4e7bf096eea44148dbcc246c8) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Improves compatibility with Astro 4.0. using WASM modules

- [#94](https://github.com/withastro/adapters/pull/94) [`13ddae8`](https://github.com/withastro/adapters/commit/13ddae81d31922e4e7bf096eea44148dbcc246c8) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Updates `peerDependency` of `astro` to be less strict

## 7.7.1

### Patch Changes

- [#69](https://github.com/withastro/adapters/pull/69) [`473e9fa`](https://github.com/withastro/adapters/commit/473e9fabdc2f5a87daf6a71c8869e8430903590f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes a regression which caused the adapter to falsely generate `_routes.json` for on-demand rendered 404 pages, which causes unexpected behavior in Cloudflare's SPA routing.

- [#66](https://github.com/withastro/adapters/pull/66) [`5b62509`](https://github.com/withastro/adapters/commit/5b625096c7115aa0496a6c7053c4226c8fd118f3) Thanks [@ToxiWoxi](https://github.com/ToxiWoxi)! - Fixes a regression which caused the adapter to falsely return an empty 404 response, caused by an upstream change https://github.com/withastro/astro/pull/7754.

## 7.7.0

### Minor Changes

- [#34](https://github.com/withastro/adapters/pull/34) [`4e1060b`](https://github.com/withastro/adapters/commit/4e1060b9b6bc758a3163f6a9b7d5074954a83e22) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Adds an `imageService` adapter option to configure which image service is used. Read more in the [Cloudflare adapter docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).

- [#34](https://github.com/withastro/adapters/pull/34) [`4e1060b`](https://github.com/withastro/adapters/commit/4e1060b9b6bc758a3163f6a9b7d5074954a83e22) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Adds support for using Cloudflare's Image Resizing service as an external image service in Astro. See [Cloudflare's image docs](https://developers.cloudflare.com/images/image-resizing/) for more information about pricing and features.

## 7.6.4

### Patch Changes

- [#51](https://github.com/withastro/adapters/pull/51) [`acf4c82`](https://github.com/withastro/adapters/commit/acf4c824f8e066d25d94ddf59a486083586567c4) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Updates dependencies

## 7.6.3

### Patch Changes

- [#46](https://github.com/withastro/adapters/pull/46) [`1611ff7`](https://github.com/withastro/adapters/commit/1611ff7cf8e94d5f5267b6a86fca535eedaa5651) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes a regression introduced in 7.6.2, which breaks building

## 7.6.2

### Patch Changes

- [#33](https://github.com/withastro/adapters/pull/33) [`78baf24`](https://github.com/withastro/adapters/commit/78baf24c34f155305bcb5116e14373d4ddf58ce9) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes override of a valid `astro:assets` image service configuration. Now overrides are only applied when the configuration is known to be incompatible with Cloudflare.

## 7.6.1

### Patch Changes

- [#28](https://github.com/withastro/adapters/pull/28) [`1665a39`](https://github.com/withastro/adapters/commit/1665a3913373d02e73a3557bc045d1f0158979b6) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes missing persistence setting for `cache`

- [#30](https://github.com/withastro/adapters/pull/30) [`625c41b`](https://github.com/withastro/adapters/commit/625c41b4b69058933e1d14f1c153574a992c0519) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes a regression introduced in 7.6.0, which breaks when no argument is set

## 7.6.0

### Minor Changes

- [#23](https://github.com/withastro/adapters/pull/23) [`4a03af2`](https://github.com/withastro/adapters/commit/4a03af28f6101185c56fb3973de217780533755b) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Adds a new property `persistTo` which allows setting the directory for local state files when using Cloudflare runtime with `astro dev`. This is useful when you want to persist state between restarts of the dev server, for example when using KV, D1, R2 to store data.

  Additionally, updates the format of the `runtime` configuration and adds a warning when the deprecated format is used. The current format is now `runtime: { mode: 'off' | 'local', persistTo: string }`. See [runtime documentation](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#runtime) for more information.

## 7.5.4

### Patch Changes

- [#21](https://github.com/withastro/adapters/pull/21) [`09d2504`](https://github.com/withastro/adapters/commit/09d25043125250e65ccb59549f527d5d876c3a06) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Updates repository information

## 7.5.3

### Patch Changes

- [#8782](https://github.com/withastro/astro/pull/8782) [`75781643a`](https://github.com/withastro/astro/commit/75781643a2f53656fc3fde3a7f28cb62db40b015) Thanks [@helloimalastair](https://github.com/helloimalastair)! - fixes `AdvancedRuntime` & `DirectoryRuntime` types to work woth Cloudflare caches

- Updated dependencies [[`2993055be`](https://github.com/withastro/astro/commit/2993055bed2764c31ff4b4f55b81ab6b1ae6b401), [`c4270e476`](https://github.com/withastro/astro/commit/c4270e47681ee2453f3fea07fed7b238645fd6ea), [`bd5aa1cd3`](https://github.com/withastro/astro/commit/bd5aa1cd35ecbd2784f30dd836ff814684fee02b), [`f369fa250`](https://github.com/withastro/astro/commit/f369fa25055a3497ebaf61c88fb0e8af56c73212), [`391729686`](https://github.com/withastro/astro/commit/391729686bcc8404a7dd48c5987ee380daf3200f), [`f999365b8`](https://github.com/withastro/astro/commit/f999365b8248b8b14f3743e68a42d450d06acff3), [`b2ae9ee0c`](https://github.com/withastro/astro/commit/b2ae9ee0c42b11ffc1d3f070d1d5ac881aef84ed), [`0abff97fe`](https://github.com/withastro/astro/commit/0abff97fed3db14be3c75ff9ece3aab67c4ba783), [`3bef32f81`](https://github.com/withastro/astro/commit/3bef32f81c56bc600ca307f1bd40787e23e625a5)]:
  - astro@3.3.0
  - @astrojs/underscore-redirects@0.3.1

## 7.5.2

### Patch Changes

- [#8766](https://github.com/withastro/astro/pull/8766) [`054c5c644`](https://github.com/withastro/astro/commit/054c5c6447d79dd4ea7ab6ce0f9ec836abebd211) Thanks [@jadbox](https://github.com/jadbox)! - Adds `cloudflare:sockets` compile support

- [#8788](https://github.com/withastro/astro/pull/8788) [`0ab6bad7d`](https://github.com/withastro/astro/commit/0ab6bad7dffd413c975ab00e545f8bc150f6a92f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Adds support for `node:crypto`

- Updated dependencies [[`160d1cd75`](https://github.com/withastro/astro/commit/160d1cd755e70af1d8ec294d01dd2cb32d60db50), [`30de32436`](https://github.com/withastro/astro/commit/30de324361bc261956eb9fc08fe60a82ff602a9b), [`c4a7ec425`](https://github.com/withastro/astro/commit/c4a7ec4255e7acb9555cb8bb74ea13c5fbb2ac17), [`c24f70d91`](https://github.com/withastro/astro/commit/c24f70d91601dd3a6b5a84f04d61824e775e9b44), [`93b092266`](https://github.com/withastro/astro/commit/93b092266febfad16a48575f8eee12d5910bf071), [`29cdfa024`](https://github.com/withastro/astro/commit/29cdfa024886dd581cb207586f7dfec6966bdd4e), [`eaed844ea`](https://github.com/withastro/astro/commit/eaed844ea8f2f52e0c9caa40bb3ec7377e10595f)]:
  - astro@3.2.4
  - @astrojs/underscore-redirects@0.3.1

## 7.5.1

### Patch Changes

- [#8737](https://github.com/withastro/astro/pull/8737) [`6f60da805`](https://github.com/withastro/astro/commit/6f60da805e0014bc50dd07bef972e91c73560c3c) Thanks [@ematipico](https://github.com/ematipico)! - Add provenance statement when publishing the library from CI

- Updated dependencies [[`6f60da805`](https://github.com/withastro/astro/commit/6f60da805e0014bc50dd07bef972e91c73560c3c), [`d78806dfe`](https://github.com/withastro/astro/commit/d78806dfe0301ea7ffe6c7c1f783bd415ac7cda9), [`d1c75fe15`](https://github.com/withastro/astro/commit/d1c75fe158839699c59728cf3a83888e8c72a459), [`aa265d730`](https://github.com/withastro/astro/commit/aa265d73024422967c1b1c68ad268c419c6c798f), [`78adbc443`](https://github.com/withastro/astro/commit/78adbc4433208458291e36713909762e148e1e5d), [`21e0757ea`](https://github.com/withastro/astro/commit/21e0757ea22a57d344c934045ca19db93b684436), [`357270f2a`](https://github.com/withastro/astro/commit/357270f2a3d0bf2aa634ba7e52e9d17618eff4a7)]:
  - @astrojs/underscore-redirects@0.3.1
  - astro@3.2.3

## 7.5.0

### Minor Changes

- [#8655](https://github.com/withastro/astro/pull/8655) [`3dd65bf88`](https://github.com/withastro/astro/commit/3dd65bf8895faedfa4c92599961acca07457c62f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Introduces support for local KV bindings. Enhances development experience by allowing direct integration with `astro dev`.

- [#8655](https://github.com/withastro/astro/pull/8655) [`3dd65bf88`](https://github.com/withastro/astro/commit/3dd65bf8895faedfa4c92599961acca07457c62f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Introduces support for local Durable Objects bindings. Enhances development experience by allowing direct integration with `astro dev`.

- [#8655](https://github.com/withastro/astro/pull/8655) [`3dd65bf88`](https://github.com/withastro/astro/commit/3dd65bf8895faedfa4c92599961acca07457c62f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Introduces support for local D1 bindings. Enhances development experience by allowing direct integration with `astro dev`.

- [#8655](https://github.com/withastro/astro/pull/8655) [`3dd65bf88`](https://github.com/withastro/astro/commit/3dd65bf8895faedfa4c92599961acca07457c62f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Introduces support for local R2 bindings. Enhances development experience by allowing direct integration with `astro dev`.

- [#8655](https://github.com/withastro/astro/pull/8655) [`3dd65bf88`](https://github.com/withastro/astro/commit/3dd65bf8895faedfa4c92599961acca07457c62f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Introduces support for local Caches bindings. Enhances development experience by allowing direct integration with `astro dev`.

### Patch Changes

- Updated dependencies [[`455af3235`](https://github.com/withastro/astro/commit/455af3235b3268852e6988accecc796f03f6d16e), [`4c2bec681`](https://github.com/withastro/astro/commit/4c2bec681b0752e7215b8a32bd2d44bf477adac1)]:
  - astro@3.2.2
  - @astrojs/underscore-redirects@0.3.0

## 7.4.0

### Minor Changes

- [#8682](https://github.com/withastro/astro/pull/8682) [`c3572fd5e`](https://github.com/withastro/astro/commit/c3572fd5e0e3864cd728f83502a52e9274793ee2) Thanks [@dario-piotrowicz](https://github.com/dario-piotrowicz)! - Change build target from `es2020` to `es2022`, for better support

### Patch Changes

- Updated dependencies [[`31c59ad8b`](https://github.com/withastro/astro/commit/31c59ad8b6a72f95c98a306ecf92d198c03110b4), [`47ea310f0`](https://github.com/withastro/astro/commit/47ea310f01d06ed1562c790bec348718a2fa8277), [`345808170`](https://github.com/withastro/astro/commit/345808170fce783ddd3c9a4035a91fa64dcc5f46)]:
  - astro@3.2.1
  - @astrojs/underscore-redirects@0.3.0

## 7.3.1

### Patch Changes

- [#7776](https://github.com/withastro/astro/pull/7776) [`f5c617e3a`](https://github.com/withastro/astro/commit/f5c617e3a3ed8f010ff28f0cfe0f322ad54ed6e0) Thanks [@aditsachde](https://github.com/aditsachde)! - Include generated files starting with a dot in \_routes.json

- [#8654](https://github.com/withastro/astro/pull/8654) [`f6ba533df`](https://github.com/withastro/astro/commit/f6ba533df6861e09d39a29f6ef7a80271bbc8d0a) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Refactor codebase to enhance code readability and structure, to prioritize maintainability for long-term.

- Updated dependencies [[`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317), [`408b50c5e`](https://github.com/withastro/astro/commit/408b50c5ea5aba66252424f54788557274a58571), [`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317), [`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317), [`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317), [`e797b6816`](https://github.com/withastro/astro/commit/e797b6816072f63f38d9a91dd2a66765c558d46c), [`824dd4670`](https://github.com/withastro/astro/commit/824dd4670a145c47337eff84a5ae412bf7443117), [`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317), [`cfd895d87`](https://github.com/withastro/astro/commit/cfd895d877fdb7fc69e745665a374fc32cb3ef7d)]:
  - astro@3.2.0
  - @astrojs/underscore-redirects@0.3.0

## 7.3.0

### Minor Changes

- [#8459](https://github.com/withastro/astro/pull/8459) [`2365c1246`](https://github.com/withastro/astro/commit/2365c124645d5067a12987f205cee23a45d1d13d) Thanks [@schummar](https://github.com/schummar)! - Adds three new config options for `_routes.json` generation: `routes.strategy`, `routes.include`, and `routes.exclude`.

- [#8542](https://github.com/withastro/astro/pull/8542) [`faeead423`](https://github.com/withastro/astro/commit/faeead42325f378f9edac4e081eb7d6d50905136) Thanks [@adrianlyjak](https://github.com/adrianlyjak)! - Add support for loading wasm modules in the cloudflare adapter

### Patch Changes

- Updated dependencies [[`863f5171e`](https://github.com/withastro/astro/commit/863f5171e8e7516c9d72f2e48ea7db1dea71c4f5), [`63141f3f3`](https://github.com/withastro/astro/commit/63141f3f3e4a57d2f55ccfebd7e506ea1033a1ab), [`974d5117a`](https://github.com/withastro/astro/commit/974d5117abc8b47f8225e455b9285c88e305272f), [`cb838b84b`](https://github.com/withastro/astro/commit/cb838b84b457041b0442996f7611b04aa940a620), [`f36c4295b`](https://github.com/withastro/astro/commit/f36c4295be1ef2bcfa4aecb3c59551388419c53d), [`4c4ad9d16`](https://github.com/withastro/astro/commit/4c4ad9d167e8d15ff2c15e3336ede8ca22f646b2)]:
  - astro@3.1.3
  - @astrojs/underscore-redirects@0.3.0

## 7.2.0

### Minor Changes

- [#8595](https://github.com/withastro/astro/pull/8595) [`5b0b3c9a8`](https://github.com/withastro/astro/commit/5b0b3c9a8e0c0e6b6c7472b82008ab57985f2a04) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Add support for the following Node.js Runtime APIs, which are availabe in [Cloudflare](https://developers.cloudflare.com/workers/runtime-apis/nodejs) using the `node:` syntax.
  - assert
  - AsyncLocalStorage
  - Buffer
  - Diagnostics Channel
  - EventEmitter
  - path
  - process
  - Streams
  - StringDecoder
  - util

  ```js
  import { Buffer } from 'node:buffer';
  ```

### Patch Changes

- Updated dependencies [[`bcad715ce`](https://github.com/withastro/astro/commit/bcad715ce67bc73a7927c941d1e7f02a82d638c2), [`bdd267d08`](https://github.com/withastro/astro/commit/bdd267d08937611984d074a2872af11ecf3e1a12), [`e522a5eb4`](https://github.com/withastro/astro/commit/e522a5eb41c7df1e62c307c84cd14d53777439ff), [`ed54d4644`](https://github.com/withastro/astro/commit/ed54d46449accc99ad117d6b0d50a8905e4d65d7), [`70f2a8003`](https://github.com/withastro/astro/commit/70f2a80039d232731f63ea735e896997ec0eac7a), [`4398e9298`](https://github.com/withastro/astro/commit/4398e929877dfadd2067af28413284afdfde9d8b), [`8f8b9069d`](https://github.com/withastro/astro/commit/8f8b9069ddd21cf57d37955ab3a92710492226f5), [`5a988eaf6`](https://github.com/withastro/astro/commit/5a988eaf609ddc1b9609acb0cdc2dda43d10a5c2)]:
  - astro@3.1.2
  - @astrojs/underscore-redirects@0.3.0

## 7.1.1

### Patch Changes

- [#8560](https://github.com/withastro/astro/pull/8560) [`3da5d8404`](https://github.com/withastro/astro/commit/3da5d8404e56a05da93f6b0a70841acda5ca1a8f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - add the option to type environment variables using a generic

- Updated dependencies [[`8d361169b`](https://github.com/withastro/astro/commit/8d361169b8e487933d671ce347f0ce74922c80cc), [`95b5f6280`](https://github.com/withastro/astro/commit/95b5f6280d124f8d6f866dc3286406c272ee91bf), [`0586e20e8`](https://github.com/withastro/astro/commit/0586e20e8338e077b8eb1a3a96bdd19f5950c22f)]:
  - astro@3.1.1
  - @astrojs/underscore-redirects@0.3.0

## 7.1.0

### Minor Changes

- [#8426](https://github.com/withastro/astro/pull/8426) [`2c9614469`](https://github.com/withastro/astro/commit/2c9614469674509b3e3bc21a4471a1aeb9b4141f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Add support for Cloudflare Runtime (env vars, caches and req object), using `astro dev`

### Patch Changes

- Updated dependencies [[`78b82bb39`](https://github.com/withastro/astro/commit/78b82bb3929bee5d8d9bd32d65374956ddb05859), [`5e1099f68`](https://github.com/withastro/astro/commit/5e1099f686abcc7026bd4fa74727f3b311c6d6d6), [`644825845`](https://github.com/withastro/astro/commit/644825845c11c8d100a9b0d16b69a23c165c529e), [`fa77fa63d`](https://github.com/withastro/astro/commit/fa77fa63d944f709a37f08be93f0d14fe1d91188), [`23f9536de`](https://github.com/withastro/astro/commit/23f9536de0456ed2ddc9a77f7aef773ab6a8e73c), [`2db9762eb`](https://github.com/withastro/astro/commit/2db9762eb06d8a95021556c64e0cbb56c61352d5), [`435b10549`](https://github.com/withastro/astro/commit/435b10549878281ad2bb60207cb86f312a4a809f), [`a6a516d94`](https://github.com/withastro/astro/commit/a6a516d9446a50cc32fbd7201b243c63b3a4db43), [`43bc5f2a5`](https://github.com/withastro/astro/commit/43bc5f2a55173218bcfeec50242b72ae999930e2), [`0ca332ba4`](https://github.com/withastro/astro/commit/0ca332ba4ab82cc04872776398952867b0f43d33)]:
  - astro@3.0.13
  - @astrojs/underscore-redirects@0.3.0

## 7.0.2

### Patch Changes

- [#8429](https://github.com/withastro/astro/pull/8429) [`bd8aa9a99`](https://github.com/withastro/astro/commit/bd8aa9a996c8a9f9283995360fd495c291d1f766) Thanks [@sarah11918](https://github.com/sarah11918)! - Update code sample in the README to use uppercase `GET`.

- Updated dependencies [[`7d95bd9ba`](https://github.com/withastro/astro/commit/7d95bd9baaf755239fd7d35e4813861b2dbccf42), [`1947ef7a9`](https://github.com/withastro/astro/commit/1947ef7a99ce3d1d6ea797842edd31d5edffa5de), [`61ad70fdc`](https://github.com/withastro/astro/commit/61ad70fdc52035964c43ecdb4cf7468f6c2b61e7), [`d2f2a11cd`](https://github.com/withastro/astro/commit/d2f2a11cdb42b0de79be21c798eda8e7e7b2a277), [`5126c6a40`](https://github.com/withastro/astro/commit/5126c6a40f88bff66ee5d3c3a21eea8c4a44ce7a), [`48ff7855b`](https://github.com/withastro/astro/commit/48ff7855b238536a3df17cb29335c90029fc41a4), [`923a443cb`](https://github.com/withastro/astro/commit/923a443cb060a0e936a0e1cc87c0360232f77914), [`8935b3b46`](https://github.com/withastro/astro/commit/8935b3b4672d6c54c7b79e6c4575298f75eeb9f4)]:
  - astro@3.0.9
  - @astrojs/underscore-redirects@0.3.0

## 7.0.1

### Patch Changes

- [#8346](https://github.com/withastro/astro/pull/8346) [`b74dacdb6`](https://github.com/withastro/astro/commit/b74dacdb6a49755f979f15091355f06bd6bd64bf) Thanks [@delucis](https://github.com/delucis)! - Update README

- Updated dependencies [[`c5633434f`](https://github.com/withastro/astro/commit/c5633434f02cc477ee8da380e22efaccfa55d459), [`405ad9501`](https://github.com/withastro/astro/commit/405ad950173dadddc519cf1c2e7f2523bf5326a8), [`6b1e79814`](https://github.com/withastro/astro/commit/6b1e7981469d30aa4c3658487abed6ffea94797f)]:
  - astro@3.0.7
  - @astrojs/underscore-redirects@0.3.0

## 7.0.0

### Major Changes

- [#8188](https://github.com/withastro/astro/pull/8188) [`d0679a666`](https://github.com/withastro/astro/commit/d0679a666f37da0fca396d42b9b32bbb25d29312) Thanks [@ematipico](https://github.com/ematipico)! - Remove support for Node 16. The lowest supported version by Astro and all integrations is now v18.14.1. As a reminder, Node 16 will be deprecated on the 11th September 2023.

- [#8179](https://github.com/withastro/astro/pull/8179) [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7) Thanks [@matthewp](https://github.com/matthewp)! - Astro 3.0 Release Candidate

- [#8188](https://github.com/withastro/astro/pull/8188) [`7511a4980`](https://github.com/withastro/astro/commit/7511a4980fd36536464c317de33a5190427f430a) Thanks [@ematipico](https://github.com/ematipico)! - When using an adapter that supports neither Squoosh or Sharp, Astro will now automatically use an image service that does not support processing, but still provides the other benefits of `astro:assets` such as enforcing `alt`, no CLS etc to users

- [#8078](https://github.com/withastro/astro/pull/8078) [`2540feedb`](https://github.com/withastro/astro/commit/2540feedb06785d5a20eecc3668849f147d778d4) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - The configuration `build.split` and `build.excludeMiddleware` are deprecated.

  You can now configure this behavior using `functionPerRoute` in your Cloudflare integration config:

  ```diff
  import {defineConfig} from "astro/config";
  import cloudflare from '@astrojs/cloudflare';

  export default defineConfig({
  -    build: {
  -        split: true
  -    },
  -    adapter: cloudflare()
  +    adapter: cloudflare({
  +        mode: 'directory',
  +        functionPerRoute: true
  +    })
  })
  ```

### Minor Changes

- [#8188](https://github.com/withastro/astro/pull/8188) [`cd2d7e769`](https://github.com/withastro/astro/commit/cd2d7e76981ef9b9013453aa2629838e1e9fd422) Thanks [@ematipico](https://github.com/ematipico)! - Introduced the concept of feature map. A feature map is a list of features that are built-in in Astro, and an Adapter
  can tell Astro if it can support it.

  ```ts
  import { AstroIntegration } from './astro';

  function myIntegration(): AstroIntegration {
    return {
      name: 'astro-awesome-list',
      // new feature map
      supportedAstroFeatures: {
        hybridOutput: 'experimental',
        staticOutput: 'stable',
        serverOutput: 'stable',
        assets: {
          supportKind: 'stable',
          isSharpCompatible: false,
          isSquooshCompatible: false,
        },
      },
    };
  }
  ```

### Patch Changes

- [#8079](https://github.com/withastro/astro/pull/8079) [`7b77b34ce`](https://github.com/withastro/astro/commit/7b77b34cef8b46c4d14ecf9e5fcb45fb276331ec) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Sync Astro Asset support across both modes

- Updated dependencies [[`d0679a666`](https://github.com/withastro/astro/commit/d0679a666f37da0fca396d42b9b32bbb25d29312), [`db39206cb`](https://github.com/withastro/astro/commit/db39206cbb85b034859ac416179f141184bb2bff), [`adf9fccfd`](https://github.com/withastro/astro/commit/adf9fccfdda107c2224558f1c2e6a77847ac0a8a), [`0c7b42dc6`](https://github.com/withastro/astro/commit/0c7b42dc6780e687e416137539f55a3a427d1d10), [`46c4c0e05`](https://github.com/withastro/astro/commit/46c4c0e053f830585b9ef229ce1c259df00a80f8), [`364d861bd`](https://github.com/withastro/astro/commit/364d861bd527b8511968e2837728148f090bedef), [`2484dc408`](https://github.com/withastro/astro/commit/2484dc4080e5cd84b9a53648a1de426d7c907be2), [`81545197a`](https://github.com/withastro/astro/commit/81545197a32fd015d763fc386c8b67e0e08b7393), [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7), [`c2c71d90c`](https://github.com/withastro/astro/commit/c2c71d90c264a2524f99e0373ab59015f23ad4b1), [`cd2d7e769`](https://github.com/withastro/astro/commit/cd2d7e76981ef9b9013453aa2629838e1e9fd422), [`80f1494cd`](https://github.com/withastro/astro/commit/80f1494cdaf72e58a420adb4f7c712d4089e1923), [`e45f30293`](https://github.com/withastro/astro/commit/e45f3029340db718b6ed7e91b5d14f5cf14cd71d), [`c0de7a7b0`](https://github.com/withastro/astro/commit/c0de7a7b0f042cd49cbea4f4ac1b2ab6f9fef644), [`65c354969`](https://github.com/withastro/astro/commit/65c354969e6fe0ef6d622e8f4c545e2f717ce8c6), [`3c3100851`](https://github.com/withastro/astro/commit/3c31008519ce68b5b1b1cb23b71fbe0a2d506882), [`34cb20021`](https://github.com/withastro/astro/commit/34cb2002161ba88df6bcb72fecfd12ed867c134b), [`a824863ab`](https://github.com/withastro/astro/commit/a824863ab1c451f4068eac54f28dd240573e1cba), [`44f7a2872`](https://github.com/withastro/astro/commit/44f7a28728c56c04ac377b6e917329f324874043), [`1048aca55`](https://github.com/withastro/astro/commit/1048aca550769415e528016e42b358ffbfd44b61), [`be6bbd2c8`](https://github.com/withastro/astro/commit/be6bbd2c86b9bf5268e765bb937dda00ff15781a), [`9e021a91c`](https://github.com/withastro/astro/commit/9e021a91c57d10809f588dd47968fc0e7f8b4d5c), [`7511a4980`](https://github.com/withastro/astro/commit/7511a4980fd36536464c317de33a5190427f430a), [`c37632a20`](https://github.com/withastro/astro/commit/c37632a20d06164fb97a4c2fc48df6d960398832), [`acf652fc1`](https://github.com/withastro/astro/commit/acf652fc1d5db166231e87e22d0d50444f5556d8), [`42785c7b7`](https://github.com/withastro/astro/commit/42785c7b784b151e6d582570e5d74482129e8eb8), [`8450379db`](https://github.com/withastro/astro/commit/8450379db854fb1eaa9f38f21d65db240bc616cd), [`dbc97b121`](https://github.com/withastro/astro/commit/dbc97b121f42583728f1cdfdbf14575fda943f5b), [`7d2f311d4`](https://github.com/withastro/astro/commit/7d2f311d428e3d1c8c13b9bf2a708d6435713fc2), [`2540feedb`](https://github.com/withastro/astro/commit/2540feedb06785d5a20eecc3668849f147d778d4), [`ea7ff5177`](https://github.com/withastro/astro/commit/ea7ff5177dbcd7b2508cb1eef1b22b8ee1f47079), [`68efd4a8b`](https://github.com/withastro/astro/commit/68efd4a8b29f248397667801465b3152dc98e9a7), [`7bd1b86f8`](https://github.com/withastro/astro/commit/7bd1b86f85c06fdde0a1ed9146d01bac69990671), [`036388f66`](https://github.com/withastro/astro/commit/036388f66dab68ad54b895ed86f9176958dd83c8), [`519a1c4e8`](https://github.com/withastro/astro/commit/519a1c4e8407c7abcb8d879b67a9f4b960652cae), [`1f58a7a1b`](https://github.com/withastro/astro/commit/1f58a7a1bea6888868b689dac94801d554319b02), [`2ae9d37f0`](https://github.com/withastro/astro/commit/2ae9d37f0a9cb21ab288d3c30aecb6d84db87788), [`a8f35777e`](https://github.com/withastro/astro/commit/a8f35777e7e322068a4e2f520c2c9e43ade19e58), [`70f34f5a3`](https://github.com/withastro/astro/commit/70f34f5a355f42526ee9e5355f3de8e510002ea2), [`5208a3c8f`](https://github.com/withastro/astro/commit/5208a3c8fefcec7694857fb344af351f4631fc34), [`84af8ed9d`](https://github.com/withastro/astro/commit/84af8ed9d1e6401c6ebc9c60fe8cddb44d5044b0), [`f003e7364`](https://github.com/withastro/astro/commit/f003e7364317cafdb8589913b26b28e928dd07c9), [`ffc9e2d3d`](https://github.com/withastro/astro/commit/ffc9e2d3de46049bf3d82140ef018f524fb03187), [`732111cdc`](https://github.com/withastro/astro/commit/732111cdce441639db31f40f621df48442d00969), [`0f637c71e`](https://github.com/withastro/astro/commit/0f637c71e511cb4c51712128d217a26c8eee4d40), [`33b8910cf`](https://github.com/withastro/astro/commit/33b8910cfdce5713891c50a84a0a8fe926311710), [`8a5b0c1f3`](https://github.com/withastro/astro/commit/8a5b0c1f3a4be6bb62db66ec70144109ff5b4c59), [`148e61d24`](https://github.com/withastro/astro/commit/148e61d2492456811f8a3c8daaab1c3429a2ffdc), [`e79e3779d`](https://github.com/withastro/astro/commit/e79e3779df0ad35253abcdb931d622847d9adb12), [`632579dc2`](https://github.com/withastro/astro/commit/632579dc2094cc342929261c89e689f0dd358284), [`3674584e0`](https://github.com/withastro/astro/commit/3674584e02b161a698b429ceb66723918fdc56ac), [`1db4e92c1`](https://github.com/withastro/astro/commit/1db4e92c12ed73681217f5cefd39f2f47542f961), [`e7f872e91`](https://github.com/withastro/astro/commit/e7f872e91e852b901cf221a5151077dec64305bf), [`16f09dfff`](https://github.com/withastro/astro/commit/16f09dfff7722fda99dd0412e3006a7a39c80829), [`4477bb41c`](https://github.com/withastro/astro/commit/4477bb41c8ed688785c545731ef5b184b629f4e5), [`55c10d1d5`](https://github.com/withastro/astro/commit/55c10d1d564e805efc3c1a7c48e0d9a1cdf0c7ed), [`3e834293d`](https://github.com/withastro/astro/commit/3e834293d47ab2761a7aa013916e8371871efb7f), [`96beb883a`](https://github.com/withastro/astro/commit/96beb883ad87f8bbf5b2f57e14a743763d2a6f58), [`997a0db8a`](https://github.com/withastro/astro/commit/997a0db8a4e3851edd69384cf5eadbb969e1d547), [`80f1494cd`](https://github.com/withastro/astro/commit/80f1494cdaf72e58a420adb4f7c712d4089e1923), [`0f0625504`](https://github.com/withastro/astro/commit/0f0625504145f18cba7dc6cf20291cb2abddc5a9), [`e1ae56e72`](https://github.com/withastro/astro/commit/e1ae56e724d0f83db1230359e06cd6bc26f5fa26), [`f32d093a2`](https://github.com/withastro/astro/commit/f32d093a280faafff024228c12bb438156ec34d7), [`f01eb585e`](https://github.com/withastro/astro/commit/f01eb585e7c972d940761309b1595f682b6922d2), [`b76c166bd`](https://github.com/withastro/astro/commit/b76c166bdd8e28683f62806aef968d1e0c3b06d9), [`a87cbe400`](https://github.com/withastro/astro/commit/a87cbe400314341d5f72abf86ea264e6b47c091f), [`866ed4098`](https://github.com/withastro/astro/commit/866ed4098edffb052239cdb26e076cf8db61b1d9), [`767eb6866`](https://github.com/withastro/astro/commit/767eb68666eb777965baa0d6ade20bbafecf95bf), [`32669cd47`](https://github.com/withastro/astro/commit/32669cd47555e9c7433c3998a2b6e624dfb2d8e9)]:
  - astro@3.0.0
  - @astrojs/underscore-redirects@0.3.0

## 7.0.0-rc.3

### Major Changes

- [#8179](https://github.com/withastro/astro/pull/8179) [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7) Thanks [@matthewp](https://github.com/matthewp)! - Astro 3.0 Release Candidate

### Patch Changes

- Updated dependencies [[`adf9fccfd`](https://github.com/withastro/astro/commit/adf9fccfdda107c2224558f1c2e6a77847ac0a8a), [`582132328`](https://github.com/withastro/astro/commit/5821323285646aee7ff9194a505f708028e4db57), [`81545197a`](https://github.com/withastro/astro/commit/81545197a32fd015d763fc386c8b67e0e08b7393), [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7), [`be6bbd2c8`](https://github.com/withastro/astro/commit/be6bbd2c86b9bf5268e765bb937dda00ff15781a), [`42785c7b7`](https://github.com/withastro/astro/commit/42785c7b784b151e6d582570e5d74482129e8eb8), [`95120efbe`](https://github.com/withastro/astro/commit/95120efbe817163663492181cbeb225849354493), [`2ae9d37f0`](https://github.com/withastro/astro/commit/2ae9d37f0a9cb21ab288d3c30aecb6d84db87788), [`f003e7364`](https://github.com/withastro/astro/commit/f003e7364317cafdb8589913b26b28e928dd07c9), [`732111cdc`](https://github.com/withastro/astro/commit/732111cdce441639db31f40f621df48442d00969), [`33b8910cf`](https://github.com/withastro/astro/commit/33b8910cfdce5713891c50a84a0a8fe926311710), [`e79e3779d`](https://github.com/withastro/astro/commit/e79e3779df0ad35253abcdb931d622847d9adb12), [`179796405`](https://github.com/withastro/astro/commit/179796405e053b559d83f84507e5a465861a029a), [`a87cbe400`](https://github.com/withastro/astro/commit/a87cbe400314341d5f72abf86ea264e6b47c091f), [`767eb6866`](https://github.com/withastro/astro/commit/767eb68666eb777965baa0d6ade20bbafecf95bf)]:
  - astro@3.0.0-rc.5
  - @astrojs/underscore-redirects@0.3.0-rc.1

## 7.0.0-beta.2

### Major Changes

- [#8078](https://github.com/withastro/astro/pull/8078) [`2540feedb`](https://github.com/withastro/astro/commit/2540feedb06785d5a20eecc3668849f147d778d4) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - The configuration `build.split` and `build.excludeMiddleware` are deprecated.

  You can now configure this behavior using `functionPerRoute` in your Cloudflare integration config:

  ```diff
  import {defineConfig} from "astro/config";
  import cloudflare from '@astrojs/cloudflare';

  export default defineConfig({
  -    build: {
  -        split: true
  -    },
  -    adapter: cloudflare()
  +    adapter: cloudflare({
  +        mode: 'directory',
  +        functionPerRoute: true
  +    })
  })
  ```

### Patch Changes

- [#8079](https://github.com/withastro/astro/pull/8079) [`7b77b34ce`](https://github.com/withastro/astro/commit/7b77b34cef8b46c4d14ecf9e5fcb45fb276331ec) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Sync Astro Asset support across both modes

- Updated dependencies [[`2484dc408`](https://github.com/withastro/astro/commit/2484dc4080e5cd84b9a53648a1de426d7c907be2), [`c2c71d90c`](https://github.com/withastro/astro/commit/c2c71d90c264a2524f99e0373ab59015f23ad4b1), [`7177f7579`](https://github.com/withastro/astro/commit/7177f7579b6e866f0fd895b3fd079d8ba330b1a9), [`097a8e4e9`](https://github.com/withastro/astro/commit/097a8e4e916c7df18eafdaa6c8d6ce2991c17ab6), [`dbc97b121`](https://github.com/withastro/astro/commit/dbc97b121f42583728f1cdfdbf14575fda943f5b), [`2540feedb`](https://github.com/withastro/astro/commit/2540feedb06785d5a20eecc3668849f147d778d4), [`ea7ff5177`](https://github.com/withastro/astro/commit/ea7ff5177dbcd7b2508cb1eef1b22b8ee1f47079), [`68efd4a8b`](https://github.com/withastro/astro/commit/68efd4a8b29f248397667801465b3152dc98e9a7), [`0e0fa605d`](https://github.com/withastro/astro/commit/0e0fa605d109cc91e08a1ae1cc560ea240fe631b), [`5208a3c8f`](https://github.com/withastro/astro/commit/5208a3c8fefcec7694857fb344af351f4631fc34), [`8a5b0c1f3`](https://github.com/withastro/astro/commit/8a5b0c1f3a4be6bb62db66ec70144109ff5b4c59), [`d6b494376`](https://github.com/withastro/astro/commit/d6b4943764989c0e89df2d6875cd19691566dfb3), [`4477bb41c`](https://github.com/withastro/astro/commit/4477bb41c8ed688785c545731ef5b184b629f4e5), [`3e834293d`](https://github.com/withastro/astro/commit/3e834293d47ab2761a7aa013916e8371871efb7f), [`b76c166bd`](https://github.com/withastro/astro/commit/b76c166bdd8e28683f62806aef968d1e0c3b06d9)]:
  - astro@3.0.0-beta.3
  - @astrojs/underscore-redirects@0.3.0-beta.0

## 7.0.0-beta.1

### Minor Changes

- [#7846](https://github.com/withastro/astro/pull/7846) [`ea30a9d4f`](https://github.com/withastro/astro/commit/ea30a9d4f2d7a12345869e971f3051cf803dbe74) Thanks [@schummar](https://github.com/schummar)! - More efficient \_routes.json

### Patch Changes

- Updated dependencies [[`65c354969`](https://github.com/withastro/astro/commit/65c354969e6fe0ef6d622e8f4c545e2f717ce8c6), [`3c3100851`](https://github.com/withastro/astro/commit/3c31008519ce68b5b1b1cb23b71fbe0a2d506882), [`34cb20021`](https://github.com/withastro/astro/commit/34cb2002161ba88df6bcb72fecfd12ed867c134b), [`7bd1b86f8`](https://github.com/withastro/astro/commit/7bd1b86f85c06fdde0a1ed9146d01bac69990671), [`519a1c4e8`](https://github.com/withastro/astro/commit/519a1c4e8407c7abcb8d879b67a9f4b960652cae), [`70f34f5a3`](https://github.com/withastro/astro/commit/70f34f5a355f42526ee9e5355f3de8e510002ea2), [`0f637c71e`](https://github.com/withastro/astro/commit/0f637c71e511cb4c51712128d217a26c8eee4d40), [`866ed4098`](https://github.com/withastro/astro/commit/866ed4098edffb052239cdb26e076cf8db61b1d9), [`5b1e39ef6`](https://github.com/withastro/astro/commit/5b1e39ef6ec6dcebea96584f95d9530bd9aa715d)]:
  - astro@3.0.0-beta.1
  - @astrojs/underscore-redirects@0.3.0-beta.0

## 7.0.0-beta.0

### Major Changes

- [`1eae2e3f7`](https://github.com/withastro/astro/commit/1eae2e3f7d693c9dfe91c8ccfbe606d32bf2fb81) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 16. The lowest supported version by Astro and all integrations is now v18.14.1. As a reminder, Node 16 will be deprecated on the 11th September 2023.

- [`c022a4217`](https://github.com/withastro/astro/commit/c022a4217a805d223c1494e9eda4e48bbf810388) Thanks [@Princesseuh](https://github.com/Princesseuh)! - When using an adapter that supports neither Squoosh or Sharp, Astro will now automatically use an image service that does not support processing, but still provides the other benefits of `astro:assets` such as enforcing `alt`, no CLS etc to users

### Minor Changes

- [`9b4f70a62`](https://github.com/withastro/astro/commit/9b4f70a629f55e461759ba46f68af7097a2e9215) Thanks [@ematipico](https://github.com/ematipico)! - Introduced the concept of feature map. A feature map is a list of features that are built-in in Astro, and an Adapter
  can tell Astro if it can support it.

  ```ts
  import { AstroIntegration } from './astro';

  function myIntegration(): AstroIntegration {
    return {
      name: 'astro-awesome-list',
      // new feature map
      supportedAstroFeatures: {
        hybridOutput: 'experimental',
        staticOutput: 'stable',
        serverOutput: 'stable',
        assets: {
          supportKind: 'stable',
          isSharpCompatible: false,
          isSquooshCompatible: false,
        },
      },
    };
  }
  ```

### Patch Changes

- Updated dependencies [[`1eae2e3f7`](https://github.com/withastro/astro/commit/1eae2e3f7d693c9dfe91c8ccfbe606d32bf2fb81), [`76ddef19c`](https://github.com/withastro/astro/commit/76ddef19ccab6e5f7d3a5740cd41acf10e334b38), [`9b4f70a62`](https://github.com/withastro/astro/commit/9b4f70a629f55e461759ba46f68af7097a2e9215), [`3fdf509b2`](https://github.com/withastro/astro/commit/3fdf509b2731a9b2f972d89291e57cf78d62c769), [`2f951cd40`](https://github.com/withastro/astro/commit/2f951cd403dfcc2c3ca6aae618ae3e1409516e32), [`c022a4217`](https://github.com/withastro/astro/commit/c022a4217a805d223c1494e9eda4e48bbf810388), [`67becaa58`](https://github.com/withastro/astro/commit/67becaa580b8f787df58de66b7008b7098f1209c), [`bc37331d8`](https://github.com/withastro/astro/commit/bc37331d8154e3e95a8df9131e4e014e78a7a9e7), [`dfc2d93e3`](https://github.com/withastro/astro/commit/dfc2d93e3c645995379358fabbdfa9aab99f43d8), [`3dc1ca2fa`](https://github.com/withastro/astro/commit/3dc1ca2fac8d9965cc5085a5d09e72ed87b4281a), [`1be84dfee`](https://github.com/withastro/astro/commit/1be84dfee3ce8e6f5cc624f99aec4e980f6fde37), [`35f01df79`](https://github.com/withastro/astro/commit/35f01df797d23315f2bee2fc3fd795adb0559c58), [`3fdf509b2`](https://github.com/withastro/astro/commit/3fdf509b2731a9b2f972d89291e57cf78d62c769), [`78de801f2`](https://github.com/withastro/astro/commit/78de801f21fd4ca1653950027d953bf08614566b), [`59d6e569f`](https://github.com/withastro/astro/commit/59d6e569f63e175c97e82e94aa7974febfb76f7c), [`7723c4cc9`](https://github.com/withastro/astro/commit/7723c4cc93298c2e6530e55da7afda048f22cf81), [`fb5cd6b56`](https://github.com/withastro/astro/commit/fb5cd6b56dc27a71366ed5e1ab8bfe9b8f96bac5), [`631b9c410`](https://github.com/withastro/astro/commit/631b9c410d5d66fa384674027ba95d69ebb5063f)]:
  - astro@3.0.0-beta.0
  - @astrojs/underscore-redirects@0.3.0-beta.0

## 6.8.1

### Patch Changes

- [#8190](https://github.com/withastro/astro/pull/8190) [`0be8d9bfa`](https://github.com/withastro/astro/commit/0be8d9bfa9fa811c4b7e15c4ffd2d37c93f856fe) Thanks [@ematipico](https://github.com/ematipico)! - Improve documentation and export the types needed to type the `runtime` object.

- Updated dependencies [[`52606a390`](https://github.com/withastro/astro/commit/52606a3909f9de5ced9b9ba3ba25832f73a8689e)]:
  - astro@2.10.14

## 6.8.0

### Minor Changes

- [#7541](https://github.com/withastro/astro/pull/7541) [`ffcfcddb7`](https://github.com/withastro/astro/commit/ffcfcddb7575030d62b4ef979d46a74425e6d3fe) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - The `getRuntime` utility has been deprecated and should be updated to the new [`Astro.locals`](https://docs.astro.build/en/guides/middleware/#locals) API.

  ```diff
  - import { getRuntime } from '@astrojs/cloudflare/runtime';
  - getRuntime(Astro.request);

  + const runtime = Astro.locals.runtime;
  ```

### Patch Changes

- Updated dependencies [[`1b8d30209`](https://github.com/withastro/astro/commit/1b8d3020990130dabfaaf753db73a32c6e0c896a), [`405913cdf`](https://github.com/withastro/astro/commit/405913cdf20b26407aa351c090f0a0859a4e6f54), [`87d4b1843`](https://github.com/withastro/astro/commit/87d4b18437c7565c48cad4bea81831c2a244ebb8), [`c23377caa`](https://github.com/withastro/astro/commit/c23377caafbc75deb91c33b9678c1b6868ad40ea), [`86bee2812`](https://github.com/withastro/astro/commit/86bee2812185df6e14025e5962a335f51853587b)]:
  - astro@2.10.6

## 6.7.0

### Minor Changes

- [#7846](https://github.com/withastro/astro/pull/7846) [`ea30a9d4f`](https://github.com/withastro/astro/commit/ea30a9d4f2d7a12345869e971f3051cf803dbe74) Thanks [@schummar](https://github.com/schummar)! - More efficient \_routes.json

### Patch Changes

- Updated dependencies [[`5b1e39ef6`](https://github.com/withastro/astro/commit/5b1e39ef6ec6dcebea96584f95d9530bd9aa715d)]:
  - astro@2.10.5

## 6.6.2

### Patch Changes

- [#7568](https://github.com/withastro/astro/pull/7568) [`6ec040761`](https://github.com/withastro/astro/commit/6ec040761ef657df0e0f5ac103788da4b98fa688) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fix a bug where asset redirects caused Cloudflare error

- [#7679](https://github.com/withastro/astro/pull/7679) [`1a6f833c4`](https://github.com/withastro/astro/commit/1a6f833c404ba2e64e3497929b64c863b5a348c8) Thanks [@bluwy](https://github.com/bluwy)! - Fix runtime env var handling

- [#7568](https://github.com/withastro/astro/pull/7568) [`6ec040761`](https://github.com/withastro/astro/commit/6ec040761ef657df0e0f5ac103788da4b98fa688) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fix bug where `.ts` files are not renamed to `.js`

- Updated dependencies [[`cc8e9de88`](https://github.com/withastro/astro/commit/cc8e9de88179d2ed4b70980c60b41448db393429), [`1a6f833c4`](https://github.com/withastro/astro/commit/1a6f833c404ba2e64e3497929b64c863b5a348c8), [`cc0f81c04`](https://github.com/withastro/astro/commit/cc0f81c040e912cff0c09e89327ef1655f96b67d)]:
  - astro@2.8.4

## 6.6.1

### Patch Changes

- Updated dependencies [[`f21357b69`](https://github.com/withastro/astro/commit/f21357b69d94fe8d81f267efddb182d1a3cc678a), [`86e19c7cf`](https://github.com/withastro/astro/commit/86e19c7cf8696e065c1ccdc2eb841ad0a2b61ede)]:
  - @astrojs/underscore-redirects@0.2.0
  - astro@2.8.2

## 6.6.0

### Minor Changes

- [#7464](https://github.com/withastro/astro/pull/7464) [`1a59185dd`](https://github.com/withastro/astro/commit/1a59185ddd393bf8894ec0c981b26d6fecdb3c67) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Split Support in Cloudflare

  Adds support for configuring `build.split` when using the Cloudflare adapter

### Patch Changes

- Updated dependencies [[`9e2426f75`](https://github.com/withastro/astro/commit/9e2426f75637a6318961f483de90b635f3fdadeb), [`cdc28326c`](https://github.com/withastro/astro/commit/cdc28326cf21f305924363e9c8c02ce54b6ff895), [`19c2d43ea`](https://github.com/withastro/astro/commit/19c2d43ea41efdd8741007de0774e7e394f174b0), [`2172dd4f0`](https://github.com/withastro/astro/commit/2172dd4f0dd8f87d1adbc5ae90f44724e66eb964), [`1170877b5`](https://github.com/withastro/astro/commit/1170877b51aaa13203e8c488dcf4e39d1b5553ee)]:
  - astro@2.7.3

## 6.5.1

### Patch Changes

- [#7419](https://github.com/withastro/astro/pull/7419) [`94afaa3e5`](https://github.com/withastro/astro/commit/94afaa3e501f77e919c719937eb1dbfe170e3dc9) Thanks [@TorbjornHoltmon](https://github.com/TorbjornHoltmon)! - Fixed issue with cloudflare runtime `waitUntil` not working as intended.

- Updated dependencies [[`2b34fc492`](https://github.com/withastro/astro/commit/2b34fc49282cbf5bf89de46359b51a67a5c4b8bb), [`89a483520`](https://github.com/withastro/astro/commit/89a4835202f05d9571aeb42740dbe907a8afc28b)]:
  - astro@2.6.6

## 6.5.0

### Minor Changes

- [#7386](https://github.com/withastro/astro/pull/7386) [`6d8aa4b61`](https://github.com/withastro/astro/commit/6d8aa4b61f22df2c5052d06dac8e53bbce73f5f5) Thanks [@beynar](https://github.com/beynar)! - Expose cf metadata and Cloudflare Worker Cache API through `caches` in runtime.

### Patch Changes

- Updated dependencies [[`42baf62e7`](https://github.com/withastro/astro/commit/42baf62e7ca0351a2f2c7d06ec58086f90519bb7), [`1c7b63595`](https://github.com/withastro/astro/commit/1c7b6359563f5e83325121efb2e61915d818a35a)]:
  - astro@2.6.4

## 6.4.0

### Minor Changes

- [#7067](https://github.com/withastro/astro/pull/7067) [`57f8d14c0`](https://github.com/withastro/astro/commit/57f8d14c027c30919363e12c664ccff4ed64d0fc) Thanks [@matthewp](https://github.com/matthewp)! - Support for experimental redirects

  This adds support for the redirects RFC in the Cloudflare adapter. No changes are necessary, simply use configured redirects and the adapter will update your `_redirects` file.

### Patch Changes

- [#7260](https://github.com/withastro/astro/pull/7260) [`39403c32f`](https://github.com/withastro/astro/commit/39403c32faea58399c61d3344b770f195be60d5b) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Unflags support for `output: 'hybrid'` mode, which enables pre-rendering by default. The additional `experimental.hybridOutput` flag can be safely removed from your configuration.

- Updated dependencies [[`57f8d14c0`](https://github.com/withastro/astro/commit/57f8d14c027c30919363e12c664ccff4ed64d0fc), [`414eb19d2`](https://github.com/withastro/astro/commit/414eb19d2fcb55758f9d053076773b11b62f4c97), [`a7e2b37ff`](https://github.com/withastro/astro/commit/a7e2b37ff73871c46895c615846a86a539f45330), [`dd1a6b6c9`](https://github.com/withastro/astro/commit/dd1a6b6c941aeb7af934bd12db22412af262f5a1), [`d72cfa7ca`](https://github.com/withastro/astro/commit/d72cfa7cad758192163712ceb269405659fd14bc), [`144813f73`](https://github.com/withastro/astro/commit/144813f7308dcb9de64ebe3f0f2c6cba9ad81eb1), [`b5213654b`](https://github.com/withastro/astro/commit/b5213654b1b7f3ba573a48d3be688b2bdde7870f), [`e3b8c6296`](https://github.com/withastro/astro/commit/e3b8c62969d680d1915a122c610d281d6711aa63), [`890a2bc98`](https://github.com/withastro/astro/commit/890a2bc9891a2449ab99b01b65468f6dddba6b12), [`39403c32f`](https://github.com/withastro/astro/commit/39403c32faea58399c61d3344b770f195be60d5b), [`101f03209`](https://github.com/withastro/astro/commit/101f032098148b3daaac8d46ff1e535b79232e43)]:
  - astro@2.6.0

## 6.3.0

### Minor Changes

- [#7092](https://github.com/withastro/astro/pull/7092) [`2a1fa09b3`](https://github.com/withastro/astro/commit/2a1fa09b3199ae35801dd0d02ae293198d9a7382) Thanks [@johannesspohr](https://github.com/johannesspohr)! - Add `worked` and `worker` import condition for worker bundling

### Patch Changes

- [#6991](https://github.com/withastro/astro/pull/6991) [`719002ca5`](https://github.com/withastro/astro/commit/719002ca5b128744fb4316d4a52c5dcd46a42759) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Enable experimental support for hybrid SSR with pre-rendering enabled by default

  **astro.config.mjs**

  ```js
  import { defineConfig } from 'astro/config';
  export defaultdefineConfig({
     output: 'hybrid',
         experimental: {
         hybridOutput: true,
     },
  })
  ```

  Then add `export const prerender =  false` to any page or endpoint you want to opt-out of pre-rendering.

  **src/pages/contact.astro**

  ```astro
  ---
  export const prerender = false;

  if (Astro.request.method === 'POST') {
    // handle form submission
  }
  ---

  <form method="POST">
    <input type="text" name="name" />
    <input type="email" name="email" />
    <button type="submit">Submit</button>
  </form>
  ```

- [#7101](https://github.com/withastro/astro/pull/7101) [`2994bc52d`](https://github.com/withastro/astro/commit/2994bc52d360bf7ca3681c5f6976e64577cf5209) Thanks [@bluwy](https://github.com/bluwy)! - Always build edge/worker runtime with Vite `webworker` SSR target

- [#7104](https://github.com/withastro/astro/pull/7104) [`826e02890`](https://github.com/withastro/astro/commit/826e0289005f645b902375b98d5549c6a95ccafa) Thanks [@bluwy](https://github.com/bluwy)! - Specify `"files"` field to only publish necessary files

- Updated dependencies [[`4516d7b22`](https://github.com/withastro/astro/commit/4516d7b22c5979cde4537f196b53ae2826ba9561), [`e186ecc5e`](https://github.com/withastro/astro/commit/e186ecc5e292de8c6a2c441a2d588512c0813068), [`c6d7ebefd`](https://github.com/withastro/astro/commit/c6d7ebefdd554a9ef29cfeb426ac55cab80d6473), [`914c439bc`](https://github.com/withastro/astro/commit/914c439bccee9fec002c6d92beaa501c398e62ac), [`e9fc2c221`](https://github.com/withastro/astro/commit/e9fc2c2213036d47cd30a47a6cdad5633481a0f8), [`075eee08f`](https://github.com/withastro/astro/commit/075eee08f2e2b0baea008b97f3523f2cb937ee44), [`719002ca5`](https://github.com/withastro/astro/commit/719002ca5b128744fb4316d4a52c5dcd46a42759), [`fc52681ba`](https://github.com/withastro/astro/commit/fc52681ba2f8fe8bcd92eeedf3c6a52fd86a390e), [`fb84622af`](https://github.com/withastro/astro/commit/fb84622af04f795de8d17f24192de105f70fe910), [`cada10a46`](https://github.com/withastro/astro/commit/cada10a466f81f8edb0aa664f9cffdb6b5b8f307), [`cd410c5eb`](https://github.com/withastro/astro/commit/cd410c5eb71f825259279c27c4c39d0ad282c3f0), [`73ec6f6c1`](https://github.com/withastro/astro/commit/73ec6f6c16cadb71dafe9f664f0debde072c3173), [`410428672`](https://github.com/withastro/astro/commit/410428672ed97bba7ca0b3352c1a7ee564921462), [`763ff2d1e`](https://github.com/withastro/astro/commit/763ff2d1e44f54b899d7c65386f1b4b877c95737), [`c1669c001`](https://github.com/withastro/astro/commit/c1669c0011eecfe65a459d727848c18c189a54ca), [`3d525efc9`](https://github.com/withastro/astro/commit/3d525efc95cfb2deb5d9e04856d02965d66901c9)]:
  - astro@2.5.0

## 6.2.4

### Patch Changes

- [#6925](https://github.com/withastro/astro/pull/6925) [`d11d18595`](https://github.com/withastro/astro/commit/d11d1859518f9fdc94390aab9be29f8667bb27cb) Thanks [@Yan-Thomas](https://github.com/Yan-Thomas)! - Fix missing code language in Cloudflare README

- Updated dependencies [[`a98df9374`](https://github.com/withastro/astro/commit/a98df9374dec65c678fa47319cb1481b1af123e2), [`50975f2ea`](https://github.com/withastro/astro/commit/50975f2ea3a59f9e023cc631a9372c0c7986eec9), [`ebae1eaf8`](https://github.com/withastro/astro/commit/ebae1eaf87f49399036033c673b513338f7d9c42), [`dc062f669`](https://github.com/withastro/astro/commit/dc062f6695ce577dc569781fc0678c903012c336)]:
  - astro@2.3.3

## 6.2.3

### Patch Changes

- [#6222](https://github.com/withastro/astro/pull/6222) [`081b2402c`](https://github.com/withastro/astro/commit/081b2402cfb48b5eb8dbd02664d8af2f7c798edf) Thanks [@AirBorne04](https://github.com/AirBorne04)! - add option to compile unminified code

- Updated dependencies [[`b89042553`](https://github.com/withastro/astro/commit/b89042553ec45d5f6bc71747e0f3470ba969e679)]:
  - astro@2.3.2

## 6.2.2

### Patch Changes

- [#6550](https://github.com/withastro/astro/pull/6550) [`2c829fdf6`](https://github.com/withastro/astro/commit/2c829fdf65bcb91485837c9cfb5a3b453c6fccc7) Thanks [@RichiCoder1](https://github.com/RichiCoder1)! - fix `config.base` trimming logic for cloudflare integration `_routes.json` generation

- Updated dependencies [[`04dddd783`](https://github.com/withastro/astro/commit/04dddd783da3235aa9ed523d2856adf86b792b5f), [`ea9b3dd72`](https://github.com/withastro/astro/commit/ea9b3dd72b98b3f5a542ca24a275f673faa6c7c5), [`bf024cb34`](https://github.com/withastro/astro/commit/bf024cb3429c5929d98378108230bc946a376b17), [`22955b895`](https://github.com/withastro/astro/commit/22955b895ce4343e282355db64b3a5c1415f3944), [`f413446a8`](https://github.com/withastro/astro/commit/f413446a859e497395b3612e44d1540cc6b9dad7), [`90e5f87d0`](https://github.com/withastro/astro/commit/90e5f87d03215a833bb6ac91f9548670a25ce659), [`388190102`](https://github.com/withastro/astro/commit/3881901028cbb586f5a4de1b4953e2d6730458ab), [`035c0c4df`](https://github.com/withastro/astro/commit/035c0c4df2a623bcc2f2a1cb9e490df35fa29adc), [`f112c12b1`](https://github.com/withastro/astro/commit/f112c12b15dfbb278d66699f54809674dd1bded0), [`689884251`](https://github.com/withastro/astro/commit/68988425119255382f94c983796574050006f003), [`fa132e35c`](https://github.com/withastro/astro/commit/fa132e35c23f2cfe368fd0a7239584a2bc5c4f12), [`f5fddafc2`](https://github.com/withastro/astro/commit/f5fddafc248bb1ef57b7349bfecc25539ae2b5ea), [`283734525`](https://github.com/withastro/astro/commit/28373452503bc6ca88221ffd39a5590e015e4d71), [`66858f1f2`](https://github.com/withastro/astro/commit/66858f1f238a0edf6ded2b0f693bc738785d5aa3), [`6c465e958`](https://github.com/withastro/astro/commit/6c465e958e088ff55e5b895e67c64c0dfd4277a6)]:
  - astro@2.1.4

## 6.2.1

### Patch Changes

- [#6531](https://github.com/withastro/astro/pull/6531) [`4ddf34893`](https://github.com/withastro/astro/commit/4ddf3489384ed53f25df190a3478da44bd38600e) Thanks [@matthewp](https://github.com/matthewp)! - Remove false-positive warnings from Cloudflare's build.

  Cloudflare includes warnings when it bundles the already-built output from astro.build. Those warnings are mostly due to `"sideEffects": false` packages that are included in the Vite built output because they are marked as external. Rollup will remove unused imports from these packages but will not remove the actual import, causing the false-positive warning.

- [#6473](https://github.com/withastro/astro/pull/6473) [`1c3e8f6c3`](https://github.com/withastro/astro/commit/1c3e8f6c3b839087aa51de2e2fb665cd907f2847) Thanks [@RichiCoder1](https://github.com/RichiCoder1)! - fix automatic routes generation not respecting config.base

- [#6494](https://github.com/withastro/astro/pull/6494) [`a13e9d7e3`](https://github.com/withastro/astro/commit/a13e9d7e33baccf51e7d4815f99b481ad174bc57) Thanks [@Yan-Thomas](https://github.com/Yan-Thomas)! - Consistency improvements to several package descriptions

- Updated dependencies [[`acf78c5e2`](https://github.com/withastro/astro/commit/acf78c5e271ec3d4f589782078e2a2044cc1c391), [`04e624d06`](https://github.com/withastro/astro/commit/04e624d062c6ce385f6293afba26f3942c2290c6), [`cc90d7219`](https://github.com/withastro/astro/commit/cc90d72197e1139195e9545105b9a1d339f38e1b), [`a9a6ae298`](https://github.com/withastro/astro/commit/a9a6ae29812339ea00f3b9afd3de09bd9d3733a9), [`6a7cf0712`](https://github.com/withastro/astro/commit/6a7cf0712da23e2c095f4bc4f2512e618bceb38e), [`bfd67ea74`](https://github.com/withastro/astro/commit/bfd67ea749dbc6ffa7c9a671fcc48bea6c04a075), [`f6eddffa0`](https://github.com/withastro/astro/commit/f6eddffa0414d54767e9f9e1ee5a936b8a20146b), [`c63874090`](https://github.com/withastro/astro/commit/c6387409062f1d7c2afc93319748ad57086837c5), [`d637d1ea5`](https://github.com/withastro/astro/commit/d637d1ea5b347b9c724adc895c9006c696ac8fc8), [`637f9bc72`](https://github.com/withastro/astro/commit/637f9bc728ea7d56fc82a862d761385f0dcd9528), [`77a046e88`](https://github.com/withastro/astro/commit/77a046e886c370b737208574b6934f5a1cf2b177)]:
  - astro@2.1.3

## 6.2.0

### Minor Changes

- [#6213](https://github.com/withastro/astro/pull/6213) [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated compilation settings to disable downlevelling for Node 14

### Patch Changes

- Updated dependencies [[`fec583909`](https://github.com/withastro/astro/commit/fec583909ab62829dc0c1600e2387979365f2b94), [`b087b83fe`](https://github.com/withastro/astro/commit/b087b83fe266c431fe34a07d5c2293cc4ab011c6), [`694918a56`](https://github.com/withastro/astro/commit/694918a56b01104831296be0c25456135a63c784), [`a20610609`](https://github.com/withastro/astro/commit/a20610609863ae3b48afe96819b8f11ae4f414d5), [`a4a74ab70`](https://github.com/withastro/astro/commit/a4a74ab70cd2aa0d812a1f6b202c4e240a8913bf), [`75921b3cd`](https://github.com/withastro/astro/commit/75921b3cd916d439f6392c487c21532fde35ed13), [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808)]:
  - astro@2.1.0

## 6.1.3

### Patch Changes

- [#6208](https://github.com/withastro/astro/pull/6208) [`79f49acbe`](https://github.com/withastro/astro/commit/79f49acbe13673bfc27e794bcfae518f38c4a4fe) Thanks [@mfrachet](https://github.com/mfrachet)! - Fix path file that was generated outside the functions folder

- Updated dependencies [[`79783fc01`](https://github.com/withastro/astro/commit/79783fc0181153a8e379d3f023422510a7467ead), [`baa2dbb3b`](https://github.com/withastro/astro/commit/baa2dbb3b5678b2bd56fb80df99d386f32e274b7), [`8b7cb64da`](https://github.com/withastro/astro/commit/8b7cb64dadfca93c65d62df54754633d398cb2ed)]:
  - astro@2.0.11

## 6.1.2

### Patch Changes

- [#6075](https://github.com/withastro/astro/pull/6075) [`45b41d98f`](https://github.com/withastro/astro/commit/45b41d98f50dc9f76a5004a8b3346f393f1a6cb6) Thanks [@NachoVazquez](https://github.com/NachoVazquez)! - Uses config root path as location for Cloudflare Pages Functions

- Updated dependencies [[`f6fc662c3`](https://github.com/withastro/astro/commit/f6fc662c3c59d164584c6287a930fcd1c9086ee6), [`592386b75`](https://github.com/withastro/astro/commit/592386b75541f3b7f7d95c631f86024b7e2d314d), [`1b591a143`](https://github.com/withastro/astro/commit/1b591a1431b44eacd239ed8f76809916cabca1db), [`bf8d7366a`](https://github.com/withastro/astro/commit/bf8d7366acb57e1b21181cc40fff55a821d8119e), [`ec38a8921`](https://github.com/withastro/astro/commit/ec38a8921f02a275949abcababe1b8afdf8184a2), [`f20a85b64`](https://github.com/withastro/astro/commit/f20a85b642994f240d8c94260fc55ffa1fd14294), [`9f22ac3d0`](https://github.com/withastro/astro/commit/9f22ac3d097ef2cb3b2bbe5343b8a8a49d83425d), [`cee70f5c6`](https://github.com/withastro/astro/commit/cee70f5c6ac9b0d2edc1f8a6f8f5043605576026), [`ac7fb04d6`](https://github.com/withastro/astro/commit/ac7fb04d6b162f28a337918138d5737e2c0fffad), [`d1f5611fe`](https://github.com/withastro/astro/commit/d1f5611febfd020cca4078c71bafe599015edd16), [`2189170be`](https://github.com/withastro/astro/commit/2189170be523f74f244e84ccab22c655219773ce), [`32abe49bd`](https://github.com/withastro/astro/commit/32abe49bd073417b480b1b990f432a837c12eb6f)]:
  - astro@2.0.7

## 6.1.1

### Patch Changes

- [#6046](https://github.com/withastro/astro/pull/6046) [`df3201165`](https://github.com/withastro/astro/commit/df320116528e00ab082396531b4deffbb0707b78) Thanks [@matthewp](https://github.com/matthewp)! - Cloudflare fix for building to directory mode

- Updated dependencies [[`41e97158b`](https://github.com/withastro/astro/commit/41e97158ba90d23d346b6e3ff6c7c14b5ecbe903), [`e779c6242`](https://github.com/withastro/astro/commit/e779c6242418d1d4102e683ca5b851b764c89688)]:
  - astro@2.0.4

## 6.1.0

### Minor Changes

- [#5914](https://github.com/withastro/astro/pull/5914) [`088f5194c`](https://github.com/withastro/astro/commit/088f5194c55a6ec15b2eaf2cfb97f9ef45a24a33) Thanks [@AngusMorton](https://github.com/AngusMorton)! - Re-enable streaming in Cloudflare Pages.

### Patch Changes

- [#5993](https://github.com/withastro/astro/pull/5993) [`9855db676`](https://github.com/withastro/astro/commit/9855db676e61ad616c64382adeaa8c74de05f7e1) Thanks [@matthewp](https://github.com/matthewp)! - Support for prerendering in the Cloudflare integration

  This fixes prerendering in the Cloudflare adapter. Now any prerendered routes are added to the `_routes.json` config so that the worker script is skipped for those routes.

- Updated dependencies [[`b53e0717b`](https://github.com/withastro/astro/commit/b53e0717b7f6b042baaeec7f87999e99c76c031c), [`60b32d585`](https://github.com/withastro/astro/commit/60b32d58565d87e87573eb268408293fc28ec657), [`883e0cc29`](https://github.com/withastro/astro/commit/883e0cc29968d51ed6c7515be035a40b28bafdad), [`dabce6b8c`](https://github.com/withastro/astro/commit/dabce6b8c684f851c3535f8acead06cbef6dce2a), [`aedf23f85`](https://github.com/withastro/astro/commit/aedf23f8582e32a6b94b81ddba9b323831f2b22a)]:
  - astro@2.0.2

## 6.0.0

### Major Changes

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove `astro:build:start` backwards compatibility code

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a `peerDependency` of integrations

  This marks `astro` as a `peerDependency` of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.

### Patch Changes

- Updated dependencies [[`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b), [`16dc36a87`](https://github.com/withastro/astro/commit/16dc36a870df47a4151a8ed2d91d0bd1bb812458), [`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`05caf445d`](https://github.com/withastro/astro/commit/05caf445d4d2728f1010aeb2179a9e756c2fd17d), [`49ab4f231`](https://github.com/withastro/astro/commit/49ab4f231c23b34891c3ee86f4b92bf8d6d267a3), [`a342a486c`](https://github.com/withastro/astro/commit/a342a486c2831461e24e6c2f1ca8a9d3e15477b6), [`8fb28648f`](https://github.com/withastro/astro/commit/8fb28648f66629741cb976bfe34ccd9d8f55661e), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ce5c5dbd4`](https://github.com/withastro/astro/commit/ce5c5dbd46afbe738b03600758bf5c35113de522), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`259a539d7`](https://github.com/withastro/astro/commit/259a539d7d70c783330c797794b15716921629cf), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`4987d6f44`](https://github.com/withastro/astro/commit/4987d6f44cfd0d81d88f21f5c380503403dc1e6a), [`304823811`](https://github.com/withastro/astro/commit/304823811eddd8e72aa1d8e2d39b40ab5cda3565), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`55cea0a9d`](https://github.com/withastro/astro/commit/55cea0a9d8c8df91a46590fc04a9ac28089b3432), [`dd56c1941`](https://github.com/withastro/astro/commit/dd56c19411b126439b8bc42d681b6fa8c06e8c61), [`9963c6e4d`](https://github.com/withastro/astro/commit/9963c6e4d50c392c3d1ac4492237020f15ccb1de), [`be901dc98`](https://github.com/withastro/astro/commit/be901dc98c4a7f6b5536540aa8f7ba5108e939a0), [`f6cf92b48`](https://github.com/withastro/astro/commit/f6cf92b48317a19a3840ad781b77d6d3cae143bb), [`e818cc046`](https://github.com/withastro/astro/commit/e818cc0466a942919ea3c41585e231c8c80cb3d0), [`8c100a6fe`](https://github.com/withastro/astro/commit/8c100a6fe6cc652c3799d1622e12c2c969f30510), [`116d8835c`](https://github.com/withastro/astro/commit/116d8835ca9e78f8b5e477ee5a3d737b69f80706), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`7325df412`](https://github.com/withastro/astro/commit/7325df412107fc0e65cd45c1b568fb686708f723), [`16c7d0bfd`](https://github.com/withastro/astro/commit/16c7d0bfd49d2b9bfae45385f506bcd642f9444a), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d), [`2a5786419`](https://github.com/withastro/astro/commit/2a5786419599b8674473c699300172b9aacbae2e), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`a8d3e7924`](https://github.com/withastro/astro/commit/a8d3e79246605d252dcddad159e358e2d79bd624), [`fa8c131f8`](https://github.com/withastro/astro/commit/fa8c131f88ef67d14c62f1c00c97ed74d43a80ac), [`64b8082e7`](https://github.com/withastro/astro/commit/64b8082e776b832f1433ed288e6f7888adb626d0), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`a3a7fc929`](https://github.com/withastro/astro/commit/a3a7fc9298e6d88abb4b7bee1e58f05fa9558cf1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`5fd9208d4`](https://github.com/withastro/astro/commit/5fd9208d447f5ab8909a2188b6c2491a0debd49d), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`899214298`](https://github.com/withastro/astro/commit/899214298cee5f0c975c7245e623c649e1842d73), [`3a00ecb3e`](https://github.com/withastro/astro/commit/3a00ecb3eb4bc44be758c064f2bde6e247e8a593), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0), [`1ca81c16b`](https://github.com/withastro/astro/commit/1ca81c16b8b66236e092e6eb6ec3f73f5668421c), [`b66d7195c`](https://github.com/withastro/astro/commit/b66d7195c17a55ea0931bc3744888bd4f5f01ce6)]:
  - astro@2.0.0

## 6.0.0-beta.1

<details>
<summary>See changes in 6.0.0-beta.1</summary>

### Major Changes

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a `peerDependency` of integrations

  This marks `astro` as a `peerDependency` of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.

### Patch Changes

- Updated dependencies [[`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0)]:
  - astro@2.0.0-beta.2

</details>

## 6.0.0-beta.0

<details>
<summary>See changes in 6.0.0-beta.0</summary>

### Major Changes

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove `astro:build:start` backwards compatibility code

### Patch Changes

- Updated dependencies [[`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`8fb28648f`](https://github.com/withastro/astro/commit/8fb28648f66629741cb976bfe34ccd9d8f55661e), [`dd56c1941`](https://github.com/withastro/astro/commit/dd56c19411b126439b8bc42d681b6fa8c06e8c61), [`f6cf92b48`](https://github.com/withastro/astro/commit/f6cf92b48317a19a3840ad781b77d6d3cae143bb), [`16c7d0bfd`](https://github.com/withastro/astro/commit/16c7d0bfd49d2b9bfae45385f506bcd642f9444a), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b)]:
  - astro@2.0.0-beta.0

</details>

## 5.0.0

### Patch Changes

- Updated dependencies [[`d85ec7484`](https://github.com/withastro/astro/commit/d85ec7484ce14a4c7d3f480da8f38fcb9aff388f), [`d2960984c`](https://github.com/withastro/astro/commit/d2960984c59af7b60a3ea472c6c58fb00534a8e6), [`31ec84797`](https://github.com/withastro/astro/commit/31ec8479721a1cd65538ec041458c5ffe8f50ee9), [`5ec0f6ed5`](https://github.com/withastro/astro/commit/5ec0f6ed55b0a14a9663a90a03428345baf126bd), [`dced4a8a2`](https://github.com/withastro/astro/commit/dced4a8a2657887ec569860d9862d20f695dc23a), [`6b156dd3b`](https://github.com/withastro/astro/commit/6b156dd3b467884839a571c53114aadf26fa4b0b)]:
  - astro@1.7.0

## 4.1.1

### Patch Changes

- [#5534](https://github.com/withastro/astro/pull/5534) [`fabd9124b`](https://github.com/withastro/astro/commit/fabd9124bd3e654e885054f30e9c0d01eabf0470) Thanks [@bluwy](https://github.com/bluwy)! - Update esbuild dependency

- Updated dependencies [[`9082a850e`](https://github.com/withastro/astro/commit/9082a850eef4ab0187fc3bfdd5a377f0c7040070), [`4f7f20616`](https://github.com/withastro/astro/commit/4f7f20616ed2b63f94ebf43bc5fdc1be55062a94), [`05915fec0`](https://github.com/withastro/astro/commit/05915fec01a51f27ab5051644f01e6112ecf06bc), [`1aeabe417`](https://github.com/withastro/astro/commit/1aeabe417077505bc0cdb8d2e47366ddbc616072), [`795f00f73`](https://github.com/withastro/astro/commit/795f00f73c549727e05d5b7bf0e39cce87add4e7), [`2c836b9d1`](https://github.com/withastro/astro/commit/2c836b9d1283a0707128d172e92ee2bba767486c), [`8f3f67c96`](https://github.com/withastro/astro/commit/8f3f67c96aee63be64de77f374293761ff73f6ce)]:
  - astro@1.6.14

## 4.1.0

### Minor Changes

- [#5347](https://github.com/withastro/astro/pull/5347) [`743000cc7`](https://github.com/withastro/astro/commit/743000cc70274a2d2fed01c72e2ac51aa6b876a6) Thanks [@AirBorne04](https://github.com/AirBorne04)! - Now building for Cloudflare directory mode takes advantage of the standard asset handling from Cloudflare Pages, and therefore does not call a function script to deliver static assets anymore.
  Also supports the use of `_routes.json`, `_redirects` and `_headers` files when placed into the `public` folder.

### Patch Changes

- Updated dependencies [[`936c1e411`](https://github.com/withastro/astro/commit/936c1e411d77c69b2b60a061c54704200716800a), [`4b188132e`](https://github.com/withastro/astro/commit/4b188132ef68f8d9951cec86418ef50bb4df4a96), [`f5ed630bc`](https://github.com/withastro/astro/commit/f5ed630bca05ebbfcc6ac994ced3911e41daedcc)]:
  - astro@1.6.11

## 4.0.1

### Patch Changes

- [#5301](https://github.com/withastro/astro/pull/5301) [`a79a37cad`](https://github.com/withastro/astro/commit/a79a37cad549b21f91599ff86899e456d9dcc7df) Thanks [@bluwy](https://github.com/bluwy)! - Fix environment variables usage in worker output and warn if environment variables are accessedd too early

- Updated dependencies [[`88c1bbe3a`](https://github.com/withastro/astro/commit/88c1bbe3a71f85e92f42f13d0f310c6b2a264ade), [`a79a37cad`](https://github.com/withastro/astro/commit/a79a37cad549b21f91599ff86899e456d9dcc7df)]:
  - astro@1.6.5

## 4.0.0

### Major Changes

- [#5290](https://github.com/withastro/astro/pull/5290) [`b2b291d29`](https://github.com/withastro/astro/commit/b2b291d29143703cece0d12c8e74b2e1151d2061) Thanks [@matthewp](https://github.com/matthewp)! - Handle base configuration in adapters

  This allows adapters to correctly handle `base` configuration. Internally Astro now matches routes when the URL includes the `base`.

  Adapters now also have access to the `removeBase` method which will remove the `base` from a pathname. This is useful to look up files for static assets.

### Patch Changes

- Updated dependencies [[`b2b291d29`](https://github.com/withastro/astro/commit/b2b291d29143703cece0d12c8e74b2e1151d2061), [`97e2b6ad7`](https://github.com/withastro/astro/commit/97e2b6ad7a6fa23e82be28b2f57cdf3f85fab112), [`4af4d8fa0`](https://github.com/withastro/astro/commit/4af4d8fa0035130fbf31c82d72777c3679bc1ca5), [`f6add3924`](https://github.com/withastro/astro/commit/f6add3924d5cd59925a6ea4bf7f2f731709bc893), [`247eb7411`](https://github.com/withastro/astro/commit/247eb7411f429317e5cd7d401a6660ee73641313)]:
  - astro@1.6.4

## 3.1.2

### Patch Changes

- [#5230](https://github.com/withastro/astro/pull/5230) [`69a532ab6`](https://github.com/withastro/astro/commit/69a532ab60a85d30c2395969593c4d38f9a2fbbe) Thanks [@matthewp](https://github.com/matthewp)! - Exports new runtime entrypoint's types

## 3.1.1

### Patch Changes

- [#5103](https://github.com/withastro/astro/pull/5103) [`d151d9f3f`](https://github.com/withastro/astro/commit/d151d9f3f29c0a57c59b8029a18717808ccc7f8f) Thanks [@AirBorne04](https://github.com/AirBorne04)! - enable access to Cloudflare runtime [KV, R2, Durable Objects]
  - access native Cloudflare runtime through `import { getRuntime } from "@astrojs/cloudflare/runtime"`; now you can call `getRuntime(Astro.request)` and get access to the runtime environment.

## 3.1.0

### Minor Changes

- [#5056](https://github.com/withastro/astro/pull/5056) [`e55af8a23`](https://github.com/withastro/astro/commit/e55af8a23233b6335f45b7a04b9d026990fb616c) Thanks [@matthewp](https://github.com/matthewp)! - # New build configuration

  The ability to customize SSR build configuration more granularly is now available in Astro. You can now customize the output folder for `server` (the server code for SSR), `client` (your client-side JavaScript and assets), and `serverEntry` (the name of the entrypoint server module). Here are the defaults:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    output: 'server',
    build: {
      server: './dist/server/',
      client: './dist/client/',
      serverEntry: 'entry.mjs',
    },
  });
  ```

  These new configuration options are only supported in SSR mode and are ignored when building to SSG (a static site).

  ## Integration hook change

  The integration hook `astro:build:start` includes a param `buildConfig` which includes all of these same options. You can continue to use this param in Astro 1.x, but it is deprecated in favor of the new `build.config` options. All of the built-in adapters have been updated to the new format. If you have an integration that depends on this param we suggest upgrading to do this instead:

  ```js
  export default function myIntegration() {
    return {
      name: 'my-integration',
      hooks: {
        'astro:config:setup': ({ updateConfig }) => {
          updateConfig({
            build: {
              server: '...',
            },
          });
        },
      },
    };
  }
  ```

## 3.0.0

### Major Changes

- [#4888](https://github.com/withastro/astro/pull/4888) [`2dc582ac5`](https://github.com/withastro/astro/commit/2dc582ac5e2d6e1d434ccfe21616182e453feec3) Thanks [@AirBorne04](https://github.com/AirBorne04)! - adjusting the build settings for cloudflare (reverting back to platform browser over neutral)
  adjusting the ssr settings for solidjs (to build for node)

## 2.1.0

### Minor Changes

- [#4876](https://github.com/withastro/astro/pull/4876) [`d3091f89e`](https://github.com/withastro/astro/commit/d3091f89e92fcfe1ad48daca74055d54b1c853a3) Thanks [@matthewp](https://github.com/matthewp)! - Adds the Astro.cookies API

  `Astro.cookies` is a new API for manipulating cookies in Astro components and API routes.

  In Astro components, the new `Astro.cookies` object is a map-like object that allows you to get, set, delete, and check for a cookie's existence (`has`):

  ```astro
  ---
  type Prefs = {
    darkMode: boolean;
  };

  Astro.cookies.set<Prefs>(
    'prefs',
    { darkMode: true },
    {
      expires: '1 month',
    },
  );

  const prefs = Astro.cookies.get<Prefs>('prefs').json();
  ---

  <body data-theme={prefs.darkMode ? 'dark' : 'light'}></body>
  ```

  Once you've set a cookie with Astro.cookies it will automatically be included in the outgoing response.

  This API is also available with the same functionality in API routes:

  ```js
  export function post({ cookies }) {
    cookies.set('loggedIn', false);

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }
  ```

  See [the RFC](https://github.com/withastro/rfcs/blob/main/proposals/0025-cookie-management.md) to learn more.

## 2.0.0

### Major Changes

- [#4815](https://github.com/withastro/astro/pull/4815) [`ce0b92ba7`](https://github.com/withastro/astro/commit/ce0b92ba73072c0f0143829a53f870155ad4c7ff) Thanks [@AirBorne04](https://github.com/AirBorne04)! - adjusted esbuild config to work with worker environment (fixing solid js ssr)

## 1.0.2

### Patch Changes

- [#4558](https://github.com/withastro/astro/pull/4558) [`742966456`](https://github.com/withastro/astro/commit/7429664566f05ecebf6d57906f950627e62e690c) Thanks [@tony-sull](https://github.com/tony-sull)! - Adding the `withastro` keyword to include the adapters on the [Integrations Catalog](https://astro.build/integrations)

## 1.0.1

### Patch Changes

- [#4232](https://github.com/withastro/astro/pull/4232) [`bfbd32588`](https://github.com/withastro/astro/commit/bfbd32588f7e2c0a9e43cd1a571a0dc9c5f7e645) Thanks [@Ekwuno](https://github.com/Ekwuno)! - Update README

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

## 0.5.0

### Minor Changes

- [#3806](https://github.com/withastro/astro/pull/3806) [`f4c571bdb`](https://github.com/withastro/astro/commit/f4c571bdb0bbcd0dfed68a484dfbfe274f8a5f45) Thanks [@nrgnrg](https://github.com/nrgnrg)! - add support for compiling functions to a functions directory rather than `_worker.js`

## 0.4.0

### Minor Changes

- [#4068](https://github.com/withastro/astro/pull/4068) [`54b33d50f`](https://github.com/withastro/astro/commit/54b33d50fdb995ac056461be7e2128d911624f2d) Thanks [@matthewp](https://github.com/matthewp)! - Add explicit errors when omitting output config

### Patch Changes

- [#4072](https://github.com/withastro/astro/pull/4072) [`a198028b0`](https://github.com/withastro/astro/commit/a198028b04234d0b8dcb0b6bcb47c5831d7a15f9) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Cloudflare throwing an error for process

## 0.3.0

### Minor Changes

- [#4015](https://github.com/withastro/astro/pull/4015) [`6fd161d76`](https://github.com/withastro/astro/commit/6fd161d7691cbf9d3ffa4646e46059dfd0940010) Thanks [@matthewp](https://github.com/matthewp)! - New `output` configuration option

  This change introduces a new "output target" configuration option (`output`). Setting the output target lets you decide the format of your final build, either:
  - `"static"` (default): A static site. Your final build will be a collection of static assets (HTML, CSS, JS) that you can deploy to any static site host.
  - `"server"`: A dynamic server application. Your final build will be an application that will run in a hosted server environment, generating HTML dynamically for different requests.

  If `output` is omitted from your config, the default value `"static"` will be used.

  When using the `"server"` output target, you must also include a runtime adapter via the `adapter` configuration. An adapter will _adapt_ your final build to run on the deployed platform of your choice (Netlify, Vercel, Node.js, Deno, etc).

  To migrate: No action is required for most users. If you currently define an `adapter`, you will need to also add `output: 'server'` to your config file to make it explicit that you are building a server. Here is an example of what that change would look like for someone deploying to Netlify:

  ```diff
  import { defineConfig } from 'astro/config';
  import netlify from '@astrojs/netlify/functions';

  export default defineConfig({
    adapter: netlify(),
  + output: 'server',
  });
  ```

* [#4018](https://github.com/withastro/astro/pull/4018) [`0cc6ede36`](https://github.com/withastro/astro/commit/0cc6ede362996b9faba57481a790d6eb7fba2045) Thanks [@okikio](https://github.com/okikio)! - Support for 404 and 500 pages in SSR

- [#3973](https://github.com/withastro/astro/pull/3973) [`5a23483ef`](https://github.com/withastro/astro/commit/5a23483efb3ba614b05a00064f84415620605204) Thanks [@matthewp](https://github.com/matthewp)! - Adds support for Astro.clientAddress

  The new `Astro.clientAddress` property allows you to get the IP address of the requested user.

  ```astro

  ```

  This property is only available when building for SSR, and only if the adapter you are using supports providing the IP address. If you attempt to access the property in a SSG app it will throw an error.

## 0.2.4

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.2.3

### Patch Changes

- [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.2.2

### Patch Changes

- [#3777](https://github.com/withastro/astro/pull/3777) [`976e1f17`](https://github.com/withastro/astro/commit/976e1f175a95ea39f737b8575e4fdf3c3d89e1ee) Thanks [@tony-sull](https://github.com/tony-sull)! - Disables HTTP streaming in Cloudflare Pages deployments

## 0.2.1

### Patch Changes

- [#3695](https://github.com/withastro/astro/pull/3695) [`0d667d0e`](https://github.com/withastro/astro/commit/0d667d0e572d76d4c819816ddf51ed14b43e2551) Thanks [@nrgnrg](https://github.com/nrgnrg)! - fix custom 404 pages not rendering

## 0.2.0

### Minor Changes

- [#3600](https://github.com/withastro/astro/pull/3600) [`7f423581`](https://github.com/withastro/astro/commit/7f423581411648c9a69b68918ff930581f12cf16) Thanks [@nrgnrg](https://github.com/nrgnrg)! - add SSR adaptor for Cloudflare Pages functions
