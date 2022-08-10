# @astrojs/cloudflare

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
