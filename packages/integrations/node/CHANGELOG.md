# @astrojs/node

## 3.0.0

### Major Changes

- [#5290](https://github.com/withastro/astro/pull/5290) [`b2b291d29`](https://github.com/withastro/astro/commit/b2b291d29143703cece0d12c8e74b2e1151d2061) Thanks [@matthewp](https://github.com/matthewp)! - Handle base configuration in adapters

  This allows adapters to correctly handle `base` configuration. Internally Astro now matches routes when the URL includes the `base`.

  Adapters now also have access to the `removeBase` method which will remove the `base` from a pathname. This is useful to look up files for static assets.

### Patch Changes

- Updated dependencies [[`b2b291d29`](https://github.com/withastro/astro/commit/b2b291d29143703cece0d12c8e74b2e1151d2061), [`97e2b6ad7`](https://github.com/withastro/astro/commit/97e2b6ad7a6fa23e82be28b2f57cdf3f85fab112), [`4af4d8fa0`](https://github.com/withastro/astro/commit/4af4d8fa0035130fbf31c82d72777c3679bc1ca5), [`f6add3924`](https://github.com/withastro/astro/commit/f6add3924d5cd59925a6ea4bf7f2f731709bc893), [`247eb7411`](https://github.com/withastro/astro/commit/247eb7411f429317e5cd7d401a6660ee73641313)]:
  - astro@1.6.4

## 2.0.2

### Patch Changes

- [#5207](https://github.com/withastro/astro/pull/5207) [`c203a5cc2`](https://github.com/withastro/astro/commit/c203a5cc2f12d8c1c3e96d4f08bdd2bb2823e997) Thanks [@BeanWei](https://github.com/BeanWei)! - fix static server path for windows system

## 2.0.1

### Patch Changes

- [#5114](https://github.com/withastro/astro/pull/5114) [`5c0c6e1ac`](https://github.com/withastro/astro/commit/5c0c6e1ac67e6341625f028794986700197334ae) Thanks [@matthewp](https://github.com/matthewp)! - Fixes finding the client folder for serving assets

- [#5111](https://github.com/withastro/astro/pull/5111) [`df4d84610`](https://github.com/withastro/astro/commit/df4d84610ad2b543a37cb3bcac9887bfef0b8994) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - fix port in standalone mode

## 2.0.0

### Major Changes

- [#5056](https://github.com/withastro/astro/pull/5056) [`e55af8a23`](https://github.com/withastro/astro/commit/e55af8a23233b6335f45b7a04b9d026990fb616c) Thanks [@matthewp](https://github.com/matthewp)! - # Standalone mode for the Node.js adapter

  New in `@astrojs/node` is support for **standalone mode**. With standalone mode you can start your production server without needing to write any server JavaScript yourself. The server starts simply by running the script like so:

  ```shell
  node ./dist/server/entry.mjs
  ```

  To enable standalone mode, set the new `mode` to `'standalone'` option in your Astro config:

  ```js
  import { defineConfig } from 'astro/config';
  import nodejs from '@astrojs/node';

  export default defineConfig({
    output: 'server',
    adapter: nodejs({
      mode: 'standalone',
    }),
  });
  ```

  See the @astrojs/node documentation to learn all of the options available in standalone mode.

  ## Breaking change

  This is a semver major change because the new `mode` option is required. Existing @astrojs/node users who are using their own HTTP server framework such as Express can upgrade by setting the `mode` option to `'middleware'` in order to build to a middleware mode, which is the same behavior and API as before.

  ```js
  import { defineConfig } from 'astro/config';
  import nodejs from '@astrojs/node';

  export default defineConfig({
    output: 'server',
    adapter: nodejs({
      mode: 'middleware',
    }),
  });
  ```

### Minor Changes

- [#5056](https://github.com/withastro/astro/pull/5056) [`e55af8a23`](https://github.com/withastro/astro/commit/e55af8a23233b6335f45b7a04b9d026990fb616c) Thanks [@matthewp](https://github.com/matthewp)! - # Adapter support for `astro preview`

  Adapters are now about to support the `astro preview` command via a new integration option. The Node.js adapter `@astrojs/node` is the first of the built-in adapters to gain support for this. What this means is that if you are using `@astrojs/node` you can new preview your SSR app by running:

  ```shell
  npm run preview
  ```

  ## Adapter API

  We will be updating the other first party Astro adapters to support preview over time. Adapters can opt in to this feature by providing the `previewEntrypoint` via the `setAdapter` function in `astro:config:done` hook. The Node.js adapter's code looks like this:

  ```diff
  export default function() {
    return {
  		name: '@astrojs/node',
  		hooks: {
  			'astro:config:done': ({ setAdapter, config }) => {
          setAdapter({
            name: '@astrojs/node',
            serverEntrypoint: '@astrojs/node/server.js',
  +          previewEntrypoint: '@astrojs/node/preview.js',
            exports: ['handler'],
          });

          // more here
        }
      }
    };
  }
  ```

  The `previewEntrypoint` is a module in the adapter's package that is a Node.js script. This script is run when `astro preview` is run and is charged with starting up the built server. See the Node.js implementation in `@astrojs/node` to see how that is implemented.

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

## 1.1.0

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

## 1.0.1

### Patch Changes

- [#4558](https://github.com/withastro/astro/pull/4558) [`742966456`](https://github.com/withastro/astro/commit/7429664566f05ecebf6d57906f950627e62e690c) Thanks [@tony-sull](https://github.com/tony-sull)! - Adding the `withastro` keyword to include the adapters on the [Integrations Catalog](https://astro.build/integrations)

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

### Patch Changes

- Updated dependencies [[`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308)]:
  - @astrojs/webapi@1.0.0

## 0.2.1

### Patch Changes

- [#4055](https://github.com/withastro/astro/pull/4055) [`44694d8a9`](https://github.com/withastro/astro/commit/44694d8a9084bb1b09840ec8967edd75fa033174) Thanks [@matthewp](https://github.com/matthewp)! - Handle binary data request bodies in the Node adapter

## 0.2.0

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

* [#3973](https://github.com/withastro/astro/pull/3973) [`5a23483ef`](https://github.com/withastro/astro/commit/5a23483efb3ba614b05a00064f84415620605204) Thanks [@matthewp](https://github.com/matthewp)! - Adds support for Astro.clientAddress

  The new `Astro.clientAddress` property allows you to get the IP address of the requested user.

  ```astro

  ```

  This property is only available when building for SSR, and only if the adapter you are using supports providing the IP address. If you attempt to access the property in a SSG app it will throw an error.

### Patch Changes

- [#4023](https://github.com/withastro/astro/pull/4023) [`4ca6a0933`](https://github.com/withastro/astro/commit/4ca6a0933d92dd559327dd46a28712d918caebf7) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Node adapter to accept a request body

## 0.1.6

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.1.5

### Patch Changes

- [#3865](https://github.com/withastro/astro/pull/3865) [`1f9e4857`](https://github.com/withastro/astro/commit/1f9e4857ff2b2cb7db89d619618cdf546cd3b3dc) Thanks [@delucis](https://github.com/delucis)! - Small README fixes

* [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.1.4

### Patch Changes

- [#3817](https://github.com/withastro/astro/pull/3817) [`2f56664f`](https://github.com/withastro/astro/commit/2f56664f85596c6268ecb44bbb9c36cca2ea49c5) Thanks [@ran-dall](https://github.com/ran-dall)! - Fix example on `README.md`

## 0.1.3

### Patch Changes

- [#3677](https://github.com/withastro/astro/pull/3677) [`8045c8ad`](https://github.com/withastro/astro/commit/8045c8ade16fe4306448b7f98a4560ef0557d378) Thanks [@Jutanium](https://github.com/Jutanium)! - Update READMEs

## 0.1.2

### Patch Changes

- Updated dependencies [[`4de53ecc`](https://github.com/withastro/astro/commit/4de53eccef346bed843b491b7ab93987d7d85655)]:
  - @astrojs/webapi@0.12.0

## 0.1.1

### Patch Changes

- [`815d62f1`](https://github.com/withastro/astro/commit/815d62f151a36fef7d09590d4962ca71bda61b32) Thanks [@FredKSchott](https://github.com/FredKSchott)! - no changes.

## 0.1.0

### Minor Changes

- [#2979](https://github.com/withastro/astro/pull/2979) [`9d7a4b59`](https://github.com/withastro/astro/commit/9d7a4b59b53f8cb274266f5036d1cef841750252) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Welcome to the Astro v1.0.0 Beta! Read the [official announcement](https://astro.build/blog/astro-1-beta-release/) for more details.

## 0.0.2

### Patch Changes

- [#2879](https://github.com/withastro/astro/pull/2879) [`80034c6c`](https://github.com/withastro/astro/commit/80034c6cbc89761618847e6df43fd49560a05aa9) Thanks [@matthewp](https://github.com/matthewp)! - Netlify Adapter

  This change adds a Netlify adapter that uses Netlify Functions. You can use it like so:

  ```js
  import { defineConfig } from 'astro/config';
  import netlify from '@astrojs/netlify/functions';

  export default defineConfig({
    adapter: netlify(),
  });
  ```

* [#2873](https://github.com/withastro/astro/pull/2873) [`e4025d1f`](https://github.com/withastro/astro/commit/e4025d1f530310d6ab951109f4f53878a307471a) Thanks [@matthewp](https://github.com/matthewp)! - Improves the build by building to a single file for rendering

## 0.0.2-next.0

### Patch Changes

- [#2873](https://github.com/withastro/astro/pull/2873) [`e4025d1f`](https://github.com/withastro/astro/commit/e4025d1f530310d6ab951109f4f53878a307471a) Thanks [@matthewp](https://github.com/matthewp)! - Improves the build by building to a single file for rendering
