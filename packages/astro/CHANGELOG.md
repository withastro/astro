# astro

## 0.25.0-next.2

### Patch Changes

- [#2852](https://github.com/withastro/astro/pull/2852) [`96372e6b`](https://github.com/withastro/astro/commit/96372e6beb976b57a8c52fd7c65f126899325160) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix "isSelfAccepting" exception when using the new @astrojs/react integration in development

* [#2848](https://github.com/withastro/astro/pull/2848) [`981e2a83`](https://github.com/withastro/astro/commit/981e2a839b5a0292513bf2009216250f2a8730eb) Thanks [@FredKSchott](https://github.com/FredKSchott)! - add missing injected "page" scripts into markdown pages

## 0.25.0-next.1

### Patch Changes

- [#2835](https://github.com/withastro/astro/pull/2835) [`77ebab8b`](https://github.com/withastro/astro/commit/77ebab8bb27d67bc45a5af160d6b545521897802) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix missing `postcss-load-config` dependency

## 0.25.0-next.0

### Minor Changes

- [#2833](https://github.com/withastro/astro/pull/2833) [`79545412`](https://github.com/withastro/astro/commit/7954541291a3dd7adbc1d5610e0c2e615d3dde46) Thanks [@natemoo-re](https://github.com/natemoo-re)! - This PR introduces a new internal CSS parser for `@astrojs/compiler`. See [`withastro/compiler#329`](https://github.com/withastro/compiler/pull/329) for more details.

  This fixes Astro's support for modern CSS syntax like `@container`, `@layer`, and nesting. **Note** While Astro now correctly parses this modern syntax, it does not automatically compile features for browser compatability purposes.

* [#2824](https://github.com/withastro/astro/pull/2824) [`0a3d3e51`](https://github.com/withastro/astro/commit/0a3d3e51a66af80fa949ba0f5e2104439d2be634) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Change shiki to our default markdown syntax highlighter. This includes updates to all relevant starter projects that used Prism-specific styles.

### Patch Changes

- [#2798](https://github.com/withastro/astro/pull/2798) [`4c25a1c2`](https://github.com/withastro/astro/commit/4c25a1c2eacf897427a7d6dac3bf476ef56799de) Thanks [@matthewp](https://github.com/matthewp)! - Implement APIs for headers for SSR flag

* [#2825](https://github.com/withastro/astro/pull/2825) [`1cd7184c`](https://github.com/withastro/astro/commit/1cd7184ca6fa6e60a69918e461f42c055e8a795e) Thanks [@hlynursmari1](https://github.com/hlynursmari1)! - Fix island deduplication ignoring props.Re-resolves an issue initially patched in https://github.com/withastro/astro/pull/846 but seemingly lost in the 0.21.0 mega-merge (https://github.com/withastro/astro/commit/d84bfe719a546ad855640338d5ed49ad3aa4ccb4).This change makes the component render step account for all props, even if they don't affect the generated HTML, when deduplicating island mounts.

- [#2815](https://github.com/withastro/astro/pull/2815) [`7b9d042d`](https://github.com/withastro/astro/commit/7b9d042dde0c6ae74225de208222e0addf5f4989) Thanks [@matthewp](https://github.com/matthewp)! - Allows dynamic routes in SSR to avoid implementing getStaticPaths

- Updated dependencies [[`0a3d3e51`](https://github.com/withastro/astro/commit/0a3d3e51a66af80fa949ba0f5e2104439d2be634)]:
  - @astrojs/markdown-remark@0.7.0-next.0

## 0.24.3

### Patch Changes

- [#2806](https://github.com/withastro/astro/pull/2806) [`9e59ec92`](https://github.com/withastro/astro/commit/9e59ec921fe539233a1a22b9f0c34ca3cfd05247) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix a warning from Vite regarding internal sourcemaps

- Updated dependencies [[`79282163`](https://github.com/withastro/astro/commit/79282163e229bfe332b1221be3099f751b05807b)]:
  - @astrojs/renderer-svelte@0.5.2

## 0.24.2

### Patch Changes

- [#2801](https://github.com/withastro/astro/pull/2801) [`11fb3745`](https://github.com/withastro/astro/commit/11fb3745dd548c6a8fa94c6a29e0ee89bac591aa) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix: Handle CLI output in a cross-compat way

* [#2793](https://github.com/withastro/astro/pull/2793) [`6eb49479`](https://github.com/withastro/astro/commit/6eb494796e5144a4f2c12a6cce3fb2345c9b4e4e) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix HTML double-escaping issue

- [#2803](https://github.com/withastro/astro/pull/2803) [`2b76ee8d`](https://github.com/withastro/astro/commit/2b76ee8d75d44492af18b9ead35293da7178930a) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add an `astro/config` entrypoint with a `defineConfig` utility.

  Config files can now be easily benefit from Intellisense using the following approach:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	renderers: [],
  });
  ```

* [#2791](https://github.com/withastro/astro/pull/2791) [`2d95541b`](https://github.com/withastro/astro/commit/2d95541b52118f787144720cb28cdd64644b903a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix missing styles on initial dev server load (ex. Tailwind styles)

## 0.24.1

### Patch Changes

- [#2797](https://github.com/withastro/astro/pull/2797) [`58d8686e`](https://github.com/withastro/astro/commit/58d8686e94816da649b0210f5288173fb4b9a483) Thanks [@matthewp](https://github.com/matthewp)! - Fix for projects with a folder name containing a space

* [#2785](https://github.com/withastro/astro/pull/2785) [`2c4fd919`](https://github.com/withastro/astro/commit/2c4fd919faa887df659d756ed3d095e0e83ed87d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update Astro.props to show object properties on console.log(Astro.props), interating over properties, and anything else outside direct key access

- [#2790](https://github.com/withastro/astro/pull/2790) [`6b34840d`](https://github.com/withastro/astro/commit/6b34840d3d082d6491515ff96976f603947316d3) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve `set:html` behavior for `null` and `undefined` values

* [#2772](https://github.com/withastro/astro/pull/2772) [`b4d34e2d`](https://github.com/withastro/astro/commit/b4d34e2d2c1429a9938074cd30ed13d9bb741a8b) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Improve build performance, especially on large sites

- [#2772](https://github.com/withastro/astro/pull/2772) [`b4d34e2d`](https://github.com/withastro/astro/commit/b4d34e2d2c1429a9938074cd30ed13d9bb741a8b) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Surface vite warnings to the user

## 0.24.0

### Minor Changes

- [#2760](https://github.com/withastro/astro/pull/2760) [`77b9c953`](https://github.com/withastro/astro/commit/77b9c95352f441021b8a0b03f891ea6ad00117ce) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Introduce a new --host flag + host devOption to expose your server on a network IP

* [`af075d81`](https://github.com/withastro/astro/commit/af075d81579d0a77f773435bbce391e42f9dff21) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Visual redesign of the `astro dev` CLI, including new `astro --help` and `astro --version` outputs.

  These changes introduce a new startup screen, make it more obvious when a file triggers in-place HMR (`update`) or a full reload (`reload`), and improve the way Astro surfaces errors during dev.

- [#2705](https://github.com/withastro/astro/pull/2705) [`72c2c86e`](https://github.com/withastro/astro/commit/72c2c86e9d7c9b2ce6be13ddb273d4b0b11a5723) Thanks [@natemoo-re](https://github.com/natemoo-re)! - New default build strategy

  This change marks the "static build" as the new default build strategy. If you are unfamiliar with this build strategy check out the [migration guide](https://docs.astro.build/en/migrate/#planned-deprecations) on how to change your code to be compatible with this new bulid strategy.

  If you'd like to keep using the old build strategy, use the flag `--legacy-build` both in your `astro dev` and `astro build` scripts, for ex:

  ```json
  {
  	"scripts": {
  		"build": "astro build --legacy-build"
  	}
  }
  ```

  Note that the legacy build _is_ deprecated and will be removed in a future version. You should only use this flag until you have the time to migration your code.

* [#2705](https://github.com/withastro/astro/pull/2705) [`72c2c86e`](https://github.com/withastro/astro/commit/72c2c86e9d7c9b2ce6be13ddb273d4b0b11a5723) Thanks [@natemoo-re](https://github.com/natemoo-re)! - ## Updated `<head>` and `<body>` behavior

  Since `astro@0.21`, Astro placed certain restrictions on what files could use `<head>` or `<body>` tags. In `astro@0.24`, the restrictions have been lifted. Astro will be able to correctly handle `<head>` and `<body>` tags in _any_ component, not just those in `src/pages/` or `src/layouts/`.

- [#2747](https://github.com/withastro/astro/pull/2747) [`05b66bd6`](https://github.com/withastro/astro/commit/05b66bd68b173d30921c9f0565b3dc2379039fcd) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Escape HTML inside of expressions by default. Please see [our migration guide](https://docs.astro.build/en/migrate/#deprecated-unescaped-html) for more details.

### Patch Changes

- [#2695](https://github.com/withastro/astro/pull/2695) [`ae8d9256`](https://github.com/withastro/astro/commit/ae8d925666dac0008d8a607afa5f6223f95689a4) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `Astro.slots` API with new public `has` and `render` methods.

  This is a backwards-compatible change—`Astro.slots.default` will still be `true` if the component has been passed a `default` slot.

  ```ts
  if (Astro.slots.has('default')) {
  	const content = await Astro.slots.render('default');
  }
  ```

* [#2755](https://github.com/withastro/astro/pull/2755) [`10843aba`](https://github.com/withastro/astro/commit/10843aba634c9cae663d8181b9d90d3213cb9142) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add user-configurable `sitemapFilter` option.

  This option can be used to ensure certain pages are excluded from your final sitemap.

  ```ts
  // astro.config.ts
  import type { AstroUserConfig } from 'astro';

  const config: AstroUserConfig = {
    sitemap: true,
    sitemapFilter: (page: string) => !page.includes('secret-page'),
  };
  export default config;
  ```

- [#2767](https://github.com/withastro/astro/pull/2767) [`2bb2c2f7`](https://github.com/withastro/astro/commit/2bb2c2f7d153863319652dbc93396bedd1a16756) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `@astrojs/compiler` to `0.12.0`

* [#2705](https://github.com/withastro/astro/pull/2705) [`72c2c86e`](https://github.com/withastro/astro/commit/72c2c86e9d7c9b2ce6be13ddb273d4b0b11a5723) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes the static build to write to 404.html

- [#2705](https://github.com/withastro/astro/pull/2705) [`72c2c86e`](https://github.com/withastro/astro/commit/72c2c86e9d7c9b2ce6be13ddb273d4b0b11a5723) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes use of private .env variables with the static build

* [#2750](https://github.com/withastro/astro/pull/2750) [`79fc3204`](https://github.com/withastro/astro/commit/79fc320480b2a638ef707079a624519bd54f1550) Thanks [@FredKSchott](https://github.com/FredKSchott)! - update esbuild@0.14.25

- [#2737](https://github.com/withastro/astro/pull/2737) [`e8d4e568`](https://github.com/withastro/astro/commit/e8d4e56803d21cd187bd7d72899ba5d545522786) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Astro's logger has been redesigned for an improved experience! In addition to deduping identical messages, we've surfaced more error details and exposed new events like `update` (for in-place HMR) and `reload` (for full-reload HMR).

* [#2733](https://github.com/withastro/astro/pull/2733) [`6bf124fb`](https://github.com/withastro/astro/commit/6bf124fb2f8ffd3909148ccc0e253c1f72f364cb) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Remove a bad dev warning

- [#2768](https://github.com/withastro/astro/pull/2768) [`49c0d997`](https://github.com/withastro/astro/commit/49c0d9970fe362af06c6ac70c25c1b6b0c4dd393) Thanks [@matthewp](https://github.com/matthewp)! - Fixes loading astro/client/\* on Windows in dev

* [#2758](https://github.com/withastro/astro/pull/2758) [`499fb6a3`](https://github.com/withastro/astro/commit/499fb6a3356967123a7cb9b28f94d9a3bf1dff91) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add CLI warnings when running a prerelease or outdated version of Astro

- [#2705](https://github.com/withastro/astro/pull/2705) [`72c2c86e`](https://github.com/withastro/astro/commit/72c2c86e9d7c9b2ce6be13ddb273d4b0b11a5723) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Replace `send` dependency with `sirv`

* [#2732](https://github.com/withastro/astro/pull/2732) [`0ae96bb7`](https://github.com/withastro/astro/commit/0ae96bb7491a60eb2032bab23377ca54951a67a7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update server start message to use localhost for local hostnames

- [#2743](https://github.com/withastro/astro/pull/2743) [`a14075e2`](https://github.com/withastro/astro/commit/a14075e2a4d8897e24e2928318e653b63637ebe3) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix - show 404 for bad static paths with console message, rather than a 500

## 0.24.0-next.2

### Patch Changes

- [#2755](https://github.com/withastro/astro/pull/2755) [`10843aba`](https://github.com/withastro/astro/commit/10843aba634c9cae663d8181b9d90d3213cb9142) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add user-configurable `sitemapFilter` option.

  This option can be used to ensure certain pages are excluded from your final sitemap.

  ```ts
  // astro.config.ts
  import type { AstroUserConfig } from 'astro';

  const config: AstroUserConfig = {
    sitemap: true,
    sitemapFilter: (page: string) => !page.includes('secret-page'),
  };
  export default config;
  ```

* [#2750](https://github.com/withastro/astro/pull/2750) [`79fc3204`](https://github.com/withastro/astro/commit/79fc320480b2a638ef707079a624519bd54f1550) Thanks [@FredKSchott](https://github.com/FredKSchott)! - update esbuild@0.14.25

- [#2758](https://github.com/withastro/astro/pull/2758) [`499fb6a3`](https://github.com/withastro/astro/commit/499fb6a3356967123a7cb9b28f94d9a3bf1dff91) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add CLI warnings when running a prerelease or outdated version of Astro

* [#2743](https://github.com/withastro/astro/pull/2743) [`a14075e2`](https://github.com/withastro/astro/commit/a14075e2a4d8897e24e2928318e653b63637ebe3) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix - show 404 for bad static paths with console message, rather than a 500

## 0.24.0-next.1

### Minor Changes

- [`af075d81`](https://github.com/withastro/astro/commit/af075d81579d0a77f773435bbce391e42f9dff21) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Visual redesign of the `astro dev` CLI, including new `astro --help` and `astro --version` outputs.

  These changes introduce a new startup screen, make it more obvious when a file triggers in-place HMR (`update`) or a full reload (`reload`), and improve the way Astro surfaces errors during dev.

* [#2747](https://github.com/withastro/astro/pull/2747) [`05b66bd6`](https://github.com/withastro/astro/commit/05b66bd68b173d30921c9f0565b3dc2379039fcd) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Escape HTML inside of expressions by default. Please see [our migration guide](https://docs.astro.build/en/migrate/#deprecated-unescaped-html) for more details.

### Patch Changes

- [#2695](https://github.com/withastro/astro/pull/2695) [`ae8d9256`](https://github.com/withastro/astro/commit/ae8d925666dac0008d8a607afa5f6223f95689a4) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `Astro.slots` API with new public `has` and `render` methods.

  This is a backwards-compatible change—`Astro.slots.default` will still be `true` if the component has been passed a `default` slot.

  ```ts
  if (Astro.slots.has('default')) {
  	const content = await Astro.slots.render('default');
  }
  ```

* [#2705](https://github.com/withastro/astro/pull/2705) [`72c2c86e`](https://github.com/withastro/astro/commit/72c2c86e9d7c9b2ce6be13ddb273d4b0b11a5723) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes the static build to write to 404.html

- [#2737](https://github.com/withastro/astro/pull/2737) [`e8d4e568`](https://github.com/withastro/astro/commit/e8d4e56803d21cd187bd7d72899ba5d545522786) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Astro's logger has been redesigned for an improved experience! In addition to deduping identical messages, we've surfaced more error details and exposed new events like `update` (for in-place HMR) and `reload` (for full-reload HMR).

* [#2733](https://github.com/withastro/astro/pull/2733) [`6bf124fb`](https://github.com/withastro/astro/commit/6bf124fb2f8ffd3909148ccc0e253c1f72f364cb) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Remove a bad dev warning

- [#2732](https://github.com/withastro/astro/pull/2732) [`0ae96bb7`](https://github.com/withastro/astro/commit/0ae96bb7491a60eb2032bab23377ca54951a67a7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update server start message to use localhost for local hostnames

## 0.24.0-next.0

### Minor Changes

- [#2705](https://github.com/withastro/astro/pull/2705) [`8ce63ee6`](https://github.com/withastro/astro/commit/8ce63ee658677ecabcb3068f00413b51e7db30ef) Thanks [@natemoo-re](https://github.com/natemoo-re)! - New default build strategy

  This change marks the "static build" as the new default build strategy. If you are unfamiliar with this build strategy check out the [migration guide](https://docs.astro.build/en/migrate/#planned-deprecations) on how to change your code to be compatible with this new bulid strategy.

  If you'd like to keep using the old build strategy, use the flag `--legacy-build` both in your `astro dev` and `astro build` scripts, for ex:

  ```json
  {
  	"scripts": {
  		"build": "astro build --legacy-build"
  	}
  }
  ```

  Note that the legacy build _is_ deprecated and will be removed in a future version. You should only use this flag until you have the time to migration your code.

  - **Updated `<head>` and `<body>` behavior**

  Since `astro@0.21`, Astro placed certain restrictions on what files could use `<head>` or `<body>` tags. In `astro@0.24`, the restrictions have been lifted. Astro will be able to correctly handle `<head>` and `<body>` tags in _any_ component, not just those in `src/pages/` or `src/layouts/`.

### Patch Changes

- [#2705](https://github.com/withastro/astro/pull/2705) [`176d4082`](https://github.com/withastro/astro/commit/176d4082ca642e3d7b996529f1efed7048b4d04f) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes use of private .env variables with the static build

* [#2705](https://github.com/withastro/astro/pull/2705) [`a483c044`](https://github.com/withastro/astro/commit/a483c0446ba222edf4258f4683cd918ea209b8f4) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Replace `send` dependency with `sirv`

## 0.23.7

### Patch Changes

- Updated dependencies [[`0d37f8e0`](https://github.com/withastro/astro/commit/0d37f8e0a51ac7bcf9e108151828b733bbba6e94)]:
  - @astrojs/renderer-svelte@0.5.1

## 0.23.6

### Patch Changes

- Updated dependencies [[`5f91e007`](https://github.com/withastro/astro/commit/5f91e007cbbb3a5ff7322964d811844b0921db61)]:
  - @astrojs/renderer-svelte@0.5.0

## 0.23.5

### Patch Changes

- [#2706](https://github.com/withastro/astro/pull/2706) [`b2c37385`](https://github.com/withastro/astro/commit/b2c37385f94614232d9a378ef2ef3264d5405cc8) Thanks [@JuanM04](https://github.com/JuanM04)! - Changed `data-astro-raw` to `is:raw` internally

- Updated dependencies [[`b2c37385`](https://github.com/withastro/astro/commit/b2c37385f94614232d9a378ef2ef3264d5405cc8)]:
  - @astrojs/markdown-remark@0.6.4

## 0.23.4

### Patch Changes

- [#2678](https://github.com/withastro/astro/pull/2678) [`caf9135c`](https://github.com/withastro/astro/commit/caf9135c4843889c2773667d591d72d796e14c7b) Thanks [@JuanM04](https://github.com/JuanM04)! - Upgraded Vite to v2.8.6

* [#2697](https://github.com/withastro/astro/pull/2697) [`91765d79`](https://github.com/withastro/astro/commit/91765d79b1ec1181417fb6a4604a9e20564bb10e) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Improve build performance by processing `ssrPreload` in serial rather than in parallel

- [#2684](https://github.com/withastro/astro/pull/2684) [`c7bbb112`](https://github.com/withastro/astro/commit/c7bbb1128936207164cb5ac0c0ad9b1af86d861e) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix issue where HMR could be triggered during `astro build`

- Updated dependencies [[`91765d79`](https://github.com/withastro/astro/commit/91765d79b1ec1181417fb6a4604a9e20564bb10e)]:
  - @astrojs/markdown-remark@0.6.3

## 0.23.3

### Patch Changes

- [#2681](https://github.com/withastro/astro/pull/2681) [`046af364`](https://github.com/withastro/astro/commit/046af364750ffc29c68a93c024045228aa16a5ab) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix HMR regression related to fine-grained `.astro` HMR. This fixes HMR for Tailwind and CSS styles when `.astro` files are edited.

## 0.23.2

### Patch Changes

- [#2665](https://github.com/withastro/astro/pull/2665) [`0494f74e`](https://github.com/withastro/astro/commit/0494f74e4e95e0840a6cb05d3fd0eea785d8db90) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve compatability with third-party Astro packages

* [#2656](https://github.com/withastro/astro/pull/2656) [`fca64073`](https://github.com/withastro/astro/commit/fca6407318f7f189fb65f096f8166b85a322efda) Thanks [@FredKSchott](https://github.com/FredKSchott)! - fix astro scoping of "@import" inside of style tags

## 0.23.1

### Patch Changes

- [`ac6d2e8c`](https://github.com/withastro/astro/commit/ac6d2e8c645e7f6821ace02067ceb4d5402f66ae) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix issue with Non-HTML pages in static build for dev

* [#2628](https://github.com/withastro/astro/pull/2628) [`9b7e2ab2`](https://github.com/withastro/astro/commit/9b7e2ab2516cd36520364490df8e3482008292e3) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed shiki to work with `{ "type": "module" }`

- [#2630](https://github.com/withastro/astro/pull/2630) [`a2128f8e`](https://github.com/withastro/astro/commit/a2128f8e478cec8f60292206d3d22760c46f4aa9) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed incorrect types and imports

* [#2653](https://github.com/withastro/astro/pull/2653) [`17032cd0`](https://github.com/withastro/astro/commit/17032cd064ecb4233b66e30b49ca0a12a8afc476) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `@astrojs/compiler`, fixing a bug with self-closing tags that need special consideration like `<title />` and `<script />`

- [#2654](https://github.com/withastro/astro/pull/2654) [`a0fc5cb5`](https://github.com/withastro/astro/commit/a0fc5cb5ff0003e9bb4b54cbf98035b1e0a6b113) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix an issue where utf8 encoding was skipped in the dev server.

* [#2649](https://github.com/withastro/astro/pull/2649) [`5091d788`](https://github.com/withastro/astro/commit/5091d788f624060756d04488506b4f1f4eadcf8e) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add fine-grained HMR support for Astro files

- [#2645](https://github.com/withastro/astro/pull/2645) [`2e5c3b51`](https://github.com/withastro/astro/commit/2e5c3b512638bf06c7eb896fcf5cd8179fe91ca8) Thanks [@xavikortes](https://github.com/xavikortes)! - Fix issue when process.env.LANG was longer than 5 characters

- Updated dependencies [[`9b7e2ab2`](https://github.com/withastro/astro/commit/9b7e2ab2516cd36520364490df8e3482008292e3)]:
  - @astrojs/markdown-remark@0.6.2

## 0.23.0

### Minor Changes

- [#2489](https://github.com/withastro/astro/pull/2489) [`618a16f5`](https://github.com/withastro/astro/commit/618a16f59d4037cff1665110f0ed111a96a96437) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add support for the `set:html` and `set:text` directives.

  With the introduction of these directives, unescaped HTML content in expressions is now deprecated. Please migrate to `set:html` in order to continue injecting unescaped HTML in future versions of Astro—you can use `<Fragment set:html={content}>` to avoid a wrapper element. `set:text` allows you to opt-in to escaping now, but it will soon become the default.

* [#2494](https://github.com/withastro/astro/pull/2494) [`d7149f9b`](https://github.com/withastro/astro/commit/d7149f9b2f9a9092b33fa56cedecc446247faf64) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Refactor dev server to use vite server internally.

  This should be an invisible change, and no breaking changes are expected from this change. However, it is a big enough refactor that some unexpected changes may occur. If you've experienced a regression in the dev server, it is most likely a bug!

- [#2586](https://github.com/withastro/astro/pull/2586) [`d6d35bca`](https://github.com/withastro/astro/commit/d6d35bcafcbe216caa1d9e8410bf2925a4d57467) Thanks [@tony-sull](https://github.com/tony-sull)! - Support for non-HTML pages

  > ⚠️ This feature is currently only supported with the `--experimental-static-build` CLI flag. This feature may be refined over the next few weeks/months as SSR support is finalized.

  This adds support for generating non-HTML pages form `.js` and `.ts` pages during the build. Built file and extensions are based on the source file's name, ex: `src/pages/data.json.ts` will be built to `dist/data.json`.

  **Is this different from SSR?** Yes! This feature allows JSON, XML, etc. files to be output at build time. Keep an eye out for full SSR support if you need to build similar files when requested, for example as a serverless function in your deployment host.

  ## Examples

  ```typescript
  // src/pages/company.json.ts
  export async function get() {
  	return {
  		body: JSON.stringify({
  			name: 'Astro Technology Company',
  			url: 'https://astro.build/',
  		}),
  	};
  }
  ```

  What about `getStaticPaths()`? It **just works**™.

  ```typescript
  export async function getStaticPaths() {
      return [
          { params: { slug: 'thing1' }},
          { params: { slug: 'thing2' }}
      ]
  }

  export async function get(params) {
      const { slug } = params

      return {
          body: // ...JSON.stringify()
      }
  }
  ```

* [#2424](https://github.com/withastro/astro/pull/2424) [`1abb9ed0`](https://github.com/withastro/astro/commit/1abb9ed0800989f47351cc916f19fd8e0672e2c0) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Upgrade `vite` to `2.8.x`, unvendoring `vite` and bringing Astro's dependencies up-to-date.

  This is a low-level change that you shouldn't have to worry about too much, but it should fix many, many issues with CJS/ESM interoperability. It also allows Astro to stay up-to-date with the `vite` ecosystem. If you run into any unexpected problems, please let us know by opening an issue.

- [#2471](https://github.com/withastro/astro/pull/2471) [`c9bb1147`](https://github.com/withastro/astro/commit/c9bb1147cbfae20e3ecdf29ef2866a183b3b18e3) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Standardize trailing subpath behavior in config.

  Most users are not aware of the subtle differences between `/foo` and `/foo/`. Internally, we have to handle both which means that we are constantly worrying about the format of the URL, needing to add/remove trailing slashes when we go to work with this property, etc. This change transforms all `site` values to use a trailing slash internally, which should help reduce bugs for both users and maintainers.

* [#2548](https://github.com/withastro/astro/pull/2548) [`ba5e2b5e`](https://github.com/withastro/astro/commit/ba5e2b5e6c20207955991775dc4aa8879331542c) Thanks [@matthewp](https://github.com/matthewp)! - Experimental SSR Support

  > ⚠️ If you are a user of Astro and see this PR and think that you can start deploying your app to a server and get SSR, slow down a second! This is only the initial flag and **very basic support**. Styles are not loading correctly at this point, for example. Like we did with the `--experimental-static-build` flag, this feature will be refined over the next few weeks/months and we'll let you know when its ready for community testing.

  ## Changes

  - This adds a new `--experimental-ssr` flag to `astro build` which will result in `dist/server/` and `dist/client/` directories.
  - SSR can be used through this API:

    ```js
    import { createServer } from 'http';
    import { loadApp } from 'astro/app/node';

    const app = await loadApp(new URL('./dist/server/', import.meta.url));

    createServer((req, res) => {
      const route = app.match(req);
      if (route) {
        let html = await app.render(req, route);
      }
    }).listen(8080);
    ```

  - This API will be refined over time.
  - This only works in Node.js at the moment.
  - Many features will likely not work correctly, but rendering HTML at least should.

### Patch Changes

- [#2486](https://github.com/withastro/astro/pull/2486) [`6bd165f8`](https://github.com/withastro/astro/commit/6bd165f84cd3a1550b29fec539af814360c87f54) Thanks [@matthewp](https://github.com/matthewp)! - Fix for the static build when project contains a space

* [#2424](https://github.com/withastro/astro/pull/2424) [`1abb9ed0`](https://github.com/withastro/astro/commit/1abb9ed0800989f47351cc916f19fd8e0672e2c0) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes HMR of CSS that is imported from astro, when using the static build flag

- [#2522](https://github.com/withastro/astro/pull/2522) [`3e8844fa`](https://github.com/withastro/astro/commit/3e8844fa871fa477026375db6d921beb4b23b0dc) Thanks [@matthewp](https://github.com/matthewp)! - Fix for CSS superset support and HMR in the static build

* [#2506](https://github.com/withastro/astro/pull/2506) [`187d5128`](https://github.com/withastro/astro/commit/187d5128af9ea388589f12e7b062b1e6a38ac67a) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Fix an issue rendering content within HTMLElement

- [#2606](https://github.com/withastro/astro/pull/2606) [`96609d4c`](https://github.com/withastro/astro/commit/96609d4c9ef66ef6852e590fa439a2177e9ae847) Thanks [@matthewp](https://github.com/matthewp)! - Fixes 404 to HMR script in the static build

* [#2599](https://github.com/withastro/astro/pull/2599) [`929fae68`](https://github.com/withastro/astro/commit/929fae684f2e375bfae2dd2b69d440abcf944378) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `@astrojs/compiler` to [`v0.11.0`](https://github.com/withastro/compiler/blob/main/lib/compiler/CHANGELOG.md#0110), which moves from TinyGo to Go's built-in WASM output. This will be a significant improvement for stability and memory safety.

- [#2532](https://github.com/withastro/astro/pull/2532) [`b210fd00`](https://github.com/withastro/astro/commit/b210fd008b9253f0c755c21e157cd7fb069c8445) Thanks [@matthewp](https://github.com/matthewp)! - Fixes HMR of .astro modules in astro@next

* [#2552](https://github.com/withastro/astro/pull/2552) [`e81bc3cf`](https://github.com/withastro/astro/commit/e81bc3cf14d9516a76a3328d277eb2e4db9d7279) Thanks [@matthewp](https://github.com/matthewp)! - Fixes build slowness on large apps

  This fixes slowness on large apps, particularly during the static build. Fix is to prevent the Vite dev server plugin from being run during build, as it is not needed.

- [#2605](https://github.com/withastro/astro/pull/2605) [`87762410`](https://github.com/withastro/astro/commit/87762410f3c2b887e049422d61a17e9c0fdabd88) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Astro style resolution in the static build

* [#2569](https://github.com/withastro/astro/pull/2569) [`82544e41`](https://github.com/withastro/astro/commit/82544e413406a62ecf3e408ca1aac5c8c15b7453) Thanks [@matthewp](https://github.com/matthewp)! - Fixes pageUrlFormat: 'file' in the static build

- [#2588](https://github.com/withastro/astro/pull/2588) [`10216176`](https://github.com/withastro/astro/commit/102161761de629fe1bfee7d151d4956c57ea2f42) Thanks [@matthewp](https://github.com/matthewp)! - Fix for passing children to client component when the component does not render them

* [#2531](https://github.com/withastro/astro/pull/2531) [`ef1d81ef`](https://github.com/withastro/astro/commit/ef1d81effd4e0c420c6eb2e5e500cfaac3106ea8) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix issue where hostname was not passed to dev server

- [#2537](https://github.com/withastro/astro/pull/2537) [`b0666286`](https://github.com/withastro/astro/commit/b066628693d9d9a526b3e8ab2a2d493aad38a722) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Improve debug logs

* [#2511](https://github.com/withastro/astro/pull/2511) [`3d2c1849`](https://github.com/withastro/astro/commit/3d2c184962925300ca75c96b8115f88e68140ec7) Thanks [@matthewp](https://github.com/matthewp)! - Bug fix for `define:vars` with the --experimental-static-build flag

- [#2518](https://github.com/withastro/astro/pull/2518) [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141) Thanks [@JuanM04](https://github.com/JuanM04)! - Added the ability to use custom themes and langs with Shiki (`<Code />` and `@astrojs/markdown-remark`)

* [#2612](https://github.com/withastro/astro/pull/2612) [`39cbe500`](https://github.com/withastro/astro/commit/39cbe5008549517d9360bc7c473793523c0c9207) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve suppport for `import.meta.env`.

  Prior to this change, all variables defined in `.env` files had to include the `PUBLIC_` prefix, meaning that they could potentially be visible to the client if referenced.

  Now, Astro includes _any_ referenced variables defined in `.env` files on `import.meta.env` during server-side rendering, but only referenced `PUBLIC_` variables on the client.

- [#2471](https://github.com/withastro/astro/pull/2471) [`c9bb1147`](https://github.com/withastro/astro/commit/c9bb1147cbfae20e3ecdf29ef2866a183b3b18e3) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Respect subpath URL paths in the fetchContent url property.

  This fixes an issue where fetchContent() URL property did not include the buildOptions.site path in it.

* [#2538](https://github.com/withastro/astro/pull/2538) [`16d532fe`](https://github.com/withastro/astro/commit/16d532fe1772a2c0880beda0f49883efb2469e44) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix rendering of HTML boolean attributes like `open` and `async`.

  Fix rendering of HTML and SVG enumerated attributes like `contenteditable` and `spellcheck`.

- [#2570](https://github.com/withastro/astro/pull/2570) [`34317bc0`](https://github.com/withastro/astro/commit/34317bc05c707179af0be6c9fe743c1fd1299532) Thanks [@matthewp](https://github.com/matthewp)! - Fixes bug with astro/components not loading in the next release

* [#2581](https://github.com/withastro/astro/pull/2581) [`ec6f148f`](https://github.com/withastro/astro/commit/ec6f148fc8623c6549885af70512839c08905fdb) Thanks [@matthewp](https://github.com/matthewp)! - Fix for resolving relative imports from hoisted scripts in the static build.

- [#2593](https://github.com/withastro/astro/pull/2593) [`40c0e2b3`](https://github.com/withastro/astro/commit/40c0e2b3f69e81cd7bb3fc2d8d0b3448c11b6ed8) Thanks [@tony-sull](https://github.com/tony-sull)! - Dynamic route params should ignore param order when matching paths

* [#2497](https://github.com/withastro/astro/pull/2497) [`6fe1b027`](https://github.com/withastro/astro/commit/6fe1b0279fce5a7a0e90ff79746ea0b641da3e21) Thanks [@JuanM04](https://github.com/JuanM04)! - Bumped Shiki version

- [#2594](https://github.com/withastro/astro/pull/2594) [`085468e9`](https://github.com/withastro/astro/commit/085468e949f1d6e9e19bd7039574b586a78e7601) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Upgrade `@astrojs/compiler` to `v0.10.2`

- Updated dependencies [[`a907a73b`](https://github.com/withastro/astro/commit/a907a73b8cd14726d158ea460932f9cd8891923a), [`cfeaa941`](https://github.com/withastro/astro/commit/cfeaa9414acdecec6f5d66ee0e33fe4fde574eee), [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141), [`6fe1b027`](https://github.com/withastro/astro/commit/6fe1b0279fce5a7a0e90ff79746ea0b641da3e21), [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141), [`d71c4620`](https://github.com/withastro/astro/commit/d71c46207af40de6811596ca4f5e10aa9006377b)]:
  - @astrojs/renderer-preact@0.5.0
  - @astrojs/renderer-react@0.5.0
  - @astrojs/renderer-svelte@0.4.0
  - @astrojs/renderer-vue@0.4.0
  - @astrojs/markdown-remark@0.6.1

## 0.23.0-next.10

### Patch Changes

- [#2606](https://github.com/withastro/astro/pull/2606) [`96609d4c`](https://github.com/withastro/astro/commit/96609d4c9ef66ef6852e590fa439a2177e9ae847) Thanks [@matthewp](https://github.com/matthewp)! - Fixes 404 to HMR script in the static build

* [#2605](https://github.com/withastro/astro/pull/2605) [`87762410`](https://github.com/withastro/astro/commit/87762410f3c2b887e049422d61a17e9c0fdabd88) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Astro style resolution in the static build

## 0.23.0-next.9

### Patch Changes

- [#2599](https://github.com/withastro/astro/pull/2599) [`929fae68`](https://github.com/withastro/astro/commit/929fae684f2e375bfae2dd2b69d440abcf944378) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `@astrojs/compiler` to [`v0.11.0`](https://github.com/withastro/compiler/blob/main/lib/compiler/CHANGELOG.md#0110), which moves from TinyGo to Go's built-in WASM output. This will be a significant improvement for stability and memory safety.

## 0.23.0-next.8

### Patch Changes

- [#2588](https://github.com/withastro/astro/pull/2588) [`10216176`](https://github.com/withastro/astro/commit/102161761de629fe1bfee7d151d4956c57ea2f42) Thanks [@matthewp](https://github.com/matthewp)! - Fix for passing children to client component when the component does not render them

* [#2593](https://github.com/withastro/astro/pull/2593) [`40c0e2b3`](https://github.com/withastro/astro/commit/40c0e2b3f69e81cd7bb3fc2d8d0b3448c11b6ed8) Thanks [@tony-sull](https://github.com/tony-sull)! - Dynamic route params should ignore param order when matching paths

## 0.23.0-next.7

### Patch Changes

- [#2586](https://github.com/withastro/astro/pull/2586) [`d6d35bca`](https://github.com/withastro/astro/commit/d6d35bcafcbe216caa1d9e8410bf2925a4d57467) Thanks [@tony-sull](https://github.com/tony-sull)! - Support for non-HTML pages

  > ⚠️ This feature is currently only supported with the `--experimental-static-build` CLI flag. This feature may be refined over the next few weeks/months as SSR support is finalized.

  This adds support for generating non-HTML pages form `.js` and `.ts` pages during the build. Built file and extensions are based on the source file's name, ex: `src/pages/data.json.ts` will be built to `dist/data.json`.

  **Is this different from SSR?** Yes! This feature allows JSON, XML, etc. files to be output at build time. Keep an eye out for full SSR support if you need to build similar files when requested, for example as a serverless function in your deployment host.

  ## Examples

  ```typescript
  // src/pages/company.json.ts
  export async function get() {
  	return {
  		body: JSON.stringify({
  			name: 'Astro Technology Company',
  			url: 'https://astro.build/',
  		}),
  	};
  }
  ```

  What about `getStaticPaths()`? It **just works**™.

  ```typescript
  export async function getStaticPaths() {
      return [
          { params: { slug: 'thing1' }},
          { params: { slug: 'thing2' }}
      ]
  }

  export async function get(params) {
      const { slug } = params

      return {
          body: // ...JSON.stringify()
      }
  }
  ```

* [#2548](https://github.com/withastro/astro/pull/2548) [`ba5e2b5e`](https://github.com/withastro/astro/commit/ba5e2b5e6c20207955991775dc4aa8879331542c) Thanks [@matthewp](https://github.com/matthewp)! - Experimental SSR Support

  > ⚠️ If you are a user of Astro and see this PR and think that you can start deploying your app to a server and get SSR, slow down a second! This is only the initial flag and **very basic support**. Styles are not loading correctly at this point, for example. Like we did with the `--experimental-static-build` flag, this feature will be refined over the next few weeks/months and we'll let you know when its ready for community testing.

  ## Changes

  - This adds a new `--experimental-ssr` flag to `astro build` which will result in `dist/server/` and `dist/client/` directories.
  - SSR can be used through this API:

    ```js
    import { createServer } from 'http';
    import { loadApp } from 'astro/app/node';

    const app = await loadApp(new URL('./dist/server/', import.meta.url));

    createServer((req, res) => {
      const route = app.match(req);
      if (route) {
        let html = await app.render(req, route);
      }
    }).listen(8080);
    ```

  - This API will be refined over time.
  - This only works in Node.js at the moment.
  - Many features will likely not work correctly, but rendering HTML at least should.

- [#2581](https://github.com/withastro/astro/pull/2581) [`ec6f148f`](https://github.com/withastro/astro/commit/ec6f148fc8623c6549885af70512839c08905fdb) Thanks [@matthewp](https://github.com/matthewp)! - Fix for resolving relative imports from hoisted scripts in the static build.

* [#2594](https://github.com/withastro/astro/pull/2594) [`085468e9`](https://github.com/withastro/astro/commit/085468e949f1d6e9e19bd7039574b586a78e7601) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Upgrade `@astrojs/compiler` to `v0.10.2`

## 0.23.0-next.6

### Patch Changes

- [#2570](https://github.com/withastro/astro/pull/2570) [`34317bc0`](https://github.com/withastro/astro/commit/34317bc05c707179af0be6c9fe743c1fd1299532) Thanks [@matthewp](https://github.com/matthewp)! - Fixes bug with astro/components not loading in the next release

## 0.23.0-next.5

### Patch Changes

- [#2569](https://github.com/withastro/astro/pull/2569) [`82544e41`](https://github.com/withastro/astro/commit/82544e413406a62ecf3e408ca1aac5c8c15b7453) Thanks [@matthewp](https://github.com/matthewp)! - Fixes pageUrlFormat: 'file' in the static build

- Updated dependencies [[`d71c4620`](https://github.com/withastro/astro/commit/d71c46207af40de6811596ca4f5e10aa9006377b)]:
  - @astrojs/markdown-remark@0.6.1-next.2

## 0.23.0-next.4

### Minor Changes

- [#2424](https://github.com/withastro/astro/pull/2424) [`1abb9ed0`](https://github.com/withastro/astro/commit/1abb9ed0800989f47351cc916f19fd8e0672e2c0) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Upgrade `vite` to `2.8.x`, unvendoring `vite` and bringing Astro's dependencies up-to-date.

  This is a low-level change that you shouldn't have to worry about too much, but it should fix many, many issues with CJS/ESM interoperability. It also allows Astro to stay up-to-date with the `vite` ecosystem. If you run into any unexpected problems, please let us know by opening an issue.

### Patch Changes

- [#2424](https://github.com/withastro/astro/pull/2424) [`1abb9ed0`](https://github.com/withastro/astro/commit/1abb9ed0800989f47351cc916f19fd8e0672e2c0) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes HMR of CSS that is imported from astro, when using the static build flag

- Updated dependencies [[`a907a73b`](https://github.com/withastro/astro/commit/a907a73b8cd14726d158ea460932f9cd8891923a)]:
  - @astrojs/renderer-preact@0.5.0-next.0
  - @astrojs/renderer-react@0.5.0-next.0
  - @astrojs/renderer-svelte@0.4.0-next.0
  - @astrojs/renderer-vue@0.4.0-next.0

## 0.23.0-next.3

### Patch Changes

- [#2552](https://github.com/withastro/astro/pull/2552) [`e81bc3cf`](https://github.com/withastro/astro/commit/e81bc3cf14d9516a76a3328d277eb2e4db9d7279) Thanks [@matthewp](https://github.com/matthewp)! - Fixes build slowness on large apps

  This fixes slowness on large apps, particularly during the static build. Fix is to prevent the Vite dev server plugin from being run during build, as it is not needed.

## 0.23.0-next.2

### Patch Changes

- [#2532](https://github.com/withastro/astro/pull/2532) [`b210fd00`](https://github.com/withastro/astro/commit/b210fd008b9253f0c755c21e157cd7fb069c8445) Thanks [@matthewp](https://github.com/matthewp)! - Fixes HMR of .astro modules in astro@next

* [#2531](https://github.com/withastro/astro/pull/2531) [`ef1d81ef`](https://github.com/withastro/astro/commit/ef1d81effd4e0c420c6eb2e5e500cfaac3106ea8) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix issue where hostname was not passed to dev server

- [#2537](https://github.com/withastro/astro/pull/2537) [`b0666286`](https://github.com/withastro/astro/commit/b066628693d9d9a526b3e8ab2a2d493aad38a722) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Improve debug logs

* [#2518](https://github.com/withastro/astro/pull/2518) [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141) Thanks [@JuanM04](https://github.com/JuanM04)! - Added the ability to use custom themes and langs with Shiki (`<Code />` and `@astrojs/markdown-remark`)

- [#2538](https://github.com/withastro/astro/pull/2538) [`16d532fe`](https://github.com/withastro/astro/commit/16d532fe1772a2c0880beda0f49883efb2469e44) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix rendering of HTML boolean attributes like `open` and `async`.

  Fix rendering of HTML and SVG enumerated attributes like `contenteditable` and `spellcheck`.

- Updated dependencies [[`cfeaa941`](https://github.com/withastro/astro/commit/cfeaa9414acdecec6f5d66ee0e33fe4fde574eee), [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141), [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141)]:
  - @astrojs/markdown-remark@0.6.1-next.1

## 0.23.0-next.1

### Patch Changes

- [#2522](https://github.com/withastro/astro/pull/2522) [`3e8844fa`](https://github.com/withastro/astro/commit/3e8844fa871fa477026375db6d921beb4b23b0dc) Thanks [@matthewp](https://github.com/matthewp)! - Fix for CSS superset support and HMR in the static build

## 0.23.0-next.0

### Minor Changes

- [#2489](https://github.com/withastro/astro/pull/2489) [`618a16f5`](https://github.com/withastro/astro/commit/618a16f59d4037cff1665110f0ed111a96a96437) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add support for the `set:html` and `set:text` directives.

  With the introduction of these directives, unescaped HTML content in expressions is now deprecated. Please migrate to `set:html` in order to continue injecting unescaped HTML in future versions of Astro—you can use `<Fragment set:html={content}>` to avoid a wrapper element. `set:text` allows you to opt-in to escaping now, but it will soon become the default.

* [#2494](https://github.com/withastro/astro/pull/2494) [`d7149f9b`](https://github.com/withastro/astro/commit/d7149f9b2f9a9092b33fa56cedecc446247faf64) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Refactor dev server to use vite server internally.

  This should be an invisible change, and no breaking changes are expected from this change. However, it is a big enough refactor that some unexpected changes may occur. If you've experienced a regression in the dev server, it is most likely a bug!

- [#2471](https://github.com/withastro/astro/pull/2471) [`c9bb1147`](https://github.com/withastro/astro/commit/c9bb1147cbfae20e3ecdf29ef2866a183b3b18e3) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Standardize trailing subpath behavior in config.

  Most users are not aware of the subtle differences between `/foo` and `/foo/`. Internally, we have to handle both which means that we are constantly worrying about the format of the URL, needing to add/remove trailing slashes when we go to work with this property, etc. This change transforms all `site` values to use a trailing slash internally, which should help reduce bugs for both users and maintainers.

### Patch Changes

- [#2486](https://github.com/withastro/astro/pull/2486) [`6bd165f8`](https://github.com/withastro/astro/commit/6bd165f84cd3a1550b29fec539af814360c87f54) Thanks [@matthewp](https://github.com/matthewp)! - Fix for the static build when project contains a space

* [#2506](https://github.com/withastro/astro/pull/2506) [`187d5128`](https://github.com/withastro/astro/commit/187d5128af9ea388589f12e7b062b1e6a38ac67a) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Fix an issue rendering content within HTMLElement

- [#2511](https://github.com/withastro/astro/pull/2511) [`3d2c1849`](https://github.com/withastro/astro/commit/3d2c184962925300ca75c96b8115f88e68140ec7) Thanks [@matthewp](https://github.com/matthewp)! - Bug fix for `define:vars` with the --experimental-static-build flag

* [#2471](https://github.com/withastro/astro/pull/2471) [`c9bb1147`](https://github.com/withastro/astro/commit/c9bb1147cbfae20e3ecdf29ef2866a183b3b18e3) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Respect subpath URL paths in the fetchContent url property.

  This fixes an issue where fetchContent() URL property did not include the buildOptions.site path in it.

- [#2497](https://github.com/withastro/astro/pull/2497) [`6fe1b027`](https://github.com/withastro/astro/commit/6fe1b0279fce5a7a0e90ff79746ea0b641da3e21) Thanks [@JuanM04](https://github.com/JuanM04)! - Bumped Shiki version

- Updated dependencies [[`6fe1b027`](https://github.com/withastro/astro/commit/6fe1b0279fce5a7a0e90ff79746ea0b641da3e21)]:
  - @astrojs/markdown-remark@0.6.1-next.0

## 0.22.20

### Patch Changes

- [#2491](https://github.com/withastro/astro/pull/2491) [`c7a6ed9a`](https://github.com/withastro/astro/commit/c7a6ed9a8df88fcc643ec2667627fbf9b670db53) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Fixed top-level await and other es features with the static build

* [#2479](https://github.com/withastro/astro/pull/2479) [`005751a9`](https://github.com/withastro/astro/commit/005751a920c14423648fd45b53cebc94e5108e9f) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add the `escapeHTML` utility to `astro/internal`

- [#2490](https://github.com/withastro/astro/pull/2490) [`69d5b709`](https://github.com/withastro/astro/commit/69d5b70900c6392bae1db89efcad57dbdcfa87da) Thanks [@matthewp](https://github.com/matthewp)! - Fix for CSS preprocessing using the static build

* [#2491](https://github.com/withastro/astro/pull/2491) [`c7a6ed9a`](https://github.com/withastro/astro/commit/c7a6ed9a8df88fcc643ec2667627fbf9b670db53) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Renders server-side HTMLElement as HTML tag

## 0.22.19

### Patch Changes

- [#2440](https://github.com/withastro/astro/pull/2440) [`462e3159`](https://github.com/withastro/astro/commit/462e315956601f3404bbb5d821ede6545ed76d03) Thanks [@matthewp](https://github.com/matthewp)! - Fixes HMR of CSS that is imported from astro, when using the static build flag

## 0.22.18

### Patch Changes

- [#2423](https://github.com/withastro/astro/pull/2423) [`ebe414f0`](https://github.com/withastro/astro/commit/ebe414f05b69d50de4aab64358cd4a31c254f7e6) Thanks [@delucis](https://github.com/delucis)! - Resolve sitemap URLs in relation to full site path

* [#2443](https://github.com/withastro/astro/pull/2443) [`ed0b46f9`](https://github.com/withastro/astro/commit/ed0b46f96faf144fe0946bce1528f4d605a4a42c) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix bug with RSS feed generation. `rss()` can now be called multiple times and URLs can now be fully qualified.

- [#2442](https://github.com/withastro/astro/pull/2442) [`dfe1f8b4`](https://github.com/withastro/astro/commit/dfe1f8b4e7d25b7887e34b6514bd2f50a86c7a7d) Thanks [@matthewp](https://github.com/matthewp)! - Allow setting ssr Vite config in the static build

## 0.22.17

### Patch Changes

- [#2432](https://github.com/withastro/astro/pull/2432) [`9e1bc175`](https://github.com/withastro/astro/commit/9e1bc1752f44db8f996c35f64cec259ce3fbc731) Thanks [@matthewp](https://github.com/matthewp)! - Fixes bugs with apostrophes in the title tag

* [#2414](https://github.com/withastro/astro/pull/2414) [`f2b8372c`](https://github.com/withastro/astro/commit/f2b8372c0cd7988246db3c7087fb7d7ebcff0340) Thanks [@matthewp](https://github.com/matthewp)! - Adds support for hoisted scripts to the static build

## 0.22.16

### Patch Changes

- [#2428](https://github.com/withastro/astro/pull/2428) [`3ad236ba`](https://github.com/withastro/astro/commit/3ad236ba01a694f3645b9b238af33d994fd7e6d9) Thanks [@matthewp](https://github.com/matthewp)! - Pin the compiler to fix obscure Windows bug

## 0.22.15

### Patch Changes

- [#2371](https://github.com/withastro/astro/pull/2371) [`85ad1aab`](https://github.com/withastro/astro/commit/85ad1aab67b9f1b9214db3200458ac37675b9afb) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add support for styled RSS feeds using the new `stylesheet` option

* [#2416](https://github.com/withastro/astro/pull/2416) [`5208c88a`](https://github.com/withastro/astro/commit/5208c88aeb512250f2a443edede574710dbccffa) Thanks [@matthewp](https://github.com/matthewp)! - Adds Astro.resolve deprecation for the static build

- [#2392](https://github.com/withastro/astro/pull/2392) [`24aa3245`](https://github.com/withastro/astro/commit/24aa3245aef4e12a80946c6d56f731b14aed6220) Thanks [@obnoxiousnerd](https://github.com/obnoxiousnerd)! - Support markdown draft pages.
  Markdown draft pages are markdown pages which have `draft` set in their frontmatter. By default, these will not be built by Astro while running `astro build`. To disable this behavior, you need to set `buildOptions.drafts` to `true` or pass the `--drafts` flag while running `astro build`. An exaple of a markdown draft page is:

  ```markdown
  ---
  # src/pages/blog-post.md
  title: My Blog Post
  draft: true
  ---

  This is my blog post which is currently incomplete.
  ```

## 0.22.14

### Patch Changes

- [#2393](https://github.com/withastro/astro/pull/2393) [`bcc617f9`](https://github.com/withastro/astro/commit/bcc617f9dc560bd61535c136297e97fb11013d6f) Thanks [@matthewp](https://github.com/matthewp)! - Prepends site subpath when using --experimental-static-build

## 0.22.13

### Patch Changes

- [#2391](https://github.com/withastro/astro/pull/2391) [`c8a257ad`](https://github.com/withastro/astro/commit/c8a257adc4b2ed92aaf4aa74b0e1ac4db48530f2) Thanks [@matthewp](https://github.com/matthewp)! - Improvements performance for building sites with thousands of pages with the static build

## 0.22.12

### Patch Changes

- [#2370](https://github.com/withastro/astro/pull/2370) [`a7967530`](https://github.com/withastro/astro/commit/a7967530dfe9cfab5d6d866c8d2bcba9c47de39c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes support for Lit within the static build

* [#2373](https://github.com/withastro/astro/pull/2373) [`92532b88`](https://github.com/withastro/astro/commit/92532b88820bc45f3f02bca0054e8433c3f7a743) Thanks [@matthewp](https://github.com/matthewp)! - Hydrated component fix with the static build

* Updated dependencies [[`20eaddb2`](https://github.com/withastro/astro/commit/20eaddb2a723253c7fbde3e56955a549bdf3f342)]:
  - @astrojs/renderer-react@0.4.1

## 0.22.11

### Patch Changes

- [#2367](https://github.com/withastro/astro/pull/2367) [`2aa5ba5c`](https://github.com/withastro/astro/commit/2aa5ba5c52d0fa6eb2d17ca0b38a761ab40f8ca4) Thanks [@matthewp](https://github.com/matthewp)! - Fixes use of framework renderers in the static build

* [#2365](https://github.com/withastro/astro/pull/2365) [`20d0cce6`](https://github.com/withastro/astro/commit/20d0cce681d5e913ca19c2466055f69541bced23) Thanks [@matthewp](https://github.com/matthewp)! - Fixes shared CSS within the static build

## 0.22.10

### Patch Changes

- [#2335](https://github.com/withastro/astro/pull/2335) [`f008a19c`](https://github.com/withastro/astro/commit/f008a19c9d4ad046ef7b24262605e8107c34a9bc) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Preserve pathnames for sitemap.xml

* [#2358](https://github.com/withastro/astro/pull/2358) [`10074972`](https://github.com/withastro/astro/commit/1007497297769455d41e23f48dfdbec90b403f2e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes the output when using the experimental-static-build flag

- [#2323](https://github.com/withastro/astro/pull/2323) [`69af658b`](https://github.com/withastro/astro/commit/69af658b00be0a3b1bb0eb11c2e480973a5a6301) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Fix issue with plugins running twice in dev and build

* [#2338](https://github.com/withastro/astro/pull/2338) [`c0cb7eea`](https://github.com/withastro/astro/commit/c0cb7eead5389e93c9a3e8206a301e44bd928702) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Fix preview issues triggered by pageUrlFormat & trailingSlash options

- [#2363](https://github.com/withastro/astro/pull/2363) [`7e0b32c5`](https://github.com/withastro/astro/commit/7e0b32c5696ec9db3cdee3de732de056b380568a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes use of --experimental-static-build with markdown pages

## 0.22.9

### Patch Changes

- [#2337](https://github.com/withastro/astro/pull/2337) [`180dfcf2`](https://github.com/withastro/astro/commit/180dfcf2fc39c4697e178c47a3d3a5459d845cdf) Thanks [@matthewp](https://github.com/matthewp)! - Fix using the Code component in static build

## 0.22.8

### Patch Changes

- [#2330](https://github.com/withastro/astro/pull/2330) [`71ca0912`](https://github.com/withastro/astro/commit/71ca09125a86e74c73d30d01839e27859e1ade1a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes subpath support in `astro preview`

## 0.22.7

### Patch Changes

- [#2324](https://github.com/withastro/astro/pull/2324) [`77ef43e6`](https://github.com/withastro/astro/commit/77ef43e66cf701de848a2998af646ee7762497d8) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update compiler to remove console.log (sorry everyone!)

* [`e0de21ef`](https://github.com/withastro/astro/commit/e0de21ef57227eb4c56f216280b8aa5e5e848937) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add `<guid>` to RSS feed.

- [#2318](https://github.com/withastro/astro/pull/2318) [`c0204c0a`](https://github.com/withastro/astro/commit/c0204c0a416865eab9b905b61231ed9a304120a8) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `@astrojs/compiler` to [`0.7.3`](https://github.com/withastro/compiler/blob/main/lib/compiler/CHANGELOG.md#073)

* [#2319](https://github.com/withastro/astro/pull/2319) [`e6379d51`](https://github.com/withastro/astro/commit/e6379d514df4924ac8679a8c5a251b56a1a6bee3) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Updated @astropub/webapi

## 0.22.6

### Patch Changes

- [#2299](https://github.com/withastro/astro/pull/2299) [`5fbdd56f`](https://github.com/withastro/astro/commit/5fbdd56f157f58d9d768f9d5388340aaa316da81) Thanks [@tadeuzagallo](https://github.com/tadeuzagallo)! - Fix dynamic routes for sites with subpath

* [#2308](https://github.com/withastro/astro/pull/2308) [`e98659b7`](https://github.com/withastro/astro/commit/e98659b7d65c02e4e60a3621d0ce13ca5f9878f5) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update the Astro compiler, fixing a number of bugs

## 0.22.5

### Patch Changes

- [#2305](https://github.com/withastro/astro/pull/2305) [`193ca60f`](https://github.com/withastro/astro/commit/193ca60f40c8875b1d655dcd0682560cc2e2487e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `astro check` errors with import.meta usage

- Updated dependencies [[`34486676`](https://github.com/withastro/astro/commit/344866762c3a96b92bd754cf3706db73e2d74647)]:
  - @astrojs/renderer-svelte@0.3.1

## 0.22.4

### Patch Changes

- [#2302](https://github.com/withastro/astro/pull/2302) [`9db22b97`](https://github.com/withastro/astro/commit/9db22b97b604e2ab1908b28e3461aefb222dcf97) Thanks [@matthewp](https://github.com/matthewp)! - Fix to allow the static build to build hydrated components

## 0.22.3

### Patch Changes

- [#2292](https://github.com/withastro/astro/pull/2292) [`2e55dc26`](https://github.com/withastro/astro/commit/2e55dc2686b0e2bff2e2ec76c184a17a3d2368c4) Thanks [@matthewp](https://github.com/matthewp)! - Rolls back a feature flag feature that was breaking the docs site

## 0.22.2

### Patch Changes

- [#2290](https://github.com/withastro/astro/pull/2290) [`c77cf52e`](https://github.com/withastro/astro/commit/c77cf52e1648a2581479bd3187b5a5fa1f918832) Thanks [@matthewp](https://github.com/matthewp)! - Preserve wasm stack trace when verbose logging is enabled

## 0.22.1

### Patch Changes

- [#2258](https://github.com/withastro/astro/pull/2258) [`db79d2e9`](https://github.com/withastro/astro/commit/db79d2e9ec02f3e3f25c6c10aa365acdd5c1a7cc) Thanks [@matthewp](https://github.com/matthewp)! - Fix for use of remote @import in inline styles

## 0.22.0

### Minor Changes

- [#2202](https://github.com/withastro/astro/pull/2202) [`45cea6ae`](https://github.com/withastro/astro/commit/45cea6aec5a310fed4cb8da0d96670d6b99a2539) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Officially drop support for Node v12. The minimum supported version is now Node v14.15+,

* [`c5a7305f`](https://github.com/withastro/astro/commit/c5a7305f04222743c99d70b3ea061a1d31a67efa) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Replace `fetch` detection via Vite plugin with a more resilient `globalThis` polyfill

### Patch Changes

- [#2240](https://github.com/withastro/astro/pull/2240) [`e07c1cbd`](https://github.com/withastro/astro/commit/e07c1cbd7ea46c57d637f981aaed43a733a846b1) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Pin vite to v2.6, since that is the version that we have vendored.

- Updated dependencies [[`45cea6ae`](https://github.com/withastro/astro/commit/45cea6aec5a310fed4cb8da0d96670d6b99a2539)]:
  - @astrojs/prism@0.4.0
  - @astrojs/renderer-preact@0.4.0
  - @astrojs/renderer-react@0.4.0
  - @astrojs/renderer-svelte@0.3.0
  - @astrojs/renderer-vue@0.3.0
  - @astrojs/markdown-remark@0.6.0

## 0.21.13

### Patch Changes

- Updated dependencies [[`b8c821a0`](https://github.com/withastro/astro/commit/b8c821a0743ed004691eae0eea471a368d2fa35f)]:
  - @astrojs/renderer-svelte@0.2.3

## 0.21.12

### Patch Changes

- [#2115](https://github.com/withastro/astro/pull/2115) [`0ef682c9`](https://github.com/withastro/astro/commit/0ef682c924a0836790acd2d4f8c1663eb99ffb75) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Improve error message on bad JS/TS frontmatter

* [#2156](https://github.com/withastro/astro/pull/2156) [`ef3950c6`](https://github.com/withastro/astro/commit/ef3950c647e523ff6f36cfa096c4a92596d32afa) Thanks [@drwpow](https://github.com/drwpow)! - Bugfix: missing CSS files

## 0.21.11

### Patch Changes

- [#2137](https://github.com/withastro/astro/pull/2137) [`cc1dae55`](https://github.com/withastro/astro/commit/cc1dae55c8bbf0a7d862e227f7daed138c485be4) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Exclude 404 pages from sitemap generation

* [#2112](https://github.com/withastro/astro/pull/2112) [`da7b41f5`](https://github.com/withastro/astro/commit/da7b41f5b8eb6d3a3e3a765be447e03ef5691979) Thanks [@drwpow](https://github.com/drwpow)! - Bugfix: fix missing styles in build

- [#2116](https://github.com/withastro/astro/pull/2116) [`d9d3906a`](https://github.com/withastro/astro/commit/d9d3906a3c215436a1e3d2ab64e63d23a772e059) Thanks [@e111077](https://github.com/e111077)! - add lit renderer reflection tests

* [#2135](https://github.com/withastro/astro/pull/2135) [`77c3fda3`](https://github.com/withastro/astro/commit/77c3fda379b5858a74fa54d278058efaf33fdac5) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Patch `fetch` support to prioritize authored code. Existing `fetch` imports and declarations are respected.

## 0.21.10

### Patch Changes

- [#2109](https://github.com/withastro/astro/pull/2109) [`3e4cfea4`](https://github.com/withastro/astro/commit/3e4cfea4e29ab958d69e4502c1f634a007393a7b) Thanks [@Mikkel-T](https://github.com/Mikkel-T)! - Fixes aliases on windows.

* [#2117](https://github.com/withastro/astro/pull/2117) [`8346a1f2`](https://github.com/withastro/astro/commit/8346a1f2b9e38d68788e0c6dc62f872a46ebe8a7) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes regression introduced in `@astrojs/compiler` related to active formatting elements

  See [CHANGELOG](https://github.com/withastro/compiler/blob/main/lib/compiler/CHANGELOG.md#057).

## 0.21.9

### Patch Changes

- [#2107](https://github.com/withastro/astro/pull/2107) [`4c444676`](https://github.com/withastro/astro/commit/4c44467668045733b4e5c3bbed8a1bde2ba421de) Thanks [@matthewp](https://github.com/matthewp)! - Fixes regression in build caused by use of URL module

  Using this module breaks the build because Vite tries to shim it, incorrectly.

* [#2106](https://github.com/withastro/astro/pull/2106) [`583459d0`](https://github.com/withastro/astro/commit/583459d0b6476fc79b351648c0db3c2869edfa12) Thanks [@matthewp](https://github.com/matthewp)! - Fix for using ?url with CSS imports

## 0.21.8

### Patch Changes

- [#2096](https://github.com/withastro/astro/pull/2096) [`11798a32`](https://github.com/withastro/astro/commit/11798a3209521664e02989e5ea3e791c8c5fb036) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Updates @astro/compiler and @astro/language-server.

## 0.21.7

### Patch Changes

- [#2065](https://github.com/withastro/astro/pull/2065) [`c6e4e283`](https://github.com/withastro/astro/commit/c6e4e2831e122cced890dfad47825fab3bd32db9) Thanks [@drwpow](https://github.com/drwpow)! - Bugfix: improve CSS import order

* [#2081](https://github.com/withastro/astro/pull/2081) [`62a5e98c`](https://github.com/withastro/astro/commit/62a5e98c9008a1ac88c3c38db64b74723f8fd422) Thanks [@drwpow](https://github.com/drwpow)! - Bugfix: CSS import ordering, empty CSS output on build

- [#2086](https://github.com/withastro/astro/pull/2086) [`2a2eaadc`](https://github.com/withastro/astro/commit/2a2eaadc2f5ca0ac88eb3fd987881a47b41e9bdd) Thanks [@matthewp](https://github.com/matthewp)! - Fixes invalidation of proxy module (inline script modules)

* [#2048](https://github.com/withastro/astro/pull/2048) [`1301f3da`](https://github.com/withastro/astro/commit/1301f3daa9991078652577f2addf4aaad6014712) Thanks [@matthewp](https://github.com/matthewp)! - Updates Astro.resolve to return project-relative paths

- [#2078](https://github.com/withastro/astro/pull/2078) [`ac3e8702`](https://github.com/withastro/astro/commit/ac3e870280e983a7977da79b6eec0568d38d8420) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix behavior of renderers when no children are passed in

* [#2091](https://github.com/withastro/astro/pull/2091) [`0a826c99`](https://github.com/withastro/astro/commit/0a826c999c8ee30d5ee2ae61ac4165fb9797da70) Thanks [@drwpow](https://github.com/drwpow)! - Bugfix: allow special characters in filenames

- [#2064](https://github.com/withastro/astro/pull/2064) [`5bda895f`](https://github.com/withastro/astro/commit/5bda895fcb7d1aa21223aa89d33912f97716c3ab) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Fixes an issue where void elements are rendered with opening and closing tags.

* [#2076](https://github.com/withastro/astro/pull/2076) [`920d3da1`](https://github.com/withastro/astro/commit/920d3da135f29a3b4229aa7166902ae00be0a51f) Thanks [@tony-sull](https://github.com/tony-sull)! - Improving build validation and error messages for client hydration directives

- [#2075](https://github.com/withastro/astro/pull/2075) [`b348ca6c`](https://github.com/withastro/astro/commit/b348ca6c9fbc13dcf49718c7b3335f06b1ea0982) Thanks [@drwpow](https://github.com/drwpow)! - Bugfix: allow dynamic importing of rehype plugins

- Updated dependencies [[`ac3e8702`](https://github.com/withastro/astro/commit/ac3e870280e983a7977da79b6eec0568d38d8420)]:
  - @astrojs/renderer-preact@0.3.1
  - @astrojs/renderer-react@0.3.1
  - @astrojs/renderer-svelte@0.2.2
  - @astrojs/renderer-vue@0.2.1

## 0.21.6

### Patch Changes

- [#2050](https://github.com/withastro/astro/pull/2050) [`4e06767c`](https://github.com/withastro/astro/commit/4e06767c0148539f6fe868c4fc0335755908c110) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix `astro preview` port retry logic

* [#2049](https://github.com/withastro/astro/pull/2049) [`c491d1f4`](https://github.com/withastro/astro/commit/c491d1f423cc8ed7ba25d7d0dea6336ad9659a55) Thanks [@drwpow](https://github.com/drwpow)! - Bugfix: Sass compile errors cause compiler panic

- [#2066](https://github.com/withastro/astro/pull/2066) [`f5efbe14`](https://github.com/withastro/astro/commit/f5efbe141cf3b0956252a42ffc35a95211ee7513) Thanks [@drwpow](https://github.com/drwpow)! - Bugfix: Windows error in dev for hydrated components

## 0.21.5

### Patch Changes

- 341ec3cd: Fixes dev errors in hydrated components

  The errors would occur when there was state changes in hydrated components. This only occurs in dev but does result in the hydrated component not working. This fixes the underlying issue.

- 4436592d: Fix crash with unexpected file types in pages directory
- 50f3b8d7: Bugfix: improve style and script injection for partial pages
- fad6bd09: Fixes use of `PUBLIC_` to reference env vars

  Previously `PUBLIC_` worked in server-only components such as .astro components. However if you had a client-side component you had to use `VITE_`. This was a bug with our build that is now fixed.

## 0.21.4

### Patch Changes

- 76559faa: Chore: update compiler

## 0.21.3

### Patch Changes

- 8a5de030: Fix client:visible with multiple copies of same component
- 9ed6b3c0: Update compiler with the following patches:
  - Fix components supporting only one style or script
  - Fix regression where leading `<style>` elements could break generated tags
  - Fix case-sensitivity of void elements
  - Fix expressions not working within SVG elements
  - Fix panic when preprocessed style is empty
- 7a7427e4: Fix CSS URLs on Windows
- Updated dependencies [4cec1256]
  - @astrojs/renderer-svelte@0.2.1

## 0.21.2

### Patch Changes

- 22dd6bf6: Support `lang="postcss"` in addition to `lang="pcss"`
- d3476f24: Bump Sass dependency version
- 679d4395: Added `MarkdownParser` and `MarkdownParserResponse` to `@types`
- e4945232: Fix a host of compiler bugs, including:
  - CSS scoping of `*` character inside of `calc()` expressions
  - Encoding of double quotes inside of quoted attributes
  - Expressions inside of `<table>` elements
- 8cb77959: Fixes building of non-hoisted scripts
- fc5f4163: Fix regression with `astro build` 404.astro output
- Updated dependencies [679d4395]
  - @astrojs/markdown-remark@0.5.0

## 0.21.1

### Patch Changes

- 8775730e: Fix CSS scanning bug that could lead to infinite loops
- aec4e8da: Fix client:only behavior when only a single renderer is configured

## 0.21.0

### Minor Changes

- e6aaeff5: Astro 0.21 is here! [Read the complete migration guide](https://docs.astro.build/migration/0.21.0/).

  This new version of Astro includes:

  - A new, faster, [Go-based compiler](https://github.com/withastro/astro-compiler)
  - A completely new runtime backed by [Vite](https://vitejs.dev/), with significantly dev experience improvements
  - Improved support for loading Astro config files, including `.cjs`, `.js`, and `.ts` files
  - And [many more features](https://astro.build/blog/astro-021-preview/)!

### Patch Changes

- Updated dependencies [e6aaeff5]
- Updated dependencies [e6aaeff5]
- Updated dependencies [e6aaeff5]
  - @astrojs/renderer-preact@0.3.0
  - @astrojs/renderer-react@0.3.0
  - @astrojs/renderer-svelte@0.2.0
  - @astrojs/renderer-vue@0.2.0
  - @astrojs/markdown-remark@0.4.0
  - @astrojs/prism@0.3.0

## 0.21.0-next.12

### Patch Changes

- 8733599e: Adds missing vite dependency, vixing svelte and vue
- 2e0c790b: Fix Lit renderer built

## 0.21.0-next.11

### Patch Changes

- 00d2b625: Add Vite dependencies to astro
- Updated dependencies [00d2b625]
  - @astrojs/markdown-remark@0.4.0-next.2

## 0.21.0-next.10

### Patch Changes

- c7682168: Fix build by making vendored vite resolve to copy

## 0.21.0-next.9

### Patch Changes

- 41c6a772: Fix for dev server not starting
- 3b511059: Fix for OSX .astro file corruption

## 0.21.0-next.8

### Patch Changes

- c82ceff7: Bug fix for Debug when passed JSON contain HTML strings
- 53d9cf5e: Fixes dev server not stopping cleanly
- 8986d33b: Improve error display
- Updated dependencies [8986d33b]
  - @astrojs/renderer-vue@0.2.0-next.2

## 0.21.0-next.7

### Patch Changes

- dbc49ed6: Fix HMR regression
- 6b598b24: Fix middleware order
- 0ce86dfd: Fixes Vue scoped styles when built

## 0.21.0-next.6

### Patch Changes

- dbc49ed6: Fix HMR regression
- 6b598b24: Fix middleware order
- 0ce86dfd: Fixes Vue scoped styles when built

## 0.21.0-next.5

### Patch Changes

- 0f9c1910: Fixes routing regression in next.4. Subpath support was inadvertedly prevent any non-index routes from working when not using a subpath.

## 0.21.0-next.4

### Patch Changes

- b958088c: Make astro-root be a display: contents element
- 65d17857: Fixes hoisted scripts to be bundled during the build
- 3b8f201c: Add build output
- 824c1f20: Re-implement client:only support
- 3cd1458a: Bugfix: Bundled CSS missing files on Windows
- 4e55be90: Fixes layout file detection on non-unix environments
- fca1a99d: Provides first-class support for a site deployed to a subpath

  Now you can deploy your site to a subpath more easily. Astro will use your `buildOptions.site` URL and host the dev server from there.

  If your site config is `http://example.com/blog` you will need to go to `http://localhost:3000/blog/` in dev and when using `astro preview`.

  Includes a helpful 404 page when encountering this in dev and preview.

- 65216ef9: Bugfix: PostCSS not working in all contexts
- Updated dependencies [3cd1458a]
  - @astrojs/renderer-preact@0.3.0-next.1
  - @astrojs/renderer-react@0.3.0-next.1
  - @astrojs/renderer-svelte@0.2.0-next.1
  - @astrojs/renderer-vue@0.2.0-next.1

## 0.21.0-next.3

### Patch Changes

- 7eaabbb0: Fix error with Markdown content attribute parsing
- fd52bcee: Update the build to build/bundle assets
- 7eaabbb0: Fix bug with attribute serialization
- Updated dependencies [7eaabbb0]
  - @astrojs/markdown-remark@0.4.0-next.1

## 0.21.0-next.2

### Patch Changes

- fbae2bc5: **Improve support for Astro config files.**

In addition to properly loading `.cjs` and `.js` files in all cases, Astro now supports `astro.config.ts` files.

For convenience, you may now also move your `astro.config.js` file to a top-level `config/` directory.

- 2e1bded7: Improve Tailwind HMR in `dev` mode
- Fix bug when using `<Markdown></Markdown>` with no content
- Support `PUBLIC_` prefixed `.env` variables
- Respect `tsconfig.json` and `jsconfig.json` paths as aliases

## 0.21.0-next.1

### Patch Changes

- 11ee158a: Fix issue with `style` and `script` processing where siblings would be skipped

  Fix `Fragment` and `<>` handling for backwards compatability

  Fix CSS `--custom-proprty` parsing when using scoped CSS

## 0.21.0-next.0

### Minor Changes

- d84bfe71: Astro 0.21 Beta release! This introduces the new version of Astro that includes:

  - A new, faster, Go-based compiler
  - A runtime backed by Vite, with faster dev experience
  - New features

  See more at https://astro.build/blog/astro-021-preview/

### Patch Changes

- Updated dependencies [d84bfe71]
- Updated dependencies [d84bfe71]
- Updated dependencies [d84bfe71]
  - @astrojs/prism@0.3.0-next.0
  - @astrojs/markdown-remark@0.4.0-next.0
  - @astrojs/renderer-preact@0.3.0-next.0
  - @astrojs/renderer-react@0.3.0-next.0
  - @astrojs/renderer-svelte@0.2.0-next.0
  - @astrojs/renderer-vue@0.2.0-next.0

## 0.20.12

### Patch Changes

- Updated dependencies [31d06880]
  - @astrojs/renderer-vue@0.1.9

## 0.20.11

### Patch Changes

- 6813106a: Improve getStaticPaths memoization to successfully store values in the cache

## 0.20.10

### Patch Changes

- dbd2f507: Adds the `astro check` command

  This adds a new command, `astro check` which runs diagnostics on a project. The same diagnostics run within the Astro VSCode plugin! Just run:

  ```shell
  astro check
  ```

  Which works a lot like `tsc` and will give you error messages, if any were found. We recommend adding this to your CI setup to prevent errors from being merged.

## 0.20.9

### Patch Changes

- Updated dependencies [756e3769]
  - @astrojs/renderer-react@0.2.2

## 0.20.8

### Patch Changes

- 30835635: Fixed props shadowing

## 0.20.7

### Patch Changes

- 3a0dcbe9: Fix pretty byte output in build stats
- 98d785af: Expose slots to components

## 0.20.6

### Patch Changes

- dd92871f: During CSS bundling separate processing of `rel="preload"` from normal loading stylesheets, to preserve preloads, and source element attributes like `media`.
- d771dad6: Remove check for referenced files
- 9cf2df81: Improve stats logging to use `pretty-bytes` so that 20B doesn't get output as 0kB, which is accurate, but confusing
- 09b2f0e4: Fix passing Markdown content through props (#1259)
- Updated dependencies [97d37f8f]
  - @astrojs/renderer-preact@0.2.2
  - @astrojs/renderer-react@0.2.1
  - @astrojs/renderer-svelte@0.1.2
  - @astrojs/renderer-vue@0.1.8

## 0.20.5

### Patch Changes

- b03f8771: Add human readable config verification errors
- b03f8771: Sitemaps will not create entries for 404.html pages
- b03f8771: Fix parsing of an empty `<pre></pre>` tag in markdown files, which expected the pre tag to have a child
- b03f8771: Add new `<Code>` component, powered by the more modern shiki syntax highlighter.
- b03f8771: Fix astro bin bug in some pre-ESM versions of Node v14.x
- Updated dependencies [b03f8771]
- Updated dependencies [b03f8771]
  - @astrojs/markdown-support@0.3.1

## 0.20.4

### Patch Changes

- 231964f0: Adds interfaces for built-in components

## 0.20.3

### Patch Changes

- 290f2032: Fix knownEntrypoint warning for \_\_astro_hoisted_scripts.js

## 0.20.2

### Patch Changes

- 788c769d: # Hoisted scripts

  This change adds support for hoisted scripts, allowing you to bundle scripts together for a page and hoist them to the top (in the head):

  ```astro
  <script hoist>
    // Anything goes here!
  </script>
  ```

- Updated dependencies [5d2ea578]
  - @astrojs/parser@0.20.2

## 0.20.1

### Patch Changes

- ff92be63: Add a new "astro preview" command

## 0.20.0

### Minor Changes

- affcd04f: **[BREAKING CHANGE]** stop bundling, building, and processing public files. This fixes an issue where we weren't actually honoring the "do not process" property of the public directory.

  If you were using the `public/` directory as expected and not using it to build files for you, then this should not be a breaking change. However, will notice that these files are no longer bundled.

  If you were using the `public/` directory to build files (for example, like `public/index.scss`) then you can expect this to no longer work. As per the correct Astro documentation.

### Patch Changes

- Updated dependencies [397d8f3d]
  - @astrojs/markdown-support@0.3.0

## 0.19.4

### Patch Changes

- 44fb8ebc: Remove non-null assertions, fix lint issues and enable lint in CI.
- 9482fade: Makes sure Astro.resolve works in nested component folders

## 0.19.3

### Patch Changes

- f9cd0310: Fix TypeScript "types" reference in package.json
- f9cd0310: Improve schema validation using zod
- efb41f22: Add `<Debug>` component for JavaScript-free client-side debugging.

  ```astro
  ---
  import Debug from 'astro/debug';
  const obj = { /* ... */ }
  ---

  <Debug {obj} />
  ```

## 0.19.2

### Patch Changes

- 3e605d7e: Add real-world check for ESM-CJS compatability to preflight check
- 1e0e2f41: Including Prism's `language-` class on code block `<pre>` tags
- 166c9ed6: Fix an issue where getStaticPaths is called multiple times per build
- c06da5dd: Add configuration options for url format behavior: buildOptions.pageDirectoryUrl & trailingSlash
- c06da5dd: Move 404.html output from /404/index.html to /404.html

## 0.19.1

### Patch Changes

- ece0953a: Fix CSS :global() selector bug
- Updated dependencies [a421329f]
  - @astrojs/markdown-support@0.2.4

## 0.19.0

### Minor Changes

- 239065e2: **[BREAKING]** Replace the Collections API with new file-based routing.

  This is a breaking change which impacts collections, pagination, and RSS support.
  Runtime warnings have been added to help you migrate old code to the new API.
  If you have trouble upgrading, reach out on https://astro.build/chat

  This change was made due to confusion around our Collection API, which many users found difficult to use. The new file-based routing approach should feel more familiar to anyone who has used Next.js or SvelteKit.

  Documentation added:

  - https://astro-docs-git-main-pikapkg.vercel.app/core-concepts/routing
  - https://astro-docs-git-main-pikapkg.vercel.app/guides/pagination
  - https://astro-docs-git-main-pikapkg.vercel.app/guides/rss
  - https://astro-docs-git-main-pikapkg.vercel.app/reference/api-reference#getstaticpaths

- 239065e2: Adds support for Astro.resolve

  `Astro.resolve()` helps with creating URLs relative to the current Astro file, allowing you to reference files within your `src/` folder.

  Astro _does not_ resolve relative links within HTML, such as images:

  ```html
  <img src="../images/penguin.png" />
  ```

  The above will be sent to the browser as-is and the browser will resolve it relative to the current **page**. If you want it to be resolved relative to the .astro file you are working in, use `Astro.resolve`:

  ```astro
  <img src={Astro.resolve('../images/penguin.png')} />
  ```

- 239065e2: Adds support for client:only hydrator

  The new `client:only` hydrator allows you to define a component that should be skipped during the build and only hydrated in the browser.

  In most cases it is best to render placeholder content during the build, but that may not always be feasible if an NPM dependency attempts to use browser APIs as soon as is imported.

  **Note** If more than one renderer is included in your Astro config, you need to include a hint to determine which renderer to use. Renderers will be matched to the name provided in your Astro config, similar to `<MyComponent client:only="@astrojs/renderer-react" />`. Shorthand can be used for `@astrojs` renderers, i.e. `<MyComponent client:only="react" />` will use `@astrojs/renderer-react`.

  An example usage:

  ```jsx
  ---
  import BarChart from '../components/BarChart.jsx';
  ---

  <BarChart client:only />
  /**
   * If multiple renderers are included in the Astro config,
   * this will ensure that the component is hydrated with
   * the Preact renderer.
   */
  <BarChart client:only="preact" />
  /**
   * If a custom renderer is required, use the same name
   * provided in the Astro config.
   */
  <BarChart client:only="my-custom-renderer" />
  ```

  This allows you to import a chart component dependent on d3.js while making sure that the component isn't rendered at all at build time.

### Patch Changes

- @astrojs/parser@0.18.6

## 0.19.0-next.3

### Minor Changes

- 1971ab3c: Adds support for client:only hydrator

  The new `client:only` hydrator allows you to define a component that should be skipped during the build and only hydrated in the browser.

  In most cases it is best to render placeholder content during the build, but that may not always be feasible if an NPM dependency attempts to use browser APIs as soon as is imported.

  **Note** If more than one renderer is included in your Astro config, you need to include a hint to determine which renderer to use. Renderers will be matched to the name provided in your Astro config, similar to `<MyComponent client:only="@astrojs/renderer-react" />`. Shorthand can be used for `@astrojs` renderers, i.e. `<MyComponent client:only="react" />` will use `@astrojs/renderer-react`.

  An example usage:

  ```jsx
  ---
  import BarChart from '../components/BarChart.jsx';
  ---

  <BarChart client:only />
  /**
   * If multiple renderers are included in the Astro config,
   * this will ensure that the component is hydrated with
   * the Preact renderer.
   */
  <BarChart client:only="preact" />
  /**
   * If a custom renderer is required, use the same name
   * provided in the Astro config.
   */
  <BarChart client:only="my-custom-renderer" />
  ```

  This allows you to import a chart component dependent on d3.js while making sure that the component isn't rendered at all at build time.

### Patch Changes

- 1f13e403: Fix CSS scoping issue
- 78b5bde1: Adds support for Astro.resolve

  `Astro.resolve()` helps with creating URLs relative to the current Astro file, allowing you to reference files within your `src/` folder.

  Astro _does not_ resolve relative links within HTML, such as images:

  ```html
  <img src="../images/penguin.png" />
  ```

  The above will be sent to the browser as-is and the browser will resolve it relative to the current **page**. If you want it to be resolved relative to the .astro file you are working in, use `Astro.resolve`:

  ```astro
  <img src={Astro.resolve('../images/penguin.png')} />
  ```

## 0.19.0-next.2

### Patch Changes

- 089d1e7a: update dependencies, and fix a bad .flat() call

## 0.19.0-next.1

### Patch Changes

- c881e71e: Revert 939b9d0 "Allow dev server port to be set by PORT environment variable"

## 0.19.0-next.0

### Minor Changes

- 0f0cc2b9: **[BREAKING]** Replace the Collections API with new file-based routing.

  This is a breaking change which impacts collections, pagination, and RSS support.
  Runtime warnings have been added to help you migrate old code to the new API.
  If you have trouble upgrading, reach out on https://astro.build/chat

  This change was made due to confusion around our Collection API, which many users found difficult to use. The new file-based routing approach should feel more familiar to anyone who has used Next.js or SvelteKit.

  Documentation added:

  - https://astro-docs-git-main-pikapkg.vercel.app/core-concepts/routing
  - https://astro-docs-git-main-pikapkg.vercel.app/guides/pagination
  - https://astro-docs-git-main-pikapkg.vercel.app/guides/rss
  - https://astro-docs-git-main-pikapkg.vercel.app/reference/api-reference#getstaticpaths

## 0.18.10

### Patch Changes

- 2321b577: - Allow Markdown with scoped styles to coexist happily with code syntax highlighting via Prism
- 618ea3a8: Properly escapes script tags with nested client:load directives when passing Astro components into framework components via props. Browsers interpret script end tags in strings as script end tags, resulting in syntax errors.
- 939b9d01: Allow dev server port to be set by `PORT` environment variable
- Updated dependencies [1339d5e3]
  - @astrojs/renderer-vue@0.1.7

## 0.18.9

### Patch Changes

- 8cf0e65a: Fixes a previous revert, makes sure head content is injected into the right place
- 8cf0e65a: Refactor the CLI entrypoint to support stackblitz and improve the runtime check

## 0.18.8

### Patch Changes

- b1959f0f: Reverts a change to head content that was breaking docs site

## 0.18.7

### Patch Changes

- 268a36f3: Fixes issue with head content being rendered in the wrong place
- 39df7952: Makes `fetch` available in all framework components
- Updated dependencies [f7e86150]
  - @astrojs/renderer-preact@0.2.1

## 0.18.6

### Patch Changes

- 27672096: Exclude remote srcset URLs
- 03349560: Makes Astro.request available in Astro components

## 0.18.5

### Patch Changes

- a1491cc6: Fix Vue components nesting
- Updated dependencies [cd2b5df4]
- Updated dependencies [a1491cc6]
  - @astrojs/parser@0.18.5
  - @astrojs/renderer-vue@0.1.6

## 0.18.4

### Patch Changes

- Updated dependencies [460e625]
  - @astrojs/markdown-support@0.2.3

## 0.18.3

### Patch Changes

- Updated dependencies [7015356]
  - @astrojs/markdown-support@0.2.2

## 0.18.2

### Patch Changes

- 829d5ba: Fix TSX issue with JSX multi-rendering
- 23b0d2d: Adds support for image srcset to the build
- Updated dependencies [70f0a09]
- Updated dependencies [fdb1c15]
  - @astrojs/markdown-support@0.2.1
  - @astrojs/renderer-vue@0.1.5

## 0.18.1

### Patch Changes

- d8cebb0: Removes a warning in Svelte hydrated components
- e90615f: Fixes warnings for Astro internals for fetch-content and slots

## 0.18.0

### Minor Changes

- f67e8f5: New Collections API (createCollection)

  BREAKING CHANGE: The expected return format from createCollection() has been changed. Visit https://docs.astro.build/core-concepts/collections to learn the new API.

  This feature was implemented with backwards-compatible deprecation warnings, to help you find and update pages that are using the legacy API.

- 40c882a: Fix url to find page with "index" at the end file name
- 0340b0f: Adds support for the client:media hydrator

  The new `client:media` hydrator allows you to define a component that should only be loaded when a media query matches. An example usage:

  ```jsx
  ---
  import Sidebar from '../components/Sidebar.jsx';
  ---

  <Sidebar client:media="(max-width: 700px)" />
  ```

  This allows you to define components which, for example, only run on mobile devices. A common example is a slide-in sidebar that is needed to add navigation to a mobile app, but is never displayed in desktop view.

  Since Astro components can have expressions, you can move common media queries to a module for sharing. For example here are defining:

  **media.js**

  ```js
  export const MOBILE = '(max-width: 700px)';
  ```

  And then you can reference this in your page:

  **index.astro**

  ```jsx
  import Sidebar from '../components/Sidebar.jsx';
  import { MOBILE } from '../media.js';
  ---(<Sidebar client:media={MOBILE} />);
  ```

### Patch Changes

- e89a99f: This includes the props passed to a hydration component when generating the hash/id. This prevents multiple instances of the same component with differing props to be treated as the same component when hydrated by Astro.
- b8af49f: Added sass support
- a7e6666: compile javascript to target Node v12.x
- fb8bf7e: Allow multiple Astro servers to be running simultaneously by choosing random ports if the defaults are taken.
- 294a656: Adds support for global style blocks via `<style global>`

  Be careful with this escape hatch! This is best reserved for uses like importing styling libraries like Tailwind, or changing global CSS variables.

- 8f4562a: Improve slot support, adding support for named slots and fallback content within `slot` elements.

  See the new [Slots documentation](https://docs.astro.build/core-concepts/astro-components/#slots) for more information.

- 4a601ad: Restores the ability to use Fragment in astro components
- 0e761b9: Add ability to specify hostname in devOptions
- 164489f: Fix for `false` being rendered in conditionals
- e3182c7: Adds a missing dependency
- af935c1: Fix error when no renderers are passed
- 4726e34: Fixes cases where buildOptions.site is not respected
- c82e6be: Fix unfound ./snowpack-plugin-jsx.cjs error
- 007c220: Remove custom Astro.fetchContent() glob implementation, use `import.meta.globEager` internally instead.
- 9859f53: Correcting typo in ReadMe
- b85e68a: Fixes case where custom elements are not handled within JSX expressions
- Updated dependencies [a7e6666]
- Updated dependencies [294a656]
- Updated dependencies [bd18e14]
- Updated dependencies [bd18e14]
- Updated dependencies [1f79144]
- Updated dependencies [b85e68a]
  - @astrojs/parser@0.18.0
  - @astrojs/renderer-preact@0.2.0
  - @astrojs/renderer-react@0.2.0
  - @astrojs/renderer-vue@0.1.4

## 0.18.0-next.7

### Patch Changes

- e89a99f: This includes the props passed to a hydration component when generating the hash/id. This prevents multiple instances of the same component with differing props to be treated as the same component when hydrated by Astro.
- b8af49f: Added sass support
- 4726e34: Fixes cases where buildOptions.site is not respected

## 0.18.0-next.6

### Patch Changes

- Updated dependencies [1f79144]
  - @astrojs/renderer-vue@0.1.4-next.0

## 0.18.0-next.5

### Patch Changes

- 294a656: Adds support for global style blocks via `<style global>`

  Be careful with this escape hatch! This is best reserved for uses like importing styling libraries like Tailwind, or changing global CSS variables.

- 164489f: Fix for `false` being rendered in conditionals
- af935c1: Fix error when no renderers are passed
- Updated dependencies [294a656]
  - @astrojs/parser@0.18.0-next.5

## 0.18.0-next.4

### Patch Changes

- c82e6be: Fix unfound ./snowpack-plugin-jsx.cjs error

## 0.18.0-next.3

### Minor Changes

- Add support for [the new JSX transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) for React 17 and Preact.
- Add support for [Solid](https://www.solidjs.com/) when using the new [`@astrojs/renderer-solid`](https://npm.im/@astrojs/renderer-solid) package.

### Patch Changes

- 4a601ad: Restores the ability to use Fragment in astro components
- Updated dependencies [bd18e14]
- Updated dependencies [bd18e14]
  - @astrojs/renderer-preact@0.2.0-next.0
  - @astrojs/renderer-react@0.2.0-next.0

## 0.18.0-next.2

### Minor Changes

- f67e8f5: New Collections API (createCollection)

  BREAKING CHANGE: The expected return format from createCollection() has been changed. Visit https://docs.astro.build/core-concepts/collections to learn the new API.

  This feature was implemented with backwards-compatible deprecation warnings, to help you find and update pages that are using the legacy API.

- 40c882a: Fix url to find page with "index" at the end file name

### Patch Changes

- a7e6666: compile javascript to target Node v12.x
- fb8bf7e: Allow multiple Astro servers to be running simultaneously by choosing random ports if the defaults are taken.
- 0e761b9: Add ability to specify hostname in devOptions
- 007c220: Remove custom Astro.fetchContent() glob implementation, use `import.meta.globEager` internally instead.
- b85e68a: Fixes case where custom elements are not handled within JSX expressions
- Updated dependencies [a7e6666]
- Updated dependencies [b85e68a]
  - @astrojs/parser@0.18.0-next.2

## 0.18.0-next.1

### Patch Changes

- e3182c7: Adds a missing dependency

## 0.18.0-next.0

### Minor Changes

- 0340b0f: Adds support for the client:media hydrator

  The new `client:media` hydrator allows you to define a component that should only be loaded when a media query matches. An example usage:

  ```jsx
  ---
  import Sidebar from '../components/Sidebar.jsx';
  ---

  <Sidebar client:media="(max-width: 700px)" />
  ```

  This allows you to define components which, for example, only run on mobile devices. A common example is a slide-in sidebar that is needed to add navigation to a mobile app, but is never displayed in desktop view.

  Since Astro components can have expressions, you can move common media queries to a module for sharing. For example here are defining:

  **media.js**

  ```js
  export const MOBILE = '(max-width: 700px)';
  ```

  And then you can reference this in your page:

  **index.astro**

  ```jsx
  import Sidebar from '../components/Sidebar.jsx';
  import { MOBILE } from '../media.js';
  ---(<Sidebar client:media={MOBILE} />);
  ```

### Patch Changes

- 8f4562a: Improve slot support, adding support for named slots and fallback content within `slot` elements.

  See the new [Slots documentation](https://docs.astro.build/core-concepts/astro-components/#slots) for more information.

- 9859f53: Correcting typo in ReadMe

## 0.17.3

### Patch Changes

- [release/0.17] Update compile target to better support Node v12.

## 0.17.2

### Patch Changes

- 1b73f95: Only show the buildOptions.site notice if not already set
- fb78b76: Improve error handling for unsupported Node versions
- d93f768: Add support for components defined in Frontmatter. Previously, the following code would throw an error. Now it is officially supported!

  ```astro
  ---
  const { level = 1 } = Astro.props;
  const Element = `h${level}`;
  ---

  <Element>Hello world!</Element>
  ```

## 0.17.1

### Patch Changes

- 1e01251: Fixes bug with React renderer that would not hydrate correctly
- 42a6ace: Add support for components defined in Frontmatter. Previously, the following code would throw an error. Now it is officially supported!

  ```astro
  ---
  const { level = 1 } = Astro.props;
  const Element = `h${level}`;
  ---

  <Element>Hello world!</Element>
  ```

- Updated dependencies [1e01251]
  - @astrojs/renderer-react@0.1.5

## 0.17.0

### Minor Changes

- 0a7b6de: ## Adds directive syntax for component hydration

  This change updates the syntax for partial hydration from `<Button:load />` to `<Button client:load />`.

  **Why?**

  Partial hydration is about to get super powers! This clears the way for more dynamic partial hydration, i.e. `<MobileMenu client:media="(max-width: 40em)" />`.

  **How to upgrade**

  Just update `:load`, `:idle`, and `:visible` to match the `client:load` format, thats it! Don't worry, the original syntax is still supported but it's recommended to future-proof your project by updating to the newer syntax.

## 0.16.3

### Patch Changes

- 5d1ff62: Hotfix for snowpack regression

## 0.16.2

### Patch Changes

- 20b4a60: Bugfix: do not override user `alias` passed into snowpack config
- 42a1fd7: Add command line flag `--silent` to astro to set no output.

## 0.16.1

### Patch Changes

- 2d3e369: Fix for using the snowpack polyfillNode option

## 0.16.0

### Minor Changes

- d396943: Add support for [`remark`](https://github.com/remarkjs/remark#readme) and [`rehype`](https://github.com/rehypejs/rehype#readme) plugins for both `.md` pages and `.astro` pages using the [`<Markdown>`](/docs/guides/markdown-content.md) component.

  For example, the `astro.config.mjs` could be updated to include the following. [Read the Markdown documentation](/docs/guides/markdown-content.md) for more information.

  > **Note** Enabling custom `remarkPlugins` or `rehypePlugins` removes Astro's built-in support for [GitHub-flavored Markdown](https://github.github.com/gfm/) support, [Footnotes](https://github.com/remarkjs/remark-footnotes) syntax, [Smartypants](https://github.com/silvenon/remark-smartypants). You must explicitly add these plugins to your `astro.config.mjs` file, if desired.

  ```js
  export default {
  	markdownOptions: {
  		remarkPlugins: ['remark-slug', ['remark-autolink-headings', { behavior: 'prepend' }]],
  		rehypePlugins: ['rehype-slug', ['rehype-autolink-headings', { behavior: 'prepend' }]],
  	},
  };
  ```

### Patch Changes

- Updated dependencies [d396943]
- Updated dependencies [f83407e]
  - @astrojs/markdown-support@0.2.0

## 0.15.5

### Patch Changes

- 7b4c97c: Adds support for `hydrationPolyfills` in renderers

  Renderers can not specify polyfills that must run before the component code runs for hydration:

  ```js
  export default {
  	name: '@matthewp/my-renderer',
  	server: './server.js',
  	client: './client.js',
  	hydrationPolyfills: ['./my-polyfill.js'],
  };
  ```

  These will still wait for hydration to occur, but will run before the component script does.

## 0.15.4

### Patch Changes

- 6a660f1: Adds low-level custom element support that renderers can use to enable server side rendering. This will be used in renderers such as a Lit renderer.
- Updated dependencies [6a660f1]
  - @astrojs/parser@0.15.4

## 0.15.3

### Patch Changes

- 17579c2: Improves the error message when attempting to use `window` in a component.

## 0.15.2

### Patch Changes

- 1e735bb: Allows passing in a class to a child component which will be scoped
- e28d5cb: Improve error handling within `.astro` files (#526)
- aa86057: Updates collections to match URLs by exact template filename
- f721275: Fix issue where Markdown could close it's parent element early (#494)

## 0.15.1

### Patch Changes

- 8865158: Fixes postcss bug with the 'from' property

## 0.15.0

### Minor Changes

- a136c85: **This is a breaking change!**

  Astro props are now accessed from the `Astro.props` global. This change is meant to make prop definitions more ergonomic, leaning into JavaScript patterns you already know (destructuring and defaults). Astro components previously used a prop syntax borrowed from [Svelte](https://svelte.dev/docs#1_export_creates_a_component_prop), but it became clear that this was pretty confusing for most users.

  ```diff
   ---
  + const { text = 'Hello world!' } = Astro.props;
  - export let text = 'Hello world!';
   ---

   <div>{text}</div>
  ```

  [Read more about the `.astro` syntax](https://docs.astro.build/syntax/#data-and-props)

  ***

  ### How do I define what props my component accepts?

  Astro frontmatter scripts are TypeScript! Because of this, we can leverage TypeScript types to define the shape of your props.

  ```ts
  ---
  export interface Props {
    text?: string;
  }
  const { text = 'Hello world!' } = Astro.props as Props;
  ---
  ```

  > **Note** Casting `Astro.props as Props` is a temporary workaround. We expect our Language Server to handle this automatically soon!

  ### How do I access props I haven't explicitly defined?

  One of the great things about this change is that it's straight-forward to access _any_ props. Just use `...props`!

  ```ts
  ---
  export interface Props {
    text?: string;
    [attr: string]: unknown;
  }
  const { text = 'Hello world!', ...props } = Astro.props as Props;
  ---
  ```

  ### What about prop validation?

  We considered building prop validation into Astro, but decided to leave that implementation up to you! This way, you can use any set of tools you like.

  ```ts
  ---
  const { text = 'Hello world!' } = Astro.props;

  if (typeof text !== 'string') throw new Error(`Expected "text" to be of type "string" but recieved "${typeof string}"!`);
  ---
  ```

### Patch Changes

- 4cd84c6: #528 Removes unused trapWarn function
- feb9a31: Fixes livereload on static pages
- 47ac2cc: Fix #521, allowing `{...spread}` props to work again
- 5629349: Bugfix: PostCSS errors in internal Snowpack PostCSS plugin
- Updated dependencies [21dc28c]
- Updated dependencies [47ac2cc]
  - @astrojs/renderer-react@0.1.4
  - @astrojs/parser@0.15.0

## 0.14.1

### Patch Changes

- 3f3e4f1: Allow `pageSize: Infinity` when creating a collection
- 44f429a: Allow node: prefix to load builtins

## 0.14.0

### Minor Changes

- 09b5779: Removes mounting the project folder and adds a `src` root option

## 0.13.12

_Rolling back to 0.13.10 to prevent a regression in the dev server output._

## 0.13.11

### Patch Changes

- 6573bea: Fixed README header aspect ratio
- 2671b6f: Fix [472](https://github.com/withastro/astro/issues/472) by not injecting `astro-*` scoped class unless it is actually used
- b547892: Makes providing a head element on pages optional
- b547892: Allows astro documents to omit the head element
- 0abd251: Allows renderers to provide knownEntrypoint config values
- Updated dependencies [0abd251]
  - @astrojs/renderer-preact@0.1.3
  - @astrojs/renderer-react@0.1.3
  - @astrojs/renderer-vue@0.1.3

## 0.13.10

### Patch Changes

- 233fbcd: Fix race condition caused by parallel build
- Updated dependencies [7f8d586]
  - @astrojs/parser@0.13.10

## 0.13.9

### Patch Changes

- 3ada25d: Pass configured Tailwind config file to the tailwindcss plugin
- f9f2da4: Add repository key to all package.json
- Updated dependencies [f9f2da4]
  - @astrojs/parser@0.13.9
  - @astrojs/prism@0.2.2
  - @astrojs/markdown-support@0.1.2

## 0.13.8

### Patch Changes

- 251b0b5: Less verbose HMR script
- 54c291e: Fix <script type="module"> resolution
- 272769d: Improve asset resolution
- 490f2be: Add support for Fragments with `<>` and `</>` syntax
- Updated dependencies [490f2be]
  - @astrojs/parser@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies [9d4a40f]
  - @astrojs/renderer-preact@0.1.2
  - @astrojs/renderer-react@0.1.2

## 0.13.6

### Patch Changes

- 016833a: Honors users HMR settings
- 73a43d9: Prevent dev from locking up on empty selectors

## 0.13.5

### Patch Changes

- 9f51e2d: Fix issue with arrow components in Preact/React

## 0.13.4

### Patch Changes

- 2d85409: Fixes serialization of boolean attributes
- e0989c6: Fix scoped CSS selector when class contains a colon
- 42dee79: Allows doctype to be written with any casing

## 0.13.3

### Patch Changes

- ab2972b: Update package.json engines for esm support
- Updated dependencies [ab2972b]
  - @astrojs/parser@0.13.3
  - @astrojs/prism@0.2.1
  - @astrojs/renderer-preact@0.1.1
  - @astrojs/renderer-react@0.1.1
  - @astrojs/renderer-svelte@0.1.1
  - @astrojs/renderer-vue@0.1.2

## 0.13.2

### Patch Changes

- c374a54: Bugfix: createCollection() API can be used without fetchContent()

## 0.13.1

### Patch Changes

- 61b5590: Pass "site" config to Snowpack as "baseUrl"

## 0.13.0

### Minor Changes

- ce93361: Set the minimum Node version in the engines field
- 1bab906: Removes a second instance of snowpack which degraded peformance

### Patch Changes

- 5fbc1cb: nit: ask user to modify devOptions.port when addr in use for dev

## 0.12.10

### Patch Changes

- 5cda571: Fix an issue with how files are watched during development

## 0.12.9

### Patch Changes

- 21b0c73: Removes some warnings that are internal to Astro

## 0.12.8

### Patch Changes

- f66fd1f: Fixes regression caused by attempting to prebuild an internal dep

## 0.12.7

### Patch Changes

- f6ef53b: Fixed a bug where recursive markdown was not working properly
- 5a871f3: Fixes logging to default to the info level
- f4a747f: improve build output

## 0.12.6

### Patch Changes

- 522c873: Fixes bug where astro build would fail when trying to log

## 0.12.5

### Patch Changes

- b1364af: Updates logging to display messages from Snowpack
- cc532cd: Properly resolve `tailwindcss` depedency if using Tailwind
- Updated dependencies [b1364af]
  - @astrojs/renderer-vue@0.1.1

## 0.12.4

### Patch Changes

- 0d6afae: Fixes a few small bugs with the `Markdown` component when there are multiple instances on the same page
- 1d930ff: Adds [`--verbose`](https://docs.astro.build/cli.md#--verbose) and [`--reload`](https://github.com/withastro/astro/blob/main/docs/cli/#--reload) flags to the `astro` CLI.

## 0.12.3

### Patch Changes

- fe6a985: Fixes resolution when esinstall installs Markdown and Prism components

## 0.12.2

### Patch Changes

- 50e6f49: Fixes issues with using astro via the create script
- Updated dependencies [50e6f49]
  - @astrojs/markdown-support@0.1.1

## 0.12.1

### Patch Changes

- Updated dependencies [6de740d]
  - astro-parser@0.12.1

## 0.12.0

### Minor Changes

- 8ff7998: Enable Snowpack's [built-in HMR support](https://www.snowpack.dev/concepts/hot-module-replacement) to enable seamless live updates while editing.
- ffb6380: Support for dynamic Markdown through the content attribute.
- 8ff7998: Enabled Snowpack's built-in HMR engine for Astro pages
- 643c880: **This is a breaking change**

  Updated the rendering pipeline for `astro` to truly support any framework.

  For the vast majority of use cases, `astro` should _just work_ out of the box. Astro now depends on `@astrojs/renderer-preact`, `@astrojs/renderer-react`, `@astrojs/renderer-svelte`, and `@astrojs/renderer-vue`, rather than these being built into the core library. This opens the door for anyone to contribute additional renderers for Astro to support their favorite framework, as well as the ability for users to control which renderers should be used.

  **Features**

  - Expose a pluggable interface for controlling server-side rendering and client-side hydration
  - Allows components from different frameworks to be nested within each other.
    > Note: `svelte` currently does support non-destructive hydration, so components from other frameworks cannot currently be nested inside of a Svelte component. See https://github.com/sveltejs/svelte/issues/4308.

  **Breaking Changes**

  - To improve compiler performance, improve framework support, and minimize JS payloads, any children passed to hydrated components are automatically wrapped with an `<astro-fragment>` element.

### Patch Changes

- 3d20623: Fixed a bug where Astro did not conform to JSX Expressions' [`&&`](https://reactjs.org/docs/conditional-rendering.html#inline-if-with-logical--operator) syntax.

  Also fixed a bug where `<span data-attr="" />` would render as `<span data-attr="undefined" />`.

- 46871d2: Fixed bug where a class attribute was added to the doctype
- c9d833e: Fixed a number of bugs and re-enabled the `@astrojs/renderer-vue` renderer
- ce30bb0: Temporarily disable `@astrojs/renderer-vue` while we investigate an issue with installation
- addd67d: Rename `astroConfig` to `pages` in config. Docs updated.
- d2330a5: Improve error display for missing local files
- Updated dependencies [643c880]
- Updated dependencies [d2330a5]
- Updated dependencies [c9d833e]
  - @astrojs/renderer-preact@0.1.0
  - @astrojs/renderer-react@0.1.0
  - @astrojs/renderer-svelte@0.1.0
  - @astrojs/renderer-vue@0.1.0
  - astro-parser@0.12.0

## 0.12.0-next.1

### Patch Changes

- ce30bb0: Temporarily disable `@astrojs/renderer-vue` while we investigate an issue with installation

## 0.12.0-next.0

### Minor Changes

- 8ff7998: Enable Snowpack's [built-in HMR support](https://www.snowpack.dev/concepts/hot-module-replacement) to enable seamless live updates while editing.
- 8ff7998: Enabled Snowpack's built-in HMR engine for Astro pages
- 643c880: **This is a breaking change**

  Updated the rendering pipeline for `astro` to truly support any framework.

  For the vast majority of use cases, `astro` should _just work_ out of the box. Astro now depends on `@astrojs/renderer-preact`, `@astrojs/renderer-react`, `@astrojs/renderer-svelte`, and `@astrojs/renderer-vue`, rather than these being built into the core library. This opens the door for anyone to contribute additional renderers for Astro to support their favorite framework, as well as the ability for users to control which renderers should be used.

  **Features**

  - Expose a pluggable interface for controlling server-side rendering and client-side hydration
  - Allows components from different frameworks to be nested within each other.
    > Note: `svelte` currently does support non-destructive hydration, so components from other frameworks cannot currently be nested inside of a Svelte component. See https://github.com/sveltejs/svelte/issues/4308.

  **Breaking Changes**

  - To improve compiler performance, improve framework support, and minimize JS payloads, any children passed to hydrated components are automatically wrapped with an `<astro-fragment>` element.

### Patch Changes

- 3d20623: Fixed a bug where Astro did not conform to JSX Expressions' [`&&`](https://reactjs.org/docs/conditional-rendering.html#inline-if-with-logical--operator) syntax.

  Also fixed a bug where `<span data-attr="" />` would render as `<span data-attr="undefined" />`.

- Updated dependencies [643c880]
  - @astrojs/renderer-preact@0.1.0-next.0
  - @astrojs/renderer-react@0.1.0-next.0
  - @astrojs/renderer-svelte@0.1.0-next.0
  - @astrojs/renderer-vue@0.1.0-next.0

## 0.11.0

### Minor Changes

- 19e20f2: Add Tailwind JIT support for Astro

### Patch Changes

- c43ee95: Bugfix: CSS bundling randomizes order
- 9cdada0: Fixes a few edge case bugs with Astro's handling of Markdown content
- Updated dependencies [9cdada0]
  - astro-parser@0.11.0

## 0.10.0

`astro` has been bumped to `0.10.0` to avoid conflicts with the previously published `astro` package (which was graciously donated to us at `v0.9.2`).

### Minor Changes

- b3886c2: Enhanced **Markdown** support! Markdown processing has been moved from `micromark` to `remark` to prepare Astro for user-provided `remark` plugins _in the future_.

  This change also introduces a built-in `<Markdown>` component for embedding Markdown and any Astro-supported component format inside of `.astro` files. [Read more about Astro's Markdown support.](https://docs.astro.build/markdown/)

### Patch Changes

- 9d092b5: Bugfix: Windows collection API path bug
- Updated dependencies [b3886c2]
  - astro-parser@0.1.0

## 0.0.13

### Patch Changes

- 7184149: Added canonical URL and site globals for .astro files
- b81abd5: Add CSS bundling
- 7b55d3d: chore: Remove non-null assertions
- 000464b: Fix bug when building Svelte components
- 95b1733: Fix: wait for async operation to finish
- e0a4f5f: Allow renaming for default import components
- 9feffda: Bugfix: fixes double <pre> tags generated from markdown code blocks
- 87ab4c6: Bugfix: Scoped CSS with pseudoclasses and direct children selectors
- e0fc2ca: fix: build stuck on unhandled promise reject

## 0.0.11

### Patch Changes

- 3ad0aac: Fix `fetchContent` API bug for nested `.md` files

## 0.0.10

### Patch Changes

- d924fcb: Fix issue with Prism component missing dependency
- Updated dependencies [d924fcb]
  - astro-prism@0.0.2
