# @astrojs/cloudflare

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
    }
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
