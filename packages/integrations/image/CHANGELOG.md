# @astrojs/image

## 0.3.1

### Patch Changes

- [#4141](https://github.com/withastro/astro/pull/4141) [`65f2d3b4b`](https://github.com/withastro/astro/commit/65f2d3b4b1d31411ee2ea450478349413d8f4cf6) Thanks [@FredKSchott](https://github.com/FredKSchott)! - fix windows "bad package export" error

## 0.3.0

### Minor Changes

- [#4045](https://github.com/withastro/astro/pull/4045) [`a397b981f`](https://github.com/withastro/astro/commit/a397b981f5f46dee85e6e00aa39633d018d4b9a2) Thanks [@tony-sull](https://github.com/tony-sull)! - Big improvements to the TypeScript and Language Tools support for `@astrojs/image` :tada:

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

* [#3570](https://github.com/withastro/astro/pull/3570) [`04070c0c1`](https://github.com/withastro/astro/commit/04070c0c12c00a3e17842ce48e36edc3f2c890a3) Thanks [@matthewp](https://github.com/matthewp)! - Bump to Vite 3!

- [#4013](https://github.com/withastro/astro/pull/4013) [`ef9345767`](https://github.com/withastro/astro/commit/ef9345767b898b436acc6da32da4936b882fd926) Thanks [@tony-sull](https://github.com/tony-sull)! - - Fixes two bugs that were blocking SSR support when deployed to a hosting service
  - The built-in `sharp` service now automatically rotates images based on EXIF data

### Patch Changes

- [#3961](https://github.com/withastro/astro/pull/3961) [`d73c04a9e`](https://github.com/withastro/astro/commit/d73c04a9e58c7d320cdb4f34604de76b30199778) Thanks [@tony-sull](https://github.com/tony-sull)! - Updates the <Picture /> component to pass the `alt` attribute down to the <img> element

* [#4021](https://github.com/withastro/astro/pull/4021) [`9aecf7c7c`](https://github.com/withastro/astro/commit/9aecf7c7c7211f34236d8dde624ca388310d3727) Thanks [@delucis](https://github.com/delucis)! - Handle EXIF orientation flag

- [#4048](https://github.com/withastro/astro/pull/4048) [`e60d6d9c1`](https://github.com/withastro/astro/commit/e60d6d9c1df7d53613c2bf46c6cfc06ac04100c5) Thanks [@tony-sull](https://github.com/tony-sull)! - Removes Node's `fileURLToPath` dependency in the production SSR endpoint

* [#4004](https://github.com/withastro/astro/pull/4004) [`ef9c4152b`](https://github.com/withastro/astro/commit/ef9c4152b2b399e25bf4e8aa7b37adcf6d0d8f17) Thanks [@sarah11918](https://github.com/sarah11918)! - [READMEs] removed "experimental" from astro add instructions

- [#3980](https://github.com/withastro/astro/pull/3980) [`eaf187f2c`](https://github.com/withastro/astro/commit/eaf187f2c40493abec28113c742ef392c812d0e2) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixing TypeScript definition exports for image components

## 0.1.3

### Patch Changes

- [#3957](https://github.com/withastro/astro/pull/3957) [`2a7dd040e`](https://github.com/withastro/astro/commit/2a7dd040e8a65d62fbb3bbd7308f523bd48deda5) Thanks [@tony-sull](https://github.com/tony-sull)! - Improves the `astro dev` experience when using a third-party hosted image service

* [#3965](https://github.com/withastro/astro/pull/3965) [`299b4afca`](https://github.com/withastro/astro/commit/299b4afcab090bbe014d4eaf2a5ea439e8436bcc) Thanks [@tony-sull](https://github.com/tony-sull)! - Adding a unique hash to remote images built for SSG to ensure unique URLs are always de-duplicated

## 0.1.2

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.1.1

### Patch Changes

- [#3876](https://github.com/withastro/astro/pull/3876) [`f9614128`](https://github.com/withastro/astro/commit/f9614128622583cba6f65cb4202d56a71b4269a3) Thanks [@tony-sull](https://github.com/tony-sull)! - Bug: Updating the <Picture /> component to default to async image decoding

## 0.1.0

### Minor Changes

- [#3866](https://github.com/withastro/astro/pull/3866) [`89d76753`](https://github.com/withastro/astro/commit/89d76753a0dc50b2967d1fa9d36e34bde2722b83) Thanks [@tony-sull](https://github.com/tony-sull)! - The new `<Picture />` component adds art direction support for building responsive images with multiple sizes and file types :tada:

### Patch Changes

- [#3865](https://github.com/withastro/astro/pull/3865) [`1f9e4857`](https://github.com/withastro/astro/commit/1f9e4857ff2b2cb7db89d619618cdf546cd3b3dc) Thanks [@delucis](https://github.com/delucis)! - Small README fixes

* [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

- [#3848](https://github.com/withastro/astro/pull/3848) [`502f0631`](https://github.com/withastro/astro/commit/502f0631317fe1b23582d4126c44f44cb0b0716f) Thanks [@matthewp](https://github.com/matthewp)! - Allow importing the Image component from @astrojs/image

* [#3869](https://github.com/withastro/astro/pull/3869) [`0aaef1c4`](https://github.com/withastro/astro/commit/0aaef1c48bacff5a05498af201d456efeac82ac2) Thanks [@tony-sull](https://github.com/tony-sull)! - Bugfix: fixing a bug that broke builds in NPM workspaces

## 0.0.4

### Patch Changes

- [#3812](https://github.com/withastro/astro/pull/3812) [`5ccccace`](https://github.com/withastro/astro/commit/5ccccace0cc3055117f118a88231999fab585a3b) Thanks [@tony-sull](https://github.com/tony-sull)! - - Updates how the `<Image />` component is exported to support older versions of Astro
  - Adds an example of using the `<Image />` component in markdown pages

## 0.0.3

### Patch Changes

- [#3795](https://github.com/withastro/astro/pull/3795) [`d143d24c`](https://github.com/withastro/astro/commit/d143d24c7246153e6f66d8e0f3f9c78cadfee258) Thanks [@tony-sull](https://github.com/tony-sull)! - Automatically adds the required `vite.optimizeDeps` config for `sharp`. Also ensures that only whole numbers are passed to sharp's resize transform

## 0.0.2

### Patch Changes

- [#3788](https://github.com/withastro/astro/pull/3788) [`f4943e0f`](https://github.com/withastro/astro/commit/f4943e0fbced044f0ba4435cb41d77b67c98e69f) Thanks [@tony-sull](https://github.com/tony-sull)! - Initial release! 🎉
