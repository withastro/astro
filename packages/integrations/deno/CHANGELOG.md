# @astrojs/node

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
  <div>Your address { Astro.clientAddress }</div>
  ```

  This property is only available when building for SSR, and only if the adapter you are using supports providing the IP address. If you attempt to access the property in a SSG app it will throw an error.

## 0.1.10

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.1.9

### Patch Changes

- [#3865](https://github.com/withastro/astro/pull/3865) [`1f9e4857`](https://github.com/withastro/astro/commit/1f9e4857ff2b2cb7db89d619618cdf546cd3b3dc) Thanks [@delucis](https://github.com/delucis)! - Small README fixes

* [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.1.8

### Patch Changes

- [#3677](https://github.com/withastro/astro/pull/3677) [`8045c8ad`](https://github.com/withastro/astro/commit/8045c8ade16fe4306448b7f98a4560ef0557d378) Thanks [@Jutanium](https://github.com/Jutanium)! - Update READMEs

## 0.1.7

### Patch Changes

- [#3734](https://github.com/withastro/astro/pull/3734) [`4acd245d`](https://github.com/withastro/astro/commit/4acd245d8f59871eb9c0083ae1a0fe7aa70c84f5) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: append shim to top of built file to avoid "can't read process of undefined" issues

## 0.1.6

### Patch Changes

- [#3673](https://github.com/withastro/astro/pull/3673) [`ba5ad785`](https://github.com/withastro/astro/commit/ba5ad7855c4252e10e76b41b88fd4c74b4b7295b) Thanks [@hippotastic](https://github.com/hippotastic)! - Fix react dependencies to improve test reliability

## 0.1.5

### Patch Changes

- [#3532](https://github.com/withastro/astro/pull/3532) [`c22a07db`](https://github.com/withastro/astro/commit/c22a07db134a9d0741a05123fb506595aabf145b) Thanks [@matthewp](https://github.com/matthewp)! - Fix for using Astro.glob when using the Deno Deploy adapter

## 0.1.4

### Patch Changes

- [#3503](https://github.com/withastro/astro/pull/3503) [`207f58d1`](https://github.com/withastro/astro/commit/207f58d1715ac024cc7c81b76e26aa49fca5173f) Thanks [@williamtetlow](https://github.com/williamtetlow)! - Alias `from 'astro'` imports to `'@astro/types'`
  Update Deno and Netlify integrations to handle vite.resolves.alias as an array

## 0.1.3

### Patch Changes

- [#3483](https://github.com/withastro/astro/pull/3483) [`b795a085`](https://github.com/withastro/astro/commit/b795a085f0d20abe83c5ada1e7ba89ec4444c2d5) Thanks [@mvolfik](https://github.com/mvolfik)! - Deno integration now loads environment variables in server runtime

## 0.1.2

### Patch Changes

- [#3160](https://github.com/withastro/astro/pull/3160) [`ae9ac5cb`](https://github.com/withastro/astro/commit/ae9ac5cbdceba0687d83d56d9d5f80479ab88710) Thanks [@matthewp](https://github.com/matthewp)! - Allows using React.lazy, Suspense in SSR and with hydration

## 0.1.1

### Patch Changes

- [#3121](https://github.com/withastro/astro/pull/3121) [`e5383cd3`](https://github.com/withastro/astro/commit/e5383cd3576f858bf65f6d460de397c4f2dae208) Thanks [@matthewp](https://github.com/matthewp)! - Handles file serving in the main export

## 0.1.0

### Minor Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update config options to resepect [RFC0019](https://github.com/withastro/rfcs/blob/main/proposals/0019-config-finalization.md)

### Patch Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add a Deno adapter for SSR

## 0.0.2-next.0

### Patch Changes

- [#2873](https://github.com/withastro/astro/pull/2873) [`e4025d1f`](https://github.com/withastro/astro/commit/e4025d1f530310d6ab951109f4f53878a307471a) Thanks [@matthewp](https://github.com/matthewp)! - Improves the build by building to a single file for rendering
