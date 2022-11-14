# @astrojs/image

## 0.11.4

### Patch Changes

- [#5360](https://github.com/withastro/astro/pull/5360) [`20e60c6e0`](https://github.com/withastro/astro/commit/20e60c6e0857f7b6938494df6027e8c1ad74cdc1) Thanks [@matthewp](https://github.com/matthewp)! - Fixes regression with local builds

## 0.11.3

### Patch Changes

- [#5324](https://github.com/withastro/astro/pull/5324) [`dc00ca464`](https://github.com/withastro/astro/commit/dc00ca464865feccd3760b54e0ccc58dbc1e804d) Thanks [@bluwy](https://github.com/bluwy)! - Share fallback img src with source of Picture component

## 0.11.2

### Patch Changes

- [#5317](https://github.com/withastro/astro/pull/5317) [`d701ae074`](https://github.com/withastro/astro/commit/d701ae074a4a5c7a5891e31ca50d7c51f56b353c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes use of image worker pool in SSR environments

## 0.11.1

### Patch Changes

- [#5260](https://github.com/withastro/astro/pull/5260) [`37d664e26`](https://github.com/withastro/astro/commit/37d664e26262f8e1026a31dcd4fcb251097dd90c) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug where the `web-streams-polyfill` dependency would not be installed with the `--production` flag

## 0.11.0

### Minor Changes

- [#5180](https://github.com/withastro/astro/pull/5180) [`b77200f42`](https://github.com/withastro/astro/commit/b77200f42399ea31b0045bc0e6bfe2c1c5ccc970) Thanks [@tony-sull](https://github.com/tony-sull)! - Removes the `content-visibility: auto` styling added by the `<Picture />` and `<Image />` components.

  **Why:** The [content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) style is rarely needed for an `<img>` and can actually break certain layouts.

  **Migration:** Do images in your layout actually depend on `content-visibility`? No problem! You can add these styles where needed in your own component styles.

- [#5038](https://github.com/withastro/astro/pull/5038) [`ed2dfdae5`](https://github.com/withastro/astro/commit/ed2dfdae5bea93746be883bc528c1fb6407af6eb) Thanks [@emmanuelchucks](https://github.com/emmanuelchucks)! - HTML attributes included on the `<Picture />` component are now passed down to the underlying `<img />` element.

  **Why?**

  - when styling a `<picture>` the `class` and `style` attributes belong on the `<img>` itself
  - `<picture>` elements [should not](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture#attributes) actually provide any `aria-` attributes
  - `width` and `height` can be added to the `<img>` to help prevent layout shift

## 0.10.0

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

### Patch Changes

- [#5073](https://github.com/withastro/astro/pull/5073) [`93f72f90b`](https://github.com/withastro/astro/commit/93f72f90bc8b29b1bf1402354f1ed6a110411243) Thanks [@bluwy](https://github.com/bluwy)! - Fix image external config in build

- [#5072](https://github.com/withastro/astro/pull/5072) [`3918787cb`](https://github.com/withastro/astro/commit/3918787cb9676a8c6b9be371ae90edeb676f4e8f) Thanks [@bluwy](https://github.com/bluwy)! - Support relative protocol image URL

## 0.9.3

### Patch Changes

- [#5021](https://github.com/withastro/astro/pull/5021) [`062335dbf`](https://github.com/withastro/astro/commit/062335dbf7300ad5370e29ebcf7a05d5a4703a1c) Thanks [@matthewp](https://github.com/matthewp)! - Fix remote images in SSG mode

- [#5034](https://github.com/withastro/astro/pull/5034) [`2d9d42216`](https://github.com/withastro/astro/commit/2d9d42216722334db03adb14e59773db8389b7f9) Thanks [@bluwy](https://github.com/bluwy)! - Support strict dependency install

## 0.9.2

### Patch Changes

- [#4997](https://github.com/withastro/astro/pull/4997) [`a2b66c754`](https://github.com/withastro/astro/commit/a2b66c754969af4ce98bb10654286a4445cb0999) Thanks [@panwauu](https://github.com/panwauu)! - Fixes a bug that lost query parameters for remote images in the `<Picture />` component

## 0.9.1

### Patch Changes

- [#4944](https://github.com/withastro/astro/pull/4944) [`a8f1a91e7`](https://github.com/withastro/astro/commit/a8f1a91e7e0605d847ddcdf4d7824d1b1fe9b838) Thanks [@scottaw66](https://github.com/scottaw66)! - Moves http-cache-semantics from dev dependency to dependency

## 0.9.0

### Minor Changes

- [#4909](https://github.com/withastro/astro/pull/4909) [`989298961`](https://github.com/withastro/astro/commit/9892989619770f310eed3398dd2cbc98be469afd) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds caching support for transformed images :tada:

  Local images will be cached for 1 year and invalidated when the original image file is changed.

  Remote images will be cached based on the `fetch()` response's cache headers, similar to how a CDN would manage the cache.

  **cacheDir**

  By default, transformed images will be cached to `./node_modules/.astro/image`. This can be configured in the integration's config options.

  ```
  export default defineConfig({
  	integrations: [image({
      // may be useful if your hosting provider allows caching between CI builds
      cacheDir: "./.cache/image"
    })]
  });
  ```

  Caching can also be disabled by using `cacheDir: false`.

### Patch Changes

- [#4933](https://github.com/withastro/astro/pull/4933) [`64a1d712e`](https://github.com/withastro/astro/commit/64a1d712efd3cc80c0b9aed9f2ead1487f8db07b) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug in dev when `<Image />` is used for a local image with no transformations

## 0.8.1

### Patch Changes

- [#4906](https://github.com/withastro/astro/pull/4906) [`ec55745ae`](https://github.com/withastro/astro/commit/ec55745ae5454207fa0405170588d898b49b9a48) Thanks [@tony-sull](https://github.com/tony-sull)! - Updates the default image service to use format-specific quality defaults

- [#4842](https://github.com/withastro/astro/pull/4842) [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46) Thanks [@bluwy](https://github.com/bluwy)! - Specify sharp as optional peer dependency

- [#4842](https://github.com/withastro/astro/pull/4842) [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46) Thanks [@bluwy](https://github.com/bluwy)! - Add missing dependencies, support strict dependency installation (e.g. pnpm)

## 0.8.0

### Minor Changes

- [#4738](https://github.com/withastro/astro/pull/4738) [`fad3867ad`](https://github.com/withastro/astro/commit/fad3867adbfb3a38bec8a1a122d32f953a2072fb) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds a new built-in image service based on web assembly libraries :drum: web container support!

  **Migration:** Happy with the previous image service based on [`sharp`](https://sharp.pixelplumbing.com/)? No problem! Install `sharp` in your project and update your Astro config to match.

  ```sh
  npm install sharp
  ```

  ```astro title="astro.config.mjs"
  ---
  import image from '@astrojs/image';

  export default {
    // ...
    integrations: [
      image({
        serviceEntryPoint: '@astrojs/image/sharp',
      }),
    ],
  };
  ---
  ```

### Patch Changes

- [#4797](https://github.com/withastro/astro/pull/4797) [`944d24e9e`](https://github.com/withastro/astro/commit/944d24e9ee813bb7dd45776a975b5bccb46b44cd) Thanks [@smeevil](https://github.com/smeevil)! - Do not pass width and height to the img element when wrapped in a picture element

## 0.7.1

### Patch Changes

- [#4800](https://github.com/withastro/astro/pull/4800) [`ea37de86e`](https://github.com/withastro/astro/commit/ea37de86e4b0f1e1e371fabf37495321c71bd24d) Thanks [@obennaci](https://github.com/obennaci)! - Prevent background flattening on formats supporting transparency

## 0.7.0

### Minor Changes

- [#4438](https://github.com/withastro/astro/pull/4438) [`1e5d8ba9a`](https://github.com/withastro/astro/commit/1e5d8ba9af4eb017382263653216e5247d96ab79) Thanks [@obennaci](https://github.com/obennaci)! - Support additional Sharp resize options

## 0.6.1

### Patch Changes

- [#4678](https://github.com/withastro/astro/pull/4678) [`4c05c65a3`](https://github.com/withastro/astro/commit/4c05c65a3df5bae935afebc8a15ff52d5b912d8b) Thanks [@tony-sull](https://github.com/tony-sull)! - Updates the integration to build all optimized images to `dist/assets` during SSG builds

## 0.6.0

### Minor Changes

- [#4642](https://github.com/withastro/astro/pull/4642) [`e4348a4eb`](https://github.com/withastro/astro/commit/e4348a4eb49466579204eb5f7fb8823736f467c0) Thanks [@beeb](https://github.com/beeb)! - Added a `background` option to specify a background color to replace transparent pixels (alpha layer).

### Patch Changes

- [#4649](https://github.com/withastro/astro/pull/4649) [`db70afdcd`](https://github.com/withastro/astro/commit/db70afdcd5b7d6b39c9953e88dbdadc5e3a93175) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug related to filenames for remote images in SSG builds

## 0.5.1

### Patch Changes

- [#4626](https://github.com/withastro/astro/pull/4626) [`494c2b835`](https://github.com/withastro/astro/commit/494c2b8353d1975d840c5acaf70cb513b99c58e5) Thanks [@altano](https://github.com/altano)! - Parallelize image transforms

## 0.5.0

### Minor Changes

- [#4511](https://github.com/withastro/astro/pull/4511) [`72c760e9b`](https://github.com/withastro/astro/commit/72c760e9b8e70dc4c8d4cc08f453d58a8928a0ee) Thanks [@DerYeger](https://github.com/DerYeger)! - feat: throw if alt text is missing

### Patch Changes

- [#4593](https://github.com/withastro/astro/pull/4593) [`56f83be92`](https://github.com/withastro/astro/commit/56f83be92a6417bb1cbb88dd58c3dcaf5177b9b6) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug that broke support for local images with spaces in the filename

## 0.4.0

### Minor Changes

- [#4482](https://github.com/withastro/astro/pull/4482) [`00c605ce3`](https://github.com/withastro/astro/commit/00c605ce350be83a07c5855f7b99ee41eee1ee38) Thanks [@tony-sull](https://github.com/tony-sull)! - `<Image />` and `<Picture />` now support using images in the `/public` directory :tada:

  - Moving handling of local image files into the Vite plugin
  - Optimized image files are now built to `/dist` with hashes provided by Vite, removing the need for a `/dist/_image` directory
  - Removes three npm dependencies: `etag`, `slash`, and `tiny-glob`
  - Replaces `mrmime` with the `mime` package already used by Astro's SSR server
  - Simplifies the injected `_image` route to work for both `dev` and `build`
  - Adds a new test suite for using images with `@astrojs/mdx` - including optimizing images straight from `/public`

## 0.3.7

### Patch Changes

- [#4534](https://github.com/withastro/astro/pull/4534) [`b8a80bc42`](https://github.com/withastro/astro/commit/b8a80bc42d5a254a66c32761e842841955c01450) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix import.meta.env not being available when using the image integration's types

## 0.3.6

### Patch Changes

- [#4338](https://github.com/withastro/astro/pull/4338) [`579e2daf8`](https://github.com/withastro/astro/commit/579e2daf8dd1816737d1bd253bf96c108a014061) Thanks [@tony-sull](https://github.com/tony-sull)! - When using remote images in SSG builds, query parameters from the original image source should be stripped from final build output

## 0.3.5

### Patch Changes

- [#4342](https://github.com/withastro/astro/pull/4342) [`c4af8723b`](https://github.com/withastro/astro/commit/c4af8723bd232d78d24dbd58feaef87dbaec07c7) Thanks [@tony-sull](https://github.com/tony-sull)! - The integration now includes a logger to better track progress in SSG builds. Use the new `logLevel: "debug"` integration option to see detailed logs of every image transformation built in your project.

## 0.3.4

### Patch Changes

- [#4279](https://github.com/withastro/astro/pull/4279) [`42fd6936c`](https://github.com/withastro/astro/commit/42fd6936cdb7106aea3770bed5313e558fc8b6dc) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add better warnings if the integration was not properly configured.

## 0.3.3

### Patch Changes

- [#4221](https://github.com/withastro/astro/pull/4221) [`92aa6a75e`](https://github.com/withastro/astro/commit/92aa6a75eac274942e438de06df71f8261fdbcc2) Thanks [@alex-drocks](https://github.com/alex-drocks)! - README update

## 0.3.2

### Patch Changes

- [#4140](https://github.com/withastro/astro/pull/4140) [`4678a3f35`](https://github.com/withastro/astro/commit/4678a3f358840db853db55b753b329ae592a589c) Thanks [@jackmerrill](https://github.com/jackmerrill)! - Added support for GIF to Animated WEBP images

* [#4173](https://github.com/withastro/astro/pull/4173) [`581120818`](https://github.com/withastro/astro/commit/5811208182fb70fad730b0e495d054ba970b9353) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug related to local image files in SSR builds on Windows

- [#4147](https://github.com/withastro/astro/pull/4147) [`c039ea93a`](https://github.com/withastro/astro/commit/c039ea93a1372d954f924a1e6a019a834d1eeb7a) Thanks [@crutchcorn](https://github.com/crutchcorn)! - Enable usage outside of vite contexts, such as the config file

* [#4146](https://github.com/withastro/astro/pull/4146) [`97cf0cd89`](https://github.com/withastro/astro/commit/97cf0cd893b950a48ffa631247528b4b4ad73109) Thanks [@crutchcorn](https://github.com/crutchcorn)! - Export all "dist" files

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
