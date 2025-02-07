# astro

## 5.2.5

### Patch Changes

- [#13133](https://github.com/withastro/astro/pull/13133) [`e76aa83`](https://github.com/withastro/astro/commit/e76aa8391eb9d81c1a52fb2f9f21ede4790bd793) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where Astro was failing to build an external redirect when the middleware was triggered

- [#13119](https://github.com/withastro/astro/pull/13119) [`ac43580`](https://github.com/withastro/astro/commit/ac4358052af2c1817dec999598bc4e3d8fd0bdaf) Thanks [@Hacksore](https://github.com/Hacksore)! - Adds extra guidance in the terminal when using the `astro add tailwind` CLI command

  Now, users are given a friendly reminder to import the stylesheet containing their Tailwind classes into any pages where they want to use Tailwind. Commonly, this is a shared layout component so that Tailwind styling can be used on multiple pages.

## 5.2.4

### Patch Changes

- [#13130](https://github.com/withastro/astro/pull/13130) [`b71bd10`](https://github.com/withastro/astro/commit/b71bd10989c0070847cecb101afb8278d5ef7091) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused duplicate slashes inside query params to be collapsed

- [#13131](https://github.com/withastro/astro/pull/13131) [`d60c742`](https://github.com/withastro/astro/commit/d60c74243f639761ad735d66d814e627f8f847a2) Thanks [@ascorbic](https://github.com/ascorbic)! - Ignores trailing slashes for endpoints with file extensions in the route

- Updated dependencies [[`b71bd10`](https://github.com/withastro/astro/commit/b71bd10989c0070847cecb101afb8278d5ef7091)]:
  - @astrojs/internal-helpers@0.5.1

## 5.2.3

### Patch Changes

- [#13113](https://github.com/withastro/astro/pull/13113) [`3a26e45`](https://github.com/withastro/astro/commit/3a26e4541764085faa499bc63549b24d194146a6) Thanks [@unprintable123](https://github.com/unprintable123)! - Fixes the bug that rewrite will pass encoded url to the dynamic routing and cause params mismatch.

- [#13111](https://github.com/withastro/astro/pull/13111) [`23978dd`](https://github.com/withastro/astro/commit/23978ddfe127bbc3762b6209b42d049588e52a14) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused injected endpoint routes to return not found when trailingSlash was set to always

- [#13112](https://github.com/withastro/astro/pull/13112) [`0fa5c82`](https://github.com/withastro/astro/commit/0fa5c82977de73872ddeffffea48fddafba47398) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the i18n middleware was blocking a server island request when the `prefixDefaultLocale` option is set to `true`

## 5.2.2

### Patch Changes

- [#13106](https://github.com/withastro/astro/pull/13106) [`187c4d3`](https://github.com/withastro/astro/commit/187c4d3244a27c9b4e7e3cbe6307b01161140ca1) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused peer dependency errors when running `astro add tailwind`

## 5.2.1

### Patch Changes

- [#13095](https://github.com/withastro/astro/pull/13095) [`740eb60`](https://github.com/withastro/astro/commit/740eb6019f405781a3918941d3bfb34a7bda1a3d) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused some dev server asset requests to return 404 when trailingSlash was set to "always"

## 5.2.0

### Minor Changes

- [#12994](https://github.com/withastro/astro/pull/12994) [`5361755`](https://github.com/withastro/astro/commit/536175528dbbe75aa978d615ba2517b64bad7879) Thanks [@ascorbic](https://github.com/ascorbic)! - Redirects trailing slashes for on-demand pages

  When the `trailingSlash` option is set to `always` or `never`, on-demand rendered pages will now redirect to the correct URL when the trailing slash doesn't match the configuration option. This was previously the case for static pages, but now works for on-demand pages as well.

  Now, it doesn't matter whether your visitor navigates to `/about/`, `/about`, or even `/about///`. In production, they'll always end up on the correct page. For GET requests, the redirect will be a 301 (permanent) redirect, and for all other request methods, it will be a 308 (permanent, and preserve the request method) redirect.

  In development, you'll see a helpful 404 page to alert you of a trailing slash mismatch so you can troubleshoot routes.

- [#12979](https://github.com/withastro/astro/pull/12979) [`e621712`](https://github.com/withastro/astro/commit/e621712109b79313b24924ec4f0ba4f8ab6201c2) Thanks [@ematipico](https://github.com/ematipico)! - Adds support for redirecting to external sites with the [`redirects`](https://docs.astro.build/en/reference/configuration-reference/#redirects) configuration option.

  Now, you can redirect routes either internally to another path or externally by providing a URL beginning with `http` or `https`:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    redirects: {
      '/blog': 'https://example.com/blog',
      '/news': {
        status: 302,
        destination: 'https://example.com/news',
      },
    },
  });
  ```

- [#13084](https://github.com/withastro/astro/pull/13084) [`0f3be31`](https://github.com/withastro/astro/commit/0f3be3104e62d5b50dabfb15023f97954a160b8e) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new experimental virtual module `astro:config` that exposes a type-safe subset of your `astro.config.mjs` configuration

  The virtual module exposes two sub-paths for controlled access to your configuration:

  - `astro:config/client`: exposes config information that is safe to expose to the client.
  - `astro:config/server`: exposes additional information that is safe to expose to the server, such as file/dir paths.

  To enable this new virtual module, add the `experimental.serializeManifest` feature flag to your Astro config:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  export default defineConfig({
    experimental: {
      serializeManifest: true,
    },
  });
  ```

  Then, you can access the module in any file inside your project to import and use values from your Astro config:

  ```js
  // src/utils.js
  import { trailingSlash } from 'astro:config/client';

  function addForwardSlash(path) {
    if (trailingSlash === 'always') {
      return path.endsWith('/') ? path : path + '/';
    } else {
      return path;
    }
  }
  ```

  For a complete overview, and to give feedback on this experimental API, see the [Serialized Manifest RFC](https://github.com/withastro/roadmap/blob/feat/serialised-config/proposals/0051-serialized-manifest.md).

### Patch Changes

- [#13049](https://github.com/withastro/astro/pull/13049) [`2ed4bd9`](https://github.com/withastro/astro/commit/2ed4bd90f25a3e5a183d0bc862e3b359b8289b93) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `astro add tailwind` to add the `@tailwindcss/vite` plugin instead of the `@astrojs/tailwind` integration

- [#12994](https://github.com/withastro/astro/pull/12994) [`5361755`](https://github.com/withastro/astro/commit/536175528dbbe75aa978d615ba2517b64bad7879) Thanks [@ascorbic](https://github.com/ascorbic)! - Returns a more helpful 404 page in dev if there is a trailing slash mismatch between the route requested and the `trailingSlash` configuration

- [#12666](https://github.com/withastro/astro/pull/12666) [`037495d`](https://github.com/withastro/astro/commit/037495d437d2328bf10ffadc22cc114ccf474c65) Thanks [@Thodor12](https://github.com/Thodor12)! - Added additional generated typings for the content layer

- Updated dependencies [[`5361755`](https://github.com/withastro/astro/commit/536175528dbbe75aa978d615ba2517b64bad7879), [`db252e0`](https://github.com/withastro/astro/commit/db252e0692a0addf7239bfefc0220c525d63337d)]:
  - @astrojs/internal-helpers@0.5.0
  - @astrojs/markdown-remark@6.1.0

## 5.1.10

### Patch Changes

- [#13058](https://github.com/withastro/astro/pull/13058) [`1a14b53`](https://github.com/withastro/astro/commit/1a14b53678525379211c4a7cbcbc34a04c0e4f8d) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes broken type declaration

- [#13059](https://github.com/withastro/astro/pull/13059) [`e36837f`](https://github.com/withastro/astro/commit/e36837f91437a66d5c50eb1c399b3d812743251d) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused tsconfig path aliases to break if there was more than one wildcard pattern

- [#13045](https://github.com/withastro/astro/pull/13045) [`c7f1366`](https://github.com/withastro/astro/commit/c7f1366413692091bb8d62d901745a77fa663b18) Thanks [@mtwilliams-code](https://github.com/mtwilliams-code)! - Fixes a bug where the some utility functions of the `astro:i18n` virtual module would return an incorrect result when `trailingSlash` is set to `never`

## 5.1.9

### Patch Changes

- [#12986](https://github.com/withastro/astro/pull/12986) [`8911bda`](https://github.com/withastro/astro/commit/8911bdacabb7fffb82bb3b3628467731ea233187) Thanks [@wetheredge](https://github.com/wetheredge)! - Updates types and dev toolbar for ARIA 1.2 attributes and roles

- [#12892](https://github.com/withastro/astro/pull/12892) [`8f520f1`](https://github.com/withastro/astro/commit/8f520f1cc67db51feb966c710e72490a05b88954) Thanks [@louisescher](https://github.com/louisescher)! - Adds a more descriptive error when a content collection entry has an invalid ID.

- [#13031](https://github.com/withastro/astro/pull/13031) [`f576519`](https://github.com/withastro/astro/commit/f5765196e9cd5c582da04ae3bceb4ee1d62b7eae) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates the server islands encoding logic to only escape the script end tag open delimiter and opening HTML comment syntax

- [#13026](https://github.com/withastro/astro/pull/13026) [`1d272f6`](https://github.com/withastro/astro/commit/1d272f6a5a3af16ad2ab9af41b7193ce67964b69) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a regression that prevented the import of Markdown files as raw text or URLs.

## 5.1.8

### Patch Changes

- [#12998](https://github.com/withastro/astro/pull/12998) [`9ce0038`](https://github.com/withastro/astro/commit/9ce003802109f704cc1f081759f3d2af2c1ea2c2) Thanks [@Kynson](https://github.com/Kynson)! - Fixes the issue that audit incorrectly flag images as above the fold when the scrolling container is not body

- [#12990](https://github.com/withastro/astro/pull/12990) [`2e12f1d`](https://github.com/withastro/astro/commit/2e12f1d7526f12fa0e1e63482f100bbb81a8b36e) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused references to be incorrectly reported as invalid

- [#12984](https://github.com/withastro/astro/pull/12984) [`2d259cf`](https://github.com/withastro/astro/commit/2d259cf4abf27a4f0a067bedb32d0459c4fce507) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug in dev where files would stop being watched if the Astro config file was edited

- [#12984](https://github.com/withastro/astro/pull/12984) [`2d259cf`](https://github.com/withastro/astro/commit/2d259cf4abf27a4f0a067bedb32d0459c4fce507) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where the content layer would use an outdated version of the Astro config if it was edited in dev

- [#12982](https://github.com/withastro/astro/pull/12982) [`429aa75`](https://github.com/withastro/astro/commit/429aa7547572915b5f7f9a4146529e704069128b) Thanks [@bluwy](https://github.com/bluwy)! - Fixes an issue where server islands do not work in projects that use an adapter but only have prerendered pages. If an adapter is added, the server island endpoint will now be added by default.

- [#12995](https://github.com/withastro/astro/pull/12995) [`78fd73a`](https://github.com/withastro/astro/commit/78fd73a0dfbfab120111d5f1d1eaecd563bc82a6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `astro:actions` types would not work when using `src/actions.ts`

- [#13011](https://github.com/withastro/astro/pull/13011) [`cf30880`](https://github.com/withastro/astro/commit/cf3088060d45227dcb48e041c4ed5e0081d71398) Thanks [@ascorbic](https://github.com/ascorbic)! - Upgrades Vite

- [#12733](https://github.com/withastro/astro/pull/12733) [`bbf1d88`](https://github.com/withastro/astro/commit/bbf1d8894e6ce5d2ebe45452a27072b9929053a8) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused the dev server to return an error if requesting "//"

- [#13001](https://github.com/withastro/astro/pull/13001) [`627aec3`](https://github.com/withastro/astro/commit/627aec3f04de424ec144cefac4a5a3b70d9ba0fb) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused Astro to attempt to inject environment variables into non-source files, causing performance problems and broken builds

## 5.1.7

### Patch Changes

- [#12361](https://github.com/withastro/astro/pull/12361) [`3d89e62`](https://github.com/withastro/astro/commit/3d89e6282235a8da45d9ddfe02bcf7ec78056941) Thanks [@LunaticMuch](https://github.com/LunaticMuch)! - Upgrades the `esbuild` version to match `vite`

- [#12980](https://github.com/withastro/astro/pull/12980) [`1a026af`](https://github.com/withastro/astro/commit/1a026afb427cd4b472c8f1174a08f10086f4fb89) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where setting the status of a page to `404` in development would show the default 404 page (or custom one if provided) instead of using the current page

- [#12182](https://github.com/withastro/astro/pull/12182) [`c30070b`](https://github.com/withastro/astro/commit/c30070b9271e4c494e7cbf3a1c45515782034911) Thanks [@braden-w](https://github.com/braden-w)! - Improves matching of 404 and 500 routes

- Updated dependencies [[`3d89e62`](https://github.com/withastro/astro/commit/3d89e6282235a8da45d9ddfe02bcf7ec78056941)]:
  - @astrojs/markdown-remark@6.0.2

## 5.1.6

### Patch Changes

- [#12956](https://github.com/withastro/astro/pull/12956) [`3aff68a`](https://github.com/withastro/astro/commit/3aff68a4195a608e92dc6299610a4b06e7bb96f1) Thanks [@kaytwo](https://github.com/kaytwo)! - Removes encryption of empty props to allow server island cacheability

- [#12977](https://github.com/withastro/astro/pull/12977) [`80067c0`](https://github.com/withastro/astro/commit/80067c032f9ce5852f3315d1046b2d0c220ddcd5) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where accessing `astro:env` APIs or `import.meta.env` inside the content config file would not work

- [#12839](https://github.com/withastro/astro/pull/12839) [`57be349`](https://github.com/withastro/astro/commit/57be3494e2bdc178d073243c8cbfa10edb85b049) Thanks [@mtwilliams-code](https://github.com/mtwilliams-code)! - Fix Astro.currentLocale returning the incorrect locale when using fallback rewrites in SSR mode

- [#12962](https://github.com/withastro/astro/pull/12962) [`4b7a2ce`](https://github.com/withastro/astro/commit/4b7a2ce9e743a5624617563022635678a5ba6051) Thanks [@ascorbic](https://github.com/ascorbic)! - Skips updating content layer files if content is unchanged

- [#12942](https://github.com/withastro/astro/pull/12942) [`f00c2dd`](https://github.com/withastro/astro/commit/f00c2ddc31b5285d14c2f0808c01eafaaf31f5c9) Thanks [@liruifengv](https://github.com/liruifengv)! - Improves the session error messages

- [#12966](https://github.com/withastro/astro/pull/12966) [`d864e09`](https://github.com/withastro/astro/commit/d864e0991e05438d4bdb5e14fab4f7f75efe2a1f) Thanks [@ascorbic](https://github.com/ascorbic)! - Ensures old content collection entry is deleted if a markdown frontmatter slug is changed in dev

## 5.1.5

### Patch Changes

- [#12934](https://github.com/withastro/astro/pull/12934) [`673a518`](https://github.com/withastro/astro/commit/673a518b011e2df35a099f8205611d98a223a92a) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where the Astro Container didn't work during the build, using `pnpm`

- [#12955](https://github.com/withastro/astro/pull/12955) [`db447f2`](https://github.com/withastro/astro/commit/db447f2816836b635355cc2b0a73678facd155a5) Thanks [@martrapp](https://github.com/martrapp)! - Lets TypeScript know about the "blocking" and "disabled" attributes of the `<link>` element.

- [#12922](https://github.com/withastro/astro/pull/12922) [`faf74af`](https://github.com/withastro/astro/commit/faf74af522f4499ab95531b24a0a1c14070abe8b) Thanks [@adamchal](https://github.com/adamchal)! - Improves performance of static asset generation by fixing a bug that caused image transforms to be performed serially. This fix ensures that processing uses all CPUs when running in a multi-core environment.

- [#12947](https://github.com/withastro/astro/pull/12947) [`3c2292f`](https://github.com/withastro/astro/commit/3c2292f2f0accf1974b30dbe32f040c56413e731) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused empty content collections when running dev with NODE_ENV set

## 5.1.4

### Patch Changes

- [#12927](https://github.com/withastro/astro/pull/12927) [`ad2a752`](https://github.com/withastro/astro/commit/ad2a752662946e3a80849605f073812b06adf632) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where Astro attempted to decode a request URL multiple times, resulting in an unexpected behaviour when decoding the character `%`

- [#12912](https://github.com/withastro/astro/pull/12912) [`0c0c66b`](https://github.com/withastro/astro/commit/0c0c66bf0df23ab5a9bd2f147e303d8397d3222e) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the config error for invalid combinations of `context` and `access` properties under `env.schema`

- [#12935](https://github.com/withastro/astro/pull/12935) [`3d47e6b`](https://github.com/withastro/astro/commit/3d47e6baff7a17d3ef09630b0d90362baef41f97) Thanks [@AirBorne04](https://github.com/AirBorne04)! - Fixes an issue where `Astro.locals` coming from an adapter weren't available in the `404.astro`, when using the `astro dev` command,

- [#12925](https://github.com/withastro/astro/pull/12925) [`44841fc`](https://github.com/withastro/astro/commit/44841fc281f8920b32f4b4a94deefeb3ad069cf3) Thanks [@ascorbic](https://github.com/ascorbic)! - Ensures image styles are not imported unless experimental responsive images are enabled

- [#12926](https://github.com/withastro/astro/pull/12926) [`8e64bb7`](https://github.com/withastro/astro/commit/8e64bb727f78f24b26fd1c0b1289ab1ccd611114) Thanks [@oliverlynch](https://github.com/oliverlynch)! - Improves remote image cache efficiency by separating image data and metadata into a binary and sidecar JSON file.

- [#12920](https://github.com/withastro/astro/pull/12920) [`8b9d530`](https://github.com/withastro/astro/commit/8b9d53037879cd7ca7bee4d20b4e6f08e984a7df) Thanks [@bluwy](https://github.com/bluwy)! - Processes markdown with empty body as remark and rehype plugins may add additional content or frontmatter

- [#12918](https://github.com/withastro/astro/pull/12918) [`fd12a26`](https://github.com/withastro/astro/commit/fd12a26ac6012c6b8a26f5a178e1bb46092a1806) Thanks [@lameuler](https://github.com/lameuler)! - Fixes a bug where the logged output path does not match the actual output path when using `build.format: 'preserve'`

- [#12676](https://github.com/withastro/astro/pull/12676) [`2ffc0fc`](https://github.com/withastro/astro/commit/2ffc0fcab78b658a6ee73a8f8b291802093dce5e) Thanks [@koyopro](https://github.com/koyopro)! - Allows configuring Astro modules TypeScript compilation with the `vite.esbuild` config

- [#12938](https://github.com/withastro/astro/pull/12938) [`dbb04f3`](https://github.com/withastro/astro/commit/dbb04f3c04ce868b5c985c848a2c40a3761a6dad) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where content collections would sometimes appear empty when first running astro dev

- [#12937](https://github.com/withastro/astro/pull/12937) [`30edb6d`](https://github.com/withastro/astro/commit/30edb6d9d0aaf28bea1fec73879f63fe134507d0) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where users could use `Astro.request.headers` during a rewrite inside prerendered routes. This an invalid behaviour, and now Astro will show a warning if this happens.

- [#12937](https://github.com/withastro/astro/pull/12937) [`30edb6d`](https://github.com/withastro/astro/commit/30edb6d9d0aaf28bea1fec73879f63fe134507d0) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the use of `Astro.rewrite` would trigger the invalid use of `Astro.request.headers`

## 5.1.3

### Patch Changes

- [#12877](https://github.com/withastro/astro/pull/12877) [`73a0788`](https://github.com/withastro/astro/commit/73a078835eb92a05c3f681ee025c93d6db85b907) Thanks [@bluwy](https://github.com/bluwy)! - Fixes sourcemap warning generated by the `astro:server-islands` Vite plugin

- [#12906](https://github.com/withastro/astro/pull/12906) [`2d89492`](https://github.com/withastro/astro/commit/2d89492d73142ed5c7cea9448d841a9892e66598) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused pages that return an empty array from getStaticPath to match every path

- [`011fa0f`](https://github.com/withastro/astro/commit/011fa0f00ce457cb6b582d36b6b5b17aa89f0a70) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `astro:content` types would be erased when restarting the dev server

- [#12907](https://github.com/withastro/astro/pull/12907) [`dbf1275`](https://github.com/withastro/astro/commit/dbf1275987d4d9724eab471f1600fba9a50aefb8) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a regression around the server islands route, which was not passed to the adapters `astro:build:done` hook

- [#12818](https://github.com/withastro/astro/pull/12818) [`579bd93`](https://github.com/withastro/astro/commit/579bd93794b787485479aa3b16554409a0504ed2) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes race condition where dev server would attempt to load collections before the content had loaded

- [#12883](https://github.com/withastro/astro/pull/12883) [`fbac92f`](https://github.com/withastro/astro/commit/fbac92f8bdbb5ee1312726b2a535a81271b3f7d6) Thanks [@kaytwo](https://github.com/kaytwo)! - Fixes a bug where responses can be returned before session data is saved

- [#12815](https://github.com/withastro/astro/pull/12815) [`3acc654`](https://github.com/withastro/astro/commit/3acc65444c27d87b6f2d61bdfa7df0e0db4e2686) Thanks [@ericswpark](https://github.com/ericswpark)! - Some non-index files that were incorrectly being treated as index files are now excluded

- [#12884](https://github.com/withastro/astro/pull/12884) [`d7e97a7`](https://github.com/withastro/astro/commit/d7e97a775dda7a851bfc10b06161f9a1d3631ed3) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds `render()` to stub content types

- [#12883](https://github.com/withastro/astro/pull/12883) [`fbac92f`](https://github.com/withastro/astro/commit/fbac92f8bdbb5ee1312726b2a535a81271b3f7d6) Thanks [@kaytwo](https://github.com/kaytwo)! - Fixes a bug where session data could be corrupted if it is changed after calling .set()

- [#12827](https://github.com/withastro/astro/pull/12827) [`7b5dc6f`](https://github.com/withastro/astro/commit/7b5dc6f0f1fbb825f52cd587aa1f7d21d731b3de) Thanks [@sinskiy](https://github.com/sinskiy)! - Fixes an issue when crawlers try to index Server Islands thinking that Server Islands are pages

## 5.1.2

### Patch Changes

- [#12798](https://github.com/withastro/astro/pull/12798) [`7b0cb85`](https://github.com/withastro/astro/commit/7b0cb852f6336c0f9cc65bd044864004e759d810) Thanks [@ascorbic](https://github.com/ascorbic)! - Improves warning logs for invalid content collection configuration

- [#12781](https://github.com/withastro/astro/pull/12781) [`96c4b92`](https://github.com/withastro/astro/commit/96c4b925333fede1a53d19657d15e0052da90780) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a regression that caused `default()` to not work with `reference()`

- [#12820](https://github.com/withastro/astro/pull/12820) [`892dd9f`](https://github.com/withastro/astro/commit/892dd9f6cd3935ce1d4f4dec523b248c2d15da12) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused cookies to not be deleted when destroying a session

- [#12864](https://github.com/withastro/astro/pull/12864) [`440d8a5`](https://github.com/withastro/astro/commit/440d8a54f7b3d75dd16decb7d9d29e3724bff394) Thanks [@kaytwo](https://github.com/kaytwo)! - Fixes a bug where the session ID wasn't correctly regenerated

- [#12768](https://github.com/withastro/astro/pull/12768) [`524c855`](https://github.com/withastro/astro/commit/524c855075bb75696500445fdc31cb2c69b09627) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro didn't print error logs when Astro Islands were used in incorrect cases.

- [#12814](https://github.com/withastro/astro/pull/12814) [`f12f111`](https://github.com/withastro/astro/commit/f12f1118bc4687cc807a4495ffcaafcb0861b7a2) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro didn't log anything in case a file isn't created during the build.

- [#12875](https://github.com/withastro/astro/pull/12875) [`e109002`](https://github.com/withastro/astro/commit/e109002c3d5980362788360211e61f11f4394837) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug in emulated legacy collections where the entry passed to the getCollection filter function did not include the legacy entry fields.

- [#12768](https://github.com/withastro/astro/pull/12768) [`524c855`](https://github.com/withastro/astro/commit/524c855075bb75696500445fdc31cb2c69b09627) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro was printing the incorrect output format when running the `astro build` command

- [#12810](https://github.com/withastro/astro/pull/12810) [`70a9f0b`](https://github.com/withastro/astro/commit/70a9f0b984638c21a4da1d83b7d5a5c9940bb693) Thanks [@louisescher](https://github.com/louisescher)! - Fixes server islands failing to check content-type header under certain circumstances

  Sometimes a reverse proxy or similar service might modify the content-type header to include the charset or other parameters in the media type of the response. This previously wasn't handled by the client-side server island script and thus removed the script without actually placing the requested content in the DOM. This fix makes it so the script checks if the header starts with the proper content type instead of exactly matching `text/html`, so the following will still be considered a valid header: `text/html; charset=utf-8`

- [#12816](https://github.com/withastro/astro/pull/12816) [`7fb2184`](https://github.com/withastro/astro/commit/7fb21844dff893c90dc0a07fd13cefdba61d0a45) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where an injected route entrypoint wasn't correctly marked because the resolved file path contained a query parameter.

  This fixes some edge case where some injected entrypoint were not resolved when using an adapter.

## 5.1.1

### Patch Changes

- [#12782](https://github.com/withastro/astro/pull/12782) [`f3d8385`](https://github.com/withastro/astro/commit/f3d83854aa671df4db6f95558a7ef5bad4bc64f9) Thanks [@fhiromasa](https://github.com/fhiromasa)! - update comment in packages/astro/src/types/public/common.ts

- [#12789](https://github.com/withastro/astro/pull/12789) [`f632b94`](https://github.com/withastro/astro/commit/f632b945275c2615fc0fdf2abc831c45d0ddebcd) Thanks [@ascorbic](https://github.com/ascorbic)! - Pass raw frontmatter to remark plugins in glob loader

- [#12799](https://github.com/withastro/astro/pull/12799) [`739dbfb`](https://github.com/withastro/astro/commit/739dbfba4214107cf8fc40c702834dad33eed3b0) Thanks [@ascorbic](https://github.com/ascorbic)! - Upgrades Vite to pin esbuild

## 5.1.0

### Minor Changes

- [#12441](https://github.com/withastro/astro/pull/12441) [`b4fec3c`](https://github.com/withastro/astro/commit/b4fec3c7d17ed92dcaaeea5e2545aae6dfd19e53) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds experimental session support

  Sessions are used to store user state between requests for server-rendered pages, such as login status, shopping cart contents, or other user-specific data.

  ```astro
  ---
  export const prerender = false; // Not needed in 'server' mode
  const cart = await Astro.session.get('cart');
  ---

  <a href="/checkout">🛒 {cart?.length ?? 0} items</a>
  ```

  Sessions are available in on-demand rendered/SSR pages, API endpoints, actions and middleware. To enable session support, you must configure a storage driver.

  If you are using the Node.js adapter, you can use the `fs` driver to store session data on the filesystem:

  ```js
  // astro.config.mjs
  {
    adapter: node({ mode: 'standalone' }),
    experimental: {
      session: {
        // Required: the name of the unstorage driver
        driver: "fs",
      },
    },
  }
  ```

  If you are deploying to a serverless environment, you can use drivers such as `redis`, `netlify-blobs`, `vercel-kv`, or `cloudflare-kv-binding` and optionally pass additional configuration options.

  For more information, including using the session API with other adapters and a full list of supported drivers, see [the docs for experimental session support](https://docs.astro.build/en/reference/experimental-flags/sessions/). For even more details, and to leave feedback and participate in the development of this feature, [the Sessions RFC](https://github.com/withastro/roadmap/pull/1055).

- [#12426](https://github.com/withastro/astro/pull/12426) [`3dc02c5`](https://github.com/withastro/astro/commit/3dc02c57e4060cb2bde7c4e05d91841dd5dd8eb7) Thanks [@oliverlynch](https://github.com/oliverlynch)! - Improves asset caching of remote images

  Astro will now store [entity tags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) and the [Last-Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified) date for cached remote images and use them to revalidate the cache when it goes stale.

- [#12721](https://github.com/withastro/astro/pull/12721) [`c9d5110`](https://github.com/withastro/astro/commit/c9d51107d0a4b58a9ced486b28d09118f3885254) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new `getActionPath()` helper available from `astro:actions`

  Astro 5.1 introduces a new helper function, `getActionPath()` to give you more flexibility when calling your action.

  Calling `getActionPath()` with your action returns its URL path so you can make a `fetch()` request with custom headers, or use your action with an API such as `navigator.sendBeacon()`. Then, you can [handle the custom-formatted returned data](https://docs.astro.build/en/guides/actions/#handling-returned-data) as needed, just as if you had called an action directly.

  This example shows how to call a defined `like` action passing the `Authorization` header and the [`keepalive`](https://developer.mozilla.org/en-US/docs/Web/API/Request/keepalive) option:

  ```astro
  <script>
    // src/components/my-component.astro
    import { actions, getActionPath } from 'astro:actions';

    await fetch(getActionPath(actions.like), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer YOUR_TOKEN',
      },
      body: JSON.stringify({ id: 'YOUR_ID' }),
      keepalive: true,
    });
  </script>
  ```

  This example shows how to call the same `like` action using the [`sendBeacon`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) API:

  ```astro
  <script>
    // src/components/my-component.astro
    import { actions, getActionPath } from 'astro:actions';

    navigator.sendBeacon(
      getActionPath(actions.like),
      new Blob([JSON.stringify({ id: 'YOUR_ID' })], {
        type: 'application/json',
      }),
    );
  </script>
  ```

### Patch Changes

- [#12786](https://github.com/withastro/astro/pull/12786) [`e56af4a`](https://github.com/withastro/astro/commit/e56af4a3d7039673658e4a014158969ea5076e32) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro i18n didn't properly show the 404 page when using fallback and the option `prefixDefaultLocale` set to `true`.

- [#12758](https://github.com/withastro/astro/pull/12758) [`483da89`](https://github.com/withastro/astro/commit/483da89cf68d68ec792ff8721d469ed10dc14e4a) Thanks [@delucis](https://github.com/delucis)! - Adds types for `?url&inline` and `?url&no-inline` [import queries](https://vite.dev/guide/assets.html#explicit-inline-handling) added in Vite 6

- [#12763](https://github.com/withastro/astro/pull/12763) [`8da2318`](https://github.com/withastro/astro/commit/8da231855162af245f2b3664babb68dff0ba390f) Thanks [@rbsummers](https://github.com/rbsummers)! - Fixed changes to vite configuration made in the astro:build:setup integration hook having no effect when target is "client"

- [#12767](https://github.com/withastro/astro/pull/12767) [`36c1e06`](https://github.com/withastro/astro/commit/36c1e0697da9fdc453a7a9a3c84e0e79cd0cb376) Thanks [@ascorbic](https://github.com/ascorbic)! - Clears the content layer cache when the Astro config is changed

## 5.0.9

### Patch Changes

- [#12756](https://github.com/withastro/astro/pull/12756) [`95795f8`](https://github.com/withastro/astro/commit/95795f85dbd85ff29ee2ff4860d018fd4e9bcf8f) Thanks [@matthewp](https://github.com/matthewp)! - Remove debug logging from build

## 5.0.8

### Patch Changes

- [#12749](https://github.com/withastro/astro/pull/12749) [`039d022`](https://github.com/withastro/astro/commit/039d022b1bbaacf9ea83071d27affc5318e0e515) Thanks [@matthewp](https://github.com/matthewp)! - Clean server sourcemaps from static output

## 5.0.7

### Patch Changes

- [#12746](https://github.com/withastro/astro/pull/12746) [`c879f50`](https://github.com/withastro/astro/commit/c879f501ff01b1a3c577de776a1f7100d78f8dd5) Thanks [@matthewp](https://github.com/matthewp)! - Remove all assets created from the server build

## 5.0.6

### Patch Changes

- [#12597](https://github.com/withastro/astro/pull/12597) [`564ac6c`](https://github.com/withastro/astro/commit/564ac6c2f2d77ee34f8519f1e5a4db2c6e194f65) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes an issue where image and server islands routes would not be passed to the `astro:routes:resolved` hook during builds

- [#12718](https://github.com/withastro/astro/pull/12718) [`ccc5ad1`](https://github.com/withastro/astro/commit/ccc5ad1676db5e7f5049ca2feb59802d1fe3a92e) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro couldn't correctly handle i18n fallback when using the i18n middleware

- [#12728](https://github.com/withastro/astro/pull/12728) [`ee66a45`](https://github.com/withastro/astro/commit/ee66a45b250703a40b34c0a45ae34aefcb14ea44) Thanks [@argyleink](https://github.com/argyleink)! - Adds type support for the `closedby` attribute for `<dialog>` elements

- [#12709](https://github.com/withastro/astro/pull/12709) [`e3bfd93`](https://github.com/withastro/astro/commit/e3bfd9396969caf35b3b05135539e82aab560c92) Thanks [@mtwilliams-code](https://github.com/mtwilliams-code)! - Fixes a bug where Astro couldn't correctly parse `params` and `props` when receiving i18n fallback URLs

- [#12657](https://github.com/withastro/astro/pull/12657) [`14dffcc`](https://github.com/withastro/astro/commit/14dffcc3af49dd975635602a0d1847a3125c0746) Thanks [@darkmaga](https://github.com/darkmaga)! - Trailing slash support for actions

- [#12715](https://github.com/withastro/astro/pull/12715) [`029661d`](https://github.com/withastro/astro/commit/029661daa9b28fd5299d8cc9360025c78f6cd8eb) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused errors in dev when editing sites with large numbers of MDX pages

- [#12729](https://github.com/withastro/astro/pull/12729) [`8b1cecd`](https://github.com/withastro/astro/commit/8b1cecd6b491654ae760a0c75f3270df134c4e25) Thanks [@JoeMorgan](https://github.com/JoeMorgan)! - "Added `inert` to htmlBooleanAttributes"

- [#12726](https://github.com/withastro/astro/pull/12726) [`7c7398c`](https://github.com/withastro/astro/commit/7c7398c04653877da09c7b0f80ee84b02e02aad0) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where failing content entries in `astro check` would not be surfaced

## 5.0.5

### Patch Changes

- [#12705](https://github.com/withastro/astro/pull/12705) [`0d1eab5`](https://github.com/withastro/astro/commit/0d1eab560d56c51c359bbd35e8bfb51e238611ee) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where MDX files with certain characters in the name would cause builds to fail

- [#12707](https://github.com/withastro/astro/pull/12707) [`2aaed2d`](https://github.com/withastro/astro/commit/2aaed2d2a96ab35461af24e8d12b20f1da33983f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the middleware was incorrectly imported during the build

- [#12697](https://github.com/withastro/astro/pull/12697) [`1c4a032`](https://github.com/withastro/astro/commit/1c4a032247747c830be94dbdd0c953511a6bfa53) Thanks [@ascorbic](https://github.com/ascorbic)! - Fix a bug that caused builds to fail if an image had a quote mark in its name

- [#12694](https://github.com/withastro/astro/pull/12694) [`495f46b`](https://github.com/withastro/astro/commit/495f46bca78665732e51c629d93a68fa392b88a4) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the experimental feature `experimental.svg` was incorrectly used when generating ESM images

- [#12658](https://github.com/withastro/astro/pull/12658) [`3169593`](https://github.com/withastro/astro/commit/316959355c3d59723ecb3e0f417becf1f03ddd74) Thanks [@jurajkapsz](https://github.com/jurajkapsz)! - Fixes astro info copy to clipboard process not returning to prompt in certain cases.

- [#12712](https://github.com/withastro/astro/pull/12712) [`b01c74a`](https://github.com/withastro/astro/commit/b01c74aeccc4ec76b64fa75d163df58274b37970) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug which misidentified pages as markdown if a query string ended in a markdown extension

## 5.0.4

### Patch Changes

- [#12653](https://github.com/withastro/astro/pull/12653) [`e21c7e6`](https://github.com/withastro/astro/commit/e21c7e67fde1155cf593fd2b40010c5e2c2cd3f2) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates a reference in an error message

- [#12585](https://github.com/withastro/astro/pull/12585) [`a9373c0`](https://github.com/withastro/astro/commit/a9373c0c9a3c2e1773fc11bb14e156698b0d9d38) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `process.env` would be frozen despite changes made to environment variables in development

- [#12695](https://github.com/withastro/astro/pull/12695) [`a203d5d`](https://github.com/withastro/astro/commit/a203d5dd582166674c45e807a5dc9113e26e24f0) Thanks [@ascorbic](https://github.com/ascorbic)! - Throws a more helpful error when images are missing

- Updated dependencies [[`f13417b`](https://github.com/withastro/astro/commit/f13417bfbf73130c224752379e2da33084f89554), [`87231b1`](https://github.com/withastro/astro/commit/87231b1168da66bb593f681206c42fa555dfcabc), [`a71e9b9`](https://github.com/withastro/astro/commit/a71e9b93b317edc0ded49d4d50f1b7841c8cd428)]:
  - @astrojs/markdown-remark@6.0.1

## 5.0.3

### Patch Changes

- [#12645](https://github.com/withastro/astro/pull/12645) [`8704c54`](https://github.com/withastro/astro/commit/8704c5439ccaa4bdcebdebb725f297cdf8d48a5d) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates some reference links in error messages for new v5 docs.

- [#12641](https://github.com/withastro/astro/pull/12641) [`48ca399`](https://github.com/withastro/astro/commit/48ca3997888e960c6aaec633ab21160540656656) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where `astro info --copy` wasn't working correctly on `macOS` systems.

- [#12461](https://github.com/withastro/astro/pull/12461) [`62939ad`](https://github.com/withastro/astro/commit/62939add0b04b05b64f9b88d85fa5b0d34aae2d4) Thanks [@kyr0](https://github.com/kyr0)! - Removes the misleading log message telling that a custom renderer is not recognized while it clearly is and works.

- [#12642](https://github.com/withastro/astro/pull/12642) [`ff18b9c`](https://github.com/withastro/astro/commit/ff18b9c18558dcfdae581cc1c603a9a53491c7c2) Thanks [@ematipico](https://github.com/ematipico)! - Provides more information when logging a warning for accessing `Astro.request.headers` in prerendered pages

- [#12634](https://github.com/withastro/astro/pull/12634) [`03958d9`](https://github.com/withastro/astro/commit/03958d939217e6acef25c0aa1af2de663b04c956) Thanks [@delucis](https://github.com/delucis)! - Improves error message formatting for user config and content collection frontmatter

- [#12547](https://github.com/withastro/astro/pull/12547) [`6b6e18d`](https://github.com/withastro/astro/commit/6b6e18d7a0f08342eced2a77ddb371810b030868) Thanks [@mtwilliams-code](https://github.com/mtwilliams-code)! - Fixes a bug where URL search parameters weren't passed when using the i18n `fallback` feature.

- [#12449](https://github.com/withastro/astro/pull/12449) [`e6b8017`](https://github.com/withastro/astro/commit/e6b80172391d5f9aa5b1de26a8694ba4a28a43f3) Thanks [@apatel369](https://github.com/apatel369)! - Fixes an issue where the custom `assetFileNames` configuration caused assets to be incorrectly moved to the server directory instead of the client directory, resulting in 404 errors when accessed from the client side.

- [#12518](https://github.com/withastro/astro/pull/12518) [`e216250`](https://github.com/withastro/astro/commit/e216250146fbff746efd542612ce9bae6db9601f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where SSR error pages would return duplicated custom headers.

- [#12625](https://github.com/withastro/astro/pull/12625) [`74bfad0`](https://github.com/withastro/astro/commit/74bfad07afe70fec40de4db3d32a87af306406db) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the `experimental.svg` had incorrect type, resulting in some errors in the editors.

- [#12631](https://github.com/withastro/astro/pull/12631) [`dec0305`](https://github.com/withastro/astro/commit/dec0305b7577b431637a129e19fbbe6a28469587) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where the class attribute was rendered twice on the image component

- [#12623](https://github.com/withastro/astro/pull/12623) [`0e4fecb`](https://github.com/withastro/astro/commit/0e4fecbb135915a503b9ea2c12e57cf27cf07be8) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly handles images in content collections with uppercase file extensions

- [#12633](https://github.com/withastro/astro/pull/12633) [`8a551c1`](https://github.com/withastro/astro/commit/8a551c1272a22ab7c3fb836d6685a0eb38c33071) Thanks [@bluwy](https://github.com/bluwy)! - Cleans up content layer sync during builds and programmatic `sync()` calls

- [#12640](https://github.com/withastro/astro/pull/12640) [`22e405a`](https://github.com/withastro/astro/commit/22e405a04491aba47a7f172e7b0ee103fe5babe5) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused content collections to be returned empty when run in a test environment

- [#12613](https://github.com/withastro/astro/pull/12613) [`306c9f9`](https://github.com/withastro/astro/commit/306c9f9a9ae08d194ca2a066ab71cde02eeb0874) Thanks [@matthewp](https://github.com/matthewp)! - Fix use of cloned requests in middleware with clientAddress

  When using `context.clientAddress` or `Astro.clientAddress` Astro looks up the address in a hidden property. Cloning a request can cause this hidden property to be lost.

  The fix is to pass the address as an internal property instead, decoupling it from the request.

## 5.0.2

### Patch Changes

- [#12601](https://github.com/withastro/astro/pull/12601) [`0724929`](https://github.com/withastro/astro/commit/072492982b338e04549ee576ca7d8480be92cc1c) Thanks [@ascorbic](https://github.com/ascorbic)! - Includes "undefined" in types for getEntry

## 5.0.1

### Patch Changes

- [#12590](https://github.com/withastro/astro/pull/12590) [`92c269b`](https://github.com/withastro/astro/commit/92c269b0f0177cb54540ce03507de81370d67c50) Thanks [@kidonng](https://github.com/kidonng)! - fix: devtools warnings about dev toolbar form fields

## 5.0.0

### Major Changes

- [#11798](https://github.com/withastro/astro/pull/11798) [`e9e2139`](https://github.com/withastro/astro/commit/e9e2139bf788893566f5a3fe58daf1d24076f018) Thanks [@matthewp](https://github.com/matthewp)! - Unflag globalRoutePriority

  The previously experimental feature `globalRoutePriority` is now the default in Astro 5.

  This was a refactoring of route prioritization in Astro, making it so that injected routes, file-based routes, and redirects are all prioritized using the same logic. This feature has been enabled for all Starlight projects since it was added and should not affect most users.

- [#11864](https://github.com/withastro/astro/pull/11864) [`ee38b3a`](https://github.com/withastro/astro/commit/ee38b3a94697fe883ce8300eff9f001470b8adb6) Thanks [@ematipico](https://github.com/ematipico)! - ### [changed]: `entryPoint` type inside the hook `astro:build:ssr`
  In Astro v4.x, the `entryPoint` type was `RouteData`.

  Astro v5.0 the `entryPoint` type is `IntegrationRouteData`, which contains a subset of the `RouteData` type. The fields `isIndex` and `fallbackRoutes` were removed.

  #### What should I do?

  Update your adapter to change the type of `entryPoint` from `RouteData` to `IntegrationRouteData`.

  ```diff
  -import type {RouteData} from 'astro';
  +import type {IntegrationRouteData} from "astro"

  -function useRoute(route: RouteData) {
  +function useRoute(route: IntegrationRouteData) {

  }
  ```

- [#12524](https://github.com/withastro/astro/pull/12524) [`9f44019`](https://github.com/withastro/astro/commit/9f440196dc39f36fce0198bf4c97131160e5bcc1) Thanks [@bluwy](https://github.com/bluwy)! - Bumps Vite to ^6.0.1 and handles its breaking changes

- [#10742](https://github.com/withastro/astro/pull/10742) [`b6fbdaa`](https://github.com/withastro/astro/commit/b6fbdaa94a9ecec706a99e1938fbf5cd028c72e0) Thanks [@ematipico](https://github.com/ematipico)! - The lowest version of Node supported by Astro is now Node v18.17.1 and higher.

- [#11916](https://github.com/withastro/astro/pull/11916) [`46ea29f`](https://github.com/withastro/astro/commit/46ea29f91df83ea638ecbc544ce99375538636d4) Thanks [@bluwy](https://github.com/bluwy)! - Updates how the `build.client` and `build.server` option values get resolved to match existing documentation. With this fix, the option values will now correctly resolve relative to the `outDir` option. So if `outDir` is set to `./dist/nested/`, then by default:

  - `build.client` will resolve to `<root>/dist/nested/client/`
  - `build.server` will resolve to `<root>/dist/nested/server/`

  Previously the values were incorrectly resolved:

  - `build.client` was resolved to `<root>/dist/nested/dist/client/`
  - `build.server` was resolved to `<root>/dist/nested/dist/server/`

  If you were relying on the previous build paths, make sure that your project code is updated to the new build paths.

- [#11982](https://github.com/withastro/astro/pull/11982) [`d84e444`](https://github.com/withastro/astro/commit/d84e444fd3496c1f787b3fcee2929c92bc74e0cd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a default exclude and include value to the tsconfig presets. `{projectDir}/dist` is now excluded by default, and `{projectDir}/.astro/types.d.ts` and `{projectDir}/**/*` are included by default.

  Both of these options can be overridden by setting your own values to the corresponding settings in your `tsconfig.json` file.

- [#11861](https://github.com/withastro/astro/pull/11861) [`3ab3b4e`](https://github.com/withastro/astro/commit/3ab3b4efbcdd2aabea5f949deedf51a5acefae59) Thanks [@bluwy](https://github.com/bluwy)! - Cleans up Astro-specific metadata attached to `vfile.data` in Remark and Rehype plugins. Previously, the metadata was attached in different locations with inconsistent names. The metadata is now renamed as below:

  - `vfile.data.__astroHeadings` -> `vfile.data.astro.headings`
  - `vfile.data.imagePaths` -> `vfile.data.astro.imagePaths`

  The types of `imagePaths` has also been updated from `Set<string>` to `string[]`. The `vfile.data.astro.frontmatter` metadata is left unchanged.

  While we don't consider these APIs public, they can be accessed by Remark and Rehype plugins that want to re-use Astro's metadata. If you are using these APIs, make sure to access them in the new locations.

- [#11987](https://github.com/withastro/astro/pull/11987) [`bf90a53`](https://github.com/withastro/astro/commit/bf90a5343f9cd1bb46f30e4b331e7ae675f5e720) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - The `locals` object can no longer be overridden

  Middleware, API endpoints, and pages can no longer override the `locals` object in its entirety. You can still append values onto the object, but you can not replace the entire object and delete its existing values.

  If you were previously overwriting like so:

  ```js
  ctx.locals = {
    one: 1,
    two: 2,
  };
  ```

  This can be changed to an assignment on the existing object instead:

  ```js
  Object.assign(ctx.locals, {
    one: 1,
    two: 2,
  });
  ```

- [#11908](https://github.com/withastro/astro/pull/11908) [`518433e`](https://github.com/withastro/astro/commit/518433e433fe69ee3bbbb1f069181cd9eb69ec9a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - The `image.endpoint` config now allow customizing the route of the image endpoint in addition to the entrypoint. This can be useful in niche situations where the default route `/_image` conflicts with an existing route or your local server setup.

  ```js
  import { defineConfig } from 'astro/config';

  defineConfig({
    image: {
      endpoint: {
        route: '/image',
        entrypoint: './src/image_endpoint.ts',
      },
    },
  });
  ```

- [#12008](https://github.com/withastro/astro/pull/12008) [`5608338`](https://github.com/withastro/astro/commit/560833843c6d3ce2b6c6c473ec4ae70e744bf255) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Welcome to the Astro 5 beta! This release has no changes from the latest alpha of this package, but it does bring us one step closer to the final, stable release.

  Starting from this release, no breaking changes will be introduced unless absolutely necessary.

  To learn how to upgrade, check out the [Astro v5.0 upgrade guide in our beta docs site](https://5-0-0-beta.docs.astro.build/en/guides/upgrade-to/v5/).

- [#11679](https://github.com/withastro/astro/pull/11679) [`ea71b90`](https://github.com/withastro/astro/commit/ea71b90c9c08ddd1d3397c78e2e273fb799f7dbd) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - The `astro:env` feature introduced behind a flag in [v4.10.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#x4100) is no longer experimental and is available for general use. If you have been waiting for stabilization before using `astro:env`, you can now do so.

  This feature lets you configure a type-safe schema for your environment variables, and indicate whether they should be available on the server or the client.

  To configure a schema, add the `env` option to your Astro config and define your client and server variables. If you were previously using this feature, please remove the experimental flag from your Astro config and move your entire `env` configuration unchanged to a top-level option.

  ```js
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    env: {
      schema: {
        API_URL: envField.string({ context: 'client', access: 'public', optional: true }),
        PORT: envField.number({ context: 'server', access: 'public', default: 4321 }),
        API_SECRET: envField.string({ context: 'server', access: 'secret' }),
      },
    },
  });
  ```

  You can import and use your defined variables from the appropriate `/client` or `/server` module:

  ```astro
  ---
  import { API_URL } from 'astro:env/client';
  import { API_SECRET_TOKEN } from 'astro:env/server';

  const data = await fetch(`${API_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_SECRET_TOKEN}`,
    },
  });
  ---

  <script>
    import { API_URL } from 'astro:env/client';

    fetch(`${API_URL}/ping`);
  </script>
  ```

  Please see our [guide to using environment variables](https://docs.astro.build/en/guides/environment-variables/#astroenv) for more about this feature.

- [#11806](https://github.com/withastro/astro/pull/11806) [`f7f2338`](https://github.com/withastro/astro/commit/f7f2338c2b96975001b5c782f458710e9cc46d74) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Removes the `assets` property on `supportedAstroFeatures` for adapters, as it did not reflect reality properly in many cases.

  Now, relating to assets, only a single `sharpImageService` property is available, determining if the adapter is compatible with the built-in sharp image service.

- [#11864](https://github.com/withastro/astro/pull/11864) [`ee38b3a`](https://github.com/withastro/astro/commit/ee38b3a94697fe883ce8300eff9f001470b8adb6) Thanks [@ematipico](https://github.com/ematipico)! - ### [changed]: `routes` type inside the hook `astro:build:done`
  In Astro v4.x, the `routes` type was `RouteData`.

  Astro v5.0 the `routes` type is `IntegrationRouteData`, which contains a subset of the `RouteData` type. The fields `isIndex` and `fallbackRoutes` were removed.

  #### What should I do?

  Update your adapter to change the type of `routes` from `RouteData` to `IntegrationRouteData`.

  ```diff
  -import type {RouteData} from 'astro';
  +import type {IntegrationRouteData} from "astro"

  -function useRoute(route: RouteData) {
  +function useRoute(route: IntegrationRouteData) {

  }
  ```

- [#11941](https://github.com/withastro/astro/pull/11941) [`b6a5f39`](https://github.com/withastro/astro/commit/b6a5f39846581d0e9cfd7ae6f056c8d1209f71bd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Merges the `output: 'hybrid'` and `output: 'static'` configurations into one single configuration (now called `'static'`) that works the same way as the previous `hybrid` option.

  It is no longer necessary to specify `output: 'hybrid'` in your Astro config to use server-rendered pages. The new `output: 'static'` has this capability included. Astro will now automatically provide the ability to opt out of prerendering in your static site with no change to your `output` configuration required. Any page route or endpoint can include `export const prerender = false` to be server-rendered, while the rest of your site is statically-generated.

  If your project used hybrid rendering, you must now remove the `output: 'hybrid'` option from your Astro config as it no longer exists. However, no other changes to your project are required, and you should have no breaking changes. The previous `'hybrid'` behavior is now the default, under a new name `'static'`.

  If you were using the `output: 'static'` (default) option, you can continue to use it as before. By default, all of your pages will continue to be prerendered and you will have a completely static site. You should have no breaking changes to your project.

  ```diff
  import { defineConfig } from "astro/config";

  export default defineConfig({
  -  output: 'hybrid',
  });
  ```

  An adapter is still required to deploy an Astro project with any server-rendered pages. Failure to include an adapter will result in a warning in development and an error at build time.

- [#11788](https://github.com/withastro/astro/pull/11788) [`7c0ccfc`](https://github.com/withastro/astro/commit/7c0ccfc26947b178584e3476584bcaa490c6ba86) Thanks [@ematipico](https://github.com/ematipico)! - Updates the default value of `security.checkOrigin` to `true`, which enables Cross-Site Request Forgery (CSRF) protection by default for pages rendered on demand.

  If you had previously configured `security.checkOrigin: true`, you no longer need this set in your Astro config. This is now the default and it is safe to remove.

  To disable this behavior and opt out of automatically checking that the “origin” header matches the URL sent by each request, you must explicitly set `security.checkOrigin: false`:

  ```diff
  export default defineConfig({
  +  security: {
  +    checkOrigin: false
  +  }
  })
  ```

- [#11825](https://github.com/withastro/astro/pull/11825) [`560ef15`](https://github.com/withastro/astro/commit/560ef15ad23bd137b56ef1048eb2df548b99fdce) Thanks [@bluwy](https://github.com/bluwy)! - Updates internal Shiki rehype plugin to highlight code blocks as hast (using Shiki's `codeToHast()` API). This allows a more direct Markdown and MDX processing, and improves the performance when building the project, but may cause issues with existing Shiki transformers.

  If you are using Shiki transformers passed to `markdown.shikiConfig.transformers`, you must make sure they do not use the `postprocess` hook as it no longer runs on code blocks in `.md` and `.mdx` files. (See [the Shiki documentation on transformer hooks](https://shiki.style/guide/transformers#transformer-hooks) for more information).

  Code blocks in `.mdoc` files and `<Code />` component do not use the internal Shiki rehype plugin and are unaffected.

- [#11826](https://github.com/withastro/astro/pull/11826) [`7315050`](https://github.com/withastro/astro/commit/7315050fc1192fa72ae92aef92b920f63b46118f) Thanks [@matthewp](https://github.com/matthewp)! - Deprecate Astro.glob

  The `Astro.glob` function has been deprecated in favor of Content Collections and `import.meta.glob`.

  - If you want to query for markdown and MDX in your project, use Content Collections.
  - If you want to query source files in your project, use `import.meta.glob`(https://vitejs.dev/guide/features.html#glob-import).

  Also consider using glob packages from npm, like [fast-glob](https://www.npmjs.com/package/fast-glob), especially if statically generating your site, as it is faster for most use-cases.

  The easiest path is to migrate to `import.meta.glob` like so:

  ```diff
  - const posts = Astro.glob('./posts/*.md');
  + const posts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));
  ```

- [#12268](https://github.com/withastro/astro/pull/12268) [`4e9a3ac`](https://github.com/withastro/astro/commit/4e9a3ac0bd30b4013ac0b2caf068552258dfe6d9) Thanks [@ematipico](https://github.com/ematipico)! - The command `astro add vercel` now updates the configuration file differently, and adds `@astrojs/vercel` as module to import.

  This is a breaking change because it requires the version `8.*` of `@astrojs/vercel`.

- [#11741](https://github.com/withastro/astro/pull/11741) [`6617491`](https://github.com/withastro/astro/commit/6617491c3bc2bde87f7867d7dec2580781852cfc) Thanks [@bluwy](https://github.com/bluwy)! - Removes internal JSX handling and moves the responsibility to the `@astrojs/mdx` package directly. The following exports are also now removed:

  - `astro/jsx/babel.js`
  - `astro/jsx/component.js`
  - `astro/jsx/index.js`
  - `astro/jsx/renderer.js`
  - `astro/jsx/server.js`
  - `astro/jsx/transform-options.js`

  If your project includes `.mdx` files, you must upgrade `@astrojs/mdx` to the latest version so that it doesn't rely on these entrypoints to handle your JSX.

- [#11782](https://github.com/withastro/astro/pull/11782) [`9a2aaa0`](https://github.com/withastro/astro/commit/9a2aaa01ea427df3844bce8595207809a8d2cb94) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Makes the `compiledContent` property of Markdown content an async function, this change should fix underlying issues where sometimes when using a custom image service and images inside Markdown, Node would exit suddenly without any error message.

  ```diff
  ---
  import * as myPost from "../post.md";

  - const content = myPost.compiledContent();
  + const content = await myPost.compiledContent();
  ---

  <Fragment set:html={content} />
  ```

- [#11819](https://github.com/withastro/astro/pull/11819) [`2bdde80`](https://github.com/withastro/astro/commit/2bdde80cd3107d875e2d77e6e9621001e0e8b38a) Thanks [@bluwy](https://github.com/bluwy)! - Updates the Astro config loading flow to ignore processing locally-linked dependencies with Vite (e.g. `npm link`, in a monorepo, etc). Instead, they will be normally imported by the Node.js runtime the same way as other dependencies from `node_modules`.

  Previously, Astro would process locally-linked dependencies which were able to use Vite features like TypeScript when imported by the Astro config file.

  However, this caused confusion as integration authors may test against a package that worked locally, but not when published. This method also restricts using CJS-only dependencies because Vite requires the code to be ESM. Therefore, Astro's behaviour is now changed to ignore processing any type of dependencies by Vite.

  In most cases, make sure your locally-linked dependencies are built to JS before running the Astro project, and the config loading should work as before.

- [#11827](https://github.com/withastro/astro/pull/11827) [`a83e362`](https://github.com/withastro/astro/commit/a83e362ee41174501a433c210a24696784d7368f) Thanks [@matthewp](https://github.com/matthewp)! - Prevent usage of `astro:content` in the client

  Usage of `astro:content` in the client has always been discouraged because it leads to all of your content winding up in your client bundle, and can possibly leaks secrets.

  This formally makes doing so impossible, adding to the previous warning with errors.

  In the future Astro might add APIs for client-usage based on needs.

- [#11979](https://github.com/withastro/astro/pull/11979) [`423dfc1`](https://github.com/withastro/astro/commit/423dfc19ad83661b71151f8cec40701c7ced557b) Thanks [@bluwy](https://github.com/bluwy)! - Bumps `vite` dependency to v6.0.0-beta.2. The version is pinned and will be updated as new Vite versions publish to prevent unhandled breaking changes. For the full list of Vite-specific changes, see [its changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md).

- [#11859](https://github.com/withastro/astro/pull/11859) [`3804711`](https://github.com/withastro/astro/commit/38047119ff454e80cddd115bff53e33b32cd9930) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Changes the default `tsconfig.json` with better defaults, and makes `src/env.d.ts` optional

  Astro's default `tsconfig.json` in starter examples has been updated to include generated types and exclude your build output. This means that `src/env.d.ts` is only necessary if you have added custom type declarations or if you're not using a `tsconfig.json` file.

  Additionally, running `astro sync` no longer creates, nor updates, `src/env.d.ts` as it is not required for type-checking standard Astro projects.

  To update your project to Astro's recommended TypeScript settings, please add the following `include` and `exclude` properties to `tsconfig.json`:

  ```diff
  {
      "extends": "astro/tsconfigs/base",
  +    "include": [".astro/types.d.ts", "**/*"],
  +    "exclude": ["dist"]
  }
  ```

- [#11715](https://github.com/withastro/astro/pull/11715) [`d74617c`](https://github.com/withastro/astro/commit/d74617cbd3278feba05909ec83db2d73d57a153e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Refactor the exported types from the `astro` module. There should normally be no breaking changes, but if you relied on some previously deprecated types, these might now have been fully removed.

  In most cases, updating your code to move away from previously deprecated APIs in previous versions of Astro should be enough to fix any issues.

- [#12551](https://github.com/withastro/astro/pull/12551) [`abf9a89`](https://github.com/withastro/astro/commit/abf9a89ac1eaec9a8934a68aeebe3c502a3b47eb) Thanks [@ematipico](https://github.com/ematipico)! - Refactors legacy `content` and `data` collections to use the Content Layer API `glob()` loader for better performance and to support backwards compatibility. Also introduces the `legacy.collections` flag for projects that are unable to update to the new behavior immediately.

  :warning: **BREAKING CHANGE FOR LEGACY CONTENT COLLECTIONS** :warning:

  By default, collections that use the old types (`content` or `data`) and do not define a `loader` are now implemented under the hood using the Content Layer API's built-in `glob()` loader, with extra backward-compatibility handling.

  In order to achieve backwards compatibility with existing `content` collections, the following have been implemented:

  - a `glob` loader collection is defined, with patterns that match the previous handling (matches `src/content/<collection name>/**/*.md` and other content extensions depending on installed integrations, with underscore-prefixed files and folders ignored)
  - When used in the runtime, the entries have an ID based on the filename in the same format as legacy collections
  - A `slug` field is added with the same format as before
  - A `render()` method is added to the entry, so they can be called using `entry.render()`
  - `getEntryBySlug` is supported

  In order to achieve backwards compatibility with existing `data` collections, the following have been implemented:

  - a `glob` loader collection is defined, with patterns that match the previous handling (matches `src/content/<collection name>/**/*{.json,.yaml}` and other data extensions, with underscore-prefixed files and folders ignored)
  - Entries have an ID that is not slugified
  - `getDataEntryById` is supported

  While this backwards compatibility implementation is able to emulate most of the features of legacy collections, **there are some differences and limitations that may cause breaking changes to existing collections**:

  - In previous versions of Astro, collections would be generated for all folders in `src/content/`, even if they were not defined in `src/content/config.ts`. This behavior is now deprecated, and collections should always be defined in `src/content/config.ts`. For existing collections, these can just be empty declarations (e.g. `const blog = defineCollection({})`) and Astro will implicitly define your legacy collection for you in a way that is compatible with the new loading behavior.
  - The special `layout` field is not supported in Markdown collection entries. This property is intended only for standalone page files located in `src/pages/` and not likely to be in your collection entries. However, if you were using this property, you must now create dynamic routes that include your page styling.
  - Sort order of generated collections is non-deterministic and platform-dependent. This means that if you are calling `getCollection()`, the order in which entries are returned may be different than before. If you need a specific order, you should sort the collection entries yourself.
  - `image().refine()` is not supported. If you need to validate the properties of an image you will need to do this at runtime in your page or component.
  - the `key` argument of `getEntry(collection, key)` is typed as `string`, rather than having types for every entry.

  A new legacy configuration flag `legacy.collections` is added for users that want to keep their current legacy (content and data) collections behavior (available in Astro v2 - v4), or who are not yet ready to update their projects:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    legacy: {
      collections: true,
    },
  });
  ```

  When set, no changes to your existing collections are necessary, and the restrictions on storing both new and old collections continue to exist: legacy collections (only) must continue to remain in `src/content/`, while new collections using a loader from the Content Layer API are forbidden in that folder.

- [#11660](https://github.com/withastro/astro/pull/11660) [`e90f559`](https://github.com/withastro/astro/commit/e90f5593d23043579611452a84b9e18ad2407ef9) Thanks [@bluwy](https://github.com/bluwy)! - Fixes attribute rendering for non-[boolean HTML attributes](https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML) with boolean values to match proper attribute handling in browsers.

  Previously, non-boolean attributes may not have included their values when rendered to HTML. In Astro v5.0, the values are now explicitly rendered as `="true"` or `="false"`

  In the following `.astro` examples, only `allowfullscreen` is a boolean attribute:

  ```astro
  <!-- src/pages/index.astro --><!-- `allowfullscreen` is a boolean attribute -->
  <p allowfullscreen={true}></p>
  <p allowfullscreen={false}></p>

  <!-- `inherit` is *not* a boolean attribute -->
  <p inherit={true}></p>
  <p inherit={false}></p>

  <!-- `data-*` attributes are not boolean attributes -->
  <p data-light={true}></p>
  <p data-light={false}></p>
  ```

  Astro v5.0 now preserves the full data attribute with its value when rendering the HTML of non-boolean attributes:

  ```diff
    <p allowfullscreen></p>
    <p></p>

    <p inherit="true"></p>
  - <p inherit></p>
  + <p inherit="false"></p>

  - <p data-light></p>
  + <p data-light="true"></p>
  - <p></p>
  + <p data-light="false"></p>
  ```

  If you rely on attribute values, for example to locate elements or to conditionally render, update your code to match the new non-boolean attribute values:

  ```diff
  - el.getAttribute('inherit') === ''
  + el.getAttribute('inherit') === 'false'

  - el.hasAttribute('data-light')
  + el.dataset.light === 'true'
  ```

- [#11770](https://github.com/withastro/astro/pull/11770) [`cfa6a47`](https://github.com/withastro/astro/commit/cfa6a47ac7a541f99fdad46a68d0cca6e5816cd5) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Removed support for the Squoosh image service. As the underlying library `libsquoosh` is no longer maintained, and the image service sees very little usage we have decided to remove it from Astro.

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

- [#12231](https://github.com/withastro/astro/pull/12231) [`90ae100`](https://github.com/withastro/astro/commit/90ae100cf482529828febed591172433309bc12e) Thanks [@bluwy](https://github.com/bluwy)! - Updates the automatic `charset=utf-8` behavior for Markdown pages, where instead of responding with `charset=utf-8` in the `Content-Type` header, Astro will now automatically add the `<meta charset="utf-8">` tag instead.

  This behaviour only applies to Markdown pages (`.md` or similar Markdown files located within `src/pages/`) that do not use Astro's special `layout` frontmatter property. It matches the rendering behaviour of other non-content pages, and retains the minimal boilerplate needed to write with non-ASCII characters when adding individual Markdown pages to your site.

  If your Markdown pages use the `layout` frontmatter property, then HTML encoding will be handled by the designated layout component instead, and the `<meta charset="utf-8">` tag will not be added to your page by default.

  If you require `charset=utf-8` to render your page correctly, make sure that your layout components contain the `<meta charset="utf-8">` tag. You may need to add this if you have not already done so.

- [#11714](https://github.com/withastro/astro/pull/11714) [`8a53517`](https://github.com/withastro/astro/commit/8a5351737d6a14fc55f1dafad8f3b04079e81af6) Thanks [@matthewp](https://github.com/matthewp)! - Remove support for functionPerRoute

  This change removes support for the `functionPerRoute` option both in Astro and `@astrojs/vercel`.

  This option made it so that each route got built as separate entrypoints so that they could be loaded as separate functions. The hope was that by doing this it would decrease the size of each function. However in practice routes use most of the same code, and increases in function size limitations made the potential upsides less important.

  Additionally there are downsides to functionPerRoute, such as hitting limits on the number of functions per project. The feature also never worked with some Astro features like i18n domains and request rewriting.

  Given this, the feature has been removed from Astro.

- [#11864](https://github.com/withastro/astro/pull/11864) [`ee38b3a`](https://github.com/withastro/astro/commit/ee38b3a94697fe883ce8300eff9f001470b8adb6) Thanks [@ematipico](https://github.com/ematipico)! - ### [changed]: `RouteData.distURL` is now an array
  In Astro v4.x, `RouteData.distURL` was `undefined` or a `URL`

  Astro v5.0, `RouteData.distURL` is `undefined` or an array of `URL`. This was a bug, because a route can generate multiple files on disk, especially when using dynamic routes such as `[slug]` or `[...slug]`.

  #### What should I do?

  Update your code to handle `RouteData.distURL` as an array.

  ```diff
  if (route.distURL) {
  -  if (route.distURL.endsWith('index.html')) {
  -    // do something
  -  }
  +  for (const url of route.distURL) {
  +    if (url.endsWith('index.html')) {
  +      // do something
  +    }
  +  }
  }
  ```

- [#11253](https://github.com/withastro/astro/pull/11253) [`4e5cc5a`](https://github.com/withastro/astro/commit/4e5cc5aadd7d864bc5194ee67dc2ea74dbe80473) Thanks [@kevinzunigacuellar](https://github.com/kevinzunigacuellar)! - Changes the data returned for `page.url.current`, `page.url.next`, `page.url.prev`, `page.url.first` and `page.url.last` to include the value set for `base` in your Astro config.

  Previously, you had to manually prepend your configured value for `base` to the URL path. Now, Astro automatically includes your `base` value in `next` and `prev` URLs.

  If you are using the `paginate()` function for "previous" and "next" URLs, remove any existing `base` value as it is now added for you:

  ```diff
  ---
  export async function getStaticPaths({ paginate }) {
    const astronautPages = [{
      astronaut: 'Neil Armstrong',
    }, {
      astronaut: 'Buzz Aldrin',
    }, {
      astronaut: 'Sally Ride',
    }, {
      astronaut: 'John Glenn',
    }];
    return paginate(astronautPages, { pageSize: 1 });
  }
  const { page } = Astro.props;
  // `base: /'docs'` configured in `astro.config.mjs`
  - const prev = "/docs" + page.url.prev;
  + const prev = page.url.prev;
  ---
  <a id="prev" href={prev}>Back</a>
  ```

- [#12079](https://github.com/withastro/astro/pull/12079) [`7febf1f`](https://github.com/withastro/astro/commit/7febf1f6b58f2ed014df617bd7162c854cadd230) Thanks [@ematipico](https://github.com/ematipico)! - `params` passed in `getStaticPaths` are no longer automatically decoded.

  ### [changed]: `params` aren't decoded anymore.

  In Astro v4.x, `params` in were automatically decoded using `decodeURIComponent`.

  Astro v5.0 doesn't automatically decode `params` in `getStaticPaths` anymore, so you'll need to manually decode them yourself if needed

  #### What should I do?

  If you were relying on the automatic decode, you'll need to manually decode it using `decodeURI`.

  Note that the use of [`decodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)) is discouraged for `getStaticPaths` because it decodes more characters than it should, for example `/`, `?`, `#` and more.

  ```diff
  ---
  export function getStaticPaths() {
    return [
  +    { params: { id: decodeURI("%5Bpage%5D") } },
  -    { params: { id: "%5Bpage%5D" } },
    ]
  }

  const { id } = Astro.params;
  ---
  ```

### Minor Changes

- [#11941](https://github.com/withastro/astro/pull/11941) [`b6a5f39`](https://github.com/withastro/astro/commit/b6a5f39846581d0e9cfd7ae6f056c8d1209f71bd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adapters can now specify the build output type they're intended for using the `adapterFeatures.buildOutput` property. This property can be used to always generate a server output, even if the project doesn't have any server-rendered pages.

  ```ts
  {
    'astro:config:done': ({ setAdapter, config }) => {
      setAdapter({
        name: 'my-adapter',
        adapterFeatures: {
          buildOutput: 'server',
        },
      });
    },
  }
  ```

  If your adapter specifies `buildOutput: 'static'`, and the user's project contains server-rendered pages, Astro will warn in development and error at build time. Note that a hybrid output, containing both static and server-rendered pages, is considered to be a `server` output, as a server is required to serve the server-rendered pages.

- [#12067](https://github.com/withastro/astro/pull/12067) [`c48916c`](https://github.com/withastro/astro/commit/c48916cc4e6f7c31e3563d04b68a8698d8775b65) Thanks [@stramel](https://github.com/stramel)! - Adds experimental support for built-in SVG components.

  This feature allows you to import SVG files directly into your Astro project as components. By default, Astro will inline the SVG content into your HTML output.

  To enable this feature, set `experimental.svg` to `true` in your Astro config:

  ```js
  {
    experimental: {
      svg: true,
    },
  }
  ```

  To use this feature, import an SVG file in your Astro project, passing any common SVG attributes to the imported component. Astro also provides a `size` attribute to set equal `height` and `width` properties:

  ```astro
  ---
  import Logo from './path/to/svg/file.svg';
  ---

  <Logo size={24} />
  ```

  For a complete overview, and to give feedback on this experimental API, see the [Feature RFC](https://github.com/withastro/roadmap/pull/1035).

- [#12226](https://github.com/withastro/astro/pull/12226) [`51d13e2`](https://github.com/withastro/astro/commit/51d13e2f6ce3a9e03c33d80af6716847f6a78061) Thanks [@ematipico](https://github.com/ematipico)! - The following renderer fields and integration fields now accept `URL` as a type:

  **Renderers**:

  - `AstroRenderer.clientEntrpoint`
  - `AstroRenderer.serverEntrypoint`

  **Integrations**:

  - `InjectedRoute.entrypoint`
  - `AstroIntegrationMiddleware.entrypoint`
  - `DevToolbarAppEntry.entrypoint`

- [#12323](https://github.com/withastro/astro/pull/12323) [`c280655`](https://github.com/withastro/astro/commit/c280655655cc6c22121f32c5f7c76836adf17230) Thanks [@bluwy](https://github.com/bluwy)! - Updates to Vite 6.0.0-beta.6

- [#12539](https://github.com/withastro/astro/pull/12539) [`827093e`](https://github.com/withastro/astro/commit/827093e6175549771f9d93ddf3f2be4c2c60f0b7) Thanks [@bluwy](https://github.com/bluwy)! - Drops node 21 support

- [#12243](https://github.com/withastro/astro/pull/12243) [`eb41d13`](https://github.com/withastro/astro/commit/eb41d13162c84e9495489403611bc875eb190fed) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves `defineConfig` type safety. TypeScript will now error if a group of related configuration options do not have consistent types. For example, you will now see an error if your language set for `i18n.defaultLocale` is not one of the supported locales specified in `i18n.locales`.

- [#12329](https://github.com/withastro/astro/pull/12329) [`8309c61`](https://github.com/withastro/astro/commit/8309c61f0dfa5991d3f6c5c5fca4403794d6fda2) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new `astro:routes:resolved` hook to the Integration API. Also update the `astro:build:done` hook by deprecating `routes` and adding a new `assets` map.

  When building an integration, you can now get access to routes inside the `astro:routes:resolved` hook:

  ```js
  const integration = () => {
    return {
      name: 'my-integration',
      hooks: {
        'astro:routes:resolved': ({ routes }) => {
          console.log(routes);
        },
      },
    };
  };
  ```

  This hook runs before `astro:config:done`, and whenever a route changes in development.

  The `routes` array from `astro:build:done` is now deprecated, and exposed properties are now available on `astro:routes:resolved`, except for `distURL`. For this, you can use the newly exposed `assets` map:

  ```diff
  const integration = () => {
  +    let routes
      return {
          name: 'my-integration',
          hooks: {
  +            'astro:routes:resolved': (params) => {
  +                routes = params.routes
  +            },
              'astro:build:done': ({
  -                routes
  +                assets
              }) => {
  +                for (const route of routes) {
  +                    const distURL = assets.get(route.pattern)
  +                    if (distURL) {
  +                        Object.assign(route, { distURL })
  +                    }
  +                }
                  console.log(routes)
              }
          }
      }
  }
  ```

- [#11911](https://github.com/withastro/astro/pull/11911) [`c3dce83`](https://github.com/withastro/astro/commit/c3dce8363be22121a567df22df2ec566a3ebda17) Thanks [@ascorbic](https://github.com/ascorbic)! - The Content Layer API introduced behind a flag in [4.14.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#4140) is now stable and ready for use in Astro v5.0.

  The new Content Layer API builds upon content collections, taking them beyond local files in `src/content/` and allowing you to fetch content from anywhere, including remote APIs. These new collections work alongside your existing content collections, and you can migrate them to the new API at your own pace. There are significant improvements to performance with large collections of local files. For more details, see [the Content Layer RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0050-content-layer.md).

  If you previously used this feature, you can now remove the `experimental.contentLayer` flag from your Astro config:

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    contentLayer: true
  -  }
  })
  ```

  ### Loading your content

  The core of the new Content Layer API is the loader, a function that fetches content from a source and caches it in a local data store. Astro 4.14 ships with built-in `glob()` and `file()` loaders to handle your local Markdown, MDX, Markdoc, and JSON files:

  ```ts {3,7}
  // src/content/config.ts
  import { defineCollection, z } from 'astro:content';
  import { glob } from 'astro/loaders';

  const blog = defineCollection({
    // The ID is a slug generated from the path of the file relative to `base`
    loader: glob({ pattern: '**/*.md', base: './src/data/blog' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.coerce.date(),
    }),
  });

  export const collections = { blog };
  ```

  You can then query using the existing content collections functions, and use a simplified `render()` function to display your content:

  ```astro
  ---
  import { getEntry, render } from 'astro:content';

  const post = await getEntry('blog', Astro.params.slug);

  const { Content } = await render(entry);
  ---

  <Content />
  ```

  ### Creating a loader

  You're not restricted to the built-in loaders – we hope you'll try building your own. You can fetch content from anywhere and return an array of entries:

  ```ts
  // src/content/config.ts
  const countries = defineCollection({
    loader: async () => {
      const response = await fetch('https://restcountries.com/v3.1/all');
      const data = await response.json();
      // Must return an array of entries with an id property,
      // or an object with IDs as keys and entries as values
      return data.map((country) => ({
        id: country.cca3,
        ...country,
      }));
    },
    // optionally add a schema to validate the data and make it type-safe for users
    // schema: z.object...
  });

  export const collections = { countries };
  ```

  For more advanced loading logic, you can define an object loader. This allows incremental updates and conditional loading, and gives full access to the data store. It also allows a loader to define its own schema, including generating it dynamically based on the source API. See the [the Content Layer API RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0050-content-layer.md#loaders) for more details.

  ### Sharing your loaders

  Loaders are better when they're shared. You can create a package that exports a loader and publish it to npm, and then anyone can use it on their site. We're excited to see what the community comes up with! To get started, [take a look at some examples](https://github.com/ascorbic/astro-loaders/). Here's how to load content using an RSS/Atom feed loader:

  ```ts
  // src/content/config.ts
  import { defineCollection } from 'astro:content';
  import { feedLoader } from '@ascorbic/feed-loader';

  const podcasts = defineCollection({
    loader: feedLoader({
      url: 'https://feeds.99percentinvisible.org/99percentinvisible',
    }),
  });

  export const collections = { podcasts };
  ```

  To learn more, see [the Content Layer RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0050-content-layer.md).

- [#11980](https://github.com/withastro/astro/pull/11980) [`a604a0c`](https://github.com/withastro/astro/commit/a604a0ca9e0cdead01610b603d3b4c37ab010efc) Thanks [@matthewp](https://github.com/matthewp)! - ViewTransitions component renamed to ClientRouter

  The `<ViewTransitions />` component has been renamed to `<ClientRouter />`. There are no other changes than the name. The old name will continue to work in Astro 5.x, but will be removed in 6.0.

  This change was done to clarify the role of the component within Astro's View Transitions support. Astro supports View Transitions APIs in a few different ways, and renaming the component makes it more clear that the features you get from the ClientRouter component are slightly different from what you get using the native CSS-based MPA router.

  We still intend to maintain the ClientRouter as before, and it's still important for use-cases that the native support doesn't cover, such as persisting state between pages.

- [#11875](https://github.com/withastro/astro/pull/11875) [`a8a3d2c`](https://github.com/withastro/astro/commit/a8a3d2cde813d891dd9c63f07f91ce4e77d4f93b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new property `isPrerendered` to the globals `Astro` and `APIContext` . This boolean value represents whether or not the current page is prerendered:

  ```astro
  ---
  // src/pages/index.astro

  export const prerender = true;
  ---
  ```

  ```js
  // src/middleware.js

  export const onRequest = (ctx, next) => {
    console.log(ctx.isPrerendered); // it will log true
    return next();
  };
  ```

- [#12047](https://github.com/withastro/astro/pull/12047) [`21b5e80`](https://github.com/withastro/astro/commit/21b5e806c5df37c6b01da63487568a6ed351ba7d) Thanks [@rgodha24](https://github.com/rgodha24)! - Adds a new optional `parser` property to the built-in `file()` loader for content collections to support additional file types such as `toml` and `csv`.

  The `file()` loader now accepts a second argument that defines a `parser` function. This allows you to specify a custom parser (e.g. `toml.parse` or `csv-parse`) to create a collection from a file's contents. The `file()` loader will automatically detect and parse JSON and YAML files (based on their file extension) with no need for a `parser`.

  This works with any type of custom file formats including `csv` and `toml`. The following example defines a content collection `dogs` using a `.toml` file.

  ```toml
  [[dogs]]
  id = "..."
  age = "..."

  [[dogs]]
  id = "..."
  age = "..."
  ```

  After importing TOML's parser, you can load the `dogs` collection into your project by passing both a file path and `parser` to the `file()` loader.

  ```typescript
  import { defineCollection } from "astro:content"
  import { file } from "astro/loaders"
  import { parse as parseToml } from "toml"

  const dogs = defineCollection({
    loader: file("src/data/dogs.toml", { parser: (text) => parseToml(text).dogs }),
    schema: /* ... */
  })

  // it also works with CSVs!
  import { parse as parseCsv } from "csv-parse/sync";

  const cats = defineCollection({
    loader: file("src/data/cats.csv", { parser: (text) => parseCsv(text, { columns: true, skipEmptyLines: true })})
  });
  ```

  The `parser` argument also allows you to load a single collection from a nested JSON document. For example, this JSON file contains multiple collections:

  ```json
  { "dogs": [{}], "cats": [{}] }
  ```

  You can separate these collections by passing a custom `parser` to the `file()` loader like so:

  ```typescript
  const dogs = defineCollection({
    loader: file('src/data/pets.json', { parser: (text) => JSON.parse(text).dogs }),
  });
  const cats = defineCollection({
    loader: file('src/data/pets.json', { parser: (text) => JSON.parse(text).cats }),
  });
  ```

  And it continues to work with maps of `id` to `data`

  ```yaml
  bubbles:
    breed: 'Goldfish'
    age: 2
  finn:
    breed: 'Betta'
    age: 1
  ```

  ```typescript
  const fish = defineCollection({
    loader: file('src/data/fish.yaml'),
    schema: z.object({ breed: z.string(), age: z.number() }),
  });
  ```

- [#11698](https://github.com/withastro/astro/pull/11698) [`05139ef`](https://github.com/withastro/astro/commit/05139ef8b46de96539cc1d08148489eaf3cfd837) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new property to the globals `Astro` and `APIContext` called `routePattern`. The `routePattern` represents the current route (component)
  that is being rendered by Astro. It's usually a path pattern will look like this: `blog/[slug]`:

  ```astro
  ---
  // src/pages/blog/[slug].astro
  const route = Astro.routePattern;
  console.log(route); // it will log "blog/[slug]"
  ---
  ```

  ```js
  // src/pages/index.js

  export const GET = (ctx) => {
    console.log(ctx.routePattern); // it will log src/pages/index.js
    return new Response.json({ loreum: 'ipsum' });
  };
  ```

- [#11941](https://github.com/withastro/astro/pull/11941) [`b6a5f39`](https://github.com/withastro/astro/commit/b6a5f39846581d0e9cfd7ae6f056c8d1209f71bd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `buildOutput` property to the `astro:config:done` hook returning the build output type.

  This can be used to know if the user's project will be built as a static site (HTML files), or a server-rendered site (whose exact output depends on the adapter).

- [#12377](https://github.com/withastro/astro/pull/12377) [`af867f3`](https://github.com/withastro/astro/commit/af867f3910ecd8fc04a5337f591d84f03192e3fa) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds experimental support for automatic responsive images

  This feature is experimental and may change in future versions. To enable it, set `experimental.responsiveImages` to `true` in your `astro.config.mjs` file.

  ```js title=astro.config.mjs
  {
     experimental: {
        responsiveImages: true,
     },
  }
  ```

  When this flag is enabled, you can pass a `layout` prop to any `<Image />` or `<Picture />` component to create a responsive image. When a layout is set, images have automatically generated `srcset` and `sizes` attributes based on the image's dimensions and the layout type. Images with `responsive` and `full-width` layouts will have styles applied to ensure they resize according to their container.

  ```astro
  ---
  import { Image, Picture } from 'astro:assets';
  import myImage from '../assets/my_image.png';
  ---

  <Image
    src={myImage}
    alt="A description of my image."
    layout="responsive"
    width={800}
    height={600}
  />
  <Picture
    src={myImage}
    alt="A description of my image."
    layout="full-width"
    formats={['avif', 'webp', 'jpeg']}
  />
  ```

  This `<Image />` component will generate the following HTML output:

  ```html title=Output
  <img
    src="/_astro/my_image.hash3.webp"
    srcset="
      /_astro/my_image.hash1.webp  640w,
      /_astro/my_image.hash2.webp  750w,
      /_astro/my_image.hash3.webp  800w,
      /_astro/my_image.hash4.webp  828w,
      /_astro/my_image.hash5.webp 1080w,
      /_astro/my_image.hash6.webp 1280w,
      /_astro/my_image.hash7.webp 1600w
    "
    alt="A description of my image"
    sizes="(min-width: 800px) 800px, 100vw"
    loading="lazy"
    decoding="async"
    fetchpriority="auto"
    width="800"
    height="600"
    style="--w: 800; --h: 600; --fit: cover; --pos: center;"
    data-astro-image="responsive"
  />
  ```

  #### Responsive image properties

  These are additional properties available to the `<Image />` and `<Picture />` components when responsive images are enabled:

  - `layout`: The layout type for the image. Can be `responsive`, `fixed`, `full-width` or `none`. Defaults to value of `image.experimentalLayout`.
  - `fit`: Defines how the image should be cropped if the aspect ratio is changed. Values match those of CSS `object-fit`. Defaults to `cover`, or the value of `image.experimentalObjectFit` if set.
  - `position`: Defines the position of the image crop if the aspect ratio is changed. Values match those of CSS `object-position`. Defaults to `center`, or the value of `image.experimentalObjectPosition` if set.
  - `priority`: If set, eagerly loads the image. Otherwise images will be lazy-loaded. Use this for your largest above-the-fold image. Defaults to `false`.

  #### Default responsive image settings

  You can enable responsive images for all `<Image />` and `<Picture />` components by setting `image.experimentalLayout` with a default value. This can be overridden by the `layout` prop on each component.

  **Example:**

  ```js title=astro.config.mjs
  {
      image: {
        // Used for all `<Image />` and `<Picture />` components unless overridden
        experimentalLayout: 'responsive',
      },
      experimental: {
        responsiveImages: true,
      },
  }
  ```

  ```astro
  ---
  import { Image } from 'astro:assets';
  import myImage from '../assets/my_image.png';
  ---

  <Image src={myImage} alt="This will use responsive layout" width={800} height={600} />

  <Image src={myImage} alt="This will use full-width layout" layout="full-width" />

  <Image src={myImage} alt="This will disable responsive images" layout="none" />
  ```

  For a complete overview, and to give feedback on this experimental API, see the [Responsive Images RFC](https://github.com/withastro/roadmap/blob/responsive-images/proposals/0053-responsive-images.md).

- [#12150](https://github.com/withastro/astro/pull/12150) [`93351bc`](https://github.com/withastro/astro/commit/93351bc78aed8f4ecff003268bad21c3b93c2f56) Thanks [@bluwy](https://github.com/bluwy)! - Adds support for passing values other than `"production"` or `"development"` to the `--mode` flag (e.g. `"staging"`, `"testing"`, or any custom value) to change the value of `import.meta.env.MODE` or the loaded `.env` file. This allows you take advantage of Vite's [mode](https://vite.dev/guide/env-and-mode#modes) feature.

  Also adds a new `--devOutput` flag for `astro build` that will output a development-based build.

  Note that changing the `mode` does not change the kind of code transform handled by Vite and Astro:

  - In `astro dev`, Astro will transform code with debug information.
  - In `astro build`, Astro will transform code with the most optimized output and removes debug information.
  - In `astro build --devOutput` (new flag), Astro will transform code with debug information like in `astro dev`.

  This enables various usecases like:

  ```bash
  # Run the dev server connected to a "staging" API
  astro dev --mode staging

  # Build a site that connects to a "staging" API
  astro build --mode staging

  # Build a site that connects to a "production" API with additional debug information
  astro build --devOutput

  # Build a site that connects to a "testing" API
  astro build --mode testing
  ```

  The different modes can be used to load different `.env` files, e.g. `.env.staging` or `.env.production`, which can be customized for each environment, for example with different `API_URL` environment variable values.

- [#12510](https://github.com/withastro/astro/pull/12510) [`14feaf3`](https://github.com/withastro/astro/commit/14feaf30e1a4266b8422865722a4478d39202404) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Changes the generated URL query param from `_astroAction` to `_action` when submitting a form using Actions. This avoids leaking the framework name into the URL bar, which may be considered a security issue.

- [#11806](https://github.com/withastro/astro/pull/11806) [`f7f2338`](https://github.com/withastro/astro/commit/f7f2338c2b96975001b5c782f458710e9cc46d74) Thanks [@Princesseuh](https://github.com/Princesseuh)! - The value of the different properties on `supportedAstroFeatures` for adapters can now be objects, with a `support` and `message` properties. The content of the `message` property will be shown in the Astro CLI when the adapter is not compatible with the feature, allowing one to give a better informational message to the user.

  This is notably useful with the new `limited` value, to explain to the user why support is limited.

- [#12071](https://github.com/withastro/astro/pull/12071) [`61d248e`](https://github.com/withastro/astro/commit/61d248e581a3bebf0ec67169813fc8ae4a2182df) Thanks [@Princesseuh](https://github.com/Princesseuh)! - `astro add` no longer automatically sets `output: 'server'`. Since the default value of output now allows for server-rendered pages, it no longer makes sense to default to full server builds when you add an adapter

- [#11955](https://github.com/withastro/astro/pull/11955) [`d813262`](https://github.com/withastro/astro/commit/d8132626b05f150341c0628d6078fdd86b89aaed) Thanks [@matthewp](https://github.com/matthewp)! - [Server Islands](https://astro.build/blog/future-of-astro-server-islands/) introduced behind an experimental flag in [v4.12.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#4120) is no longer experimental and is available for general use.

  Server islands are Astro's solution for highly cacheable pages of mixed static and dynamic content. They allow you to specify components that should run on the server, allowing the rest of the page to be more aggressively cached, or even generated statically.

  Turn any `.astro` component into a server island by adding the `server:defer` directive and optionally, fallback placeholder content. It will be rendered dynamically at runtime outside the context of the rest of the page, allowing you to add longer cache headers for the pages, or even prerender them.

  ```astro
  ---
  import Avatar from '../components/Avatar.astro';
  import GenericUser from '../components/GenericUser.astro';
  ---

  <header>
    <h1>Page Title</h1>
    <div class="header-right">
      <Avatar server:defer>
        <GenericUser slot="fallback" />
      </Avatar>
    </div>
  </header>
  ```

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental {
  -    serverIslands: true,
    },
  });
  ```

  If you have been waiting for stabilization before using server islands, you can now do so.

  Please see the [server island documentation](https://docs.astro.build/en/guides/server-islands/) for more about this feature.

- [#12373](https://github.com/withastro/astro/pull/12373) [`d10f918`](https://github.com/withastro/astro/commit/d10f91815e63f169cff3d1daef5505aef077c76c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Changes the default behavior for Astro Action form requests to a standard POST submission.

  In Astro 4.x, actions called from an HTML form would trigger a redirect with the result forwarded using cookies. This caused issues for large form errors and return values that exceeded the 4 KB limit of cookie-based storage.

  Astro 5.0 now renders the result of an action as a POST result without any forwarding. This will introduce a "confirm form resubmission?" dialog when a user attempts to refresh the page, though it no longer imposes a 4 KB limit on action return value.

  ## Customize form submission behavior

  If you prefer to address the "confirm form resubmission?" dialog on refresh, or to preserve action results across sessions, you can now [customize action result handling from middleware](https://5-0-0-beta.docs.astro.build/en/guides/actions/#advanced-persist-action-results-with-a-session).

  We recommend using a session storage provider [as described in our Netlify Blob example](https://5-0-0-beta.docs.astro.build/en/guides/actions/#advanced-persist-action-results-with-a-session). However, if you prefer the cookie forwarding behavior from 4.X and accept the 4 KB size limit, you can implement the pattern as shown in this sample snippet:

  ```ts
  // src/middleware.ts
  import { defineMiddleware } from 'astro:middleware';
  import { getActionContext } from 'astro:actions';

  export const onRequest = defineMiddleware(async (context, next) => {
    // Skip requests for prerendered pages
    if (context.isPrerendered) return next();

    const { action, setActionResult, serializeActionResult } = getActionContext(context);

    // If an action result was forwarded as a cookie, set the result
    // to be accessible from `Astro.getActionResult()`
    const payload = context.cookies.get('ACTION_PAYLOAD');
    if (payload) {
      const { actionName, actionResult } = payload.json();
      setActionResult(actionName, actionResult);
      context.cookies.delete('ACTION_PAYLOAD');
      return next();
    }

    // If an action was called from an HTML form action,
    // call the action handler and redirect with the result as a cookie.
    if (action?.calledFrom === 'form') {
      const actionResult = await action.handler();

      context.cookies.set('ACTION_PAYLOAD', {
        actionName: action.name,
        actionResult: serializeActionResult(actionResult),
      });

      if (actionResult.error) {
        // Redirect back to the previous page on error
        const referer = context.request.headers.get('Referer');
        if (!referer) {
          throw new Error('Internal: Referer unexpectedly missing from Action POST request.');
        }
        return context.redirect(referer);
      }
      // Redirect to the destination page on success
      return context.redirect(context.originPathname);
    }

    return next();
  });
  ```

- [#12475](https://github.com/withastro/astro/pull/12475) [`3f02d5f`](https://github.com/withastro/astro/commit/3f02d5f12b167514fff6eb9693b4e25c668e7a31) Thanks [@ascorbic](https://github.com/ascorbic)! - Changes the default content config location from `src/content/config.*` to `src/content.config.*`.

  The previous location is still supported, and is required if the `legacy.collections` flag is enabled.

- [#11963](https://github.com/withastro/astro/pull/11963) [`0a1036e`](https://github.com/withastro/astro/commit/0a1036eef62f13c9609362874c5b88434d1e9300) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new `createCodegenDir()` function to the `astro:config:setup` hook in the Integrations API

  In 4.14, we introduced the `injectTypes` utility on the `astro:config:done` hook. It can create `.d.ts` files and make their types available to user's projects automatically. Under the hood, it creates a file in `<root>/.astro/integrations/<normalized_integration_name>`.

  While the `.astro` directory has always been the preferred place to write code generated files, it has also been prone to mistakes. For example, you can write a `.astro/types.d.ts` file, breaking Astro types. Or you can create a file that overrides a file created by another integration.

  In this release, `<root>/.astro/integrations/<normalized_integration_name>` can now be retrieved in the `astro:config:setup` hook by calling `createCodegenDir()`. It allows you to have a dedicated folder, avoiding conflicts with another integration or Astro itself. This directory is created by calling this function so it's safe to write files to it directly:

  ```js
  import { writeFileSync } from 'node:fs';

  const integration = {
    name: 'my-integration',
    hooks: {
      'astro:config:setup': ({ createCodegenDir }) => {
        const codegenDir = createCodegenDir();
        writeFileSync(new URL('cache.json', codegenDir), '{}', 'utf-8');
      },
    },
  };
  ```

- [#12379](https://github.com/withastro/astro/pull/12379) [`94f4fe8`](https://github.com/withastro/astro/commit/94f4fe8180f02cf19fb617dde7d67d4f7bee8dac) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new components exported from `astro/components`: Welcome, to be used by the new Basics template

- [#11806](https://github.com/withastro/astro/pull/11806) [`f7f2338`](https://github.com/withastro/astro/commit/f7f2338c2b96975001b5c782f458710e9cc46d74) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `limited` value for the different properties of `supportedAstroFeatures` for adapters, which indicates that the adapter is compatible with the feature, but with some limitations. This is useful for adapters that support a feature, but not in all cases or with all options.

- [#11925](https://github.com/withastro/astro/pull/11925) [`74722cb`](https://github.com/withastro/astro/commit/74722cb81c46d4d29c8c5a2127f896da4d8d3235) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `astro/config` import to reference `astro/client` types

  When importing `astro/config`, types from `astro/client` will be made automatically available to your project. If your project `tsconfig.json` changes how references behave, you'll still have access to these types after running `astro sync`.

- [#12081](https://github.com/withastro/astro/pull/12081) [`8679954`](https://github.com/withastro/astro/commit/8679954bf647529e0f2134053866fc507e64c5e3) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the experimental `contentCollectionsCache` introduced in `3.5.0`.

  Astro Content Layer API independently solves some of the caching and performance issues with legacy content collections that this strategy attempted to address. This feature has been replaced with continued work on improvements to the content layer. If you were using this experimental feature, you must now remove the flag from your Astro config as it no longer exists:

  ```diff
  export default defineConfig({
      experimental: {
  -        contentCollectionsCache: true
      }
  })
  ```

  The `cacheManifest` boolean argument is no longer passed to the `astro:build:done` integration hook:

  ```diff
  const integration = {
      name: "my-integration",
      hooks: {
          "astro:build:done": ({
  -            cacheManifest,
              logger
          }) => {}
      }
  }
  ```

### Patch Changes

- [#12565](https://github.com/withastro/astro/pull/12565) [`97f413f`](https://github.com/withastro/astro/commit/97f413f1189fd626dffac8b48b166684c7e77627) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where content types were not generated when first running astro dev unless src/content exists

- [#11987](https://github.com/withastro/astro/pull/11987) [`bf90a53`](https://github.com/withastro/astro/commit/bf90a5343f9cd1bb46f30e4b331e7ae675f5e720) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - `render()` signature now takes `renderOptions` as 2nd argument

  The signature for `app.render()` has changed, and the second argument is now an options object called `renderOptions` with more options for customizing rendering.

  The `renderOptions` are:

  - `addCookieHeader`: Determines whether Astro will set the `Set-Cookie` header, otherwise the adapter is expected to do so itself.
  - `clientAddress`: The client IP address used to set `Astro.clientAddress`.
  - `locals`: An object of locals that's set to `Astro.locals`.
  - `routeData`: An object specifying the route to use.

- [#12522](https://github.com/withastro/astro/pull/12522) [`33b0e30`](https://github.com/withastro/astro/commit/33b0e305fe4ecabc30ffa823454395c973f92454) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where content config was ignored if it was outside of content dir and has a parent dir with an underscore

- [#12424](https://github.com/withastro/astro/pull/12424) [`4364bff`](https://github.com/withastro/astro/commit/4364bff27332e52f92da72392620a36110daee42) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where an incorrect usage of Astro actions was lost when porting the fix from v4 to v5

- [#12438](https://github.com/withastro/astro/pull/12438) [`c8f877c`](https://github.com/withastro/astro/commit/c8f877cad2d8f1780f70045413872d5b9d32ebed) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where legacy content types were generated for content layer collections if they were in the content directory

- [#12035](https://github.com/withastro/astro/pull/12035) [`325a57c`](https://github.com/withastro/astro/commit/325a57c543d88eab5e3ab32ee1bbfb534aed9c7c) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly parse values returned from inline loader

- [#11960](https://github.com/withastro/astro/pull/11960) [`4410130`](https://github.com/withastro/astro/commit/4410130df722eae494caaa46b17c8eeb6223f160) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue where the refresh context data was not passed correctly to content layer loaders

- [#11878](https://github.com/withastro/astro/pull/11878) [`334948c`](https://github.com/withastro/astro/commit/334948ced29ed9ab03992f2174547bb9ee3a20c0) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a new function `refreshContent` to the `astro:server:setup` hook that allows integrations to refresh the content layer. This can be used, for example, to register a webhook endpoint during dev, or to open a socket to a CMS to listen for changes.

  By default, `refreshContent` will refresh all collections. You can optionally pass a `loaders` property, which is an array of loader names. If provided, only collections that use those loaders will be refreshed. For example, A CMS integration could use this property to only refresh its own collections.

  You can also pass a `context` object to the loaders. This can be used to pass arbitrary data, such as the webhook body, or an event from the websocket.

  ```ts
   {
      name: 'my-integration',
      hooks: {
          'astro:server:setup': async ({ server, refreshContent }) => {
              server.middlewares.use('/_refresh', async (req, res) => {
                  if(req.method !== 'POST') {
                    res.statusCode = 405
                    res.end('Method Not Allowed');
                    return
                  }
                  let body = '';
                  req.on('data', chunk => {
                      body += chunk.toString();
                  });
                  req.on('end', async () => {
                      try {
                          const webhookBody = JSON.parse(body);
                          await refreshContent({
                            context: { webhookBody },
                            loaders: ['my-loader']
                          });
                          res.writeHead(200, { 'Content-Type': 'application/json' });
                          res.end(JSON.stringify({ message: 'Content refreshed successfully' }));
                      } catch (error) {
                          res.writeHead(500, { 'Content-Type': 'application/json' });
                          res.end(JSON.stringify({ error: 'Failed to refresh content: ' + error.message }));
                      }
                  });
              });
          }
      }
  }
  ```

- [#11991](https://github.com/withastro/astro/pull/11991) [`d7a396c`](https://github.com/withastro/astro/commit/d7a396ca3eedc1b32b4ea113cbacb4ccb08384c9) Thanks [@matthewp](https://github.com/matthewp)! - Update error link to on-demand rendering guide

- [#12127](https://github.com/withastro/astro/pull/12127) [`55e9cd8`](https://github.com/withastro/astro/commit/55e9cd88551ac56ec4cab9a9f3fd9ba49b8934b9) Thanks [@ascorbic](https://github.com/ascorbic)! - Prevents Vite emitting an error when restarting itself

- [#12516](https://github.com/withastro/astro/pull/12516) [`cb9322c`](https://github.com/withastro/astro/commit/cb9322c763b5cd8e43afe77d30e86a0b7d72f894) Thanks [@stramel](https://github.com/stramel)! - Handle multiple root nodes on SVG files

- [#11974](https://github.com/withastro/astro/pull/11974) [`60211de`](https://github.com/withastro/astro/commit/60211defbfb2992ba17d1369e71c146d8928b09a) Thanks [@ascorbic](https://github.com/ascorbic)! - Exports the `RenderResult` type

- [#12578](https://github.com/withastro/astro/pull/12578) [`07b9ca8`](https://github.com/withastro/astro/commit/07b9ca802eb4bbfc14c4e421f8a047fef3a7b439) Thanks [@WesSouza](https://github.com/WesSouza)! - Explicitly import index.ts to fix types when moduleResolution is NodeNext

- [#11791](https://github.com/withastro/astro/pull/11791) [`9393243`](https://github.com/withastro/astro/commit/93932432e7239a1d31c68ea916945302286268e9) Thanks [@bluwy](https://github.com/bluwy)! - Updates Astro's default `<script>` rendering strategy and removes the `experimental.directRenderScript` option as this is now the default behavior: scripts are always rendered directly. This new strategy prevents scripts from being executed in pages where they are not used.

  Scripts will directly render as declared in Astro files (including existing features like TypeScript, importing `node_modules`, and deduplicating scripts). You can also now conditionally render scripts in your Astro file.

  However, this means scripts are no longer hoisted to the `<head>`, multiple scripts on a page are no longer bundled together, and the `<script>` tag may interfere with the CSS styling.

  As this is a potentially breaking change to your script behavior, please review your `<script>` tags and ensure that they behave as expected.

- [#12011](https://github.com/withastro/astro/pull/12011) [`cfdaab2`](https://github.com/withastro/astro/commit/cfdaab257cd167e0d4631ab66d9406754b3c1836) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes a type and an example in documenting the `security.checkOrigin` property of Astro config.

- [#12168](https://github.com/withastro/astro/pull/12168) [`1cd3085`](https://github.com/withastro/astro/commit/1cd30852a3bdae1847ad4e835e503598ca5fdf5c) Thanks [@ascorbic](https://github.com/ascorbic)! - Allows "slug" as a field in content layer data

- [#12302](https://github.com/withastro/astro/pull/12302) [`7196c24`](https://github.com/withastro/astro/commit/7196c244ea75d2f2aafbec332d91cb681f0a4cb7) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the origin check middleware run for prendered pages

- [#12341](https://github.com/withastro/astro/pull/12341) [`c1786d6`](https://github.com/withastro/astro/commit/c1786d64c4d8b25ed28f5e178531952466158e04) Thanks [@ematipico](https://github.com/ematipico)! - Fixes and issue where `Astro.currentLocale` always returned the default locale when consumed inside a server island.

- [#11732](https://github.com/withastro/astro/pull/11732) [`4cd6c43`](https://github.com/withastro/astro/commit/4cd6c43e221e40345dfb433f9c63395f886091fd) Thanks [@matthewp](https://github.com/matthewp)! - Use GET requests with preloading for Server Islands

  Server Island requests include the props used to render the island as well as any slots passed in (excluding the fallback slot). Since browsers have a max 4mb URL length we default to using a POST request to avoid overflowing this length.

  However in reality most usage of Server Islands are fairly isolated and won't exceed this limit, so a GET request is possible by passing this same information via search parameters.

  Using GET means we can also include a `<link rel="preload">` tag to speed up the request.

  This change implements this, with safe fallback to POST.

- [#11952](https://github.com/withastro/astro/pull/11952) [`50a0146`](https://github.com/withastro/astro/commit/50a0146e9aff78a245914125f34719cfb32c585f) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds support for array patterns in the built-in `glob()` content collections loader

  The glob loader can now accept an array of multiple patterns as well as string patterns. This allows you to more easily combine multiple patterns into a single collection, and also means you can use negative matches to exclude files from the collection.

  ```ts
  const probes = defineCollection({
    // Load all markdown files in the space-probes directory, except for those that start with "voyager-"
    loader: glob({ pattern: ['*.md', '!voyager-*'], base: 'src/data/space-probes' }),
    schema: z.object({
      name: z.string(),
      type: z.enum(['Space Probe', 'Mars Rover', 'Comet Lander']),
      launch_date: z.date(),
      status: z.enum(['Active', 'Inactive', 'Decommissioned']),
      destination: z.string(),
      operator: z.string(),
      notable_discoveries: z.array(z.string()),
    }),
  });
  ```

- [#12022](https://github.com/withastro/astro/pull/12022) [`ddc3a08`](https://github.com/withastro/astro/commit/ddc3a08e8facdaf0b0298ee5a7adb73a53e1575e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Properly handle including trailing slash on the image endpoint route based on the trailingSlash config

- [#12169](https://github.com/withastro/astro/pull/12169) [`15fa9ba`](https://github.com/withastro/astro/commit/15fa9babf31a9b8ab8fc8e611c931c178137e2f9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where configured redirects were incorrectly constructed when reading the file system.

  This caused an issue where configuring a redirect in `astro.config.mjs` like `{ /old: /new }`, failed to trigger the correct redirect in the dev server.

- [#11914](https://github.com/withastro/astro/pull/11914) [`b5d827b`](https://github.com/withastro/astro/commit/b5d827ba6852d046c33643f795e1542bc2818b2c) Thanks [@ascorbic](https://github.com/ascorbic)! - Exports types for all `LoaderContext` properties from `astro/loaders` to make it easier to use them in custom loaders.
  The `ScopedDataStore` interface (which was previously internal) is renamed to `DataStore`, to reflect the fact that it's the only public API for the data store.

- [#12270](https://github.com/withastro/astro/pull/12270) [`25192a0`](https://github.com/withastro/astro/commit/25192a059975f5a31a9c43e5d605541f4e9618bc) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the params weren't correctly computed when rendering URLs with non-English characters

- [#11927](https://github.com/withastro/astro/pull/11927) [`5b4e3ab`](https://github.com/withastro/astro/commit/5b4e3abbb152146b71c1af05d33c96211000b2a6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates the `env` configuration reference docs to include a full API reference for `envField`.

- [#12591](https://github.com/withastro/astro/pull/12591) [`b731b3d`](https://github.com/withastro/astro/commit/b731b3de73262f8ab9544b1228ea9e693e488b6c) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where a catchall route would match an image endpoint request

- [#12073](https://github.com/withastro/astro/pull/12073) [`acf264d`](https://github.com/withastro/astro/commit/acf264d8c003718cda5a0b9ce5fb7ac1cd6641b6) Thanks [@bluwy](https://github.com/bluwy)! - Replaces `ora` with `yocto-spinner`

- [#12339](https://github.com/withastro/astro/pull/12339) [`bdb75a8`](https://github.com/withastro/astro/commit/bdb75a87f24d7f032797483164fb2f82aa691fee) Thanks [@ematipico](https://github.com/ematipico)! - Adds an error when `Astro.rewrite()` is used to rewrite an on-demand route with a static route when using the `"server"` output.

  This is a forbidden rewrite because Astro can't retrieve the emitted static route at runtime. This route is served by the hosting platform, and not Astro itself.

- [#12511](https://github.com/withastro/astro/pull/12511) [`d023682`](https://github.com/withastro/astro/commit/d023682d6c6d8797f15f3c0f65893a4aa62e3b5b) Thanks [@stramel](https://github.com/stramel)! - Fix SVG Component sprite references

- [#12486](https://github.com/withastro/astro/pull/12486) [`dc3d842`](https://github.com/withastro/astro/commit/dc3d842e4c6f3b7e59da8a13447a1450013e10dc) Thanks [@matthewp](https://github.com/matthewp)! - Call server island early so it can set headers

- [#12016](https://github.com/withastro/astro/pull/12016) [`837ee3a`](https://github.com/withastro/astro/commit/837ee3a4aa6b33362bd680d4a7fc786ed8639444) Thanks [@matthewp](https://github.com/matthewp)! - Fixes actions with large amount of validation errors

- [#11943](https://github.com/withastro/astro/pull/11943) [`fa4671c`](https://github.com/withastro/astro/commit/fa4671ca283266092cf4f52357836d2f57817089) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates error messages that assume content collections are located in `src/content/` with more generic language

- [#12030](https://github.com/withastro/astro/pull/12030) [`10a756a`](https://github.com/withastro/astro/commit/10a756ad872ab0311524fca5438bff13d4df25c1) Thanks [@ascorbic](https://github.com/ascorbic)! - Resolves image paths in content layer with initial slash as project-relative

  When using the `image()` schema helper, previously paths with an initial slash were treated as public URLs. This was to match the behavior of markdown images. However this is a change from before, where paths with an initial slash were treated as project-relative. This change restores the previous behavior, so that paths with an initial slash are treated as project-relative.

- [#12009](https://github.com/withastro/astro/pull/12009) [`f10a3b7`](https://github.com/withastro/astro/commit/f10a3b7fe6892bd2f4f98ad602a64cfe6efde061) Thanks [@matthewp](https://github.com/matthewp)! - Fixes use of Vitest with Astro 5

- [#12075](https://github.com/withastro/astro/pull/12075) [`a19530e`](https://github.com/withastro/astro/commit/a19530e377b7d7afad58a33b23c0a5df1c376819) Thanks [@bluwy](https://github.com/bluwy)! - Parses frontmatter ourselves

- [#12552](https://github.com/withastro/astro/pull/12552) [`15f000c`](https://github.com/withastro/astro/commit/15f000c3e7bc5308c39107095e5af4258c2373a5) Thanks [@avanderbergh](https://github.com/avanderbergh)! - Fixed an issue where modifying the `Request.headers` prototype during prerendering caused a build error. Removed conflicting value and writable properties from the `headers` descriptor to prevent `Invalid property descriptor` errors.

- [#12070](https://github.com/withastro/astro/pull/12070) [`9693ad4`](https://github.com/withastro/astro/commit/9693ad4ffafb02ed1ea02beb3420ba864724b293) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the check origin middleware was incorrectly injected when the build output was `"static"`

- [#12169](https://github.com/withastro/astro/pull/12169) [`15fa9ba`](https://github.com/withastro/astro/commit/15fa9babf31a9b8ab8fc8e611c931c178137e2f9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the dev server was not providing a consistent user experience for configured redirects.

  With the fix, when you configure a redirect in `astro.config.mjs` like this `{ /old: "/new" }`, the dev server return an HTML response that matches the one emitted by a static build.

- Updated dependencies [[`3ab3b4e`](https://github.com/withastro/astro/commit/3ab3b4efbcdd2aabea5f949deedf51a5acefae59), [`5608338`](https://github.com/withastro/astro/commit/560833843c6d3ce2b6c6c473ec4ae70e744bf255), [`827093e`](https://github.com/withastro/astro/commit/827093e6175549771f9d93ddf3f2be4c2c60f0b7), [`560ef15`](https://github.com/withastro/astro/commit/560ef15ad23bd137b56ef1048eb2df548b99fdce), [`83a2a64`](https://github.com/withastro/astro/commit/83a2a648418ad30f4eb781d1c1b5f2d8a8ac846e), [`3ab3b4e`](https://github.com/withastro/astro/commit/3ab3b4efbcdd2aabea5f949deedf51a5acefae59), [`a19530e`](https://github.com/withastro/astro/commit/a19530e377b7d7afad58a33b23c0a5df1c376819), [`1dc8f5e`](https://github.com/withastro/astro/commit/1dc8f5eb7c515c89aadc85cfa0a300d4f65e8671)]:
  - @astrojs/markdown-remark@6.0.0
  - @astrojs/telemetry@3.2.0
  - @astrojs/internal-helpers@0.4.2

## 5.0.0-beta.12

### Major Changes

- [#12524](https://github.com/withastro/astro/pull/12524) [`9f44019`](https://github.com/withastro/astro/commit/9f440196dc39f36fce0198bf4c97131160e5bcc1) Thanks [@bluwy](https://github.com/bluwy)! - Bumps Vite to ^6.0.1 and handles its breaking changes

### Minor Changes

- [#12539](https://github.com/withastro/astro/pull/12539) [`827093e`](https://github.com/withastro/astro/commit/827093e6175549771f9d93ddf3f2be4c2c60f0b7) Thanks [@bluwy](https://github.com/bluwy)! - Drops node 21 support

### Patch Changes

- Updated dependencies [[`827093e`](https://github.com/withastro/astro/commit/827093e6175549771f9d93ddf3f2be4c2c60f0b7)]:
  - @astrojs/telemetry@3.2.0-beta.0
  - @astrojs/markdown-remark@6.0.0-beta.3

## 5.0.0-beta.11

### Minor Changes

- [#12510](https://github.com/withastro/astro/pull/12510) [`14feaf3`](https://github.com/withastro/astro/commit/14feaf30e1a4266b8422865722a4478d39202404) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Changes the generated URL query param from `_astroAction` to `_action` when submitting a form using Actions. This avoids leaking the framework name into the URL bar, which may be considered a security issue.

### Patch Changes

- [#12522](https://github.com/withastro/astro/pull/12522) [`33b0e30`](https://github.com/withastro/astro/commit/33b0e305fe4ecabc30ffa823454395c973f92454) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where content config was ignored if it was outside of content dir and has a parent dir with an underscore

- [#12516](https://github.com/withastro/astro/pull/12516) [`cb9322c`](https://github.com/withastro/astro/commit/cb9322c763b5cd8e43afe77d30e86a0b7d72f894) Thanks [@stramel](https://github.com/stramel)! - Handle multiple root nodes on SVG files

- [#12511](https://github.com/withastro/astro/pull/12511) [`d023682`](https://github.com/withastro/astro/commit/d023682d6c6d8797f15f3c0f65893a4aa62e3b5b) Thanks [@stramel](https://github.com/stramel)! - Fix SVG Component sprite references

- [#12498](https://github.com/withastro/astro/pull/12498) [`b140a3f`](https://github.com/withastro/astro/commit/b140a3f6d821127f927b7cb938294549e41c5168) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where Astro was trying to access `Request.headers`

## 5.0.0-beta.10

### Patch Changes

- [#12486](https://github.com/withastro/astro/pull/12486) [`dc3d842`](https://github.com/withastro/astro/commit/dc3d842e4c6f3b7e59da8a13447a1450013e10dc) Thanks [@matthewp](https://github.com/matthewp)! - Call server island early so it can set headers

## 5.0.0-beta.9

### Minor Changes

- [#12067](https://github.com/withastro/astro/pull/12067) [`c48916c`](https://github.com/withastro/astro/commit/c48916cc4e6f7c31e3563d04b68a8698d8775b65) Thanks [@stramel](https://github.com/stramel)! - Adds experimental support for built-in SVG components.

  This feature allows you to import SVG files directly into your Astro project as components. By default, Astro will inline the SVG content into your HTML output.

  To enable this feature, set `experimental.svg` to `true` in your Astro config:

  ```js
  {
    experimental: {
      svg: true,
    },
  }
  ```

  To use this feature, import an SVG file in your Astro project, passing any common SVG attributes to the imported component. Astro also provides a `size` attribute to set equal `height` and `width` properties:

  ```astro
  ---
  import Logo from './path/to/svg/file.svg';
  ---

  <Logo size={24} />
  ```

  For a complete overview, and to give feedback on this experimental API, see the [Feature RFC](https://github.com/withastro/roadmap/pull/1035).

- [#12329](https://github.com/withastro/astro/pull/12329) [`8309c61`](https://github.com/withastro/astro/commit/8309c61f0dfa5991d3f6c5c5fca4403794d6fda2) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new `astro:routes:resolved` hook to the Integration API. Also update the `astro:build:done` hook by deprecating `routes` and adding a new `assets` map.

  When building an integration, you can now get access to routes inside the `astro:routes:resolved` hook:

  ```js
  const integration = () => {
    return {
      name: 'my-integration',
      hooks: {
        'astro:routes:resolved': ({ routes }) => {
          console.log(routes);
        },
      },
    };
  };
  ```

  This hook runs before `astro:config:done`, and whenever a route changes in development.

  The `routes` array from `astro:build:done` is now deprecated, and exposed properties are now available on `astro:routes:resolved`, except for `distURL`. For this, you can use the newly exposed `assets` map:

  ```diff
  const integration = () => {
  +    let routes
      return {
          name: 'my-integration',
          hooks: {
  +            'astro:routes:resolved': (params) => {
  +                routes = params.routes
  +            },
              'astro:build:done': ({
  -                routes
  +                assets
              }) => {
  +                for (const route of routes) {
  +                    const distURL = assets.get(route.pattern)
  +                    if (distURL) {
  +                        Object.assign(route, { distURL })
  +                    }
  +                }
                  console.log(routes)
              }
          }
      }
  }
  ```

- [#12377](https://github.com/withastro/astro/pull/12377) [`af867f3`](https://github.com/withastro/astro/commit/af867f3910ecd8fc04a5337f591d84f03192e3fa) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds experimental support for automatic responsive images

  This feature is experimental and may change in future versions. To enable it, set `experimental.responsiveImages` to `true` in your `astro.config.mjs` file.

  ```js title=astro.config.mjs
  {
     experimental: {
        responsiveImages: true,
     },
  }
  ```

  When this flag is enabled, you can pass a `layout` prop to any `<Image />` or `<Picture />` component to create a responsive image. When a layout is set, images have automatically generated `srcset` and `sizes` attributes based on the image's dimensions and the layout type. Images with `responsive` and `full-width` layouts will have styles applied to ensure they resize according to their container.

  ```astro
  ---
  import { Image, Picture } from 'astro:assets';
  import myImage from '../assets/my_image.png';
  ---

  <Image
    src={myImage}
    alt="A description of my image."
    layout="responsive"
    width={800}
    height={600}
  />
  <Picture
    src={myImage}
    alt="A description of my image."
    layout="full-width"
    formats={['avif', 'webp', 'jpeg']}
  />
  ```

  This `<Image />` component will generate the following HTML output:

  ```html title=Output
  <img
    src="/_astro/my_image.hash3.webp"
    srcset="
      /_astro/my_image.hash1.webp  640w,
      /_astro/my_image.hash2.webp  750w,
      /_astro/my_image.hash3.webp  800w,
      /_astro/my_image.hash4.webp  828w,
      /_astro/my_image.hash5.webp 1080w,
      /_astro/my_image.hash6.webp 1280w,
      /_astro/my_image.hash7.webp 1600w
    "
    alt="A description of my image"
    sizes="(min-width: 800px) 800px, 100vw"
    loading="lazy"
    decoding="async"
    fetchpriority="auto"
    width="800"
    height="600"
    style="--w: 800; --h: 600; --fit: cover; --pos: center;"
    data-astro-image="responsive"
  />
  ```

  #### Responsive image properties

  These are additional properties available to the `<Image />` and `<Picture />` components when responsive images are enabled:

  - `layout`: The layout type for the image. Can be `responsive`, `fixed`, `full-width` or `none`. Defaults to value of `image.experimentalLayout`.
  - `fit`: Defines how the image should be cropped if the aspect ratio is changed. Values match those of CSS `object-fit`. Defaults to `cover`, or the value of `image.experimentalObjectFit` if set.
  - `position`: Defines the position of the image crop if the aspect ratio is changed. Values match those of CSS `object-position`. Defaults to `center`, or the value of `image.experimentalObjectPosition` if set.
  - `priority`: If set, eagerly loads the image. Otherwise images will be lazy-loaded. Use this for your largest above-the-fold image. Defaults to `false`.

  #### Default responsive image settings

  You can enable responsive images for all `<Image />` and `<Picture />` components by setting `image.experimentalLayout` with a default value. This can be overridden by the `layout` prop on each component.

  **Example:**

  ```js title=astro.config.mjs
  {
      image: {
        // Used for all `<Image />` and `<Picture />` components unless overridden
        experimentalLayout: 'responsive',
      },
      experimental: {
        responsiveImages: true,
      },
  }
  ```

  ```astro
  ---
  import { Image } from 'astro:assets';
  import myImage from '../assets/my_image.png';
  ---

  <Image src={myImage} alt="This will use responsive layout" width={800} height={600} />

  <Image src={myImage} alt="This will use full-width layout" layout="full-width" />

  <Image src={myImage} alt="This will disable responsive images" layout="none" />
  ```

  For a complete overview, and to give feedback on this experimental API, see the [Responsive Images RFC](https://github.com/withastro/roadmap/blob/responsive-images/proposals/0053-responsive-images.md).

- [#12475](https://github.com/withastro/astro/pull/12475) [`3f02d5f`](https://github.com/withastro/astro/commit/3f02d5f12b167514fff6eb9693b4e25c668e7a31) Thanks [@ascorbic](https://github.com/ascorbic)! - Changes the default content config location from `src/content/config.*` to `src/content.config.*`.

  The previous location is still supported, and is required if the `legacy.collections` flag is enabled.

### Patch Changes

- [#12424](https://github.com/withastro/astro/pull/12424) [`4364bff`](https://github.com/withastro/astro/commit/4364bff27332e52f92da72392620a36110daee42) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where an incorrect usage of Astro actions was lost when porting the fix from v4 to v5

- [#12438](https://github.com/withastro/astro/pull/12438) [`c8f877c`](https://github.com/withastro/astro/commit/c8f877cad2d8f1780f70045413872d5b9d32ebed) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where legacy content types were generated for content layer collections if they were in the content directory

## 5.0.0-beta.8

### Minor Changes

- [#12373](https://github.com/withastro/astro/pull/12373) [`d10f918`](https://github.com/withastro/astro/commit/d10f91815e63f169cff3d1daef5505aef077c76c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Changes the default behavior for Astro Action form requests to a standard POST submission.

  In Astro 4.x, actions called from an HTML form would trigger a redirect with the result forwarded using cookies. This caused issues for large form errors and return values that exceeded the 4 KB limit of cookie-based storage.

  Astro 5.0 now renders the result of an action as a POST result without any forwarding. This will introduce a "confirm form resubmission?" dialog when a user attempts to refresh the page, though it no longer imposes a 4 KB limit on action return value.

  ## Customize form submission behavior

  If you prefer to address the "confirm form resubmission?" dialog on refresh, or to preserve action results across sessions, you can now [customize action result handling from middleware](https://5-0-0-beta.docs.astro.build/en/guides/actions/#advanced-persist-action-results-with-a-session).

  We recommend using a session storage provider [as described in our Netlify Blob example](https://5-0-0-beta.docs.astro.build/en/guides/actions/#advanced-persist-action-results-with-a-session). However, if you prefer the cookie forwarding behavior from 4.X and accept the 4 KB size limit, you can implement the pattern as shown in this sample snippet:

  ```ts
  // src/middleware.ts
  import { defineMiddleware } from 'astro:middleware';
  import { getActionContext } from 'astro:actions';

  export const onRequest = defineMiddleware(async (context, next) => {
    // Skip requests for prerendered pages
    if (context.isPrerendered) return next();

    const { action, setActionResult, serializeActionResult } = getActionContext(context);

    // If an action result was forwarded as a cookie, set the result
    // to be accessible from `Astro.getActionResult()`
    const payload = context.cookies.get('ACTION_PAYLOAD');
    if (payload) {
      const { actionName, actionResult } = payload.json();
      setActionResult(actionName, actionResult);
      context.cookies.delete('ACTION_PAYLOAD');
      return next();
    }

    // If an action was called from an HTML form action,
    // call the action handler and redirect with the result as a cookie.
    if (action?.calledFrom === 'form') {
      const actionResult = await action.handler();

      context.cookies.set('ACTION_PAYLOAD', {
        actionName: action.name,
        actionResult: serializeActionResult(actionResult),
      });

      if (actionResult.error) {
        // Redirect back to the previous page on error
        const referer = context.request.headers.get('Referer');
        if (!referer) {
          throw new Error('Internal: Referer unexpectedly missing from Action POST request.');
        }
        return context.redirect(referer);
      }
      // Redirect to the destination page on success
      return context.redirect(context.originPathname);
    }

    return next();
  });
  ```

### Patch Changes

- [#12339](https://github.com/withastro/astro/pull/12339) [`bdb75a8`](https://github.com/withastro/astro/commit/bdb75a87f24d7f032797483164fb2f82aa691fee) Thanks [@ematipico](https://github.com/ematipico)! - Adds an error when `Astro.rewrite()` is used to rewrite an on-demand route with a static route when using the `"server"` output.

  This is a forbidden rewrite because Astro can't retrieve the emitted static route at runtime. This route is served by the hosting platform, and not Astro itself.

## 5.0.0-beta.7

### Minor Changes

- [#12323](https://github.com/withastro/astro/pull/12323) [`c280655`](https://github.com/withastro/astro/commit/c280655655cc6c22121f32c5f7c76836adf17230) Thanks [@bluwy](https://github.com/bluwy)! - Updates to Vite 6.0.0-beta.6

- [#12379](https://github.com/withastro/astro/pull/12379) [`94f4fe8`](https://github.com/withastro/astro/commit/94f4fe8180f02cf19fb617dde7d67d4f7bee8dac) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new components exported from `astro/components`: Welcome, to be used by the new Basics template

## 5.0.0-beta.6

### Major Changes

- [#12268](https://github.com/withastro/astro/pull/12268) [`4e9a3ac`](https://github.com/withastro/astro/commit/4e9a3ac0bd30b4013ac0b2caf068552258dfe6d9) Thanks [@ematipico](https://github.com/ematipico)! - The command `astro add vercel` now updates the configuration file differently, and adds `@astrojs/vercel` as module to import.

  This is a breaking change because it requires the version `8.*` of `@astrojs/vercel`.

- [#12231](https://github.com/withastro/astro/pull/12231) [`90ae100`](https://github.com/withastro/astro/commit/90ae100cf482529828febed591172433309bc12e) Thanks [@bluwy](https://github.com/bluwy)! - Updates the automatic `charset=utf-8` behavior for Markdown pages, where instead of responding with `charset=utf-8` in the `Content-Type` header, Astro will now automatically add the `<meta charset="utf-8">` tag instead.

  This behaviour only applies to Markdown pages (`.md` or similar Markdown files located within `src/pages/`) that do not use Astro's special `layout` frontmatter property. It matches the rendering behaviour of other non-content pages, and retains the minimal boilerplate needed to write with non-ASCII characters when adding individual Markdown pages to your site.

  If your Markdown pages use the `layout` frontmatter property, then HTML encoding will be handled by the designated layout component instead, and the `<meta charset="utf-8">` tag will not be added to your page by default.

  If you require `charset=utf-8` to render your page correctly, make sure that your layout components contain the `<meta charset="utf-8">` tag. You may need to add this if you have not already done so.

### Minor Changes

- [#12243](https://github.com/withastro/astro/pull/12243) [`eb41d13`](https://github.com/withastro/astro/commit/eb41d13162c84e9495489403611bc875eb190fed) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves `defineConfig` type safety. TypeScript will now error if a group of related configuration options do not have consistent types. For example, you will now see an error if your language set for `i18n.defaultLocale` is not one of the supported locales specified in `i18n.locales`.

- [#12150](https://github.com/withastro/astro/pull/12150) [`93351bc`](https://github.com/withastro/astro/commit/93351bc78aed8f4ecff003268bad21c3b93c2f56) Thanks [@bluwy](https://github.com/bluwy)! - Adds support for passing values other than `"production"` or `"development"` to the `--mode` flag (e.g. `"staging"`, `"testing"`, or any custom value) to change the value of `import.meta.env.MODE` or the loaded `.env` file. This allows you take advantage of Vite's [mode](https://vite.dev/guide/env-and-mode#modes) feature.

  Also adds a new `--devOutput` flag for `astro build` that will output a development-based build.

  Note that changing the `mode` does not change the kind of code transform handled by Vite and Astro:

  - In `astro dev`, Astro will transform code with debug information.
  - In `astro build`, Astro will transform code with the most optimized output and removes debug information.
  - In `astro build --devOutput` (new flag), Astro will transform code with debug information like in `astro dev`.

  This enables various usecases like:

  ```bash
  # Run the dev server connected to a "staging" API
  astro dev --mode staging

  # Build a site that connects to a "staging" API
  astro build --mode staging

  # Build a site that connects to a "production" API with additional debug information
  astro build --devOutput

  # Build a site that connects to a "testing" API
  astro build --mode testing
  ```

  The different modes can be used to load different `.env` files, e.g. `.env.staging` or `.env.production`, which can be customized for each environment, for example with different `API_URL` environment variable values.

### Patch Changes

- [#12302](https://github.com/withastro/astro/pull/12302) [`7196c24`](https://github.com/withastro/astro/commit/7196c244ea75d2f2aafbec332d91cb681f0a4cb7) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the origin check middleware run for prendered pages

- [#12341](https://github.com/withastro/astro/pull/12341) [`c1786d6`](https://github.com/withastro/astro/commit/c1786d64c4d8b25ed28f5e178531952466158e04) Thanks [@ematipico](https://github.com/ematipico)! - Fixes and issue where `Astro.currentLocale` always returned the default locale when consumed inside a server island.

- [#12270](https://github.com/withastro/astro/pull/12270) [`25192a0`](https://github.com/withastro/astro/commit/25192a059975f5a31a9c43e5d605541f4e9618bc) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the params weren't correctly computed when rendering URLs with non-English characters

## 5.0.0-beta.5

### Minor Changes

- [#12226](https://github.com/withastro/astro/pull/12226) [`51d13e2`](https://github.com/withastro/astro/commit/51d13e2f6ce3a9e03c33d80af6716847f6a78061) Thanks [@ematipico](https://github.com/ematipico)! - The following renderer fields and integration fields now accept `URL` as a type:

  **Renderers**:

  - `AstroRenderer.clientEntrpoint`
  - `AstroRenderer.serverEntrypoint`

  **Integrations**:

  - `InjectedRoute.entrypoint`
  - `AstroIntegrationMiddleware.entrypoint`
  - `DevToolbarAppEntry.entrypoint`

### Patch Changes

- [#12168](https://github.com/withastro/astro/pull/12168) [`1cd3085`](https://github.com/withastro/astro/commit/1cd30852a3bdae1847ad4e835e503598ca5fdf5c) Thanks [@ascorbic](https://github.com/ascorbic)! - Allows "slug" as a field in content layer data

- [#12169](https://github.com/withastro/astro/pull/12169) [`15fa9ba`](https://github.com/withastro/astro/commit/15fa9babf31a9b8ab8fc8e611c931c178137e2f9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where configured redirects were incorrectly constructed when reading the file system.

  This caused an issue where configuring a redirect in `astro.config.mjs` like `{ /old: /new }`, failed to trigger the correct redirect in the dev server.

- [#12169](https://github.com/withastro/astro/pull/12169) [`15fa9ba`](https://github.com/withastro/astro/commit/15fa9babf31a9b8ab8fc8e611c931c178137e2f9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the dev server was not providing a consistent user experience for configured redirects.

  With the fix, when you configure a redirect in `astro.config.mjs` like this `{ /old: "/new" }`, the dev server return an HTML response that matches the one emitted by a static build.

## 5.0.0-beta.4

### Major Changes

- [#11979](https://github.com/withastro/astro/pull/11979) [`423dfc1`](https://github.com/withastro/astro/commit/423dfc19ad83661b71151f8cec40701c7ced557b) Thanks [@bluwy](https://github.com/bluwy)! - Bumps `vite` dependency to v6.0.0-beta.2. The version is pinned and will be updated as new Vite versions publish to prevent unhandled breaking changes. For the full list of Vite-specific changes, see [its changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md).

- [#12100](https://github.com/withastro/astro/pull/12100) [`abf9a89`](https://github.com/withastro/astro/commit/abf9a89ac1eaec9a8934a68aeebe3c502a3b47eb) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Refactors legacy `content` and `data` collections to use the Content Layer API `glob()` loader for better performance and to support backwards compatibility. Also introduces the `legacy.collections` flag for projects that are unable to update to the new behavior immediately.

  :warning: **BREAKING CHANGE FOR LEGACY CONTENT COLLECTIONS** :warning:

  By default, collections that use the old types (`content` or `data`) and do not define a `loader` are now implemented under the hood using the Content Layer API's built-in `glob()` loader, with extra backward-compatibility handling.

  In order to achieve backwards compatibility with existing `content` collections, the following have been implemented:

  - a `glob` loader collection is defined, with patterns that match the previous handling (matches `src/content/<collection name>/**/*.md` and other content extensions depending on installed integrations, with underscore-prefixed files and folders ignored)
  - When used in the runtime, the entries have an ID based on the filename in the same format as legacy collections
  - A `slug` field is added with the same format as before
  - A `render()` method is added to the entry, so they can be called using `entry.render()`
  - `getEntryBySlug` is supported

  In order to achieve backwards compatibility with existing `data` collections, the following have been implemented:

  - a `glob` loader collection is defined, with patterns that match the previous handling (matches `src/content/<collection name>/**/*{.json,.yaml}` and other data extensions, with underscore-prefixed files and folders ignored)
  - Entries have an ID that is not slugified
  - `getDataEntryById` is supported

  While this backwards compatibility implementation is able to emulate most of the features of legacy collections, **there are some differences and limitations that may cause breaking changes to existing collections**:

  - In previous versions of Astro, collections would be generated for all folders in `src/content/`, even if they were not defined in `src/content/config.ts`. This behavior is now deprecated, and collections should always be defined in `src/content/config.ts`. For existing collections, these can just be empty declarations (e.g. `const blog = defineCollection({})`) and Astro will implicitly define your legacy collection for you in a way that is compatible with the new loading behavior.
  - The special `layout` field is not supported in Markdown collection entries. This property is intended only for standalone page files located in `src/pages/` and not likely to be in your collection entries. However, if you were using this property, you must now create dynamic routes that include your page styling.
  - Sort order of generated collections is non-deterministic and platform-dependent. This means that if you are calling `getCollection()`, the order in which entries are returned may be different than before. If you need a specific order, you should sort the collection entries yourself.
  - `image().refine()` is not supported. If you need to validate the properties of an image you will need to do this at runtime in your page or component.
  - the `key` argument of `getEntry(collection, key)` is typed as `string`, rather than having types for every entry.

  A new legacy configuration flag `legacy.collections` is added for users that want to keep their current legacy (content and data) collections behavior (available in Astro v2 - v4), or who are not yet ready to update their projects:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    legacy: {
      collections: true,
    },
  });
  ```

  When set, no changes to your existing collections are necessary, and the restrictions on storing both new and old collections continue to exist: legacy collections (only) must continue to remain in `src/content/`, while new collections using a loader from the Content Layer API are forbidden in that folder.

- [#12079](https://github.com/withastro/astro/pull/12079) [`7febf1f`](https://github.com/withastro/astro/commit/7febf1f6b58f2ed014df617bd7162c854cadd230) Thanks [@ematipico](https://github.com/ematipico)! - `params` passed in `getStaticPaths` are no longer automatically decoded.

  ### [changed]: `params` aren't decoded anymore.

  In Astro v4.x, `params` in were automatically decoded using `decodeURIComponent`.

  Astro v5.0 doesn't automatically decode `params` in `getStaticPaths` anymore, so you'll need to manually decode them yourself if needed

  #### What should I do?

  If you were relying on the automatic decode, you'll need to manually decode it using `decodeURI`.

  Note that the use of [`decodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)) is discouraged for `getStaticPaths` because it decodes more characters than it should, for example `/`, `?`, `#` and more.

  ```diff
  ---
  export function getStaticPaths() {
    return [
  +    { params: { id: decodeURI("%5Bpage%5D") } },
  -    { params: { id: "%5Bpage%5D" } },
    ]
  }

  const { id } = Astro.params;
  ---
  ```

### Patch Changes

- [#12127](https://github.com/withastro/astro/pull/12127) [`55e9cd8`](https://github.com/withastro/astro/commit/55e9cd88551ac56ec4cab9a9f3fd9ba49b8934b9) Thanks [@ascorbic](https://github.com/ascorbic)! - Prevents Vite emitting an error when restarting itself

## 5.0.0-beta.3

### Minor Changes

- [#12047](https://github.com/withastro/astro/pull/12047) [`21b5e80`](https://github.com/withastro/astro/commit/21b5e806c5df37c6b01da63487568a6ed351ba7d) Thanks [@rgodha24](https://github.com/rgodha24)! - Adds a new optional `parser` property to the built-in `file()` loader for content collections to support additional file types such as `toml` and `csv`.

  The `file()` loader now accepts a second argument that defines a `parser` function. This allows you to specify a custom parser (e.g. `toml.parse` or `csv-parse`) to create a collection from a file's contents. The `file()` loader will automatically detect and parse JSON and YAML files (based on their file extension) with no need for a `parser`.

  This works with any type of custom file formats including `csv` and `toml`. The following example defines a content collection `dogs` using a `.toml` file.

  ```toml
  [[dogs]]
  id = "..."
  age = "..."

  [[dogs]]
  id = "..."
  age = "..."
  ```

  After importing TOML's parser, you can load the `dogs` collection into your project by passing both a file path and `parser` to the `file()` loader.

  ```typescript
  import { defineCollection } from "astro:content"
  import { file } from "astro/loaders"
  import { parse as parseToml } from "toml"

  const dogs = defineCollection({
    loader: file("src/data/dogs.toml", { parser: (text) => parseToml(text).dogs }),
    schema: /* ... */
  })

  // it also works with CSVs!
  import { parse as parseCsv } from "csv-parse/sync";

  const cats = defineCollection({
    loader: file("src/data/cats.csv", { parser: (text) => parseCsv(text, { columns: true, skipEmptyLines: true })})
  });
  ```

  The `parser` argument also allows you to load a single collection from a nested JSON document. For example, this JSON file contains multiple collections:

  ```json
  { "dogs": [{}], "cats": [{}] }
  ```

  You can separate these collections by passing a custom `parser` to the `file()` loader like so:

  ```typescript
  const dogs = defineCollection({
    loader: file('src/data/pets.json', { parser: (text) => JSON.parse(text).dogs }),
  });
  const cats = defineCollection({
    loader: file('src/data/pets.json', { parser: (text) => JSON.parse(text).cats }),
  });
  ```

  And it continues to work with maps of `id` to `data`

  ```yaml
  bubbles:
    breed: 'Goldfish'
    age: 2
  finn:
    breed: 'Betta'
    age: 1
  ```

  ```typescript
  const fish = defineCollection({
    loader: file('src/data/fish.yaml'),
    schema: z.object({ breed: z.string(), age: z.number() }),
  });
  ```

- [#12071](https://github.com/withastro/astro/pull/12071) [`61d248e`](https://github.com/withastro/astro/commit/61d248e581a3bebf0ec67169813fc8ae4a2182df) Thanks [@Princesseuh](https://github.com/Princesseuh)! - `astro add` no longer automatically sets `output: 'server'`. Since the default value of output now allows for server-rendered pages, it no longer makes sense to default to full server builds when you add an adapter

- [#11963](https://github.com/withastro/astro/pull/11963) [`0a1036e`](https://github.com/withastro/astro/commit/0a1036eef62f13c9609362874c5b88434d1e9300) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new `createCodegenDir()` function to the `astro:config:setup` hook in the Integrations API

  In 4.14, we introduced the `injectTypes` utility on the `astro:config:done` hook. It can create `.d.ts` files and make their types available to user's projects automatically. Under the hood, it creates a file in `<root>/.astro/integrations/<normalized_integration_name>`.

  While the `.astro` directory has always been the preferred place to write code generated files, it has also been prone to mistakes. For example, you can write a `.astro/types.d.ts` file, breaking Astro types. Or you can create a file that overrides a file created by another integration.

  In this release, `<root>/.astro/integrations/<normalized_integration_name>` can now be retrieved in the `astro:config:setup` hook by calling `createCodegenDir()`. It allows you to have a dedicated folder, avoiding conflicts with another integration or Astro itself. This directory is created by calling this function so it's safe to write files to it directly:

  ```js
  import { writeFileSync } from 'node:fs';

  const integration = {
    name: 'my-integration',
    hooks: {
      'astro:config:setup': ({ createCodegenDir }) => {
        const codegenDir = createCodegenDir();
        writeFileSync(new URL('cache.json', codegenDir), '{}', 'utf-8');
      },
    },
  };
  ```

- [#12081](https://github.com/withastro/astro/pull/12081) [`8679954`](https://github.com/withastro/astro/commit/8679954bf647529e0f2134053866fc507e64c5e3) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the experimental `contentCollectionsCache` introduced in `3.5.0`.

  Astro Content Layer API independently solves some of the caching and performance issues with legacy content collections that this strategy attempted to address. This feature has been replaced with continued work on improvements to the content layer. If you were using this experimental feature, you must now remove the flag from your Astro config as it no longer exists:

  ```diff
  export default defineConfig({
      experimental: {
  -        contentCollectionsCache: true
      }
  })
  ```

  The `cacheManifest` boolean argument is no longer passed to the `astro:build:done` integration hook:

  ```diff
  const integration = {
      name: "my-integration",
      hooks: {
          "astro:build:done": ({
  -            cacheManifest,
              logger
          }) => {}
      }
  }
  ```

### Patch Changes

- [#12073](https://github.com/withastro/astro/pull/12073) [`acf264d`](https://github.com/withastro/astro/commit/acf264d8c003718cda5a0b9ce5fb7ac1cd6641b6) Thanks [@bluwy](https://github.com/bluwy)! - Replaces `ora` with `yocto-spinner`

- [#12075](https://github.com/withastro/astro/pull/12075) [`a19530e`](https://github.com/withastro/astro/commit/a19530e377b7d7afad58a33b23c0a5df1c376819) Thanks [@bluwy](https://github.com/bluwy)! - Parses frontmatter ourselves

- [#12070](https://github.com/withastro/astro/pull/12070) [`9693ad4`](https://github.com/withastro/astro/commit/9693ad4ffafb02ed1ea02beb3420ba864724b293) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the check origin middleware was incorrectly injected when the build output was `"static"`

- Updated dependencies [[`a19530e`](https://github.com/withastro/astro/commit/a19530e377b7d7afad58a33b23c0a5df1c376819)]:
  - @astrojs/markdown-remark@6.0.0-beta.2

## 5.0.0-beta.2

### Patch Changes

- [#12035](https://github.com/withastro/astro/pull/12035) [`325a57c`](https://github.com/withastro/astro/commit/325a57c543d88eab5e3ab32ee1bbfb534aed9c7c) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly parse values returned from inline loader

- [#12022](https://github.com/withastro/astro/pull/12022) [`ddc3a08`](https://github.com/withastro/astro/commit/ddc3a08e8facdaf0b0298ee5a7adb73a53e1575e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Properly handle including trailing slash on the image endpoint route based on the trailingSlash config

- [#12016](https://github.com/withastro/astro/pull/12016) [`837ee3a`](https://github.com/withastro/astro/commit/837ee3a4aa6b33362bd680d4a7fc786ed8639444) Thanks [@matthewp](https://github.com/matthewp)! - Fixes actions with large amount of validation errors

- [#12030](https://github.com/withastro/astro/pull/12030) [`10a756a`](https://github.com/withastro/astro/commit/10a756ad872ab0311524fca5438bff13d4df25c1) Thanks [@ascorbic](https://github.com/ascorbic)! - Resolves image paths in content layer with initial slash as project-relative

  When using the `image()` schema helper, previously paths with an initial slash were treated as public URLs. This was to match the behavior of markdown images. However this is a change from before, where paths with an initial slash were treated as project-relative. This change restores the previous behavior, so that paths with an initial slash are treated as project-relative.

## 5.0.0-beta.1

### Major Changes

- [#12008](https://github.com/withastro/astro/pull/12008) [`5608338`](https://github.com/withastro/astro/commit/560833843c6d3ce2b6c6c473ec4ae70e744bf255) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Welcome to the Astro 5 beta! This release has no changes from the latest alpha of this package, but it does bring us one step closer to the final, stable release.

  Starting from this release, no breaking changes will be introduced unless absolutely necessary.

  To learn how to upgrade, check out the [Astro v5.0 upgrade guide in our beta docs site](https://5-0-0-beta.docs.astro.build/en/guides/upgrade-to/v5/).

### Patch Changes

- Updated dependencies [[`5608338`](https://github.com/withastro/astro/commit/560833843c6d3ce2b6c6c473ec4ae70e744bf255)]:
  - @astrojs/markdown-remark@6.0.0-beta.1

## 5.0.0-alpha.9

### Patch Changes

- [#12011](https://github.com/withastro/astro/pull/12011) [`cfdaab2`](https://github.com/withastro/astro/commit/cfdaab257cd167e0d4631ab66d9406754b3c1836) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes a type and an example in documenting the `security.checkOrigin` property of Astro config.

- [#12009](https://github.com/withastro/astro/pull/12009) [`f10a3b7`](https://github.com/withastro/astro/commit/f10a3b7fe6892bd2f4f98ad602a64cfe6efde061) Thanks [@matthewp](https://github.com/matthewp)! - Fixes use of Vitest with Astro 5

## 5.0.0-alpha.8

### Major Changes

- [#11982](https://github.com/withastro/astro/pull/11982) [`d84e444`](https://github.com/withastro/astro/commit/d84e444fd3496c1f787b3fcee2929c92bc74e0cd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a default exclude and include value to the tsconfig presets. `{projectDir}/dist` is now excluded by default, and `{projectDir}/.astro/types.d.ts` and `{projectDir}/**/*` are included by default.

  Both of these options can be overridden by setting your own values to the corresponding settings in your `tsconfig.json` file.

- [#11987](https://github.com/withastro/astro/pull/11987) [`bf90a53`](https://github.com/withastro/astro/commit/bf90a5343f9cd1bb46f30e4b331e7ae675f5e720) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - The `locals` object can no longer be overridden

  Middleware, API endpoints, and pages can no longer override the `locals` object in its entirety. You can still append values onto the object, but you can not replace the entire object and delete its existing values.

  If you were previously overwriting like so:

  ```js
  ctx.locals = {
    one: 1,
    two: 2,
  };
  ```

  This can be changed to an assignment on the existing object instead:

  ```js
  Object.assign(ctx.locals, {
    one: 1,
    two: 2,
  });
  ```

### Minor Changes

- [#11980](https://github.com/withastro/astro/pull/11980) [`a604a0c`](https://github.com/withastro/astro/commit/a604a0ca9e0cdead01610b603d3b4c37ab010efc) Thanks [@matthewp](https://github.com/matthewp)! - ViewTransitions component renamed to ClientRouter

  The `<ViewTransitions />` component has been renamed to `<ClientRouter />`. There are no other changes than the name. The old name will continue to work in Astro 5.x, but will be removed in 6.0.

  This change was done to clarify the role of the component within Astro's View Transitions support. Astro supports View Transitions APIs in a few different ways, and renaming the component makes it more clear that the features you get from the ClientRouter component are slightly different from what you get using the native CSS-based MPA router.

  We still intend to maintain the ClientRouter as before, and it's still important for use-cases that the native support doesn't cover, such as persisting state between pages.

### Patch Changes

- [#11987](https://github.com/withastro/astro/pull/11987) [`bf90a53`](https://github.com/withastro/astro/commit/bf90a5343f9cd1bb46f30e4b331e7ae675f5e720) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - `render()` signature now takes `renderOptions` as 2nd argument

  The signature for `app.render()` has changed, and the second argument is now an options object called `renderOptions` with more options for customizing rendering.

  The `renderOptions` are:

  - `addCookieHeader`: Determines whether Astro will set the `Set-Cookie` header, otherwise the adapter is expected to do so itself.
  - `clientAddress`: The client IP address used to set `Astro.clientAddress`.
  - `locals`: An object of locals that's set to `Astro.locals`.
  - `routeData`: An object specifying the route to use.

- [#11991](https://github.com/withastro/astro/pull/11991) [`d7a396c`](https://github.com/withastro/astro/commit/d7a396ca3eedc1b32b4ea113cbacb4ccb08384c9) Thanks [@matthewp](https://github.com/matthewp)! - Update error link to on-demand rendering guide

## 5.0.0-alpha.7

### Major Changes

- [#11864](https://github.com/withastro/astro/pull/11864) [`ee38b3a`](https://github.com/withastro/astro/commit/ee38b3a94697fe883ce8300eff9f001470b8adb6) Thanks [@ematipico](https://github.com/ematipico)! - ### [changed]: `entryPoint` type inside the hook `astro:build:ssr`
  In Astro v4.x, the `entryPoint` type was `RouteData`.

  Astro v5.0 the `entryPoint` type is `IntegrationRouteData`, which contains a subset of the `RouteData` type. The fields `isIndex` and `fallbackRoutes` were removed.

  #### What should I do?

  Update your adapter to change the type of `entryPoint` from `RouteData` to `IntegrationRouteData`.

  ```diff
  -import type {RouteData} from 'astro';
  +import type {IntegrationRouteData} from "astro"

  -function useRoute(route: RouteData) {
  +function useRoute(route: IntegrationRouteData) {

  }
  ```

- [#11908](https://github.com/withastro/astro/pull/11908) [`518433e`](https://github.com/withastro/astro/commit/518433e433fe69ee3bbbb1f069181cd9eb69ec9a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - The `image.endpoint` config now allow customizing the route of the image endpoint in addition to the entrypoint. This can be useful in niche situations where the default route `/_image` conflicts with an existing route or your local server setup.

  ```js
  import { defineConfig } from 'astro/config';

  defineConfig({
    image: {
      endpoint: {
        route: '/image',
        entrypoint: './src/image_endpoint.ts',
      },
    },
  });
  ```

- [#11806](https://github.com/withastro/astro/pull/11806) [`f7f2338`](https://github.com/withastro/astro/commit/f7f2338c2b96975001b5c782f458710e9cc46d74) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Removes the `assets` property on `supportedAstroFeatures` for adapters, as it did not reflect reality properly in many cases.

  Now, relating to assets, only a single `sharpImageService` property is available, determining if the adapter is compatible with the built-in sharp image service.

- [#11864](https://github.com/withastro/astro/pull/11864) [`ee38b3a`](https://github.com/withastro/astro/commit/ee38b3a94697fe883ce8300eff9f001470b8adb6) Thanks [@ematipico](https://github.com/ematipico)! - ### [changed]: `routes` type inside the hook `astro:build:done`
  In Astro v4.x, the `routes` type was `RouteData`.

  Astro v5.0 the `routes` type is `IntegrationRouteData`, which contains a subset of the `RouteData` type. The fields `isIndex` and `fallbackRoutes` were removed.

  #### What should I do?

  Update your adapter to change the type of `routes` from `RouteData` to `IntegrationRouteData`.

  ```diff
  -import type {RouteData} from 'astro';
  +import type {IntegrationRouteData} from "astro"

  -function useRoute(route: RouteData) {
  +function useRoute(route: IntegrationRouteData) {

  }
  ```

- [#11864](https://github.com/withastro/astro/pull/11864) [`ee38b3a`](https://github.com/withastro/astro/commit/ee38b3a94697fe883ce8300eff9f001470b8adb6) Thanks [@ematipico](https://github.com/ematipico)! - ### [changed]: `RouteData.distURL` is now an array
  In Astro v4.x, `RouteData.distURL` was `undefined` or a `URL`

  Astro v5.0, `RouteData.distURL` is `undefined` or an array of `URL`. This was a bug, because a route can generate multiple files on disk, especially when using dynamic routes such as `[slug]` or `[...slug]`.

  #### What should I do?

  Update your code to handle `RouteData.distURL` as an array.

  ```diff
  if (route.distURL) {
  -  if (route.distURL.endsWith('index.html')) {
  -    // do something
  -  }
  +  for (const url of route.distURL) {
  +    if (url.endsWith('index.html')) {
  +      // do something
  +    }
  +  }
  }
  ```

### Minor Changes

- [#11806](https://github.com/withastro/astro/pull/11806) [`f7f2338`](https://github.com/withastro/astro/commit/f7f2338c2b96975001b5c782f458710e9cc46d74) Thanks [@Princesseuh](https://github.com/Princesseuh)! - The value of the different properties on `supportedAstroFeatures` for adapters can now be objects, with a `support` and `message` properties. The content of the `message` property will be shown in the Astro CLI when the adapter is not compatible with the feature, allowing one to give a better informational message to the user.

  This is notably useful with the new `limited` value, to explain to the user why support is limited.

- [#11955](https://github.com/withastro/astro/pull/11955) [`d813262`](https://github.com/withastro/astro/commit/d8132626b05f150341c0628d6078fdd86b89aaed) Thanks [@matthewp](https://github.com/matthewp)! - [Server Islands](https://astro.build/blog/future-of-astro-server-islands/) introduced behind an experimental flag in [v4.12.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#4120) is no longer experimental and is available for general use.

  Server islands are Astro's solution for highly cacheable pages of mixed static and dynamic content. They allow you to specify components that should run on the server, allowing the rest of the page to be more aggressively cached, or even generated statically.

  Turn any `.astro` component into a server island by adding the `server:defer` directive and optionally, fallback placeholder content. It will be rendered dynamically at runtime outside the context of the rest of the page, allowing you to add longer cache headers for the pages, or even prerender them.

  ```astro
  ---
  import Avatar from '../components/Avatar.astro';
  import GenericUser from '../components/GenericUser.astro';
  ---

  <header>
    <h1>Page Title</h1>
    <div class="header-right">
      <Avatar server:defer>
        <GenericUser slot="fallback" />
      </Avatar>
    </div>
  </header>
  ```

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental {
  -    serverIslands: true,
    },
  });
  ```

  If you have been waiting for stabilization before using server islands, you can now do so.

  Please see the [server island documentation](https://docs.astro.build/en/guides/server-islands/) for more about this feature.

- [#11806](https://github.com/withastro/astro/pull/11806) [`f7f2338`](https://github.com/withastro/astro/commit/f7f2338c2b96975001b5c782f458710e9cc46d74) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `limited` value for the different properties of `supportedAstroFeatures` for adapters, which indicates that the adapter is compatible with the feature, but with some limitations. This is useful for adapters that support a feature, but not in all cases or with all options.

- [#11925](https://github.com/withastro/astro/pull/11925) [`74722cb`](https://github.com/withastro/astro/commit/74722cb81c46d4d29c8c5a2127f896da4d8d3235) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `astro/config` import to reference `astro/client` types

  When importing `astro/config`, types from `astro/client` will be made automatically available to your project. If your project `tsconfig.json` changes how references behave, you'll still have access to these types after running `astro sync`.

### Patch Changes

- [#11974](https://github.com/withastro/astro/pull/11974) [`60211de`](https://github.com/withastro/astro/commit/60211defbfb2992ba17d1369e71c146d8928b09a) Thanks [@ascorbic](https://github.com/ascorbic)! - Exports the `RenderResult` type

## 5.0.0-alpha.6

### Major Changes

- [#11941](https://github.com/withastro/astro/pull/11941) [`b6a5f39`](https://github.com/withastro/astro/commit/b6a5f39846581d0e9cfd7ae6f056c8d1209f71bd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Merges the `output: 'hybrid'` and `output: 'static'` configurations into one single configuration (now called `'static'`) that works the same way as the previous `hybrid` option.

  It is no longer necessary to specify `output: 'hybrid'` in your Astro config to use server-rendered pages. The new `output: 'static'` has this capability included. Astro will now automatically provide the ability to opt out of prerendering in your static site with no change to your `output` configuration required. Any page route or endpoint can include `export const prerender = false` to be server-rendered, while the rest of your site is statically-generated.

  If your project used hybrid rendering, you must now remove the `output: 'hybrid'` option from your Astro config as it no longer exists. However, no other changes to your project are required, and you should have no breaking changes. The previous `'hybrid'` behavior is now the default, under a new name `'static'`.

  If you were using the `output: 'static'` (default) option, you can continue to use it as before. By default, all of your pages will continue to be prerendered and you will have a completely static site. You should have no breaking changes to your project.

  ```diff
  import { defineConfig } from "astro/config";

  export default defineConfig({
  -  output: 'hybrid',
  });
  ```

  An adapter is still required to deploy an Astro project with any server-rendered pages. Failure to include an adapter will result in a warning in development and an error at build time.

### Minor Changes

- [#11941](https://github.com/withastro/astro/pull/11941) [`b6a5f39`](https://github.com/withastro/astro/commit/b6a5f39846581d0e9cfd7ae6f056c8d1209f71bd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adapters can now specify the build output type they're intended for using the `adapterFeatures.buildOutput` property. This property can be used to always generate a server output, even if the project doesn't have any server-rendered pages.

  ```ts
  {
    'astro:config:done': ({ setAdapter, config }) => {
      setAdapter({
        name: 'my-adapter',
        adapterFeatures: {
          buildOutput: 'server',
        },
      });
    },
  }
  ```

  If your adapter specifies `buildOutput: 'static'`, and the user's project contains server-rendered pages, Astro will warn in development and error at build time. Note that a hybrid output, containing both static and server-rendered pages, is considered to be a `server` output, as a server is required to serve the server-rendered pages.

- [#11941](https://github.com/withastro/astro/pull/11941) [`b6a5f39`](https://github.com/withastro/astro/commit/b6a5f39846581d0e9cfd7ae6f056c8d1209f71bd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `buildOutput` property to the `astro:config:done` hook returning the build output type.

  This can be used to know if the user's project will be built as a static site (HTML files), or a server-rendered site (whose exact output depends on the adapter).

### Patch Changes

- [#11960](https://github.com/withastro/astro/pull/11960) [`4410130`](https://github.com/withastro/astro/commit/4410130df722eae494caaa46b17c8eeb6223f160) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue where the refresh context data was not passed correctly to content layer loaders

- [#11952](https://github.com/withastro/astro/pull/11952) [`50a0146`](https://github.com/withastro/astro/commit/50a0146e9aff78a245914125f34719cfb32c585f) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds support for array patterns in the built-in `glob()` content collections loader

  The glob loader can now accept an array of multiple patterns as well as string patterns. This allows you to more easily combine multiple patterns into a single collection, and also means you can use negative matches to exclude files from the collection.

  ```ts
  const probes = defineCollection({
    // Load all markdown files in the space-probes directory, except for those that start with "voyager-"
    loader: glob({ pattern: ['*.md', '!voyager-*'], base: 'src/data/space-probes' }),
    schema: z.object({
      name: z.string(),
      type: z.enum(['Space Probe', 'Mars Rover', 'Comet Lander']),
      launch_date: z.date(),
      status: z.enum(['Active', 'Inactive', 'Decommissioned']),
      destination: z.string(),
      operator: z.string(),
      notable_discoveries: z.array(z.string()),
    }),
  });
  ```

- [#11968](https://github.com/withastro/astro/pull/11968) [`86ad1fd`](https://github.com/withastro/astro/commit/86ad1fd223e2d2c448372caa159090efbee69237) Thanks [@NikolaRHristov](https://github.com/NikolaRHristov)! - Fixes a typo in the server island JSDoc

- [#11983](https://github.com/withastro/astro/pull/11983) [`633eeaa`](https://github.com/withastro/astro/commit/633eeaa9d8a8a35bba638fde06fd8f52cc1c2ce3) Thanks [@uwej711](https://github.com/uwej711)! - Remove dependency on path-to-regexp

## 5.0.0-alpha.5

### Major Changes

- [#11916](https://github.com/withastro/astro/pull/11916) [`46ea29f`](https://github.com/withastro/astro/commit/46ea29f91df83ea638ecbc544ce99375538636d4) Thanks [@bluwy](https://github.com/bluwy)! - Updates how the `build.client` and `build.server` option values get resolved to match existing documentation. With this fix, the option values will now correctly resolve relative to the `outDir` option. So if `outDir` is set to `./dist/nested/`, then by default:

  - `build.client` will resolve to `<root>/dist/nested/client/`
  - `build.server` will resolve to `<root>/dist/nested/server/`

  Previously the values were incorrectly resolved:

  - `build.client` was resolved to `<root>/dist/nested/dist/client/`
  - `build.server` was resolved to `<root>/dist/nested/dist/server/`

  If you were relying on the previous build paths, make sure that your project code is updated to the new build paths.

### Minor Changes

- [#11875](https://github.com/withastro/astro/pull/11875) [`a8a3d2c`](https://github.com/withastro/astro/commit/a8a3d2cde813d891dd9c63f07f91ce4e77d4f93b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new property `isPrerendered` to the globals `Astro` and `APIContext` . This boolean value represents whether or not the current page is prerendered:

  ```astro
  ---
  // src/pages/index.astro

  export const prerender = true;
  ---
  ```

  ```js
  // src/middleware.js

  export const onRequest = (ctx, next) => {
    console.log(ctx.isPrerendered); // it will log true
    return next();
  };
  ```

### Patch Changes

- [#11927](https://github.com/withastro/astro/pull/11927) [`5b4e3ab`](https://github.com/withastro/astro/commit/5b4e3abbb152146b71c1af05d33c96211000b2a6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates the `env` configuration reference docs to include a full API reference for `envField`.

- [#11943](https://github.com/withastro/astro/pull/11943) [`fa4671c`](https://github.com/withastro/astro/commit/fa4671ca283266092cf4f52357836d2f57817089) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates error messages that assume content collections are located in `src/content/` with more generic language

## 5.0.0-alpha.4

### Major Changes

- [#11859](https://github.com/withastro/astro/pull/11859) [`3804711`](https://github.com/withastro/astro/commit/38047119ff454e80cddd115bff53e33b32cd9930) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Changes the default `tsconfig.json` with better defaults, and makes `src/env.d.ts` optional

  Astro's default `tsconfig.json` in starter examples has been updated to include generated types and exclude your build output. This means that `src/env.d.ts` is only necessary if you have added custom type declarations or if you're not using a `tsconfig.json` file.

  Additionally, running `astro sync` no longer creates, nor updates, `src/env.d.ts` as it is not required for type-checking standard Astro projects.

  To update your project to Astro's recommended TypeScript settings, please add the following `include` and `exclude` properties to `tsconfig.json`:

  ```diff
  {
      "extends": "astro/tsconfigs/base",
  +    "include": [".astro/types.d.ts", "**/*"],
  +    "exclude": ["dist"]
  }
  ```

### Minor Changes

- [#11911](https://github.com/withastro/astro/pull/11911) [`c3dce83`](https://github.com/withastro/astro/commit/c3dce8363be22121a567df22df2ec566a3ebda17) Thanks [@ascorbic](https://github.com/ascorbic)! - The Content Layer API introduced behind a flag in [4.14.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#4140) is now stable and ready for use in Astro v5.0.

  The new Content Layer API builds upon content collections, taking them beyond local files in `src/content/` and allowing you to fetch content from anywhere, including remote APIs. These new collections work alongside your existing content collections, and you can migrate them to the new API at your own pace. There are significant improvements to performance with large collections of local files. For more details, see [the Content Layer RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0050-content-layer.md).

  If you previously used this feature, you can now remove the `experimental.contentLayer` flag from your Astro config:

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    contentLayer: true
  -  }
  })
  ```

  ### Loading your content

  The core of the new Content Layer API is the loader, a function that fetches content from a source and caches it in a local data store. Astro 4.14 ships with built-in `glob()` and `file()` loaders to handle your local Markdown, MDX, Markdoc, and JSON files:

  ```ts {3,7}
  // src/content/config.ts
  import { defineCollection, z } from 'astro:content';
  import { glob } from 'astro/loaders';

  const blog = defineCollection({
    // The ID is a slug generated from the path of the file relative to `base`
    loader: glob({ pattern: '**/*.md', base: './src/data/blog' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.coerce.date(),
    }),
  });

  export const collections = { blog };
  ```

  You can then query using the existing content collections functions, and use a simplified `render()` function to display your content:

  ```astro
  ---
  import { getEntry, render } from 'astro:content';

  const post = await getEntry('blog', Astro.params.slug);

  const { Content } = await render(entry);
  ---

  <Content />
  ```

  ### Creating a loader

  You're not restricted to the built-in loaders – we hope you'll try building your own. You can fetch content from anywhere and return an array of entries:

  ```ts
  // src/content/config.ts
  const countries = defineCollection({
    loader: async () => {
      const response = await fetch('https://restcountries.com/v3.1/all');
      const data = await response.json();
      // Must return an array of entries with an id property,
      // or an object with IDs as keys and entries as values
      return data.map((country) => ({
        id: country.cca3,
        ...country,
      }));
    },
    // optionally add a schema to validate the data and make it type-safe for users
    // schema: z.object...
  });

  export const collections = { countries };
  ```

  For more advanced loading logic, you can define an object loader. This allows incremental updates and conditional loading, and gives full access to the data store. It also allows a loader to define its own schema, including generating it dynamically based on the source API. See the [the Content Layer API RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0050-content-layer.md#loaders) for more details.

  ### Sharing your loaders

  Loaders are better when they're shared. You can create a package that exports a loader and publish it to npm, and then anyone can use it on their site. We're excited to see what the community comes up with! To get started, [take a look at some examples](https://github.com/ascorbic/astro-loaders/). Here's how to load content using an RSS/Atom feed loader:

  ```ts
  // src/content/config.ts
  import { defineCollection } from 'astro:content';
  import { feedLoader } from '@ascorbic/feed-loader';

  const podcasts = defineCollection({
    loader: feedLoader({
      url: 'https://feeds.99percentinvisible.org/99percentinvisible',
    }),
  });

  export const collections = { podcasts };
  ```

  To learn more, see [the Content Layer RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0050-content-layer.md).

### Patch Changes

- [#11902](https://github.com/withastro/astro/pull/11902) [`d63bc50`](https://github.com/withastro/astro/commit/d63bc50d9940c1107e0fee7687e5c332549a0eff) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes case where content layer did not update during clean dev builds on Linux and Windows

- [#11914](https://github.com/withastro/astro/pull/11914) [`b5d827b`](https://github.com/withastro/astro/commit/b5d827ba6852d046c33643f795e1542bc2818b2c) Thanks [@ascorbic](https://github.com/ascorbic)! - Exports types for all `LoaderContext` properties from `astro/loaders` to make it easier to use them in custom loaders.
  The `ScopedDataStore` interface (which was previously internal) is renamed to `DataStore`, to reflect the fact that it's the only public API for the data store.

## 5.0.0-alpha.3

### Major Changes

- [#11861](https://github.com/withastro/astro/pull/11861) [`3ab3b4e`](https://github.com/withastro/astro/commit/3ab3b4efbcdd2aabea5f949deedf51a5acefae59) Thanks [@bluwy](https://github.com/bluwy)! - Cleans up Astro-specific metadata attached to `vfile.data` in Remark and Rehype plugins. Previously, the metadata was attached in different locations with inconsistent names. The metadata is now renamed as below:

  - `vfile.data.__astroHeadings` -> `vfile.data.astro.headings`
  - `vfile.data.imagePaths` -> `vfile.data.astro.imagePaths`

  The types of `imagePaths` has also been updated from `Set<string>` to `string[]`. The `vfile.data.astro.frontmatter` metadata is left unchanged.

  While we don't consider these APIs public, they can be accessed by Remark and Rehype plugins that want to re-use Astro's metadata. If you are using these APIs, make sure to access them in the new locations.

- [#11825](https://github.com/withastro/astro/pull/11825) [`560ef15`](https://github.com/withastro/astro/commit/560ef15ad23bd137b56ef1048eb2df548b99fdce) Thanks [@bluwy](https://github.com/bluwy)! - Updates internal Shiki rehype plugin to highlight code blocks as hast (using Shiki's `codeToHast()` API). This allows a more direct Markdown and MDX processing, and improves the performance when building the project, but may cause issues with existing Shiki transformers.

  If you are using Shiki transformers passed to `markdown.shikiConfig.transformers`, you must make sure they do not use the `postprocess` hook as it no longer runs on code blocks in `.md` and `.mdx` files. (See [the Shiki documentation on transformer hooks](https://shiki.style/guide/transformers#transformer-hooks) for more information).

  Code blocks in `.mdoc` files and `<Code />` component do not use the internal Shiki rehype plugin and are unaffected.

- [#11819](https://github.com/withastro/astro/pull/11819) [`2bdde80`](https://github.com/withastro/astro/commit/2bdde80cd3107d875e2d77e6e9621001e0e8b38a) Thanks [@bluwy](https://github.com/bluwy)! - Updates the Astro config loading flow to ignore processing locally-linked dependencies with Vite (e.g. `npm link`, in a monorepo, etc). Instead, they will be normally imported by the Node.js runtime the same way as other dependencies from `node_modules`.

  Previously, Astro would process locally-linked dependencies which were able to use Vite features like TypeScript when imported by the Astro config file.

  However, this caused confusion as integration authors may test against a package that worked locally, but not when published. This method also restricts using CJS-only dependencies because Vite requires the code to be ESM. Therefore, Astro's behaviour is now changed to ignore processing any type of dependencies by Vite.

  In most cases, make sure your locally-linked dependencies are built to JS before running the Astro project, and the config loading should work as before.

### Patch Changes

- [#11878](https://github.com/withastro/astro/pull/11878) [`334948c`](https://github.com/withastro/astro/commit/334948ced29ed9ab03992f2174547bb9ee3a20c0) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a new function `refreshContent` to the `astro:server:setup` hook that allows integrations to refresh the content layer. This can be used, for example, to register a webhook endpoint during dev, or to open a socket to a CMS to listen for changes.

  By default, `refreshContent` will refresh all collections. You can optionally pass a `loaders` property, which is an array of loader names. If provided, only collections that use those loaders will be refreshed. For example, A CMS integration could use this property to only refresh its own collections.

  You can also pass a `context` object to the loaders. This can be used to pass arbitrary data, such as the webhook body, or an event from the websocket.

  ```ts
   {
      name: 'my-integration',
      hooks: {
          'astro:server:setup': async ({ server, refreshContent }) => {
              server.middlewares.use('/_refresh', async (req, res) => {
                  if(req.method !== 'POST') {
                    res.statusCode = 405
                    res.end('Method Not Allowed');
                    return
                  }
                  let body = '';
                  req.on('data', chunk => {
                      body += chunk.toString();
                  });
                  req.on('end', async () => {
                      try {
                          const webhookBody = JSON.parse(body);
                          await refreshContent({
                            context: { webhookBody },
                            loaders: ['my-loader']
                          });
                          res.writeHead(200, { 'Content-Type': 'application/json' });
                          res.end(JSON.stringify({ message: 'Content refreshed successfully' }));
                      } catch (error) {
                          res.writeHead(500, { 'Content-Type': 'application/json' });
                          res.end(JSON.stringify({ error: 'Failed to refresh content: ' + error.message }));
                      }
                  });
              });
          }
      }
  }
  ```

- Updated dependencies [[`3ab3b4e`](https://github.com/withastro/astro/commit/3ab3b4efbcdd2aabea5f949deedf51a5acefae59), [`560ef15`](https://github.com/withastro/astro/commit/560ef15ad23bd137b56ef1048eb2df548b99fdce), [`3ab3b4e`](https://github.com/withastro/astro/commit/3ab3b4efbcdd2aabea5f949deedf51a5acefae59)]:
  - @astrojs/markdown-remark@6.0.0-alpha.1

## 5.0.0-alpha.2

### Major Changes

- [#11826](https://github.com/withastro/astro/pull/11826) [`7315050`](https://github.com/withastro/astro/commit/7315050fc1192fa72ae92aef92b920f63b46118f) Thanks [@matthewp](https://github.com/matthewp)! - Deprecate Astro.glob

  The `Astro.glob` function has been deprecated in favor of Content Collections and `import.meta.glob`.

  - If you want to query for markdown and MDX in your project, use Content Collections.
  - If you want to query source files in your project, use `import.meta.glob`(https://vitejs.dev/guide/features.html#glob-import).

  Also consider using glob packages from npm, like [fast-glob](https://www.npmjs.com/package/fast-glob), especially if statically generating your site, as it is faster for most use-cases.

  The easiest path is to migrate to `import.meta.glob` like so:

  ```diff
  - const posts = Astro.glob('./posts/*.md');
  + const posts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));
  ```

- [#11827](https://github.com/withastro/astro/pull/11827) [`a83e362`](https://github.com/withastro/astro/commit/a83e362ee41174501a433c210a24696784d7368f) Thanks [@matthewp](https://github.com/matthewp)! - Prevent usage of `astro:content` in the client

  Usage of `astro:content` in the client has always been discouraged because it leads to all of your content winding up in your client bundle, and can possibly leaks secrets.

  This formally makes doing so impossible, adding to the previous warning with errors.

  In the future Astro might add APIs for client-usage based on needs.

- [#11253](https://github.com/withastro/astro/pull/11253) [`4e5cc5a`](https://github.com/withastro/astro/commit/4e5cc5aadd7d864bc5194ee67dc2ea74dbe80473) Thanks [@kevinzunigacuellar](https://github.com/kevinzunigacuellar)! - Changes the data returned for `page.url.current`, `page.url.next`, `page.url.prev`, `page.url.first` and `page.url.last` to include the value set for `base` in your Astro config.

  Previously, you had to manually prepend your configured value for `base` to the URL path. Now, Astro automatically includes your `base` value in `next` and `prev` URLs.

  If you are using the `paginate()` function for "previous" and "next" URLs, remove any existing `base` value as it is now added for you:

  ```diff
  ---
  export async function getStaticPaths({ paginate }) {
    const astronautPages = [{
      astronaut: 'Neil Armstrong',
    }, {
      astronaut: 'Buzz Aldrin',
    }, {
      astronaut: 'Sally Ride',
    }, {
      astronaut: 'John Glenn',
    }];
    return paginate(astronautPages, { pageSize: 1 });
  }
  const { page } = Astro.props;
  // `base: /'docs'` configured in `astro.config.mjs`
  - const prev = "/docs" + page.url.prev;
  + const prev = page.url.prev;
  ---
  <a id="prev" href={prev}>Back</a>
  ```

### Minor Changes

- [#11698](https://github.com/withastro/astro/pull/11698) [`05139ef`](https://github.com/withastro/astro/commit/05139ef8b46de96539cc1d08148489eaf3cfd837) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new property to the globals `Astro` and `APIContext` called `routePattern`. The `routePattern` represents the current route (component)
  that is being rendered by Astro. It's usually a path pattern will look like this: `blog/[slug]`:

  ```asto
  ---
  // src/pages/blog/[slug].astro
  const route = Astro.routePattern;
  console.log(route); // it will log "blog/[slug]"
  ---
  ```

  ```js
  // src/pages/index.js

  export const GET = (ctx) => {
    console.log(ctx.routePattern); // it will log src/pages/index.js
    return new Response.json({ loreum: 'ipsum' });
  };
  ```

### Patch Changes

- [#11791](https://github.com/withastro/astro/pull/11791) [`9393243`](https://github.com/withastro/astro/commit/93932432e7239a1d31c68ea916945302286268e9) Thanks [@bluwy](https://github.com/bluwy)! - Updates Astro's default `<script>` rendering strategy and removes the `experimental.directRenderScript` option as this is now the default behavior: scripts are always rendered directly. This new strategy prevents scripts from being executed in pages where they are not used.

  Scripts will directly render as declared in Astro files (including existing features like TypeScript, importing `node_modules`, and deduplicating scripts). You can also now conditionally render scripts in your Astro file.

  However, this means scripts are no longer hoisted to the `<head>`, multiple scripts on a page are no longer bundled together, and the `<script>` tag may interfere with the CSS styling.

  As this is a potentially breaking change to your script behavior, please review your `<script>` tags and ensure that they behave as expected.

## 5.0.0-alpha.1

### Major Changes

- [#11798](https://github.com/withastro/astro/pull/11798) [`e9e2139`](https://github.com/withastro/astro/commit/e9e2139bf788893566f5a3fe58daf1d24076f018) Thanks [@matthewp](https://github.com/matthewp)! - Unflag globalRoutePriority

  The previously [experimental feature `globalRoutePriority`](https://docs.astro.build/en/reference/configuration-reference/#experimentalglobalroutepriority) is now the default in Astro 5.

  This was a refactoring of route prioritization in Astro, making it so that injected routes, file-based routes, and redirects are all prioritized using the same logic. This feature has been enabled for all Starlight projects since it was added and should not affect most users.

- [#11679](https://github.com/withastro/astro/pull/11679) [`ea71b90`](https://github.com/withastro/astro/commit/ea71b90c9c08ddd1d3397c78e2e273fb799f7dbd) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - The [`astro:env` feature introduced behind a flag](https://docs.astro.build/en/reference/configuration-reference/#experimentalglobalroutepriority) in [v4.10.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#x4100) is no longer experimental and is available for general use. If you have been waiting for stabilization before using `astro:env`, you can now do so.

  This feature lets you configure a type-safe schema for your environment variables, and indicate whether they should be available on the server or the client.

  To configure a schema, add the `env` option to your Astro config and define your client and server variables. If you were previously using this feature, please remove the experimental flag from your Astro config and move your entire `env` configuration unchanged to a top-level option.

  ```js
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    env: {
      schema: {
        API_URL: envField.string({ context: 'client', access: 'public', optional: true }),
        PORT: envField.number({ context: 'server', access: 'public', default: 4321 }),
        API_SECRET: envField.string({ context: 'server', access: 'secret' }),
      },
    },
  });
  ```

  You can import and use your defined variables from the appropriate `/client` or `/server` module:

  ```astro
  ---
  import { API_URL } from 'astro:env/client';
  import { API_SECRET_TOKEN } from 'astro:env/server';

  const data = await fetch(`${API_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_SECRET_TOKEN}`,
    },
  });
  ---

  <script>
    import { API_URL } from 'astro:env/client';

    fetch(`${API_URL}/ping`);
  </script>
  ```

- [#11788](https://github.com/withastro/astro/pull/11788) [`7c0ccfc`](https://github.com/withastro/astro/commit/7c0ccfc26947b178584e3476584bcaa490c6ba86) Thanks [@ematipico](https://github.com/ematipico)! - Updates the default value of `security.checkOrigin` to `true`, which enables Cross-Site Request Forgery (CSRF) protection by default for pages rendered on demand.

  If you had previously configured `security.checkOrigin: true`, you no longer need this set in your Astro config. This is now the default and it is safe to remove.

  To disable this behavior and opt out of automatically checking that the “origin” header matches the URL sent by each request, you must explicitly set `security.checkOrigin: false`:

  ```diff
  export default defineConfig({
  +  security: {
  +    checkOrigin: false
  +  }
  })
  ```

- [#11741](https://github.com/withastro/astro/pull/11741) [`6617491`](https://github.com/withastro/astro/commit/6617491c3bc2bde87f7867d7dec2580781852cfc) Thanks [@bluwy](https://github.com/bluwy)! - Removes internal JSX handling and moves the responsibility to the `@astrojs/mdx` package directly. The following exports are also now removed:

  - `astro/jsx/babel.js`
  - `astro/jsx/component.js`
  - `astro/jsx/index.js`
  - `astro/jsx/renderer.js`
  - `astro/jsx/server.js`
  - `astro/jsx/transform-options.js`

  If your project includes `.mdx` files, you must upgrade `@astrojs/mdx` to the latest version so that it doesn't rely on these entrypoints to handle your JSX.

- [#11782](https://github.com/withastro/astro/pull/11782) [`9a2aaa0`](https://github.com/withastro/astro/commit/9a2aaa01ea427df3844bce8595207809a8d2cb94) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Makes the `compiledContent` property of Markdown content an async function, this change should fix underlying issues where sometimes when using a custom image service and images inside Markdown, Node would exit suddenly without any error message.

  ```diff
  ---
  import * as myPost from "../post.md";

  - const content = myPost.compiledContent();
  + const content = await myPost.compiledContent();
  ---

  <Fragment set:html={content} />
  ```

- [#11770](https://github.com/withastro/astro/pull/11770) [`cfa6a47`](https://github.com/withastro/astro/commit/cfa6a47ac7a541f99fdad46a68d0cca6e5816cd5) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Removed support for the Squoosh image service. As the underlying library `libsquoosh` is no longer maintained, and the image service sees very little usage we have decided to remove it from Astro.

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

## 5.0.0-alpha.0

### Major Changes

- [#10742](https://github.com/withastro/astro/pull/10742) [`b6fbdaa`](https://github.com/withastro/astro/commit/b6fbdaa94a9ecec706a99e1938fbf5cd028c72e0) Thanks [@ematipico](https://github.com/ematipico)! - The lowest version of Node supported by Astro is now Node v18.17.1 and higher.

- [#11715](https://github.com/withastro/astro/pull/11715) [`d74617c`](https://github.com/withastro/astro/commit/d74617cbd3278feba05909ec83db2d73d57a153e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Refactor the exported types from the `astro` module. There should normally be no breaking changes, but if you relied on some previously deprecated types, these might now have been fully removed.

  In most cases, updating your code to move away from previously deprecated APIs in previous versions of Astro should be enough to fix any issues.

- [#11660](https://github.com/withastro/astro/pull/11660) [`e90f559`](https://github.com/withastro/astro/commit/e90f5593d23043579611452a84b9e18ad2407ef9) Thanks [@bluwy](https://github.com/bluwy)! - Fixes attribute rendering for non-[boolean HTML attributes](https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML) with boolean values to match proper attribute handling in browsers.

  Previously, non-boolean attributes may not have included their values when rendered to HTML. In Astro v5.0, the values are now explicitly rendered as `="true"` or `="false"`

  In the following `.astro` examples, only `allowfullscreen` is a boolean attribute:

  ```astro
  <!-- src/pages/index.astro --><!-- `allowfullscreen` is a boolean attribute -->
  <p allowfullscreen={true}></p>
  <p allowfullscreen={false}></p>

  <!-- `inherit` is *not* a boolean attribute -->
  <p inherit={true}></p>
  <p inherit={false}></p>

  <!-- `data-*` attributes are not boolean attributes -->
  <p data-light={true}></p>
  <p data-light={false}></p>
  ```

  Astro v5.0 now preserves the full data attribute with its value when rendering the HTML of non-boolean attributes:

  ```diff
    <p allowfullscreen></p>
    <p></p>

    <p inherit="true"></p>
  - <p inherit></p>
  + <p inherit="false"></p>

  - <p data-light></p>
  + <p data-light="true"></p>
  - <p></p>
  + <p data-light="false"></p>
  ```

  If you rely on attribute values, for example to locate elements or to conditionally render, update your code to match the new non-boolean attribute values:

  ```diff
  - el.getAttribute('inherit') === ''
  + el.getAttribute('inherit') === 'false'

  - el.hasAttribute('data-light')
  + el.dataset.light === 'true'
  ```

- [#11714](https://github.com/withastro/astro/pull/11714) [`8a53517`](https://github.com/withastro/astro/commit/8a5351737d6a14fc55f1dafad8f3b04079e81af6) Thanks [@matthewp](https://github.com/matthewp)! - Remove support for functionPerRoute

  This change removes support for the `functionPerRoute` option both in Astro and `@astrojs/vercel`.

  This option made it so that each route got built as separate entrypoints so that they could be loaded as separate functions. The hope was that by doing this it would decrease the size of each function. However in practice routes use most of the same code, and increases in function size limitations made the potential upsides less important.

  Additionally there are downsides to functionPerRoute, such as hitting limits on the number of functions per project. The feature also never worked with some Astro features like i18n domains and request rewriting.

  Given this, the feature has been removed from Astro.

### Patch Changes

- [#11745](https://github.com/withastro/astro/pull/11745) [`89bab1e`](https://github.com/withastro/astro/commit/89bab1e70786123fbe933a9d7a1b80c9334dcc5f) Thanks [@bluwy](https://github.com/bluwy)! - Prints prerender dynamic value usage warning only if it's used

- [#11730](https://github.com/withastro/astro/pull/11730) [`2df49a6`](https://github.com/withastro/astro/commit/2df49a6fb4f6d92fe45f7429430abe63defeacd6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Simplifies path operations of `astro sync`

- Updated dependencies [[`83a2a64`](https://github.com/withastro/astro/commit/83a2a648418ad30f4eb781d1c1b5f2d8a8ac846e)]:
  - @astrojs/markdown-remark@6.0.0-alpha.0

## 4.16.16

### Patch Changes

- [#12542](https://github.com/withastro/astro/pull/12542) [`65e50eb`](https://github.com/withastro/astro/commit/65e50eb7b6d7b10a193bba7d292804ac0e55be18) Thanks [@kadykov](https://github.com/kadykov)! - Fix JPEG image size determination

- [#12525](https://github.com/withastro/astro/pull/12525) [`cf0d8b0`](https://github.com/withastro/astro/commit/cf0d8b08a0f16bba7310d1a92c82b5a276682e8c) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where with `i18n` enabled, Astro couldn't render the `404.astro` component for non-existent routes.

## 4.16.15

### Patch Changes

- [#12498](https://github.com/withastro/astro/pull/12498) [`b140a3f`](https://github.com/withastro/astro/commit/b140a3f6d821127f927b7cb938294549e41c5168) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where Astro was trying to access `Request.headers`

## 4.16.14

### Patch Changes

- [#12480](https://github.com/withastro/astro/pull/12480) [`c3b7e7c`](https://github.com/withastro/astro/commit/c3b7e7cfa13603c08eb923703f31a92d514e82db) Thanks [@matthewp](https://github.com/matthewp)! - Removes the default throw behavior in `astro:env`

- [#12444](https://github.com/withastro/astro/pull/12444) [`28dd3ce`](https://github.com/withastro/astro/commit/28dd3ce5222a667fe113238254edf59318b3fa14) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where a server island hydration script might fail case the island ID misses from the DOM.

- [#12476](https://github.com/withastro/astro/pull/12476) [`80a9a52`](https://github.com/withastro/astro/commit/80a9a5299a9d51f2b09900d3200976d687feae8f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where the Content Layer `glob()` loader would not update when renaming or deleting an entry

- [#12418](https://github.com/withastro/astro/pull/12418) [`25baa4e`](https://github.com/withastro/astro/commit/25baa4ed0c5f55fa85c2c7e2c15848937ed1dc9b) Thanks [@oliverlynch](https://github.com/oliverlynch)! - Fix cached image redownloading if it is the first asset

- [#12477](https://github.com/withastro/astro/pull/12477) [`46f6b38`](https://github.com/withastro/astro/commit/46f6b386b3db6332f286d79958ef10261958cceb) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the SSR build was emitting the `dist/server/entry.mjs` file with an incorrect import at the top of the file/

- [#12365](https://github.com/withastro/astro/pull/12365) [`a23985b`](https://github.com/withastro/astro/commit/a23985b02165c2ddce56d511b3f97b6815c452c9) Thanks [@apatel369](https://github.com/apatel369)! - Fixes an issue where `Astro.currentLocale` was not correctly returning the locale for 404 and 500 pages.

## 4.16.13

### Patch Changes

- [#12436](https://github.com/withastro/astro/pull/12436) [`453ec6b`](https://github.com/withastro/astro/commit/453ec6b12f8c021e0bd0fd0ea9f71c8fc280f4b1) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a potential null access in the clientside router

- [#12392](https://github.com/withastro/astro/pull/12392) [`0462219`](https://github.com/withastro/astro/commit/0462219612183b65867aaaef9fa538d89f201999) Thanks [@apatel369](https://github.com/apatel369)! - Fixes an issue where scripts were not correctly injected during the build. The issue was triggered when there were injected routes with the same `entrypoint` and different `pattern`

## 4.16.12

### Patch Changes

- [#12420](https://github.com/withastro/astro/pull/12420) [`acac0af`](https://github.com/withastro/astro/commit/acac0af53466f8a381ccdac29ed2ad735d7b4e79) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the dev server returns a 404 status code when a user middleware returns a valid `Response`.

## 4.16.11

### Patch Changes

- [#12305](https://github.com/withastro/astro/pull/12305) [`f5f7109`](https://github.com/withastro/astro/commit/f5f71094ec74961b4cca2ee451798abd830c617a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where the error overlay would not escape the message

- [#12402](https://github.com/withastro/astro/pull/12402) [`823e73b`](https://github.com/withastro/astro/commit/823e73b164eab4115af31b1de8e978f2b4e0a95d) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where Astro allowed to call an action without using `Astro.callAction`. This is now invalid, and Astro will show a proper error.

  ```diff
  ---
  import { actions } from "astro:actions";

  -const result = actions.getUser({ userId: 123 });
  +const result = Astro.callAction(actions.getUser, { userId: 123 });
  ---
  ```

- [#12401](https://github.com/withastro/astro/pull/12401) [`9cca108`](https://github.com/withastro/astro/commit/9cca10843912698e13d35f1bc3c493e2c96a06ee) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes unexpected 200 status in dev server logs for action errors and redirects.

## 4.16.10

### Patch Changes

- [#12311](https://github.com/withastro/astro/pull/12311) [`bf2723e`](https://github.com/withastro/astro/commit/bf2723e83140099914b29c6d51eb147a065be460) Thanks [@dinesh-58](https://github.com/dinesh-58)! - Adds `checked` to the list of boolean attributes.

- [#12363](https://github.com/withastro/astro/pull/12363) [`222f718`](https://github.com/withastro/astro/commit/222f71894cc7118319ce83b3b29fa61a9dbebb75) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes code generated by `astro add` command when adding a version of an integration other than the default `latest`.

- [#12368](https://github.com/withastro/astro/pull/12368) [`493fe43`](https://github.com/withastro/astro/commit/493fe43cd3ef94b087b8958031ecc964ae73463b) Thanks [@bluwy](https://github.com/bluwy)! - Improves error logs when executing commands

- [#12355](https://github.com/withastro/astro/pull/12355) [`c4726d7`](https://github.com/withastro/astro/commit/c4726d7ba8cc93157390ce64d5c8b718ed5cac29) Thanks [@apatel369](https://github.com/apatel369)! - Improves error reporting for invalid frontmatter in MDX files during the `astro build` command. The error message now includes the file path where the frontmatter parsing failed.

## 4.16.9

### Patch Changes

- [#12333](https://github.com/withastro/astro/pull/12333) [`836cd91`](https://github.com/withastro/astro/commit/836cd91c37cea8ae58dd04a326435fcb2c88f358) Thanks [@imattacus](https://github.com/imattacus)! - Destroy the server response stream if async error is thrown

- [#12358](https://github.com/withastro/astro/pull/12358) [`7680349`](https://github.com/withastro/astro/commit/76803498738f9e86e7948ce81e01e63607e03549) Thanks [@spacedawwwg](https://github.com/spacedawwwg)! - Honors `inlineAstroConfig` parameter in `getViteConfig` when creating a logger

- [#12353](https://github.com/withastro/astro/pull/12353) [`35795a1`](https://github.com/withastro/astro/commit/35795a1a54b2bfaf331c58ca91b47e5672e08c4e) Thanks [@hippotastic](https://github.com/hippotastic)! - Fixes an issue in dev server watch file handling that could cause multiple restarts for a single file change.

- [#12351](https://github.com/withastro/astro/pull/12351) [`5751488`](https://github.com/withastro/astro/commit/57514881655b62a0bc39ace1e1ed4b89b96f74ca) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Reverts a change made in `4.16.6` that prevented usage of `astro:env` secrets inside middleware in SSR

- [#12346](https://github.com/withastro/astro/pull/12346) [`20e5a84`](https://github.com/withastro/astro/commit/20e5a843c86e9328814615edf3e8a6fb5e4696cc) Thanks [@bluwy](https://github.com/bluwy)! - Fixes sourcemap generation when prefetch is enabled

- [#12349](https://github.com/withastro/astro/pull/12349) [`1fc83d3`](https://github.com/withastro/astro/commit/1fc83d3ba8315c31b2a3aadc77b20b1615d261a0) Thanks [@norskeld](https://github.com/norskeld)! - Fixes the `getImage` options type so it properly extends `ImageTransform`

## 4.16.8

### Patch Changes

- [#12338](https://github.com/withastro/astro/pull/12338) [`9ca89b3`](https://github.com/withastro/astro/commit/9ca89b3e13d47e146989cfabb916d6599d140f03) Thanks [@situ2001](https://github.com/situ2001)! - Resets `NODE_ENV` to ensure install command run in dev mode

- [#12286](https://github.com/withastro/astro/pull/12286) [`9d6bcdb`](https://github.com/withastro/astro/commit/9d6bcdb88fcb9df0c5c70e2b591bcf962ce55f63) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where a warning for experimental `astro:env` support would be shown when using an adapter but not actually using `astro:env`

- [#12342](https://github.com/withastro/astro/pull/12342) [`ffc836b`](https://github.com/withastro/astro/commit/ffc836bac0cdea684ea91f958ac8298d4ee4b07d) Thanks [@liruifengv](https://github.com/liruifengv)! - Fixes a typo in the command name of the CLI

- [#12301](https://github.com/withastro/astro/pull/12301) [`0cfc69d`](https://github.com/withastro/astro/commit/0cfc69d499815d4e1f1dc37cf32653195586087a) Thanks [@apatel369](https://github.com/apatel369)! - Fixes an issue with action handler context by passing the correct context (`ActionAPIContext`).

- [#12312](https://github.com/withastro/astro/pull/12312) [`5642ef9`](https://github.com/withastro/astro/commit/5642ef9029890fc29793c160321f78f62cdaafcb) Thanks [@koyopro](https://github.com/koyopro)! - Fixes an issue where using `getViteConfig()` returns incorrect and duplicate configuration

- [#12245](https://github.com/withastro/astro/pull/12245) [`1d4f6a4`](https://github.com/withastro/astro/commit/1d4f6a4989bc1cfd7109b1bff41503f115660e02) Thanks [@bmenant](https://github.com/bmenant)! - Add `components` property to MDXInstance type definition (RenderResult and module import)

- [#12340](https://github.com/withastro/astro/pull/12340) [`94eaeea`](https://github.com/withastro/astro/commit/94eaeea1c437402ffc44103126b355adab4b8a01) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro actions didn't work when `base` was different from `/`

## 4.16.7

### Patch Changes

- [#12263](https://github.com/withastro/astro/pull/12263) [`e9e8080`](https://github.com/withastro/astro/commit/e9e8080a8139f898dcfa3c030f5ddaa98413c160) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes conflict between server islands and on-demand dynamic routes in the form of `/[...rest]` or `/[paramA]/[paramB]`.

- [#12279](https://github.com/withastro/astro/pull/12279) [`b781f88`](https://github.com/withastro/astro/commit/b781f8860c7d11e51fb60a0d6528bc88913ffc35) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Update wrong error message

- [#12273](https://github.com/withastro/astro/pull/12273) [`c2ee963`](https://github.com/withastro/astro/commit/c2ee963cb6c0a65481be505848a7272d800f2f7b) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue with some package managers where sites would not build if TypeScript was not installed.

- [#12235](https://github.com/withastro/astro/pull/12235) [`a75bc5e`](https://github.com/withastro/astro/commit/a75bc5e3068ed80366a03efbec78b3b0f8837516) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where Astro Actions couldn't redirect to the correct pathname when there was a rewrite involved.

- [#11839](https://github.com/withastro/astro/pull/11839) [`ff522b9`](https://github.com/withastro/astro/commit/ff522b96a01391a29b44f820dfcc2a2176d871e7) Thanks [@icaliman](https://github.com/icaliman)! - Fixes error when returning a top-level `null` from an Astro file frontmatter

- [#12272](https://github.com/withastro/astro/pull/12272) [`388d237`](https://github.com/withastro/astro/commit/388d2375b6900e6401e1c711087ee0b2176418dd) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly handles local images when using a base path in SSR

## 4.16.6

### Patch Changes

- [#11823](https://github.com/withastro/astro/pull/11823) [`a3d30a6`](https://github.com/withastro/astro/commit/a3d30a602aaa1755197c73f0b51cace61f9088b3) Thanks [@DerTimonius](https://github.com/DerTimonius)! - fix: improve error message when inferSize is used in local images with the Image component

- [#12227](https://github.com/withastro/astro/pull/12227) [`8b1a641`](https://github.com/withastro/astro/commit/8b1a641be9de4baa9ae48dd0d045915fbbeffa8c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where environment variables would not be refreshed when using `astro:env`

- [#12239](https://github.com/withastro/astro/pull/12239) [`2b6daa5`](https://github.com/withastro/astro/commit/2b6daa5840c18729c41f6cd8b4571b88d0cba119) Thanks [@ematipico](https://github.com/ematipico)! - **BREAKING CHANGE to the experimental Container API only**

  Changes the default page rendering behavior of Astro components in containers, and adds a new option `partial: false` to render full Astro pages as before.

  Previously, the Container API was rendering all Astro components as if they were full Astro pages containing `<!DOCTYPE html>` by default. This was not intended, and now by default, all components will render as [page partials](https://docs.astro.build/en/basics/astro-pages/#page-partials): only the contents of the components without a page shell.

  To render the component as a full-fledged Astro page, pass a new option called `partial: false` to `renderToString()` and `renderToResponse()`:

  ```js
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import Card from '../src/components/Card.astro';

  const container = AstroContainer.create();

  await container.renderToString(Card); // the string will not contain `<!DOCTYPE html>`
  await container.renderToString(Card, { partial: false }); // the string will contain `<!DOCTYPE html>`
  ```

## 4.16.5

### Patch Changes

- [#12232](https://github.com/withastro/astro/pull/12232) [`ff68ba5`](https://github.com/withastro/astro/commit/ff68ba5e1ca00f06d1afd5fbf89acea3092bb660) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue with cssesc in dev mode when setting `vite.ssr.noExternal: true`

## 4.16.4

### Patch Changes

- [#12223](https://github.com/withastro/astro/pull/12223) [`79ffa5d`](https://github.com/withastro/astro/commit/79ffa5d9f75c16465134aa4ed4a3d1d59908ba8b) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes a false positive reported by the dev toolbar Audit app where a label was considered missing when associated with a button

  The `button` element can be [used with a label](https://www.w3.org/TR/2011/WD-html5-author-20110809/forms.html#category-label) (e.g. to create a switch) and should not be reported as an accessibility issue when used as a child of a `label`.

- [#12199](https://github.com/withastro/astro/pull/12199) [`c351352`](https://github.com/withastro/astro/commit/c3513523608f319b43c050e391be08e68b801329) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression in the computation of `Astro.currentLocale`

- [#12222](https://github.com/withastro/astro/pull/12222) [`fb55695`](https://github.com/withastro/astro/commit/fb5569583b11ef585cd0a79e97e7e9dc653f6afa) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the edge middleware couldn't correctly compute the client IP address when calling `ctx.clientAddress()`

## 4.16.3

### Patch Changes

- [#12220](https://github.com/withastro/astro/pull/12220) [`b049359`](https://github.com/withastro/astro/commit/b0493596dc338377198d0a39efc813dad515b624) Thanks [@bluwy](https://github.com/bluwy)! - Fixes accidental internal `setOnSetGetEnv` parameter rename that caused runtime errors

- [#12197](https://github.com/withastro/astro/pull/12197) [`2aa2dfd`](https://github.com/withastro/astro/commit/2aa2dfd05dc7b7e6ad13451e6cc2afa9b1c92a32) Thanks [@ematipico](https://github.com/ematipico)! - Fix a regression where a port was incorrectly added to the `Astro.url`

## 4.16.2

### Patch Changes

- [#12206](https://github.com/withastro/astro/pull/12206) [`12b0022`](https://github.com/withastro/astro/commit/12b00225067445629e5ae451d763d03f70065f88) Thanks [@bluwy](https://github.com/bluwy)! - Reverts https://github.com/withastro/astro/pull/12173 which caused `Can't modify immutable headers` warnings and 500 errors on Cloudflare Pages

## 4.16.1

### Patch Changes

- [#12177](https://github.com/withastro/astro/pull/12177) [`a4ffbfa`](https://github.com/withastro/astro/commit/a4ffbfaa5cb460c12bd486fd75e36147f51d3e5e) Thanks [@matthewp](https://github.com/matthewp)! - Ensure we target scripts for execution in the router

  Using `document.scripts` is unsafe because if the application has a `name="scripts"` this will shadow the built-in `document.scripts`. Fix is to use `getElementsByTagName` to ensure we're only grabbing real scripts.

- [#12173](https://github.com/withastro/astro/pull/12173) [`2d10de5`](https://github.com/withastro/astro/commit/2d10de5f212323e6e19c7ea379826dcc18fe739c) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where Astro Actions couldn't redirect to the correct pathname when there was a rewrite involved.

## 4.16.0

### Minor Changes

- [#12039](https://github.com/withastro/astro/pull/12039) [`710a1a1`](https://github.com/withastro/astro/commit/710a1a11f488ff6ed3da6d3e0723b2322ccfe27b) Thanks [@ematipico](https://github.com/ematipico)! - Adds a `markdown.shikiConfig.langAlias` option that allows [aliasing a non-supported code language to a known language](https://shiki.style/guide/load-lang#custom-language-aliases). This is useful when the language of your code samples is not [a built-in Shiki language](https://shiki.style/languages), but you want your Markdown source to contain an accurate language while also displaying syntax highlighting.

  The following example configures Shiki to highlight `cjs` code blocks using the `javascript` syntax highlighter:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    markdown: {
      shikiConfig: {
        langAlias: {
          cjs: 'javascript',
        },
      },
    },
  });
  ```

  Then in your Markdown, you can use the alias as the language for a code block for syntax highlighting:

  ````md
  ```cjs
  'use strict';

  function commonJs() {
    return 'I am a commonjs file';
  }
  ```
  ````

- [#11984](https://github.com/withastro/astro/pull/11984) [`3ac2263`](https://github.com/withastro/astro/commit/3ac2263ff6070136bec9cffb863c38bcc31ccdfe) Thanks [@chaegumi](https://github.com/chaegumi)! - Adds a new `build.concurrency` configuration option to specify the number of pages to build in parallel

  **In most cases, you should not change the default value of `1`.**

  Use this option only when other attempts to reduce the overall rendering time (e.g. batch or cache long running tasks like fetch calls or data access) are not possible or are insufficient.

  Use this option only if the refactors are not possible. If the number is set too high, the page rendering may slow down due to insufficient memory resources and because JS is single-threaded.

  > [!WARNING]
  > This feature is stable and is not considered experimental. However, this feature is only intended to address difficult performance issues, and breaking changes may occur in a [minor release](https://docs.astro.build/en/upgrade-astro/#semantic-versioning) to keep this option as performant as possible.

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro';

  export default defineConfig({
    build: {
      concurrency: 2,
    },
  });
  ```

### Patch Changes

- [#12160](https://github.com/withastro/astro/pull/12160) [`c6fd1df`](https://github.com/withastro/astro/commit/c6fd1df695d0f2a24bb49e6954064f92664ccf67) Thanks [@louisescher](https://github.com/louisescher)! - Fixes a bug where `astro.config.mts` and `astro.config.cts` weren't reloading the dev server upon modifications.

- [#12130](https://github.com/withastro/astro/pull/12130) [`e96bcae`](https://github.com/withastro/astro/commit/e96bcae535ef2f0661f539c1d49690c531df2d4e) Thanks [@thehansys](https://github.com/thehansys)! - Fixes a bug in the parsing of `x-forwarded-\*` `Request` headers, where multiple values assigned to those headers were not correctly parsed.

  Now, headers like `x-forwarded-proto: https,http` are correctly parsed.

- [#12147](https://github.com/withastro/astro/pull/12147) [`9db755a`](https://github.com/withastro/astro/commit/9db755ab7cfe658ec426387e297bdcd32c4bc8de) Thanks [@ascorbic](https://github.com/ascorbic)! - Skips setting statusMessage header for HTTP/2 response

  HTTP/2 doesn't support status message, so setting this was logging a warning.

- [#12151](https://github.com/withastro/astro/pull/12151) [`bb6d37f`](https://github.com/withastro/astro/commit/bb6d37f94a283433994f9243189cb4386df0e11a) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where `Astro.currentLocale` wasn't incorrectly computed when the `defaultLocale` belonged to a custom locale path.

- Updated dependencies [[`710a1a1`](https://github.com/withastro/astro/commit/710a1a11f488ff6ed3da6d3e0723b2322ccfe27b)]:
  - @astrojs/markdown-remark@5.3.0

## 4.15.12

### Patch Changes

- [#12121](https://github.com/withastro/astro/pull/12121) [`2490ceb`](https://github.com/withastro/astro/commit/2490cebdb93f13ee552cffa72b2e274d64e6b4a7) Thanks [@ascorbic](https://github.com/ascorbic)! - Support passing the values `Infinity` and `-Infinity` as island props.

- [#12118](https://github.com/withastro/astro/pull/12118) [`f47b347`](https://github.com/withastro/astro/commit/f47b347da899c6e1dcd0b2e7887f7fce6ec8e270) Thanks [@Namchee](https://github.com/Namchee)! - Removes the `strip-ansi` dependency in favor of the native Node API

- [#12126](https://github.com/withastro/astro/pull/12126) [`6e1dfeb`](https://github.com/withastro/astro/commit/6e1dfeb76bec09d24928bab798c6ad3280f42e84) Thanks [@ascorbic](https://github.com/ascorbic)! - Clear content layer cache when astro version changes

- [#12117](https://github.com/withastro/astro/pull/12117) [`a46839a`](https://github.com/withastro/astro/commit/a46839a5c818b7de63c36d0c7e27f1a8f3b773dc) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Updates Vite links to use their new domain

- [#12124](https://github.com/withastro/astro/pull/12124) [`499fbc9`](https://github.com/withastro/astro/commit/499fbc91a6bdad8c86ff13a8caf1fa09433796b9) Thanks [@ascorbic](https://github.com/ascorbic)! - Allows special characters in Action names

- [#12123](https://github.com/withastro/astro/pull/12123) [`b8673df`](https://github.com/withastro/astro/commit/b8673df51c6cc4ce6a288f8eb609b7a438a07d82) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes missing `body` property on CollectionEntry types for content layer entries

- [#12132](https://github.com/withastro/astro/pull/12132) [`de35daa`](https://github.com/withastro/astro/commit/de35daa8517555c1b9c72bc7fe9cc955c4997a83) Thanks [@jcayzac](https://github.com/jcayzac)! - Updates the [`cookie`](https://npmjs.com/package/cookie) dependency to avoid the [CVE 2024-47764](https://nvd.nist.gov/vuln/detail/CVE-2024-47764) vulnerability.

- [#12113](https://github.com/withastro/astro/pull/12113) [`a54e520`](https://github.com/withastro/astro/commit/a54e520d3c139fa123e7029c5933951b5c7f5a39) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a helpful error when attempting to render an undefined collection entry

## 4.15.11

### Patch Changes

- [#12097](https://github.com/withastro/astro/pull/12097) [`11d447f`](https://github.com/withastro/astro/commit/11d447f66b1a0f39489c2600139ebfb565336ce7) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes error where references in content layer schemas sometimes incorrectly report as missing

- [#12108](https://github.com/withastro/astro/pull/12108) [`918953b`](https://github.com/withastro/astro/commit/918953bd09f057131dfe029e810019c0909345cf) Thanks [@lameuler](https://github.com/lameuler)! - Fixes a bug where [data URL images](https://developer.mozilla.org/en-US/docs/Web/URI/Schemes/data) were not correctly handled. The bug resulted in an `ENAMETOOLONG` error.

- [#12105](https://github.com/withastro/astro/pull/12105) [`42037f3`](https://github.com/withastro/astro/commit/42037f33e644d5a2bfba71377697fc7336ecb15b) Thanks [@ascorbic](https://github.com/ascorbic)! - Returns custom statusText that has been set in a Response

- [#12109](https://github.com/withastro/astro/pull/12109) [`ea22558`](https://github.com/withastro/astro/commit/ea225585fd12d27006434266163512ca66ad572b) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression that was introduced by an internal refactor of how the middleware is loaded by the Astro application. The regression was introduced by [#11550](https://github.com/withastro/astro/pull/11550).

  When the edge middleware feature is opted in, Astro removes the middleware function from the SSR manifest, and this wasn't taken into account during the refactor.

- [#12106](https://github.com/withastro/astro/pull/12106) [`d3a74da`](https://github.com/withastro/astro/commit/d3a74da19644477ffc81acf2a3efb26ad3335a5e) Thanks [@ascorbic](https://github.com/ascorbic)! - Handles case where an immutable Response object is returned from an endpoint

- [#12090](https://github.com/withastro/astro/pull/12090) [`d49a537`](https://github.com/withastro/astro/commit/d49a537f2aaccd132154a15f1da4db471272ee90) Thanks [@markjaquith](https://github.com/markjaquith)! - Server islands: changes the server island HTML placeholder comment so that it is much less likely to get removed by HTML minifiers.

## 4.15.10

### Patch Changes

- [#12084](https://github.com/withastro/astro/pull/12084) [`12dae50`](https://github.com/withastro/astro/commit/12dae50c776474748a80cb65c8bf1c67f0825cb0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds missing filePath property on content layer entries

- [#12046](https://github.com/withastro/astro/pull/12046) [`d7779df`](https://github.com/withastro/astro/commit/d7779dfae7bc00ff94b1e4596ff5b4897f65aabe) Thanks [@martrapp](https://github.com/martrapp)! - View transitions: Fixes Astro's fade animation to prevent flashing during morph transitions.

- [#12043](https://github.com/withastro/astro/pull/12043) [`1720c5b`](https://github.com/withastro/astro/commit/1720c5b1d2bfd106ad065833823aed622bee09bc) Thanks [@bluwy](https://github.com/bluwy)! - Fixes injected endpoint `prerender` option detection

- [#12095](https://github.com/withastro/astro/pull/12095) [`76c5fbd`](https://github.com/withastro/astro/commit/76c5fbd6f3a8d41367f1d7033278d133d518213b) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fix installing non-stable versions of integrations with `astro add`

## 4.15.9

### Patch Changes

- [#12034](https://github.com/withastro/astro/pull/12034) [`5b3ddfa`](https://github.com/withastro/astro/commit/5b3ddfadcb2d09b6cbd9cd42641f30ca565d0f58) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the middleware wasn't called when a project uses `404.astro`.

- [#12042](https://github.com/withastro/astro/pull/12042) [`243ecb6`](https://github.com/withastro/astro/commit/243ecb6d6146dc483b4726d0e76142fb25e56243) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a problem in the Container API, where a polyfill wasn't correctly applied. This caused an issue in some environments where `crypto` isn't supported.

- [#12038](https://github.com/withastro/astro/pull/12038) [`26ea5e8`](https://github.com/withastro/astro/commit/26ea5e814ab8c973e683fff62389fda28c180940) Thanks [@ascorbic](https://github.com/ascorbic)! - Resolves image paths in content layer with initial slash as project-relative

  When using the `image()` schema helper, previously paths with an initial slash were treated as public URLs. This was to match the behavior of markdown images. However this is a change from before, where paths with an initial slash were treated as project-relative. This change restores the previous behavior, so that paths with an initial slash are treated as project-relative.

## 4.15.8

### Patch Changes

- [#12014](https://github.com/withastro/astro/pull/12014) [`53cb41e`](https://github.com/withastro/astro/commit/53cb41e30ea5768bf33d9f6be608fb57d31b7b9e) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue where component styles were not correctly included in rendered MDX

- [#12031](https://github.com/withastro/astro/pull/12031) [`8c0cae6`](https://github.com/withastro/astro/commit/8c0cae6d1bd70b332286d83d0f01cfce5272fbbe) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the rewrite via `next(/*..*/)` inside a middleware didn't compute the new `APIContext.params`

- [#12026](https://github.com/withastro/astro/pull/12026) [`40e7a1b`](https://github.com/withastro/astro/commit/40e7a1b05d9e5ea3fcda176c9663bbcff86edb63) Thanks [@bluwy](https://github.com/bluwy)! - Initializes the Markdown processor only when there's `.md` files

- [#12028](https://github.com/withastro/astro/pull/12028) [`d3bd673`](https://github.com/withastro/astro/commit/d3bd673392e63720e241d6a002a131a3564c169c) Thanks [@bluwy](https://github.com/bluwy)! - Handles route collision detection only if it matches `getStaticPaths`

- [#12027](https://github.com/withastro/astro/pull/12027) [`dd3b753`](https://github.com/withastro/astro/commit/dd3b753aba6400558671d85214e27b8e4fb1654b) Thanks [@fviolette](https://github.com/fviolette)! - Add `selected` to the list of boolean attributes

- [#12001](https://github.com/withastro/astro/pull/12001) [`9be3e1b`](https://github.com/withastro/astro/commit/9be3e1bba789af96d8b21d9c8eca8542cfb4ff77) Thanks [@uwej711](https://github.com/uwej711)! - Remove dependency on path-to-regexp

## 4.15.7

### Patch Changes

- [#12000](https://github.com/withastro/astro/pull/12000) [`a2f8c5d`](https://github.com/withastro/astro/commit/a2f8c5d85ff15803f5cedf9148cd70ffc138ddef) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes an outdated link used to document Content Layer API

- [#11915](https://github.com/withastro/astro/pull/11915) [`0b59fe7`](https://github.com/withastro/astro/commit/0b59fe74d5922c572007572ddca8d11482e2fb5c) Thanks [@azhirov](https://github.com/azhirov)! - Fix: prevent island from re-rendering when using transition:persist (#11854)

## 4.15.6

### Patch Changes

- [#11993](https://github.com/withastro/astro/pull/11993) [`ffba5d7`](https://github.com/withastro/astro/commit/ffba5d716edcdfc42899afaa4188b7a4cd0c91eb) Thanks [@matthewp](https://github.com/matthewp)! - Fix getStaticPaths regression

  This reverts a previous change meant to remove a dependency, to fix a regression with multiple nested spread routes.

- [#11964](https://github.com/withastro/astro/pull/11964) [`06eff60`](https://github.com/withastro/astro/commit/06eff60cabb55d91fe4075421b1693b1ab33225c) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Add wayland (wl-copy) support to `astro info`

## 4.15.5

### Patch Changes

- [#11939](https://github.com/withastro/astro/pull/11939) [`7b09c62`](https://github.com/withastro/astro/commit/7b09c62b565cd7b50c35fb68d390729f936a43fb) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds support for Zod discriminated unions on Action form inputs. This allows forms with different inputs to be submitted to the same action, using a given input to decide which object should be used for validation.

  This example accepts either a `create` or `update` form submission, and uses the `type` field to determine which object to validate against.

  ```ts
  import { defineAction } from 'astro:actions';
  import { z } from 'astro:schema';

  export const server = {
    changeUser: defineAction({
      accept: 'form',
      input: z.discriminatedUnion('type', [
        z.object({
          type: z.literal('create'),
          name: z.string(),
          email: z.string().email(),
        }),
        z.object({
          type: z.literal('update'),
          id: z.number(),
          name: z.string(),
          email: z.string().email(),
        }),
      ]),
      async handler(input) {
        if (input.type === 'create') {
          // input is { type: 'create', name: string, email: string }
        } else {
          // input is { type: 'update', id: number, name: string, email: string }
        }
      },
    }),
  };
  ```

  The corresponding `create` and `update` forms may look like this:

  ```astro
  ---
  import { actions } from 'astro:actions';
  ---

  <!--Create-->
  <form action={actions.changeUser} method="POST">
    <input type="hidden" name="type" value="create" />
    <input type="text" name="name" required />
    <input type="email" name="email" required />
    <button type="submit">Create User</button>
  </form>

  <!--Update-->
  <form action={actions.changeUser} method="POST">
    <input type="hidden" name="type" value="update" />
    <input type="hidden" name="id" value="user-123" />
    <input type="text" name="name" required />
    <input type="email" name="email" required />
    <button type="submit">Update User</button>
  </form>
  ```

- [#11968](https://github.com/withastro/astro/pull/11968) [`86ad1fd`](https://github.com/withastro/astro/commit/86ad1fd223e2d2c448372caa159090efbee69237) Thanks [@NikolaRHristov](https://github.com/NikolaRHristov)! - Fixes a typo in the server island JSDoc

- [#11983](https://github.com/withastro/astro/pull/11983) [`633eeaa`](https://github.com/withastro/astro/commit/633eeaa9d8a8a35bba638fde06fd8f52cc1c2ce3) Thanks [@uwej711](https://github.com/uwej711)! - Remove dependency on path-to-regexp

## 4.15.4

### Patch Changes

- [#11879](https://github.com/withastro/astro/pull/11879) [`bd1d4aa`](https://github.com/withastro/astro/commit/bd1d4aaf8262187b4f132d7fe0365902131ddf1a) Thanks [@matthewp](https://github.com/matthewp)! - Allow passing a cryptography key via ASTRO_KEY

  For Server islands Astro creates a cryptography key in order to hash props for the islands, preventing accidental leakage of secrets.

  If you deploy to an environment with rolling updates then there could be multiple instances of your app with different keys, causing potential key mismatches.

  To fix this you can now pass the `ASTRO_KEY` environment variable to your build in order to reuse the same key.

  To generate a key use:

  ```
  astro create-key
  ```

  This will print out an environment variable to set like:

  ```
  ASTRO_KEY=PIAuyPNn2aKU/bviapEuc/nVzdzZPizKNo3OqF/5PmQ=
  ```

- [#11935](https://github.com/withastro/astro/pull/11935) [`c58193a`](https://github.com/withastro/astro/commit/c58193a691775af5c568e461c63040a42e2471f7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `astro add` not using the proper export point when adding certain adapters

## 4.15.3

### Patch Changes

- [#11902](https://github.com/withastro/astro/pull/11902) [`d63bc50`](https://github.com/withastro/astro/commit/d63bc50d9940c1107e0fee7687e5c332549a0eff) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes case where content layer did not update during clean dev builds on Linux and Windows

- [#11886](https://github.com/withastro/astro/pull/11886) [`7ff7134`](https://github.com/withastro/astro/commit/7ff7134b8038a3b798293b2218bbf6dd02d2ac32) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a missing error message when actions throws during `astro sync`

- [#11904](https://github.com/withastro/astro/pull/11904) [`ca54e3f`](https://github.com/withastro/astro/commit/ca54e3f819fad009ac3c3c8b57a26014a2652a73) Thanks [@wtchnm](https://github.com/wtchnm)! - perf(assets): avoid downloading original image when using cache

## 4.15.2

### Patch Changes

- [#11870](https://github.com/withastro/astro/pull/11870) [`8e5257a`](https://github.com/withastro/astro/commit/8e5257addaeff809ed6f0c47ac0ed4ded755320e) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes typo in documenting the `fallbackType` property in i18n routing

- [#11884](https://github.com/withastro/astro/pull/11884) [`e450704`](https://github.com/withastro/astro/commit/e45070459f18976400fc8939812e172781eba351) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly handles content layer data where the transformed value does not match the input schema

- [#11900](https://github.com/withastro/astro/pull/11900) [`80b4a18`](https://github.com/withastro/astro/commit/80b4a181a077266c44065a737e61cc7cff6bc6d7) Thanks [@delucis](https://github.com/delucis)! - Fixes the user-facing type of the new `i18n.routing.fallbackType` option to be optional

## 4.15.1

### Patch Changes

- [#11872](https://github.com/withastro/astro/pull/11872) [`9327d56`](https://github.com/withastro/astro/commit/9327d56755404b481993b058bbfc4aa7880b2304) Thanks [@bluwy](https://github.com/bluwy)! - Fixes `astro add` importing adapters and integrations

- [#11767](https://github.com/withastro/astro/pull/11767) [`d1bd1a1`](https://github.com/withastro/astro/commit/d1bd1a11f7aca4d2141d1c4665f2db0440393d03) Thanks [@ascorbic](https://github.com/ascorbic)! - Refactors content layer sync to use a queue

## 4.15.0

### Minor Changes

- [#11729](https://github.com/withastro/astro/pull/11729) [`1c54e63`](https://github.com/withastro/astro/commit/1c54e633274ad47f6c83c9a16f375f0caa983fbe) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new variant `sync` for the `astro:config:setup` hook's `command` property. This value is set when calling the command `astro sync`.

  If your integration previously relied on knowing how many variants existed for the `command` property, you must update your logic to account for this new option.

- [#11743](https://github.com/withastro/astro/pull/11743) [`cce0894`](https://github.com/withastro/astro/commit/cce08945340312776a0480fc9ffe43929257639a) Thanks [@ph1p](https://github.com/ph1p)! - Adds a new, optional property `timeout` for the `client:idle` directive.

  This value allows you to specify a maximum time to wait, in milliseconds, before hydrating a UI framework component, even if the page is not yet done with its initial load. This means you can delay hydration for lower-priority UI elements with more control to ensure your element is interactive within a specified time frame.

  ```astro
  <ShowHideButton client:idle={{ timeout: 500 }} />
  ```

- [#11677](https://github.com/withastro/astro/pull/11677) [`cb356a5`](https://github.com/withastro/astro/commit/cb356a5db6b1ec2799790a603f931a961883ab31) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new option `fallbackType` to `i18n.routing` configuration that allows you to control how fallback pages are handled.

  When `i18n.fallback` is configured, this new routing option controls whether to [redirect](https://docs.astro.build/en/guides/routing/#redirects) to the fallback page, or to [rewrite](https://docs.astro.build/en/guides/routing/#rewrites) the fallback page's content in place.

  The `"redirect"` option is the default value and matches the current behavior of the existing fallback system.

  The option `"rewrite"` uses the new [rewriting system](https://docs.astro.build/en/guides/routing/#rewrites) to create fallback pages that render content on the original, requested URL without a browser refresh.

  For example, the following configuration will generate a page `/fr/index.html` that will contain the same HTML rendered by the page `/en/index.html` when `src/pages/fr/index.astro` does not exist.

  ```js
  // astro.config.mjs
  export default defineConfig({
    i18n: {
      locals: ['en', 'fr'],
      defaultLocale: 'en',
      routing: {
        prefixDefaultLocale: true,
        fallbackType: 'rewrite',
      },
      fallback: {
        fr: 'en',
      },
    },
  });
  ```

- [#11708](https://github.com/withastro/astro/pull/11708) [`62b0d20`](https://github.com/withastro/astro/commit/62b0d20b974dc932769221d210b751627fb4bbc6) Thanks [@martrapp](https://github.com/martrapp)! - Adds a new object `swapFunctions` to expose the necessary utility functions on `astro:transitions/client` that allow you to build custom swap functions to be used with view transitions.

  The example below uses these functions to replace Astro's built-in default `swap` function with one that only swaps the `<main>` part of the page:

  ```html
  <script>
    import { swapFunctions } from 'astro:transitions/client';

    document.addEventListener('astro:before-swap', (e) => { e.swap = () => swapMainOnly(e.newDocument) });

    function swapMainOnly(doc: Document) {
      swapFunctions.deselectScripts(doc);
      swapFunctions.swapRootAttributes(doc);
      swapFunctions.swapHeadElements(doc);
      const restoreFocusFunction = swapFunctions.saveFocus();
      const newMain = doc.querySelector('main');
      const oldMain = document.querySelector('main');
      if (newMain && oldMain) {
        swapFunctions.swapBodyElement(newMain, oldMain);
      } else {
        swapFunctions.swapBodyElement(doc.body, document.body);
      }
      restoreFocusFunction();
    };
  </script>
  ```

  See the [view transitions guide](https://docs.astro.build/en/guides/view-transitions/#astrobefore-swap) for more information about hooking into the `astro:before-swap` lifecycle event and adding a custom swap implementation.

- [#11843](https://github.com/withastro/astro/pull/11843) [`5b4070e`](https://github.com/withastro/astro/commit/5b4070efef877a77247bb05a4806b75f22e557c8) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Exposes `z` from the new `astro:schema` module. This is the new recommended import source for all Zod utilities when using Astro Actions.

  ## Migration for Astro Actions users

  `z` will no longer be exposed from `astro:actions`. To use `z` in your actions, import it from `astro:schema` instead:

  ```diff
  import {
    defineAction,
  -  z,
  } from 'astro:actions';
  + import { z } from 'astro:schema';
  ```

- [#11843](https://github.com/withastro/astro/pull/11843) [`5b4070e`](https://github.com/withastro/astro/commit/5b4070efef877a77247bb05a4806b75f22e557c8) Thanks [@bholmesdev](https://github.com/bholmesdev)! - The Astro Actions API introduced behind a flag in [v4.8.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#480) is no longer experimental and is available for general use.

  Astro Actions allow you to define and call backend functions with type-safety, performing data fetching, JSON parsing, and input validation for you.

  Actions can be called from client-side components and HTML forms. This gives you to flexibility to build apps using any technology: React, Svelte, HTMX, or just plain Astro components. This example calls a newsletter action and renders the result using an Astro component:

  ```astro
  ---
  // src/pages/newsletter.astro
  import { actions } from 'astro:actions';
  const result = Astro.getActionResult(actions.newsletter);
  ---

  {result && !result.error && <p>Thanks for signing up!</p>}
  <form method="POST" action={actions.newsletter}>
    <input type="email" name="email" />
    <button>Sign up</button>
  </form>
  ```

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    actions: true,
  -  }
  })
  ```

  If you have been waiting for stabilization before using Actions, you can now do so.

  For more information and usage examples, see our [brand new Actions guide](https://docs.astro.build/en/guides/actions).

### Patch Changes

- [#11677](https://github.com/withastro/astro/pull/11677) [`cb356a5`](https://github.com/withastro/astro/commit/cb356a5db6b1ec2799790a603f931a961883ab31) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug in the logic of `Astro.rewrite()` which led to the value for `base`, if configured, being automatically prepended to the rewrite URL passed. This was unintended behavior and has been corrected, and Astro now processes the URLs exactly as passed.

  If you use the `rewrite()` function on a project that has `base` configured, you must now prepend the base to your existing rewrite URL:

  ```js
  // astro.config.mjs
  export default defineConfig({
    base: '/blog',
  });
  ```

  ```diff
  // src/middleware.js
  export function onRequest(ctx, next) {
  -  return ctx.rewrite("/about")
  +  return ctx.rewrite("/blog/about")
  }
  ```

- [#11862](https://github.com/withastro/astro/pull/11862) [`0e35afe`](https://github.com/withastro/astro/commit/0e35afe44f5a3c9f87b41dc89d5128b02e448895) Thanks [@ascorbic](https://github.com/ascorbic)! - **BREAKING CHANGE to experimental content layer loaders only!**

  Passes `AstroConfig` instead of `AstroSettings` object to content layer loaders.

  This will not affect you unless you have created a loader that uses the `settings` object. If you have, you will need to update your loader to use the `config` object instead.

  ```diff
  export default function myLoader() {
    return {
      name: 'my-loader'
  -   async load({ settings }) {
  -     const base = settings.config.base;
  +   async load({ config }) {
  +     const base = config.base;
        // ...
      }
    }
  }

  ```

  Other properties of the settings object are private internals, and should not be accessed directly. If you think you need access to other properties, please open an issue to discuss your use case.

- [#11772](https://github.com/withastro/astro/pull/11772) [`6272e6c`](https://github.com/withastro/astro/commit/6272e6cec07778e81f853754bffaac40e658c700) Thanks [@bluwy](https://github.com/bluwy)! - Uses `magicast` to update the config for `astro add`

- [#11845](https://github.com/withastro/astro/pull/11845) [`440a4be`](https://github.com/withastro/astro/commit/440a4be0a6ca135e47b0d37124c1be03735ba7ff) Thanks [@bluwy](https://github.com/bluwy)! - Replaces `execa` with `tinyexec` internally

- [#11858](https://github.com/withastro/astro/pull/11858) [`8bab233`](https://github.com/withastro/astro/commit/8bab2339374763d19dbc4cc2c7ce4ad8a2a49694) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly resolves content layer images when filePath is not set

## 4.14.6

### Patch Changes

- [#11847](https://github.com/withastro/astro/pull/11847) [`45b599c`](https://github.com/withastro/astro/commit/45b599c4d40ded6a3e03881181b441ae494cbfcf) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a case where Vite would be imported by the SSR runtime, causing bundling errors and bloat.

- [#11822](https://github.com/withastro/astro/pull/11822) [`6fcaab8`](https://github.com/withastro/astro/commit/6fcaab84de1044ff4d186b2dfa5831964460062d) Thanks [@bluwy](https://github.com/bluwy)! - Marks internal `vite-plugin-fileurl` plugin with `enforce: 'pre'`

- [#11713](https://github.com/withastro/astro/pull/11713) [`497324c`](https://github.com/withastro/astro/commit/497324c4e87538dc1dc13aea3ced9bd3642d9ba6) Thanks [@voidfill](https://github.com/voidfill)! - Prevents prefetching of the same urls with different hashes.

- [#11814](https://github.com/withastro/astro/pull/11814) [`2bb72c6`](https://github.com/withastro/astro/commit/2bb72c63969f8f21dd279fa927c32f192ff79a3f) Thanks [@eduardocereto](https://github.com/eduardocereto)! - Updates the documentation for experimental Content Layer API with a corrected code example

- [#11842](https://github.com/withastro/astro/pull/11842) [`1ffaae0`](https://github.com/withastro/astro/commit/1ffaae04cf790390f730bf900b9722b99642adc1) Thanks [@stephan281094](https://github.com/stephan281094)! - Fixes a typo in the `MissingImageDimension` error message

- [#11828](https://github.com/withastro/astro/pull/11828) [`20d47aa`](https://github.com/withastro/astro/commit/20d47aa85a3a0d7ac3390f749715d92de830cf3e) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Improves error message when invalid data is returned by an Action.

## 4.14.5

### Patch Changes

- [#11809](https://github.com/withastro/astro/pull/11809) [`62e97a2`](https://github.com/withastro/astro/commit/62e97a20f72bacb017c633ddcb776abc89167660) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes usage of `.transform()`, `.refine()`, `.passthrough()`, and other effects on Action form inputs.

- [#11812](https://github.com/withastro/astro/pull/11812) [`260c4be`](https://github.com/withastro/astro/commit/260c4be050f91353bc5ba6af073e7bc17429d552) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Exposes `ActionAPIContext` type from the `astro:actions` module.

- [#11813](https://github.com/withastro/astro/pull/11813) [`3f7630a`](https://github.com/withastro/astro/commit/3f7630afd697809b1d4fbac6edd18153983c70ac) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes unexpected `undefined` value when calling an action from the client without a return value.

## 4.14.4

### Patch Changes

- [#11794](https://github.com/withastro/astro/pull/11794) [`3691a62`](https://github.com/withastro/astro/commit/3691a626fb67d617e5f8bd057443cd2ff6caa054) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes unexpected warning log when using Actions on "hybrid" rendered projects.

- [#11801](https://github.com/withastro/astro/pull/11801) [`9f943c1`](https://github.com/withastro/astro/commit/9f943c1344671b569a0d1ddba683b3cca0068adc) Thanks [@delucis](https://github.com/delucis)! - Fixes a bug where the `filePath` property was not available on content collection entries when using the content layer `file()` loader with a JSON file that contained an object instead of an array. This was breaking use of the `image()` schema utility among other things.

## 4.14.3

### Patch Changes

- [#11780](https://github.com/withastro/astro/pull/11780) [`c6622ad`](https://github.com/withastro/astro/commit/c6622adaeb405e961b12c91f0e5d02c7333d01cf) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Deprecates the Squoosh image service, to be removed in Astro 5.0. We recommend migrating to the default Sharp service.

- [#11790](https://github.com/withastro/astro/pull/11790) [`41c3fcb`](https://github.com/withastro/astro/commit/41c3fcb6189709450a67ea8f726071d5f3cdc80e) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates the documentation for experimental `astro:env` with a corrected link to the RFC proposal

- [#11773](https://github.com/withastro/astro/pull/11773) [`86a3391`](https://github.com/withastro/astro/commit/86a33915ff41b23ff6b35bcfb1805fefc0760ca7) Thanks [@ematipico](https://github.com/ematipico)! - Changes messages logged when using unsupported, deprecated, or experimental adapter features for clarity

- [#11745](https://github.com/withastro/astro/pull/11745) [`89bab1e`](https://github.com/withastro/astro/commit/89bab1e70786123fbe933a9d7a1b80c9334dcc5f) Thanks [@bluwy](https://github.com/bluwy)! - Prints prerender dynamic value usage warning only if it's used

- [#11774](https://github.com/withastro/astro/pull/11774) [`c6400ab`](https://github.com/withastro/astro/commit/c6400ab99c5e5f4477bc6ef7e801b7869b0aa9ab) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes the path returned by `injectTypes`

- [#11730](https://github.com/withastro/astro/pull/11730) [`2df49a6`](https://github.com/withastro/astro/commit/2df49a6fb4f6d92fe45f7429430abe63defeacd6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Simplifies path operations of `astro sync`

- [#11771](https://github.com/withastro/astro/pull/11771) [`49650a4`](https://github.com/withastro/astro/commit/49650a45550af46c70c6cf3f848b7b529103a649) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes an error thrown by `astro sync` when an `astro:env` virtual module is imported inside the Content Collections config

- [#11744](https://github.com/withastro/astro/pull/11744) [`b677429`](https://github.com/withastro/astro/commit/b67742961a384c10e5cd04cf5b02d0f014ea7362) Thanks [@bluwy](https://github.com/bluwy)! - Disables the WebSocket server when creating a Vite server for loading config files

## 4.14.2

### Patch Changes

- [#11733](https://github.com/withastro/astro/pull/11733) [`391324d`](https://github.com/withastro/astro/commit/391324df969db71d1c7ca25c2ed14c9eb6eea5ee) Thanks [@bluwy](https://github.com/bluwy)! - Reverts back to `yargs-parser` package for CLI argument parsing

## 4.14.1

### Patch Changes

- [#11725](https://github.com/withastro/astro/pull/11725) [`6c1560f`](https://github.com/withastro/astro/commit/6c1560fb0d19ce659bc9f9090f8050254d5c03f3) Thanks [@ascorbic](https://github.com/ascorbic)! - Prevents content layer importing node builtins in runtime

- [#11692](https://github.com/withastro/astro/pull/11692) [`35af73a`](https://github.com/withastro/astro/commit/35af73aace97a7cc898b9aa5040db8bc2ac62687) Thanks [@matthewp](https://github.com/matthewp)! - Prevent errant HTML from crashing server islands

  When an HTML minifier strips away the server island comment, the script can't correctly know where the end of the fallback content is. This makes it so that it simply doesn't remove any DOM in that scenario. This means the fallback isn't removed, but it also doesn't crash the browser.

- [#11727](https://github.com/withastro/astro/pull/11727) [`3c2f93b`](https://github.com/withastro/astro/commit/3c2f93b66c6b8e9d2ab58e2cbe941c14ffab89b5) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a type issue when using the Content Layer in dev

## 4.14.0

### Minor Changes

- [#11657](https://github.com/withastro/astro/pull/11657) [`a23c69d`](https://github.com/withastro/astro/commit/a23c69d0d0bed229bee52a32e61f135f9ebf9122) Thanks [@bluwy](https://github.com/bluwy)! - Deprecates the option for route-generating files to export a dynamic value for `prerender`. Only static values are now supported (e.g. `export const prerender = true` or `= false`). This allows for better treeshaking and bundling configuration in the future.

  Adds a new [`"astro:route:setup"` hook](https://docs.astro.build/en/reference/integrations-reference/#astroroutesetup) to the Integrations API to allow you to dynamically set options for a route at build or request time through an integration, such as enabling [on-demand server rendering](https://docs.astro.build/en/guides/server-side-rendering/#opting-in-to-pre-rendering-in-server-mode).

  To migrate from a dynamic export to the new hook, update or remove any dynamic `prerender` exports from individual routing files:

  ```diff
  // src/pages/blog/[slug].astro
  - export const prerender = import.meta.env.PRERENDER
  ```

  Instead, create an integration with the `"astro:route:setup"` hook and update the route's `prerender` option:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import { loadEnv } from 'vite';

  export default defineConfig({
    integrations: [setPrerender()],
  });

  function setPrerender() {
    const { PRERENDER } = loadEnv(process.env.NODE_ENV, process.cwd(), '');

    return {
      name: 'set-prerender',
      hooks: {
        'astro:route:setup': ({ route }) => {
          if (route.component.endsWith('/blog/[slug].astro')) {
            route.prerender = PRERENDER;
          }
        },
      },
    };
  }
  ```

- [#11360](https://github.com/withastro/astro/pull/11360) [`a79a8b0`](https://github.com/withastro/astro/commit/a79a8b0230b06ed32ce1802f2a5f84a6cf92dbe7) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a new [`injectTypes()` utility](https://docs.astro.build/en/reference/integrations-reference/#injecttypes-options) to the Integration API and refactors how type generation works

  Use `injectTypes()` in the `astro:config:done` hook to inject types into your user's project by adding a new a `*.d.ts` file.

  The `filename` property will be used to generate a file at `/.astro/integrations/<normalized_integration_name>/<normalized_filename>.d.ts` and must end with `".d.ts"`.

  The `content` property will create the body of the file, and must be valid TypeScript.

  Additionally, `injectTypes()` returns a URL to the normalized path so you can overwrite its content later on, or manipulate it in any way you want.

  ```js
  // my-integration/index.js
  export default {
    name: 'my-integration',
    'astro:config:done': ({ injectTypes }) => {
      injectTypes({
        filename: 'types.d.ts',
        content: "declare module 'virtual:my-integration' {}",
      });
    },
  };
  ```

  Codegen has been refactored. Although `src/env.d.ts` will continue to work as is, we recommend you update it:

  ```diff
  - /// <reference types="astro/client" />
  + /// <reference path="../.astro/types.d.ts" />
  - /// <reference path="../.astro/env.d.ts" />
  - /// <reference path="../.astro/actions.d.ts" />
  ```

- [#11605](https://github.com/withastro/astro/pull/11605) [`d3d99fb`](https://github.com/withastro/astro/commit/d3d99fba269da9e812e748539a11dfed785ef8a4) Thanks [@jcayzac](https://github.com/jcayzac)! - Adds a new property `meta` to Astro's [built-in `<Code />` component](https://docs.astro.build/en/reference/api-reference/#code-).

  This allows you to provide a value for [Shiki's `meta` attribute](https://shiki.style/guide/transformers#meta) to pass options to transformers.

  The following example passes an option to highlight lines 1 and 3 to Shiki's `transformerMetaHighlight`:

  ```astro
  ---
  // src/components/Card.astro
  import { Code } from 'astro:components';
  import { transformerMetaHighlight } from '@shikijs/transformers';
  ---

  <Code code={code} lang="js" transformers={[transformerMetaHighlight()]} meta="{1,3}" />
  ```

- [#11360](https://github.com/withastro/astro/pull/11360) [`a79a8b0`](https://github.com/withastro/astro/commit/a79a8b0230b06ed32ce1802f2a5f84a6cf92dbe7) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds support for Intellisense features (e.g. code completion, quick hints) for your content collection entries in compatible editors under the `experimental.contentIntellisense` flag.

  ```js
  import { defineConfig } from 'astro';

  export default defineConfig({
    experimental: {
      contentIntellisense: true,
    },
  });
  ```

  When enabled, this feature will generate and add JSON schemas to the `.astro` directory in your project. These files can be used by the Astro language server to provide Intellisense inside content files (`.md`, `.mdx`, `.mdoc`).

  Note that at this time, this also require enabling the `astro.content-intellisense` option in your editor, or passing the `contentIntellisense: true` initialization parameter to the Astro language server for editors using it directly.

  See the [experimental content Intellisense docs](https://docs.astro.build/en/reference/configuration-reference/#experimentalcontentintellisense) for more information updates as this feature develops.

- [#11360](https://github.com/withastro/astro/pull/11360) [`a79a8b0`](https://github.com/withastro/astro/commit/a79a8b0230b06ed32ce1802f2a5f84a6cf92dbe7) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds experimental support for the Content Layer API.

  The new Content Layer API builds upon content collections, taking them beyond local files in `src/content/` and allowing you to fetch content from anywhere, including remote APIs. These new collections work alongside your existing content collections, and you can migrate them to the new API at your own pace. There are significant improvements to performance with large collections of local files.

  ### Getting started

  To try out the new Content Layer API, enable it in your Astro config:

  ```js
  import { defineConfig } from 'astro';

  export default defineConfig({
    experimental: {
      contentLayer: true,
    },
  });
  ```

  You can then create collections in your `src/content/config.ts` using the Content Layer API.

  ### Loading your content

  The core of the new Content Layer API is the loader, a function that fetches content from a source and caches it in a local data store. Astro 4.14 ships with built-in `glob()` and `file()` loaders to handle your local Markdown, MDX, Markdoc, and JSON files:

  ```ts {3,7}
  // src/content/config.ts
  import { defineCollection, z } from 'astro:content';
  import { glob } from 'astro/loaders';

  const blog = defineCollection({
    // The ID is a slug generated from the path of the file relative to `base`
    loader: glob({ pattern: '**/*.md', base: './src/data/blog' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.coerce.date(),
    }),
  });

  export const collections = { blog };
  ```

  You can then query using the existing content collections functions, and enjoy a simplified `render()` function to display your content:

  ```astro
  ---
  import { getEntry, render } from 'astro:content';

  const post = await getEntry('blog', Astro.params.slug);

  const { Content } = await render(entry);
  ---

  <Content />
  ```

  ### Creating a loader

  You're not restricted to the built-in loaders – we hope you'll try building your own. You can fetch content from anywhere and return an array of entries:

  ```ts
  // src/content/config.ts
  const countries = defineCollection({
    loader: async () => {
      const response = await fetch('https://restcountries.com/v3.1/all');
      const data = await response.json();
      // Must return an array of entries with an id property,
      // or an object with IDs as keys and entries as values
      return data.map((country) => ({
        id: country.cca3,
        ...country,
      }));
    },
    // optionally add a schema to validate the data and make it type-safe for users
    // schema: z.object...
  });

  export const collections = { countries };
  ```

  For more advanced loading logic, you can define an object loader. This allows incremental updates and conditional loading, and gives full access to the data store. It also allows a loader to define its own schema, including generating it dynamically based on the source API. See the [the Content Layer API RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0047-content-layer.md#loaders) for more details.

  ### Sharing your loaders

  Loaders are better when they're shared. You can create a package that exports a loader and publish it to npm, and then anyone can use it on their site. We're excited to see what the community comes up with! To get started, [take a look at some examples](https://github.com/ascorbic/astro-loaders/). Here's how to load content using an RSS/Atom feed loader:

  ```ts
  // src/content/config.ts
  import { defineCollection } from 'astro:content';
  import { feedLoader } from '@ascorbic/feed-loader';

  const podcasts = defineCollection({
    loader: feedLoader({
      url: 'https://feeds.99percentinvisible.org/99percentinvisible',
    }),
  });

  export const collections = { podcasts };
  ```

  ### Learn more

  To find out more about using the Content Layer API, check out [the Content Layer RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0047-content-layer.md) and [share your feedback](https://github.com/withastro/roadmap/pull/982).

### Patch Changes

- [#11716](https://github.com/withastro/astro/pull/11716) [`f4057c1`](https://github.com/withastro/astro/commit/f4057c18c91f969e3e508545fb988aff94c3ff08) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes content types sync in dev

- [#11645](https://github.com/withastro/astro/pull/11645) [`849e4c6`](https://github.com/withastro/astro/commit/849e4c6c23e61f7fa59f583419048b998bef2475) Thanks [@bluwy](https://github.com/bluwy)! - Refactors internally to use `node:util` `parseArgs` instead of `yargs-parser`

- [#11712](https://github.com/withastro/astro/pull/11712) [`791d809`](https://github.com/withastro/astro/commit/791d809cbc22ed30dda1195ca026daa46a54b551) Thanks [@matthewp](https://github.com/matthewp)! - Fix mixed use of base + trailingSlash in Server Islands

- [#11709](https://github.com/withastro/astro/pull/11709) [`3d8ae76`](https://github.com/withastro/astro/commit/3d8ae767fd4952af7332542b58fe98886eb2e99e) Thanks [@matthewp](https://github.com/matthewp)! - Fix adapter causing Netlify to break

## 4.13.4

### Patch Changes

- [#11678](https://github.com/withastro/astro/pull/11678) [`34da907`](https://github.com/withastro/astro/commit/34da907f3b4fb411024e6d28fdb291fa78116950) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where omitting a semicolon and line ending with carriage return - CRLF - in the `prerender` option could throw an error.

- [#11535](https://github.com/withastro/astro/pull/11535) [`932bd2e`](https://github.com/withastro/astro/commit/932bd2eb07f1d7cb2c91e7e7d31fe84c919e302b) Thanks [@matthewp](https://github.com/matthewp)! - Encrypt server island props

  Server island props are now encrypted with a key generated at build-time. This is intended to prevent accidentally leaking secrets caused by exposing secrets through prop-passing. This is not intended to allow a server island to be trusted to skip authentication, or to protect against any other vulnerabilities other than secret leakage.

  See the RFC for an explanation: https://github.com/withastro/roadmap/blob/server-islands/proposals/server-islands.md#props-serialization

- [#11655](https://github.com/withastro/astro/pull/11655) [`dc0a297`](https://github.com/withastro/astro/commit/dc0a297e2a4bea3db8310cc98c51b2f94ede5fde) Thanks [@billy-le](https://github.com/billy-le)! - Fixes Astro Actions `input` validation when using `default` values with a form input.

- [#11689](https://github.com/withastro/astro/pull/11689) [`c7bda4c`](https://github.com/withastro/astro/commit/c7bda4cd672864babc3cebd19a2dd2e1af85c087) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue in the Astro actions, where the size of the generated cookie was exceeding the size permitted by the `Set-Cookie` header.

## 4.13.3

### Patch Changes

- [#11653](https://github.com/withastro/astro/pull/11653) [`32be549`](https://github.com/withastro/astro/commit/32be5494f6d33dbe32208704405162c95a64f0bc) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `astro:env` docs to reflect current developments and usage guidance

- [#11658](https://github.com/withastro/astro/pull/11658) [`13b912a`](https://github.com/withastro/astro/commit/13b912a8702afb96e2d0bc20dcc1b4135ae58147) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes `orThrow()` type when calling an Action without an `input` validator.

- [#11603](https://github.com/withastro/astro/pull/11603) [`f31d466`](https://github.com/withastro/astro/commit/f31d4665c1cbb0918b9e00ba1431fb6f264025f7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Improves user experience when render an Action result from a form POST request:

  - Removes "Confirm post resubmission?" dialog when refreshing a result.
  - Removes the `?_astroAction=NAME` flag when a result is rendered.

  Also improves the DX of directing to a new route on success. Actions will now redirect to the route specified in your `action` string on success, and redirect back to the previous page on error. This follows the routing convention of established backend frameworks like Laravel.

  For example, say you want to redirect to a `/success` route when `actions.signup` succeeds. You can add `/success` to your `action` string like so:

  ```astro
  <form method="POST" action={'/success' + actions.signup}></form>
  ```

  - On success, Astro will redirect to `/success`.
  - On error, Astro will redirect back to the current page.

  You can retrieve the action result from either page using the `Astro.getActionResult()` function.

  ### Note on security

  This uses a temporary cookie to forward the action result to the next page. The cookie will be deleted when that page is rendered.

  ⚠ **The action result is not encrypted.** In general, we recommend returning minimal data from an action handler to a) avoid leaking sensitive information, and b) avoid unexpected render issues once the temporary cookie is deleted. For example, a `login` function may return a user's session id to retrieve from your Astro frontmatter, rather than the entire user object.

## 4.13.2

### Patch Changes

- [#11648](https://github.com/withastro/astro/pull/11648) [`589d351`](https://github.com/withastro/astro/commit/589d35158da1a2136387d0ad76609f5c8535c03a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes unexpected error when refreshing a POST request from a form using Actions.

- [#11600](https://github.com/withastro/astro/pull/11600) [`09ec2ca`](https://github.com/withastro/astro/commit/09ec2cadce01a9a1f9c54ac433f137348907aa56) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Deprecates `getEntryBySlug` and `getDataEntryById` functions exported by `astro:content` in favor of `getEntry`.

- [#11593](https://github.com/withastro/astro/pull/11593) [`81d7150`](https://github.com/withastro/astro/commit/81d7150e02472430eab555dfc4f053738bf99bb6) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds support for `Date()`, `Map()`, and `Set()` from action results. See [devalue](https://github.com/Rich-Harris/devalue) for a complete list of supported values.

  Also fixes serialization exceptions when deploying Actions with edge middleware on Netlify and Vercel.

- [#11617](https://github.com/withastro/astro/pull/11617) [`196092a`](https://github.com/withastro/astro/commit/196092ae69eb1249206846ddfc162049b03f42b4) Thanks [@abubakriz](https://github.com/abubakriz)! - Fix toolbar audit incorrectly flagging images as above the fold.

- [#11634](https://github.com/withastro/astro/pull/11634) [`2716f52`](https://github.com/withastro/astro/commit/2716f52aae7194439ebb2336849ddd9e8226658a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes internal server error when calling an Astro Action without arguments on Vercel.

- [#11628](https://github.com/withastro/astro/pull/11628) [`9aaf58c`](https://github.com/withastro/astro/commit/9aaf58c1339b54f2c1394e718a0f6f609f0b6342) Thanks [@madbook](https://github.com/madbook)! - Ensures consistent CSS chunk hashes across different environments

## 4.13.1

### Patch Changes

- [#11584](https://github.com/withastro/astro/pull/11584) [`a65ffe3`](https://github.com/withastro/astro/commit/a65ffe314b112213421def26c7cc5b7e7b93558c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Removes async local storage dependency from Astro Actions. This allows Actions to run in Cloudflare and Stackblitz without opt-in flags or other configuration.

  This also introduces a new convention for calling actions from server code. Instead of calling actions directly, you must wrap function calls with the new `Astro.callAction()` utility.

  > `callAction()` is meant to _trigger_ an action from server code. `getActionResult()` usage with form submissions remains unchanged.

  ```astro
  ---
  import { actions } from 'astro:actions';

  const result = await Astro.callAction(actions.searchPosts, {
    searchTerm: Astro.url.searchParams.get('search'),
  });
  ---

  {
    result.data &&
      {
        /* render the results */
      }
  }
  ```

  ## Migration

  If you call actions directly from server code, update function calls to use the `Astro.callAction()` wrapper for pages and `context.callAction()` for endpoints:

  ```diff
  ---
  import { actions } from 'astro:actions';

  - const result = await actions.searchPosts({ searchTerm: 'test' });
  + const result = await Astro.callAction(actions.searchPosts, { searchTerm: 'test' });
  ---
  ```

  If you deploy with Cloudflare and added [the `nodejs_compat` or `nodejs_als` flags](https://developers.cloudflare.com/workers/runtime-apis/nodejs) for Actions, we recommend removing these:

  ```diff
  compatibility_flags = [
  - "nodejs_compat",
  - "nodejs_als"
  ]
  ```

  You can also remove `node:async_hooks` from the `vite.ssr.external` option in your `astro.config` file:

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  - vite: {
  -   ssr: {
  -     external: ["node:async_hooks"]
  -   }
  - }
  })
  ```

## 4.13.0

### Minor Changes

- [#11507](https://github.com/withastro/astro/pull/11507) [`a62345f`](https://github.com/withastro/astro/commit/a62345fd182ae4886d586c8406ed8f3e5f942730) Thanks [@ematipico](https://github.com/ematipico)! - Adds color-coding to the console output during the build to highlight slow pages.

  Pages that take more than 500 milliseconds to render will have their build time logged in red. This change can help you discover pages of your site that are not performant and may need attention.

- [#11379](https://github.com/withastro/astro/pull/11379) [`e5e2d3e`](https://github.com/withastro/astro/commit/e5e2d3ed3076f10b4645f011b13888d5fa16e92e) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - The `experimental.contentCollectionJsonSchema` feature introduced behind a flag in [v4.5.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#450) is no longer experimental and is available for general use.

  If you are working with collections of type `data`, Astro will now auto-generate JSON schema files for your editor to get IntelliSense and type-checking. A separate file will be created for each data collection in your project based on your collections defined in `src/content/config.ts` using a library called [`zod-to-json-schema`](https://github.com/StefanTerdell/zod-to-json-schema).

  This feature requires you to manually set your schema's file path as the value for `$schema` in each data entry file of the collection:

  ```json title="src/content/authors/armand.json" ins={2}
  {
    "$schema": "../../../.astro/collections/authors.schema.json",
    "name": "Armand",
    "skills": ["Astro", "Starlight"]
  }
  ```

  Alternatively, you can set this value in your editor settings. For example, to set this value in [VSCode's `json.schemas` setting](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings), provide the path of files to match and the location of your JSON schema:

  ```json
  {
    "json.schemas": [
      {
        "fileMatch": ["/src/content/authors/**"],
        "url": "./.astro/collections/authors.schema.json"
      }
    ]
  }
  ```

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    contentCollectionJsonSchema: true
  -  }
  })
  ```

  If you have been waiting for stabilization before using JSON Schema generation for content collections, you can now do so.

  Please see [the content collections guide](https://docs.astro.build/en/guides/content-collections/#enabling-json-schema-generation) for more about this feature.

- [#11542](https://github.com/withastro/astro/pull/11542) [`45ad326`](https://github.com/withastro/astro/commit/45ad326932971b44630a32d9092c9505f24f42f8) Thanks [@ematipico](https://github.com/ematipico)! - The `experimental.rewriting` feature introduced behind a flag in [v4.8.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#480) is no longer experimental and is available for general use.

  `Astro.rewrite()` and `context.rewrite()` allow you to render a different page without changing the URL in the browser. Unlike using a redirect, your visitor is kept on the original page they visited.

  Rewrites can be useful for showing the same content at multiple paths (e.g. /products/shoes/men/ and /products/men/shoes/) without needing to maintain two identical source files.

  Rewrites are supported in Astro pages, endpoints, and middleware.

  Return `Astro.rewrite()` in the frontmatter of a `.astro` page component to display a different page's content, such as fallback localized content:

  ```astro
  ---
  // src/pages/es-cu/articles/introduction.astro
  return Astro.rewrite('/es/articles/introduction');
  ---
  ```

  Use `context.rewrite()` in endpoints, for example to reroute to a different page:

  ```js
  // src/pages/api.js
  export function GET(context) {
    if (!context.locals.allowed) {
      return context.rewrite('/');
    }
  }
  ```

  The middleware `next()` function now accepts a parameter with the same type as the `rewrite()` function. For example, with `next("/")`, you can call the next middleware function with a new `Request`.

  ```js
  // src/middleware.js
  export function onRequest(context, next) {
    if (!context.cookies.get('allowed')) {
      return next('/'); // new signature
    }
    return next();
  }
  ```

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  // astro.config.mjs
  export default defineConfig({
  -  experimental: {
  -    rewriting: true
  -  }
  })
  ```

  If you have been waiting for stabilization before using rewrites in Astro, you can now do so.

  Please see [the routing guide in docs](https://docs.astro.build/en/guides/routing/#rewrites) for more about using this feature.

## 4.12.3

### Patch Changes

- [#11509](https://github.com/withastro/astro/pull/11509) [`dfbca06`](https://github.com/withastro/astro/commit/dfbca06dda674c64c7010db2f4de951496a1e631) Thanks [@bluwy](https://github.com/bluwy)! - Excludes hoisted scripts and styles from Astro components imported with `?url` or `?raw`

- [#11561](https://github.com/withastro/astro/pull/11561) [`904f1e5`](https://github.com/withastro/astro/commit/904f1e535aeb7a14ba7ce07c3130e25f3e708266) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Uses the correct pageSize default in `page.size` JSDoc comment

- [#11571](https://github.com/withastro/astro/pull/11571) [`1c3265a`](https://github.com/withastro/astro/commit/1c3265a8c9c0b1b1bd597f756b63463146bacc3a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - **BREAKING CHANGE to the experimental Actions API only.** Install the latest `@astrojs/react` integration as well if you're using React 19 features.

  Make `.safe()` the default return value for actions. This means `{ data, error }` will be returned when calling an action directly. If you prefer to get the data while allowing errors to throw, chain the `.orThrow()` modifier.

  ```ts
  import { actions } from 'astro:actions';

  // Before
  const { data, error } = await actions.like.safe();
  // After
  const { data, error } = await actions.like();

  // Before
  const newLikes = await actions.like();
  // After
  const newLikes = await actions.like.orThrow();
  ```

  ## Migration

  To migrate your existing action calls:

  - Remove `.safe` from existing _safe_ action calls
  - Add `.orThrow` to existing _unsafe_ action calls

- [#11546](https://github.com/withastro/astro/pull/11546) [`7f26de9`](https://github.com/withastro/astro/commit/7f26de906e87f1e8973a1f84399f23e36e506bb3) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Remove "SSR Only" mention in `Astro.redirect` inline documentation and update reference link.

- [#11525](https://github.com/withastro/astro/pull/11525) [`8068131`](https://github.com/withastro/astro/commit/80681318c6cb0f612fcb5188933fdd20a8f474a3) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where the build was failing when `experimental.actions` was enabled, an adapter was in use, and there were not actions inside the user code base.

- [#11574](https://github.com/withastro/astro/pull/11574) [`e3f29d4`](https://github.com/withastro/astro/commit/e3f29d416a2e0a0b5328ae1075b12575260dddfd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes line with the error not being properly highlighted in the error overlay

- [#11570](https://github.com/withastro/astro/pull/11570) [`84189b6`](https://github.com/withastro/astro/commit/84189b6511dc2a14bcfe608696f56a64c2046f39) Thanks [@bholmesdev](https://github.com/bholmesdev)! - **BREAKING CHANGE to the experimental Actions API only.** Install the latest `@astrojs/react` integration as well if you're using React 19 features.

  Updates the Astro Actions fallback to support `action={actions.name}` instead of using `getActionProps().` This will submit a form to the server in zero-JS scenarios using a search parameter:

  ```astro
  ---
  import { actions } from 'astro:actions';
  ---

  <form action={actions.logOut}>
    <!--output: action="?_astroAction=logOut"-->
    <button>Log Out</button>
  </form>
  ```

  You may also construct form action URLs using string concatenation, or by using the `URL()` constructor, with the an action's `.queryString` property:

  ```astro
  ---
  import { actions } from 'astro:actions';

  const confirmationUrl = new URL('/confirmation', Astro.url);
  confirmationUrl.search = actions.queryString;
  ---

  <form method="POST" action={confirmationUrl.pathname}>
    <button>Submit</button>
  </form>
  ```

  ## Migration

  `getActionProps()` is now deprecated. To use the new fallback pattern, remove the `getActionProps()` input from your form and pass your action function to the form `action` attribute:

  ```diff
  ---
  import {
    actions,
  - getActionProps,
  } from 'astro:actions';
  ---

  + <form method="POST" action={actions.logOut}>
  - <form method="POST">
  - <input {...getActionProps(actions.logOut)} />
    <button>Log Out</button>
  </form>
  ```

- [#11559](https://github.com/withastro/astro/pull/11559) [`1953dbb`](https://github.com/withastro/astro/commit/1953dbbd41d2d7803837601a9e192654f02275ef) Thanks [@bryanwood](https://github.com/bryanwood)! - Allows actions to return falsy values without an error

- [#11553](https://github.com/withastro/astro/pull/11553) [`02c85b5`](https://github.com/withastro/astro/commit/02c85b541241a07db45bf9e15717e111104898e5) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue in content collection caching, where two documents with the same contents were generating an error during the build.

- [#11548](https://github.com/withastro/astro/pull/11548) [`602c5bf`](https://github.com/withastro/astro/commit/602c5bf05de4fe5ec1ea97f8e10455485aceb05f) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fixes `astro add` for packages with only prerelease versions

- [#11566](https://github.com/withastro/astro/pull/11566) [`0dcef3a`](https://github.com/withastro/astro/commit/0dcef3ab171bd7f81c2f99e9366db3724aa7091b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes DomException errors not being handled properly

- [#11529](https://github.com/withastro/astro/pull/11529) [`504c383`](https://github.com/withastro/astro/commit/504c383e20dfb5d8eb0825a70935f221b43577b2) Thanks [@matthewp](https://github.com/matthewp)! - Fix server islands with trailingSlash: always

## 4.12.2

### Patch Changes

- [#11505](https://github.com/withastro/astro/pull/11505) [`8ff7658`](https://github.com/withastro/astro/commit/8ff7658001c2c7bedf6adcddf7a9341196f2d376) Thanks [@ematipico](https://github.com/ematipico)! - Enhances the dev server logging when rewrites occur during the lifecycle or rendering.

  The dev server will log the status code **before** and **after** a rewrite:

  ```shell
  08:16:48 [404] (rewrite) /foo/about 200ms
  08:22:13 [200] (rewrite) /about 23ms
  ```

- [#11506](https://github.com/withastro/astro/pull/11506) [`026e8ba`](https://github.com/withastro/astro/commit/026e8baf3323e99f96530999fd32a0a9b305854d) Thanks [@sarah11918](https://github.com/sarah11918)! - Fixes typo in documenting the `slot="fallback"` attribute for Server Islands experimental feature.

- [#11508](https://github.com/withastro/astro/pull/11508) [`ca335e1`](https://github.com/withastro/astro/commit/ca335e1dc09bc83d3f8f5b9dd54f116bcb4881e4) Thanks [@cramforce](https://github.com/cramforce)! - Escapes HTML in serialized props

- [#11501](https://github.com/withastro/astro/pull/11501) [`4db78ae`](https://github.com/withastro/astro/commit/4db78ae046a39628dfe8d68e776706559d4f8ba7) Thanks [@martrapp](https://github.com/martrapp)! - Adds the missing export for accessing the `getFallback()` function of the client site router.

## 4.12.1

### Patch Changes

- [#11486](https://github.com/withastro/astro/pull/11486) [`9c0c849`](https://github.com/withastro/astro/commit/9c0c8492d987cd9214ed53e71fb29599c206966a) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new function called `addClientRenderer` to the Container API.

  This function should be used when rendering components using the `client:*` directives. The `addClientRenderer` API must be used
  _after_ the use of the `addServerRenderer`:

  ```js
  const container = await experimental_AstroContainer.create();
  container.addServerRenderer({ renderer });
  container.addClientRenderer({ name: '@astrojs/react', entrypoint: '@astrojs/react/client.js' });
  const response = await container.renderToResponse(Component);
  ```

- [#11500](https://github.com/withastro/astro/pull/11500) [`4e142d3`](https://github.com/withastro/astro/commit/4e142d38cbaf0938be7077c88e32b38a6b60eaed) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes inferRemoteSize type not working

- [#11496](https://github.com/withastro/astro/pull/11496) [`53ccd20`](https://github.com/withastro/astro/commit/53ccd206f9bfe5f6a0d888d199776b4043f63f58) Thanks [@alfawal](https://github.com/alfawal)! - Hide the dev toolbar on `window.print()` (CTRL + P)

## 4.12.0

### Minor Changes

- [#11341](https://github.com/withastro/astro/pull/11341) [`49b5145`](https://github.com/withastro/astro/commit/49b5145158a603b9bb951bf914a6a9780c218704) Thanks [@madcampos](https://github.com/madcampos)! - Adds support for [Shiki's `defaultColor` option](https://shiki.style/guide/dual-themes#without-default-color).

  This option allows you to override the values of a theme's inline style, adding only CSS variables to give you more flexibility in applying multiple color themes.

  Configure `defaultColor: false` in your Shiki config to apply throughout your site, or pass to Astro's built-in `<Code>` component to style an individual code block.

  ```js title="astro.config.mjs"
  import { defineConfig } from 'astro/config';
  export default defineConfig({
    markdown: {
      shikiConfig: {
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        defaultColor: false,
      },
    },
  });
  ```

  ```astro
  ---
  import { Code } from 'astro:components';
  ---

  <Code code={`const useMyColors = true`} lang="js" defaultColor={false} />
  ```

- [#11304](https://github.com/withastro/astro/pull/11304) [`2e70741`](https://github.com/withastro/astro/commit/2e70741362afc1e7d03c8b2a9d8edb8466dfe9c3) Thanks [@Fryuni](https://github.com/Fryuni)! - Refactors the type for integration hooks so that integration authors writing custom integration hooks can now allow runtime interactions between their integration and other integrations.

  This internal change should not break existing code for integration authors.

  To declare your own hooks for your integration, extend the `Astro.IntegrationHooks` interface:

  ```ts
  // your-integration/types.ts
  declare global {
    namespace Astro {
      interface IntegrationHooks {
        'myLib:eventHappened': (your: string, parameters: number) => Promise<void>;
      }
    }
  }
  ```

  Call your hooks on all other integrations installed in a project at the appropriate time. For example, you can call your hook on initialization before either the Vite or Astro config have resolved:

  ```ts
  // your-integration/index.ts
  import './types.ts';

  export default (): AstroIntegration => {
    return {
      name: 'your-integration',
      hooks: {
        'astro:config:setup': async ({ config }) => {
          for (const integration of config.integrations) {
            await integration.hooks['myLib:eventHappened'].?('your values', 123);
          }
        },
      }
    }
  }
  ```

  Other integrations can also now declare your hooks:

  ```ts
  // other-integration/index.ts
  import 'your-integration/types.ts';

  export default (): AstroIntegration => {
    return {
      name: 'other-integration',
      hooks: {
        'myLib:eventHappened': async (your, values) => {
          // ...
        },
      },
    };
  };
  ```

- [#11305](https://github.com/withastro/astro/pull/11305) [`d495df5`](https://github.com/withastro/astro/commit/d495df5361e16ebdf83dea6e2de004f438e698c4) Thanks [@matthewp](https://github.com/matthewp)! - Experimental Server Islands

  Server Islands allow you to specify components that should run on the server, allowing the rest of the page to be more aggressively cached, or even generated statically. Turn any `.astro` component into a server island by adding the `server:defer` directive and optionally, fallback placeholder content:

  ```astro
  ---
  import Avatar from '../components/Avatar.astro';
  import GenericUser from '../components/GenericUser.astro';
  ---

  <header>
    <h1>Page Title</h1>
    <div class="header-right">
      <Avatar server:defer>
        <GenericUser slot="fallback" />
      </Avatar>
    </div>
  </header>
  ```

  The `server:defer` directive can be used on any Astro component in a project using `hybrid` or `server` mode with an adapter. There are no special APIs needed inside of the island.

  Enable server islands by adding the experimental flag to your Astro config with an appropriate `output` mode and adapter:

  ```js
  import { defineConfig } from 'astro/config';
  import netlify from '@astrojs/netlify';

  export default defineConfig({
    output: 'hybrid',
    adapter: netlify(),
    experimental: {
      serverIslands: true,
    },
  });
  ```

  For more information, see the [server islands documentation](https://docs.astro.build/en/reference/configuration-reference/#experimentalserverislands).

- [#11482](https://github.com/withastro/astro/pull/11482) [`7c9ed71`](https://github.com/withastro/astro/commit/7c9ed71bf1e13a0c825ba67946b6307d06f77233) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a `--noSync` parameter to the `astro check` command to skip the type-gen step. This can be useful when running `astro check` inside packages that have Astro components, but are not Astro projects

- [#11098](https://github.com/withastro/astro/pull/11098) [`36e30a3`](https://github.com/withastro/astro/commit/36e30a33092c32c2de1deac316f49660247902b0) Thanks [@itsmatteomanf](https://github.com/itsmatteomanf)! - Adds a new `inferRemoteSize()` function that can be used to infer the dimensions of a remote image.

  Previously, the ability to infer these values was only available by adding the [`inferSize`] attribute to the `<Image>` and `<Picture>` components or `getImage()`. Now, you can also access this data outside of these components.

  This is useful for when you need to know the dimensions of an image for styling purposes or to calculate different densities for responsive images.

  ```astro
  ---
  import { inferRemoteSize, Image } from 'astro:assets';

  const imageUrl = 'https://...';
  const { width, height } = await inferRemoteSize(imageUrl);
  ---

  <Image src={imageUrl} width={width / 2} height={height} densities={[1.5, 2]} />
  ```

- [#11391](https://github.com/withastro/astro/pull/11391) [`6f9b527`](https://github.com/withastro/astro/commit/6f9b52710567f3bec7939a98eb8c76f5ea0b2f91) Thanks [@ARipeAppleByYoursTruly](https://github.com/ARipeAppleByYoursTruly)! - Adds Shiki's [`defaultColor`](https://shiki.style/guide/dual-themes#without-default-color) option to the `<Code />` component, giving you more control in applying multiple themes

- [#11176](https://github.com/withastro/astro/pull/11176) [`a751458`](https://github.com/withastro/astro/commit/a75145871b7bb9277584066e1f625df2aaabebce) Thanks [@tsawada](https://github.com/tsawada)! - Adds two new values to the [pagination `page` prop](https://docs.astro.build/en/reference/api-reference/#the-pagination-page-prop): `page.first` and `page.last` for accessing the URLs of the first and last pages.

### Patch Changes

- [#11477](https://github.com/withastro/astro/pull/11477) [`7e9c4a1`](https://github.com/withastro/astro/commit/7e9c4a134c6ea7c8b92ea00038c0845b58c02bc5) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the development server was emitting a 404 status code when the user uses a rewrite that emits a 200 status code.

- [#11479](https://github.com/withastro/astro/pull/11479) [`ca969d5`](https://github.com/withastro/astro/commit/ca969d538a6a8d64573f426b8a87ebd7e434bd71) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where invalid `astro:env` variables at runtime would not throw correctly

- [#11489](https://github.com/withastro/astro/pull/11489) [`061f1f4`](https://github.com/withastro/astro/commit/061f1f4d0cb306efd0c768645439111aec765c76) Thanks [@ematipico](https://github.com/ematipico)! - Move root inside the manifest and make serialisable

- [#11415](https://github.com/withastro/astro/pull/11415) [`e9334d0`](https://github.com/withastro/astro/commit/e9334d05ca88ed6df1becc1512c673e20414bf47) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Refactors how `sync` works and when it's called. Fixes an issue with `astro:env` types in dev not being generated

- [#11478](https://github.com/withastro/astro/pull/11478) [`3161b67`](https://github.com/withastro/astro/commit/3161b6789c57a3bb740ed117205dc55997eb74ea) Thanks [@bluwy](https://github.com/bluwy)! - Supports importing Astro components with Vite queries, like `?url`, `?raw`, and `?direct`

- [#11491](https://github.com/withastro/astro/pull/11491) [`fe3afeb`](https://github.com/withastro/astro/commit/fe3afebd652289ec1b65eed983e804dbb37ed092) Thanks [@matthewp](https://github.com/matthewp)! - Fix for Server Islands in Vercel adapter

  Vercel, and probably other adapters only allow pre-defined routes. This makes it so that the `astro:build:done` hook includes the `_server-islands/` route as part of the route data, which is used to configure available routes.

- [#11483](https://github.com/withastro/astro/pull/11483) [`34f9c25`](https://github.com/withastro/astro/commit/34f9c25740f8eaae0d5e2a2b685b83556d23e63e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes Astro not working on low versions of Node 18 and 20

- Updated dependencies [[`49b5145`](https://github.com/withastro/astro/commit/49b5145158a603b9bb951bf914a6a9780c218704)]:
  - @astrojs/markdown-remark@5.2.0

## 4.11.6

### Patch Changes

- [#11459](https://github.com/withastro/astro/pull/11459) [`bc2e74d`](https://github.com/withastro/astro/commit/bc2e74de384776caa252fd47dbeda895c0488c11) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes false positive audit warnings on elements with the role "tabpanel".

- [#11472](https://github.com/withastro/astro/pull/11472) [`cb4e6d0`](https://github.com/withastro/astro/commit/cb4e6d09deb7507058115a3fd2a567019a501e4d) Thanks [@delucis](https://github.com/delucis)! - Avoids targeting all files in the `src/` directory for eager optimization by Vite. After this change, only JSX, Vue, Svelte, and Astro components get scanned for early optimization.

- [#11387](https://github.com/withastro/astro/pull/11387) [`b498461`](https://github.com/withastro/astro/commit/b498461e277bffb0abe21b59a94b1e56a8c69d47) Thanks [@bluwy](https://github.com/bluwy)! - Fixes prerendering not removing unused dynamic imported chunks

- [#11437](https://github.com/withastro/astro/pull/11437) [`6ccb30e`](https://github.com/withastro/astro/commit/6ccb30e610eed34c2cc2c275485a8ac45c9b6b9e) Thanks [@NuroDev](https://github.com/NuroDev)! - Fixes a case where Astro's config `experimental.env.schema` keys did not allow numbers. Numbers are still not allowed as the first character to be able to generate valid JavaScript identifiers

- [#11439](https://github.com/withastro/astro/pull/11439) [`08baf56`](https://github.com/withastro/astro/commit/08baf56f328ce4b6814a7f90089c0b3398d8bbfe) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Expands the `isInputError()` utility from `astro:actions` to accept errors of any type. This should now allow type narrowing from a try / catch block.

  ```ts
  // example.ts
  import { actions, isInputError } from 'astro:actions';

  try {
    await actions.like(new FormData());
  } catch (error) {
    if (isInputError(error)) {
      console.log(error.fields);
    }
  }
  ```

- [#11452](https://github.com/withastro/astro/pull/11452) [`0e66849`](https://github.com/withastro/astro/commit/0e6684983b9b24660a8fef83fe401ec1d567378a) Thanks [@FugiTech](https://github.com/FugiTech)! - Fixes an issue where using .nullish() in a formdata Astro action would always parse as a string

- [#11438](https://github.com/withastro/astro/pull/11438) [`619f07d`](https://github.com/withastro/astro/commit/619f07db701ebab2d2f2598dd2dcf93ba1e5719c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Exposes utility types from `astro:actions` for the `defineAction` handler (`ActionHandler`) and the `ActionError` code (`ActionErrorCode`).

- [#11456](https://github.com/withastro/astro/pull/11456) [`17e048d`](https://github.com/withastro/astro/commit/17e048de0e79d76b933d128676be2388954b419e) Thanks [@RickyC0626](https://github.com/RickyC0626)! - Fixes `astro dev --open` unexpected behavior that spawns a new tab every time a config file is saved

- [#11337](https://github.com/withastro/astro/pull/11337) [`0a4b31f`](https://github.com/withastro/astro/commit/0a4b31ffeb41ad1dfb3141384e22787763fcae3d) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new property `experimental.env.validateSecrets` to allow validating private variables on the server.

  By default, this is set to `false` and only public variables are checked on start. If enabled, secrets will also be checked on start (dev/build modes). This is useful for example in some CIs to make sure all your secrets are correctly set before deploying.

  ```js
  // astro.config.mjs
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    experimental: {
      env: {
        schema: {
          // ...
        },
        validateSecrets: true,
      },
    },
  });
  ```

- [#11443](https://github.com/withastro/astro/pull/11443) [`ea4bc04`](https://github.com/withastro/astro/commit/ea4bc04e9489c456e2b4b5dbd67d5e4cf3f89f97) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Expose new `ActionReturnType` utility from `astro:actions`. This infers the return type of an action by passing `typeof actions.name` as a type argument. This example defines a `like` action that returns `likes` as an object:

  ```ts
  // actions/index.ts
  import { defineAction } from 'astro:actions';

  export const server = {
    like: defineAction({
      handler: () => {
        /* ... */
        return { likes: 42 };
      },
    }),
  };
  ```

  In your client code, you can infer this handler return value with `ActionReturnType`:

  ```ts
  // client.ts
  import { actions, ActionReturnType } from 'astro:actions';

  type LikesResult = ActionReturnType<typeof actions.like>;
  // -> { likes: number }
  ```

- [#11436](https://github.com/withastro/astro/pull/11436) [`7dca68f`](https://github.com/withastro/astro/commit/7dca68ff2e0f089a3fd090650ee05b1942792fed) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes `astro:actions` autocompletion for the `defineAction` `accept` property

- [#11455](https://github.com/withastro/astro/pull/11455) [`645e128`](https://github.com/withastro/astro/commit/645e128537f1f20da6703afc115d06371d7da5dd) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves `astro:env` invalid variables errors

## 4.11.5

### Patch Changes

- [#11408](https://github.com/withastro/astro/pull/11408) [`b9e906f`](https://github.com/withastro/astro/commit/b9e906f8e75444739aa259b62489d9f5749260b9) Thanks [@matthewp](https://github.com/matthewp)! - Revert change to how boolean attributes work

## 4.11.4

### Patch Changes

- [#11362](https://github.com/withastro/astro/pull/11362) [`93993b7`](https://github.com/withastro/astro/commit/93993b77cf4915b4c0d245df9ecbf2265f5893e7) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where creating manually the i18n middleware could break the logic of the functions of the virtual module `astro:i18n`

- [#11349](https://github.com/withastro/astro/pull/11349) [`98d9ce4`](https://github.com/withastro/astro/commit/98d9ce41f20c8bf024c937e8bde80d3c3dbbed99) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro didn't throw an error when `Astro.rewrite` was used without providing the experimental flag

- [#11352](https://github.com/withastro/astro/pull/11352) [`a55ee02`](https://github.com/withastro/astro/commit/a55ee0268e1ca22597e9b5e6d1f24b4f28ad978b) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the rewrites didn't update the status code when using manual i18n routing.

- [#11388](https://github.com/withastro/astro/pull/11388) [`3a223b4`](https://github.com/withastro/astro/commit/3a223b4811708cc93ebb27706118c1723e1fc013) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Adjusts the color of punctuations in error overlay.

- [#11369](https://github.com/withastro/astro/pull/11369) [`e6de11f`](https://github.com/withastro/astro/commit/e6de11f4a941e29123da3714e5b8f17d25744f0f) Thanks [@bluwy](https://github.com/bluwy)! - Fixes attribute rendering for non-boolean attributes with boolean values

## 4.11.3

### Patch Changes

- [#11347](https://github.com/withastro/astro/pull/11347) [`33bdc54`](https://github.com/withastro/astro/commit/33bdc5472929f72fa8e39624598bf929c48e60c0) Thanks [@bluwy](https://github.com/bluwy)! - Fixes installed packages detection when running `astro check`

- [#11327](https://github.com/withastro/astro/pull/11327) [`0df8142`](https://github.com/withastro/astro/commit/0df81422a81c8f8900684d100e9b8f26365fa0b1) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue with the container APIs where a runtime error was thrown during the build, when using `pnpm` as package manager.

## 4.11.2

### Patch Changes

- [#11335](https://github.com/withastro/astro/pull/11335) [`4c4741b`](https://github.com/withastro/astro/commit/4c4741b42dc531403f7b9647bd51951d0cdb8f5b) Thanks [@ematipico](https://github.com/ematipico)! - Reverts [#11292](https://github.com/withastro/astro/pull/11292), which caused a regression to the input type

- [#11326](https://github.com/withastro/astro/pull/11326) [`41121fb`](https://github.com/withastro/astro/commit/41121fbe00e144d4d93835811e1c4349664d9003) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where running `astro sync` when using the experimental `astro:env` feature would fail if environment variables were missing

- [#11338](https://github.com/withastro/astro/pull/11338) [`9752a0b`](https://github.com/withastro/astro/commit/9752a0b27526270fd0066f3db7049e9ae6af1ef8) Thanks [@zaaakher](https://github.com/zaaakher)! - Fixes svg icon margin in devtool tooltip title to look coherent in `rtl` and `ltr` layouts

- [#11331](https://github.com/withastro/astro/pull/11331) [`f1b78a4`](https://github.com/withastro/astro/commit/f1b78a496034d53b0e9dfc276a4a1b1d691772c4) Thanks [@bluwy](https://github.com/bluwy)! - Removes `resolve` package and simplify internal resolve check

- [#11339](https://github.com/withastro/astro/pull/11339) [`8fdbf0e`](https://github.com/withastro/astro/commit/8fdbf0e45beffdae3da1e7f36797575c92f8a0ba) Thanks [@matthewp](https://github.com/matthewp)! - Remove non-fatal errors from telemetry

  Previously we tracked non-fatal errors in telemetry to get a good idea of the types of errors that occur in `astro dev`. However this has become noisy over time and results in a lot of data that isn't particularly useful. This removes those non-fatal errors from being tracked.

## 4.11.1

### Patch Changes

- [#11308](https://github.com/withastro/astro/pull/11308) [`44c61dd`](https://github.com/withastro/astro/commit/44c61ddfd85f1c23f8cec8caeaa5e25897121996) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where custom `404.astro` and `500.astro` were not returning the correct status code when rendered inside a rewriting cycle.

- [#11302](https://github.com/withastro/astro/pull/11302) [`0622567`](https://github.com/withastro/astro/commit/06225673269201044358788f2a81dbe13912adce) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue with the view transition router when redirecting to an URL with different origin.

- Updated dependencies [[`b6afe6a`](https://github.com/withastro/astro/commit/b6afe6a782f68f4a279463a144baaf99cb96b6dc), [`41064ce`](https://github.com/withastro/astro/commit/41064cee78c1cccd428f710a24c483aeb275fd95)]:
  - @astrojs/markdown-remark@5.1.1
  - @astrojs/internal-helpers@0.4.1

## 4.11.0

### Minor Changes

- [#11197](https://github.com/withastro/astro/pull/11197) [`4b46bd9`](https://github.com/withastro/astro/commit/4b46bd9bdcbb302f294aa27b8aa07099e104fa17) Thanks [@braebo](https://github.com/braebo)! - Adds [`ShikiTransformer`](https://shiki.style/packages/transformers#shikijs-transformers) support to the [`<Code />`](https://docs.astro.build/en/reference/api-reference/#code-) component with a new `transformers` prop.

  Note that `transformers` only applies classes and you must provide your own CSS rules to target the elements of your code block.

  ```astro
  ---
  import { transformerNotationFocus } from '@shikijs/transformers';
  import { Code } from 'astro:components';

  const code = `const foo = 'hello'
  const bar = ' world'
  console.log(foo + bar) // [!code focus]
  `;
  ---

  <Code {code} lang="js" transformers={[transformerNotationFocus()]} />

  <style is:global>
    pre.has-focused .line:not(.focused) {
      filter: blur(1px);
    }
  </style>
  ```

- [#11134](https://github.com/withastro/astro/pull/11134) [`9042be0`](https://github.com/withastro/astro/commit/9042be049157ce859355f911565bc0c3d68f0aa1) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the developer experience of the `500.astro` file by passing it a new `error` prop.

  When an error is thrown, the special `src/pages/500.astro` page now automatically receives the error as a prop. This allows you to display more specific information about the error on a custom 500 page.

  ```astro
  ---
  // src/pages/500.astro
  interface Props {
    error: unknown;
  }

  const { error } = Astro.props;
  ---

  <div>{error instanceof Error ? error.message : 'Unknown error'}</div>
  ```

  If an error occurs rendering this page, your host's default 500 error page will be shown to your visitor in production, and Astro's default error overlay will be shown in development.

### Patch Changes

- [#11280](https://github.com/withastro/astro/pull/11280) [`fd3645f`](https://github.com/withastro/astro/commit/fd3645fe8364ec5e280b6802d1468867890d463c) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that prevented cookies from being set when using experimental rewrites

- [#11275](https://github.com/withastro/astro/pull/11275) [`bab700d`](https://github.com/withastro/astro/commit/bab700d69085b1de8f03fc1b0b31651f709cbfe3) Thanks [@syhily](https://github.com/syhily)! - Drop duplicated brackets in data collections schema generation.

- [#11272](https://github.com/withastro/astro/pull/11272) [`ea987d7`](https://github.com/withastro/astro/commit/ea987d7da589ead9aa4b550f167f5e2f6c939d2e) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where rewriting `/` would cause an issue, when `trailingSlash` was set to `"never"`.

- [#11272](https://github.com/withastro/astro/pull/11272) [`ea987d7`](https://github.com/withastro/astro/commit/ea987d7da589ead9aa4b550f167f5e2f6c939d2e) Thanks [@ematipico](https://github.com/ematipico)! - Reverts a logic where it wasn't possible to rewrite `/404` in static mode. It's **now possible** again

- [#11264](https://github.com/withastro/astro/pull/11264) [`5a9c9a6`](https://github.com/withastro/astro/commit/5a9c9a60e7c32aa461b86b5bc667cb955e23d4d9) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes type generation for empty content collections

- [#11279](https://github.com/withastro/astro/pull/11279) [`9a08d74`](https://github.com/withastro/astro/commit/9a08d74bc00ae2c3bc254f99580a22ce4df1d002) Thanks [@ascorbic](https://github.com/ascorbic)! - Improves type-checking and error handling to catch case where an image import is passed directly to `getImage()`

- [#11292](https://github.com/withastro/astro/pull/11292) [`7f8f347`](https://github.com/withastro/astro/commit/7f8f34799528ed0b2011e1ea273bd0636f6e767d) Thanks [@jdtjenkins](https://github.com/jdtjenkins)! - Fixes a case where `defineAction` autocomplete for the `accept` prop would not show `"form"` as a possible value

- [#11273](https://github.com/withastro/astro/pull/11273) [`cb4d078`](https://github.com/withastro/astro/commit/cb4d07819f0dbdfd94bc4f084edf7720ada01323) Thanks [@ascorbic](https://github.com/ascorbic)! - Corrects an inconsistency in dev where middleware would run for prerendered 404 routes.
  Middleware is not run for prerendered 404 routes in production, so this was incorrect.

- [#11284](https://github.com/withastro/astro/pull/11284) [`f4b029b`](https://github.com/withastro/astro/commit/f4b029b08264268c68fc81ea25b264e81f47e683) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue that would break `Astro.request.url` and `Astro.request.headers` in `astro dev` if HTTP/2 was enabled.

  HTTP/2 is now enabled by default in `astro dev` if `https` is configured in the Vite config.

## 4.10.3

### Patch Changes

- [#11213](https://github.com/withastro/astro/pull/11213) [`94ac7ef`](https://github.com/withastro/astro/commit/94ac7efd70fd264b10887805a02d5d1877af8701) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `PUBLIC_` prefix constraint for `astro:env` public variables

- [#11213](https://github.com/withastro/astro/pull/11213) [`94ac7ef`](https://github.com/withastro/astro/commit/94ac7efd70fd264b10887805a02d5d1877af8701) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - **BREAKING CHANGE to the experimental `astro:env` feature only**

  Server secrets specified in the schema must now be imported from `astro:env/server`. Using `getSecret()` is no longer required to use these environment variables in your schema:

  ```diff
  - import { getSecret } from 'astro:env/server'
  - const API_SECRET = getSecret("API_SECRET")
  + import { API_SECRET } from 'astro:env/server'
  ```

  Note that using `getSecret()` with these keys is still possible, but no longer involves any special handling and the raw value will be returned, just like retrieving secrets not specified in your schema.

- [#11234](https://github.com/withastro/astro/pull/11234) [`4385bf7`](https://github.com/withastro/astro/commit/4385bf7a4dc9c65bff53a30c660f7a909fcabfc9) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new function called `addServerRenderer` to the Container API. Use this function to manually store renderers inside the instance of your container.

  This new function should be preferred when using the Container API in environments like on-demand pages:

  ```ts
  import type { APIRoute } from 'astro';
  import { experimental_AstroContainer } from 'astro/container';
  import reactRenderer from '@astrojs/react/server.js';
  import vueRenderer from '@astrojs/vue/server.js';
  import ReactComponent from '../components/button.jsx';
  import VueComponent from '../components/button.vue';

  // MDX runtime is contained inside the Astro core
  import mdxRenderer from 'astro/jsx/server.js';

  // In case you need to import a custom renderer
  import customRenderer from '../renderers/customRenderer.js';

  export const GET: APIRoute = async (ctx) => {
    const container = await experimental_AstroContainer.create();
    container.addServerRenderer({ renderer: reactRenderer });
    container.addServerRenderer({ renderer: vueRenderer });
    container.addServerRenderer({ renderer: customRenderer });
    // You can pass a custom name too
    container.addServerRenderer({
      name: 'customRenderer',
      renderer: customRenderer,
    });
    const vueComponent = await container.renderToString(VueComponent);
    return await container.renderToResponse(Component);
  };
  ```

- [#11249](https://github.com/withastro/astro/pull/11249) [`de60c69`](https://github.com/withastro/astro/commit/de60c69aa06c41f76a5510cc1d0bee4c8a5326a5) Thanks [@markgaze](https://github.com/markgaze)! - Fixes a performance issue with JSON schema generation

- [#11242](https://github.com/withastro/astro/pull/11242) [`e4fc2a0`](https://github.com/withastro/astro/commit/e4fc2a0bafb4723566552d0c5954b25447890f51) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where the virtual module `astro:container` wasn't resolved

- [#11236](https://github.com/withastro/astro/pull/11236) [`39bc3a5`](https://github.com/withastro/astro/commit/39bc3a5e8161232d6fdc6cc52b1f246083966d8e) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a case where symlinked content collection directories were not correctly resolved

- [#11258](https://github.com/withastro/astro/pull/11258) [`d996db6`](https://github.com/withastro/astro/commit/d996db6f0bf361ebd84b23d022db7bb10fb316e6) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a new error `RewriteWithBodyUsed` that throws when `Astro.rewrite` is used after the request body has already been read.

- [#11243](https://github.com/withastro/astro/pull/11243) [`ba2b14c`](https://github.com/withastro/astro/commit/ba2b14cc28bd219c241313cdf142b736e7442014) Thanks [@V3RON](https://github.com/V3RON)! - Fixes a prerendering issue for libraries in `node_modules` when a folder with an underscore is in the path.

- [#11244](https://github.com/withastro/astro/pull/11244) [`d07d2f7`](https://github.com/withastro/astro/commit/d07d2f7ac9d87af907beaca700ba4116dc1d6f37) Thanks [@ematipico](https://github.com/ematipico)! - Improves the developer experience of the custom `500.astro` page in development mode.

  Before, in development, an error thrown during the rendering phase would display the default error overlay, even when users had the `500.astro` page.

  Now, the development server will display the `500.astro` and the original error is logged in the console.

- [#11240](https://github.com/withastro/astro/pull/11240) [`2851b0a`](https://github.com/withastro/astro/commit/2851b0aa2e2abe80ea603b53c67770e94980a8d3) Thanks [@ascorbic](https://github.com/ascorbic)! - Ignores query strings in module identifiers when matching ".astro" file extensions in Vite plugin

- [#11245](https://github.com/withastro/astro/pull/11245) [`e22be22`](https://github.com/withastro/astro/commit/e22be22e5729e60220726e92b52d2833c937fd1c) Thanks [@bluwy](https://github.com/bluwy)! - Refactors prerendering chunk handling to correctly remove unused code during the SSR runtime

## 4.10.2

### Patch Changes

- [#11231](https://github.com/withastro/astro/pull/11231) [`58d7dbb`](https://github.com/withastro/astro/commit/58d7dbb5e0cabea1ac7a35af5b46685fce50d723) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression for `getViteConfig`, where the inline config wasn't merged in the final config.

- [#11228](https://github.com/withastro/astro/pull/11228) [`1e293a1`](https://github.com/withastro/astro/commit/1e293a1b819024f16bfe482f272df0678cdd7874) Thanks [@ascorbic](https://github.com/ascorbic)! - Updates `getCollection()` to always return a cloned array

- [#11207](https://github.com/withastro/astro/pull/11207) [`7d9aac3`](https://github.com/withastro/astro/commit/7d9aac376c4b8844917901f7f566f7259d7f66c8) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue in the rewriting logic where old data was not purged during the rewrite flow. This caused some false positives when checking the validity of URL path names during the rendering phase.

- [#11189](https://github.com/withastro/astro/pull/11189) [`75a8fe7`](https://github.com/withastro/astro/commit/75a8fe7e72b95f20c36f034de2b51b6a9550e27e) Thanks [@ematipico](https://github.com/ematipico)! - Improve error message when using `getLocaleByPath` on path that doesn't contain any locales.

- [#11195](https://github.com/withastro/astro/pull/11195) [`0a6ab6f`](https://github.com/withastro/astro/commit/0a6ab6f562651b558ca90761feed5c07f54f2633) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds support for enums to `astro:env`

  You can now call `envField.enum`:

  ```js
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    experimental: {
      env: {
        schema: {
          API_VERSION: envField.enum({
            context: 'server',
            access: 'secret',
            values: ['v1', 'v2'],
          }),
        },
      },
    },
  });
  ```

- [#11210](https://github.com/withastro/astro/pull/11210) [`66fc028`](https://github.com/withastro/astro/commit/66fc0283d3f1d1a4f17d7db65ca3521a01fb5bec) Thanks [@matthewp](https://github.com/matthewp)! - Close the iterator only after rendering is complete

- [#11195](https://github.com/withastro/astro/pull/11195) [`0a6ab6f`](https://github.com/withastro/astro/commit/0a6ab6f562651b558ca90761feed5c07f54f2633) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds additional validation options to `astro:env`

  `astro:env` schema datatypes `string` and `number` now have new optional validation rules:

  ```js
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    experimental: {
      env: {
        schema: {
          FOO: envField.string({
            // ...
            max: 32,
            min: 3,
            length: 12,
            url: true,
            includes: 'foo',
            startsWith: 'bar',
            endsWith: 'baz',
          }),
          BAR: envField.number({
            // ...
            gt: 2,
            min: 3,
            lt: 10,
            max: 9,
            int: true,
          }),
        },
      },
    },
  });
  ```

- [#11211](https://github.com/withastro/astro/pull/11211) [`97724da`](https://github.com/withastro/astro/commit/97724da93ed7b1db19632c0cdb4b3aab1ff84812) Thanks [@matthewp](https://github.com/matthewp)! - Let middleware handle the original request URL

- [#10607](https://github.com/withastro/astro/pull/10607) [`7327c6a`](https://github.com/withastro/astro/commit/7327c6acb197e1f2ea6cf94cfbc5700bc755f982) Thanks [@frankbits](https://github.com/frankbits)! - Fixes an issue where a leading slash created incorrect conflict resolution between pages generated from static routes and catch-all dynamic routes

## 4.10.1

### Patch Changes

- [#11198](https://github.com/withastro/astro/pull/11198) [`8b9a499`](https://github.com/withastro/astro/commit/8b9a499d3733e9d0fc6a0bd067ece19bd36f4726) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `astro:env` `getSecret` would not retrieve environment variables properly in dev and build modes

- [#11206](https://github.com/withastro/astro/pull/11206) [`734b98f`](https://github.com/withastro/astro/commit/734b98fecf0212cd76be3c935a49f84a9a7dab34) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - **BREAKING CHANGE to the experimental `astro:env` feature only**

  Updates the adapter `astro:env` entrypoint from `astro:env/setup` to `astro/env/setup`

- [#11205](https://github.com/withastro/astro/pull/11205) [`8c45391`](https://github.com/withastro/astro/commit/8c4539145f0b6a735b65852b2f2b1a7e9f5a9c3f) Thanks [@Nin3lee](https://github.com/Nin3lee)! - Fixes a typo in the config reference

## 4.10.0

### Minor Changes

- [#10974](https://github.com/withastro/astro/pull/10974) [`2668ef9`](https://github.com/withastro/astro/commit/2668ef984104574f25f29ef75e2572a0745d1666) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds experimental support for the `astro:env` API.

  The `astro:env` API lets you configure a type-safe schema for your environment variables, and indicate whether they should be available on the server or the client. Import and use your defined variables from the appropriate `/client` or `/server` module:

  ```astro
  ---
  import { PUBLIC_APP_ID } from 'astro:env/client';
  import { PUBLIC_API_URL, getSecret } from 'astro:env/server';
  const API_TOKEN = getSecret('API_TOKEN');

  const data = await fetch(`${PUBLIC_API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ appId: PUBLIC_APP_ID }),
  });
  ---
  ```

  To define the data type and properties of your environment variables, declare a schema in your Astro config in `experimental.env.schema`. The `envField` helper allows you define your variable as a string, number, or boolean and pass properties in an object:

  ```js
  // astro.config.mjs
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    experimental: {
      env: {
        schema: {
          PUBLIC_API_URL: envField.string({ context: 'client', access: 'public', optional: true }),
          PUBLIC_PORT: envField.number({ context: 'server', access: 'public', default: 4321 }),
          API_SECRET: envField.string({ context: 'server', access: 'secret' }),
        },
      },
    },
  });
  ```

  There are three kinds of environment variables, determined by the combination of `context` (`client` or `server`) and `access` (`private` or `public`) settings defined in your [`env.schema`](#experimentalenvschema):

  - **Public client variables**: These variables end up in both your final client and server bundles, and can be accessed from both client and server through the `astro:env/client` module:

    ```js
    import { PUBLIC_API_URL } from 'astro:env/client';
    ```

  - **Public server variables**: These variables end up in your final server bundle and can be accessed on the server through the `astro:env/server` module:

    ```js
    import { PUBLIC_PORT } from 'astro:env/server';
    ```

  - **Secret server variables**: These variables are not part of your final bundle and can be accessed on the server through the `getSecret()` helper function available from the `astro:env/server` module:

    ```js
    import { getSecret } from 'astro:env/server';

    const API_SECRET = getSecret('API_SECRET'); // typed
    const SECRET_NOT_IN_SCHEMA = getSecret('SECRET_NOT_IN_SCHEMA'); // string | undefined
    ```

  **Note:** Secret client variables are not supported because there is no safe way to send this data to the client. Therefore, it is not possible to configure both `context: "client"` and `access: "secret"` in your schema.

  To learn more, check out [the documentation](https://docs.astro.build/en/reference/configuration-reference/#experimentalenv).

### Patch Changes

- [#11192](https://github.com/withastro/astro/pull/11192) [`58b10a0`](https://github.com/withastro/astro/commit/58b10a073192030a251cff8ad706ab5b015180c9) Thanks [@liruifengv](https://github.com/liruifengv)! - Improves DX by throwing the original `AstroUserError` when an error is thrown inside a `.mdx` file.

- [#11136](https://github.com/withastro/astro/pull/11136) [`35ef53c`](https://github.com/withastro/astro/commit/35ef53c0897c0d360efc086a71c5f4406721d2fe) Thanks [@ematipico](https://github.com/ematipico)! - Errors that are emitted during a rewrite are now bubbled up and shown to the user. A 404 response is not returned anymore.

- [#11144](https://github.com/withastro/astro/pull/11144) [`803dd80`](https://github.com/withastro/astro/commit/803dd8061df02138b4928442bcb76e77dcf6f5e7) Thanks [@ematipico](https://github.com/ematipico)! - The integration now exposes a function called `getContainerRenderer`, that can be used inside the Container APIs to load the relative renderer.

  ```js
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import ReactWrapper from '../src/components/ReactWrapper.astro';
  import { loadRenderers } from 'astro:container';
  import { getContainerRenderer } from '@astrojs/react';

  test('ReactWrapper with react renderer', async () => {
    const renderers = await loadRenderers([getContainerRenderer()]);
    const container = await AstroContainer.create({
      renderers,
    });
    const result = await container.renderToString(ReactWrapper);

    expect(result).toContain('Counter');
    expect(result).toContain('Count: <!-- -->5');
  });
  ```

- [#11144](https://github.com/withastro/astro/pull/11144) [`803dd80`](https://github.com/withastro/astro/commit/803dd8061df02138b4928442bcb76e77dcf6f5e7) Thanks [@ematipico](https://github.com/ematipico)! - **BREAKING CHANGE to the experimental Container API only**

  Changes the **type** of the `renderers` option of the `AstroContainer::create` function and adds a dedicated function `loadRenderers()` to load the rendering scripts from renderer integration packages (`@astrojs/react`, `@astrojs/preact`, `@astrojs/solid-js`, `@astrojs/svelte`, `@astrojs/vue`, `@astrojs/lit`, and `@astrojs/mdx`).

  You no longer need to know the individual, direct file paths to the client and server rendering scripts for each renderer integration package. Now, there is a dedicated function to load the renderer from each package, which is available from `getContainerRenderer()`:

  ```diff
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import ReactWrapper from '../src/components/ReactWrapper.astro';
  import { loadRenderers } from "astro:container";
  import { getContainerRenderer } from "@astrojs/react";

  test('ReactWrapper with react renderer', async () => {
  + const renderers = await loadRenderers([getContainerRenderer()])
  - const renderers = [
  - {
  -  name: '@astrojs/react',
  -   clientEntrypoint: '@astrojs/react/client.js',
  -   serverEntrypoint: '@astrojs/react/server.js',
  -  },
  - ];
    const container = await AstroContainer.create({
      renderers,
    });
    const result = await container.renderToString(ReactWrapper);

    expect(result).toContain('Counter');
    expect(result).toContain('Count: <!-- -->5');
  });
  ```

  The new `loadRenderers()` helper function is available from `astro:container`, a virtual module that can be used when running the Astro container inside `vite`.

- [#11136](https://github.com/withastro/astro/pull/11136) [`35ef53c`](https://github.com/withastro/astro/commit/35ef53c0897c0d360efc086a71c5f4406721d2fe) Thanks [@ematipico](https://github.com/ematipico)! - It's not possible anymore to use `Astro.rewrite("/404")` inside static pages. This isn't counterproductive because Astro will end-up emitting a page that contains the HTML of 404 error page.

  It's still possible to use `Astro.rewrite("/404")` inside on-demand pages, or pages that opt-out from prerendering.

- [#11191](https://github.com/withastro/astro/pull/11191) [`6e29a17`](https://github.com/withastro/astro/commit/6e29a172f153d15fac07320488fae01dece71748) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a case where `Astro.url` would be incorrect when having `build.format` set to `'preserve'` in the Astro config

- [#11182](https://github.com/withastro/astro/pull/11182) [`40b0b4d`](https://github.com/withastro/astro/commit/40b0b4d1e4ef1aa95d5e9011652444b855ab0b9c) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where `Astro.rewrite` wasn't carrying over the body of a `Request` in on-demand pages.

- [#11194](https://github.com/withastro/astro/pull/11194) [`97fbe93`](https://github.com/withastro/astro/commit/97fbe938a9b07d52d61011da4bd5a8b5ad85a700) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the function `getViteConfig` wasn't returning the correct merged Astro configuration

## 4.9.3

### Patch Changes

- [#11171](https://github.com/withastro/astro/pull/11171) [`ff8004f`](https://github.com/withastro/astro/commit/ff8004f6a7b2aab4c6ac367f13744a341c3c5462) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Guard globalThis.astroAsset usage in proxy code to avoid errors in wonky situations

- [#11178](https://github.com/withastro/astro/pull/11178) [`1734c49`](https://github.com/withastro/astro/commit/1734c49f516ff7d778d6724a0db6d39649921b4b) Thanks [@theoephraim](https://github.com/theoephraim)! - Improves `isPromise` utility to check the presence of `then` on an object before trying to access it - which can cause undesired side-effects on Proxy objects

- [#11183](https://github.com/withastro/astro/pull/11183) [`3cfa2ac`](https://github.com/withastro/astro/commit/3cfa2ac7e51d7bea96980403c393f9bcda1e9375) Thanks [@66Leo66](https://github.com/66Leo66)! - Suggest `pnpm dlx` instead of `pnpx` in update check.

- [#11147](https://github.com/withastro/astro/pull/11147) [`2d93902`](https://github.com/withastro/astro/commit/2d93902f4c51dcc62b077b0546ead688e6f32c63) Thanks [@kitschpatrol](https://github.com/kitschpatrol)! - Fixes invalid MIME types in Picture source elements for jpg and svg extensions, which was preventing otherwise valid source variations from being shown by the browser

- [#11141](https://github.com/withastro/astro/pull/11141) [`19df89f`](https://github.com/withastro/astro/commit/19df89f87c74205ebc76aeac43ca20b00694acec) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an internal error that prevented the `AstroContainer` to render the `Content` component.

  You can now write code similar to the following to render content collections:

  ```js
  const entry = await getEntry(collection, slug);
  const { Content } = await entry.render();
  const content = await container.renderToString(Content);
  ```

- [#11170](https://github.com/withastro/astro/pull/11170) [`ba20c71`](https://github.com/withastro/astro/commit/ba20c718a4ccd1009bdf81f8265956bff1d19d05) Thanks [@matthewp](https://github.com/matthewp)! - Retain client scripts in content cache

## 4.9.2

### Patch Changes

- [#11138](https://github.com/withastro/astro/pull/11138) [`98e0372`](https://github.com/withastro/astro/commit/98e0372cfd47a3e025be2ac68d1e9ebf06cf548b) Thanks [@ematipico](https://github.com/ematipico)! - You can now pass `props` when rendering a component using the Container APIs:

  ```js
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import Card from '../src/components/Card.astro';

  const container = await AstroContainer.create();
  const result = await container.renderToString(Card, {
    props: {
      someState: true,
    },
  });
  ```

## 4.9.1

### Patch Changes

- [#11129](https://github.com/withastro/astro/pull/11129) [`4bb9269`](https://github.com/withastro/astro/commit/4bb926908d9a7ee134701c3e5a1b5e6ea688f843) Thanks [@matthewp](https://github.com/matthewp)! - Prevent errors from adapters when i18n domains is not used

## 4.9.0

### Minor Changes

- [#11051](https://github.com/withastro/astro/pull/11051) [`12a1bcc`](https://github.com/withastro/astro/commit/12a1bccc818af292cdd2a8ed0f3e3c042b9819b4) Thanks [@ematipico](https://github.com/ematipico)! - Introduces an experimental Container API to render `.astro` components in isolation.

  This API introduces three new functions to allow you to create a new container and render an Astro component returning either a string or a Response:

  - `create()`: creates a new instance of the container.
  - `renderToString()`: renders a component and return a string.
  - `renderToResponse()`: renders a component and returns the `Response` emitted by the rendering phase.

  The first supported use of this new API is to enable unit testing. For example, with `vitest`, you can create a container to render your component with test data and check the result:

  ```js
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import { expect, test } from 'vitest';
  import Card from '../src/components/Card.astro';

  test('Card with slots', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Card, {
      slots: {
        default: 'Card content',
      },
    });

    expect(result).toContain('This is a card');
    expect(result).toContain('Card content');
  });
  ```

  For a complete reference, see the [Container API docs](https://docs.astro.build/en/reference/container-reference/).

  For a feature overview, and to give feedback on this experimental API, see the [Container API roadmap discussion](https://github.com/withastro/roadmap/pull/916).

- [#11021](https://github.com/withastro/astro/pull/11021) [`2d4c8fa`](https://github.com/withastro/astro/commit/2d4c8faa56a64d963fe7847b5be2d7a59e12ed5b) Thanks [@ematipico](https://github.com/ematipico)! - The CSRF protection feature that was introduced behind a flag in [v4.6.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#460) is no longer experimental and is available for general use.

  To enable the stable version, add the new top-level `security` option in `astro.config.mjs`. If you were previously using the experimental version of this feature, also delete the experimental flag:

  ```diff
  export default defineConfig({
  -  experimental: {
  -    security: {
  -      csrfProtection: {
  -        origin: true
  -      }
  -    }
  -  },
  +  security: {
  +    checkOrigin: true
  +  }
  })
  ```

  Enabling this setting performs a check that the `"origin"` header, automatically passed by all modern browsers, matches the URL sent by each Request.

  This check is executed only for pages rendered on demand, and only for the requests `POST`, `PATCH`, `DELETE` and `PUT` with one of the following `"content-type"` headers: `'application/x-www-form-urlencoded'`, `'multipart/form-data'`, `'text/plain'`.

  If the `"origin"` header doesn't match the pathname of the request, Astro will return a 403 status code and won't render the page.

  For more information, see the [`security` configuration docs](https://docs.astro.build/en/reference/configuration-reference/#security).

- [#11022](https://github.com/withastro/astro/pull/11022) [`be68ab4`](https://github.com/withastro/astro/commit/be68ab47e236476ba980cbf74daf85f27cd866f4) Thanks [@ematipico](https://github.com/ematipico)! - The `i18nDomains` routing feature introduced behind a flag in [v3.4.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#430) is no longer experimental and is available for general use.

  This routing option allows you to configure different domains for individual locales in entirely server-rendered projects using the [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) or [@astrojs/vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/) adapter with a `site` configured.

  If you were using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    i18nDomains: true,
  -  }
  })
  ```

  If you have been waiting for stabilization before using this routing option, you can now do so.

  Please see [the internationalization docs](https://docs.astro.build/en/guides/internationalization/#domains) for more about this feature.

- [#11071](https://github.com/withastro/astro/pull/11071) [`8ca7c73`](https://github.com/withastro/astro/commit/8ca7c731dea894e77f84b314ebe3a141d5daa918) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds two new functions `experimental_getActionState()` and `experimental_withState()` to support [the React 19 `useActionState()` hook](https://react.dev/reference/react/useActionState) when using Astro Actions. This introduces progressive enhancement when calling an Action with the `withState()` utility.

  This example calls a `like` action that accepts a `postId` and returns the number of likes. Pass this action to the `experimental_withState()` function to apply progressive enhancement info, and apply to `useActionState()` to track the result:

  ```tsx
  import { actions } from 'astro:actions';
  import { experimental_withState } from '@astrojs/react/actions';

  export function Like({ postId }: { postId: string }) {
    const [state, action, pending] = useActionState(
      experimental_withState(actions.like),
      0, // initial likes
    );

    return (
      <form action={action}>
        <input type="hidden" name="postId" value={postId} />
        <button disabled={pending}>{state} ❤️</button>
      </form>
    );
  }
  ```

  You can also access the state stored by `useActionState()` from your action `handler`. Call `experimental_getActionState()` with the API context, and optionally apply a type to the result:

  ```ts
  import { defineAction, z } from 'astro:actions';
  import { experimental_getActionState } from '@astrojs/react/actions';

  export const server = {
    like: defineAction({
      input: z.object({
        postId: z.string(),
      }),
      handler: async ({ postId }, ctx) => {
        const currentLikes = experimental_getActionState<number>(ctx);
        // write to database
        return currentLikes + 1;
      },
    }),
  };
  ```

- [#11101](https://github.com/withastro/astro/pull/11101) [`a6916e4`](https://github.com/withastro/astro/commit/a6916e4402bf5b7d74bab784a54eba63fd1d1179) Thanks [@linguofeng](https://github.com/linguofeng)! - Updates Astro's code for adapters to use the header `x-forwarded-for` to initialize the `clientAddress`.

  To take advantage of the new change, integration authors must upgrade the version of Astro in their adapter `peerDependencies` to `4.9.0`.

- [#11071](https://github.com/withastro/astro/pull/11071) [`8ca7c73`](https://github.com/withastro/astro/commit/8ca7c731dea894e77f84b314ebe3a141d5daa918) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds compatibility for Astro Actions in the React 19 beta. Actions can be passed to a `form action` prop directly, and Astro will automatically add metadata for progressive enhancement.

  ```tsx
  import { actions } from 'astro:actions';

  function Like() {
    return (
      <form action={actions.like}>
        {/* auto-inserts hidden input for progressive enhancement */}
        <button type="submit">Like</button>
      </form>
    );
  }
  ```

### Patch Changes

- [#11088](https://github.com/withastro/astro/pull/11088) [`9566fa0`](https://github.com/withastro/astro/commit/9566fa08608be766df355be17d72a39ea7b99ed0) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Allow actions to be called on the server. This allows you to call actions as utility functions in your Astro frontmatter, endpoints, and server-side UI components.

  Import and call directly from `astro:actions` as you would for client actions:

  ```astro
  ---
  // src/pages/blog/[postId].astro
  import { actions } from 'astro:actions';

  await actions.like({ postId: Astro.params.postId });
  ---
  ```

- [#11112](https://github.com/withastro/astro/pull/11112) [`29a8650`](https://github.com/withastro/astro/commit/29a8650375053cd5690a32bed4140f0fef11c705) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Deprecate the `getApiContext()` function. API Context can now be accessed from the second parameter to your Action `handler()`:

  ```diff
  // src/actions/index.ts
  import {
    defineAction,
    z,
  -  getApiContext,
  } from 'astro:actions';

  export const server = {
    login: defineAction({
      input: z.object({ id: z.string }),
  +    handler(input, context) {
        const user = context.locals.auth(input.id);
        return user;
      }
    }),
  }
  ```

## 4.8.7

### Patch Changes

- [#11073](https://github.com/withastro/astro/pull/11073) [`f5c8fee`](https://github.com/withastro/astro/commit/f5c8fee76c5e688ef23c18be79705b18f1750415) Thanks [@matthewp](https://github.com/matthewp)! - Prevent cache content from being left in dist folder

  When `contentCollectionsCache` is enabled temporary cached content is copied into the `outDir` for processing. This fixes it so that this content is cleaned out, along with the rest of the temporary build JS.

- [#11054](https://github.com/withastro/astro/pull/11054) [`f6b171e`](https://github.com/withastro/astro/commit/f6b171ed50eed253b8ac005bd5e9d1841a8003dd) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Respect error status when handling Actions with a progressive fallback.

- [#11092](https://github.com/withastro/astro/pull/11092) [`bfe9c73`](https://github.com/withastro/astro/commit/bfe9c73536f0794e4f5ede5040adabbe0e705984) Thanks [@duckycoding-dev](https://github.com/duckycoding-dev)! - Change `slot` attribute of `IntrinsicAttributes` to match the definition of `HTMLAttributes`'s own `slot` attribute of type `string | undefined | null`

- [#10875](https://github.com/withastro/astro/pull/10875) [`b5f95b2`](https://github.com/withastro/astro/commit/b5f95b2fb156152fabf2a22e150037a8255006f9) Thanks [@W1M0R](https://github.com/W1M0R)! - Fixes a typo in a JSDoc annotation

- [#11111](https://github.com/withastro/astro/pull/11111) [`a5d79dd`](https://github.com/withastro/astro/commit/a5d79ddeb2d592de9eb2468471fdcf3eea5ef730) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix unexpected `headers` warning on prerendered routes when using Astro Actions.

- [#11081](https://github.com/withastro/astro/pull/11081) [`af42e05`](https://github.com/withastro/astro/commit/af42e0552054b3b4ac784ed78c60f80bfc38d8ca) Thanks [@V3RON](https://github.com/V3RON)! - Correctly position inspection tooltip in RTL mode

  When RTL mode is turned on, the inspection tooltip tend to overflow the window on the left side.
  Additional check has been added to prevent that.

## 4.8.6

### Patch Changes

- [#11084](https://github.com/withastro/astro/pull/11084) [`9637014`](https://github.com/withastro/astro/commit/9637014b1495a5a41cb384c7de4de410348f4cc0) Thanks [@bluwy](https://github.com/bluwy)! - Fixes regression when handling hoisted scripts from content collections

## 4.8.5

### Patch Changes

- [#11065](https://github.com/withastro/astro/pull/11065) [`1f988ed`](https://github.com/withastro/astro/commit/1f988ed10f4737b5333c9978115ee531786eb539) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug in the Astro rewrite logic, where rewriting the index with parameters - `next("/?foo=bar")` - didn't work as expected.

- [#10924](https://github.com/withastro/astro/pull/10924) [`3a0c02a`](https://github.com/withastro/astro/commit/3a0c02ae0357c267881b30454b5320075378894b) Thanks [@Its-Just-Nans](https://github.com/Its-Just-Nans)! - Handle image-size errors by displaying a clearer message

- [#11058](https://github.com/withastro/astro/pull/11058) [`749a7ac`](https://github.com/withastro/astro/commit/749a7ac967146952450a4173dcb6a5494755460c) Thanks [@matthewp](https://github.com/matthewp)! - Fix streaming in Node.js fast path

- [#11052](https://github.com/withastro/astro/pull/11052) [`a05ca38`](https://github.com/withastro/astro/commit/a05ca38c2cf327ae9130ee1c139a0e510b9da50a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where rewriting would conflict with the actions internal middleware

- [#11062](https://github.com/withastro/astro/pull/11062) [`16f12e4`](https://github.com/withastro/astro/commit/16f12e426e5869721313bb771e2ec5b821c5452e) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where `astro build` didn't create custom `404.html` and `500.html` when a certain combination of i18n options was applied

- [#10965](https://github.com/withastro/astro/pull/10965) [`a8f0372`](https://github.com/withastro/astro/commit/a8f0372ea71479ef80c58e74201dea6a5a2b2ae4) Thanks [@Elias-Chairi](https://github.com/Elias-Chairi)! - Update generator.ts to allow %23 (#) in dynamic urls

- [#11069](https://github.com/withastro/astro/pull/11069) [`240a70a`](https://github.com/withastro/astro/commit/240a70a29f8e11d161da021845c208f982d64e5c) Thanks [@ematipico](https://github.com/ematipico)! - Improves debug logging for on-demand pages

## 4.8.4

### Patch Changes

- [#11026](https://github.com/withastro/astro/pull/11026) [`8dfb1a2`](https://github.com/withastro/astro/commit/8dfb1a23cc5996c410f7e33211d132dac36c9f77) Thanks [@bluwy](https://github.com/bluwy)! - Skips rendering script tags if it's inlined and empty when `experimental.directRenderScript` is enabled

- [#11043](https://github.com/withastro/astro/pull/11043) [`d0d1710`](https://github.com/withastro/astro/commit/d0d1710439ec281518b17d03126b5d9cd008a102) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes minor type issues in actions component example

- [#10999](https://github.com/withastro/astro/pull/10999) [`5f353e3`](https://github.com/withastro/astro/commit/5f353e39b2b9fb15e6c9d193b5b5101457fef002) Thanks [@bluwy](https://github.com/bluwy)! - The prefetch feature is updated to better support different browsers and different cache headers setup, including:

  1. All prefetch strategies will now always try to use `<link rel="prefetch">` if supported, or will fall back to `fetch()`.
  2. The `prefetch()` programmatic API's `with` option is deprecated in favour of an automatic approach that will also try to use `<link rel="prefetch>` if supported, or will fall back to `fetch()`.

  This change shouldn't affect most sites and should instead make prefetching more effective.

- [#11041](https://github.com/withastro/astro/pull/11041) [`6cc3fb9`](https://github.com/withastro/astro/commit/6cc3fb97ec01af5a7c2153f5b3c22e92675f1e56) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes 500 errors when sending empty params or returning an empty response from an action.

- [#11028](https://github.com/withastro/astro/pull/11028) [`771d1f7`](https://github.com/withastro/astro/commit/771d1f7654e18b657c3eacfabae52ed88c76fa99) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Throw on missing server output when using Astro Actions.

- [#11029](https://github.com/withastro/astro/pull/11029) [`bd34452`](https://github.com/withastro/astro/commit/bd34452a34e9d90c948b1e454d184085cd591871) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Actions: include validation error in thrown error message for debugging.

- [#11046](https://github.com/withastro/astro/pull/11046) [`086694a`](https://github.com/withastro/astro/commit/086694ac31a5f3412a3dcdbbd95f0187316699c5) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes `getViteConfig()` type definition to allow passing an inline Astro configuration as second argument

- [#11026](https://github.com/withastro/astro/pull/11026) [`8dfb1a2`](https://github.com/withastro/astro/commit/8dfb1a23cc5996c410f7e33211d132dac36c9f77) Thanks [@bluwy](https://github.com/bluwy)! - Fixes CSS handling if imported in a script tag in an Astro file when `experimental.directRenderScript` is enabled

- [#11020](https://github.com/withastro/astro/pull/11020) [`2e2d6b7`](https://github.com/withastro/astro/commit/2e2d6b7442063c8eb32533d45eaf021c3fa0f615) Thanks [@xsynaptic](https://github.com/xsynaptic)! - Add type declarations for `import.meta.env.ASSETS_PREFIX` when defined as an object for handling different file types.

- [#11030](https://github.com/withastro/astro/pull/11030) [`18e7f33`](https://github.com/withastro/astro/commit/18e7f33ccd145292224cbeffde9fc30d143d97fb) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Actions: Fix missing message for custom Action errors.

- [#10981](https://github.com/withastro/astro/pull/10981) [`ad9227c`](https://github.com/withastro/astro/commit/ad9227c7d1474881fac9b1db15aa7b5a888b42b8) Thanks [@mo](https://github.com/mo)! - Adds deprecated HTML attribute "name" to the list of valid attributes. This attribute has been replaced by the global `id` attribute in recent versions of HTML.

- [#11013](https://github.com/withastro/astro/pull/11013) [`4ea38e7`](https://github.com/withastro/astro/commit/4ea38e733344304f7e18c226d1db3e8ac236055f) Thanks [@QingXia-Ela](https://github.com/QingXia-Ela)! - Prevents unhandledrejection error when checking for latest Astro version

- [#11034](https://github.com/withastro/astro/pull/11034) [`5f2dd45`](https://github.com/withastro/astro/commit/5f2dd4518e707d37f6f886764ca9b31c0d451fd4) Thanks [@arganaphang](https://github.com/arganaphang)! - Add `popovertargetaction` to the attribute that can be passed to the `button` and `input` element

## 4.8.3

### Patch Changes

- [#11006](https://github.com/withastro/astro/pull/11006) [`7418bb0`](https://github.com/withastro/astro/commit/7418bb054cf74a131877497b4b70cf0980de4c6b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix `locals` access from action handlers

## 4.8.2

### Patch Changes

- [#10990](https://github.com/withastro/astro/pull/10990) [`4161a2a`](https://github.com/withastro/astro/commit/4161a2a3d095eaf4d109b4ac49f11f6762bed017) Thanks [@liruifengv](https://github.com/liruifengv)! - fix incorrect actions path on windows

- [#10979](https://github.com/withastro/astro/pull/10979) [`6fa89e8`](https://github.com/withastro/astro/commit/6fa89e84c917f487be9f62875d85c61974e71590) Thanks [@BryceRussell](https://github.com/BryceRussell)! - Fix loading of non-index routes that end with `index.html`

## 4.8.1

### Patch Changes

- [#10987](https://github.com/withastro/astro/pull/10987) [`05db5f7`](https://github.com/withastro/astro/commit/05db5f78187efb53c5732b28e499c7977ceee496) Thanks [@ematipico](https://github.com/ematipico)! - Fix a regression where the flag `experimental.rewriting` was marked mandatory. Is is now optional.

- [#10975](https://github.com/withastro/astro/pull/10975) [`6b640b3`](https://github.com/withastro/astro/commit/6b640b3bcb74d21903d303e268ff8ecef90097e7) Thanks [@bluwy](https://github.com/bluwy)! - Passes the scoped style attribute or class to the `<picture>` element in the `<Picture />` component so scoped styling can be applied to the `<picture>` element

## 4.8.0

### Minor Changes

- [#10935](https://github.com/withastro/astro/pull/10935) [`ddd8e49`](https://github.com/withastro/astro/commit/ddd8e49d1a179bec82310fb471f822a1567a6610) Thanks [@bluwy](https://github.com/bluwy)! - Exports `astro/jsx/rehype.js` with utilities to generate an Astro metadata object

- [#10625](https://github.com/withastro/astro/pull/10625) [`698c2d9`](https://github.com/withastro/astro/commit/698c2d9bb51e20b38de405b6076fd6488ddb5c2b) Thanks [@goulvenclech](https://github.com/goulvenclech)! - Adds the ability for multiple pages to use the same component as an `entrypoint` when building an Astro integration. This change is purely internal, and aligns the build process with the behaviour in the development server.

- [#10906](https://github.com/withastro/astro/pull/10906) [`7bbd664`](https://github.com/withastro/astro/commit/7bbd66459dd29a338ac1dfae0e4c984cb08f73b3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new radio checkbox component to the dev toolbar UI library (`astro-dev-toolbar-radio-checkbox`)

- [#10963](https://github.com/withastro/astro/pull/10963) [`61f47a6`](https://github.com/withastro/astro/commit/61f47a684235a049cbfc4f2cbb5edff3befeced7) Thanks [@delucis](https://github.com/delucis)! - Adds support for passing an inline Astro configuration object to `getViteConfig()`

  If you are using `getViteConfig()` to configure the Vitest test runner, you can now pass a second argument to control how Astro is configured. This makes it possible to configure unit tests with different Astro options when using [Vitest’s workspaces](https://vitest.dev/guide/workspace.html) feature.

  ```js
  // vitest.config.ts
  import { getViteConfig } from 'astro/config';

  export default getViteConfig(
    /* Vite configuration */
    { test: {} },
    /* Astro configuration */
    {
      site: 'https://example.com',
      trailingSlash: 'never',
    },
  );
  ```

- [#10867](https://github.com/withastro/astro/pull/10867) [`47877a7`](https://github.com/withastro/astro/commit/47877a75404ccc8786bbea2171015fb088dc01a1) Thanks [@ematipico](https://github.com/ematipico)! - Adds experimental rewriting in Astro with a new `rewrite()` function and the middleware `next()` function.

  The feature is available via an experimental flag in `astro.config.mjs`:

  ```js
  export default defineConfig({
    experimental: {
      rewriting: true,
    },
  });
  ```

  When enabled, you can use `rewrite()` to **render** another page without changing the URL of the browser in Astro pages and endpoints.

  ```astro
  ---
  // src/pages/dashboard.astro
  if (!Astro.props.allowed) {
    return Astro.rewrite('/');
  }
  ---
  ```

  ```js
  // src/pages/api.js
  export function GET(ctx) {
    if (!ctx.locals.allowed) {
      return ctx.rewrite('/');
    }
  }
  ```

  The middleware `next()` function now accepts a parameter with the same type as the `rewrite()` function. For example, with `next("/")`, you can call the next middleware function with a new `Request`.

  ```js
  // src/middleware.js
  export function onRequest(ctx, next) {
    if (!ctx.cookies.get('allowed')) {
      return next('/'); // new signature
    }
    return next();
  }
  ```

  > **NOTE**: please [read the RFC](https://github.com/withastro/roadmap/blob/feat/reroute/proposals/0047-rerouting.md) to understand the current expectations of the new APIs.

- [#10858](https://github.com/withastro/astro/pull/10858) [`c0c509b`](https://github.com/withastro/astro/commit/c0c509b6bf3f55562d22297fdcc2b3e57969734d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds experimental support for the Actions API. Actions let you define type-safe endpoints you can query from client components with progressive enhancement built in.

  Actions help you write type-safe backend functions you can call from anywhere. Enable server rendering [using the `output` property](https://docs.astro.build/en/basics/rendering-modes/#on-demand-rendered) and add the `actions` flag to the `experimental` object:

  ```js
  {
    output: 'hybrid', // or 'server'
    experimental: {
      actions: true,
    },
  }
  ```

  Declare all your actions in `src/actions/index.ts`. This file is the global actions handler.

  Define an action using the `defineAction()` utility from the `astro:actions` module. These accept the `handler` property to define your server-side request handler. If your action accepts arguments, apply the `input` property to validate parameters with Zod.

  This example defines two actions: `like` and `comment`. The `like` action accepts a JSON object with a `postId` string, while the `comment` action accepts [FormData](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects) with `postId`, `author`, and `body` strings. Each `handler` updates your database and return a type-safe response.

  ```ts
  // src/actions/index.ts
  import { defineAction, z } from 'astro:actions';

  export const server = {
    like: defineAction({
      input: z.object({ postId: z.string() }),
      handler: async ({ postId }) => {
        // update likes in db

        return likes;
      },
    }),
    comment: defineAction({
      accept: 'form',
      input: z.object({
        postId: z.string(),

        body: z.string(),
      }),
      handler: async ({ postId }) => {
        // insert comments in db

        return comment;
      },
    }),
  };
  ```

  Then, call an action from your client components using the `actions` object from `astro:actions`. You can pass a type-safe object when using JSON, or a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects) object when using `accept: 'form'` in your action definition:

  ```tsx "actions"
  // src/components/blog.tsx
  import { actions } from 'astro:actions';
  import { useState } from 'preact/hooks';

  export function Like({ postId }: { postId: string }) {
    const [likes, setLikes] = useState(0);
    return (
      <button
        onClick={async () => {
          const newLikes = await actions.like({ postId });
          setLikes(newLikes);
        }}
      >
        {likes} likes
      </button>
    );
  }

  export function Comment({ postId }: { postId: string }) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const result = await actions.blog.comment(formData);
          // handle result
        }}
      >
        <input type="hidden" name="postId" value={postId} />
        <label for="author">Author</label>
        <input id="author" type="text" name="author" />
        <textarea rows={10} name="body"></textarea>
        <button type="submit">Post</button>
      </form>
    );
  }
  ```

  For a complete overview, and to give feedback on this experimental API, see the [Actions RFC](https://github.com/withastro/roadmap/blob/actions/proposals/0046-actions.md).

- [#10906](https://github.com/withastro/astro/pull/10906) [`7bbd664`](https://github.com/withastro/astro/commit/7bbd66459dd29a338ac1dfae0e4c984cb08f73b3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `buttonBorderRadius` property to the `astro-dev-toolbar-button` component for the dev toolbar component library. This property can be useful to make a fully rounded button with an icon in the center.

### Patch Changes

- [#10977](https://github.com/withastro/astro/pull/10977) [`59571e8`](https://github.com/withastro/astro/commit/59571e8812ec637f5ea61be6c6adc0f45212d176) Thanks [@BryceRussell](https://github.com/BryceRussell)! - Improve error message when accessing `clientAddress` on prerendered routes

- [#10935](https://github.com/withastro/astro/pull/10935) [`ddd8e49`](https://github.com/withastro/astro/commit/ddd8e49d1a179bec82310fb471f822a1567a6610) Thanks [@bluwy](https://github.com/bluwy)! - Improves the error message when failed to render MDX components

- [#10917](https://github.com/withastro/astro/pull/10917) [`3412535`](https://github.com/withastro/astro/commit/3412535be4a0ec94cea18c5d186b7ffbd6f8209c) Thanks [@jakobhellermann](https://github.com/jakobhellermann)! - Fixes a case where the local server would crash when the host also contained the port, eg. with `X-Forwarded-Host: hostname:8080` and `X-Forwarded-Port: 8080` headers

- [#10959](https://github.com/withastro/astro/pull/10959) [`685fc22`](https://github.com/withastro/astro/commit/685fc22bc6247be69a34c3f6945dec058c19fd71) Thanks [@bluwy](https://github.com/bluwy)! - Refactors internal handling of styles and scripts for content collections to improve build performance

- [#10889](https://github.com/withastro/astro/pull/10889) [`4d905cc`](https://github.com/withastro/astro/commit/4d905ccef663f728fc981181f5bb9f1d157184ff) Thanks [@matthewp](https://github.com/matthewp)! - Preserve content modules properly in cache

- [#10955](https://github.com/withastro/astro/pull/10955) [`2978287`](https://github.com/withastro/astro/commit/2978287f92dbd135f5c3efc6a037ea1756064d35) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Handles `AstroUserError`s thrown while syncing content collections and exports `BaseSchema` and `CollectionConfig` types

## 4.7.1

### Patch Changes

- [#10911](https://github.com/withastro/astro/pull/10911) [`a86dc9d`](https://github.com/withastro/astro/commit/a86dc9d269fc4409c458cfa05dcfaeee12bade2f) Thanks [@bluwy](https://github.com/bluwy)! - Skips adding CSS dependencies of CSS Vite modules as style tags in the HTML

- [#10900](https://github.com/withastro/astro/pull/10900) [`36bb3b6`](https://github.com/withastro/astro/commit/36bb3b6025eb51f6e027a76a514cc7ebb29deb10) Thanks [@martrapp](https://github.com/martrapp)! - Detects overlapping navigation and view transitions and automatically aborts all but the most recent one.

- [#10933](https://github.com/withastro/astro/pull/10933) [`007d17f`](https://github.com/withastro/astro/commit/007d17fee072955d4acb846a06d9eb666e908ef6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `app.toggleState` not working correctly

- [#10931](https://github.com/withastro/astro/pull/10931) [`4ce5ced`](https://github.com/withastro/astro/commit/4ce5ced44d490f4c6df771995aef14e11910ec57) Thanks [@ktym4a](https://github.com/ktym4a)! - Fixes `toggleNotification()`'s parameter type for the notification level not using the proper levels

## 4.7.0

### Minor Changes

- [#10665](https://github.com/withastro/astro/pull/10665) [`7b4f284`](https://github.com/withastro/astro/commit/7b4f2840203fe220758934f1366485f788727f0d) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds new utilities to ease the creation of toolbar apps including `defineToolbarApp` to make it easier to define your toolbar app and `app` and `server` helpers for easier communication between the toolbar and the server. These new utilities abstract away some of the boilerplate code that is common in toolbar apps, and lower the barrier of entry for app authors.

  For example, instead of creating an event listener for the `app-toggled` event and manually typing the value in the callback, you can now use the `onAppToggled` method. Additionally, communicating with the server does not require knowing any of the Vite APIs anymore, as a new `server` object is passed to the `init` function that contains easy to use methods for communicating with the server.

  ```diff
  import { defineToolbarApp } from "astro/toolbar";

  export default defineToolbarApp({
    init(canvas, app, server) {

  -    app.addEventListener("app-toggled", (e) => {
  -      console.log(`App is now ${state ? "enabled" : "disabled"}`);.
  -    });

  +    app.onToggled(({ state }) => {
  +        console.log(`App is now ${state ? "enabled" : "disabled"}`);
  +    });

  -    if (import.meta.hot) {
  -      import.meta.hot.send("my-app:my-client-event", { message: "world" });
  -    }

  +    server.send("my-app:my-client-event", { message: "world" })

  -    if (import.meta.hot) {
  -      import.meta.hot.on("my-server-event", (data: {message: string}) => {
  -        console.log(data.message);
  -      });
  -    }

  +    server.on<{ message: string }>("my-server-event", (data) => {
  +      console.log(data.message); // data is typed using the type parameter
  +    });
    },
  })
  ```

  Server helpers are also available on the server side, for use in your integrations, through the new `toolbar` object:

  ```ts
  "astro:server:setup": ({ toolbar }) => {
    toolbar.on<{ message: string }>("my-app:my-client-event", (data) => {
      console.log(data.message);
      toolbar.send("my-server-event", { message: "hello" });
    });
  }
  ```

  This is a backwards compatible change and your your existing dev toolbar apps will continue to function. However, we encourage you to build your apps with the new helpers, following the [updated Dev Toolbar API documentation](https://docs.astro.build/en/reference/dev-toolbar-app-reference/).

- [#10734](https://github.com/withastro/astro/pull/10734) [`6fc4c0e`](https://github.com/withastro/astro/commit/6fc4c0e420da7629b4cfc28ee7efce1d614447be) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Astro will now automatically check for updates when you run the dev server. If a new version is available, a message will appear in the terminal with instructions on how to update. Updates will be checked once per 10 days, and the message will only appear if the project is multiple versions behind the latest release.

  This behavior can be disabled by running `astro preferences disable checkUpdates` or setting the `ASTRO_DISABLE_UPDATE_CHECK` environment variable to `false`.

- [#10762](https://github.com/withastro/astro/pull/10762) [`43ead8f`](https://github.com/withastro/astro/commit/43ead8fbd5112823118060175c7a4a22522cc325) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Enables type checking for JavaScript files when using the `strictest` TS config. This ensures consistency with Astro's other TS configs, and fixes type checking for integrations like Astro DB when using an `astro.config.mjs`.

  If you are currently using the `strictest` preset and would like to still disable `.js` files, set `allowJS: false` in your `tsconfig.json`.

### Patch Changes

- [#10861](https://github.com/withastro/astro/pull/10861) [`b673bc8`](https://github.com/withastro/astro/commit/b673bc850593d5af25793d0358c00797477fa373) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where `astro build` writes type declaration files to `outDir` when it's outside of root directory.

- [#10684](https://github.com/withastro/astro/pull/10684) [`8b59d5d`](https://github.com/withastro/astro/commit/8b59d5d078ff40576b8cbee432279c6ad044a1a9) Thanks [@PeterDraex](https://github.com/PeterDraex)! - Update sharp to 0.33 to fix issue with Alpine Linux

## 4.6.4

### Patch Changes

- [#10846](https://github.com/withastro/astro/pull/10846) [`3294f7a`](https://github.com/withastro/astro/commit/3294f7a343e036d2ad9ac8d5f792ad0d4f43a399) Thanks [@matthewp](https://github.com/matthewp)! - Prevent getCollection breaking in vitest

- [#10856](https://github.com/withastro/astro/pull/10856) [`30cf82a`](https://github.com/withastro/astro/commit/30cf82ac3e970a6a3c0f07db1340dd7152d1c35d) Thanks [@robertvanhoesel](https://github.com/robertvanhoesel)! - Prevents inputs with a name attribute of action or method to break ViewTransitions' form submission

- [#10833](https://github.com/withastro/astro/pull/10833) [`8d5f3e8`](https://github.com/withastro/astro/commit/8d5f3e8656027023f9fda51c66b0213ffe16d3a5) Thanks [@renovate](https://github.com/apps/renovate)! - Updates `esbuild` dependency to v0.20. This should not affect projects in most cases.

- [#10801](https://github.com/withastro/astro/pull/10801) [`204b782`](https://github.com/withastro/astro/commit/204b7820e6de22d97fa2a7b988180c42155c8387) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - Fixes an issue where images in MD required a relative specifier (e.g. `./`)

  Now, you can use the standard `![](relative/img.png)` syntax in MD files for images colocated in the same folder: no relative specifier required!

  There is no need to update your project; your existing images will still continue to work. However, you may wish to remove any relative specifiers from these MD images as they are no longer necessary:

  ```diff
  - ![A cute dog](./dog.jpg)
  + ![A cute dog](dog.jpg)
  <!-- This dog lives in the same folder as my article! -->
  ```

- [#10841](https://github.com/withastro/astro/pull/10841) [`a2df344`](https://github.com/withastro/astro/commit/a2df344bff15647c2bfb3f49e3f7b66aa069d6f4) Thanks [@martrapp](https://github.com/martrapp)! - Due to regression on mobile WebKit browsers, reverts a change made for JavaScript animations during view transitions.

## 4.6.3

### Patch Changes

- [#10799](https://github.com/withastro/astro/pull/10799) [`dc74afca9f5eebc2d61331298d6ef187d92051e0`](https://github.com/withastro/astro/commit/dc74afca9f5eebc2d61331298d6ef187d92051e0) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue with persisted non-text input fields that have the focus during view transition navigation.

- [#10773](https://github.com/withastro/astro/pull/10773) [`35e43ecdaae7adc4b9a0b974192a033568cfb3f0`](https://github.com/withastro/astro/commit/35e43ecdaae7adc4b9a0b974192a033568cfb3f0) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves performance for frequent use of small components.

- [#10763](https://github.com/withastro/astro/pull/10763) [`63132771373ce1510be3e8814897accc0bf62ef8`](https://github.com/withastro/astro/commit/63132771373ce1510be3e8814897accc0bf62ef8) Thanks [@matthewp](https://github.com/matthewp)! - Invalidate CC cache manifest when lockfile or config changes

- [#10811](https://github.com/withastro/astro/pull/10811) [`77822a822b04b5113726f713df104e8667333c59`](https://github.com/withastro/astro/commit/77822a822b04b5113726f713df104e8667333c59) Thanks [@AvinashReddy3108](https://github.com/AvinashReddy3108)! - Update list of available integrations in the `astro add` CLI help.

## 4.6.2

### Patch Changes

- [#10732](https://github.com/withastro/astro/pull/10732) [`a92e263beb6e0166f1f13c97803d1861793e2a99`](https://github.com/withastro/astro/commit/a92e263beb6e0166f1f13c97803d1861793e2a99) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - Correctly sets `build.assets` directory during `vite` config setup

- [#10776](https://github.com/withastro/astro/pull/10776) [`1607face67051b16d4648555f1001b2a9308e377`](https://github.com/withastro/astro/commit/1607face67051b16d4648555f1001b2a9308e377) Thanks [@fshafiee](https://github.com/fshafiee)! - Fixes cookies type inference

- [#10796](https://github.com/withastro/astro/pull/10796) [`90669472df3a05b33f0de46fd2d039e3eba7f7dd`](https://github.com/withastro/astro/commit/90669472df3a05b33f0de46fd2d039e3eba7f7dd) Thanks [@bluwy](https://github.com/bluwy)! - Disables streaming when rendering site with `output: "static"`

- [#10782](https://github.com/withastro/astro/pull/10782) [`b0589d05538fcc77dd3c38198bf93f3548362cd8`](https://github.com/withastro/astro/commit/b0589d05538fcc77dd3c38198bf93f3548362cd8) Thanks [@nektro](https://github.com/nektro)! - Handles possible null value when calling `which-pm` during dynamic package installation

- [#10774](https://github.com/withastro/astro/pull/10774) [`308b5d8c122f44e7724bb2f3ad3aa5c43a83e584`](https://github.com/withastro/astro/commit/308b5d8c122f44e7724bb2f3ad3aa5c43a83e584) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `astro add` sometimes modifying `baseUrl` unintentionally

- [#10783](https://github.com/withastro/astro/pull/10783) [`4dbd545304d1a8af903c8c97f237eb55c988c40b`](https://github.com/withastro/astro/commit/4dbd545304d1a8af903c8c97f237eb55c988c40b) Thanks [@jurajkapsz](https://github.com/jurajkapsz)! - Fixes Picture component specialFormatsFallback fallback check

- [#10775](https://github.com/withastro/astro/pull/10775) [`06843121450899ecf0390ca4efaff6c9a6fe0f75`](https://github.com/withastro/astro/commit/06843121450899ecf0390ca4efaff6c9a6fe0f75) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes assets endpoint in serverless returning 404 in certain situations where the website might be under a protected route

- [#10787](https://github.com/withastro/astro/pull/10787) [`699f4559a279b374bddb3e5e48c72afe2709e8e7`](https://github.com/withastro/astro/commit/699f4559a279b374bddb3e5e48c72afe2709e8e7) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a timing issue in the view transition simulation.

## 4.6.1

### Patch Changes

- [#10708](https://github.com/withastro/astro/pull/10708) [`742866c5669a2be4f8b5a4c861cadb933c381415`](https://github.com/withastro/astro/commit/742866c5669a2be4f8b5a4c861cadb933c381415) Thanks [@horo-fox](https://github.com/horo-fox)! - Limits parallel imports within `getCollection()` to prevent EMFILE errors when accessing files

- [#10755](https://github.com/withastro/astro/pull/10755) [`c6d59b6fb7db20af957a8706c8159c50619235ef`](https://github.com/withastro/astro/commit/c6d59b6fb7db20af957a8706c8159c50619235ef) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where the i18n fallback failed to correctly redirect to the index page with SSR enabled

## 4.6.0

### Minor Changes

- [#10591](https://github.com/withastro/astro/pull/10591) [`39988ef8e2c4c4888543c973e06d9b9939e4ac95`](https://github.com/withastro/astro/commit/39988ef8e2c4c4888543c973e06d9b9939e4ac95) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Adds a new dev toolbar settings option to change the horizontal placement of the dev toolbar on your screen: bottom left, bottom center, or bottom right.

- [#10689](https://github.com/withastro/astro/pull/10689) [`683d51a5eecafbbfbfed3910a3f1fbf0b3531b99`](https://github.com/withastro/astro/commit/683d51a5eecafbbfbfed3910a3f1fbf0b3531b99) Thanks [@ematipico](https://github.com/ematipico)! - Deprecate support for versions of Node.js older than `v18.17.1` for Node.js 18, older than `v20.0.3` for Node.js 20, and the complete Node.js v19 release line.

  This change is in line with Astro's [Node.js support policy](https://docs.astro.build/en/upgrade-astro/#support).

- [#10678](https://github.com/withastro/astro/pull/10678) [`2e53b5fff6d292b7acdf8c30a6ecf5e5696846a1`](https://github.com/withastro/astro/commit/2e53b5fff6d292b7acdf8c30a6ecf5e5696846a1) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new experimental security option to prevent [Cross-Site Request Forgery (CSRF) attacks](https://owasp.org/www-community/attacks/csrf). This feature is available only for pages rendered on demand:

  ```js
  import { defineConfig } from 'astro/config';
  export default defineConfig({
    experimental: {
      security: {
        csrfProtection: {
          origin: true,
        },
      },
    },
  });
  ```

  Enabling this setting performs a check that the "origin" header, automatically passed by all modern browsers, matches the URL sent by each `Request`.

  This experimental "origin" check is executed only for pages rendered on demand, and only for the requests `POST, `PATCH`, `DELETE`and`PUT`with one of the following`content-type` headers: 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'.

  It the "origin" header doesn't match the pathname of the request, Astro will return a 403 status code and won't render the page.

- [#10193](https://github.com/withastro/astro/pull/10193) [`440681e7b74511a17b152af0fd6e0e4dc4014025`](https://github.com/withastro/astro/commit/440681e7b74511a17b152af0fd6e0e4dc4014025) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new i18n routing option `manual` to allow you to write your own i18n middleware:

  ```js
  import { defineConfig } from 'astro/config';
  // astro.config.mjs
  export default defineConfig({
    i18n: {
      locales: ['en', 'fr'],
      defaultLocale: 'fr',
      routing: 'manual',
    },
  });
  ```

  Adding `routing: "manual"` to your i18n config disables Astro's own i18n middleware and provides you with helper functions to write your own: `redirectToDefaultLocale`, `notFound`, and `redirectToFallback`:

  ```js
  // middleware.js
  import { redirectToDefaultLocale } from 'astro:i18n';
  export const onRequest = defineMiddleware(async (context, next) => {
    if (context.url.startsWith('/about')) {
      return next();
    } else {
      return redirectToDefaultLocale(context, 302);
    }
  });
  ```

  Also adds a `middleware` function that manually creates Astro's i18n middleware. This allows you to extend Astro's i18n routing instead of completely replacing it. Run `middleware` in combination with your own middleware, using the `sequence` utility to determine the order:

  ```js title="src/middleware.js"
  import { defineMiddleware, sequence } from 'astro:middleware';
  import { middleware } from 'astro:i18n'; // Astro's own i18n routing config

  export const userMiddleware = defineMiddleware();

  export const onRequest = sequence(
    userMiddleware,
    middleware({
      redirectToDefaultLocale: false,
      prefixDefaultLocale: true,
    }),
  );
  ```

- [#10671](https://github.com/withastro/astro/pull/10671) [`9e14a78cb05667af9821948c630786f74680090d`](https://github.com/withastro/astro/commit/9e14a78cb05667af9821948c630786f74680090d) Thanks [@fshafiee](https://github.com/fshafiee)! - Adds the `httpOnly`, `sameSite`, and `secure` options when deleting a cookie

### Patch Changes

- [#10747](https://github.com/withastro/astro/pull/10747) [`994337c99f84304df1147a14504659439a9a7326`](https://github.com/withastro/astro/commit/994337c99f84304df1147a14504659439a9a7326) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where functions could not be used as named slots.

- [#10750](https://github.com/withastro/astro/pull/10750) [`7e825604ddf90c989537e07939a39dc249343897`](https://github.com/withastro/astro/commit/7e825604ddf90c989537e07939a39dc249343897) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Fixes a false positive for "Invalid `tabindex` on non-interactive element" rule for roleless elements ( `div` and `span` ).

- [#10745](https://github.com/withastro/astro/pull/10745) [`d51951ce6278d4b59deed938d65e1cb72b5102df`](https://github.com/withastro/astro/commit/d51951ce6278d4b59deed938d65e1cb72b5102df) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where CLI commands could not report the reason for failure before exiting.

- [#10661](https://github.com/withastro/astro/pull/10661) [`e2cd7f4291912dadd4a654bc7917856c58a72a97`](https://github.com/withastro/astro/commit/e2cd7f4291912dadd4a654bc7917856c58a72a97) Thanks [@liruifengv](https://github.com/liruifengv)! - Fixed errorOverlay theme toggle bug.

- Updated dependencies [[`ccafa8d230f65c9302421a0ce0a0adc5824bfd55`](https://github.com/withastro/astro/commit/ccafa8d230f65c9302421a0ce0a0adc5824bfd55), [`683d51a5eecafbbfbfed3910a3f1fbf0b3531b99`](https://github.com/withastro/astro/commit/683d51a5eecafbbfbfed3910a3f1fbf0b3531b99)]:
  - @astrojs/markdown-remark@5.1.0
  - @astrojs/telemetry@3.1.0

## 4.5.18

### Patch Changes

- [#10728](https://github.com/withastro/astro/pull/10728) [`f508c4b7d54316e737f454a3777204b23636d4a0`](https://github.com/withastro/astro/commit/f508c4b7d54316e737f454a3777204b23636d4a0) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where some very **specific** code rendered using `expressive-code` was not escaped properly.

- [#10737](https://github.com/withastro/astro/pull/10737) [`8a30f257b1f3618b01212a591b82ad7a63c82fbb`](https://github.com/withastro/astro/commit/8a30f257b1f3618b01212a591b82ad7a63c82fbb) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression where constructing and returning 404 responses from a middleware resulted in the dev server getting stuck in a loop.

- [#10719](https://github.com/withastro/astro/pull/10719) [`b21b3ba307235510707ee9f5bd49f71473a07004`](https://github.com/withastro/astro/commit/b21b3ba307235510707ee9f5bd49f71473a07004) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a false positive for `div` and `span` elements when running the Dev Toolbar accessibility audits.

  Those are special elements that don't have an interaction assigned by default. Instead, it is assigned through the `role` attribute. This means that cases like the following are now deemed correct:

  ```html
  <div role="tablist"></div>
  <span role="button" onclick="" onkeydown=""></span>
  ```

## 4.5.17

### Patch Changes

- [#10688](https://github.com/withastro/astro/pull/10688) [`799f6f3f29a3ef4f76347870a209ffa89651adfa`](https://github.com/withastro/astro/commit/799f6f3f29a3ef4f76347870a209ffa89651adfa) Thanks [@bluwy](https://github.com/bluwy)! - Marks renderer `jsxImportSource` and `jsxTransformOptions` options as deprecated as they are no longer used since Astro 3.0

- [#10657](https://github.com/withastro/astro/pull/10657) [`93d353528fa1a85b67e3f1e9514ed2a1b42dfd94`](https://github.com/withastro/astro/commit/93d353528fa1a85b67e3f1e9514ed2a1b42dfd94) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves the color contrast for notification badges on dev toolbar apps

- [#10693](https://github.com/withastro/astro/pull/10693) [`1d26e9c7f7d8f47e33bc68d3b30bbffce25c7b63`](https://github.com/withastro/astro/commit/1d26e9c7f7d8f47e33bc68d3b30bbffce25c7b63) Thanks [@apetta](https://github.com/apetta)! - Adds the `disableremoteplayback` attribute to MediaHTMLAttributes interface

- [#10695](https://github.com/withastro/astro/pull/10695) [`a15975e41cb5eaf6ed8eb3ebaee676a17e433052`](https://github.com/withastro/astro/commit/a15975e41cb5eaf6ed8eb3ebaee676a17e433052) Thanks [@bluwy](https://github.com/bluwy)! - Skips prerender chunk if building with static output

- [#10707](https://github.com/withastro/astro/pull/10707) [`5e044a5eafaa206d2ef8b62c37d1bcd37f0a4078`](https://github.com/withastro/astro/commit/5e044a5eafaa206d2ef8b62c37d1bcd37f0a4078) Thanks [@horo-fox](https://github.com/horo-fox)! - Logs an error when a page's `getStaticPaths` fails

- [#10686](https://github.com/withastro/astro/pull/10686) [`fa0f593890502faf5709ab881fe0e45519d2f7af`](https://github.com/withastro/astro/commit/fa0f593890502faf5709ab881fe0e45519d2f7af) Thanks [@bluwy](https://github.com/bluwy)! - Prevents inlining scripts if used by other chunks when using the `experimental.directRenderScript` option

## 4.5.16

### Patch Changes

- [#10679](https://github.com/withastro/astro/pull/10679) [`ca6bb1f31ef041e6ccf8ef974856fa945ff5bb31`](https://github.com/withastro/astro/commit/ca6bb1f31ef041e6ccf8ef974856fa945ff5bb31) Thanks [@martrapp](https://github.com/martrapp)! - Generates missing popstate events for Firefox when navigating to hash targets on the same page.

- [#10669](https://github.com/withastro/astro/pull/10669) [`0464563e527f821e53d78028d9bbf3c4e1050f5b`](https://github.com/withastro/astro/commit/0464563e527f821e53d78028d9bbf3c4e1050f5b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes Astro waiting infinitely in CI when a required package was not installed

## 4.5.15

### Patch Changes

- [#10666](https://github.com/withastro/astro/pull/10666) [`55ddb2ba4889480f776a8d29b9dcd531b9f5ab3e`](https://github.com/withastro/astro/commit/55ddb2ba4889480f776a8d29b9dcd531b9f5ab3e) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where forwarded requests did not include hostname on node-based adapters. This also makes error pages more reliable.

- [#10642](https://github.com/withastro/astro/pull/10642) [`4f5dc14f315eba7ea6ec5cc8e5dacb0cb81288dd`](https://github.com/withastro/astro/commit/4f5dc14f315eba7ea6ec5cc8e5dacb0cb81288dd) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Fixes typing issues when using `format` and `quality` options with remote images

- [#10616](https://github.com/withastro/astro/pull/10616) [`317d18ef8c9cf4fd13647518e3fd352774a86481`](https://github.com/withastro/astro/commit/317d18ef8c9cf4fd13647518e3fd352774a86481) Thanks [@NikolaRHristov](https://github.com/NikolaRHristov)! - This change disables the `sharp` `libvips` image cache as it errors when the
  file is too small and operations are happening too fast (runs into a race
  condition)

## 4.5.14

### Patch Changes

- [#10470](https://github.com/withastro/astro/pull/10470) [`320c309ca9fbe51c40e6ba846d04a0cb49aced5f`](https://github.com/withastro/astro/commit/320c309ca9fbe51c40e6ba846d04a0cb49aced5f) Thanks [@liruifengv](https://github.com/liruifengv)! - improves `client:only` error message

- [#10496](https://github.com/withastro/astro/pull/10496) [`ce985631129e49f7ea90e6ea690ef9f9cf0e6987`](https://github.com/withastro/astro/commit/ce985631129e49f7ea90e6ea690ef9f9cf0e6987) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Makes the warning less scary when adding 3rd-party integrations using `astro add`

## 4.5.13

### Patch Changes

- [#10495](https://github.com/withastro/astro/pull/10495) [`046d69d517118ab5c0e71604b321729d66ddffff`](https://github.com/withastro/astro/commit/046d69d517118ab5c0e71604b321729d66ddffff) Thanks [@satyarohith](https://github.com/satyarohith)! - This patch allows astro to run in node-compat mode in Deno. Deno doesn't support
  construction of response from async iterables in node-compat mode so we need to
  use ReadableStream.

- [#10605](https://github.com/withastro/astro/pull/10605) [`a16a829f4e25ad5c9a1b4557ec089fc8ab53320f`](https://github.com/withastro/astro/commit/a16a829f4e25ad5c9a1b4557ec089fc8ab53320f) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue with outdated page titles in browser history when using text fragments in view transition navigation.

- [#10584](https://github.com/withastro/astro/pull/10584) [`e648c5575a8774af739231cfa9fc27a32086aa5f`](https://github.com/withastro/astro/commit/e648c5575a8774af739231cfa9fc27a32086aa5f) Thanks [@duanwilliam](https://github.com/duanwilliam)! - Fixes a bug where JSX runtime would error on components with nullish prop values in certain conditions.

- [#10608](https://github.com/withastro/astro/pull/10608) [`e31bea0704890ff92ce4f9b0ce536c1c90715f2c`](https://github.com/withastro/astro/commit/e31bea0704890ff92ce4f9b0ce536c1c90715f2c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes bug with head content being pushed into body

- Updated dependencies [[`2cf116f80cb5e421ab5cc5eb4a654e7b78c1b8de`](https://github.com/withastro/astro/commit/2cf116f80cb5e421ab5cc5eb4a654e7b78c1b8de), [`374efcdff9625ca43309d89e3b9cfc9174351512`](https://github.com/withastro/astro/commit/374efcdff9625ca43309d89e3b9cfc9174351512)]:
  - @astrojs/markdown-remark@5.0.0

## 4.5.12

### Patch Changes

- [#10596](https://github.com/withastro/astro/pull/10596) [`20463a6c1e1271d8dc3cb0ab3419ee5c72abd218`](https://github.com/withastro/astro/commit/20463a6c1e1271d8dc3cb0ab3419ee5c72abd218) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add `removeBase` function

- Updated dependencies [[`20463a6c1e1271d8dc3cb0ab3419ee5c72abd218`](https://github.com/withastro/astro/commit/20463a6c1e1271d8dc3cb0ab3419ee5c72abd218)]:
  - @astrojs/internal-helpers@0.4.0

## 4.5.11

### Patch Changes

- [#10567](https://github.com/withastro/astro/pull/10567) [`fbdc10f90f7baa5c49f2f53e3e4ce8f453814c01`](https://github.com/withastro/astro/commit/fbdc10f90f7baa5c49f2f53e3e4ce8f453814c01) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `astro:assets` not working when using complex config with `vite.build.rollupOptions.output.assetFileNames`

- [#10593](https://github.com/withastro/astro/pull/10593) [`61e283e5a0d95b6ef5d3c4c985d6ee78f74bbd8e`](https://github.com/withastro/astro/commit/61e283e5a0d95b6ef5d3c4c985d6ee78f74bbd8e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes Polymorphic type helper causing TypeScript errors in certain cases after the previous update

- [#10543](https://github.com/withastro/astro/pull/10543) [`0fd36bdb383297b32cc523b57d2442132da41595`](https://github.com/withastro/astro/commit/0fd36bdb383297b32cc523b57d2442132da41595) Thanks [@matthewp](https://github.com/matthewp)! - Fixes inline stylesheets with content collections cache

- [#10582](https://github.com/withastro/astro/pull/10582) [`a05953538fcf524786385830b99c0c5a015173e8`](https://github.com/withastro/astro/commit/a05953538fcf524786385830b99c0c5a015173e8) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where the dev server got stuck in a loop while routing responses with a 404 status code to the 404 route.

## 4.5.10

### Patch Changes

- [#10549](https://github.com/withastro/astro/pull/10549) [`54c2f9707f5d038630143f769e3075c698474654`](https://github.com/withastro/astro/commit/54c2f9707f5d038630143f769e3075c698474654) Thanks [@admirsaheta](https://github.com/admirsaheta)! - Updates the `HTMLAttributes` type exported from `astro` to allow data attributes

- [#10562](https://github.com/withastro/astro/pull/10562) [`348c1ca1323d0516c2dcf8e963343cd12cb5407f`](https://github.com/withastro/astro/commit/348c1ca1323d0516c2dcf8e963343cd12cb5407f) Thanks [@apetta](https://github.com/apetta)! - Fixes minor type issues inside the built-in components of Astro

- [#10550](https://github.com/withastro/astro/pull/10550) [`34fa8e131b85531e6629390307108ffc4adb7ed1`](https://github.com/withastro/astro/commit/34fa8e131b85531e6629390307108ffc4adb7ed1) Thanks [@Skn0tt](https://github.com/Skn0tt)! - Fixes bug where server builds would include unneeded assets in SSR Function, potentially leading to upload errors on Vercel, Netlify because of size limits

- Updated dependencies [[`c585528f446ccca3d4c643f4af5d550b93c18902`](https://github.com/withastro/astro/commit/c585528f446ccca3d4c643f4af5d550b93c18902)]:
  - @astrojs/markdown-remark@4.3.2

## 4.5.9

### Patch Changes

- [#10532](https://github.com/withastro/astro/pull/10532) [`8306ce1ff7b71a2a0d7908336c9be462a54d395a`](https://github.com/withastro/astro/commit/8306ce1ff7b71a2a0d7908336c9be462a54d395a) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a style issue of `client:only` components in DEV mode during view transitions.

- [#10473](https://github.com/withastro/astro/pull/10473) [`627e47d67af4846cea2acf26a96b4124001b26fc`](https://github.com/withastro/astro/commit/627e47d67af4846cea2acf26a96b4124001b26fc) Thanks [@bluwy](https://github.com/bluwy)! - Fixes and improves performance when rendering Astro JSX

## 4.5.8

### Patch Changes

- [#10504](https://github.com/withastro/astro/pull/10504) [`8e4e554cc211e59c329c0a5d110c839c886ff120`](https://github.com/withastro/astro/commit/8e4e554cc211e59c329c0a5d110c839c886ff120) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update Babel version to fix regression in Babel's `7.24.2`.

- Updated dependencies [[`19e42c368184013fc30d1e46753b9e9383bb2bdf`](https://github.com/withastro/astro/commit/19e42c368184013fc30d1e46753b9e9383bb2bdf)]:
  - @astrojs/markdown-remark@4.3.1

## 4.5.7

### Patch Changes

- [#10493](https://github.com/withastro/astro/pull/10493) [`e4a6462751725878bfe47632eeafa6854cad5bf2`](https://github.com/withastro/astro/commit/e4a6462751725878bfe47632eeafa6854cad5bf2) Thanks [@firefoxic](https://github.com/firefoxic)! - `<link>` tags created by astro for optimized stylesheets now do not include the closing forward slash. This slash is optional for void elements such as link, but made some html validation fail.

## 4.5.6

### Patch Changes

- [#10455](https://github.com/withastro/astro/pull/10455) [`c12666166db724915e42e37a048483c99f88e6d9`](https://github.com/withastro/astro/commit/c12666166db724915e42e37a048483c99f88e6d9) Thanks [@lilnasy](https://github.com/lilnasy)! - Adds a helpful error message that will be shown when an endpoint does not return a `Response`.

- [#10426](https://github.com/withastro/astro/pull/10426) [`6a9a35ee15069541c3144012385366a3c689240a`](https://github.com/withastro/astro/commit/6a9a35ee15069541c3144012385366a3c689240a) Thanks [@markgaze](https://github.com/markgaze)! - Fixes an issue with generating JSON schemas when the schema is a function

- [#10448](https://github.com/withastro/astro/pull/10448) [`fcece3658697248ab58f77b3d4a8b14d362f3c47`](https://github.com/withastro/astro/commit/fcece3658697248ab58f77b3d4a8b14d362f3c47) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where multiple rendering errors resulted in a crash of the SSR app server.

## 4.5.5

### Patch Changes

- [#10379](https://github.com/withastro/astro/pull/10379) [`3776ecf0aa9e08a992d3ae76e90682fd04093721`](https://github.com/withastro/astro/commit/3776ecf0aa9e08a992d3ae76e90682fd04093721) Thanks [@1574242600](https://github.com/1574242600)! - Fixes a routing issue with partially truncated dynamic segments.

- [#10442](https://github.com/withastro/astro/pull/10442) [`f8e0ad3c52a37b8a2175fe2f5ff2bd0cd738f499`](https://github.com/withastro/astro/commit/f8e0ad3c52a37b8a2175fe2f5ff2bd0cd738f499) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes small rendering issues with the dev toolbar in certain contexts

- [#10438](https://github.com/withastro/astro/pull/10438) [`5b48cc0fc8383b0659a595afd3a6ee28b28779c3`](https://github.com/withastro/astro/commit/5b48cc0fc8383b0659a595afd3a6ee28b28779c3) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Generate Astro DB types when running `astro sync`.

- [#10456](https://github.com/withastro/astro/pull/10456) [`1900a8f9bc337f3a882178d1770e10ab67fab0ce`](https://github.com/withastro/astro/commit/1900a8f9bc337f3a882178d1770e10ab67fab0ce) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an error when using `astro:transtions/client` without `<ViewTransitions/>`

## 4.5.4

### Patch Changes

- [#10427](https://github.com/withastro/astro/pull/10427) [`128c7a36397d99608dea918885b68bd302d00e7f`](https://github.com/withastro/astro/commit/128c7a36397d99608dea918885b68bd302d00e7f) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where error pages did not have access to the `Astro.locals` fields provided by the adapter.

## 4.5.3

### Patch Changes

- [#10410](https://github.com/withastro/astro/pull/10410) [`055fe293c6702dd27bcd6c4f59297c6d4385abb1`](https://github.com/withastro/astro/commit/055fe293c6702dd27bcd6c4f59297c6d4385abb1) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where configured redirects could not include certain characters in the target path.

- [#9820](https://github.com/withastro/astro/pull/9820) [`8edc42aa7c209b12d98ecf20cdecccddf7314af0`](https://github.com/withastro/astro/commit/8edc42aa7c209b12d98ecf20cdecccddf7314af0) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Prevents fully formed URLs in attributes from being escaped

## 4.5.2

### Patch Changes

- [#10400](https://github.com/withastro/astro/pull/10400) [`629c9d7c4d96ae5711d95601e738b3d31d268116`](https://github.com/withastro/astro/commit/629c9d7c4d96ae5711d95601e738b3d31d268116) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where dev toolbar x-ray didn't escape props content.

## 4.5.1

### Patch Changes

- [#10392](https://github.com/withastro/astro/pull/10392) [`02aeb01cb8b62b9cc4dfe6069857219404343b73`](https://github.com/withastro/astro/commit/02aeb01cb8b62b9cc4dfe6069857219404343b73) Thanks [@martrapp](https://github.com/martrapp)! - Fixes broken types for some functions of `astro:transitions/client`.

- [#10390](https://github.com/withastro/astro/pull/10390) [`236cdbb611587692d3c781850cb949604677ef82`](https://github.com/withastro/astro/commit/236cdbb611587692d3c781850cb949604677ef82) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds `--help` reference for new db and studio CLI commands

## 4.5.0

### Minor Changes

- [#10206](https://github.com/withastro/astro/pull/10206) [`dc87214141e7f8406c0fdf6a7f425dad6dea6d3e`](https://github.com/withastro/astro/commit/dc87214141e7f8406c0fdf6a7f425dad6dea6d3e) Thanks [@lilnasy](https://github.com/lilnasy)! - Allows middleware to run when a matching page or endpoint is not found. Previously, a `pages/404.astro` or `pages/[...catch-all].astro` route had to match to allow middleware. This is now not necessary.

  When a route does not match in SSR deployments, your adapter may show a platform-specific 404 page instead of running Astro's SSR code. In these cases, you may still need to add a `404.astro` or fallback route with spread params, or use a routing configuration option if your adapter provides one.

- [#9960](https://github.com/withastro/astro/pull/9960) [`c081adf998d30419fed97d8fccc11340cdc512e0`](https://github.com/withastro/astro/commit/c081adf998d30419fed97d8fccc11340cdc512e0) Thanks [@StandardGage](https://github.com/StandardGage)! - Allows passing any props to the `<Code />` component

- [#10102](https://github.com/withastro/astro/pull/10102) [`e3f02f5fb1cf0dae3c54beb3a4af3dbf3b06abb7`](https://github.com/withastro/astro/commit/e3f02f5fb1cf0dae3c54beb3a4af3dbf3b06abb7) Thanks [@bluwy](https://github.com/bluwy)! - Adds a new `experimental.directRenderScript` configuration option which provides a more reliable strategy to prevent scripts from being executed in pages where they are not used.

  This replaces the `experimental.optimizeHoistedScript` flag introduced in v2.10.4 to prevent unused components' scripts from being included in a page unexpectedly. That experimental option no longer exists and must be removed from your configuration, whether or not you enable `directRenderScript`:

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	experimental: {
  -		optimizeHoistedScript: true,
  +		directRenderScript: true
  	}
  });
  ```

  With `experimental.directRenderScript` configured, scripts are now directly rendered as declared in Astro files (including existing features like TypeScript, importing `node_modules`, and deduplicating scripts). You can also now conditionally render scripts in your Astro file.

  However, this means scripts are no longer hoisted to the `<head>` and multiple scripts on a page are no longer bundled together. If you enable this option, you should check that all your `<script>` tags behave as expected.

  This option will be enabled by default in Astro 5.0.

- [#10130](https://github.com/withastro/astro/pull/10130) [`5a9528741fa98d017b269c7e4f013058028bdc5d`](https://github.com/withastro/astro/commit/5a9528741fa98d017b269c7e4f013058028bdc5d) Thanks [@bluwy](https://github.com/bluwy)! - Stabilizes `markdown.shikiConfig.experimentalThemes` as `markdown.shikiConfig.themes`. No behaviour changes are made to this option.

- [#10189](https://github.com/withastro/astro/pull/10189) [`1ea0a25b94125e4f6f2ac82b42f638e22d7bdffd`](https://github.com/withastro/astro/commit/1ea0a25b94125e4f6f2ac82b42f638e22d7bdffd) Thanks [@peng](https://github.com/peng)! - Adds the option to pass an object to `build.assetsPrefix`. This allows for the use of multiple CDN prefixes based on the target file type.

  When passing an object to `build.assetsPrefix`, you must also specify a `fallback` domain to be used for all other file types not specified.

  Specify a file extension as the key (e.g. 'js', 'png') and the URL serving your assets of that file type as the value:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    build: {
      assetsPrefix: {
        js: 'https://js.cdn.example.com',
        mjs: 'https://js.cdn.example.com', // if you have .mjs files, you must add a new entry like this
        png: 'https://images.cdn.example.com',
        fallback: 'https://generic.cdn.example.com',
      },
    },
  });
  ```

- [#10252](https://github.com/withastro/astro/pull/10252) [`3307cb34f17159dfd3f03144697040fcaa10e903`](https://github.com/withastro/astro/commit/3307cb34f17159dfd3f03144697040fcaa10e903) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for emitting warning and info notifications from dev toolbar apps.

  When using the `toggle-notification` event, the severity can be specified through `detail.level`:

  ```ts
  eventTarget.dispatchEvent(
    new CustomEvent('toggle-notification', {
      detail: {
        level: 'warning',
      },
    }),
  );
  ```

- [#10186](https://github.com/withastro/astro/pull/10186) [`959ca5f9f86ef2c0a5a23080cc01c25f53d613a9`](https://github.com/withastro/astro/commit/959ca5f9f86ef2c0a5a23080cc01c25f53d613a9) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds the ability to set colors on all the included UI elements for dev toolbar apps. Previously, only badge and buttons could be customized.

- [#10136](https://github.com/withastro/astro/pull/10136) [`9cd84bd19b92fb43ae48809f575ee12ebd43ea8f`](https://github.com/withastro/astro/commit/9cd84bd19b92fb43ae48809f575ee12ebd43ea8f) Thanks [@matthewp](https://github.com/matthewp)! - Changes the default behavior of `transition:persist` to update the props of persisted islands upon navigation. Also adds a new view transitions option `transition:persist-props` (default: `false`) to prevent props from updating as needed.

  Islands which have the `transition:persist` property to keep their state when using the `<ViewTransitions />` router will now have their props updated upon navigation. This is useful in cases where the component relies on page-specific props, such as the current page title, which should update upon navigation.

  For example, the component below is set to persist across navigation. This component receives a `products` props and might have some internal state, such as which filters are applied:

  ```astro
  <ProductListing transition:persist products={products} />
  ```

  Upon navigation, this component persists, but the desired `products` might change, for example if you are visiting a category of products, or you are performing a search.

  Previously the props would not change on navigation, and your island would have to handle updating them externally, such as with API calls.

  With this change the props are now updated, while still preserving state.

  You can override this new default behavior on a per-component basis using `transition:persist-props=true` to persist both props and state during navigation:

  ```astro
  <ProductListing transition:persist-props="true" products={products} />
  ```

- [#9977](https://github.com/withastro/astro/pull/9977) [`0204b7de37bf626e1b97175b605adbf91d885386`](https://github.com/withastro/astro/commit/0204b7de37bf626e1b97175b605adbf91d885386) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Supports adding the `data-astro-rerun` attribute on script tags so that they will be re-executed after view transitions

  ```html
  <script is:inline data-astro-rerun>
    ...
  </script>
  ```

- [#10145](https://github.com/withastro/astro/pull/10145) [`65692fa7b5f4440c644c8cf3dd9bc50103d2c33b`](https://github.com/withastro/astro/commit/65692fa7b5f4440c644c8cf3dd9bc50103d2c33b) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Adds experimental JSON Schema support for content collections.

  This feature will auto-generate a JSON Schema for content collections of `type: 'data'` which can be used as the `$schema` value for TypeScript-style autocompletion/hints in tools like VSCode.

  To enable this feature, add the experimental flag:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	experimental: {
  +		contentCollectionJsonSchema: true
  	}
  });
  ```

  This experimental implementation requires you to manually reference the schema in each data entry file of the collection:

  ```diff
  // src/content/test/entry.json
  {
  +  "$schema": "../../../.astro/collections/test.schema.json",
    "test": "test"
  }
  ```

  Alternatively, you can set this in your [VSCode `json.schemas` settings](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings):

  ```diff
  "json.schemas": [
    {
      "fileMatch": [
        "/src/content/test/**"
      ],
      "url": "../../../.astro/collections/test.schema.json"
    }
  ]
  ```

  Note that this initial implementation uses a library with [known issues for advanced Zod schemas](https://github.com/StefanTerdell/zod-to-json-schema#known-issues), so you may wish to consult these limitations before enabling the experimental flag.

- [#10130](https://github.com/withastro/astro/pull/10130) [`5a9528741fa98d017b269c7e4f013058028bdc5d`](https://github.com/withastro/astro/commit/5a9528741fa98d017b269c7e4f013058028bdc5d) Thanks [@bluwy](https://github.com/bluwy)! - Migrates `shikiji` to `shiki` 1.0

- [#10268](https://github.com/withastro/astro/pull/10268) [`2013e70bce16366781cc12e52823bb257fe460c0`](https://github.com/withastro/astro/commit/2013e70bce16366781cc12e52823bb257fe460c0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for page mutations to the audits in the dev toolbar. Astro will now rerun the audits whenever elements are added or deleted from the page.

- [#10217](https://github.com/withastro/astro/pull/10217) [`5c7862a9fe69954f8630538ebb7212cd04b8a810`](https://github.com/withastro/astro/commit/5c7862a9fe69954f8630538ebb7212cd04b8a810) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates the UI for dev toolbar audits with new information

### Patch Changes

- [#10360](https://github.com/withastro/astro/pull/10360) [`ac766647b0e6156b7c4a0bb9a11981fe168852d7`](https://github.com/withastro/astro/commit/ac766647b0e6156b7c4a0bb9a11981fe168852d7) Thanks [@nmattia](https://github.com/nmattia)! - Fixes an issue where some CLI commands attempted to directly read vite config files.

- [#10291](https://github.com/withastro/astro/pull/10291) [`8107a2721b6abb07c3120ac90e03c39f2a44ab0c`](https://github.com/withastro/astro/commit/8107a2721b6abb07c3120ac90e03c39f2a44ab0c) Thanks [@bluwy](https://github.com/bluwy)! - Treeshakes unused Astro component scoped styles

- [#10368](https://github.com/withastro/astro/pull/10368) [`78bafc5d661ff7dd071c241cb1303c4d8a774d21`](https://github.com/withastro/astro/commit/78bafc5d661ff7dd071c241cb1303c4d8a774d21) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates the base `tsconfig.json` preset with `jsx: 'preserve'` in order to fix errors when importing Astro files inside `.js` and `.ts` files.

- Updated dependencies [[`c081adf998d30419fed97d8fccc11340cdc512e0`](https://github.com/withastro/astro/commit/c081adf998d30419fed97d8fccc11340cdc512e0), [`1ea0a25b94125e4f6f2ac82b42f638e22d7bdffd`](https://github.com/withastro/astro/commit/1ea0a25b94125e4f6f2ac82b42f638e22d7bdffd), [`5a9528741fa98d017b269c7e4f013058028bdc5d`](https://github.com/withastro/astro/commit/5a9528741fa98d017b269c7e4f013058028bdc5d), [`a31bbd7ff8f3ec62ee507f72d1d25140b82ffc18`](https://github.com/withastro/astro/commit/a31bbd7ff8f3ec62ee507f72d1d25140b82ffc18)]:
  - @astrojs/markdown-remark@4.3.0
  - @astrojs/internal-helpers@0.3.0

## 4.4.15

### Patch Changes

- [#10317](https://github.com/withastro/astro/pull/10317) [`33583e8b31ee8a33e26cf57f30bb422921f4745d`](https://github.com/withastro/astro/commit/33583e8b31ee8a33e26cf57f30bb422921f4745d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where elements slotted within interactive framework components disappeared after hydration.

## 4.4.14

### Patch Changes

- [#10355](https://github.com/withastro/astro/pull/10355) [`8ce9fffd44b0740621178d61fb1425bf4155c2d7`](https://github.com/withastro/astro/commit/8ce9fffd44b0740621178d61fb1425bf4155c2d7) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where full dynamic routes were prioritized over partial dynamic routes. Now a route like `food-[name].astro` is matched **before** `[name].astro`.

- [#10356](https://github.com/withastro/astro/pull/10356) [`d121311a3f4b5345e344e31f75d4e7164d65f729`](https://github.com/withastro/astro/commit/d121311a3f4b5345e344e31f75d4e7164d65f729) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where `getCollection` might return `undefined` when content collection is empty

- [#10325](https://github.com/withastro/astro/pull/10325) [`f33cce8f6c3a2e17847658cdedb015bd93cc1ee3`](https://github.com/withastro/astro/commit/f33cce8f6c3a2e17847658cdedb015bd93cc1ee3) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where `ctx.site` included the configured `base` in API routes and middleware, unlike `Astro.site` in astro pages.

- [#10343](https://github.com/withastro/astro/pull/10343) [`f973aa9110592fa9017bbe84387f22c24a6d7159`](https://github.com/withastro/astro/commit/f973aa9110592fa9017bbe84387f22c24a6d7159) Thanks [@ematipico](https://github.com/ematipico)! - Fixes some false positive in the dev toolbar a11y audits, by adding the `a` element to the list of interactive elements.

- [#10295](https://github.com/withastro/astro/pull/10295) [`fdd5bf277e5c1cfa30c1bd2ca123f4e90e8d09d9`](https://github.com/withastro/astro/commit/fdd5bf277e5c1cfa30c1bd2ca123f4e90e8d09d9) Thanks [@rossrobino](https://github.com/rossrobino)! - Adds a prefetch fallback when using the `experimental.clientPrerender` option. If prerendering fails, which can happen if [Chrome extensions block prerendering](https://developer.chrome.com/blog/speculation-rules-improvements#chrome-limits), it will fallback to prefetching the URL. This works by adding a `prefetch` field to the `speculationrules` script, but does not create an extra request.

## 4.4.13

### Patch Changes

- [#10342](https://github.com/withastro/astro/pull/10342) [`a2e9b2b936666b2a4779feb00dcb8ff0ab82c2ec`](https://github.com/withastro/astro/commit/a2e9b2b936666b2a4779feb00dcb8ff0ab82c2ec) Thanks [@matthewp](https://github.com/matthewp)! - Fixes @astrojs/db loading TS in the fixtures

## 4.4.12

### Patch Changes

- [#10336](https://github.com/withastro/astro/pull/10336) [`f2e60a96754ed1d86001fe4d5d3a0c0ef657408d`](https://github.com/withastro/astro/commit/f2e60a96754ed1d86001fe4d5d3a0c0ef657408d) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fixes an issue where slotting interactive components within a "client:only" component prevented all component code in the page from running.

## 4.4.11

### Patch Changes

- [#10281](https://github.com/withastro/astro/pull/10281) [`9deb919ff95b1d2ffe5a5f70ec683e32ebfafd05`](https://github.com/withastro/astro/commit/9deb919ff95b1d2ffe5a5f70ec683e32ebfafd05) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where `404.astro` was ignored with `i18n` routing enabled.

- [#10279](https://github.com/withastro/astro/pull/10279) [`9ba3e2605daee3861e3bf6c5768f1d8bced4709d`](https://github.com/withastro/astro/commit/9ba3e2605daee3861e3bf6c5768f1d8bced4709d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where returning redirect responses resulted in missing files with certain adapters.

- [#10319](https://github.com/withastro/astro/pull/10319) [`19ecccedaab6d8fa0ff23711c88fa7d4fa34df38`](https://github.com/withastro/astro/commit/19ecccedaab6d8fa0ff23711c88fa7d4fa34df38) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where streaming SSR responses sometimes failed with "`iterator.result` is not a function" on node-based adapters.

- [#10302](https://github.com/withastro/astro/pull/10302) [`992537e79f1847b590a2e226aac88a47a6304f68`](https://github.com/withastro/astro/commit/992537e79f1847b590a2e226aac88a47a6304f68) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes an issue that causes static entrypoints build to fail because of the path in certain conditions. Specifically, it failed if the path had an extension (like `.astro`, `.mdx` etc) and such extension would be also within the path (like `./.astro/index.astro`).

- [#10298](https://github.com/withastro/astro/pull/10298) [`819d20a89c0d269333c2d397c1080884f516307a`](https://github.com/withastro/astro/commit/819d20a89c0d269333c2d397c1080884f516307a) Thanks [@Fryuni](https://github.com/Fryuni)! - Fix an incorrect conflict resolution between pages generated from static routes and rest parameters

## 4.4.10

### Patch Changes

- [#10235](https://github.com/withastro/astro/pull/10235) [`4bc360cd5f25496aca3232f6efb3710424a14a34`](https://github.com/withastro/astro/commit/4bc360cd5f25496aca3232f6efb3710424a14a34) Thanks [@sanman1k98](https://github.com/sanman1k98)! - Fixes jerky scrolling on IOS when using view transitions.

## 4.4.9

### Patch Changes

- [#10278](https://github.com/withastro/astro/pull/10278) [`a548a3a99c2835c19662fc38636f92b2bda26614`](https://github.com/withastro/astro/commit/a548a3a99c2835c19662fc38636f92b2bda26614) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes original images sometimes being kept / deleted when they shouldn't in both MDX and Markdoc

- [#10280](https://github.com/withastro/astro/pull/10280) [`3488be9b59d1cb65325b0e087c33bcd74aaa4926`](https://github.com/withastro/astro/commit/3488be9b59d1cb65325b0e087c33bcd74aaa4926) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Finalize db API to a shared db/ directory.

## 4.4.8

### Patch Changes

- [#10275](https://github.com/withastro/astro/pull/10275) [`5e3e74b61daa2ba44c761c9ab5745818661a656e`](https://github.com/withastro/astro/commit/5e3e74b61daa2ba44c761c9ab5745818661a656e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes dev toolbar warning about using the proper loading attributes on images using `data:` URIs

## 4.4.7

### Patch Changes

- [#10274](https://github.com/withastro/astro/pull/10274) [`e556151603a2f0173059d0f98fdcbec0610b48ff`](https://github.com/withastro/astro/commit/e556151603a2f0173059d0f98fdcbec0610b48ff) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression introduced in v4.4.5 where image optimization did not work in dev mode when a base was configured.

- [#10263](https://github.com/withastro/astro/pull/10263) [`9bdbed723e0aa4243d7d6ee64d1c1df3b75b9aeb`](https://github.com/withastro/astro/commit/9bdbed723e0aa4243d7d6ee64d1c1df3b75b9aeb) Thanks [@martrapp](https://github.com/martrapp)! - Adds auto completion for `astro:` event names when adding or removing event listeners on `document`.

- [#10284](https://github.com/withastro/astro/pull/10284) [`07f89429a1ef5173d3321e0b362a9dc71fc74fe5`](https://github.com/withastro/astro/commit/07f89429a1ef5173d3321e0b362a9dc71fc74fe5) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes an issue where in Node SSR, the image endpoint could be used maliciously to reveal unintended information about the underlying system.

  Thanks to Google Security Team for reporting this issue.

## 4.4.6

### Patch Changes

- [#10247](https://github.com/withastro/astro/pull/10247) [`fb773c9161bf8faa5ebd7e115f3564c3359e56ea`](https://github.com/withastro/astro/commit/fb773c9161bf8faa5ebd7e115f3564c3359e56ea) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue where `transition:animate="none"` still allowed the browser-native morph animation.

- [#10248](https://github.com/withastro/astro/pull/10248) [`8ae5d99534fc09d650e10e64a09b61a2807574f2`](https://github.com/withastro/astro/commit/8ae5d99534fc09d650e10e64a09b61a2807574f2) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where multiple injected routes with the same `entrypoint` but different `pattern` were incorrectly cached, causing some of them not being rendered in the dev server.

- [#10250](https://github.com/withastro/astro/pull/10250) [`57655a99db34e20e9661c039fab253b867013318`](https://github.com/withastro/astro/commit/57655a99db34e20e9661c039fab253b867013318) Thanks [@log101](https://github.com/log101)! - Fixes the overwriting of localised index pages with redirects

- [#10239](https://github.com/withastro/astro/pull/10239) [`9c21a9df6b03e36bd78dc553e13c55b9ef8c44cd`](https://github.com/withastro/astro/commit/9c21a9df6b03e36bd78dc553e13c55b9ef8c44cd) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Improves the message of `MiddlewareCantBeLoaded` for clarity

- [#10222](https://github.com/withastro/astro/pull/10222) [`ade9759cae74ca262b988260250bcb202235e811`](https://github.com/withastro/astro/commit/ade9759cae74ca262b988260250bcb202235e811) Thanks [@martrapp](https://github.com/martrapp)! - Adds a warning in DEV mode when using view transitions on a device with prefer-reduced-motion enabled.

- [#10251](https://github.com/withastro/astro/pull/10251) [`9b00de0a76b4f4b5b808e8c78e4906a2497e8ecf`](https://github.com/withastro/astro/commit/9b00de0a76b4f4b5b808e8c78e4906a2497e8ecf) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes TypeScript type definitions for `Code` component `theme` and `experimentalThemes` props

## 4.4.5

### Patch Changes

- [#10221](https://github.com/withastro/astro/pull/10221) [`4db82d9c7dce3b73fe43b86020fcfa326c1357ec`](https://github.com/withastro/astro/commit/4db82d9c7dce3b73fe43b86020fcfa326c1357ec) Thanks [@matthewp](https://github.com/matthewp)! - Prevents errors in templates from crashing the server

- [#10219](https://github.com/withastro/astro/pull/10219) [`afcb9d331179287629b5ffce4020931258bebefa`](https://github.com/withastro/astro/commit/afcb9d331179287629b5ffce4020931258bebefa) Thanks [@matthewp](https://github.com/matthewp)! - Fix dynamic slots missing hydration scripts

- [#10220](https://github.com/withastro/astro/pull/10220) [`1eadb1c5290f2f4baf538c34889a09d5fcfb9bd4`](https://github.com/withastro/astro/commit/1eadb1c5290f2f4baf538c34889a09d5fcfb9bd4) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes some built-in apps of the dev toolbar not closing when clicking the page

- [#10154](https://github.com/withastro/astro/pull/10154) [`e64bd0740b44aed5cfaf67e5c37a1c56ed4442f4`](https://github.com/withastro/astro/commit/e64bd0740b44aed5cfaf67e5c37a1c56ed4442f4) Thanks [@Cherry](https://github.com/Cherry)! - Fixes an issue where `config.vite.build.assetsInlineLimit` could not be set as a function.

- [#10196](https://github.com/withastro/astro/pull/10196) [`8fb32f390d40cfa12a82c0645928468d27218866`](https://github.com/withastro/astro/commit/8fb32f390d40cfa12a82c0645928468d27218866) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where a warning about headers being accessed in static mode is unnecessarily shown when i18n is enabled.

- [#10199](https://github.com/withastro/astro/pull/10199) [`6aa660ae7abc6841d7a3396b29f10b9fb7910ce5`](https://github.com/withastro/astro/commit/6aa660ae7abc6841d7a3396b29f10b9fb7910ce5) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where prerendered pages had access to query params in dev mode.

## 4.4.4

### Patch Changes

- [#10195](https://github.com/withastro/astro/pull/10195) [`903eace233033998811b72e27a54c80d8e59ff37`](https://github.com/withastro/astro/commit/903eace233033998811b72e27a54c80d8e59ff37) Thanks [@1574242600](https://github.com/1574242600)! - Fix build failure caused by read-only files under /public (in the presence of client-side JS).

- [#10205](https://github.com/withastro/astro/pull/10205) [`459f74bc71748279fe7dce0688f38bd74b51c5c1`](https://github.com/withastro/astro/commit/459f74bc71748279fe7dce0688f38bd74b51c5c1) Thanks [@martrapp](https://github.com/martrapp)! - Adds an error message for non-string transition:name values

- [#10208](https://github.com/withastro/astro/pull/10208) [`8cd38f02456640c063552aef00b2b8a216b3935d`](https://github.com/withastro/astro/commit/8cd38f02456640c063552aef00b2b8a216b3935d) Thanks [@log101](https://github.com/log101)! - Fixes custom headers are not added to the Node standalone server responses in preview mode

## 4.4.3

### Patch Changes

- [#10143](https://github.com/withastro/astro/pull/10143) [`7c5fcd2fa817472f480bbfbbc11b9ed71a7210ab`](https://github.com/withastro/astro/commit/7c5fcd2fa817472f480bbfbbc11b9ed71a7210ab) Thanks [@bluwy](https://github.com/bluwy)! - Improves the default `optimizeDeps.entries` Vite config to avoid globbing server endpoints, and respect the `srcDir` option

- [#10197](https://github.com/withastro/astro/pull/10197) [`c856c729404196900a7386c8426b81e79684a6a9`](https://github.com/withastro/astro/commit/c856c729404196900a7386c8426b81e79684a6a9) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes errors being logged twice in some cases

- [#10166](https://github.com/withastro/astro/pull/10166) [`598f30c7cd6c88558e3806d9bc5a15d426d83992`](https://github.com/withastro/astro/commit/598f30c7cd6c88558e3806d9bc5a15d426d83992) Thanks [@bluwy](https://github.com/bluwy)! - Improves Astro style tag HMR when updating imported styles

- [#10194](https://github.com/withastro/astro/pull/10194) [`3cc20109277813ccb9578ca87a8b0d680a73c35c`](https://github.com/withastro/astro/commit/3cc20109277813ccb9578ca87a8b0d680a73c35c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an issue related to content collections usage in browser context caused by `csssec`

## 4.4.2

### Patch Changes

- [#10169](https://github.com/withastro/astro/pull/10169) [`a46249173edde66b03c19441144272baa8394fb4`](https://github.com/withastro/astro/commit/a46249173edde66b03c19441144272baa8394fb4) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue with the `i18n.routing` types, where an internal transformation was causing the generation of incorrect types for integrations.

## 4.4.1

### Patch Changes

- [#9795](https://github.com/withastro/astro/pull/9795) [`5acc3135ba5309a566def466fbcbabd23f70cd68`](https://github.com/withastro/astro/commit/5acc3135ba5309a566def466fbcbabd23f70cd68) Thanks [@lilnasy](https://github.com/lilnasy)! - Refactors internals relating to middleware, endpoints, and page rendering.

- [#10105](https://github.com/withastro/astro/pull/10105) [`1f598b372410066c6fcd41cba9915f6aaf7befa8`](https://github.com/withastro/astro/commit/1f598b372410066c6fcd41cba9915f6aaf7befa8) Thanks [@negativems](https://github.com/negativems)! - Fixes an issue where some astro commands failed if the astro config file or an integration used the global `crypto` object.

- [#10165](https://github.com/withastro/astro/pull/10165) [`d50dddb71d87ce5b7928920f10eb4946a5339f86`](https://github.com/withastro/astro/commit/d50dddb71d87ce5b7928920f10eb4946a5339f86) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the `i18n.routing` object had all its fields defined as mandatory. Now they all are optionals and shouldn't break when using `astro.config.mts`.

- [#10132](https://github.com/withastro/astro/pull/10132) [`1da9c5f2f3fe70b0206d1b3e0c01744fa40d511c`](https://github.com/withastro/astro/commit/1da9c5f2f3fe70b0206d1b3e0c01744fa40d511c) Thanks [@bluwy](https://github.com/bluwy)! - Simplifies internal Vite preview server teardown

- [#10163](https://github.com/withastro/astro/pull/10163) [`b92d35f1026f3e99abb888d1a845bdda4efdc327`](https://github.com/withastro/astro/commit/b92d35f1026f3e99abb888d1a845bdda4efdc327) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where audit fails to initialize when encountered `<a>` inside `<svg>`

- [#10079](https://github.com/withastro/astro/pull/10079) [`80f8996514e6d0546e94bd927650cd4ab2f1fa2f`](https://github.com/withastro/astro/commit/80f8996514e6d0546e94bd927650cd4ab2f1fa2f) Thanks [@ktym4a](https://github.com/ktym4a)! - Fix integrationData fetch to always be called even if View Transition is enabled.

- [#10139](https://github.com/withastro/astro/pull/10139) [`3c73441eb2eaba767d6dad1b30c0353195d28791`](https://github.com/withastro/astro/commit/3c73441eb2eaba767d6dad1b30c0353195d28791) Thanks [@bluwy](https://github.com/bluwy)! - Fixes style-only change detection for Astro files if both the markup and styles are updated

## 4.4.0

### Minor Changes

- [#9614](https://github.com/withastro/astro/pull/9614) [`d469bebd7b45b060dc41d82ab1cf18ee6de7e051`](https://github.com/withastro/astro/commit/d469bebd7b45b060dc41d82ab1cf18ee6de7e051) Thanks [@matthewp](https://github.com/matthewp)! - Improves Node.js streaming performance.

  This uses an `AsyncIterable` instead of a `ReadableStream` to do streaming in Node.js. This is a non-standard enhancement by Node, which is done only in that environment.

- [#10001](https://github.com/withastro/astro/pull/10001) [`748b2e87cd44d8bcc1ab9d7e504703057e2000cd`](https://github.com/withastro/astro/commit/748b2e87cd44d8bcc1ab9d7e504703057e2000cd) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Removes content collection warning when a configured collection does not have a matching directory name. This should resolve `i18n` collection warnings for Starlight users.

  This also ensures configured collection names are always included in `getCollection()` and `getEntry()` types even when a matching directory is absent. We hope this allows users to discover typos during development by surfacing type information.

- [#10074](https://github.com/withastro/astro/pull/10074) [`7443929381b47db0639c49a4d32aec4177bd9102`](https://github.com/withastro/astro/commit/7443929381b47db0639c49a4d32aec4177bd9102) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a UI showing the list of found problems when using the audit app in the dev toolbar

- [#10099](https://github.com/withastro/astro/pull/10099) [`b340f8fe3aaa81e38c4f1aa41498b159dc733d86`](https://github.com/withastro/astro/commit/b340f8fe3aaa81e38c4f1aa41498b159dc733d86) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a regression where view transition names containing special characters such as spaces or punctuation stopped working.

  Regular use naming your transitions with `transition: name` is unaffected.

  However, this fix may result in breaking changes if your project relies on the particular character encoding strategy Astro uses to translate `transition:name` directives into values of the underlying CSS `view-transition-name` property. For example, `Welcome to Astro` is now encoded as `Welcome_20to_20Astro_2e`.

  This mainly affects spaces and punctuation marks but no Unicode characters with codes >= 128.

- [#9976](https://github.com/withastro/astro/pull/9976) [`91f75afbc642b6e73dd4ec18a1fe2c3128c68132`](https://github.com/withastro/astro/commit/91f75afbc642b6e73dd4ec18a1fe2c3128c68132) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Adds a new optional `astro:assets` image attribute `inferSize` for use with remote images.

  Remote images can now have their dimensions inferred just like local images. Setting `inferSize` to `true` allows you to use `getImage()` and the `<Image />` and `<Picture />` components without setting the `width` and `height` properties.

  ```astro
  ---
  import { Image, Picture, getImage } from 'astro:assets';
  const myPic = await getImage({ src: 'https://example.com/example.png', inferSize: true });
  ---

  <Image src="https://example.com/example.png" inferSize alt="" />
  <Picture src="https://example.com/example.png" inferSize alt="" />
  ```

  Read more about [using `inferSize` with remote images](https://docs.astro.build/en/guides/images/#infersize) in our documentation.

- [#10015](https://github.com/withastro/astro/pull/10015) [`6884b103c8314a43e926c6acdf947cbf812a21f4`](https://github.com/withastro/astro/commit/6884b103c8314a43e926c6acdf947cbf812a21f4) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds initial support for performance audits to the dev toolbar

### Patch Changes

- [#10116](https://github.com/withastro/astro/pull/10116) [`4bcc249a9f34aaac59658ca626c828bd6dbb8046`](https://github.com/withastro/astro/commit/4bcc249a9f34aaac59658ca626c828bd6dbb8046) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where the dev server froze when typescript aliases were used.

- [#10096](https://github.com/withastro/astro/pull/10096) [`227cd83a51bbd451dc223fd16f4cf1b87b8e44f8`](https://github.com/withastro/astro/commit/227cd83a51bbd451dc223fd16f4cf1b87b8e44f8) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes regression on routing priority for multi-layer index pages

  The sorting algorithm positions more specific routes before less specific routes, and considers index pages to be more specific than a dynamic route with a rest parameter inside of it.
  This means that `/blog` is considered more specific than `/blog/[...slug]`.

  But this special case was being applied incorrectly to indexes, which could cause a problem in scenarios like the following:

  - `/`
  - `/blog`
  - `/blog/[...slug]`

  The algorithm would make the following comparisons:

  - `/` is more specific than `/blog` (incorrect)
  - `/blog/[...slug]` is more specific than `/` (correct)
  - `/blog` is more specific than `/blog/[...slug]` (correct)

  Although the incorrect first comparison is not a problem by itself, it could cause the algorithm to make the wrong decision.
  Depending on the other routes in the project, the sorting could perform just the last two comparisons and by transitivity infer the inverse of the third (`/blog/[...slug` > `/` > `/blog`), which is incorrect.

  Now the algorithm doesn't have a special case for index pages and instead does the comparison soleley for rest parameter segments and their immediate parents, which is consistent with the transitivity property.

- [#10120](https://github.com/withastro/astro/pull/10120) [`787e6f52470cf07fb50c865948b2bc8fe45a6d31`](https://github.com/withastro/astro/commit/787e6f52470cf07fb50c865948b2bc8fe45a6d31) Thanks [@bluwy](https://github.com/bluwy)! - Updates and supports Vite 5.1

- [#10096](https://github.com/withastro/astro/pull/10096) [`227cd83a51bbd451dc223fd16f4cf1b87b8e44f8`](https://github.com/withastro/astro/commit/227cd83a51bbd451dc223fd16f4cf1b87b8e44f8) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes edge case on i18n fallback routes

  Previously index routes deeply nested in the default locale, like `/some/nested/index.astro` could be mistaked as the root index for the default locale, resulting in an incorrect redirect on `/`.

- [#10112](https://github.com/withastro/astro/pull/10112) [`476b79a61165d0aac5e98459a4ec90762050a14b`](https://github.com/withastro/astro/commit/476b79a61165d0aac5e98459a4ec90762050a14b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Renames the home Astro Devoolbar App to `astro:home`

- [#10117](https://github.com/withastro/astro/pull/10117) [`51b6ff7403c1223b1c399e88373075972c82c24c`](https://github.com/withastro/astro/commit/51b6ff7403c1223b1c399e88373075972c82c24c) Thanks [@hippotastic](https://github.com/hippotastic)! - Fixes an issue where `create astro`, `astro add` and `@astrojs/upgrade` would fail due to unexpected package manager CLI output.

## 4.3.7

### Patch Changes

- [#9857](https://github.com/withastro/astro/pull/9857) [`73bd900754365b006ee730df9f379ba924e5b3fa`](https://github.com/withastro/astro/commit/73bd900754365b006ee730df9f379ba924e5b3fa) Thanks [@iamyunsin](https://github.com/iamyunsin)! - Fixes false positives in the dev overlay audit when multiple `role` values exist.

- [#10075](https://github.com/withastro/astro/pull/10075) [`71273edbb429b5afdba6f8ee14681b66e4c09ecc`](https://github.com/withastro/astro/commit/71273edbb429b5afdba6f8ee14681b66e4c09ecc) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves error messages for island hydration.

- [#10072](https://github.com/withastro/astro/pull/10072) [`8106178043050d142bf385bed2990730518f28e2`](https://github.com/withastro/astro/commit/8106178043050d142bf385bed2990730518f28e2) Thanks [@lilnasy](https://github.com/lilnasy)! - Clarifies error messages in endpoint routing.

- [#9971](https://github.com/withastro/astro/pull/9971) [`d9266c4467ca0faa1213c1a5995164e5655ab375`](https://github.com/withastro/astro/commit/d9266c4467ca0faa1213c1a5995164e5655ab375) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where ReadableStream wasn't canceled in dev mode

## 4.3.6

### Patch Changes

- [#10063](https://github.com/withastro/astro/pull/10063) [`dac759798c111494e76affd2c2504d63944871fe`](https://github.com/withastro/astro/commit/dac759798c111494e76affd2c2504d63944871fe) Thanks [@marwan-mohamed12](https://github.com/marwan-mohamed12)! - Moves `shikiji-core` from `devDependencies` to `dependencies` to prevent type errors

- [#10067](https://github.com/withastro/astro/pull/10067) [`989ea63bb2a5a670021541198aa70b8dc7c4bd2f`](https://github.com/withastro/astro/commit/989ea63bb2a5a670021541198aa70b8dc7c4bd2f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression in the `astro:i18n` module, where the functions `getAbsoluteLocaleUrl` and `getAbsoluteLocaleUrlList` returned a URL with double slash with a certain combination of options.

- [#10060](https://github.com/withastro/astro/pull/10060) [`1810309e65c596266355c3b7bb36cdac70f3305e`](https://github.com/withastro/astro/commit/1810309e65c596266355c3b7bb36cdac70f3305e) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where custom client directives added by integrations broke builds with a custom root.

- [#9991](https://github.com/withastro/astro/pull/9991) [`8fb67c81bb84530b39df4a1449c0862def0854af`](https://github.com/withastro/astro/commit/8fb67c81bb84530b39df4a1449c0862def0854af) Thanks [@ktym4a](https://github.com/ktym4a)! - Increases compatibility with standard browser behavior by changing where view transitions occur on browser back navigation.

## 4.3.5

### Patch Changes

- [#10022](https://github.com/withastro/astro/pull/10022) [`3fc76efb2a8faa47edf67562a1f0c84a19be1b33`](https://github.com/withastro/astro/commit/3fc76efb2a8faa47edf67562a1f0c84a19be1b33) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression where types for the `astro:content` module did not include required exports, leading to typescript errors.

- [#10016](https://github.com/withastro/astro/pull/10016) [`037e4f12dd2f460d66f72c9f2d992b95e74d2da9`](https://github.com/withastro/astro/commit/037e4f12dd2f460d66f72c9f2d992b95e74d2da9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where routes with a name that start with the name of the `i18n.defaultLocale` were incorrectly returning a 404 response.

## 4.3.4

### Patch Changes

- [#10013](https://github.com/withastro/astro/pull/10013) [`e6b5306a7de779ce495d0ff076d302de0aa57eaf`](https://github.com/withastro/astro/commit/e6b5306a7de779ce495d0ff076d302de0aa57eaf) Thanks [@delucis](https://github.com/delucis)! - Fixes a regression in content collection types

- [#10003](https://github.com/withastro/astro/pull/10003) [`ce4283331f18c6178654dd705e3cf02efeef004a`](https://github.com/withastro/astro/commit/ce4283331f18c6178654dd705e3cf02efeef004a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds support for `.strict()` on content collection schemas when a custom `slug` is present.

## 4.3.3

### Patch Changes

- [#9998](https://github.com/withastro/astro/pull/9998) [`18ac0940ea1b49b6b0ddd9be1f96aef416e2d7ee`](https://github.com/withastro/astro/commit/18ac0940ea1b49b6b0ddd9be1f96aef416e2d7ee) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug in `Astro.currentLocale` that wasn't returning the correct locale when a locale is configured via `path`

- [#9998](https://github.com/withastro/astro/pull/9998) [`18ac0940ea1b49b6b0ddd9be1f96aef416e2d7ee`](https://github.com/withastro/astro/commit/18ac0940ea1b49b6b0ddd9be1f96aef416e2d7ee) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression in `Astro.currentLocale` where it stopped working properly with dynamic routes

- [#9956](https://github.com/withastro/astro/pull/9956) [`81acac24a3cac5a9143155c1d9f838ea84a70421`](https://github.com/withastro/astro/commit/81acac24a3cac5a9143155c1d9f838ea84a70421) Thanks [@matthewp](https://github.com/matthewp)! - Fixes HMR for MDX dependencies in Content Collections

- [#9999](https://github.com/withastro/astro/pull/9999) [`c53a31321a935e4be04809046d7e0ba3cc41b272`](https://github.com/withastro/astro/commit/c53a31321a935e4be04809046d7e0ba3cc41b272) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Rollbacks the feature which allowed to dynamically generate slots with variable slot names due to unexpected regressions.

- [#9906](https://github.com/withastro/astro/pull/9906) [`3c0876cbed5033e6b5b42cc2b9d8b393d7e5a55e`](https://github.com/withastro/astro/commit/3c0876cbed5033e6b5b42cc2b9d8b393d7e5a55e) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the types for the `astro:content` module by making low fidelity types available before running `astro sync`

## 4.3.2

### Patch Changes

- [#9932](https://github.com/withastro/astro/pull/9932) [`9f0d89fa7e9e7c08c8600b0c49c2cce7489a7582`](https://github.com/withastro/astro/commit/9f0d89fa7e9e7c08c8600b0c49c2cce7489a7582) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where a warning was logged even when the feature `i18nDomains` wasn't enabled

- [#9907](https://github.com/withastro/astro/pull/9907) [`6c894af5ab79f290f4ff7feb68617a66e91febc1`](https://github.com/withastro/astro/commit/6c894af5ab79f290f4ff7feb68617a66e91febc1) Thanks [@ktym4a](https://github.com/ktym4a)! - Load 404.html on all non-existent paths on astro preview.

## 4.3.1

### Patch Changes

- [#9841](https://github.com/withastro/astro/pull/9841) [`27ea080e24e2c5cdc59b63b1dfe0a83a0c696597`](https://github.com/withastro/astro/commit/27ea080e24e2c5cdc59b63b1dfe0a83a0c696597) Thanks [@kristianbinau](https://github.com/kristianbinau)! - Makes the warning clearer when having a custom `base` and requesting a public URL without it

- [#9888](https://github.com/withastro/astro/pull/9888) [`9d2fdb293d6a7323e10126cebad18ef9a2ea2800`](https://github.com/withastro/astro/commit/9d2fdb293d6a7323e10126cebad18ef9a2ea2800) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves error handling logic for the `astro sync` command.

- [#9918](https://github.com/withastro/astro/pull/9918) [`d52529e09450c84933dd15d6481edb32269f537b`](https://github.com/withastro/astro/commit/d52529e09450c84933dd15d6481edb32269f537b) Thanks [@LarryIVC](https://github.com/LarryIVC)! - Adds the `name` attribute to the `<details>` tag type

- [#9938](https://github.com/withastro/astro/pull/9938) [`1568afb78a163db63a4cde146dec87785a83db1d`](https://github.com/withastro/astro/commit/1568afb78a163db63a4cde146dec87785a83db1d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression where middleware did not run for prerendered pages and endpoints.

- [#9931](https://github.com/withastro/astro/pull/9931) [`44674418965d658733d3602668a9354e18f8ef89`](https://github.com/withastro/astro/commit/44674418965d658733d3602668a9354e18f8ef89) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression where a response created with `Response.redirect` or containing `null` as the body never completed in node-based adapters.

## 4.3.0

### Minor Changes

- [#9839](https://github.com/withastro/astro/pull/9839) [`58f9e393a188702eef5329e41deff3dcb65a3230`](https://github.com/withastro/astro/commit/58f9e393a188702eef5329e41deff3dcb65a3230) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `ComponentProps` type export from `astro/types` to get the props type of an Astro component.

  ```astro
  ---
  import type { ComponentProps } from 'astro/types';
  import Button from './Button.astro';

  type myButtonProps = ComponentProps<typeof Button>;
  ---
  ```

- [#9159](https://github.com/withastro/astro/pull/9159) [`7d937c158959e76443a02f740b10e251d14dbd8c`](https://github.com/withastro/astro/commit/7d937c158959e76443a02f740b10e251d14dbd8c) Thanks [@bluwy](https://github.com/bluwy)! - Adds CLI shortcuts as an easter egg for the dev server:

  - `o + enter`: opens the site in your browser
  - `q + enter`: quits the dev server
  - `h + enter`: prints all available shortcuts

- [#9764](https://github.com/withastro/astro/pull/9764) [`fad4f64aa149086feda2d1f3a0b655767034f1a8`](https://github.com/withastro/astro/commit/fad4f64aa149086feda2d1f3a0b655767034f1a8) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `build.format` configuration option: `'preserve'`. This option will preserve your source structure in the final build.

  The existing configuration options, `file` and `directory`, either build all of your HTML pages as files matching the route name (e.g. `/about.html`) or build all your files as `index.html` within a nested directory structure (e.g. `/about/index.html`), respectively. It was not previously possible to control the HTML file built on a per-file basis.

  One limitation of `build.format: 'file'` is that it cannot create `index.html` files for any individual routes (other than the base path of `/`) while otherwise building named files. Creating explicit index pages within your file structure still generates a file named for the page route (e.g. `src/pages/about/index.astro` builds `/about.html`) when using the `file` configuration option.

  Rather than make a breaking change to allow `build.format: 'file'` to be more flexible, we decided to create a new `build.format: 'preserve'`.

  The new format will preserve how the filesystem is structured and make sure that is mirrored over to production. Using this option:

  - `about.astro` becomes `about.html`
  - `about/index.astro` becomes `about/index.html`

  See the [`build.format` configuration options reference](https://docs.astro.build/en/reference/configuration-reference/#buildformat) for more details.

- [#9143](https://github.com/withastro/astro/pull/9143) [`041fdd5c89920f7ccf944b095f29e451f78b0e28`](https://github.com/withastro/astro/commit/041fdd5c89920f7ccf944b095f29e451f78b0e28) Thanks [@ematipico](https://github.com/ematipico)! - Adds experimental support for a new i18n domain routing option (`"domains"`) that allows you to configure different domains for individual locales in entirely server-rendered projects.

  To enable this in your project, first configure your `server`-rendered project's i18n routing with your preferences if you have not already done so. Then, set the `experimental.i18nDomains` flag to `true` and add `i18n.domains` to map any of your supported `locales` to custom URLs:

  ```js
  //astro.config.mjs"
  import { defineConfig } from 'astro/config';
  export default defineConfig({
    site: 'https://example.com',
    output: 'server', // required, with no prerendered pages
    adapter: node({
      mode: 'standalone',
    }),
    i18n: {
      defaultLocale: 'en',
      locales: ['es', 'en', 'fr', 'ja'],
      routing: {
        prefixDefaultLocale: false,
      },
      domains: {
        fr: 'https://fr.example.com',
        es: 'https://example.es',
      },
    },
    experimental: {
      i18nDomains: true,
    },
  });
  ```

  With `"domains"` configured, the URLs emitted by `getAbsoluteLocaleUrl()` and `getAbsoluteLocaleUrlList()` will use the options set in `i18n.domains`.

  ```js
  import { getAbsoluteLocaleUrl } from 'astro:i18n';

  getAbsoluteLocaleUrl('en', 'about'); // will return "https://example.com/about"
  getAbsoluteLocaleUrl('fr', 'about'); // will return "https://fr.example.com/about"
  getAbsoluteLocaleUrl('es', 'about'); // will return "https://example.es/about"
  getAbsoluteLocaleUrl('ja', 'about'); // will return "https://example.com/ja/about"
  ```

  Similarly, your localized files will create routes at corresponding URLs:

  - The file `/en/about.astro` will be reachable at the URL `https://example.com/about`.
  - The file `/fr/about.astro` will be reachable at the URL `https://fr.example.com/about`.
  - The file `/es/about.astro` will be reachable at the URL `https://example.es/about`.
  - The file `/ja/about.astro` will be reachable at the URL `https://example.com/ja/about`.

  See our [Internationalization Guide](https://docs.astro.build/en/guides/internationalization/#domains-experimental) for more details and limitations on this experimental routing feature.

- [#9755](https://github.com/withastro/astro/pull/9755) [`d4b886141bb342ac71b1c060e67d66ca2ffbb8bd`](https://github.com/withastro/astro/commit/d4b886141bb342ac71b1c060e67d66ca2ffbb8bd) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Fixes an issue where images in Markdown required a relative specifier (e.g. `./`)

  Now, you can use the standard `![](img.png)` syntax in Markdown files for images colocated in the same folder: no relative specifier required!

  There is no need to update your project; your existing images will still continue to work. However, you may wish to remove any relative specifiers from these Markdown images as they are no longer necessary:

  ```diff
  - ![A cute dog](./dog.jpg)
  + ![A cute dog](dog.jpg)
  <!-- This dog lives in the same folder as my article! -->
  ```

### Patch Changes

- [#9908](https://github.com/withastro/astro/pull/9908) [`2f6d1faa6f2d6de2d4ccd2a48adf5adadc82e593`](https://github.com/withastro/astro/commit/2f6d1faa6f2d6de2d4ccd2a48adf5adadc82e593) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves http behavior relating to errors encountered while streaming a response.

- [#9877](https://github.com/withastro/astro/pull/9877) [`7be5f94dcfc73a78d0fb301eeff51614d987a165`](https://github.com/withastro/astro/commit/7be5f94dcfc73a78d0fb301eeff51614d987a165) Thanks [@fabiankachlock](https://github.com/fabiankachlock)! - Fixes the content config type path on windows

- [#9143](https://github.com/withastro/astro/pull/9143) [`041fdd5c89920f7ccf944b095f29e451f78b0e28`](https://github.com/withastro/astro/commit/041fdd5c89920f7ccf944b095f29e451f78b0e28) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the function `getLocaleRelativeUrlList` wasn't normalising the paths by default

- [#9911](https://github.com/withastro/astro/pull/9911) [`aaedb848b1d6f683840035865528506a346ea659`](https://github.com/withastro/astro/commit/aaedb848b1d6f683840035865528506a346ea659) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes an issue where some adapters that do not include a `start()` export would error rather than silently proceed

## 4.2.8

### Patch Changes

- [#9884](https://github.com/withastro/astro/pull/9884) [`37369550ab57ca529fd6c796e5b0e96e897ca6e5`](https://github.com/withastro/astro/commit/37369550ab57ca529fd6c796e5b0e96e897ca6e5) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where multiple cookies were sent in a single Set-Cookie header in the dev mode.

- [#9876](https://github.com/withastro/astro/pull/9876) [`e9027f194b939ac5a4d795ee1a2c24e4a6fbefc0`](https://github.com/withastro/astro/commit/e9027f194b939ac5a4d795ee1a2c24e4a6fbefc0) Thanks [@friedemannsommer](https://github.com/friedemannsommer)! - Fixes an issue where using `Response.redirect` in an endpoint led to an error.

- [#9882](https://github.com/withastro/astro/pull/9882) [`13c3b712c7ba45d0081f459fc06f142216a4ec59`](https://github.com/withastro/astro/commit/13c3b712c7ba45d0081f459fc06f142216a4ec59) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves handling of YAML parsing errors

- [#9878](https://github.com/withastro/astro/pull/9878) [`a40a0ff5883c7915dd55881dcebd052b9f94a0eb`](https://github.com/withastro/astro/commit/a40a0ff5883c7915dd55881dcebd052b9f94a0eb) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where setting trailingSlash to "never" had no effect on `Astro.url`.

## 4.2.7

### Patch Changes

- [#9840](https://github.com/withastro/astro/pull/9840) [`70fdf1a5c660057152c1ca111dcc89ceda5c8840`](https://github.com/withastro/astro/commit/70fdf1a5c660057152c1ca111dcc89ceda5c8840) Thanks [@delucis](https://github.com/delucis)! - Expose `ContentConfig` type from `astro:content`

- [#9865](https://github.com/withastro/astro/pull/9865) [`00ba9f1947ca9016cd0ee4d8f6048027fab2ab9a`](https://github.com/withastro/astro/commit/00ba9f1947ca9016cd0ee4d8f6048027fab2ab9a) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug in `Astro.currentLocale` where the value was incorrectly computed during the build.

- [#9838](https://github.com/withastro/astro/pull/9838) [`0a06d87a1e2b94be00a954f350c184222fa0594d`](https://github.com/withastro/astro/commit/0a06d87a1e2b94be00a954f350c184222fa0594d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where `astro:i18n` could not be used in framework components.

- Updated dependencies [[`44c957f893c6bf5f5b7c78301de7b21c5975584d`](https://github.com/withastro/astro/commit/44c957f893c6bf5f5b7c78301de7b21c5975584d)]:
  - @astrojs/markdown-remark@4.2.1

## 4.2.6

### Patch Changes

- [#9825](https://github.com/withastro/astro/pull/9825) [`e4370e9e9dd862425eced25823c82e77d9516927`](https://github.com/withastro/astro/commit/e4370e9e9dd862425eced25823c82e77d9516927) Thanks [@tugrulates](https://github.com/tugrulates)! - Fixes false positive aria role errors on interactive elements

- [#9828](https://github.com/withastro/astro/pull/9828) [`a3df9d83ca92abb5f08f576631019c1604204bd9`](https://github.com/withastro/astro/commit/a3df9d83ca92abb5f08f576631019c1604204bd9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where shared modules among pages and middleware were transformed to a no-op after the build.

- [#9834](https://github.com/withastro/astro/pull/9834) [`1885cea308a62b173a50967cf5a0b174b3c3f3f1`](https://github.com/withastro/astro/commit/1885cea308a62b173a50967cf5a0b174b3c3f3f1) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes third-party dev toolbar apps not loading correctly when using absolute paths on Windows

## 4.2.5

### Patch Changes

- [#9818](https://github.com/withastro/astro/pull/9818) [`d688954c5adba75b0d676694fbf5fb0da1c0af13`](https://github.com/withastro/astro/commit/d688954c5adba75b0d676694fbf5fb0da1c0af13) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Improves the wording of a few confusing error messages

- [#9680](https://github.com/withastro/astro/pull/9680) [`5d7db1dbb0ff06db98e08b0ca241ff09d0b8b44d`](https://github.com/withastro/astro/commit/5d7db1dbb0ff06db98e08b0ca241ff09d0b8b44d) Thanks [@loucyx](https://github.com/loucyx)! - Fixes types generation from Content Collections config file

- [#9822](https://github.com/withastro/astro/pull/9822) [`bd880e8437ea2df16f322f604865c1148a9fd4cf`](https://github.com/withastro/astro/commit/bd880e8437ea2df16f322f604865c1148a9fd4cf) Thanks [@liruifengv](https://github.com/liruifengv)! - Applies the correct escaping to identifiers used with `transition:name`.

- [#9830](https://github.com/withastro/astro/pull/9830) [`f3d22136e53fd902310024519fc4de83f0a58039`](https://github.com/withastro/astro/commit/f3d22136e53fd902310024519fc4de83f0a58039) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where 404 responses from endpoints were replaced with contents of 404.astro in dev mode.

- [#9816](https://github.com/withastro/astro/pull/9816) [`2a44c8f93201958fba2d1e83046eabcaef186b7c`](https://github.com/withastro/astro/commit/2a44c8f93201958fba2d1e83046eabcaef186b7c) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds telemetry for when apps are toggled in the dev toolbar. This data is completely anonymous and only the names of built-in apps are shared with us. This data will help us monitor how much the dev toolbar is used and which apps are used more. For more information on how Astro collects telemetry, visit the following page: https://astro.build/telemetry/

- [#9807](https://github.com/withastro/astro/pull/9807) [`b3f313138bb314e2b416c29cda507383c2a9f816`](https://github.com/withastro/astro/commit/b3f313138bb314e2b416c29cda507383c2a9f816) Thanks [@bluwy](https://github.com/bluwy)! - Fixes environment variables replacement for `export const prerender`

- [#9790](https://github.com/withastro/astro/pull/9790) [`267c5aa2c7706f0ea3447f20a09d85aa560866ad`](https://github.com/withastro/astro/commit/267c5aa2c7706f0ea3447f20a09d85aa560866ad) Thanks [@lilnasy](https://github.com/lilnasy)! - Refactors internals of the `astro:i18n` module to be more maintainable.

- [#9776](https://github.com/withastro/astro/pull/9776) [`dc75180aa698b298264362bab7f00391af427798`](https://github.com/withastro/astro/commit/dc75180aa698b298264362bab7f00391af427798) Thanks [@lilnasy](https://github.com/lilnasy)! - Simplifies internals that handle middleware.

## 4.2.4

### Patch Changes

- [#9792](https://github.com/withastro/astro/pull/9792) [`e22cb8b10c0ca9f6d88cab53cd2713f57875ab4b`](https://github.com/withastro/astro/commit/e22cb8b10c0ca9f6d88cab53cd2713f57875ab4b) Thanks [@tugrulates](https://github.com/tugrulates)! - Accept aria role `switch` on toolbar audit.

- [#9606](https://github.com/withastro/astro/pull/9606) [`e6945bcf23b6ad29388bbadaf5bb3cc31dd4a114`](https://github.com/withastro/astro/commit/e6945bcf23b6ad29388bbadaf5bb3cc31dd4a114) Thanks [@eryue0220](https://github.com/eryue0220)! - Fixes escaping behavior for `.html` files and components

- [#9786](https://github.com/withastro/astro/pull/9786) [`5b29550996a7f5459a0d611feea6e51d44e1d8ed`](https://github.com/withastro/astro/commit/5b29550996a7f5459a0d611feea6e51d44e1d8ed) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes a regression in routing priority for index pages in rest parameter folders and dynamic sibling trees.

  Considering the following tree:

  ```
  src/pages/
  ├── index.astro
  ├── static.astro
  ├── [dynamic_file].astro
  ├── [...rest_file].astro
  ├── blog/
  │   └── index.astro
  ├── [dynamic_folder]/
  │   ├── index.astro
  │   ├── static.astro
  │   └── [...rest].astro
  └── [...rest_folder]/
      ├── index.astro
      └── static.astro
  ```

  The routes are sorted in this order:

  ```
  /src/pages/index.astro
  /src/pages/blog/index.astro
  /src/pages/static.astro
  /src/pages/[dynamic_folder]/index.astro
  /src/pages/[dynamic_file].astro
  /src/pages/[dynamic_folder]/static.astro
  /src/pages/[dynamic_folder]/[...rest].astro
  /src/pages/[...rest_folder]/static.astro
  /src/pages/[...rest_folder]/index.astro
  /src/pages/[...rest_file]/index.astro
  ```

  This allows for index files to be used as overrides to rest parameter routes on SSR when the rest parameter matching `undefined` is not desired.

- [#9775](https://github.com/withastro/astro/pull/9775) [`075706f26d2e11e66ef8b52288d07e3c0fa97eb1`](https://github.com/withastro/astro/commit/075706f26d2e11e66ef8b52288d07e3c0fa97eb1) Thanks [@lilnasy](https://github.com/lilnasy)! - Simplifies internals that handle endpoints.

- [#9773](https://github.com/withastro/astro/pull/9773) [`9aa7a5368c502ae488d3a173e732d81f3d000e98`](https://github.com/withastro/astro/commit/9aa7a5368c502ae488d3a173e732d81f3d000e98) Thanks [@LunaticMuch](https://github.com/LunaticMuch)! - Raises the required vite version to address a vulnerability in `vite.server.fs.deny` that affected the dev mode.

- [#9781](https://github.com/withastro/astro/pull/9781) [`ccc05d54014e24c492ca5fddd4862f318aac8172`](https://github.com/withastro/astro/commit/ccc05d54014e24c492ca5fddd4862f318aac8172) Thanks [@stevenbenner](https://github.com/stevenbenner)! - Fix build failure when image file name includes special characters

## 4.2.3

### Patch Changes

- [#9768](https://github.com/withastro/astro/pull/9768) [`eed0e8757c35dde549707e71c45862438a043fb0`](https://github.com/withastro/astro/commit/eed0e8757c35dde549707e71c45862438a043fb0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix apps being able to crash the dev toolbar in certain cases

## 4.2.2

### Patch Changes

- [#9712](https://github.com/withastro/astro/pull/9712) [`ea6cbd06a2580527786707ec735079ff9abd0ec0`](https://github.com/withastro/astro/commit/ea6cbd06a2580527786707ec735079ff9abd0ec0) Thanks [@bluwy](https://github.com/bluwy)! - Improves HMR behavior for style-only changes in `.astro` files

- [#9739](https://github.com/withastro/astro/pull/9739) [`3ecb3ef64326a8f77aa170df1e3c89cb5c12cc93`](https://github.com/withastro/astro/commit/3ecb3ef64326a8f77aa170df1e3c89cb5c12cc93) Thanks [@ematipico](https://github.com/ematipico)! - Makes i18n redirects take the `build.format` configuration into account

- [#9762](https://github.com/withastro/astro/pull/9762) [`1fba85681e86aa83d24336d4209cafbc76b37607`](https://github.com/withastro/astro/commit/1fba85681e86aa83d24336d4209cafbc76b37607) Thanks [@ematipico](https://github.com/ematipico)! - Adds `popovertarget" to the attribute that can be passed to the `button` element

- [#9605](https://github.com/withastro/astro/pull/9605) [`8ce40a417c854d9e6a4fa7d5a85d50a6436b4a3c`](https://github.com/withastro/astro/commit/8ce40a417c854d9e6a4fa7d5a85d50a6436b4a3c) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Adds support for dynamic slot names

- [#9381](https://github.com/withastro/astro/pull/9381) [`9e01f9cc1efcfb938355829676d51b24818ab2bb`](https://github.com/withastro/astro/commit/9e01f9cc1efcfb938355829676d51b24818ab2bb) Thanks [@martrapp](https://github.com/martrapp)! - Improves the CLI output of `astro preferences list` to include additional relevant information

- [#9741](https://github.com/withastro/astro/pull/9741) [`73d74402007896204ee965f6553dc83b3dec8d2f`](https://github.com/withastro/astro/commit/73d74402007896204ee965f6553dc83b3dec8d2f) Thanks [@taktran](https://github.com/taktran)! - Fixes an issue where dot files were not copied over from the public folder to the output folder, when build command was run in a folder other than the root of the project.

- [#9730](https://github.com/withastro/astro/pull/9730) [`8d2e5db096f1e7b098511b4fe9357434a6ff0703`](https://github.com/withastro/astro/commit/8d2e5db096f1e7b098511b4fe9357434a6ff0703) Thanks [@Blede2000](https://github.com/Blede2000)! - Allow i18n routing utilities like getRelativeLocaleUrl to also get the default local path when redirectToDefaultLocale is false

- Updated dependencies [[`53c69dcc82cdf4000aff13a6c11fffe19096cf45`](https://github.com/withastro/astro/commit/53c69dcc82cdf4000aff13a6c11fffe19096cf45), [`2f81cffa9da9db0e2802d303f94feaee8d2f54ec`](https://github.com/withastro/astro/commit/2f81cffa9da9db0e2802d303f94feaee8d2f54ec), [`a505190933365268d48139a5f197a3cfb5570870`](https://github.com/withastro/astro/commit/a505190933365268d48139a5f197a3cfb5570870)]:
  - @astrojs/markdown-remark@4.2.0

## 4.2.1

### Patch Changes

- [#9726](https://github.com/withastro/astro/pull/9726) [`a4b696def3a7eb18c1ae48b10fd3758a1874b6fe`](https://github.com/withastro/astro/commit/a4b696def3a7eb18c1ae48b10fd3758a1874b6fe) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes a regression in routing priority between `index.astro` and dynamic routes with rest parameters

## 4.2.0

### Minor Changes

- [#9566](https://github.com/withastro/astro/pull/9566) [`165cfc154be477337037185c32b308616d1ed6fa`](https://github.com/withastro/astro/commit/165cfc154be477337037185c32b308616d1ed6fa) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Allows remark plugins to pass options specifying how images in `.md` files will be optimized

- [#9661](https://github.com/withastro/astro/pull/9661) [`d6edc7540864cf5d294d7b881eb886a3804f6d05`](https://github.com/withastro/astro/commit/d6edc7540864cf5d294d7b881eb886a3804f6d05) Thanks [@ematipico](https://github.com/ematipico)! - Adds new helper functions for adapter developers.

  - `Astro.clientAddress` can now be passed directly to the `app.render()` method.

  ```ts
  const response = await app.render(request, { clientAddress: '012.123.23.3' });
  ```

  - Helper functions for converting Node.js HTTP request and response objects to web-compatible `Request` and `Response` objects are now provided as static methods on the `NodeApp` class.

  ```ts
  http.createServer((nodeReq, nodeRes) => {
    const request: Request = NodeApp.createRequest(nodeReq);
    const response = await app.render(request);
    await NodeApp.writeResponse(response, nodeRes);
  });
  ```

  - Cookies added via `Astro.cookies.set()` can now be automatically added to the `Response` object by passing the `addCookieHeader` option to `app.render()`.

  ```diff
  -const response = await app.render(request)
  -const setCookieHeaders: Array<string> = Array.from(app.setCookieHeaders(webResponse));

  -if (setCookieHeaders.length) {
  -    for (const setCookieHeader of setCookieHeaders) {
  -        headers.append('set-cookie', setCookieHeader);
  -    }
  -}
  +const response = await app.render(request, { addCookieHeader: true })
  ```

- [#9638](https://github.com/withastro/astro/pull/9638) [`f1a61268061b8834f39a9b38bca043ae41caed04`](https://github.com/withastro/astro/commit/f1a61268061b8834f39a9b38bca043ae41caed04) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new `i18n.routing` config option `redirectToDefaultLocale` to disable automatic redirects of the root URL (`/`) to the default locale when `prefixDefaultLocale: true` is set.

  In projects where every route, including the default locale, is prefixed with `/[locale]/` path, this property allows you to control whether or not `src/pages/index.astro` should automatically redirect your site visitors from `/` to `/[defaultLocale]`.

  You can now opt out of this automatic redirection by setting `redirectToDefaultLocale: false`:

  ```js
  // astro.config.mjs
  export default defineConfig({
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'fr'],
      routing: {
        prefixDefaultLocale: true,
        redirectToDefaultLocale: false,
      },
    },
  });
  ```

- [#9671](https://github.com/withastro/astro/pull/9671) [`8521ff77fbf7e867701cc30d18253856914dbd1b`](https://github.com/withastro/astro/commit/8521ff77fbf7e867701cc30d18253856914dbd1b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Removes the requirement for non-content files and assets inside content collections to be prefixed with an underscore. For files with extensions like `.astro` or `.css`, you can now remove underscores without seeing a warning in the terminal.

  ```diff
  src/content/blog/
  post.mdx
  - _styles.css
  - _Component.astro
  + styles.css
  + Component.astro
  ```

  Continue to use underscores in your content collections to exclude individual content files, such as drafts, from the build output.

- [#9567](https://github.com/withastro/astro/pull/9567) [`3a4d5ec8001ebf95c917fdc0d186d29650533d93`](https://github.com/withastro/astro/commit/3a4d5ec8001ebf95c917fdc0d186d29650533d93) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Improves the a11y-missing-content rule and error message for audit feature of dev-overlay. This also fixes an error where this check was falsely reporting accessibility errors.

- [#9643](https://github.com/withastro/astro/pull/9643) [`e9a72d9a91a3741566866bcaab11172cb0dc7d31`](https://github.com/withastro/astro/commit/e9a72d9a91a3741566866bcaab11172cb0dc7d31) Thanks [@blackmann](https://github.com/blackmann)! - Adds a new `markdown.shikiConfig.transformers` config option. You can use this option to transform the Shikiji hast (AST format of the generated HTML) to customize the final HTML. Also updates Shikiji to the latest stable version.

  See [Shikiji's documentation](https://shikiji.netlify.app/guide/transformers) for more details about creating your own custom transformers, and [a list of common transformers](https://shikiji.netlify.app/packages/transformers) you can add directly to your project.

- [#9644](https://github.com/withastro/astro/pull/9644) [`a5f1682347e602330246129d4666a9227374c832`](https://github.com/withastro/astro/commit/a5f1682347e602330246129d4666a9227374c832) Thanks [@rossrobino](https://github.com/rossrobino)! - Adds an experimental flag `clientPrerender` to prerender your prefetched pages on the client with the [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API).

  ```js
  // astro.config.mjs
  {
    prefetch: {
      prefetchAll: true,
      defaultStrategy: 'viewport',
    },
    experimental: {
      clientPrerender: true,
    },
  }
  ```

  Enabling this feature overrides the default `prefetch` behavior globally to prerender links on the client according to your `prefetch` configuration. Instead of appending a `<link>` tag to the head of the document or fetching the page with JavaScript, a `<script>` tag will be appended with the corresponding speculation rules.

  Client side prerendering requires browser support. If the Speculation Rules API is not supported, `prefetch` will fallback to the supported strategy.

  See the [Prefetch Guide](https://docs.astro.build/en/guides/prefetch/) for more `prefetch` options and usage.

- [#9439](https://github.com/withastro/astro/pull/9439) [`fd17f4a40b83d14350dce691aeb79d87e8fcaf40`](https://github.com/withastro/astro/commit/fd17f4a40b83d14350dce691aeb79d87e8fcaf40) Thanks [@Fryuni](https://github.com/Fryuni)! - Adds an experimental flag `globalRoutePriority` to prioritize redirects and injected routes equally alongside file-based project routes, following the same [route priority order rules](https://docs.astro.build/en/core-concepts/routing/#route-priority-order) for all routes.

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      globalRoutePriority: true,
    },
  });
  ```

  Enabling this feature ensures that all routes in your project follow the same, predictable route priority order rules. In particular, this avoids an issue where redirects or injected routes (e.g. from an integration) would always take precedence over local route definitions, making it impossible to override some routes locally.

  The following table shows which route builds certain page URLs when file-based routes, injected routes, and redirects are combined as shown below:

  - File-based route: `/blog/post/[pid]`
  - File-based route: `/[page]`
  - Injected route: `/blog/[...slug]`
  - Redirect: `/blog/tags/[tag]` -> `/[tag]`
  - Redirect: `/posts` -> `/blog`

  URLs are handled by the following routes:

  | Page               | Current Behavior                 | Global Routing Priority Behavior    |
  | ------------------ | -------------------------------- | ----------------------------------- |
  | `/blog/tags/astro` | Injected route `/blog/[...slug]` | Redirect to `/tags/[tag]`           |
  | `/blog/post/0`     | Injected route `/blog/[...slug]` | File-based route `/blog/post/[pid]` |
  | `/posts`           | File-based route `/[page]`       | Redirect to `/blog`                 |

  In the event of route collisions, where two routes of equal route priority attempt to build the same URL, Astro will log a warning identifying the conflicting routes.

### Patch Changes

- [#9719](https://github.com/withastro/astro/pull/9719) [`7e1db8b4ce2da9e044ea0393e533c6db2561ac90`](https://github.com/withastro/astro/commit/7e1db8b4ce2da9e044ea0393e533c6db2561ac90) Thanks [@bluwy](https://github.com/bluwy)! - Refactors Vite config to avoid Vite 5.1 warnings

- [#9439](https://github.com/withastro/astro/pull/9439) [`fd17f4a40b83d14350dce691aeb79d87e8fcaf40`](https://github.com/withastro/astro/commit/fd17f4a40b83d14350dce691aeb79d87e8fcaf40) Thanks [@Fryuni](https://github.com/Fryuni)! - Updates [Astro's routing priority rules](https://docs.astro.build/en/core-concepts/routing/#route-priority-order) to prioritize the most specifically-defined routes.

  Now, routes with **more defined path segments** will take precedence over less specific routes.

  For example, `/blog/posts/[pid].astro` (3 path segments) takes precedence over `/blog/[...slug].astro` (2 path segments). This means that:

  - `/pages/blog/posts/[id].astro` will build routes of the form `/blog/posts/1` and `/blog/posts/a`
  - `/pages/blog/[...slug].astro` will build routes of a variety of forms, including `blog/1` and `/blog/posts/1/a`, but will not build either of the previous routes.

  For a complete list of Astro's routing priority rules, please see the [routing guide](https://docs.astro.build/en/core-concepts/routing/#route-priority-order). This should not be a breaking change, but you may wish to inspect your built routes to ensure that your project is unaffected.

- [#9706](https://github.com/withastro/astro/pull/9706) [`1539e04a8e5865027b3a8718c6f142885e7c8d88`](https://github.com/withastro/astro/commit/1539e04a8e5865027b3a8718c6f142885e7c8d88) Thanks [@bluwy](https://github.com/bluwy)! - Simplifies HMR handling, improves circular dependency invalidation, and fixes Astro styles invalidation

- Updated dependencies [[`165cfc154be477337037185c32b308616d1ed6fa`](https://github.com/withastro/astro/commit/165cfc154be477337037185c32b308616d1ed6fa), [`e9a72d9a91a3741566866bcaab11172cb0dc7d31`](https://github.com/withastro/astro/commit/e9a72d9a91a3741566866bcaab11172cb0dc7d31)]:
  - @astrojs/markdown-remark@4.1.0

## 4.1.3

### Patch Changes

- [#9665](https://github.com/withastro/astro/pull/9665) [`d02a3c48a3ce204649d22e17b1e26fb5a6a60bcf`](https://github.com/withastro/astro/commit/d02a3c48a3ce204649d22e17b1e26fb5a6a60bcf) Thanks [@bluwy](https://github.com/bluwy)! - Disables internal file watcher for one-off Vite servers to improve start-up performance

- [#9664](https://github.com/withastro/astro/pull/9664) [`1bf0ddd2777ae5f9fde3fd854a9e75aa56c080f2`](https://github.com/withastro/astro/commit/1bf0ddd2777ae5f9fde3fd854a9e75aa56c080f2) Thanks [@bluwy](https://github.com/bluwy)! - Improves HMR for Astro style and script modules

- [#9668](https://github.com/withastro/astro/pull/9668) [`74008cc23853ed507b144efab02300202c5386ed`](https://github.com/withastro/astro/commit/74008cc23853ed507b144efab02300202c5386ed) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix the passthrough image service not generating `srcset` values properly

- [#9693](https://github.com/withastro/astro/pull/9693) [`d38b2a4fe827e956662fcf457d1f1f84832c2f15`](https://github.com/withastro/astro/commit/d38b2a4fe827e956662fcf457d1f1f84832c2f15) Thanks [@kidylee](https://github.com/kidylee)! - Disables View Transition form handling when the `action` property points to an external URL

- [#9678](https://github.com/withastro/astro/pull/9678) [`091097e60ef38dadb87d7c8c1fc9cb939a248921`](https://github.com/withastro/astro/commit/091097e60ef38dadb87d7c8c1fc9cb939a248921) Thanks [@ematipico](https://github.com/ematipico)! - Adds an error during the build phase in case `i18n.routing.prefixDefaultLocale` is set to `true` and the index page is missing.

- [#9659](https://github.com/withastro/astro/pull/9659) [`39050c6e1f77dc21e87716d95e627a654828ee74`](https://github.com/withastro/astro/commit/39050c6e1f77dc21e87716d95e627a654828ee74) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix Astro wrongfully deleting certain images imported with `?url` when used in tandem with `astro:assets`

- [#9685](https://github.com/withastro/astro/pull/9685) [`35d54b3ddb3310ab4c505d49bd4937b2d25e4078`](https://github.com/withastro/astro/commit/35d54b3ddb3310ab4c505d49bd4937b2d25e4078) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where anchor elements within a custom component could not trigger a view transition.

## 4.1.2

### Patch Changes

- [#9642](https://github.com/withastro/astro/pull/9642) [`cdb7bfa66260afc79b829b617492a01a709a86ef`](https://github.com/withastro/astro/commit/cdb7bfa66260afc79b829b617492a01a709a86ef) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue where View Transitions did not work when navigating to the 404 page

- [#9637](https://github.com/withastro/astro/pull/9637) [`5cba637c4ec39c06794146b0c7fd3225d26dcabb`](https://github.com/withastro/astro/commit/5cba637c4ec39c06794146b0c7fd3225d26dcabb) Thanks [@bluwy](https://github.com/bluwy)! - Improves environment variables replacement in SSR

- [#9658](https://github.com/withastro/astro/pull/9658) [`a3b5695176cd0280438938c1d6caef478a571415`](https://github.com/withastro/astro/commit/a3b5695176cd0280438938c1d6caef478a571415) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue caused by trying to load text/partytown scripts during view transitions

- [#9657](https://github.com/withastro/astro/pull/9657) [`a4f90d95ff97abe59f2a1ef0956cab257ae36838`](https://github.com/withastro/astro/commit/a4f90d95ff97abe59f2a1ef0956cab257ae36838) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the custom status code wasn't correctly computed in the dev server

- [#9627](https://github.com/withastro/astro/pull/9627) [`a700a20291e19cde23705e8e661e833aec7d3095`](https://github.com/withastro/astro/commit/a700a20291e19cde23705e8e661e833aec7d3095) Thanks [@lilnasy](https://github.com/lilnasy)! - Adds a warning when setting cookies will have no effect

- [#9652](https://github.com/withastro/astro/pull/9652) [`e72efd6a9a1e2a70488fd225529617ffd8418534`](https://github.com/withastro/astro/commit/e72efd6a9a1e2a70488fd225529617ffd8418534) Thanks [@bluwy](https://github.com/bluwy)! - Improves environment variables handling by using esbuild to perform replacements

- [#9560](https://github.com/withastro/astro/pull/9560) [`8b9c4844f7b302380835154fab1c3489979fc07d`](https://github.com/withastro/astro/commit/8b9c4844f7b302380835154fab1c3489979fc07d) Thanks [@bluwy](https://github.com/bluwy)! - Fixes tsconfig alias with import.meta.glob

- [#9653](https://github.com/withastro/astro/pull/9653) [`50f39183cfec4a4522c1f935d710e5d9b724993b`](https://github.com/withastro/astro/commit/50f39183cfec4a4522c1f935d710e5d9b724993b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Pin Sharp to 0.32.6 until we can raise our semver requirements. To use the latest version of Sharp, you can add it to your project's dependencies.

## 4.1.1

### Patch Changes

- [#9618](https://github.com/withastro/astro/pull/9618) [`401fd3e8c8957a3bed6469a622cd67b157ca303f`](https://github.com/withastro/astro/commit/401fd3e8c8957a3bed6469a622cd67b157ca303f) Thanks [@ldh3907](https://github.com/ldh3907)! - Adds a second generic parameter to `APIRoute` to type the `params`

- [#9600](https://github.com/withastro/astro/pull/9600) [`47b951b3888a5a8a708d2f9b974f12fba7ec9ed3`](https://github.com/withastro/astro/commit/47b951b3888a5a8a708d2f9b974f12fba7ec9ed3) Thanks [@jacobdalamb](https://github.com/jacobdalamb)! - Improves tailwind config file detection when adding the tailwind integration using `astro add tailwind`

  Tailwind config file ending in `.ts`, `.mts` or `.cts` will now be used instead of creating a new `tailwind.config.mjs` when the tailwind integration is added using `astro add tailwind`.

- [#9622](https://github.com/withastro/astro/pull/9622) [`5156c740506cbf6ec85c95e1663c14cbd438d75b`](https://github.com/withastro/astro/commit/5156c740506cbf6ec85c95e1663c14cbd438d75b) Thanks [@bluwy](https://github.com/bluwy)! - Fixes the Sharp image service `limitInputPixels` option type

## 4.1.0

### Minor Changes

- [#9513](https://github.com/withastro/astro/pull/9513) [`e44f6acf99195a3f29b8390fd9b2c06410551b74`](https://github.com/withastro/astro/commit/e44f6acf99195a3f29b8390fd9b2c06410551b74) Thanks [@wtto00](https://github.com/wtto00)! - Adds a `'load'` prefetch strategy to prefetch links on page load

- [#9377](https://github.com/withastro/astro/pull/9377) [`fe719e27a84c09e46b515252690678c174a25759`](https://github.com/withastro/astro/commit/fe719e27a84c09e46b515252690678c174a25759) Thanks [@bluwy](https://github.com/bluwy)! - Adds "Missing ARIA roles check" and "Unsupported ARIA roles check" audit rules for the dev toolbar

- [#9573](https://github.com/withastro/astro/pull/9573) [`2a8b9c56b9c6918531c57ec38b89474571331aee`](https://github.com/withastro/astro/commit/2a8b9c56b9c6918531c57ec38b89474571331aee) Thanks [@bluwy](https://github.com/bluwy)! - Allows passing a string to `--open` and `server.open` to open a specific URL on startup in development

- [#9544](https://github.com/withastro/astro/pull/9544) [`b8a6fa8917ff7babd35dafb3d3dcd9a58cee836d`](https://github.com/withastro/astro/commit/b8a6fa8917ff7babd35dafb3d3dcd9a58cee836d) Thanks [@bluwy](https://github.com/bluwy)! - Adds a helpful error for static sites when you use the `astro preview` command if you have not previously run `astro build`.

- [#9546](https://github.com/withastro/astro/pull/9546) [`08402ad5846c73b6887e74ed4575fd71a3e3c73d`](https://github.com/withastro/astro/commit/08402ad5846c73b6887e74ed4575fd71a3e3c73d) Thanks [@bluwy](https://github.com/bluwy)! - Adds an option for the Sharp image service to allow large images to be processed. Set `limitInputPixels: false` to bypass the default image size limit:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    image: {
      service: {
        entrypoint: 'astro/assets/services/sharp',
        config: {
          limitInputPixels: false,
        },
      },
    },
  });
  ```

- [#9596](https://github.com/withastro/astro/pull/9596) [`fbc26976533bbcf2de9d6dba1aa3ea3dc6ce0853`](https://github.com/withastro/astro/commit/fbc26976533bbcf2de9d6dba1aa3ea3dc6ce0853) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds the ability to set a [`rootMargin`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin) setting when using the `client:visible` directive. This allows a component to be hydrated when it is _near_ the viewport, rather than hydrated when it has _entered_ the viewport.

  ```astro
  <!-- Load component when it's within 200px away from entering the viewport -->
  <Component client:visible={{ rootMargin: '200px' }} />
  ```

- [#9063](https://github.com/withastro/astro/pull/9063) [`f33fe3190b482a42ebc68cc5275fd7f2c49102e6`](https://github.com/withastro/astro/commit/f33fe3190b482a42ebc68cc5275fd7f2c49102e6) Thanks [@alex-sherwin](https://github.com/alex-sherwin)! - Cookie encoding / decoding can now be customized

  Adds new `encode` and `decode` functions to allow customizing how cookies are encoded and decoded. For example, you can bypass the default encoding via `encodeURIComponent` when adding a URL as part of a cookie:

  ```astro
  ---
  import { encodeCookieValue } from './cookies';
  Astro.cookies.set('url', Astro.url.toString(), {
    // Override the default encoding so that URI components are not encoded
    encode: (value) => encodeCookieValue(value),
  });
  ---
  ```

  Later, you can decode the URL in the same way:

  ```astro
  ---
  import { decodeCookieValue } from './cookies';
  const url = Astro.cookies.get('url', {
    decode: (value) => decodeCookieValue(value),
  });
  ---
  ```

### Patch Changes

- [#9593](https://github.com/withastro/astro/pull/9593) [`3b4e629ac8c2fdb4b491bf01abc7794e2e100173`](https://github.com/withastro/astro/commit/3b4e629ac8c2fdb4b491bf01abc7794e2e100173) Thanks [@bluwy](https://github.com/bluwy)! - Improves `astro add` error reporting when the dependencies fail to install

- [#9563](https://github.com/withastro/astro/pull/9563) [`d48ab90fb41fbc0589cd2df711682a41382c03aa`](https://github.com/withastro/astro/commit/d48ab90fb41fbc0589cd2df711682a41382c03aa) Thanks [@martrapp](https://github.com/martrapp)! - Fixes back navigation to fragment links (e.g. `#about`) in Firefox when using view transitions

  Co-authored-by: Florian Lefebvre <69633530+florian-lefebvre@users.noreply.github.com>
  Co-authored-by: Sarah Rainsberger <sarah@rainsberger.ca>

- [#9597](https://github.com/withastro/astro/pull/9597) [`9fd24a546c45d48451da46637c14e7ed54dac76a`](https://github.com/withastro/astro/commit/9fd24a546c45d48451da46637c14e7ed54dac76a) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where configuring trailingSlash had no effect on API routes.

- [#9586](https://github.com/withastro/astro/pull/9586) [`82bad5d6205672ed3f6a49d4de53d3a68367433e`](https://github.com/withastro/astro/commit/82bad5d6205672ed3f6a49d4de53d3a68367433e) Thanks [@martrapp](https://github.com/martrapp)! - Fixes page titles in the browser's drop-down for back / forward navigation when using view transitions

- [#9575](https://github.com/withastro/astro/pull/9575) [`ab6049bd58e4d02f47d500f9db08a865bc7f09b8`](https://github.com/withastro/astro/commit/ab6049bd58e4d02f47d500f9db08a865bc7f09b8) Thanks [@bluwy](https://github.com/bluwy)! - Sets correct `process.env.NODE_ENV` default when using the JS API

- [#9587](https://github.com/withastro/astro/pull/9587) [`da307e4a080483f8763f1919a05fa2194bb14e22`](https://github.com/withastro/astro/commit/da307e4a080483f8763f1919a05fa2194bb14e22) Thanks [@jjenzz](https://github.com/jjenzz)! - Adds a `CSSProperties` interface that allows extending the style attribute

- [#9513](https://github.com/withastro/astro/pull/9513) [`e44f6acf99195a3f29b8390fd9b2c06410551b74`](https://github.com/withastro/astro/commit/e44f6acf99195a3f29b8390fd9b2c06410551b74) Thanks [@wtto00](https://github.com/wtto00)! - Ignores `3g` in slow connection detection. Only `2g` and `slow-2g` are considered slow connections.

## 4.0.9

### Patch Changes

- [#9571](https://github.com/withastro/astro/pull/9571) [`ec71f03cfd9b8195fb21c92dfda0eff63b6ebeed`](https://github.com/withastro/astro/commit/ec71f03cfd9b8195fb21c92dfda0eff63b6ebeed) Thanks [@bluwy](https://github.com/bluwy)! - Removes telemetry for unhandled errors in the dev server

- [#9548](https://github.com/withastro/astro/pull/9548) [`8049f0cd91b239c52e37d571e3ba3e703cf0e4cf`](https://github.com/withastro/astro/commit/8049f0cd91b239c52e37d571e3ba3e703cf0e4cf) Thanks [@bluwy](https://github.com/bluwy)! - Fixes error overlay display on URI malformed error

- [#9504](https://github.com/withastro/astro/pull/9504) [`8cc3d6aa46f438d668516539c34b48ad748ade39`](https://github.com/withastro/astro/commit/8cc3d6aa46f438d668516539c34b48ad748ade39) Thanks [@matiboux](https://github.com/matiboux)! - Implement i18n's `getLocaleByPath` function

- [#9547](https://github.com/withastro/astro/pull/9547) [`22f42d11a4fd2e154a0c5873c4f516584e383b70`](https://github.com/withastro/astro/commit/22f42d11a4fd2e154a0c5873c4f516584e383b70) Thanks [@bluwy](https://github.com/bluwy)! - Prevents ANSI codes from rendering in the error overlay

- [#9446](https://github.com/withastro/astro/pull/9446) [`ede3f7fef6b43a08c9371f7a2531e2eef858b94d`](https://github.com/withastro/astro/commit/ede3f7fef6b43a08c9371f7a2531e2eef858b94d) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Toggle dev toolbar hitbox height when toolbar is visible

- [#9572](https://github.com/withastro/astro/pull/9572) [`9f6453cf4972ac28eec4f07a1373feaa295c8864`](https://github.com/withastro/astro/commit/9f6453cf4972ac28eec4f07a1373feaa295c8864) Thanks [@bluwy](https://github.com/bluwy)! - Documents supported `--host` and `--port` flags in `astro preview --help`

- [#9540](https://github.com/withastro/astro/pull/9540) [`7f212f0831d8cd899a86fb94899a7cad8ec280db`](https://github.com/withastro/astro/commit/7f212f0831d8cd899a86fb94899a7cad8ec280db) Thanks [@matthewp](https://github.com/matthewp)! - Fixes remote images with encoded characters

- [#9559](https://github.com/withastro/astro/pull/9559) [`8b873bf1f343efc1f486d8ef53c38380e2373c08`](https://github.com/withastro/astro/commit/8b873bf1f343efc1f486d8ef53c38380e2373c08) Thanks [@sygint](https://github.com/sygint)! - Adds 'starlight' to the displayed options for `astro add`

- [#9537](https://github.com/withastro/astro/pull/9537) [`16e61fcacb98e6bd948ac240bc082659d70193a4`](https://github.com/withastro/astro/commit/16e61fcacb98e6bd948ac240bc082659d70193a4) Thanks [@walter9388](https://github.com/walter9388)! - `<Image />` srcset now parses encoded paths correctly

## 4.0.8

### Patch Changes

- [#9522](https://github.com/withastro/astro/pull/9522) [`bb1438d20d325acd15f3755c6e306e45a7c64bcd`](https://github.com/withastro/astro/commit/bb1438d20d325acd15f3755c6e306e45a7c64bcd) Thanks [@Zegnat](https://github.com/Zegnat)! - Add support for autocomplete attribute to the HTML button type.

- [#9531](https://github.com/withastro/astro/pull/9531) [`662f06fd9fae377bed1aaa49adbba3542cced087`](https://github.com/withastro/astro/commit/662f06fd9fae377bed1aaa49adbba3542cced087) Thanks [@bluwy](https://github.com/bluwy)! - Fixes duplicated CSS modules content when it's imported by both Astro files and framework components

- [#9501](https://github.com/withastro/astro/pull/9501) [`eb36e95596fcdb3db4a31744e910495e22e3af84`](https://github.com/withastro/astro/commit/eb36e95596fcdb3db4a31744e910495e22e3af84) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Export JSX namespace from `astro/jsx-runtime` for language tooling to consume

- [#9492](https://github.com/withastro/astro/pull/9492) [`89a2a07c2e411cda32244b7b05d3c79e93f7dd84`](https://github.com/withastro/astro/commit/89a2a07c2e411cda32244b7b05d3c79e93f7dd84) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves error message for the case where two similarly named files result in the same content entry.

- [#9532](https://github.com/withastro/astro/pull/9532) [`7224809b73d2c3ec8e8aee2fa07463dc3b57a7a2`](https://github.com/withastro/astro/commit/7224809b73d2c3ec8e8aee2fa07463dc3b57a7a2) Thanks [@bluwy](https://github.com/bluwy)! - Prevents unnecessary URI decoding when rendering a route

- [#9478](https://github.com/withastro/astro/pull/9478) [`dfef925e1fd07f3efb9fde6f4f23548f2af7dc75`](https://github.com/withastro/astro/commit/dfef925e1fd07f3efb9fde6f4f23548f2af7dc75) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves errors in certain places to also report their causes.

- [#9463](https://github.com/withastro/astro/pull/9463) [`3b0eaed3b544ef8c4ec1f7b0d5a8f475bcfeb25e`](https://github.com/withastro/astro/commit/3b0eaed3b544ef8c4ec1f7b0d5a8f475bcfeb25e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update Sharp version to ^0.33.1

- [#9512](https://github.com/withastro/astro/pull/9512) [`1469e0e5a915e6b42b9953dbb48fe57a74518056`](https://github.com/withastro/astro/commit/1469e0e5a915e6b42b9953dbb48fe57a74518056) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Prevents dev toolbar tooltip from overflowing outside of the screen

- [#9497](https://github.com/withastro/astro/pull/9497) [`7f7a7f1aeaec6b327ae0e5e7470a4f46174bf8ae`](https://github.com/withastro/astro/commit/7f7a7f1aeaec6b327ae0e5e7470a4f46174bf8ae) Thanks [@lilnasy](https://github.com/lilnasy)! - Adds a helpful warning message for when an exported API Route is not uppercase.

## 4.0.7

### Patch Changes

- [#9452](https://github.com/withastro/astro/pull/9452) [`e83b5095f`](https://github.com/withastro/astro/commit/e83b5095f164f48ba40fc715a805fc66a3e39dcf) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Upgrades vite to latest

- [#9352](https://github.com/withastro/astro/pull/9352) [`f515b1421`](https://github.com/withastro/astro/commit/f515b1421afa335b8d6e4491fbe24419df53bfeb) Thanks [@tmcw](https://github.com/tmcw)! - Add a more descriptive error message when image conversion fails

- [#9486](https://github.com/withastro/astro/pull/9486) [`f6714f677`](https://github.com/withastro/astro/commit/f6714f677cffa2484565f51d5eb55bd34309653b) Thanks [@martrapp](https://github.com/martrapp)! - Fixes View Transition's form submission prevention, allowing `preventDefault` to be used.

- [#9461](https://github.com/withastro/astro/pull/9461) [`429be8cc3`](https://github.com/withastro/astro/commit/429be8cc3ed0623df4fdca76f1531265f5ba5dfc) Thanks [@Skn0tt](https://github.com/Skn0tt)! - update import created for `astro create netlify`

- [#9464](https://github.com/withastro/astro/pull/9464) [`faf6c7e11`](https://github.com/withastro/astro/commit/faf6c7e1104ee247e847836020a3ce07a2053705) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes an edge case with view transitions where some spec-compliant `Content-Type` headers would cause a valid HTML response to be ignored.

- [#9400](https://github.com/withastro/astro/pull/9400) [`1e984389b`](https://github.com/withastro/astro/commit/1e984389bafd87b0a631ed4aba930447669234f8) Thanks [@bluwy](https://github.com/bluwy)! - Fixes importing dev toolbar apps from integrations on Windows

- [#9487](https://github.com/withastro/astro/pull/9487) [`19169db1f`](https://github.com/withastro/astro/commit/19169db1f1574d36cc284fd9a0319d9b1e92b49a) Thanks [@ematipico](https://github.com/ematipico)! - Improves logging of the generated pages during the build

- [#9460](https://github.com/withastro/astro/pull/9460) [`047d285be`](https://github.com/withastro/astro/commit/047d285be1ab764bc82f88b8553b46429c37efca) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix Astro failing to build on certain exotic platform that reports their CPU count incorrectly

- [#9466](https://github.com/withastro/astro/pull/9466) [`5062d27a1`](https://github.com/withastro/astro/commit/5062d27a186c5020522614b9d6f3da218f7afd96) Thanks [@knpwrs](https://github.com/knpwrs)! - Updates view transitions `form` handling with logic for the [`enctype`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/enctype) attribute

- [#9458](https://github.com/withastro/astro/pull/9458) [`fa3078ce9`](https://github.com/withastro/astro/commit/fa3078ce9f5eda408340a78c6d275f3e0b2437dc) Thanks [@ematipico](https://github.com/ematipico)! - Correctly handle the error in case the middleware throws a runtime error

- [#9089](https://github.com/withastro/astro/pull/9089) [`5ae657882`](https://github.com/withastro/astro/commit/5ae657882287645c967249aee91bd06497f6624d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where redirects did not replace slugs when the target of the redirect rule was not a verbatim route in the project.

- [#9483](https://github.com/withastro/astro/pull/9483) [`c384f6924`](https://github.com/withastro/astro/commit/c384f6924edc161d3ff631e658f017a37e4207e3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix some false positive in the audit logic of the dev toolbar

- [#9437](https://github.com/withastro/astro/pull/9437) [`354a62c86`](https://github.com/withastro/astro/commit/354a62c86e9187af5d05540ed321bdc889384d97) Thanks [@dkobierski](https://github.com/dkobierski)! - Fixes incorrect hoisted script paths when custom rollup output file names are configured

- [#9475](https://github.com/withastro/astro/pull/9475) [`7ae4928f3`](https://github.com/withastro/astro/commit/7ae4928f303720d3b2f611474fc08d3b96c2e4af) Thanks [@ematipico](https://github.com/ematipico)! - Remove the manifest from the generated files in the `dist/` folder.

## 4.0.6

### Patch Changes

- [#9419](https://github.com/withastro/astro/pull/9419) [`151bd429b`](https://github.com/withastro/astro/commit/151bd429b11a73d236ca8f43e8f5072e7c29641e) Thanks [@matthewp](https://github.com/matthewp)! - Prevent Partytown from hijacking history APIs

- [#9426](https://github.com/withastro/astro/pull/9426) [`c01cc4e34`](https://github.com/withastro/astro/commit/c01cc4e3409ae3cf81db7384bf8e53424f21bb5c) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Fixes warning for external URL redirects

- [#9445](https://github.com/withastro/astro/pull/9445) [`f963d07f2`](https://github.com/withastro/astro/commit/f963d07f22f972938e1c9e8c95f9278efdff586b) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Upgrades Astro's compiler to a crash when sourcemaps try to map multibyte characters

- [#9126](https://github.com/withastro/astro/pull/9126) [`6d2d0e279`](https://github.com/withastro/astro/commit/6d2d0e279dd51e04099c86c4d900e2dd1d5fa837) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where error pages were not shown when trailingSlash was set to "always".

- [#9434](https://github.com/withastro/astro/pull/9434) [`c01580a2c`](https://github.com/withastro/astro/commit/c01580a2cd847ac82192d6717e9e823fba6ecb49) Thanks [@ematipico](https://github.com/ematipico)! - Improves the error message when a middleware doesn't return a `Response`

- [#9433](https://github.com/withastro/astro/pull/9433) [`fcc2fd5b0`](https://github.com/withastro/astro/commit/fcc2fd5b0f218ecfc7bbe3f48063221e5dd62757) Thanks [@ematipico](https://github.com/ematipico)! - Correctly merge headers from the original response when an error page is rendered

## 4.0.5

### Patch Changes

- [#9423](https://github.com/withastro/astro/pull/9423) [`bda1d294f`](https://github.com/withastro/astro/commit/bda1d294f2d50f31abfc9a32b5272fc9ac080e83) Thanks [@matthewp](https://github.com/matthewp)! - Error when getImage is passed an undefined src

- [#9424](https://github.com/withastro/astro/pull/9424) [`e1a5a2d36`](https://github.com/withastro/astro/commit/e1a5a2d36ac3637f5c94a27b69128a121541bae8) Thanks [@matthewp](https://github.com/matthewp)! - Prevents dev server from crashing on unhandled rejections, and adds a helpful error message

- [#9404](https://github.com/withastro/astro/pull/9404) [`8aa17a64b`](https://github.com/withastro/astro/commit/8aa17a64b46b8eaabfd1375fd6550ff93727aa81) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixed some newer HTML attributes not being included in our type definitions

- [#9414](https://github.com/withastro/astro/pull/9414) [`bebf38c0c`](https://github.com/withastro/astro/commit/bebf38c0cb539de04007f5e721bf459300b895a1) Thanks [@Skn0tt](https://github.com/Skn0tt)! - Adds the feature name to logs about feature deprecation / experimental status.

- [#9418](https://github.com/withastro/astro/pull/9418) [`2c168af67`](https://github.com/withastro/astro/commit/2c168af6745f5357e76ec323787595ef06d5fd73) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Fix broken link in CI instructions

- [#9407](https://github.com/withastro/astro/pull/9407) [`546d92c86`](https://github.com/withastro/astro/commit/546d92c862d08c69751039511a12c92ae38184c2) Thanks [@matthewp](https://github.com/matthewp)! - Allows file URLs as import specifiers

## 4.0.4

### Patch Changes

- [#9380](https://github.com/withastro/astro/pull/9380) [`ea0918259`](https://github.com/withastro/astro/commit/ea0918259964947523827bac6abe88ad3841dbb9) Thanks [@ematipico](https://github.com/ematipico)! - Correctly handle the rendering of i18n routes when `output: "hybrid"` is set

- [#9374](https://github.com/withastro/astro/pull/9374) [`65ddb0271`](https://github.com/withastro/astro/commit/65ddb027111514d41481f7455c0f0f03f8f608a8) Thanks [@bluwy](https://github.com/bluwy)! - Fixes an issue where prerendered route paths that end with `.mjs` were removed from the final build

- [#9375](https://github.com/withastro/astro/pull/9375) [`26f7023d6`](https://github.com/withastro/astro/commit/26f7023d6928de75c363df0fa759a6255cb73ef3) Thanks [@bluwy](https://github.com/bluwy)! - Prettifies generated route names injected by integrations

- [#9387](https://github.com/withastro/astro/pull/9387) [`a7c75b333`](https://github.com/withastro/astro/commit/a7c75b3339e6b1562d0d16ab6ef482840c51df68) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes an edge case with `astro add` that could install a prerelease instead of a stable release version.

  **Prior to this change**
  `astro add svelte` installs `svelte@5.0.0-next.22`

  **After this change**
  `astro add svelte` installs `svelte@4.2.8`

- Updated dependencies [[`270c6cc27`](https://github.com/withastro/astro/commit/270c6cc27f20995883fcdabbff9b56d7f041f9e4)]:
  - @astrojs/markdown-remark@4.0.1

## 4.0.3

### Patch Changes

- [#9342](https://github.com/withastro/astro/pull/9342) [`eb942942d`](https://github.com/withastro/astro/commit/eb942942d67508c07d7efaa859a7840f7c0223da) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix missing `is:inline` type for the `<slot />` element

- [#9343](https://github.com/withastro/astro/pull/9343) [`ab0281aee`](https://github.com/withastro/astro/commit/ab0281aee419e58c6079ca393987fe1ff0541dd5) Thanks [@martrapp](https://github.com/martrapp)! - Adds source file properties to HTML elements only if devToolbar is enabled

- [#9336](https://github.com/withastro/astro/pull/9336) [`c76901065`](https://github.com/withastro/astro/commit/c76901065545f6a8d3de3e44d1c8ee5456a8a77a) Thanks [@FredKSchott](https://github.com/FredKSchott)! - dev: fix issue where 404 and 500 responses were logged as 200

- [#9339](https://github.com/withastro/astro/pull/9339) [`0bb3d5322`](https://github.com/withastro/astro/commit/0bb3d532219fb90fc08bfb472fc981fab6543d16) Thanks [@morinokami](https://github.com/morinokami)! - Fixed the log message to correctly display 'enabled' and 'disabled' when toggling 'Disable notifications' in the Toolbar.

## 4.0.2

### Patch Changes

- [#9331](https://github.com/withastro/astro/pull/9331) [`cfb20550d`](https://github.com/withastro/astro/commit/cfb20550d346a33e76e23453d5dcd084e5065c4d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Updates an internal dependency ([`vitefu`](https://github.com/svitejs/vitefu)) to avoid a common `peerDependency` warning

- [#9327](https://github.com/withastro/astro/pull/9327) [`3878a91be`](https://github.com/withastro/astro/commit/3878a91be4879988c7235f433e50a6dc82e32288) Thanks [@doseofted](https://github.com/doseofted)! - Fixes an edge case for `<form method="dialog">` when using View Transitions. Forms with `method="dialog"` no longer require an additional `data-astro-reload` attribute.

## 4.0.1

### Patch Changes

- [#9315](https://github.com/withastro/astro/pull/9315) [`631e5d01b`](https://github.com/withastro/astro/commit/631e5d01b00efee6970466c38201cb0e67ec74cf) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where logs that weren't grouped together by route when building the app.

## 4.0.0

### Major Changes

- [#9138](https://github.com/withastro/astro/pull/9138) [`abf601233`](https://github.com/withastro/astro/commit/abf601233f8188d118a8cb063c777478d8d9f1a3) Thanks [@bluwy](https://github.com/bluwy)! - Updates the unified, remark, and rehype dependencies to latest. Make sure to update your custom remark and rehype plugins as well to be compatible with the latest versions.

  **Potentially breaking change:** The default value of `markdown.remarkRehype.footnoteBackLabel` is changed from `"Back to content"` to `"Back to reference 1"`. See the `mdast-util-to-hast` [commit](https://github.com/syntax-tree/mdast-util-to-hast/commit/56c88e45690be138fad9f0bf367b939d09816863) for more information.

- [#9181](https://github.com/withastro/astro/pull/9181) [`cdabf6ef0`](https://github.com/withastro/astro/commit/cdabf6ef02be7220fd2b6bdcef924ceca089381e) Thanks [@bluwy](https://github.com/bluwy)! - Removes support for returning simple objects from endpoints (deprecated since Astro 3.0). You should return a `Response` instead.

  `ResponseWithEncoding` is also removed. You can refactor the code to return a response with an array buffer instead, which is encoding agnostic.

  The types for middlewares have also been revised. To type a middleware function, you should now use `MiddlewareHandler` instead of `MiddlewareResponseHandler`. If you used `defineMiddleware()` to type the function, no changes are needed.

- [#9263](https://github.com/withastro/astro/pull/9263) [`3cbd8ea75`](https://github.com/withastro/astro/commit/3cbd8ea7534910e3beae396dcfa93ce87dcdd91f) Thanks [@bluwy](https://github.com/bluwy)! - Removes additional deprecated APIs:

  - The Astro preview server now returns a 404 status instead of a 301 redirect when requesting assets from the public directory without a base.
  - Removes special handling when referencing the `astro/client-image` type. You should use the `astro/client` type instead.
  - Removes deprecated built-in `rss` support in `getStaticPaths`. You should use `@astrojs/rss` instead.
  - Removes deprecated `Astro.request.params` support. You should use `Astro.params` instead.

- [#9271](https://github.com/withastro/astro/pull/9271) [`47604bd5b`](https://github.com/withastro/astro/commit/47604bd5b5bb2ea63922b657bac104c010575c20) Thanks [@matthewp](https://github.com/matthewp)! - Renames Dev Overlay to Dev Toolbar

  The previously named experimental Dev Overlay is now known as the Astro Dev Toolbar. Overlay plugins have been renamed as Toolbar Apps. All APIs have been updated to reflect this name change.

  To not break existing APIs, aliases for the Toolbar-based names have been created. The previous API names will continue to function but will be deprecated in the future. All documentation has been updated to reflect Toolbar-based names.

- [#9122](https://github.com/withastro/astro/pull/9122) [`1c48ed286`](https://github.com/withastro/astro/commit/1c48ed286538ab9e354eca4e4dcd7c6385c96721) Thanks [@bluwy](https://github.com/bluwy)! - Adds Vite 5 support. There are no breaking changes from Astro. Check the [Vite migration guide](https://vite.dev/guide/migration.html) for details of the breaking changes from Vite instead.

- [#9225](https://github.com/withastro/astro/pull/9225) [`c421a3d17`](https://github.com/withastro/astro/commit/c421a3d17911aeda29b5204f6d568ae87e329eaf) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Removes the opt-in `handleForms` property for `<ViewTransitions />`. Form submissions are now handled by default and this property is no longer necessary. This default behavior can be disabled by setting `data-astro-reload` on relevant `<form />` elements.

- [#9196](https://github.com/withastro/astro/pull/9196) [`37697a2c5`](https://github.com/withastro/astro/commit/37697a2c5511572dc29c0a4ea46f90c2f62be8e6) Thanks [@bluwy](https://github.com/bluwy)! - Removes support for Shiki custom language's `path` property. The language JSON file should be imported and passed to the option instead.

  ```diff
  // astro.config.js
  + import customLang from './custom.tmLanguage.json'

  export default defineConfig({
    markdown: {
      shikiConfig: {
        langs: [
  -       { path: './custom.tmLanguage.json' },
  +       customLang,
        ],
      },
    },
  })
  ```

- [#9199](https://github.com/withastro/astro/pull/9199) [`49aa215a0`](https://github.com/withastro/astro/commit/49aa215a01ee1c4805316c85bb0aea6cfbc25a31) Thanks [@lilnasy](https://github.com/lilnasy)! - This change only affects maintainers of third-party adapters. In the Integration API, the `app.render()` method of the `App` class has been simplified.

  Instead of two optional arguments, it now takes a single optional argument that is an object with two optional properties: `routeData` and `locals`.

  ```diff
   app.render(request)

  - app.render(request, routeData)
  + app.render(request, { routeData })

  - app.render(request, routeData, locals)
  + app.render(request, { routeData, locals })

  - app.render(request, undefined, locals)
  + app.render(request, { locals })
  ```

  The current signature is deprecated but will continue to function until next major version.

- [#9212](https://github.com/withastro/astro/pull/9212) [`c0383ea0c`](https://github.com/withastro/astro/commit/c0383ea0c102cb62b7235823c706a090ba08715f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removes deprecated `app.match()` option, `matchNotFound`

- [#9168](https://github.com/withastro/astro/pull/9168) [`153a5abb9`](https://github.com/withastro/astro/commit/153a5abb905042ac68b712514dc9ec387d3e6b17) Thanks [@bluwy](https://github.com/bluwy)! - Removes deprecated features from Astro 3.0

  - Adapters are now required to pass `supportedAstroFeatures` to specify a list of features they support.
  - The `build.split` and `build.excludeMiddleware` options are removed. Use `functionPerRoute` and `edgeMiddleware` from adapters instead.
  - The `markdown.drafts` option and draft feature is removed. Use content collections instead.
  - Lowercase endpoint names are no longer supported. Use uppercase endpoint names instead.
  - `getHeaders()` exported from markdown files is removed. Use `getHeadings()` instead.

### Minor Changes

- [#9105](https://github.com/withastro/astro/pull/9105) [`6201bbe96`](https://github.com/withastro/astro/commit/6201bbe96c2a083fb201e4a43a9bd88499821a3e) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update CLI logging experience

- [#9200](https://github.com/withastro/astro/pull/9200) [`b4b851f5a`](https://github.com/withastro/astro/commit/b4b851f5a46b32ee531db5dc39ccd2aa7af7bcfd) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new way to configure the `i18n.locales` array.

  Developers can now assign a custom URL path prefix that can span multiple language codes:

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      i18n: {
        defaultLocale: 'english',
        locales: ['de', { path: 'english', codes: ['en', 'en-US'] }, 'fr'],
      },
    },
  });
  ```

  With the above configuration, the URL prefix of the default locale will be `/english/`. When computing `Astro.preferredLocale`, Astro will use the `codes`.

- [#9115](https://github.com/withastro/astro/pull/9115) [`3b77889b4`](https://github.com/withastro/astro/commit/3b77889b47750ed6e17c7858780dc4aae9201b58) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Adds the `astro preferences` command to manage user preferences. User preferences are specific to individual Astro users, unlike the `astro.config.mjs` file which changes behavior for everyone working on a project.

  User preferences are scoped to the current project by default, stored in a local `.astro/settings.json` file. Using the `--global` flag, user preferences can also be applied to every Astro project on the current machine. Global user preferences are stored in an operating system-specific location.

  ```sh
  # Disable the dev overlay for the current user in the current project
  npm run astro preferences disable devOverlay
  # Disable the dev overlay for the current user in all Astro projects on this machine
  npm run astro preferences --global disable devOverlay

  # Check if the dev overlay is enabled for the current user
  npm run astro preferences list devOverlay
  ```

- [#9139](https://github.com/withastro/astro/pull/9139) [`459b26436`](https://github.com/withastro/astro/commit/459b2643666db08dbd29a100ce3d8697b451d3fe) Thanks [@bluwy](https://github.com/bluwy)! - Reworks Vite's logger to use Astro's logger to correctly log HMR messages

- [#9279](https://github.com/withastro/astro/pull/9279) [`6a9669b81`](https://github.com/withastro/astro/commit/6a9669b810ddfcae6c537165a438190ea1e7a4bc) Thanks [@martrapp](https://github.com/martrapp)! - Improves consistency between navigations with and without `<ViewTransitions>`. See [#9279](https://github.com/withastro/astro/pull/9279) for more details.

- [#9161](https://github.com/withastro/astro/pull/9161) [`bd0c2e9ae`](https://github.com/withastro/astro/commit/bd0c2e9ae3389a9d3085050c1e8134ae98dff299) Thanks [@bluwy](https://github.com/bluwy)! - Renames the `entryPoint` property of the `injectRoute` integrations API to `entrypoint` for consistency. A warning will be shown prompting you to update your code when using the old name.

- [#9129](https://github.com/withastro/astro/pull/9129) [`8bfc20511`](https://github.com/withastro/astro/commit/8bfc20511918d675202cdc100d4efab293e5cbac) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update error log formatting

### Patch Changes

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Redesign Dev Overlay main screen to show more information, such as the coolest integrations, your current Astro version and more.

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes an issue where links with the same pathname as the current page, but different search params, were not prefetched.

- [#9275](https://github.com/withastro/astro/pull/9275) [`0968cb1a3`](https://github.com/withastro/astro/commit/0968cb1a373b1101a649035d2ea2210d3d6412dc) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where html annotations relevant only to the dev server were included in the production build.

- [#9252](https://github.com/withastro/astro/pull/9252) [`7b74ec4ba`](https://github.com/withastro/astro/commit/7b74ec4ba48e363a19d20e322212d0d264927f1b) Thanks [@ematipico](https://github.com/ematipico)! - Consistently emit fallback routes in the correct folders, and emit routes that consider `trailingSlash`

- [#9222](https://github.com/withastro/astro/pull/9222) [`279e3c1b3`](https://github.com/withastro/astro/commit/279e3c1b3d06e7b48f01c0ef8285c3719ac74ace) Thanks [@matthewp](https://github.com/matthewp)! - Ensure the dev-overlay-window is anchored to the bottom

- [#9292](https://github.com/withastro/astro/pull/9292) [`5428b3da0`](https://github.com/withastro/astro/commit/5428b3da08493d933981c4646d5d132fb31f0d25) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves display for `astro preferences list` command

- [#9235](https://github.com/withastro/astro/pull/9235) [`9c2342c32`](https://github.com/withastro/astro/commit/9c2342c327a13d2f7d1eb387b743e81f431b9813) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix SVG icons not showing properly in the extended dropdown menu of the dev overlay

- [#9218](https://github.com/withastro/astro/pull/9218) [`f4401c8c1`](https://github.com/withastro/astro/commit/f4401c8c1fa203431b4e7b2e89381a91b4ef1ac6) Thanks [@matthewp](https://github.com/matthewp)! - Improve high contrast mode with the Dev Overlay

- [#9254](https://github.com/withastro/astro/pull/9254) [`b750a161e`](https://github.com/withastro/astro/commit/b750a161e0e059de9cf814ce271d5891e4e97cbe) Thanks [@matthewp](https://github.com/matthewp)! - Improve highlight/tooltip positioning when in fixed positions

- [#9230](https://github.com/withastro/astro/pull/9230) [`60cfa49e4`](https://github.com/withastro/astro/commit/60cfa49e445c926288612a6b1a30113ab988011c) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update the look and feel of the dev overlay

- [#9248](https://github.com/withastro/astro/pull/9248) [`43ddb5217`](https://github.com/withastro/astro/commit/43ddb5217691dc4112d8d98ae07511a8be6d4b94) Thanks [@martrapp](https://github.com/martrapp)! - Adds properties of the submit button (name, value) to the form data of a view transition

- [#9170](https://github.com/withastro/astro/pull/9170) [`8a228fce0`](https://github.com/withastro/astro/commit/8a228fce0114daeea2100e50ddc5cf2ea0a03b5d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Adds new accessibility audits to the Dev Toolbar's built-in Audits app.

  The audits Astro performs are non-exhaustive and only capable of detecting a handful of common accessibility issues. Please take care to perform a thorough, **manual** audit of your site to ensure compliance with the [Web Content Accessibility Guidelines (WCAG) international standard](https://www.w3.org/WAI/standards-guidelines/wcag/) _before_ publishing your site.

  🧡 Huge thanks to the [Svelte](https://github.com/sveltejs/svelte) team for providing the basis of these accessibility audits!

- [#9149](https://github.com/withastro/astro/pull/9149) [`0fe3a7ed5`](https://github.com/withastro/astro/commit/0fe3a7ed5d7bb1a9fce1623e84ba14104b51223c) Thanks [@bluwy](https://github.com/bluwy)! - Removes vendored Vite's `importMeta.d.ts` file in favour of Vite 5's new `vite/types/import-meta.d.ts` export

- [#9295](https://github.com/withastro/astro/pull/9295) [`3d2dbb0e5`](https://github.com/withastro/astro/commit/3d2dbb0e5d2bf67b38ff8533d4dd938c94433812) Thanks [@matthewp](https://github.com/matthewp)! - Remove aria-query package

  This is another CJS-only package that breaks usage.

- [#9274](https://github.com/withastro/astro/pull/9274) [`feaba2c7f`](https://github.com/withastro/astro/commit/feaba2c7fc0a48d3af7dd98e6b750ec1e8274e33) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fix routing prefixes when `prefixDefaultLocale` is `true`

- [#9273](https://github.com/withastro/astro/pull/9273) [`9887f2412`](https://github.com/withastro/astro/commit/9887f241241f800e2907afe7079db070f3bfcfab) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Exports type for Dev Toolbar App under correct name

- [#9150](https://github.com/withastro/astro/pull/9150) [`710be505c`](https://github.com/withastro/astro/commit/710be505c9ddf416e77a75343d8cae9c497d72c6) Thanks [@bluwy](https://github.com/bluwy)! - Refactors virtual modules exports. This should not break your project unless you import Astro's internal modules, including:

  - `astro/middleware/namespace`
  - `astro/transitions`
  - `astro/transitions/router`
  - `astro/transitions/events`
  - `astro/transitions/types`
  - `astro/prefetch`
  - `astro/i18n`

- [#9227](https://github.com/withastro/astro/pull/9227) [`4b8a42406`](https://github.com/withastro/astro/commit/4b8a42406bbdcc68604ea4ecc2a926721fbc4d52) Thanks [@matthewp](https://github.com/matthewp)! - Ensure overlay x-ray z-index is higher than the island

- [#9255](https://github.com/withastro/astro/pull/9255) [`9ea3e0b94`](https://github.com/withastro/astro/commit/9ea3e0b94f7c4813c52bffd78043f90fd87dffda) Thanks [@matthewp](https://github.com/matthewp)! - Adds instructions on how to hide the dev overlay

- [#9293](https://github.com/withastro/astro/pull/9293) [`cf5fa4376`](https://github.com/withastro/astro/commit/cf5fa437627ca6978ae3ff33c7894f278dfe75cd) Thanks [@matthewp](https://github.com/matthewp)! - Removes the 'a11y-role-has-required-aria-props' audit rule

  This audit rule depends on a CommonJS module. To prevent blocking the 4.0 release the rule is being removed temporarily.

- [#9214](https://github.com/withastro/astro/pull/9214) [`4fe523b00`](https://github.com/withastro/astro/commit/4fe523b0064b323ee46b2574339d96ea8bdb7b2d) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes a number of small user experience bugs with the dev overlay

- [#9013](https://github.com/withastro/astro/pull/9013) [`ff8eadb95`](https://github.com/withastro/astro/commit/ff8eadb95d34833baaf3ec7575bf4f293eae97da) Thanks [@bayssmekanique](https://github.com/bayssmekanique)! - Returns the updated config in the integration `astro:config:setup` hook's `updateConfig()` API

- Updated dependencies [[`abf601233`](https://github.com/withastro/astro/commit/abf601233f8188d118a8cb063c777478d8d9f1a3), [`addb57c8e`](https://github.com/withastro/astro/commit/addb57c8e80b7b67ec61224666f3a1db5c44410c), [`c7953645e`](https://github.com/withastro/astro/commit/c7953645eeaaf9e87c6db4494b0023d2c1878ff0)]:
  - @astrojs/markdown-remark@4.0.0

## 4.0.0-beta.7

### Patch Changes

- [#9295](https://github.com/withastro/astro/pull/9295) [`3d2dbb0e5`](https://github.com/withastro/astro/commit/3d2dbb0e5d2bf67b38ff8533d4dd938c94433812) Thanks [@matthewp](https://github.com/matthewp)! - Remove aria-query package

  This is another CJS-only package that breaks usage.

## 4.0.0-beta.6

### Patch Changes

- [#9275](https://github.com/withastro/astro/pull/9275) [`0968cb1a3`](https://github.com/withastro/astro/commit/0968cb1a373b1101a649035d2ea2210d3d6412dc) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where html annotations relevant only to the dev server were included in the production build.

- [#9292](https://github.com/withastro/astro/pull/9292) [`5428b3da0`](https://github.com/withastro/astro/commit/5428b3da08493d933981c4646d5d132fb31f0d25) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves display for `astro preferences list` command

- [#9293](https://github.com/withastro/astro/pull/9293) [`cf5fa4376`](https://github.com/withastro/astro/commit/cf5fa437627ca6978ae3ff33c7894f278dfe75cd) Thanks [@matthewp](https://github.com/matthewp)! - Removes the 'a11y-role-has-required-aria-props' audit rule

  This audit rule depends on a CommonJS module. To prevent blocking the 4.0 release the rule is being removed temporarily.

## 4.0.0-beta.5

### Minor Changes

- [#9279](https://github.com/withastro/astro/pull/9279) [`6a9669b81`](https://github.com/withastro/astro/commit/6a9669b810ddfcae6c537165a438190ea1e7a4bc) Thanks [@martrapp](https://github.com/martrapp)! - Improves consistency between navigations with and without `<ViewTransitions>`. See [#9279](https://github.com/withastro/astro/pull/9279) for more details.

### Patch Changes

- [#9170](https://github.com/withastro/astro/pull/9170) [`8a228fce0`](https://github.com/withastro/astro/commit/8a228fce0114daeea2100e50ddc5cf2ea0a03b5d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Adds new accessibility audits to the Dev Toolbar's built-in Audits app.

  The audits Astro performs are non-exhaustive and only capable of detecting a handful of common accessibility issues. Please take care to perform a thorough, **manual** audit of your site to ensure compliance with the [Web Content Accessibility Guidelines (WCAG) international standard](https://www.w3.org/WAI/standards-guidelines/wcag/) _before_ publishing your site.

  🧡 Huge thanks to the [Svelte](https://github.com/sveltejs/svelte) team for providing the basis of these accessibility audits!

- [#9274](https://github.com/withastro/astro/pull/9274) [`feaba2c7f`](https://github.com/withastro/astro/commit/feaba2c7fc0a48d3af7dd98e6b750ec1e8274e33) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fix routing prefixes when `prefixDefaultLocale` is `true`

- [#9273](https://github.com/withastro/astro/pull/9273) [`9887f2412`](https://github.com/withastro/astro/commit/9887f241241f800e2907afe7079db070f3bfcfab) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Exports type for Dev Toolbar App under correct name

## 4.0.0-beta.4

### Major Changes

- [#9271](https://github.com/withastro/astro/pull/9271) [`47604bd5b`](https://github.com/withastro/astro/commit/47604bd5b5bb2ea63922b657bac104c010575c20) Thanks [@matthewp](https://github.com/matthewp)! - Renames Dev Overlay to Dev Toolbar

  The previously named experimental Dev Overlay is now known as the Astro Dev Toolbar. Plugins have been renamed as Toolbar Apps. This updates our references to reflect.

  To not break existing APIs, aliases for the Toolbar-based names have been created. The previous API names will continue to function but will be deprecated in the future. All documentation has been updated to reflect Toolbar-based names.

## 4.0.0-beta.3

### Major Changes

- [#9263](https://github.com/withastro/astro/pull/9263) [`3cbd8ea75`](https://github.com/withastro/astro/commit/3cbd8ea7534910e3beae396dcfa93ce87dcdd91f) Thanks [@bluwy](https://github.com/bluwy)! - Removes additional deprecated APIs:

  - The Astro preview server now returns a 404 status instead of a 301 redirect when requesting assets from the public directory without a base.
  - Removes special handling when referencing the `astro/client-image` type. You should use the `astro/client` type instead.
  - Removes deprecated built-in `rss` support in `getStaticPaths`. You should use `@astrojs/rss` instead.
  - Removes deprecated `Astro.request.params` support. You should use `Astro.params` instead.

### Minor Changes

- [#9200](https://github.com/withastro/astro/pull/9200) [`b4b851f5a`](https://github.com/withastro/astro/commit/b4b851f5a46b32ee531db5dc39ccd2aa7af7bcfd) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new way to configure the `i18n.locales` array.

  Developers can now assign a custom URL path prefix that can span multiple language codes:

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      i18n: {
        defaultLocale: 'english',
        locales: ['de', { path: 'english', codes: ['en', 'en-US'] }, 'fr'],
        routingStrategy: 'prefix-always',
      },
    },
  });
  ```

  With the above configuration, the URL prefix of the default locale will be `/english/`. When computing `Astro.preferredLocale`, Astro will use the `codes`.

- [#9139](https://github.com/withastro/astro/pull/9139) [`459b26436`](https://github.com/withastro/astro/commit/459b2643666db08dbd29a100ce3d8697b451d3fe) Thanks [@bluwy](https://github.com/bluwy)! - Reworks Vite's logger to use Astro's logger to correctly log HMR messages

### Patch Changes

- [#9252](https://github.com/withastro/astro/pull/9252) [`7b74ec4ba`](https://github.com/withastro/astro/commit/7b74ec4ba48e363a19d20e322212d0d264927f1b) Thanks [@ematipico](https://github.com/ematipico)! - Consistently emit fallback routes in the correct folders, and emit routes that
  consider `trailingSlash`

- [#9235](https://github.com/withastro/astro/pull/9235) [`9c2342c32`](https://github.com/withastro/astro/commit/9c2342c327a13d2f7d1eb387b743e81f431b9813) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix SVG icons not showing properly in the extended dropdown menu of the dev overlay

- [#9254](https://github.com/withastro/astro/pull/9254) [`b750a161e`](https://github.com/withastro/astro/commit/b750a161e0e059de9cf814ce271d5891e4e97cbe) Thanks [@matthewp](https://github.com/matthewp)! - Improve highlight/tooltip positioning when in fixed positions

- [#9230](https://github.com/withastro/astro/pull/9230) [`60cfa49e4`](https://github.com/withastro/astro/commit/60cfa49e445c926288612a6b1a30113ab988011c) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update the look and feel of the dev overlay

- [#9248](https://github.com/withastro/astro/pull/9248) [`43ddb5217`](https://github.com/withastro/astro/commit/43ddb5217691dc4112d8d98ae07511a8be6d4b94) Thanks [@martrapp](https://github.com/martrapp)! - Adds properties of the submit button (name, value) to the form data of a view transition

- [#9255](https://github.com/withastro/astro/pull/9255) [`9ea3e0b94`](https://github.com/withastro/astro/commit/9ea3e0b94f7c4813c52bffd78043f90fd87dffda) Thanks [@matthewp](https://github.com/matthewp)! - Adds instructions on how to hide the dev overlay

- [#9013](https://github.com/withastro/astro/pull/9013) [`ff8eadb95`](https://github.com/withastro/astro/commit/ff8eadb95d34833baaf3ec7575bf4f293eae97da) Thanks [@bayssmekanique](https://github.com/bayssmekanique)! - Returns the updated config in the integration `astro:config:setup` hook's `updateConfig()` API

## 4.0.0-beta.2

### Major Changes

- [#9225](https://github.com/withastro/astro/pull/9225) [`c421a3d17`](https://github.com/withastro/astro/commit/c421a3d17911aeda29b5204f6d568ae87e329eaf) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Removes the opt-in `handleForms` property for `<ViewTransitions />`. Form submissions are now handled by default and can be disabled by setting `data-astro-reload` on relevant `<form />` elements.

- [#9199](https://github.com/withastro/astro/pull/9199) [`49aa215a0`](https://github.com/withastro/astro/commit/49aa215a01ee1c4805316c85bb0aea6cfbc25a31) Thanks [@lilnasy](https://github.com/lilnasy)! - This change only affects maintainers of third-party adapters. In the Integration API, the `app.render()` method of the `App` class has been simplified.

  Instead of two optional arguments, it now takes a single optional argument that is an object with two optional properties: `routeData` and `locals`.

  ```diff
   app.render(request)

  - app.render(request, routeData)
  + app.render(request, { routeData })

  - app.render(request, routeData, locals)
  + app.render(request, { routeData, locals })

  - app.render(request, undefined, locals)
  + app.render(request, { locals })
  ```

  The current signature is deprecated but will continue to function until next major version.

- [#9212](https://github.com/withastro/astro/pull/9212) [`c0383ea0c`](https://github.com/withastro/astro/commit/c0383ea0c102cb62b7235823c706a090ba08715f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removes deprecated `app.match()` option, `matchNotFound`

### Minor Changes

- [#9115](https://github.com/withastro/astro/pull/9115) [`3b77889b4`](https://github.com/withastro/astro/commit/3b77889b47750ed6e17c7858780dc4aae9201b58) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Adds the `astro preferences` command to manage user preferences. User preferences are specific to individual Astro users, unlike the `astro.config.mjs` file which changes behavior for everyone working on a project.

  User preferences are scoped to the current project by default, stored in a local `.astro/settings.json` file. Using the `--global` flag, user preferences can also be applied to every Astro project on the current machine. Global user preferences are stored in an operating system-specific location.

  ```sh
  # Disable the dev overlay for the current user in the current project
  npm run astro preferences disable devOverlay
  # Disable the dev overlay for the current user in all Astro projects on this machine
  npm run astro preferences --global disable devOverlay

  # Check if the dev overlay is enabled for the current user
  npm run astro preferences list devOverlay
  ```

- [#9129](https://github.com/withastro/astro/pull/9129) [`8bfc20511`](https://github.com/withastro/astro/commit/8bfc20511918d675202cdc100d4efab293e5cbac) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update error log formatting

### Patch Changes

- [#9222](https://github.com/withastro/astro/pull/9222) [`279e3c1b3`](https://github.com/withastro/astro/commit/279e3c1b3d06e7b48f01c0ef8285c3719ac74ace) Thanks [@matthewp](https://github.com/matthewp)! - Ensure the dev-overlay-window is anchored to the bottom

- [#9218](https://github.com/withastro/astro/pull/9218) [`f4401c8c1`](https://github.com/withastro/astro/commit/f4401c8c1fa203431b4e7b2e89381a91b4ef1ac6) Thanks [@matthewp](https://github.com/matthewp)! - Improve high contrast mode with the Dev Overlay

- [#9227](https://github.com/withastro/astro/pull/9227) [`4b8a42406`](https://github.com/withastro/astro/commit/4b8a42406bbdcc68604ea4ecc2a926721fbc4d52) Thanks [@matthewp](https://github.com/matthewp)! - Ensure overlay x-ray z-index is higher than the island

- [#9214](https://github.com/withastro/astro/pull/9214) [`4fe523b00`](https://github.com/withastro/astro/commit/4fe523b0064b323ee46b2574339d96ea8bdb7b2d) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes a number of small user experience bugs with the dev overlay

## 4.0.0-beta.1

### Patch Changes

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Redesign Dev Overlay main screen to show more information, such as the coolest integrations, your current Astro version and more.

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes an issue where links with the same pathname as the current page, but different search params, were not prefetched.

## 4.0.0-beta.0

### Major Changes

- [#9138](https://github.com/withastro/astro/pull/9138) [`abf601233`](https://github.com/withastro/astro/commit/abf601233f8188d118a8cb063c777478d8d9f1a3) Thanks [@bluwy](https://github.com/bluwy)! - Updates the unified, remark, and rehype dependencies to latest. Make sure to update your custom remark and rehype plugins as well to be compatible with the latest versions.

  **Potentially breaking change:** The default value of `markdown.remarkRehype.footnoteBackLabel` is changed from `"Back to content"` to `"Back to reference 1"`. See the `mdast-util-to-hast` [commit](https://github.com/syntax-tree/mdast-util-to-hast/commit/56c88e45690be138fad9f0bf367b939d09816863) for more information.

- [#9181](https://github.com/withastro/astro/pull/9181) [`cdabf6ef0`](https://github.com/withastro/astro/commit/cdabf6ef02be7220fd2b6bdcef924ceca089381e) Thanks [@bluwy](https://github.com/bluwy)! - Removes support for returning simple objects from endpoints (deprecated since Astro 3.0). You should return a `Response` instead.

  `ResponseWithEncoding` is also removed. You can refactor the code to return a response with an array buffer instead, which is encoding agnostic.

  The types for middlewares have also been revised. To type a middleware function, you should now use `MiddlewareHandler` instead of `MiddlewareResponseHandler`. If you used `defineMiddleware()` to type the function, no changes are needed.

- [#9122](https://github.com/withastro/astro/pull/9122) [`1c48ed286`](https://github.com/withastro/astro/commit/1c48ed286538ab9e354eca4e4dcd7c6385c96721) Thanks [@bluwy](https://github.com/bluwy)! - Adds Vite 5 support. There are no breaking changes from Astro. Check the [Vite migration guide](https://vite.dev/guide/migration.html) for details of the breaking changes from Vite instead.

- [#9196](https://github.com/withastro/astro/pull/9196) [`37697a2c5`](https://github.com/withastro/astro/commit/37697a2c5511572dc29c0a4ea46f90c2f62be8e6) Thanks [@bluwy](https://github.com/bluwy)! - Removes support for Shiki custom language's `path` property. The language JSON file should be imported and passed to the option instead.

  ```diff
  // astro.config.js
  + import customLang from './custom.tmLanguage.json'

  export default defineConfig({
    markdown: {
      shikiConfig: {
        langs: [
  -       { path: './custom.tmLanguage.json' },
  +       customLang,
        ],
      },
    },
  })
  ```

- [#9168](https://github.com/withastro/astro/pull/9168) [`153a5abb9`](https://github.com/withastro/astro/commit/153a5abb905042ac68b712514dc9ec387d3e6b17) Thanks [@bluwy](https://github.com/bluwy)! - Removes deprecated features from Astro 3.0

  - Adapters are now required to pass `supportedAstroFeatures` to specify a list of features they support.
  - The `build.split` and `build.excludeMiddleware` options are removed. Use `functionPerRoute` and `edgeMiddleware` from adapters instead.
  - The `markdown.drafts` option and draft feature is removed. Use content collections instead.
  - Lowercase endpoint names are no longer supported. Use uppercase endpoint names instead.
  - `getHeaders()` exported from markdown files is removed. Use `getHeadings()` instead.

### Minor Changes

- [#9105](https://github.com/withastro/astro/pull/9105) [`6201bbe96`](https://github.com/withastro/astro/commit/6201bbe96c2a083fb201e4a43a9bd88499821a3e) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update CLI logging experience

- [#9161](https://github.com/withastro/astro/pull/9161) [`bd0c2e9ae`](https://github.com/withastro/astro/commit/bd0c2e9ae3389a9d3085050c1e8134ae98dff299) Thanks [@bluwy](https://github.com/bluwy)! - Renames the `entryPoint` property of the `injectRoute` integrations API to `entrypoint` for consistency. A warning will be shown prompting you to update your code when using the old name.

### Patch Changes

- [#9149](https://github.com/withastro/astro/pull/9149) [`0fe3a7ed5`](https://github.com/withastro/astro/commit/0fe3a7ed5d7bb1a9fce1623e84ba14104b51223c) Thanks [@bluwy](https://github.com/bluwy)! - Removes vendored Vite's `importMeta.d.ts` file in favour of Vite 5's new `vite/types/import-meta.d.ts` export

- [#9150](https://github.com/withastro/astro/pull/9150) [`710be505c`](https://github.com/withastro/astro/commit/710be505c9ddf416e77a75343d8cae9c497d72c6) Thanks [@bluwy](https://github.com/bluwy)! - Refactors virtual modules exports. This should not break your project unless you import Astro's internal modules, including:

  - `astro/middleware/namespace`
  - `astro/transitions`
  - `astro/transitions/router`
  - `astro/transitions/events`
  - `astro/transitions/types`
  - `astro/prefetch`
  - `astro/i18n`

- Updated dependencies [[`abf601233`](https://github.com/withastro/astro/commit/abf601233f8188d118a8cb063c777478d8d9f1a3), [`addb57c8e`](https://github.com/withastro/astro/commit/addb57c8e80b7b67ec61224666f3a1db5c44410c), [`c7953645e`](https://github.com/withastro/astro/commit/c7953645eeaaf9e87c6db4494b0023d2c1878ff0)]:
  - @astrojs/markdown-remark@4.0.0-beta.0

## 3.6.4

### Patch Changes

- [#9226](https://github.com/withastro/astro/pull/9226) [`8f8a40e93`](https://github.com/withastro/astro/commit/8f8a40e93d6a0774ba84a6f5db8c42cd81db005e) Thanks [@outofambit](https://github.com/outofambit)! - Fix i18n fallback routing with routing strategy of always-prefix

- [#9179](https://github.com/withastro/astro/pull/9179) [`3f28336d9`](https://github.com/withastro/astro/commit/3f28336d9a52d7e4364d455ee3128d14d10a078a) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where the presence of a slot in a page led to an error.

- [#9219](https://github.com/withastro/astro/pull/9219) [`067a65f5b`](https://github.com/withastro/astro/commit/067a65f5b4d163bf1944cf47e6bf891f0b93553f) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix edge case where `<style>` updates inside of `.astro` files would occasionally fail to update without reloading the page.

- [#9236](https://github.com/withastro/astro/pull/9236) [`27d3e86e4`](https://github.com/withastro/astro/commit/27d3e86e4c8d04101113ab7a53477f26a4fb0619) Thanks [@ematipico](https://github.com/ematipico)! - The configuration `i18n.routingStrategy` has been replaced with an object called `routing`.

  ```diff
  export default defineConfig({
    experimental: {
        i18n: {
  -          routingStrategy: "prefix-always",
  +          routing: {
  +              prefixDefaultLocale: true,
  +          }
        }
    }
  })
  ```

  ```diff
  export default defineConfig({
    experimental: {
        i18n: {
  -          routingStrategy: "prefix-other-locales",
  +          routing: {
  +              prefixDefaultLocale: false,
  +          }
        }
    }
  })
  ```

## 3.6.3

### Patch Changes

- [#9193](https://github.com/withastro/astro/pull/9193) [`0dc99c9a2`](https://github.com/withastro/astro/commit/0dc99c9a28fcb6b46db49eefac6afa415875edcb) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Prevents the Code component from crashing if the lang isn't supported by falling back to `plaintext`.

## 3.6.2

### Patch Changes

- [#9189](https://github.com/withastro/astro/pull/9189) [`d90714fc3`](https://github.com/withastro/astro/commit/d90714fc3dd7c3eab0a6b29319b0b666bb04b678) Thanks [@SpencerWhitehead7](https://github.com/SpencerWhitehead7)! - Fixes an issue where links with the same pathname as the current page, but different search params, were not prefetched.

## 3.6.4

### Patch Changes

- [#9226](https://github.com/withastro/astro/pull/9226) [`8f8a40e93`](https://github.com/withastro/astro/commit/8f8a40e93d6a0774ba84a6f5db8c42cd81db005e) Thanks [@outofambit](https://github.com/outofambit)! - Fix i18n fallback routing with routing strategy of always-prefix

- [#9179](https://github.com/withastro/astro/pull/9179) [`3f28336d9`](https://github.com/withastro/astro/commit/3f28336d9a52d7e4364d455ee3128d14d10a078a) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where the presence of a slot in a page led to an error.

- [#9219](https://github.com/withastro/astro/pull/9219) [`067a65f5b`](https://github.com/withastro/astro/commit/067a65f5b4d163bf1944cf47e6bf891f0b93553f) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix edge case where `<style>` updates inside of `.astro` files would occasionally fail to update without reloading the page.

- [#9236](https://github.com/withastro/astro/pull/9236) [`27d3e86e4`](https://github.com/withastro/astro/commit/27d3e86e4c8d04101113ab7a53477f26a4fb0619) Thanks [@ematipico](https://github.com/ematipico)! - The configuration `i18n.routingStrategy` has been replaced with an object called `routing`.

  ```diff
  export default defineConfig({
    experimental: {
        i18n: {
  -          routingStrategy: "prefix-always",
  +          routing: {
  +              prefixDefaultLocale: true,
  +          }
        }
    }
  })
  ```

  ```diff
  export default defineConfig({
    experimental: {
        i18n: {
  -          routingStrategy: "prefix-other-locales",
  +          routing: {
  +              prefixDefaultLocale: false,
  +          }
        }
    }
  })
  ```

## 3.6.3

### Patch Changes

- [#9193](https://github.com/withastro/astro/pull/9193) [`0dc99c9a2`](https://github.com/withastro/astro/commit/0dc99c9a28fcb6b46db49eefac6afa415875edcb) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Prevents the Code component from crashing if the lang isn't supported by falling back to `plaintext`.

## 3.6.2

### Patch Changes

- [#9189](https://github.com/withastro/astro/pull/9189) [`d90714fc3`](https://github.com/withastro/astro/commit/d90714fc3dd7c3eab0a6b29319b0b666bb04b678) Thanks [@SpencerWhitehead7](https://github.com/SpencerWhitehead7)! - Fixes an issue where links with the same pathname as the current page, but different search params, were not prefetched.

## 3.6.1

### Patch Changes

- [#9173](https://github.com/withastro/astro/pull/9173) [`04fdc1c61`](https://github.com/withastro/astro/commit/04fdc1c613171409ed1a2bd887326e26cdb8b5ef) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where having a middleware prevented the SSR app from being deployed on Netlify.

- [#9186](https://github.com/withastro/astro/pull/9186) [`607542c7c`](https://github.com/withastro/astro/commit/607542c7cf9fe9813c06f1d96615d6c793262d22) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a view transition issue on webKit browsers that prevented scrolling to #fragments

## 3.6.0

### Minor Changes

- [#9090](https://github.com/withastro/astro/pull/9090) [`c87223c21`](https://github.com/withastro/astro/commit/c87223c21ab5d515fb8f04ee10be5c0ca51e0b29) Thanks [@martrapp](https://github.com/martrapp)! - Take full control over the behavior of view transitions!

  Three new events now complement the existing `astro:after-swap` and `astro:page-load` events:

  ```javascript
  'astro:before-preparation'; // Control how the DOM and other resources of the target page are loaded
  'astro:after-preparation'; // Last changes before taking off? Remove that loading indicator? Here you go!
  'astro:before-swap'; // Control how the DOM is updated to match the new page
  ```

  The `astro:before-*` events allow you to change properties and strategies of the view transition implementation.
  The `astro:after-*` events are notifications that a phase is complete.
  Head over to docs to see [the full view transitions lifecycle](https://docs.astro.build/en/guides/view-transitions/#lifecycle-events) including these new events!

- [#9092](https://github.com/withastro/astro/pull/9092) [`0ea4bd47e`](https://github.com/withastro/astro/commit/0ea4bd47e0d7cc98c43568a55aa87da772bd2e0a) Thanks [@smitbarmase](https://github.com/smitbarmase)! - Changes the fallback prefetch behavior on slow connections and when data saver mode is enabled. Instead of disabling prefetch entirely, the `tap` strategy will be used.

- [#9166](https://github.com/withastro/astro/pull/9166) [`cba6cf32d`](https://github.com/withastro/astro/commit/cba6cf32d9bf1f5c3268808f185a4824d6fbd7f4) Thanks [@matthewp](https://github.com/matthewp)! - The Picture component is no longer experimental

  The `<Picture />` component, part of `astro:assets`, has exited experimental status and is now recommended for use. There are no code changes to the component, and no upgrade to your project is necessary.

  This is only a change in documentation/recommendation. If you were waiting to use the `<Picture />` component until it had exited the experimental stage, wait no more!

- [#9092](https://github.com/withastro/astro/pull/9092) [`0ea4bd47e`](https://github.com/withastro/astro/commit/0ea4bd47e0d7cc98c43568a55aa87da772bd2e0a) Thanks [@smitbarmase](https://github.com/smitbarmase)! - Adds a `ignoreSlowConnection` option to the `prefetch()` API to prefetch even on data saver mode or slow connection.

## 3.5.7

### Patch Changes

- [#9157](https://github.com/withastro/astro/pull/9157) [`7ff8d62bf`](https://github.com/withastro/astro/commit/7ff8d62bf861694067491ff17d01b1b0f6809d6b) Thanks [@ematipico](https://github.com/ematipico)! - Revert fix around fallback system, which broken injected styles

## 3.5.6

### Patch Changes

- [#9121](https://github.com/withastro/astro/pull/9121) [`f4efd1c80`](https://github.com/withastro/astro/commit/f4efd1c808476c7e60fe00fcfb86276cf14fee79) Thanks [@peng](https://github.com/peng)! - Adds a warning if `astro add` fetches a package but returns a non-404 status

- [#9142](https://github.com/withastro/astro/pull/9142) [`7d55cf68d`](https://github.com/withastro/astro/commit/7d55cf68d89cb46bfb89a109b09af61be8431c89) Thanks [@ematipico](https://github.com/ematipico)! - Consistely emit fallback routes in the correct folders.

- [#9119](https://github.com/withastro/astro/pull/9119) [`306781795`](https://github.com/withastro/astro/commit/306781795d5f4b755bbdf650a937f1f3c00030bd) Thanks [@ematipico](https://github.com/ematipico)! - Fix a flaw in the i18n fallback logic, where the routes didn't preserve their metadata, such as hoisted scripts

- [#9140](https://github.com/withastro/astro/pull/9140) [`7742fd7dc`](https://github.com/withastro/astro/commit/7742fd7dc26533c6f7cd497b00b72de935c57628) Thanks [@martrapp](https://github.com/martrapp)! - View Transitions: handle clicks on SVGAElements and image maps"

- [#9101](https://github.com/withastro/astro/pull/9101) [`e3dce215a`](https://github.com/withastro/astro/commit/e3dce215a5ea06bcff1b21027e5613e6518c69d4) Thanks [@ematipico](https://github.com/ematipico)! - Add a new property `Astro.currentLocale`, available when `i18n` is enabled.

## 3.5.5

### Patch Changes

- [#9091](https://github.com/withastro/astro/pull/9091) [`536c6c9fd`](https://github.com/withastro/astro/commit/536c6c9fd3d65d1a60bbc8b924c5939f27541d41) Thanks [@ematipico](https://github.com/ematipico)! - The `routingStrategy` `prefix-always` should not force its logic to endpoints. This fixes some regression with `astro:assets` and `@astrojs/rss`.

- [#9102](https://github.com/withastro/astro/pull/9102) [`60e8210b0`](https://github.com/withastro/astro/commit/60e8210b0ce5bc512aff72a32322ba7937a411b0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - In the dev overlay, when there's too many plugins enabled at once, some of the plugins will now be hidden in a separate sub menu to avoid the bar becoming too long

## 3.5.4

### Patch Changes

- [#9085](https://github.com/withastro/astro/pull/9085) [`fc66ecff1`](https://github.com/withastro/astro/commit/fc66ecff18a20dd436026cb8e75bcc8b5ab0e681) Thanks [@ematipico](https://github.com/ematipico)! - When redirecting to the default root locale, Astro middleare should take into consideration the value of `trailingSlash`

- [#9067](https://github.com/withastro/astro/pull/9067) [`c6e449c5b`](https://github.com/withastro/astro/commit/c6e449c5b3e6e994b362b9ce441c8a1a81129f23) Thanks [@danielhajduk](https://github.com/danielhajduk)! - Fixes display of debug messages when using the `--verbose` flag

- [#9075](https://github.com/withastro/astro/pull/9075) [`c5dc8f2ec`](https://github.com/withastro/astro/commit/c5dc8f2ec9c8c1bbbffabed9eeb12d151aefb81e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix Passthrough image service generating multiple images with the same content in certain cases

- [#9083](https://github.com/withastro/astro/pull/9083) [`4537ecf0d`](https://github.com/withastro/astro/commit/4537ecf0d060f89cb8c000338a7fc5f4197a88c8) Thanks [@bluwy](https://github.com/bluwy)! - Uses new `createShikiHighlighter` API from `@astrojs/markdown-remark` to avoid code duplication

- [#9084](https://github.com/withastro/astro/pull/9084) [`045e5ec97`](https://github.com/withastro/astro/commit/045e5ec9793a4ba2e3f0248d734246eb033225e8) Thanks [@matthewp](https://github.com/matthewp)! - Supports `formmethod` and `formaction` for form overrides

- [#9087](https://github.com/withastro/astro/pull/9087) [`b895113a0`](https://github.com/withastro/astro/commit/b895113a0ae347ecd81bd8866ae2d816ea20836b) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Fixes the regression which broke bundling of image service for pre-rendered pages, which was introduced by [#8854](https://github.com/withastro/astro/pull/8854)

- [#9058](https://github.com/withastro/astro/pull/9058) [`5ef89ef33`](https://github.com/withastro/astro/commit/5ef89ef33e0dc4621db947b6889b3c563eb56a78) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a new settings panel to the dev overlay

- [#9045](https://github.com/withastro/astro/pull/9045) [`84312f24f`](https://github.com/withastro/astro/commit/84312f24f8af2098b0831cf2361ea3d37761d3d3) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - Fixes preview server `trailingSlash` handling for request URLs with query strings

- Updated dependencies [[`4537ecf0d`](https://github.com/withastro/astro/commit/4537ecf0d060f89cb8c000338a7fc5f4197a88c8)]:
  - @astrojs/markdown-remark@3.5.0

## 3.5.3

### Patch Changes

- [#9069](https://github.com/withastro/astro/pull/9069) [`50164f5e3`](https://github.com/withastro/astro/commit/50164f5e37cdc6ad81216627d8edb2a98ed37491) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix a regression introduced in 3.5.0 related to content collection styles

## 3.5.2

### Patch Changes

- [#9057](https://github.com/withastro/astro/pull/9057) [`1bc331968`](https://github.com/withastro/astro/commit/1bc3319686808292322ea3f7e5df3b4a37357111) Thanks [@ematipico](https://github.com/ematipico)! - Correctly infer the presence of an user middleware

## 3.5.1

### Patch Changes

- [#9037](https://github.com/withastro/astro/pull/9037) [`ea71975ec`](https://github.com/withastro/astro/commit/ea71975ec0c99f407f0e2fd0c248a959284d2068) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates i18n configuration reference

- [#9051](https://github.com/withastro/astro/pull/9051) [`15b84ccb9`](https://github.com/withastro/astro/commit/15b84ccb9859b070e30030015fca0de090a7b079) Thanks [@ematipico](https://github.com/ematipico)! - Fix a regression where endpoints were incorrectly processed during SSG build when `trailingSlash: "always"`

- [#9042](https://github.com/withastro/astro/pull/9042) [`7dedd17fc`](https://github.com/withastro/astro/commit/7dedd17fc4c48aba31d9d39a10a94cd271b19746) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - Safely bail when the `xclip` command does not exist on Linux when trying to copy to clipboard with `astro info`

- [#9050](https://github.com/withastro/astro/pull/9050) [`bf0286e50`](https://github.com/withastro/astro/commit/bf0286e50c09f8b5a08af63d7837add69af9b7e4) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix --verbose flag not working

- [#9049](https://github.com/withastro/astro/pull/9049) [`49b82edb2`](https://github.com/withastro/astro/commit/49b82edb2c0d5058ec1adaed33d8b027220091c1) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix image errors when images were used on the client

## 3.5.0

### Minor Changes

- [#8869](https://github.com/withastro/astro/pull/8869) [`f5bdfa272`](https://github.com/withastro/astro/commit/f5bdfa272b4270b06bc539c2e382d6730987300c) Thanks [@matthewp](https://github.com/matthewp)! - ## Integration Hooks to add Middleware

  It's now possible in Astro for an integration to add middleware on behalf of the user. Previously when a third party wanted to provide middleware, the user would need to create a `src/middleware.ts` file themselves. Now, adding third-party middleware is as easy as adding a new integration.

  For integration authors, there is a new `addMiddleware` function in the `astro:config:setup` hook. This function allows you to specify a middleware module and the order in which it should be applied:

  ```js
  // my-package/middleware.js
  import { defineMiddleware } from 'astro:middleware';

  export const onRequest = defineMiddleware(async (context, next) => {
    const response = await next();

    if (response.headers.get('content-type') === 'text/html') {
      let html = await response.text();
      html = minify(html);
      return new Response(html, {
        status: response.status,
        headers: response.headers,
      });
    }

    return response;
  });
  ```

  You can now add your integration's middleware and specify that it runs either before or after the application's own defined middleware (defined in `src/middleware.{js,ts}`)

  ```js
  // my-package/integration.js
  export function myIntegration() {
    return {
      name: 'my-integration',
      hooks: {
        'astro:config:setup': ({ addMiddleware }) => {
          addMiddleware({
            entrypoint: 'my-package/middleware',
            order: 'pre',
          });
        },
      },
    };
  }
  ```

- [#8854](https://github.com/withastro/astro/pull/8854) [`3e1239e42`](https://github.com/withastro/astro/commit/3e1239e42b99bf069265393dc359bf967fc64902) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Provides a new, experimental build cache for [Content Collections](https://docs.astro.build/en/guides/content-collections/) as part of the [Incremental Build RFC](https://github.com/withastro/roadmap/pull/763). This includes multiple refactors to Astro's build process to optimize how Content Collections are handled, which should provide significant performance improvements for users with many collections.

  Users building a `static` site can opt-in to preview the new build cache by adding the following flag to your Astro config:

  ```js
  // astro.config.mjs
  export default {
    experimental: {
      contentCollectionCache: true,
    },
  };
  ```

  When this experimental feature is enabled, the files generated from your content collections will be stored in the [`cacheDir`](https://docs.astro.build/en/reference/configuration-reference/#cachedir) (by default, `node_modules/.astro`) and reused between builds. Most CI environments automatically restore files in `node_modules/` by default.

  In our internal testing on the real world [Astro Docs](https://github.com/withastro/docs) project, this feature reduces the bundling step of `astro build` from **133.20s** to **10.46s**, about 92% faster. The end-to-end `astro build` process used to take **4min 58s** and now takes just over `1min` for a total reduction of 80%.

  If you run into any issues with this experimental feature, please let us know!

  You can always bypass the cache for a single build by passing the `--force` flag to `astro build`.

  ```
  astro build --force
  ```

- [#8963](https://github.com/withastro/astro/pull/8963) [`fda3a0213`](https://github.com/withastro/astro/commit/fda3a0213b1907fd63076ebc93d92ada3d026461) Thanks [@matthewp](https://github.com/matthewp)! - Form support in View Transitions router

  The `<ViewTransitions />` router can now handle form submissions, allowing the same animated transitions and stateful UI retention on form posts that are already available on `<a>` links. With this addition, your Astro project can have animations in all of these scenarios:

  - Clicking links between pages.
  - Making stateful changes in forms (e.g. updating site preferences).
  - Manually triggering navigation via the `navigate()` API.

  This feature is opt-in for semver reasons and can be enabled by adding the `handleForms` prop to the `<ViewTransitions /> component:

  ```astro
  ---
  // src/layouts/MainLayout.astro
  import { ViewTransitions } from 'astro:transitions';
  ---

  <html>
    <head>
      <!-- ... -->
      <ViewTransitions handleForms />
    </head>
    <body>
      <!-- ... -->
    </body>
  </html>
  ```

  Just as with links, if you don't want the routing handling a form submission, you can opt out on a per-form basis with the `data-astro-reload` property:

  ```astro
  ---
  // src/components/Contact.astro
  ---

  <form class="contact-form" action="/request" method="post" data-astro-reload>
    <!-- ...-->
  </form>
  ```

  Form support works on post `method="get"` and `method="post"` forms.

- [#8954](https://github.com/withastro/astro/pull/8954) [`f0031b0a3`](https://github.com/withastro/astro/commit/f0031b0a3959b03d1b28e173982c7e1ca60e735f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates the Image Services API to now delete original images from the final build that are not used outside of the optimization pipeline. For users with a large number of these images (e.g. thumbnails), this should reduce storage consumption and deployment times.

- [#8984](https://github.com/withastro/astro/pull/8984) [`26b1484e8`](https://github.com/withastro/astro/commit/26b1484e808feee6faca3bd89fb512849a664046) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new property `propertiesToHash` to the Image Services API to allow specifying which properties of `getImage()` / `<Image />` / `<Picture />` should be used for hashing the result files when doing local transformations. For most services, this will include properties such as `src`, `width` or `quality` that directly changes the content of the generated image.

- [#9010](https://github.com/withastro/astro/pull/9010) [`100b61ab5`](https://github.com/withastro/astro/commit/100b61ab5a34c1efc571a57ce46832ece97688e5) Thanks [@jasikpark](https://github.com/jasikpark)! - The `<Picture />` component will now use `jpg` and `jpeg` respectively as fallback formats when the original image is in those formats.

- [#8974](https://github.com/withastro/astro/pull/8974) [`143bacf39`](https://github.com/withastro/astro/commit/143bacf3962f7b0ed3efe2bdfea844e72e10d288) Thanks [@ematipico](https://github.com/ematipico)! - Experimental support for i18n routing.

  Astro's experimental i18n routing API allows you to add your multilingual content with support for configuring a default language, computing relative page URLs, and accepting preferred languages provided by your visitor's browser. You can also specify fallback languages on a per-language basis so that your visitors can always be directed to existing content on your site.

  Enable the experimental routing option by adding an `i18n` object to your Astro configuration with a default location and a list of all languages to support:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      i18n: {
        defaultLocale: 'en',
        locales: ['en', 'es', 'pt-br'],
      },
    },
  });
  ```

  Organize your content folders by locale depending on your `i18n.routingStrategy`, and Astro will handle generating your routes and showing your preferred URLs to your visitors.

  ```
  ├── src
  │   ├── pages
  │   │   ├── about.astro
  │   │   ├── index.astro
  │   │   ├── es
  │   │   │   ├── about.astro
  │   │   │   ├── index.astro
  │   │   ├── pt-br
  │   │   │   ├── about.astro
  │   │   │   ├── index.astro
  ```

  Compute relative URLs for your links with `getRelativeLocaleUrl` from the new `astro:i18n` module:

  ```astro
  ---
  import { getRelativeLocaleUrl } from 'astro:i18n';
  const aboutUrl = getRelativeLocaleUrl('pt-br', 'about');
  ---

  <p>Learn more <a href={aboutURL}>About</a> this site!</p>
  ```

  Enabling i18n routing also provides two new properties for browser language detection: `Astro.preferredLocale` and `Astro.preferredLocaleList`. These combine the browser's `Accept-Language` header, and your site's list of supported languages and can be used to automatically respect your visitor's preferred languages.

  Read more about Astro's [experimental i18n routing](https://docs.astro.build/en/guides/internationalization/) in our documentation.

- [#8951](https://github.com/withastro/astro/pull/8951) [`38e21d127`](https://github.com/withastro/astro/commit/38e21d1275a379744bc402ad28ac35bd629d5ff0) Thanks [@bluwy](https://github.com/bluwy)! - Prefetching is now supported in core

  You can enable prefetching for your site with the `prefetch: true` config. It is enabled by default when using [View Transitions](https://docs.astro.build/en/guides/view-transitions/) and can also be used to configure the `prefetch` behaviour used by View Transitions.

  You can enable prefetching by setting `prefetch:true` in your Astro config:

  ```js
  // astro.config.js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    prefetch: true,
  });
  ```

  This replaces the `@astrojs/prefetch` integration, which is now deprecated and will eventually be removed.
  Visit the [Prefetch guide](https://docs.astro.build/en/guides/prefetch/) for more information.

- [#8903](https://github.com/withastro/astro/pull/8903) [`c5010aad3`](https://github.com/withastro/astro/commit/c5010aad3475669648dc939e00f88bbb52489d0d) Thanks [@horo-fox](https://github.com/horo-fox)! - Adds experimental support for multiple shiki themes with the new `markdown.shikiConfig.experimentalThemes` option.

### Patch Changes

- [#9016](https://github.com/withastro/astro/pull/9016) [`1ecc9aa32`](https://github.com/withastro/astro/commit/1ecc9aa3240b79a3879b1329aa4f671d80e87649) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add ability to "Click to go editor" on auditted elements in the dev overlay

- [#9029](https://github.com/withastro/astro/pull/9029) [`29b83e9e4`](https://github.com/withastro/astro/commit/29b83e9e4b906cc0b5d92fae854fb350fc2be7c8) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Use UInt8Array instead of Buffer for both the input and return values of the `transform()` hook of the Image Service API to ensure compatibility with non-Node runtimes.

  This change is unlikely to affect you, but if you were previously relying on the return value being a Buffer, you may convert an `UInt8Array` to a `Buffer` using `Buffer.from(your_array)`.

- Updated dependencies [[`c5010aad3`](https://github.com/withastro/astro/commit/c5010aad3475669648dc939e00f88bbb52489d0d)]:
  - @astrojs/markdown-remark@3.4.0

## 3.4.4

### Patch Changes

- [#9000](https://github.com/withastro/astro/pull/9000) [`35739d01e`](https://github.com/withastro/astro/commit/35739d01e9cc4fa31a8b85201feecf29c747eca9) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an error in dev mode on Safari where view transitions prevented navigating to pages with `client:only` components

- [#9014](https://github.com/withastro/astro/pull/9014) [`d979b8f0a`](https://github.com/withastro/astro/commit/d979b8f0a82c12f2a844c429982207c88fe13ae6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add animations, shadows and general styling tweaks to the Dev Overlay to better match the intended design.

- [#8996](https://github.com/withastro/astro/pull/8996) [`3988bbcc9`](https://github.com/withastro/astro/commit/3988bbcc9ead0b9af60b8a8749a0ad25c686bde3) Thanks [@bluwy](https://github.com/bluwy)! - Adds compatibility for shiki languages with the `path` property

- [#8986](https://github.com/withastro/astro/pull/8986) [`910eb00fe`](https://github.com/withastro/astro/commit/910eb00fe0b70ca80bd09520ae100e8c78b675b5) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `sizes` attribute not being present on `source` elements when using it on the Picture component

## 3.4.3

### Patch Changes

- [#8981](https://github.com/withastro/astro/pull/8981) [`ab7e745cc`](https://github.com/withastro/astro/commit/ab7e745cc9abd592aa631bffb35880221e7ac89c) Thanks [@matthewp](https://github.com/matthewp)! - Increase the scroll restoration throttle time

- [#8940](https://github.com/withastro/astro/pull/8940) [`937522fb7`](https://github.com/withastro/astro/commit/937522fb70be522378268d04e6bb20d8dc401c0b) Thanks [@MarvinXu](https://github.com/MarvinXu)! - Omit nullish and falsy (non-zero) values when stringifying object-form `style` attributes in Astro files

## 3.4.2

### Patch Changes

- [#8977](https://github.com/withastro/astro/pull/8977) [`40a061679`](https://github.com/withastro/astro/commit/40a06167976a29798a0b9e7eab64dd39f4ab6521) Thanks [@matthewp](https://github.com/matthewp)! - Prevent route announcer from being visible

- [#8929](https://github.com/withastro/astro/pull/8929) [`2da33b7a1`](https://github.com/withastro/astro/commit/2da33b7a13cf964595f758e3e4a865fd97d0943e) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where rendering the same slot multiple times invoked it only once.

- [#8978](https://github.com/withastro/astro/pull/8978) [`cc3278bb6`](https://github.com/withastro/astro/commit/cc3278bb69738c4e0c7811d683ead71bea6f46c1) Thanks [@Princesseuh](https://github.com/Princesseuh)! - In the dev overlay, add a tooltip showing the currently hovered / focused plugin's name

## 3.4.1

### Patch Changes

- [#8966](https://github.com/withastro/astro/pull/8966) [`262cef248`](https://github.com/withastro/astro/commit/262cef2487c7494bd8d23b4ab27bfcdf1870a111) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix Dev Overlay not working properly when view transitions are enabled

- [#8932](https://github.com/withastro/astro/pull/8932) [`5fed432b0`](https://github.com/withastro/astro/commit/5fed432b0c3c84542a3d1b2952d183e9cbe3fa0e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixed window component appearing over the dev overlay on small windows. Added a maximum length to sections of the tooltip component

- [#8965](https://github.com/withastro/astro/pull/8965) [`430c470ac`](https://github.com/withastro/astro/commit/430c470ace5cfae5f53b530df54c0dc7e2046aaa) Thanks [@matthewp](https://github.com/matthewp)! - Move VT route announcer styles to a class

  Doing so allows stricter CSP policies.

- [#8762](https://github.com/withastro/astro/pull/8762) [`35cd810f0`](https://github.com/withastro/astro/commit/35cd810f0f988010fbb8e6d7ab205de5d816e2b2) Thanks [@evadecker](https://github.com/evadecker)! - Upgrades Zod to 3.22.4

- [#8928](https://github.com/withastro/astro/pull/8928) [`ca90b47cf`](https://github.com/withastro/astro/commit/ca90b47cfc5e00f5065cf461e2fe50db62215e49) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Renames dev overlay UI Toolkit component names for consistency.

## 3.4.0

### Minor Changes

- [#8755](https://github.com/withastro/astro/pull/8755) [`fe4079f05`](https://github.com/withastro/astro/commit/fe4079f05ba21c0f3a167f8e3f55eff705506bd2) Thanks [@matthewp](https://github.com/matthewp)! - Page Partials

  A page component can now be identified as a **partial** page, which will render its HTML content without including a `<! DOCTYPE html>` declaration nor any `<head>` content.

  A rendering library, like htmx or Stimulus or even just jQuery can access partial content on the client to dynamically update only parts of a page.

  Pages marked as partials do not have a `doctype` or any head content included in the rendered result. You can mark any page as a partial by setting this option:

  ```astro
  ---
  export const partial = true;
  ---

  <li>This is a single list item.</li>
  ```

  Other valid page files that can export a value (e.g. `.mdx`) can also be marked as partials.

  Read more about [Astro page partials](https://docs.astro.build/en/core-concepts/astro-pages/#page-partials) in our documentation.

- [#8821](https://github.com/withastro/astro/pull/8821) [`4740d761a`](https://github.com/withastro/astro/commit/4740d761aeb526dbd79517ebe8cd934f90b17f7c) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Improved image optimization performance

  Astro will now generate optimized images concurrently at build time, which can significantly speed up build times for sites with many images. Additionally, Astro will now reuse the same buffer for all variants of an image. This should improve performance for websites with many variants of the same image, especially when using remote images.

  No code changes are required to take advantage of these improvements.

- [#8757](https://github.com/withastro/astro/pull/8757) [`e99586787`](https://github.com/withastro/astro/commit/e99586787b6b53d35daf0195ab9835326cea464a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Dev Overlay (experimental)

  Provides a new dev overlay for your browser preview that allows you to inspect your page islands, see helpful audits on performance and accessibility, and more. A Dev Overlay Plugin API is also included to allow you to add new features and third-party integrations to it.

  You can enable access to the dev overlay and its API by adding the following flag to your Astro config:

  ```ts
  // astro.config.mjs
  export default {
    experimental: {
      devOverlay: true,
    },
  };
  ```

  Read the [Dev Overlay Plugin API documentation](https://docs.astro.build/en/reference/dev-overlay-plugin-reference/) for information about building your own plugins to integrate with Astro's dev overlay.

- [#8880](https://github.com/withastro/astro/pull/8880) [`8c3d4a859`](https://github.com/withastro/astro/commit/8c3d4a859aec0b94cabd14cc56b5bf3e5e973e36) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Moves the logic for overriding the image service out of core and into adapters. Also fixes a regression where a valid `astro:assets` image service configuration could be overridden.

## 3.3.4

### Patch Changes

- [#8877](https://github.com/withastro/astro/pull/8877) [`26b77b8fe`](https://github.com/withastro/astro/commit/26b77b8fef0e03bfc5550aecaa1f56a4fc1cd297) Thanks [@bluwy](https://github.com/bluwy)! - Fixes CSS modules ordering by rendering styles before links

- Updated dependencies [[`341ef6578`](https://github.com/withastro/astro/commit/341ef6578528a00f89bf6da5e4243b0fde272816)]:
  - @astrojs/telemetry@3.0.4

## 3.3.3

### Patch Changes

- [#8870](https://github.com/withastro/astro/pull/8870) [`5ea6ee0ed`](https://github.com/withastro/astro/commit/5ea6ee0ed494c792a4c94928a83c5c85b9b6ac32) Thanks [@xstevenyung](https://github.com/xstevenyung)! - prevent production install on astro add cmd

- [#8840](https://github.com/withastro/astro/pull/8840) [`5c888c10b`](https://github.com/withastro/astro/commit/5c888c10b712ca60a23e66b88af8051b54b42323) Thanks [@martrapp](https://github.com/martrapp)! - Fixes styles of `client:only` components not persisting during view transitions in dev mode

- [#8814](https://github.com/withastro/astro/pull/8814) [`ad2bb9155`](https://github.com/withastro/astro/commit/ad2bb9155997380d0880b0c6c7b12f079a031d48) Thanks [@lilnasy](https://github.com/lilnasy)! - Fix an issue where `500.astro` did not render when the middleware threw an error.

- [#8863](https://github.com/withastro/astro/pull/8863) [`326e17893`](https://github.com/withastro/astro/commit/326e178933f7a22f4e897b763832619f168b53dd) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes an issue where the dev server logged the full file path on updates.

## 3.3.2

### Patch Changes

- [#8852](https://github.com/withastro/astro/pull/8852) [`2c18e2d12`](https://github.com/withastro/astro/commit/2c18e2d127516c2130cf50369885a30af0190d58) Thanks [@rayriffy](https://github.com/rayriffy)! - Only use Vite config from astro.config.mjs as source of truth

- [#8828](https://github.com/withastro/astro/pull/8828) [`11f45b9a3`](https://github.com/withastro/astro/commit/11f45b9a3216f60317e1c54bb3e6c4e9e0add342) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - fix file system path references

- [#8779](https://github.com/withastro/astro/pull/8779) [`2b8a459a6`](https://github.com/withastro/astro/commit/2b8a459a6ae82c7a1d278ef263e316841295e7d6) Thanks [@ematipico](https://github.com/ematipico)! - Enriches the explanation of the `base` configuration with examples.

## 3.3.1

### Patch Changes

- [#8823](https://github.com/withastro/astro/pull/8823) [`8946f2a25`](https://github.com/withastro/astro/commit/8946f2a256edf1aca6a7bb0db1f6ea9ce9493253) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix duplicate images being created in some cases when using densities and/or widths

- [#8842](https://github.com/withastro/astro/pull/8842) [`b405b039a`](https://github.com/withastro/astro/commit/b405b039a6824590e4ad63605f19f0925b4b88ce) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes Picture component not taking into account the fallback format specified

- [#8827](https://github.com/withastro/astro/pull/8827) [`ce3025cfa`](https://github.com/withastro/astro/commit/ce3025cfa27a38199f81fb783a68fe1190c1d09e) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - better error handling there whenever we don't get a normal 200 response

- [#8817](https://github.com/withastro/astro/pull/8817) [`f8de1983b`](https://github.com/withastro/astro/commit/f8de1983bde3ecfed3ab61abf0aa9f967b0d86ce) Thanks [@bluwy](https://github.com/bluwy)! - Fix error overlay syntax highlighting

- [#8838](https://github.com/withastro/astro/pull/8838) [`2f9e2083d`](https://github.com/withastro/astro/commit/2f9e2083d5783c9980cd8b9d69165128f0a5ae19) Thanks [@dominikg](https://github.com/dominikg)! - deps: unpin and update tsconfck from `3.0.0-next.9` to `^3.0.0`

- [#8823](https://github.com/withastro/astro/pull/8823) [`8946f2a25`](https://github.com/withastro/astro/commit/8946f2a256edf1aca6a7bb0db1f6ea9ce9493253) Thanks [@Princesseuh](https://github.com/Princesseuh)! - fix remote srcset images not being resized

## 3.3.0

### Minor Changes

- [#8808](https://github.com/withastro/astro/pull/8808) [`2993055be`](https://github.com/withastro/astro/commit/2993055bed2764c31ff4b4f55b81ab6b1ae6b401) Thanks [@delucis](https://github.com/delucis)! - Adds support for an `--outDir` CLI flag to `astro build`

- [#8502](https://github.com/withastro/astro/pull/8502) [`c4270e476`](https://github.com/withastro/astro/commit/c4270e47681ee2453f3fea07fed7b238645fd6ea) Thanks [@bluwy](https://github.com/bluwy)! - Updates the internal `shiki` syntax highlighter to `shikiji`, an ESM-focused alternative that simplifies bundling and maintenance.

  There are no new options and no changes to how you author code blocks and syntax highlighting.

  **Potentially breaking change:** While this refactor should be transparent for most projects, the transition to `shikiji` now produces a smaller HTML markup by attaching a fallback `color` style to the `pre` or `code` element, instead of to the line `span` directly. For example:

  Before:

  ```html
  <code class="astro-code" style="background-color: #24292e">
    <pre>
      <span class="line" style="color: #e1e4e8">my code</span>
    </pre>
  </code>
  ```

  After:

  ```html
  <code class="astro-code" style="background-color: #24292e; color: #e1e4e8">
    <pre>
      <span class="line">my code<span>
    </pre>
  </code>
  ```

  This does not affect the colors as the `span` will inherit the `color` from the parent, but if you're relying on a specific HTML markup, please check your site carefully after upgrading to verify the styles.

- [#8798](https://github.com/withastro/astro/pull/8798) [`f369fa250`](https://github.com/withastro/astro/commit/f369fa25055a3497ebaf61c88fb0e8af56c73212) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixed `tsconfig.json`'s new array format for `extends` not working. This was done by migrating Astro to use [`tsconfck`](https://github.com/dominikg/tsconfck) instead of [`tsconfig-resolver`](https://github.com/ifiokjr/tsconfig-resolver) to find and parse `tsconfig.json` files.

- [#8620](https://github.com/withastro/astro/pull/8620) [`b2ae9ee0c`](https://github.com/withastro/astro/commit/b2ae9ee0c42b11ffc1d3f070d1d5ac881aef84ed) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds experimental support for generating `srcset` attributes and a new `<Picture />` component.

  ## `srcset` support

  Two new properties have been added to `Image` and `getImage()`: `densities` and `widths`.

  These properties can be used to generate a `srcset` attribute, either based on absolute widths in pixels (e.g. [300, 600, 900]) or pixel density descriptors (e.g. `["2x"]` or `[1.5, 2]`).

  ```astro
  ---
  import { Image } from 'astro';
  import myImage from './my-image.jpg';
  ---

  <Image src={myImage} width={myImage.width / 2} densities={[1.5, 2]} alt="My cool image" />
  ```

  ```html
  <img
    src="/_astro/my_image.hash.webp"
    srcset="/_astro/my_image.hash.webp 1.5x, /_astro/my_image.hash.webp 2x"
    alt="My cool image"
  />
  ```

  ## Picture component

  The experimental `<Picture />` component can be used to generate a `<picture>` element with multiple `<source>` elements.

  The example below uses the `format` property to generate a `<source>` in each of the specified image formats:

  ```astro
  ---
  import { Picture } from 'astro:assets';
  import myImage from './my-image.jpg';
  ---

  <Picture src={myImage} formats={['avif', 'webp']} alt="My super image in multiple formats!" />
  ```

  The above code will generate the following HTML, and allow the browser to determine the best image to display:

  ```html
  <picture>
    <source srcset="..." type="image/avif" />
    <source srcset="..." type="image/webp" />
    <img src="..." alt="My super image in multiple formats!" />
  </picture>
  ```

  The `Picture` component takes all the same props as the `Image` component, including the new `densities` and `widths` properties.

### Patch Changes

- [#8771](https://github.com/withastro/astro/pull/8771) [`bd5aa1cd3`](https://github.com/withastro/astro/commit/bd5aa1cd35ecbd2784f30dd836ff814684fee02b) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed an issue where the transitions router did not work within framework components.

- [#8800](https://github.com/withastro/astro/pull/8800) [`391729686`](https://github.com/withastro/astro/commit/391729686bcc8404a7dd48c5987ee380daf3200f) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed an issue where attempting to assign a variable onto locals threw an error.

- [#8795](https://github.com/withastro/astro/pull/8795) [`f999365b8`](https://github.com/withastro/astro/commit/f999365b8248b8b14f3743e68a42d450d06acff3) Thanks [@bluwy](https://github.com/bluwy)! - Fix markdown page charset to be utf-8 by default (same as Astro 2)

- [#8810](https://github.com/withastro/astro/pull/8810) [`0abff97fe`](https://github.com/withastro/astro/commit/0abff97fed3db14be3c75ff9ece3aab67c4ba783) Thanks [@jacobthesheep](https://github.com/jacobthesheep)! - Remove `network-information-types` package since TypeScript supports Network Information API natively.

- [#8813](https://github.com/withastro/astro/pull/8813) [`3bef32f81`](https://github.com/withastro/astro/commit/3bef32f81c56bc600ca307f1bd40787e23e625a5) Thanks [@martrapp](https://github.com/martrapp)! - Save and restore focus for persisted input elements during view transitions

- Updated dependencies [[`c4270e476`](https://github.com/withastro/astro/commit/c4270e47681ee2453f3fea07fed7b238645fd6ea)]:
  - @astrojs/markdown-remark@3.3.0

## 3.2.4

### Patch Changes

- [#8638](https://github.com/withastro/astro/pull/8638) [`160d1cd75`](https://github.com/withastro/astro/commit/160d1cd755e70af1d8ec294d01dd2cb32d60db50) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - The `@astrojs/tailwind` integration now creates a `tailwind.config.mjs` file by default

- [#8767](https://github.com/withastro/astro/pull/8767) [`30de32436`](https://github.com/withastro/astro/commit/30de324361bc261956eb9fc08fe60a82ff602a9b) Thanks [@martrapp](https://github.com/martrapp)! - Revert fix #8472

  [#8472](https://github.com/withastro/astro/pull/8472) caused some style files from previous pages to not be cleanly deleted on view transitions. For a discussion of a future fix for the original issue [#8144](https://github.com/withastro/astro/issues/8114) see [#8745](https://github.com/withastro/astro/pull/8745).

- [#8741](https://github.com/withastro/astro/pull/8741) [`c4a7ec425`](https://github.com/withastro/astro/commit/c4a7ec4255e7acb9555cb8bb74ea13c5fbb2ac17) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed an issue on Windows where lowercase drive letters in current working directory led to missing scripts and styles.

- [#8772](https://github.com/withastro/astro/pull/8772) [`c24f70d91`](https://github.com/withastro/astro/commit/c24f70d91601dd3a6b5a84f04d61824e775e9b44) Thanks [@martrapp](https://github.com/martrapp)! - Fix flickering during view transitions

- [#8754](https://github.com/withastro/astro/pull/8754) [`93b092266`](https://github.com/withastro/astro/commit/93b092266febfad16a48575f8eee12d5910bf071) Thanks [@bluwy](https://github.com/bluwy)! - Make CSS chunk names less confusing

- [#8776](https://github.com/withastro/astro/pull/8776) [`29cdfa024`](https://github.com/withastro/astro/commit/29cdfa024886dd581cb207586f7dfec6966bdd4e) Thanks [@martrapp](https://github.com/martrapp)! - Fix transition attributes on islands

- [#8773](https://github.com/withastro/astro/pull/8773) [`eaed844ea`](https://github.com/withastro/astro/commit/eaed844ea8f2f52e0c9caa40bb3ec7377e10595f) Thanks [@sumimakito](https://github.com/sumimakito)! - Fix an issue where HTML attributes do not render if getHTMLAttributes in an image service returns a Promise

## 3.2.3

### Patch Changes

- [#8737](https://github.com/withastro/astro/pull/8737) [`6f60da805`](https://github.com/withastro/astro/commit/6f60da805e0014bc50dd07bef972e91c73560c3c) Thanks [@ematipico](https://github.com/ematipico)! - Add provenance statement when publishing the library from CI

- [#8747](https://github.com/withastro/astro/pull/8747) [`d78806dfe`](https://github.com/withastro/astro/commit/d78806dfe0301ea7ffe6c7c1f783bd415ac7cda9) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve error message when user attempts to render a dynamic component reference

- [#8736](https://github.com/withastro/astro/pull/8736) [`d1c75fe15`](https://github.com/withastro/astro/commit/d1c75fe158839699c59728cf3a83888e8c72a459) Thanks [@bluwy](https://github.com/bluwy)! - Fix `tsconfig.json` update causing the server to crash

- [#8743](https://github.com/withastro/astro/pull/8743) [`aa265d730`](https://github.com/withastro/astro/commit/aa265d73024422967c1b1c68ad268c419c6c798f) Thanks [@bluwy](https://github.com/bluwy)! - Remove unused CSS output files when inlined

- [#8700](https://github.com/withastro/astro/pull/8700) [`78adbc443`](https://github.com/withastro/astro/commit/78adbc4433208458291e36713909762e148e1e5d) Thanks [@jacobthesheep](https://github.com/jacobthesheep)! - Update link for Netlify SSR

- [#8729](https://github.com/withastro/astro/pull/8729) [`21e0757ea`](https://github.com/withastro/astro/commit/21e0757ea22a57d344c934045ca19db93b684436) Thanks [@lilnasy](https://github.com/lilnasy)! - Node-based adapters now create less server-side javascript

- [#8730](https://github.com/withastro/astro/pull/8730) [`357270f2a`](https://github.com/withastro/astro/commit/357270f2a3d0bf2aa634ba7e52e9d17618eff4a7) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve `astro info` copy to clipboard compatibility

- Updated dependencies [[`21f482657`](https://github.com/withastro/astro/commit/21f4826576c2c812a1604e18717799da3470decd), [`6f60da805`](https://github.com/withastro/astro/commit/6f60da805e0014bc50dd07bef972e91c73560c3c), [`21e0757ea`](https://github.com/withastro/astro/commit/21e0757ea22a57d344c934045ca19db93b684436)]:
  - @astrojs/markdown-remark@3.2.1
  - @astrojs/internal-helpers@0.2.1
  - @astrojs/telemetry@3.0.3

## 3.2.2

### Patch Changes

- [#8724](https://github.com/withastro/astro/pull/8724) [`455af3235`](https://github.com/withastro/astro/commit/455af3235b3268852e6988accecc796f03f6d16e) Thanks [@bluwy](https://github.com/bluwy)! - Fix CSS styles on Windows

- [#8710](https://github.com/withastro/astro/pull/8710) [`4c2bec681`](https://github.com/withastro/astro/commit/4c2bec681b0752e7215b8a32bd2d44bf477adac1) Thanks [@matthewp](https://github.com/matthewp)! - Fixes View transition styles being missing when component used multiple times

## 3.2.1

### Patch Changes

- [#8680](https://github.com/withastro/astro/pull/8680) [`31c59ad8b`](https://github.com/withastro/astro/commit/31c59ad8b6a72f95c98a306ecf92d198c03110b4) Thanks [@bluwy](https://github.com/bluwy)! - Fix hydration on slow connection

- [#8698](https://github.com/withastro/astro/pull/8698) [`47ea310f0`](https://github.com/withastro/astro/commit/47ea310f01d06ed1562c790bec348718a2fa8277) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Use a Node-specific image endpoint to resolve images in dev and Node SSR. This should fix many issues related to getting 404 from the \_image endpoint under certain configurations

- [#8706](https://github.com/withastro/astro/pull/8706) [`345808170`](https://github.com/withastro/astro/commit/345808170fce783ddd3c9a4035a91fa64dcc5f46) Thanks [@bluwy](https://github.com/bluwy)! - Fix duplicated Astro and Vite injected styles

## 3.2.0

### Minor Changes

- [#8696](https://github.com/withastro/astro/pull/8696) [`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317) Thanks [@matthewp](https://github.com/matthewp)! - Support adding integrations dynamically

  Astro integrations can now themselves dynamically add and configure additional integrations during set-up. This makes it possible for integration authors to bundle integrations more intelligently for their users.

  In the following example, a custom integration checks whether `@astrojs/sitemap` is already configured. If not, the integration adds Astro’s sitemap integration, passing any desired configuration options:

  ```ts
  import sitemap from '@astrojs/sitemap';
  import type { AstroIntegration } from 'astro';

  const MyIntegration = (): AstroIntegration => {
    return {
      name: 'my-integration',

      'astro:config:setup': ({ config, updateConfig }) => {
        // Look for sitemap in user-configured integrations.
        const userSitemap = config.integrations.find(
          ({ name }) => name === '@astrojs/sitemap'
        );

        if (!userSitemap) {
          // If sitemap wasn’t found, add it.
          updateConfig({
            integrations: [sitemap({ /* opts */ }],
          });
        }
      },
    };
  };
  ```

- [#8696](https://github.com/withastro/astro/pull/8696) [`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317) Thanks [@matthewp](https://github.com/matthewp)! - View transitions can now be triggered from JavaScript!

  Import the client-side router from "astro:transitions/client" and enjoy your new remote control for navigation:

  ```js
  import { navigate } from 'astro:transitions/client';

  // Navigate to the selected option automatically.
  document.querySelector('select').onchange = (ev) => {
    let href = ev.target.value;
    navigate(href);
  };
  ```

- [#8696](https://github.com/withastro/astro/pull/8696) [`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317) Thanks [@matthewp](https://github.com/matthewp)! - Route Announcer in `<ViewTransitions />`

  The View Transitions router now does route announcement. When transitioning between pages with a traditional MPA approach, assistive technologies will announce the page title when the page finishes loading. This does not automatically happen during client-side routing, so visitors relying on these technologies to announce routes are not aware when a page has changed.

  The view transitions route announcer runs after the `astro:page-load` event, looking for the page `<title>` to announce. If one cannot be found, the announcer falls back to the first `<h1>` it finds, or otherwise announces the pathname. We recommend you always include a `<title>` in each page for accessibility.

  See the [View Transitions docs](https://docs.astro.build/en/guides/view-transitions/) for more on how accessibility is handled.

### Patch Changes

- [#8647](https://github.com/withastro/astro/pull/8647) [`408b50c5e`](https://github.com/withastro/astro/commit/408b50c5ea5aba66252424f54788557274a58571) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed an issue where configured redirects with dynamic routes did not work in dev mode.

- [#8696](https://github.com/withastro/astro/pull/8696) [`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317) Thanks [@matthewp](https://github.com/matthewp)! - Fix logLevel passed to Vite build

- [#8696](https://github.com/withastro/astro/pull/8696) [`2167ffd72`](https://github.com/withastro/astro/commit/2167ffd72f58904f449ffc6e53581a2d8faf7317) Thanks [@matthewp](https://github.com/matthewp)! - Fix NoImageMetadata image path error message

- [#8670](https://github.com/withastro/astro/pull/8670) [`e797b6816`](https://github.com/withastro/astro/commit/e797b6816072f63f38d9a91dd2a66765c558d46c) Thanks [@MichailiK](https://github.com/MichailiK)! - Fix asset optimization failing when outDir is outside the project directory

- [#8684](https://github.com/withastro/astro/pull/8684) [`824dd4670`](https://github.com/withastro/astro/commit/824dd4670a145c47337eff84a5ae412bf7443117) Thanks [@matthewp](https://github.com/matthewp)! - Support content collections with % in filename

- [#8648](https://github.com/withastro/astro/pull/8648) [`cfd895d87`](https://github.com/withastro/astro/commit/cfd895d877fdb7fc69e745665a374fc32cb3ef7d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed an issue where a response with status code 404 led to an endless loop of implicit rerouting in dev mode.

## 3.1.4

### Patch Changes

- [#8646](https://github.com/withastro/astro/pull/8646) [`69fbf95b2`](https://github.com/withastro/astro/commit/69fbf95b22c0fb0d8e7e5fef9ec61e26cac9767f) Thanks [@matthewp](https://github.com/matthewp)! - Fix cases of head propagation not occurring in dev server

## 3.1.3

### Patch Changes

- [#8591](https://github.com/withastro/astro/pull/8591) [`863f5171e`](https://github.com/withastro/astro/commit/863f5171e8e7516c9d72f2e48ea7db1dea71c4f5) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - add site url to the location of redirect

- [#8633](https://github.com/withastro/astro/pull/8633) [`63141f3f3`](https://github.com/withastro/astro/commit/63141f3f3e4a57d2f55ccfebd7e506ea1033a1ab) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix build not working when having multiple images in the same Markdown file

- [#8636](https://github.com/withastro/astro/pull/8636) [`974d5117a`](https://github.com/withastro/astro/commit/974d5117abc8b47f8225e455b9285c88e305272f) Thanks [@martrapp](https://github.com/martrapp)! - fix: no deletion of scripts during view transition

- [#8645](https://github.com/withastro/astro/pull/8645) [`cb838b84b`](https://github.com/withastro/astro/commit/cb838b84b457041b0442996f7611b04aa940a620) Thanks [@matthewp](https://github.com/matthewp)! - Fix getDataEntryById to lookup by basename

- [#8640](https://github.com/withastro/astro/pull/8640) [`f36c4295b`](https://github.com/withastro/astro/commit/f36c4295be1ef2bcfa4aecb3c59551388419c53d) Thanks [@matthewp](https://github.com/matthewp)! - Warn on empty content collections

- [#8615](https://github.com/withastro/astro/pull/8615) [`4c4ad9d16`](https://github.com/withastro/astro/commit/4c4ad9d167e8d15ff2c15e3336ede8ca22f646b2) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Improve the logging of assets for adapters that do not support image optimization

## 3.1.2

### Patch Changes

- [#8612](https://github.com/withastro/astro/pull/8612) [`bcad715ce`](https://github.com/withastro/astro/commit/bcad715ce67bc73a7927c941d1e7f02a82d638c2) Thanks [@matthewp](https://github.com/matthewp)! - Ensure cookies are attached when middleware changes the Response

- [#8598](https://github.com/withastro/astro/pull/8598) [`bdd267d08`](https://github.com/withastro/astro/commit/bdd267d08937611984d074a2872af11ecf3e1a12) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix relative images in Markdown breaking the build process in certain circumstances

- [#8382](https://github.com/withastro/astro/pull/8382) [`e522a5eb4`](https://github.com/withastro/astro/commit/e522a5eb41c7df1e62c307c84cd14d53777439ff) Thanks [@DerTimonius](https://github.com/DerTimonius)! - Do not throw an error for an empty collection directory.

- [#8600](https://github.com/withastro/astro/pull/8600) [`ed54d4644`](https://github.com/withastro/astro/commit/ed54d46449accc99ad117d6b0d50a8905e4d65d7) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Improve config info telemetry

- [#8592](https://github.com/withastro/astro/pull/8592) [`70f2a8003`](https://github.com/withastro/astro/commit/70f2a80039d232731f63ea735e896997ec0eac7a) Thanks [@bluwy](https://github.com/bluwy)! - Fix alias plugin causing CSS ordering issue

- [#8614](https://github.com/withastro/astro/pull/8614) [`4398e9298`](https://github.com/withastro/astro/commit/4398e929877dfadd2067af28413284afdfde9d8b) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed an issue where spaces and unicode characters in project path prevented middleware from running.

- [#8603](https://github.com/withastro/astro/pull/8603) [`8f8b9069d`](https://github.com/withastro/astro/commit/8f8b9069ddd21cf57d37955ab3a92710492226f5) Thanks [@matthewp](https://github.com/matthewp)! - Prevent body scripts from re-executing on navigation

- [#8609](https://github.com/withastro/astro/pull/8609) [`5a988eaf6`](https://github.com/withastro/astro/commit/5a988eaf609ddc1b9609acb0cdc2dda43d10a5c2) Thanks [@bluwy](https://github.com/bluwy)! - Fix Astro HMR from a CSS dependency

- Updated dependencies [[`ed54d4644`](https://github.com/withastro/astro/commit/ed54d46449accc99ad117d6b0d50a8905e4d65d7)]:
  - @astrojs/telemetry@3.0.2

## 3.1.1

### Patch Changes

- [#8580](https://github.com/withastro/astro/pull/8580) [`8d361169b`](https://github.com/withastro/astro/commit/8d361169b8e487933d671ce347f0ce74922c80cc) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - add hide to style & script generated for island

- [#8568](https://github.com/withastro/astro/pull/8568) [`95b5f6280`](https://github.com/withastro/astro/commit/95b5f6280d124f8d6f866dc3286406c272ee91bf) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix small types issues related to `astro:assets`'s AVIF support and `getImage`

- [#8579](https://github.com/withastro/astro/pull/8579) [`0586e20e8`](https://github.com/withastro/astro/commit/0586e20e8338e077b8eb1a3a96bdd19f5950c22f) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - show redirect symbol as of the page

## 3.1.0

### Minor Changes

- [#8467](https://github.com/withastro/astro/pull/8467) [`ecc65abbf`](https://github.com/withastro/astro/commit/ecc65abbf9e086c5bbd1973cd4a820082b4e0dc5) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a new `image.endpoint` setting to allow using a custom endpoint in dev and SSR

- [#8518](https://github.com/withastro/astro/pull/8518) [`2c4fc878b`](https://github.com/withastro/astro/commit/2c4fc878bece36b7fcf1470419c7ce6f1e1e95d0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for using AVIF (`.avif`) files with the Image component. Importing an AVIF file will now correctly return the same object shape as other image file types. See the [Image docs](https://docs.astro.build/en/guides/images/#update-existing-img-tags) for more information on the different properties available on the returned object.

- [#8464](https://github.com/withastro/astro/pull/8464) [`c92e0acd7`](https://github.com/withastro/astro/commit/c92e0acd715171b3f4c3294099780e21576648c8) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add types for the object syntax for `style` (ex: `style={{color: 'red'}}`)

### Patch Changes

- [#8532](https://github.com/withastro/astro/pull/8532) [`7522bb491`](https://github.com/withastro/astro/commit/7522bb4914f2f9e8b8f3c743bc9c941fd3aca644) Thanks [@bluwy](https://github.com/bluwy)! - Improve markdown rendering performance by sharing processor instance

- [#8537](https://github.com/withastro/astro/pull/8537) [`f95febf96`](https://github.com/withastro/astro/commit/f95febf96bb97babb28d78994332f5e47f5f637d) Thanks [@martrapp](https://github.com/martrapp)! - bugfix checking media-type in client-side router

- [#8536](https://github.com/withastro/astro/pull/8536) [`b85c8a78a`](https://github.com/withastro/astro/commit/b85c8a78a116dbbddc901438bc0b7a1917dc0238) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Improved error messages around `astro:assets`

- [#7607](https://github.com/withastro/astro/pull/7607) [`45364c345`](https://github.com/withastro/astro/commit/45364c345267429e400baecd1fbc290503f8b13a) Thanks [@FineWolf](https://github.com/FineWolf)! - Add `CollectionKey`, `ContentCollectionKey`, and `DataCollectionKey` exports to `astro:content`

- Updated dependencies [[`d93987824`](https://github.com/withastro/astro/commit/d93987824d3d6b4f58267be21ab8466ee8d5d5f8), [`7522bb491`](https://github.com/withastro/astro/commit/7522bb4914f2f9e8b8f3c743bc9c941fd3aca644)]:
  - @astrojs/markdown-remark@3.2.0

## 3.0.13

### Patch Changes

- [#8484](https://github.com/withastro/astro/pull/8484) [`78b82bb39`](https://github.com/withastro/astro/commit/78b82bb3929bee5d8d9bd32d65374956ddb05859) Thanks [@bb010g](https://github.com/bb010g)! - fix(astro): add support for `src/content/config.mts` files

- [#8504](https://github.com/withastro/astro/pull/8504) [`5e1099f68`](https://github.com/withastro/astro/commit/5e1099f686abcc7026bd4fa74727f3b311c6d6d6) Thanks [@ematipico](https://github.com/ematipico)! - Minify the HTML of the redicts emitted during the build.

- [#8480](https://github.com/withastro/astro/pull/8480) [`644825845`](https://github.com/withastro/astro/commit/644825845c11c8d100a9b0d16b69a23c165c529e) Thanks [@yamanoku](https://github.com/yamanoku)! - Do not add type="text/css" to inline style tag

- [#8472](https://github.com/withastro/astro/pull/8472) [`fa77fa63d`](https://github.com/withastro/astro/commit/fa77fa63d944f709a37f08be93f0d14fe1d91188) Thanks [@matthewp](https://github.com/matthewp)! - Prevent client:only styles from being removed in dev (View Transitions)

- [#8506](https://github.com/withastro/astro/pull/8506) [`23f9536de`](https://github.com/withastro/astro/commit/23f9536de0456ed2ddc9a77f7aef773ab6a8e73c) Thanks [@mascii](https://github.com/mascii)! - chore: correct description of `attribute` option in `scopedStyleStrategy`

- [#8505](https://github.com/withastro/astro/pull/8505) [`2db9762eb`](https://github.com/withastro/astro/commit/2db9762eb06d8a95021556c64e0cbb56c61352d5) Thanks [@martrapp](https://github.com/martrapp)! - Restore horizontal scroll position on history navigation (view transitions)

- [#8461](https://github.com/withastro/astro/pull/8461) [`435b10549`](https://github.com/withastro/astro/commit/435b10549878281ad2bb60207cb86f312a4a809f) Thanks [@rdwz](https://github.com/rdwz)! - Fix lang unspecified code blocks (markdownlint MD040)

- [#8492](https://github.com/withastro/astro/pull/8492) [`a6a516d94`](https://github.com/withastro/astro/commit/a6a516d9446a50cc32fbd7201b243c63b3a4db43) Thanks [@xiBread](https://github.com/xiBread)! - fix(types): make `image.service` optional

- [#8522](https://github.com/withastro/astro/pull/8522) [`43bc5f2a5`](https://github.com/withastro/astro/commit/43bc5f2a55173218bcfeec50242b72ae999930e2) Thanks [@martrapp](https://github.com/martrapp)! - let view transitions handle same origin redirects

- [#8491](https://github.com/withastro/astro/pull/8491) [`0ca332ba4`](https://github.com/withastro/astro/commit/0ca332ba4ab82cc04872776398952867b0f43d33) Thanks [@martrapp](https://github.com/martrapp)! - Bugfixes for back navigation in the view transition client-side router

## 3.0.12

### Patch Changes

- [#8449](https://github.com/withastro/astro/pull/8449) [`7eea37a07`](https://github.com/withastro/astro/commit/7eea37a075c6abb1de715de76d1911ff41e8ab13) Thanks [@matthewp](https://github.com/matthewp)! - Fix multi-layout head injection

## 3.0.11

### Patch Changes

- [#8441](https://github.com/withastro/astro/pull/8441) [`f66053a1e`](https://github.com/withastro/astro/commit/f66053a1ea0a4e3bdb0b0df12bb1bf56e1ea2618) Thanks [@martrapp](https://github.com/martrapp)! - Only transition between pages where both have ViewTransitions enabled

- [#8443](https://github.com/withastro/astro/pull/8443) [`0fa483283`](https://github.com/withastro/astro/commit/0fa483283e54c94f173838cd558dc0dbdd11e699) Thanks [@the-dijkstra](https://github.com/the-dijkstra)! - Fix "Cannot read properties of null" error in CLI code

- Updated dependencies [[`f3f62a5a2`](https://github.com/withastro/astro/commit/f3f62a5a20f4881bb04f65f192df8e1ccf7fb601)]:
  - @astrojs/markdown-remark@3.1.0

## 3.0.10

### Patch Changes

- [#8437](https://github.com/withastro/astro/pull/8437) [`b3cf1b327`](https://github.com/withastro/astro/commit/b3cf1b32765c76cfc90e497a68280ad52f02cb1f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix imports of images with uppercased file extensions not working

- [#8440](https://github.com/withastro/astro/pull/8440) [`b92d066b7`](https://github.com/withastro/astro/commit/b92d066b737f64f08a9cf293bd07c9263ef8f32d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix issue where `renderToFinalDestination` would throw in internal Astro code

## 3.0.9

### Patch Changes

- [#8351](https://github.com/withastro/astro/pull/8351) [`7d95bd9ba`](https://github.com/withastro/astro/commit/7d95bd9baaf755239fd7d35e4813861b2dbccf42) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed a case where dynamic imports tried to preload inlined stylesheets.

- [#8353](https://github.com/withastro/astro/pull/8353) [`1947ef7a9`](https://github.com/withastro/astro/commit/1947ef7a99ce3d1d6ea797842edd31d5edffa5de) Thanks [@elevatebart](https://github.com/elevatebart)! - Astro will now skip asset optimization when there is a query in the import. Instead, it will let vite deal with it using plugins.

  ```vue
  <script>
  // This will not return an optimized asset
  import Component from './Component.vue?component';
  </script>
  ```

- [#8424](https://github.com/withastro/astro/pull/8424) [`61ad70fdc`](https://github.com/withastro/astro/commit/61ad70fdc52035964c43ecdb4cf7468f6c2b61e7) Thanks [@itsmatteomanf](https://github.com/itsmatteomanf)! - Fixes remote assets caching logic to not use expired assets

- [#8306](https://github.com/withastro/astro/pull/8306) [`d2f2a11cd`](https://github.com/withastro/astro/commit/d2f2a11cdb42b0de79be21c798eda8e7e7b2a277) Thanks [@jacobthesheep](https://github.com/jacobthesheep)! - Support detecting Bun when logging messages with package manager information.

- [#8414](https://github.com/withastro/astro/pull/8414) [`5126c6a40`](https://github.com/withastro/astro/commit/5126c6a40f88bff66ee5d3c3a21eea8c4a44ce7a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix missing type for `imageConfig` export from `astro:assets`

- [#8416](https://github.com/withastro/astro/pull/8416) [`48ff7855b`](https://github.com/withastro/astro/commit/48ff7855b238536a3df17cb29335c90029fc41a4) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Installing will no longer fail when Sharp can't be installed

- [#8418](https://github.com/withastro/astro/pull/8418) [`923a443cb`](https://github.com/withastro/astro/commit/923a443cb060a0e936a0e1cc87c0360232f77914) Thanks [@bluwy](https://github.com/bluwy)! - Fix markdown page HMR

- [#8332](https://github.com/withastro/astro/pull/8332) [`8935b3b46`](https://github.com/withastro/astro/commit/8935b3b4672d6c54c7b79e6c4575298f75eeb9f4) Thanks [@martrapp](https://github.com/martrapp)! - Fix scroll position when navigating back from page w/o ViewTransitions

## 3.0.8

### Patch Changes

- [#8388](https://github.com/withastro/astro/pull/8388) [`362491b8d`](https://github.com/withastro/astro/commit/362491b8da33317c9a1116fbd5a648184b9b3c7f) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Properly handle `BEFORE_HYDRATION_SCRIPT` generation, fixing MIME type error on hydration.

- [#8370](https://github.com/withastro/astro/pull/8370) [`06e7256b5`](https://github.com/withastro/astro/commit/06e7256b58682064cf7410f72658ce44507f639e) Thanks [@itsmatteomanf](https://github.com/itsmatteomanf)! - Removed extra curly brace.

## 3.0.7

### Patch Changes

- [#8366](https://github.com/withastro/astro/pull/8366) [`c5633434f`](https://github.com/withastro/astro/commit/c5633434f02cc477ee8da380e22efaccfa55d459) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `chunkFileNames` to avoid emitting invalid characters

- [#8367](https://github.com/withastro/astro/pull/8367) [`405ad9501`](https://github.com/withastro/astro/commit/405ad950173dadddc519cf1c2e7f2523bf5326a8) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `tsc` complaining about imports of `.astro` files in specific cases

- [#8357](https://github.com/withastro/astro/pull/8357) [`6b1e79814`](https://github.com/withastro/astro/commit/6b1e7981469d30aa4c3658487abed6ffea94797f) Thanks [@itsmatteomanf](https://github.com/itsmatteomanf)! - Added counter to show progress for assets image generation.
  Fixed small unit of measurement error.
- Updated dependencies [[`0ce0720c7`](https://github.com/withastro/astro/commit/0ce0720c7f2c7ba21dddfea0b75d1e9b39c6a274)]:
  - @astrojs/telemetry@3.0.1

## 3.0.6

### Patch Changes

- [#8276](https://github.com/withastro/astro/pull/8276) [`d3a6f9f83`](https://github.com/withastro/astro/commit/d3a6f9f836e35932a950e40ba69eff63d7db7eed) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Sanitize route params for leading and trailing slashes

- [#8339](https://github.com/withastro/astro/pull/8339) [`f21599671`](https://github.com/withastro/astro/commit/f21599671a90c3327307eb6d2f4d5c02e9137207) Thanks [@martrapp](https://github.com/martrapp)! - Respect the download attribute in links when using view transitions

## 3.0.5

### Patch Changes

- [#8327](https://github.com/withastro/astro/pull/8327) [`5f3a44aee`](https://github.com/withastro/astro/commit/5f3a44aeeff3c5f31a8063b6005abb90343a817e) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve `astro info` command formatting, allow users to copy info automatically

- [#8320](https://github.com/withastro/astro/pull/8320) [`b21038c19`](https://github.com/withastro/astro/commit/b21038c193fd30351235a1b241a4a0aaf4e692f2) Thanks [@ematipico](https://github.com/ematipico)! - Exclude redirects from split entry points

- [#8331](https://github.com/withastro/astro/pull/8331) [`7a894eec3`](https://github.com/withastro/astro/commit/7a894eec3e6d2670632ca8cdb592cf5649a22d3e) Thanks [@matthewp](https://github.com/matthewp)! - Prevent View Transition fallback from waiting on looping animations

- [#8231](https://github.com/withastro/astro/pull/8231) [`af41b03d0`](https://github.com/withastro/astro/commit/af41b03d05f8a561990de42ccc93663343da2c0d) Thanks [@justinbeaty](https://github.com/justinbeaty)! - Fixes scroll behavior when using View Transitions by enabling `manual` scroll restoration

## 3.0.4

### Patch Changes

- [#8324](https://github.com/withastro/astro/pull/8324) [`0752cf368`](https://github.com/withastro/astro/commit/0752cf3688eaac535ceda1ebcd22ccaf20b2171f) Thanks [@matthewp](https://github.com/matthewp)! - Prevent React hook call warnings when used with MDX

  When React and MDX are used in the same project, if the MDX integration is added before React, previously you'd get a warning about hook calls.

  This makes it so that the MDX integration's JSX renderer is last in order.

## 3.0.3

### Patch Changes

- [#8300](https://github.com/withastro/astro/pull/8300) [`d4a6ab733`](https://github.com/withastro/astro/commit/d4a6ab7339043042fd62dffd30ba078edae55f86) Thanks [@ematipico](https://github.com/ematipico)! - Correctly retrieve middleware when using it in SSR environments.

## 3.0.2

### Patch Changes

- [#8293](https://github.com/withastro/astro/pull/8293) [`d9bd7cf5c`](https://github.com/withastro/astro/commit/d9bd7cf5ce4086d9dd59e372ca25d4c4cfdb05f6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `tsc` errors inside `astro/components/index.ts`

## 3.0.1

### Patch Changes

- [#8290](https://github.com/withastro/astro/pull/8290) [`ef37f9e29`](https://github.com/withastro/astro/commit/ef37f9e290d0e61403261b2a2195f127dc031654) Thanks [@matthewp](https://github.com/matthewp)! - Remove "experimental" text from the image config options, for docs and editor etc. text displayed.

- [#8290](https://github.com/withastro/astro/pull/8290) [`ef37f9e29`](https://github.com/withastro/astro/commit/ef37f9e290d0e61403261b2a2195f127dc031654) Thanks [@matthewp](https://github.com/matthewp)! - Prevent astro check cache issues

  `astro check` hits cache issues in 3.0 causing it never to work on the first try.

- [#8283](https://github.com/withastro/astro/pull/8283) [`c32f52a62`](https://github.com/withastro/astro/commit/c32f52a6246a0f929238f7d47bfc870899729fb4) Thanks [@ematipico](https://github.com/ematipico)! - Add useful warning when deprecated options are still used.

## 3.0.0

### Major Changes

- [#8188](https://github.com/withastro/astro/pull/8188) [`d0679a666`](https://github.com/withastro/astro/commit/d0679a666f37da0fca396d42b9b32bbb25d29312) Thanks [@ematipico](https://github.com/ematipico)! - Remove support for Node 16. The lowest supported version by Astro and all integrations is now v18.14.1. As a reminder, Node 16 will be deprecated on the 11th September 2023.

- [#8188](https://github.com/withastro/astro/pull/8188) [`364d861bd`](https://github.com/withastro/astro/commit/364d861bd527b8511968e2837728148f090bedef) Thanks [@ematipico](https://github.com/ematipico)! - Removed automatic flattening of `getStaticPaths` result. `.flatMap` and `.flat` should now be used to ensure that you're returning a flat array.

- [#8113](https://github.com/withastro/astro/pull/8113) [`2484dc408`](https://github.com/withastro/astro/commit/2484dc4080e5cd84b9a53648a1de426d7c907be2) Thanks [@Princesseuh](https://github.com/Princesseuh)! - This import alias is no longer included by default with astro:assets. If you were using this alias with experimental assets, you must convert them to relative file paths, or create your own [import aliases](https://docs.astro.build/en/guides/aliases/).

  ```diff
  ---
  // src/pages/posts/post-1.astro
  - import rocket from '~/assets/rocket.png'
  + import rocket from '../../assets/rocket.png';
  ---
  ```

- [#8142](https://github.com/withastro/astro/pull/8142) [`81545197a`](https://github.com/withastro/astro/commit/81545197a32fd015d763fc386c8b67e0e08b7393) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes for the `class:list` directive

  - Previously, `class:list` would occasionally not be merged the `class` prop when passed to Astro components. Now, `class:list` is always converted to a `class` prop (as a string value).
  - Previously, `class:list` diverged from [`clsx`](https://github.com/lukeed/clsx) in a few edge cases. Now, `class:list` uses [`clsx`](https://github.com/lukeed/clsx) directly.
    - `class:list` used to deduplicate matching values, but it no longer does
    - `class:list` used to sort individual values, but it no longer does
    - `class:list` used to support `Set` and other iterables, but it no longer does

- [#8179](https://github.com/withastro/astro/pull/8179) [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7) Thanks [@matthewp](https://github.com/matthewp)! - Astro 3.0 Release Candidate

- [#8188](https://github.com/withastro/astro/pull/8188) [`80f1494cd`](https://github.com/withastro/astro/commit/80f1494cdaf72e58a420adb4f7c712d4089e1923) Thanks [@ematipico](https://github.com/ematipico)! - The `build.split` and `build.excludeMiddleware` configuration options are deprecated and have been replaced by options in the adapter config.

  If your config includes the `build.excludeMiddleware` option, replace it with `edgeMiddleware` in your adapter options:

  ```diff
  import { defineConfig } from "astro/config";
  import netlify from "@astrojs/netlify/functions";

  export default defineConfig({
       build: {
  -        excludeMiddleware: true
       },
       adapter: netlify({
  +        edgeMiddleware: true
       }),
  });
  ```

  If your config includes the `build.split` option, replace it with `functionPerRoute` in your adapter options:

  ```diff
  import { defineConfig } from "astro/config";
  import netlify from "@astrojs/netlify/functions";

  export default defineConfig({
       build: {
  -        split: true
       },
       adapter: netlify({
  +        functionPerRoute: true
       }),
  });
  ```

- [#8207](https://github.com/withastro/astro/pull/8207) [`e45f30293`](https://github.com/withastro/astro/commit/e45f3029340db718b6ed7e91b5d14f5cf14cd71d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Change the [View Transition built-in animation](https://docs.astro.build/en/guides/view-transitions/#built-in-animation-directives) options.

  The `transition:animate` value `morph` has been renamed to `initial`. Also, this is no longer the default animation.

  If no `transition:animate` directive is specified, your animations will now default to `fade`.

  Astro also supports a new `transition:animate` value, `none`. This value can be used on a page's `<html>` element to disable animated full-page transitions on an entire page.

- [#8188](https://github.com/withastro/astro/pull/8188) [`c0de7a7b0`](https://github.com/withastro/astro/commit/c0de7a7b0f042cd49cbea4f4ac1b2ab6f9fef644) Thanks [@ematipico](https://github.com/ematipico)! - Sharp is now the default image service used for `astro:assets`. If you would prefer to still use Squoosh, you can update your config with the following:

  ```ts
  import { defineConfig, squooshImageService } from 'astro/config';

  // https://astro.build/config
  export default defineConfig({
    image: {
      service: squooshImageService(),
    },
  });
  ```

  However, not only do we recommend using Sharp as it is faster and more reliable, it is also highly likely that the Squoosh service will be removed in a future release.

- [#8188](https://github.com/withastro/astro/pull/8188) [`3c3100851`](https://github.com/withastro/astro/commit/3c31008519ce68b5b1b1cb23b71fbe0a2d506882) Thanks [@ematipico](https://github.com/ematipico)! - Remove support for `Astro.__renderMarkdown` which is used by `@astrojs/markdown-component`.

  The `<Markdown />` component was deprecated in Astro v1 and is completely removed in v3. This integration must now be removed from your project.

  As an alternative, you can use community packages that provide a similar component like https://github.com/natemoo-re/astro-remote instead.

- [#8019](https://github.com/withastro/astro/pull/8019) [`34cb20021`](https://github.com/withastro/astro/commit/34cb2002161ba88df6bcb72fecfd12ed867c134b) Thanks [@bluwy](https://github.com/bluwy)! - Remove backwards-compatible kebab-case transform for camelCase CSS variable names passed to the `style` attribute. If you were relying on the kebab-case transform in your styles, make sure to use the camelCase version to prevent missing styles. For example:

  ```astro
  ---
  const myValue = 'red';
  ---

  <!-- input -->
  <div style={{ '--myValue': myValue }}></div>

  <!-- output (before) -->
  <div style="--my-value:var(--myValue);--myValue:red"></div>

  <!-- output (after) -->
  <div style="--myValue:red"></div>
  ```

  ```diff
  <style>
    div {
  -   color: var(--my-value);
  +   color: var(--myValue);
    }
  </style>
  ```

- [#8170](https://github.com/withastro/astro/pull/8170) [`be6bbd2c8`](https://github.com/withastro/astro/commit/be6bbd2c86b9bf5268e765bb937dda00ff15781a) Thanks [@bluwy](https://github.com/bluwy)! - Remove deprecated config option types, deprecated script/style attributes, and deprecated `image` export from `astro:content`

- [#8188](https://github.com/withastro/astro/pull/8188) [`7511a4980`](https://github.com/withastro/astro/commit/7511a4980fd36536464c317de33a5190427f430a) Thanks [@ematipico](https://github.com/ematipico)! - When using an adapter that supports neither Squoosh or Sharp, Astro will now automatically use an image service that does not support processing, but still provides the other benefits of `astro:assets` such as enforcing `alt`, no CLS etc to users

- [#7979](https://github.com/withastro/astro/pull/7979) [`dbc97b121`](https://github.com/withastro/astro/commit/dbc97b121f42583728f1cdfdbf14575fda943f5b) Thanks [@bluwy](https://github.com/bluwy)! - Export experimental `dev`, `build`, `preview`, and `sync` APIs from `astro`. These APIs allow you to run Astro's commands programmatically, and replaces the previous entry point that runs the Astro CLI.

  While these APIs are experimental, the inline config parameter is relatively stable without foreseeable changes. However, the returned results of these APIs are more likely to change in the future.

  ```ts
  import { dev, build, preview, sync, type AstroInlineConfig } from 'astro';

  // Inline Astro config object.
  // Provide a path to a configuration file to load or set options directly inline.
  const inlineConfig: AstroInlineConfig = {
    // Inline-specific options...
    configFile: './astro.config.mjs',
    logLevel: 'info',
    // Standard Astro config options...
    site: 'https://example.com',
  };

  // Start the Astro dev server
  const devServer = await dev(inlineConfig);
  await devServer.stop();

  // Build your Astro project
  await build(inlineConfig);

  // Preview your built project
  const previewServer = await preview(inlineConfig);
  await previewServer.stop();

  // Generate types for your Astro project
  await sync(inlineConfig);
  ```

- [#8188](https://github.com/withastro/astro/pull/8188) [`7d2f311d4`](https://github.com/withastro/astro/commit/7d2f311d428e3d1c8c13b9bf2a708d6435713fc2) Thanks [@ematipico](https://github.com/ematipico)! - Removed support for old syntax of the API routes.

- [#8085](https://github.com/withastro/astro/pull/8085) [`68efd4a8b`](https://github.com/withastro/astro/commit/68efd4a8b29f248397667801465b3152dc98e9a7) Thanks [@bluwy](https://github.com/bluwy)! - Remove exports for `astro/internal/*` and `astro/runtime/server/*` in favour of `astro/runtime/*`. Add new `astro/compiler-runtime` export for compiler-specific runtime code.

  These are exports for Astro's internal API and should not affect your project, but if you do use these entrypoints, you can migrate like below:

  ```diff
  - import 'astro/internal/index.js';
  + import 'astro/runtime/server/index.js';

  - import 'astro/server/index.js';
  + import 'astro/runtime/server/index.js';
  ```

  ```diff
  import { transform } from '@astrojs/compiler';

  const result = await transform(source, {
  - internalURL: 'astro/runtime/server/index.js',
  + internalURL: 'astro/compiler-runtime',
    // ...
  });
  ```

- [#7893](https://github.com/withastro/astro/pull/7893) [`7bd1b86f8`](https://github.com/withastro/astro/commit/7bd1b86f85c06fdde0a1ed9146d01bac69990671) Thanks [@ematipico](https://github.com/ematipico)! - Implements a new scope style strategy called `"attribute"`. When enabled, styles are applied using `data-*` attributes.

  The **default** value of `scopedStyleStrategy` is `"attribute"`.

  If you want to use the previous behaviour, you have to use the `"where"` option:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  +    scopedStyleStrategy: 'where',
  });
  ```

- [#7924](https://github.com/withastro/astro/pull/7924) [`519a1c4e8`](https://github.com/withastro/astro/commit/519a1c4e8407c7abcb8d879b67a9f4b960652cae) Thanks [@matthewp](https://github.com/matthewp)! - Astro's JSX handling has been refactored with better support for each framework.

  Previously, Astro automatically scanned your components to determine which framework-specific transformations should be used. In practice, supporting advanced features like Fast Refresh with this approach proved difficult.

  Now, Astro determines which framework to use with `include` and `exclude` config options where you can specify files and folders on a per-framework basis. When using multiple JSX frameworks in the same project, users should manually control which files belong to each framework using the `include` and `exclude` options.

  ```js
  export default defineConfig({
    // The `include` config is only needed in projects that use multiple JSX frameworks;
    // if only using one no extra config is needed.
    integrations: [
      preact({
        include: ['**/preact/*'],
      }),
      react({
        include: ['**/react/*'],
      }),
      solid({
        include: ['**/solid/*'],
      }),
    ],
  });
  ```

- [#8030](https://github.com/withastro/astro/pull/8030) [`5208a3c8f`](https://github.com/withastro/astro/commit/5208a3c8fefcec7694857fb344af351f4631fc34) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Removed duplicate `astro/dist/jsx` export. Please use the `astro/jsx` export instead

- [#8188](https://github.com/withastro/astro/pull/8188) [`84af8ed9d`](https://github.com/withastro/astro/commit/84af8ed9d1e6401c6ebc9c60fe8cddb44d5044b0) Thanks [@ematipico](https://github.com/ematipico)! - Remove MDX plugin re-ordering hack

- [#8180](https://github.com/withastro/astro/pull/8180) [`f003e7364`](https://github.com/withastro/astro/commit/f003e7364317cafdb8589913b26b28e928dd07c9) Thanks [@ematipico](https://github.com/ematipico)! - The scoped hash created by the Astro compiler is now **lowercase**.

- [#7878](https://github.com/withastro/astro/pull/7878) [`0f637c71e`](https://github.com/withastro/astro/commit/0f637c71e511cb4c51712128d217a26c8eee4d40) Thanks [@bluwy](https://github.com/bluwy)! - The value of `import.meta.env.BASE_URL`, which is derived from the `base` option, will no longer have a trailing slash added by default or when `trailingSlash: "ignore"` is set. The existing behavior of `base` in combination with `trailingSlash: "always"` or `trailingSlash: "never"` is unchanged.

  If your `base` already has a trailing slash, no change is needed.

  If your `base` does not have a trailing slash, add one to preserve the previous behaviour:

  ```diff
  // astro.config.mjs
  - base: 'my-base',
  + base: 'my-base/',
  ```

- [#8118](https://github.com/withastro/astro/pull/8118) [`8a5b0c1f3`](https://github.com/withastro/astro/commit/8a5b0c1f3a4be6bb62db66ec70144109ff5b4c59) Thanks [@lilnasy](https://github.com/lilnasy)! - Astro is smarter about CSS! Small stylesheets are now inlined by default, and no longer incur the cost of additional requests to your server. Your visitors will have to wait less before they see your pages, especially those in remote locations or in a subway.

  This may not be news to you if you had opted-in via the `build.inlineStylesheets` configuration. Stabilized in Astro 2.6 and set to "auto" by default for Starlight, this configuration allows you to reduce the number of requests for stylesheets by inlining them into <style> tags. The new default is "auto", which selects assets smaller than 4kB and includes them in the initial response.

  To go back to the previous default behavior, change `build.inlineStylesheets` to "never".

  ```ts
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    build: {
      inlineStylesheets: 'never',
    },
  });
  ```

- [#8188](https://github.com/withastro/astro/pull/8188) [`148e61d24`](https://github.com/withastro/astro/commit/148e61d2492456811f8a3c8daaab1c3429a2ffdc) Thanks [@ematipico](https://github.com/ematipico)! - Reduced the amount of polyfills provided by Astro. Astro will no longer provide (no-op) polyfills for several web apis such as HTMLElement, Image or Document. If you need access to those APIs on the server, we recommend using more proper polyfills available on npm.

- [#8169](https://github.com/withastro/astro/pull/8169) [`e79e3779d`](https://github.com/withastro/astro/commit/e79e3779df0ad35253abcdb931d622847d9adb12) Thanks [@bluwy](https://github.com/bluwy)! - Remove pre-shiki v0.14 theme names for compatibility. Please rename to the new theme names to migrate:

  - `material-darker` -> `material-theme-darker`
  - `material-default` -> `material-theme`
  - `material-lighter` -> `material-theme-lighter`
  - `material-ocean` -> `material-theme-ocean`
  - `material-palenight` -> `material-theme-palenight`

- [#8188](https://github.com/withastro/astro/pull/8188) [`96beb883a`](https://github.com/withastro/astro/commit/96beb883ad87f8bbf5b2f57e14a743763d2a6f58) Thanks [@ematipico](https://github.com/ematipico)! - Update `tsconfig.json` presets with `moduleResolution: 'bundler'` and other new options from TypeScript 5.0. Astro now assumes that you use TypeScript 5.0 (March 2023), or that your editor includes it, ex: VS Code 1.77

- [#8188](https://github.com/withastro/astro/pull/8188) [`997a0db8a`](https://github.com/withastro/astro/commit/997a0db8a4e3851edd69384cf5eadbb969e1d547) Thanks [@ematipico](https://github.com/ematipico)! - The `astro check` command now requires an external package `@astrojs/check` and an install of `typescript` in your project. This was done in order to make the main `astro` package smaller and give more flexibility to users in regard to the version of TypeScript they use.

- [#8188](https://github.com/withastro/astro/pull/8188) [`80f1494cd`](https://github.com/withastro/astro/commit/80f1494cdaf72e58a420adb4f7c712d4089e1923) Thanks [@ematipico](https://github.com/ematipico)! - The `build.split` and `build.excludeMiddleware` configuration options are deprecated and have been replaced by options in the adapter config.

  If your config includes the `build.excludeMiddleware` option, replace it with `edgeMiddleware` in your adapter options:

  ```diff
  import { defineConfig } from "astro/config";
  import vercel from "@astrojs/vercel/serverless";

  export default defineConfig({
       build: {
  -        excludeMiddleware: true
       },
       adapter: vercel({
  +        edgeMiddleware: true
       }),
  });
  ```

  If your config includes the `build.split` option, replace it with `functionPerRoute` in your adapter options:

  ```diff
  import { defineConfig } from "astro/config";
  import vercel from "@astrojs/vercel/serverless";

  export default defineConfig({
       build: {
  -        split: true
       },
       adapter: vercel({
  +        functionPerRoute: true
       }),
  });
  ```

- [#8188](https://github.com/withastro/astro/pull/8188) [`0f0625504`](https://github.com/withastro/astro/commit/0f0625504145f18cba7dc6cf20291cb2abddc5a9) Thanks [@ematipico](https://github.com/ematipico)! - Lowercase names for endpoint functions are now deprecated.

  Rename functions to their uppercase equivalent:

  ```diff
  - export function get() {
  + export function GET() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }

  - export function post() {
  + export function POST() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }

  - export function put() {
  + export function PUT() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }

  - export function all() {
  + export function ALL() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }

  // you can use the whole word "DELETE"
  - export function del() {
  + export function DELETE() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }
  ```

- [#8188](https://github.com/withastro/astro/pull/8188) [`e1ae56e72`](https://github.com/withastro/astro/commit/e1ae56e724d0f83db1230359e06cd6bc26f5fa26) Thanks [@ematipico](https://github.com/ematipico)! - Astro.cookies.get(key) returns undefined if cookie doesn't exist

  With this change, Astro.cookies.get(key) no longer always returns a `AstroCookie` object. Instead it now returns `undefined` if the cookie does not exist.

  You should update your code if you assume that all calls to `get()` return a value. When using with `has()` you still need to assert the value, like so:

  ```astro
  ---
  if (Astro.cookies.has(id)) {
    const id = Astro.cookies.get(id)!;
  }
  ---
  ```

- [#8188](https://github.com/withastro/astro/pull/8188) [`f32d093a2`](https://github.com/withastro/astro/commit/f32d093a280faafff024228c12bb438156ec34d7) Thanks [@ematipico](https://github.com/ematipico)! - The property `compressHTML` is now `true` by default. Setting this value to `true` is no longer required.

  If you do not want to minify your HTML output, you must set this value to `false` in `astro.config.mjs`.

  ```diff
  import {defineConfig} from "astro/config";
  export default defineConfig({
  +  compressHTML: false
  })
  ```

- [#8188](https://github.com/withastro/astro/pull/8188) [`f01eb585e`](https://github.com/withastro/astro/commit/f01eb585e7c972d940761309b1595f682b6922d2) Thanks [@ematipico](https://github.com/ematipico)! - Astro's default port when running the dev or preview server is now `4321`.

  This will reduce conflicts with ports used by other tools.

- [#7921](https://github.com/withastro/astro/pull/7921) [`b76c166bd`](https://github.com/withastro/astro/commit/b76c166bdd8e28683f62806aef968d1e0c3b06d9) Thanks [@Princesseuh](https://github.com/Princesseuh)! - `astro:assets` is now enabled by default. If you were previously using the `experimental.assets` flag, please remove it from your config. Also note that the previous `@astrojs/image` integration is incompatible, and must be removed.

  This also brings two important changes to using images in Astro:

  - New ESM shape: importing an image will now return an object with different properties describing the image such as its path, format and dimensions. This is a breaking change and may require you to update your existing images.
  - In Markdown, MDX, and Markdoc, the `![]()` syntax will now resolve relative images located anywhere in your project in addition to remote images and images stored in the `public/` folder. This notably unlocks storing images next to your content.

  Please see our existing [Assets page in Docs](https://docs.astro.build/en/guides/assets/) for more information about using `astro:assets`.

- [#8188](https://github.com/withastro/astro/pull/8188) [`32669cd47`](https://github.com/withastro/astro/commit/32669cd47555e9c7433c3998a2b6e624dfb2d8e9) Thanks [@ematipico](https://github.com/ematipico)! - Remove MDX special `components` export handling

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

- [#8218](https://github.com/withastro/astro/pull/8218) [`44f7a2872`](https://github.com/withastro/astro/commit/44f7a28728c56c04ac377b6e917329f324874043) Thanks [@matthewp](https://github.com/matthewp)! - View Transitions unflagged

  View Transition support in Astro is now unflagged. For those who have used the experimental feature you can remove the flag in your Astro config:

  ```diff
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    viewTransitions: true,
  -  }
  })
  ```

  After removing this flag, please also consult the specific [upgrade to v3.0 advice](https://docs.astro.build/en/guides/view-transitions/#upgrade-to-v30-from-v2x) as some API features have changed and you may have breaking changes with your existing view transitions.

  See the [View Transitions guide](https://docs.astro.build/en/guides/view-transitions/) to learn how to use the API.

- [#8101](https://github.com/withastro/astro/pull/8101) [`ea7ff5177`](https://github.com/withastro/astro/commit/ea7ff5177dbcd7b2508cb1eef1b22b8ee1f47079) Thanks [@matthewp](https://github.com/matthewp)! - `astro:`namespace aliases for middleware and components

  This adds aliases of `astro:middleware` and `astro:components` for the middleware and components modules. This is to make our documentation consistent between are various modules, where some are virtual modules and others are not. Going forward new built-in modules will use this namespace.

- [#8188](https://github.com/withastro/astro/pull/8188) [`036388f66`](https://github.com/withastro/astro/commit/036388f66dab68ad54b895ed86f9176958dd83c8) Thanks [@ematipico](https://github.com/ematipico)! - Integrations can now log messages using Astro’s built-in logger.

  The logger is available to all hooks as an additional parameter:

  ```ts
  import { AstroIntegration } from './astro';

  // integration.js
  export function myIntegration(): AstroIntegration {
    return {
      name: 'my-integration',
      hooks: {
        'astro:config:done': ({ logger }) => {
          logger.info('Configure integration...');
        },
      },
    };
  }
  ```

- [#8181](https://github.com/withastro/astro/pull/8181) [`a8f35777e`](https://github.com/withastro/astro/commit/a8f35777e7e322068a4e2f520c2c9e43ade19e58) Thanks [@matthewp](https://github.com/matthewp)! - Finalize View Transition event names

- [#8012](https://github.com/withastro/astro/pull/8012) [`866ed4098`](https://github.com/withastro/astro/commit/866ed4098edffb052239cdb26e076cf8db61b1d9) Thanks [@ematipico](https://github.com/ematipico)! - Add a new `astro/errors` module. Developers can import `AstroUserError`, and provide a `message` and an optional `hint`

### Patch Changes

- [#8139](https://github.com/withastro/astro/pull/8139) [`db39206cb`](https://github.com/withastro/astro/commit/db39206cbb85b034859ac416179f141184bb2bff) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Use `undici` for File changeset for Node 16 compatibility

- [#8188](https://github.com/withastro/astro/pull/8188) [`adf9fccfd`](https://github.com/withastro/astro/commit/adf9fccfdda107c2224558f1c2e6a77847ac0a8a) Thanks [@ematipico](https://github.com/ematipico)! - Do not throw Error when users pass an object with a "type" property

- [#8234](https://github.com/withastro/astro/pull/8234) [`0c7b42dc6`](https://github.com/withastro/astro/commit/0c7b42dc6780e687e416137539f55a3a427d1d10) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update telemetry notice

- [#8251](https://github.com/withastro/astro/pull/8251) [`46c4c0e05`](https://github.com/withastro/astro/commit/46c4c0e053f830585b9ef229ce1c259df00a80f8) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a link to the error reference in the CLI when an error occurs

- [#8128](https://github.com/withastro/astro/pull/8128) [`c2c71d90c`](https://github.com/withastro/astro/commit/c2c71d90c264a2524f99e0373ab59015f23ad4b1) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update error message when Sharp couldn't be found (tends to happen on pnpm notably)

- [#7998](https://github.com/withastro/astro/pull/7998) [`65c354969`](https://github.com/withastro/astro/commit/65c354969e6fe0ef6d622e8f4c545e2f717ce8c6) Thanks [@bluwy](https://github.com/bluwy)! - Call `astro sync` once before calling `astro check`

- [#8232](https://github.com/withastro/astro/pull/8232) [`a824863ab`](https://github.com/withastro/astro/commit/a824863ab1c451f4068eac54f28dd240573e1cba) Thanks [@matthewp](https://github.com/matthewp)! - Use .js to import logger

- [#8253](https://github.com/withastro/astro/pull/8253) [`1048aca55`](https://github.com/withastro/astro/commit/1048aca550769415e528016e42b358ffbfd44b61) Thanks [@matthewp](https://github.com/matthewp)! - Fix, lazily initialize ResponseWithEncoding

- [#8263](https://github.com/withastro/astro/pull/8263) [`9e021a91c`](https://github.com/withastro/astro/commit/9e021a91c57d10809f588dd47968fc0e7f8b4d5c) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a type param to AstroGlobal to type params. This will eventually be used automatically by our tooling to provide typing and completions for `Astro.params`

- [#8217](https://github.com/withastro/astro/pull/8217) [`c37632a20`](https://github.com/withastro/astro/commit/c37632a20d06164fb97a4c2fc48df6d960398832) Thanks [@martrapp](https://github.com/martrapp)! - Specify `data-astro-reload` (no value) on an anchor element to force the browser to ignore view transitions and fall back to default loading.

  This is helpful when navigating to documents that have different content-types, e.g. application/pdf, where you want to use the build in viewer of the browser.
  Example: `<a href='/my.pdf' data-astro-reload>...</a>`

- [#8156](https://github.com/withastro/astro/pull/8156) [`acf652fc1`](https://github.com/withastro/astro/commit/acf652fc1d5db166231e87e22d0d50444f5556d8) Thanks [@kurtextrem](https://github.com/kurtextrem)! - The scrollend mechanism is a better way to record the scroll position compared to throttling, so we now use it whenever a browser supports it.

- [#8188](https://github.com/withastro/astro/pull/8188) [`42785c7b7`](https://github.com/withastro/astro/commit/42785c7b784b151e6d582570e5d74482129e8eb8) Thanks [@ematipico](https://github.com/ematipico)! - Improve fidelity of time stats when running `astro build`

- [#8266](https://github.com/withastro/astro/pull/8266) [`8450379db`](https://github.com/withastro/astro/commit/8450379db854fb1eaa9f38f21d65db240bc616cd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `image.service` requiring to be set manually when `image.domains` or `image.remotePatterns` was assigned a value

- [#8078](https://github.com/withastro/astro/pull/8078) [`2540feedb`](https://github.com/withastro/astro/commit/2540feedb06785d5a20eecc3668849f147d778d4) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Reimplement https://github.com/withastro/astro/pull/7509 to correctly emit pre-rendered pages now that `build.split` is deprecated and this configuration has been moved to `functionPerRoute` inside the adapter.

- [#8264](https://github.com/withastro/astro/pull/8264) [`1f58a7a1b`](https://github.com/withastro/astro/commit/1f58a7a1bea6888868b689dac94801d554319b02) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fire `astro:unmount` event when island is disconnected

- [#8188](https://github.com/withastro/astro/pull/8188) [`2ae9d37f0`](https://github.com/withastro/astro/commit/2ae9d37f0a9cb21ab288d3c30aecb6d84db87788) Thanks [@ematipico](https://github.com/ematipico)! - Open to configured `base` when `astro dev --open` runs

- [#8188](https://github.com/withastro/astro/pull/8188) [`70f34f5a3`](https://github.com/withastro/astro/commit/70f34f5a355f42526ee9e5355f3de8e510002ea2) Thanks [@ematipico](https://github.com/ematipico)! - Remove StreamingCompatibleResponse polyfill

- [#8229](https://github.com/withastro/astro/pull/8229) [`ffc9e2d3d`](https://github.com/withastro/astro/commit/ffc9e2d3de46049bf3d82140ef018f524fb03187) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Paginate will now return exact types instead of a naive Record

- [#8099](https://github.com/withastro/astro/pull/8099) [`732111cdc`](https://github.com/withastro/astro/commit/732111cdce441639db31f40f621df48442d00969) Thanks [@bluwy](https://github.com/bluwy)! - Deprecate the `markdown.drafts` configuration option.

  If you'd like to create draft pages that are visible in dev but not in production, you can [migrate to content collections](https://docs.astro.build/en/guides/content-collections/#migrating-from-file-based-routing) and [manually filter out pages](https://docs.astro.build/en/guides/content-collections/#filtering-collection-queries) with the `draft: true` frontmatter property instead.

- [#8188](https://github.com/withastro/astro/pull/8188) [`33b8910cf`](https://github.com/withastro/astro/commit/33b8910cfdce5713891c50a84a0a8fe926311710) Thanks [@ematipico](https://github.com/ematipico)! - On back navigation only animate view transitions that were animated going forward.

- [#8196](https://github.com/withastro/astro/pull/8196) [`632579dc2`](https://github.com/withastro/astro/commit/632579dc2094cc342929261c89e689f0dd358284) Thanks [@bluwy](https://github.com/bluwy)! - Prevent bundling sharp as it errors in runtime

- [#8237](https://github.com/withastro/astro/pull/8237) [`3674584e0`](https://github.com/withastro/astro/commit/3674584e02b161a698b429ceb66723918fdc56ac) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `astro check` not finding the `@astrojs/check` package

- [#8258](https://github.com/withastro/astro/pull/8258) [`1db4e92c1`](https://github.com/withastro/astro/commit/1db4e92c12ed73681217f5cefd39f2f47542f961) Thanks [@matthewp](https://github.com/matthewp)! - Allow fallback animations on html element

- [#8270](https://github.com/withastro/astro/pull/8270) [`e7f872e91`](https://github.com/withastro/astro/commit/e7f872e91e852b901cf221a5151077dec64305bf) Thanks [@matthewp](https://github.com/matthewp)! - Prevent ViewTransition script from being added by mistake

- [#8271](https://github.com/withastro/astro/pull/8271) [`16f09dfff`](https://github.com/withastro/astro/commit/16f09dfff7722fda99dd0412e3006a7a39c80829) Thanks [@matthewp](https://github.com/matthewp)! - Fix video persistence regression

- [#8072](https://github.com/withastro/astro/pull/8072) [`4477bb41c`](https://github.com/withastro/astro/commit/4477bb41c8ed688785c545731ef5b184b629f4e5) Thanks [@matthewp](https://github.com/matthewp)! - Update Astro types to reflect that compress defaults to true

- [#8214](https://github.com/withastro/astro/pull/8214) [`55c10d1d5`](https://github.com/withastro/astro/commit/55c10d1d564e805efc3c1a7c48e0d9a1cdf0c7ed) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Automatically update user's env.d.ts with the proper types to help out migrating away from assets being experimental

- [#8130](https://github.com/withastro/astro/pull/8130) [`3e834293d`](https://github.com/withastro/astro/commit/3e834293d47ab2761a7aa013916e8371871efb7f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add some polyfills for Stackblitz until they support Node 18. Running Astro on Node 16 is still not officially supported, however.

- [#8188](https://github.com/withastro/astro/pull/8188) [`a87cbe400`](https://github.com/withastro/astro/commit/a87cbe400314341d5f72abf86ea264e6b47c091f) Thanks [@ematipico](https://github.com/ematipico)! - fix: reinsert attribute to specify direction of ViewTransition (forward / back)

- [#8132](https://github.com/withastro/astro/pull/8132) [`767eb6866`](https://github.com/withastro/astro/commit/767eb68666eb777965baa0d6ade20bbafecf95bf) Thanks [@bluwy](https://github.com/bluwy)! - Deprecate returning simple objects from endpoints. Endpoints should only return a `Response`.

  To return a result with a custom encoding not supported by a `Response`, you can use the `ResponseWithEncoding` utility class instead.

  Before:

  ```ts
  export function GET() {
    return {
      body: '...',
      encoding: 'binary',
    };
  }
  ```

  After:

  ```ts
  export function GET({ ResponseWithEncoding }) {
    return new ResponseWithEncoding('...', undefined, 'binary');
  }
  ```

- Updated dependencies [[`d0679a666`](https://github.com/withastro/astro/commit/d0679a666f37da0fca396d42b9b32bbb25d29312), [`2aa6d8ace`](https://github.com/withastro/astro/commit/2aa6d8ace398a41c2dec5473521d758816b08191), [`0c7b42dc6`](https://github.com/withastro/astro/commit/0c7b42dc6780e687e416137539f55a3a427d1d10), [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7), [`e79e3779d`](https://github.com/withastro/astro/commit/e79e3779df0ad35253abcdb931d622847d9adb12), [`3e834293d`](https://github.com/withastro/astro/commit/3e834293d47ab2761a7aa013916e8371871efb7f), [`b675acb2a`](https://github.com/withastro/astro/commit/b675acb2aa820448e9c0d363339a37fbac873215)]:
  - @astrojs/telemetry@3.0.0
  - @astrojs/internal-helpers@0.2.0
  - @astrojs/markdown-remark@3.0.0

## 3.0.0-rc.11

### Patch Changes

- [#8271](https://github.com/withastro/astro/pull/8271) [`16f09dfff`](https://github.com/withastro/astro/commit/16f09dfff7722fda99dd0412e3006a7a39c80829) Thanks [@matthewp](https://github.com/matthewp)! - Fix video persistence regression

## 3.0.0-rc.10

### Patch Changes

- [#8266](https://github.com/withastro/astro/pull/8266) [`8450379db`](https://github.com/withastro/astro/commit/8450379db854fb1eaa9f38f21d65db240bc616cd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `image.service` requiring to be set manually when `image.domains` or `image.remotePatterns` was assigned a value

- [#8270](https://github.com/withastro/astro/pull/8270) [`e7f872e91`](https://github.com/withastro/astro/commit/e7f872e91e852b901cf221a5151077dec64305bf) Thanks [@matthewp](https://github.com/matthewp)! - Prevent ViewTransition script from being added by mistake

## 3.0.0-rc.9

### Patch Changes

- [#8234](https://github.com/withastro/astro/pull/8234) [`0c7b42dc6`](https://github.com/withastro/astro/commit/0c7b42dc6780e687e416137539f55a3a427d1d10) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update telemetry notice

- [#8263](https://github.com/withastro/astro/pull/8263) [`9e021a91c`](https://github.com/withastro/astro/commit/9e021a91c57d10809f588dd47968fc0e7f8b4d5c) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a type param to AstroGlobal to type params. This will eventually be used automatically by our tooling to provide typing and completions for `Astro.params`

- [#8264](https://github.com/withastro/astro/pull/8264) [`1f58a7a1b`](https://github.com/withastro/astro/commit/1f58a7a1bea6888868b689dac94801d554319b02) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fire `astro:unmount` event when island is disconnected

- [#8258](https://github.com/withastro/astro/pull/8258) [`1db4e92c1`](https://github.com/withastro/astro/commit/1db4e92c12ed73681217f5cefd39f2f47542f961) Thanks [@matthewp](https://github.com/matthewp)! - Allow fallback animations on html element

- Updated dependencies [[`0c7b42dc6`](https://github.com/withastro/astro/commit/0c7b42dc6780e687e416137539f55a3a427d1d10)]:
  - @astrojs/telemetry@3.0.0-rc.4

## 3.0.0-rc.8

### Patch Changes

- [#8251](https://github.com/withastro/astro/pull/8251) [`46c4c0e05`](https://github.com/withastro/astro/commit/46c4c0e053f830585b9ef229ce1c259df00a80f8) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a link to the error reference in the CLI when an error occurs

- [#8253](https://github.com/withastro/astro/pull/8253) [`1048aca55`](https://github.com/withastro/astro/commit/1048aca550769415e528016e42b358ffbfd44b61) Thanks [@matthewp](https://github.com/matthewp)! - Fix, lazily initialize ResponseWithEncoding

- [#8229](https://github.com/withastro/astro/pull/8229) [`ffc9e2d3d`](https://github.com/withastro/astro/commit/ffc9e2d3de46049bf3d82140ef018f524fb03187) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Paginate will now return exact types instead of a naive Record

- [#8237](https://github.com/withastro/astro/pull/8237) [`3674584e0`](https://github.com/withastro/astro/commit/3674584e02b161a698b429ceb66723918fdc56ac) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `astro check` not finding the `@astrojs/check` package

## 3.0.0-rc.7

### Patch Changes

- [#8232](https://github.com/withastro/astro/pull/8232) [`a824863ab`](https://github.com/withastro/astro/commit/a824863ab1c451f4068eac54f28dd240573e1cba) Thanks [@matthewp](https://github.com/matthewp)! - Use .js to import logger

## 3.0.0-rc.6

### Major Changes

- [#8207](https://github.com/withastro/astro/pull/8207) [`e45f30293`](https://github.com/withastro/astro/commit/e45f3029340db718b6ed7e91b5d14f5cf14cd71d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Change the [View Transition built-in animation](https://docs.astro.build/en/guides/view-transitions/#built-in-animation-directives) options.

  The `transition:animate` value `morph` has been renamed to `initial`. Also, this is no longer the default animation.

  If no `transition:animate` directive is specified, your animations will now default to `fade`.

  Astro also supports a new `transition:animate` value, `none`. This value can be used on a page's `<html>` element to disable animated full-page transitions on an entire page.

### Minor Changes

- [#8218](https://github.com/withastro/astro/pull/8218) [`44f7a2872`](https://github.com/withastro/astro/commit/44f7a28728c56c04ac377b6e917329f324874043) Thanks [@matthewp](https://github.com/matthewp)! - View Transitions unflagged

  View Transition support in Astro is now unflagged. For those who have used the experimental feature you can remove the flag in your Astro config:

  ```diff
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    viewTransitions: true,
  -  }
  })
  ```

  After removing this flag, please also consult the specific [upgrade to v3.0 advice](https://docs.astro.build/en/guides/view-transitions/#upgrade-to-v30-from-v2x) as some API features have changed and you may have breaking changes with your existing view transitions.

  See the [View Transitions guide](https://docs.astro.build/en/guides/view-transitions/) to learn how to use the API.

- [#8181](https://github.com/withastro/astro/pull/8181) [`a8f35777e`](https://github.com/withastro/astro/commit/a8f35777e7e322068a4e2f520c2c9e43ade19e58) Thanks [@matthewp](https://github.com/matthewp)! - Finalize View Transition event names

### Patch Changes

- [#8217](https://github.com/withastro/astro/pull/8217) [`c37632a20`](https://github.com/withastro/astro/commit/c37632a20d06164fb97a4c2fc48df6d960398832) Thanks [@martrapp](https://github.com/martrapp)! - Specify `data-astro-reload` (no value) on an anchor element to force the browser to ignore view transitions and fall back to default loading.

  This is helpful when navigating to documents that have different content-types, e.g. application/pdf, where you want to use the build in viewer of the browser.
  Example: `<a href='/my.pdf' data-astro-reload>...</a>`

- [#8156](https://github.com/withastro/astro/pull/8156) [`acf652fc1`](https://github.com/withastro/astro/commit/acf652fc1d5db166231e87e22d0d50444f5556d8) Thanks [@kurtextrem](https://github.com/kurtextrem)! - The scrollend mechanism is a better way to record the scroll position compared to throttling, so we now use it whenever a browser supports it.

- [#8196](https://github.com/withastro/astro/pull/8196) [`632579dc2`](https://github.com/withastro/astro/commit/632579dc2094cc342929261c89e689f0dd358284) Thanks [@bluwy](https://github.com/bluwy)! - Prevent bundling sharp as it errors in runtime

- [#8214](https://github.com/withastro/astro/pull/8214) [`55c10d1d5`](https://github.com/withastro/astro/commit/55c10d1d564e805efc3c1a7c48e0d9a1cdf0c7ed) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Automatically update user's env.d.ts with the proper types to help out migrating away from assets being experimental

## 3.0.0-rc.5

### Major Changes

- [#8142](https://github.com/withastro/astro/pull/8142) [`81545197a`](https://github.com/withastro/astro/commit/81545197a32fd015d763fc386c8b67e0e08b7393) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes for the `class:list` directive

  - Previously, `class:list` would occasionally not be merged the `class` prop when passed to Astro components. Now, `class:list` is always converted to a `class` prop (as a string value).
  - Previously, `class:list` diverged from [`clsx`](https://github.com/lukeed/clsx) in a few edge cases. Now, `class:list` uses [`clsx`](https://github.com/lukeed/clsx) directly.
    - `class:list` used to deduplicate matching values, but it no longer does
    - `class:list` used to sort individual values, but it no longer does
    - `class:list` used to support `Set` and other iterables, but it no longer does

- [#8179](https://github.com/withastro/astro/pull/8179) [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7) Thanks [@matthewp](https://github.com/matthewp)! - Astro 3.0 Release Candidate

- [#8170](https://github.com/withastro/astro/pull/8170) [`be6bbd2c8`](https://github.com/withastro/astro/commit/be6bbd2c86b9bf5268e765bb937dda00ff15781a) Thanks [@bluwy](https://github.com/bluwy)! - Remove deprecated config option types, deprecated script/style attributes, and deprecated `image` export from `astro:content`

- [#8180](https://github.com/withastro/astro/pull/8180) [`f003e7364`](https://github.com/withastro/astro/commit/f003e7364317cafdb8589913b26b28e928dd07c9) Thanks [@ematipico](https://github.com/ematipico)! - The scoped hash created by the Astro compiler is now **lowercase**.

- [#8169](https://github.com/withastro/astro/pull/8169) [`e79e3779d`](https://github.com/withastro/astro/commit/e79e3779df0ad35253abcdb931d622847d9adb12) Thanks [@bluwy](https://github.com/bluwy)! - Remove pre-shiki v0.14 theme names for compatibility. Please rename to the new theme names to migrate:

  - `material-darker` -> `material-theme-darker`
  - `material-default` -> `material-theme`
  - `material-lighter` -> `material-theme-lighter`
  - `material-ocean` -> `material-theme-ocean`
  - `material-palenight` -> `material-theme-palenight`

### Patch Changes

- [#8147](https://github.com/withastro/astro/pull/8147) [`adf9fccfd`](https://github.com/withastro/astro/commit/adf9fccfdda107c2224558f1c2e6a77847ac0a8a) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Do not throw Error when users pass an object with a "type" property

- [#8152](https://github.com/withastro/astro/pull/8152) [`582132328`](https://github.com/withastro/astro/commit/5821323285646aee7ff9194a505f708028e4db57) Thanks [@andremralves](https://github.com/andremralves)! - Displays a new config error if `outDir` is placed within `publicDir`.

- [#8147](https://github.com/withastro/astro/pull/8147) [`42785c7b7`](https://github.com/withastro/astro/commit/42785c7b784b151e6d582570e5d74482129e8eb8) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Improve fidelity of time stats when running `astro build`

- [#8171](https://github.com/withastro/astro/pull/8171) [`95120efbe`](https://github.com/withastro/astro/commit/95120efbe817163663492181cbeb225849354493) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix missing type for `imageConfig` export from `astro:assets`

- [#8147](https://github.com/withastro/astro/pull/8147) [`2ae9d37f0`](https://github.com/withastro/astro/commit/2ae9d37f0a9cb21ab288d3c30aecb6d84db87788) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Open to configured `base` when `astro dev --open` runs

- [#8099](https://github.com/withastro/astro/pull/8099) [`732111cdc`](https://github.com/withastro/astro/commit/732111cdce441639db31f40f621df48442d00969) Thanks [@bluwy](https://github.com/bluwy)! - Deprecate the `markdown.drafts` configuration option.

  If you'd like to create draft pages that are visible in dev but not in production, you can [migrate to content collections](https://docs.astro.build/en/guides/content-collections/#migrating-from-file-based-routing) and [manually filter out pages](https://docs.astro.build/en/guides/content-collections/#filtering-collection-queries) with the `draft: true` frontmatter property instead.

- [#8147](https://github.com/withastro/astro/pull/8147) [`33b8910cf`](https://github.com/withastro/astro/commit/33b8910cfdce5713891c50a84a0a8fe926311710) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - On back navigation only animate view transitions that were animated going forward.

- [#8163](https://github.com/withastro/astro/pull/8163) [`179796405`](https://github.com/withastro/astro/commit/179796405e053b559d83f84507e5a465861a029a) Thanks [@delucis](https://github.com/delucis)! - Make typing of `defineCollection` more permissive to support advanced union and intersection types

- [#8147](https://github.com/withastro/astro/pull/8147) [`a87cbe400`](https://github.com/withastro/astro/commit/a87cbe400314341d5f72abf86ea264e6b47c091f) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - fix: reinsert attribute to specify direction of ViewTransition (forward / back)

- [#8132](https://github.com/withastro/astro/pull/8132) [`767eb6866`](https://github.com/withastro/astro/commit/767eb68666eb777965baa0d6ade20bbafecf95bf) Thanks [@bluwy](https://github.com/bluwy)! - Deprecate returning simple objects from endpoints. Endpoints should only return a `Response`.

  To return a result with a custom encoding not supported by a `Response`, you can use the `ResponseWithEncoding` utility class instead.

  Before:

  ```ts
  export function GET() {
    return {
      body: '...',
      encoding: 'binary',
    };
  }
  ```

  After:

  ```ts
  export function GET({ ResponseWithEncoding }) {
    return new ResponseWithEncoding('...', undefined, 'binary');
  }
  ```

- Updated dependencies [[`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7), [`e79e3779d`](https://github.com/withastro/astro/commit/e79e3779df0ad35253abcdb931d622847d9adb12)]:
  - @astrojs/markdown-remark@3.0.0-rc.1
  - @astrojs/telemetry@3.0.0-rc.3
  - @astrojs/internal-helpers@0.2.0-rc.2

## 3.0.0-beta.4

### Patch Changes

- [#8139](https://github.com/withastro/astro/pull/8139) [`db39206cb`](https://github.com/withastro/astro/commit/db39206cbb85b034859ac416179f141184bb2bff) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Use `undici` for File changeset for Node 16 compatibility

## 3.0.0-beta.3

### Major Changes

- [#8113](https://github.com/withastro/astro/pull/8113) [`2484dc408`](https://github.com/withastro/astro/commit/2484dc4080e5cd84b9a53648a1de426d7c907be2) Thanks [@Princesseuh](https://github.com/Princesseuh)! - This import alias is no longer included by default with astro:assets. If you were using this alias with experimental assets, you must convert them to relative file paths, or create your own [import aliases](https://docs.astro.build/en/guides/aliases/).

  ```diff
  ---
  // src/pages/posts/post-1.astro
  - import rocket from '~/assets/rocket.png'
  + import rocket from '../../assets/rocket.png';
  ---
  ```

- [#7979](https://github.com/withastro/astro/pull/7979) [`dbc97b121`](https://github.com/withastro/astro/commit/dbc97b121f42583728f1cdfdbf14575fda943f5b) Thanks [@bluwy](https://github.com/bluwy)! - Export experimental `dev`, `build`, `preview`, and `sync` APIs from `astro`. These APIs allow you to run Astro's commands programmatically, and replaces the previous entry point that runs the Astro CLI.

  While these APIs are experimental, the inline config parameter is relatively stable without foreseeable changes. However, the returned results of these APIs are more likely to change in the future.

  ```ts
  import { dev, build, preview, sync, type AstroInlineConfig } from 'astro';

  // Inline Astro config object.
  // Provide a path to a configuration file to load or set options directly inline.
  const inlineConfig: AstroInlineConfig = {
    // Inline-specific options...
    configFile: './astro.config.mjs',
    logLevel: 'info',
    // Standard Astro config options...
    site: 'https://example.com',
  };

  // Start the Astro dev server
  const devServer = await dev(inlineConfig);
  await devServer.stop();

  // Build your Astro project
  await build(inlineConfig);

  // Preview your built project
  const previewServer = await preview(inlineConfig);
  await previewServer.stop();

  // Generate types for your Astro project
  await sync(inlineConfig);
  ```

- [#8085](https://github.com/withastro/astro/pull/8085) [`68efd4a8b`](https://github.com/withastro/astro/commit/68efd4a8b29f248397667801465b3152dc98e9a7) Thanks [@bluwy](https://github.com/bluwy)! - Remove exports for `astro/internal/*` and `astro/runtime/server/*` in favour of `astro/runtime/*`. Add new `astro/compiler-runtime` export for compiler-specific runtime code.

  These are exports for Astro's internal API and should not affect your project, but if you do use these entrypoints, you can migrate like below:

  ```diff
  - import 'astro/internal/index.js';
  + import 'astro/runtime/server/index.js';

  - import 'astro/server/index.js';
  + import 'astro/runtime/server/index.js';
  ```

  ```diff
  import { transform } from '@astrojs/compiler';

  const result = await transform(source, {
  - internalURL: 'astro/runtime/server/index.js',
  + internalURL: 'astro/compiler-runtime',
    // ...
  });
  ```

- [#8030](https://github.com/withastro/astro/pull/8030) [`5208a3c8f`](https://github.com/withastro/astro/commit/5208a3c8fefcec7694857fb344af351f4631fc34) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Removed duplicate `astro/dist/jsx` export. Please use the `astro/jsx` export instead

- [#8118](https://github.com/withastro/astro/pull/8118) [`8a5b0c1f3`](https://github.com/withastro/astro/commit/8a5b0c1f3a4be6bb62db66ec70144109ff5b4c59) Thanks [@lilnasy](https://github.com/lilnasy)! - Astro is smarter about CSS! Small stylesheets are now inlined by default, and no longer incur the cost of additional requests to your server. Your visitors will have to wait less before they see your pages, especially those in remote locations or in a subway.

  This may not be news to you if you had opted-in via the `build.inlineStylesheets` configuration. Stabilized in Astro 2.6 and set to "auto" by default for Starlight, this configuration allows you to reduce the number of requests for stylesheets by inlining them into <style> tags. The new default is "auto", which selects assets smaller than 4kB and includes them in the initial response.

  To go back to the previous default behavior, change `build.inlineStylesheets` to "never".

  ```ts
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    build: {
      inlineStylesheets: 'never',
    },
  });
  ```

- [#7921](https://github.com/withastro/astro/pull/7921) [`b76c166bd`](https://github.com/withastro/astro/commit/b76c166bdd8e28683f62806aef968d1e0c3b06d9) Thanks [@Princesseuh](https://github.com/Princesseuh)! - `astro:assets` is now enabled by default. If you were previously using the `experimental.assets` flag, please remove it from your config. Also note that the previous `@astrojs/image` integration is incompatible, and must be removed.

  This also brings two important changes to using images in Astro:

  - New ESM shape: importing an image will now return an object with different properties describing the image such as its path, format and dimensions. This is a breaking change and may require you to update your existing images.
  - In Markdown, MDX, and Markdoc, the `![]()` syntax will now resolve relative images located anywhere in your project in addition to remote images and images stored in the `public/` folder. This notably unlocks storing images next to your content.

  Please see our existing [Assets page in Docs](https://docs.astro.build/en/guides/assets/) for more information about using `astro:assets`.

### Minor Changes

- [#8101](https://github.com/withastro/astro/pull/8101) [`ea7ff5177`](https://github.com/withastro/astro/commit/ea7ff5177dbcd7b2508cb1eef1b22b8ee1f47079) Thanks [@matthewp](https://github.com/matthewp)! - `astro:`namespace aliases for middleware and components

  This adds aliases of `astro:middleware` and `astro:components` for the middleware and components modules. This is to make our documentation consistent between are various modules, where some are virtual modules and others are not. Going forward new built-in modules will use this namespace.

### Patch Changes

- [#8128](https://github.com/withastro/astro/pull/8128) [`c2c71d90c`](https://github.com/withastro/astro/commit/c2c71d90c264a2524f99e0373ab59015f23ad4b1) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update error message when Sharp couldn't be found (tends to happen on pnpm notably)

- [#8092](https://github.com/withastro/astro/pull/8092) [`7177f7579`](https://github.com/withastro/astro/commit/7177f7579b6e866f0fd895b3fd079d8ba330b1a9) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Ensure dotfiles are cleaned during static builds

- [#8070](https://github.com/withastro/astro/pull/8070) [`097a8e4e9`](https://github.com/withastro/astro/commit/097a8e4e916c7df18eafdaa6c8d6ce2991c17ab6) Thanks [@lilnasy](https://github.com/lilnasy)! - Fix a handful of edge cases with prerendered 404/500 pages

- [#8078](https://github.com/withastro/astro/pull/8078) [`2540feedb`](https://github.com/withastro/astro/commit/2540feedb06785d5a20eecc3668849f147d778d4) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Reimplement https://github.com/withastro/astro/pull/7509 to correctly emit pre-rendered pages now that `build.split` is deprecated and this configuration has been moved to `functionPerRoute` inside the adapter.

- [#8105](https://github.com/withastro/astro/pull/8105) [`0e0fa605d`](https://github.com/withastro/astro/commit/0e0fa605d109cc91e08a1ae1cc560ea240fe631b) Thanks [@martrapp](https://github.com/martrapp)! - ViewTransition: bug fix for lost scroll position in browser history

- [#7778](https://github.com/withastro/astro/pull/7778) [`d6b494376`](https://github.com/withastro/astro/commit/d6b4943764989c0e89df2d6875cd19691566dfb3) Thanks [@y-nk](https://github.com/y-nk)! - Added support for optimizing remote images from authorized sources when using `astro:assets`. This comes with two new parameters to specify which domains (`image.domains`) and host patterns (`image.remotePatterns`) are authorized for remote images.

  For example, the following configuration will only allow remote images from `astro.build` to be optimized:

  ```ts
  // astro.config.mjs
  export default defineConfig({
    image: {
      domains: ['astro.build'],
    },
  });
  ```

  The following configuration will only allow remote images from HTTPS hosts:

  ```ts
  // astro.config.mjs
  export default defineConfig({
    image: {
      remotePatterns: [{ protocol: 'https' }],
    },
  });
  ```

- [#8072](https://github.com/withastro/astro/pull/8072) [`4477bb41c`](https://github.com/withastro/astro/commit/4477bb41c8ed688785c545731ef5b184b629f4e5) Thanks [@matthewp](https://github.com/matthewp)! - Update Astro types to reflect that compress defaults to true

- [#8130](https://github.com/withastro/astro/pull/8130) [`3e834293d`](https://github.com/withastro/astro/commit/3e834293d47ab2761a7aa013916e8371871efb7f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add some polyfills for Stackblitz until they support Node 18. Running Astro on Node 16 is still not officially supported, however.

- Updated dependencies [[`3e834293d`](https://github.com/withastro/astro/commit/3e834293d47ab2761a7aa013916e8371871efb7f)]:
  - @astrojs/telemetry@3.0.0-beta.2

## 3.0.0-beta.2

### Patch Changes

- Updated dependencies [[`2aa6d8ace`](https://github.com/withastro/astro/commit/2aa6d8ace398a41c2dec5473521d758816b08191)]:
  - @astrojs/internal-helpers@0.2.0-beta.1

## 3.0.0-beta.1

### Major Changes

- [#7952](https://github.com/withastro/astro/pull/7952) [`3c3100851`](https://github.com/withastro/astro/commit/3c31008519ce68b5b1b1cb23b71fbe0a2d506882) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Remove support for `Astro.__renderMarkdown` which is used by `@astrojs/markdown-component`.

  The `<Markdown />` component was deprecated in Astro v1 and is completely removed in v3. This integration must now be removed from your project.

  As an alternative, you can use community packages that provide a similar component like https://github.com/natemoo-re/astro-remote instead.

- [#8019](https://github.com/withastro/astro/pull/8019) [`34cb20021`](https://github.com/withastro/astro/commit/34cb2002161ba88df6bcb72fecfd12ed867c134b) Thanks [@bluwy](https://github.com/bluwy)! - Remove backwards-compatible kebab-case transform for camelCase CSS variable names passed to the `style` attribute. If you were relying on the kebab-case transform in your styles, make sure to use the camelCase version to prevent missing styles. For example:

  ```astro
  ---
  const myValue = 'red';
  ---

  <!-- input -->
  <div style={{ '--myValue': myValue }}></div>

  <!-- output (before) -->
  <div style="--my-value:var(--myValue);--myValue:red"></div>

  <!-- output (after) -->
  <div style="--myValue:red"></div>
  ```

  ```diff
  <style>
    div {
  -   color: var(--my-value);
  +   color: var(--myValue);
    }
  </style>
  ```

- [#7893](https://github.com/withastro/astro/pull/7893) [`7bd1b86f8`](https://github.com/withastro/astro/commit/7bd1b86f85c06fdde0a1ed9146d01bac69990671) Thanks [@ematipico](https://github.com/ematipico)! - Implements a new scope style strategy called `"attribute"`. When enabled, styles are applied using `data-*` attributes.

  The **default** value of `scopedStyleStrategy` is `"attribute"`.

  If you want to use the previous behaviour, you have to use the `"where"` option:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  +    scopedStyleStrategy: 'where',
  });
  ```

- [#7924](https://github.com/withastro/astro/pull/7924) [`519a1c4e8`](https://github.com/withastro/astro/commit/519a1c4e8407c7abcb8d879b67a9f4b960652cae) Thanks [@matthewp](https://github.com/matthewp)! - Astro's JSX handling has been refactored with better support for each framework.

  Previously, Astro automatically scanned your components to determine which framework-specific transformations should be used. In practice, supporting advanced features like Fast Refresh with this approach proved difficult.

  Now, Astro determines which framework to use with `include` and `exclude` config options where you can specify files and folders on a per-framework basis. When using multiple JSX frameworks in the same project, users should manually control which files belong to each framework using the `include` and `exclude` options.

  ```js
  export default defineConfig({
    // The `include` config is only needed in projects that use multiple JSX frameworks;
    // if only using one no extra config is needed.
    integrations: [
      preact({
        include: ['**/preact/*'],
      }),
      react({
        include: ['**/react/*'],
      }),
      solid({
        include: ['**/solid/*'],
      }),
    ],
  });
  ```

- [#7878](https://github.com/withastro/astro/pull/7878) [`0f637c71e`](https://github.com/withastro/astro/commit/0f637c71e511cb4c51712128d217a26c8eee4d40) Thanks [@bluwy](https://github.com/bluwy)! - The value of `import.meta.env.BASE_URL`, which is derived from the `base` option, will no longer have a trailing slash added by default or when `trailingSlash: "ignore"` is set. The existing behavior of `base` in combination with `trailingSlash: "always"` or `trailingSlash: "never"` is unchanged.

  If your `base` already has a trailing slash, no change is needed.

  If your `base` does not have a trailing slash, add one to preserve the previous behaviour:

  ```diff
  // astro.config.mjs
  - base: 'my-base',
  + base: 'my-base/',
  ```

### Minor Changes

- [#8012](https://github.com/withastro/astro/pull/8012) [`866ed4098`](https://github.com/withastro/astro/commit/866ed4098edffb052239cdb26e076cf8db61b1d9) Thanks [@ematipico](https://github.com/ematipico)! - Add a new `astro/errors` module. Developers can import `AstroUserError`, and provide a `message` and an optional `hint`

### Patch Changes

- [#7998](https://github.com/withastro/astro/pull/7998) [`65c354969`](https://github.com/withastro/astro/commit/65c354969e6fe0ef6d622e8f4c545e2f717ce8c6) Thanks [@bluwy](https://github.com/bluwy)! - Call `astro sync` once before calling `astro check`

- [#7952](https://github.com/withastro/astro/pull/7952) [`70f34f5a3`](https://github.com/withastro/astro/commit/70f34f5a355f42526ee9e5355f3de8e510002ea2) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Remove StreamingCompatibleResponse polyfill

- [#8011](https://github.com/withastro/astro/pull/8011) [`5b1e39ef6`](https://github.com/withastro/astro/commit/5b1e39ef6ec6dcebea96584f95d9530bd9aa715d) Thanks [@bluwy](https://github.com/bluwy)! - Move hoisted script analysis optimization behind the `experimental.optimizeHoistedScript` option

- Updated dependencies [[`b675acb2a`](https://github.com/withastro/astro/commit/b675acb2aa820448e9c0d363339a37fbac873215)]:
  - @astrojs/telemetry@3.0.0-beta.1

## 3.0.0-beta.0

### Major Changes

- [`1eae2e3f7`](https://github.com/withastro/astro/commit/1eae2e3f7d693c9dfe91c8ccfbe606d32bf2fb81) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 16. The lowest supported version by Astro and all integrations is now v18.14.1. As a reminder, Node 16 will be deprecated on the 11th September 2023.

- [`76ddef19c`](https://github.com/withastro/astro/commit/76ddef19ccab6e5f7d3a5740cd41acf10e334b38) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Removed automatic flattening of `getStaticPaths` result. `.flatMap` and `.flat` should now be used to ensure that you're returning a flat array.

- [`3fdf509b2`](https://github.com/withastro/astro/commit/3fdf509b2731a9b2f972d89291e57cf78d62c769) Thanks [@ematipico](https://github.com/ematipico)! - The `build.split` and `build.excludeMiddleware` configuration options are deprecated and have been replaced by options in the adapter config.

  If your config includes the `build.excludeMiddleware` option, replace it with `edgeMiddleware` in your adapter options:

  ```diff
  import { defineConfig } from "astro/config";
  import netlify from "@astrojs/netlify/functions";

  export default defineConfig({
       build: {
  -        excludeMiddleware: true
       },
       adapter: netlify({
  +        edgeMiddleware: true
       }),
  });
  ```

  If your config includes the `build.split` option, replace it with `functionPerRoute` in your adapter options:

  ```diff
  import { defineConfig } from "astro/config";
  import netlify from "@astrojs/netlify/functions";

  export default defineConfig({
       build: {
  -        split: true
       },
       adapter: netlify({
  +        functionPerRoute: true
       }),
  });
  ```

- [`2f951cd40`](https://github.com/withastro/astro/commit/2f951cd403dfcc2c3ca6aae618ae3e1409516e32) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Sharp is now the default image service used for `astro:assets`. If you would prefer to still use Squoosh, you can update your config with the following:

  ```ts
  import { defineConfig, squooshImageService } from 'astro/config';

  // https://astro.build/config
  export default defineConfig({
    image: {
      service: squooshImageService(),
    },
  });
  ```

  However, not only do we recommend using Sharp as it is faster and more reliable, it is also highly likely that the Squoosh service will be removed in a future release.

- [`c022a4217`](https://github.com/withastro/astro/commit/c022a4217a805d223c1494e9eda4e48bbf810388) Thanks [@Princesseuh](https://github.com/Princesseuh)! - When using an adapter that supports neither Squoosh or Sharp, Astro will now automatically use an image service that does not support processing, but still provides the other benefits of `astro:assets` such as enforcing `alt`, no CLS etc to users

- [`67becaa58`](https://github.com/withastro/astro/commit/67becaa580b8f787df58de66b7008b7098f1209c) Thanks [@ematipico](https://github.com/ematipico)! - Removed support for old syntax of the API routes.

- [`dfc2d93e3`](https://github.com/withastro/astro/commit/dfc2d93e3c645995379358fabbdfa9aab99f43d8) Thanks [@bluwy](https://github.com/bluwy)! - Remove MDX plugin re-ordering hack

- [`3dc1ca2fa`](https://github.com/withastro/astro/commit/3dc1ca2fac8d9965cc5085a5d09e72ed87b4281a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Reduced the amount of polyfills provided by Astro. Astro will no longer provide (no-op) polyfills for several web apis such as HTMLElement, Image or Document. If you need access to those APIs on the server, we recommend using more proper polyfills available on npm.

- [`1be84dfee`](https://github.com/withastro/astro/commit/1be84dfee3ce8e6f5cc624f99aec4e980f6fde37) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update `tsconfig.json` presets with `moduleResolution: 'bundler'` and other new options from TypeScript 5.0. Astro now assumes that you use TypeScript 5.0 (March 2023), or that your editor includes it, ex: VS Code 1.77

- [`35f01df79`](https://github.com/withastro/astro/commit/35f01df797d23315f2bee2fc3fd795adb0559c58) Thanks [@Princesseuh](https://github.com/Princesseuh)! - The `astro check` command now requires an external package `@astrojs/check` and an install of `typescript` in your project. This was done in order to make the main `astro` package smaller and give more flexibility to users in regard to the version of TypeScript they use.

- [`3fdf509b2`](https://github.com/withastro/astro/commit/3fdf509b2731a9b2f972d89291e57cf78d62c769) Thanks [@ematipico](https://github.com/ematipico)! - The `build.split` and `build.excludeMiddleware` configuration options are deprecated and have been replaced by options in the adapter config.

  If your config includes the `build.excludeMiddleware` option, replace it with `edgeMiddleware` in your adapter options:

  ```diff
  import { defineConfig } from "astro/config";
  import vercel from "@astrojs/vercel/serverless";

  export default defineConfig({
       build: {
  -        excludeMiddleware: true
       },
       adapter: vercel({
  +        edgeMiddleware: true
       }),
  });
  ```

  If your config includes the `build.split` option, replace it with `functionPerRoute` in your adapter options:

  ```diff
  import { defineConfig } from "astro/config";
  import vercel from "@astrojs/vercel/serverless";

  export default defineConfig({
       build: {
  -        split: true
       },
       adapter: vercel({
  +        functionPerRoute: true
       }),
  });
  ```

- [`78de801f2`](https://github.com/withastro/astro/commit/78de801f21fd4ca1653950027d953bf08614566b) Thanks [@ematipico](https://github.com/ematipico)! - Lowercase names for endpoint functions are now deprecated.

  Rename functions to their uppercase equivalent:

  ```diff
  - export function get() {
  + export function GET() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }

  - export function post() {
  + export function POST() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }

  - export function put() {
  + export function PUT() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }

  - export function all() {
  + export function ALL() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }

  // you can use the whole word "DELETE"
  - export function del() {
  + export function DELETE() {
      return new Response(JSON.stringify({ "title": "Bob's blog" }));
  }
  ```

- [`59d6e569f`](https://github.com/withastro/astro/commit/59d6e569f63e175c97e82e94aa7974febfb76f7c) Thanks [@matthewp](https://github.com/matthewp)! - Astro.cookies.get(key) returns undefined if cookie doesn't exist

  With this change, Astro.cookies.get(key) no longer always returns a `AstroCookie` object. Instead it now returns `undefined` if the cookie does not exist.

  You should update your code if you assume that all calls to `get()` return a value. When using with `has()` you still need to assert the value, like so:

  ```astro
  ---
  if (Astro.cookies.has(id)) {
    const id = Astro.cookies.get(id)!;
  }
  ---
  ```

- [`7723c4cc9`](https://github.com/withastro/astro/commit/7723c4cc93298c2e6530e55da7afda048f22cf81) Thanks [@ematipico](https://github.com/ematipico)! - The property `compressHTML` is now `true` by default. Setting this value to `true` is no longer required.

  If you do not want to minify your HTML output, you must set this value to `false` in `astro.config.mjs`.

  ```diff
  import {defineConfig} from "astro/config";
  export default defineConfig({
  +  compressHTML: false
  })
  ```

- [`fb5cd6b56`](https://github.com/withastro/astro/commit/fb5cd6b56dc27a71366ed5e1ab8bfe9b8f96bac5) Thanks [@ematipico](https://github.com/ematipico)! - Astro's default port when running the dev or preview server is now `4321`.

  This will reduce conflicts with ports used by other tools.

- [`631b9c410`](https://github.com/withastro/astro/commit/631b9c410d5d66fa384674027ba95d69ebb5063f) Thanks [@bluwy](https://github.com/bluwy)! - Remove MDX special `components` export handling

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

- [`bc37331d8`](https://github.com/withastro/astro/commit/bc37331d8154e3e95a8df9131e4e014e78a7a9e7) Thanks [@ematipico](https://github.com/ematipico)! - Integrations can now log messages using Astro’s built-in logger.

  The logger is available to all hooks as an additional parameter:

  ```ts
  import { AstroIntegration } from './astro';

  // integration.js
  export function myIntegration(): AstroIntegration {
    return {
      name: 'my-integration',
      hooks: {
        'astro:config:done': ({ logger }) => {
          logger.info('Configure integration...');
        },
      },
    };
  }
  ```

### Patch Changes

- Updated dependencies [[`1eae2e3f7`](https://github.com/withastro/astro/commit/1eae2e3f7d693c9dfe91c8ccfbe606d32bf2fb81)]:
  - @astrojs/telemetry@3.0.0-beta.0
  - @astrojs/internal-helpers@0.2.0-beta.0
  - @astrojs/markdown-remark@3.0.0-beta.0

## 2.10.14

### Patch Changes

- [#8206](https://github.com/withastro/astro/pull/8206) [`52606a390`](https://github.com/withastro/astro/commit/52606a3909f9de5ced9b9ba3ba25832f73a8689e) Thanks [@martrapp](https://github.com/martrapp)! - fix: View Transition: swap attributes of document's root element

## 2.10.13

### Patch Changes

- [#8152](https://github.com/withastro/astro/pull/8152) [`582132328`](https://github.com/withastro/astro/commit/5821323285646aee7ff9194a505f708028e4db57) Thanks [@andremralves](https://github.com/andremralves)! - Displays a new config error if `outDir` is placed within `publicDir`.

- [#8166](https://github.com/withastro/astro/pull/8166) [`fddd4dc71`](https://github.com/withastro/astro/commit/fddd4dc71af321bd6b4d01bb4b1b955284846e60) Thanks [@martrapp](https://github.com/martrapp)! - ViewTransitions: Fixes in the client-side router

- [#8182](https://github.com/withastro/astro/pull/8182) [`cfc465dde`](https://github.com/withastro/astro/commit/cfc465ddebcc58d20f29ecffaa857a77525435a9) Thanks [@martrapp](https://github.com/martrapp)! - View Transitions: self link (`href=""`) does not trigger page reload

- [#8171](https://github.com/withastro/astro/pull/8171) [`95120efbe`](https://github.com/withastro/astro/commit/95120efbe817163663492181cbeb225849354493) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix missing type for `imageConfig` export from `astro:assets`

- [#8187](https://github.com/withastro/astro/pull/8187) [`273335cb0`](https://github.com/withastro/astro/commit/273335cb01615c3c06d46c02464f4496a81f8d0b) Thanks [@bluwy](https://github.com/bluwy)! - Fix Astro components parent-child render order

- [#8184](https://github.com/withastro/astro/pull/8184) [`9142178b1`](https://github.com/withastro/astro/commit/9142178b113443749b87c1d259859b42a3d7a9c4) Thanks [@martrapp](https://github.com/martrapp)! - Fix: The scrolling behavior of ViewTransitions is now more similar to the expected browser behavior

- [#8163](https://github.com/withastro/astro/pull/8163) [`179796405`](https://github.com/withastro/astro/commit/179796405e053b559d83f84507e5a465861a029a) Thanks [@delucis](https://github.com/delucis)! - Make typing of `defineCollection` more permissive to support advanced union and intersection types

## 2.10.12

### Patch Changes

- [#8144](https://github.com/withastro/astro/pull/8144) [`04caa99c4`](https://github.com/withastro/astro/commit/04caa99c48ce604ca3b90302ff0df8dcdbeee650) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed an issue where data entries' id included backslashes instead of forward slashes on Windows.

## 2.10.11

### Patch Changes

- [#8136](https://github.com/withastro/astro/pull/8136) [`97c8760d7`](https://github.com/withastro/astro/commit/97c8760d78ffd172149f7776442725861576fba7) Thanks [@andremralves](https://github.com/andremralves)! - Fix 404 response leading to an infinite loop when there is no 404 page.

## 2.10.10

### Patch Changes

- [#8127](https://github.com/withastro/astro/pull/8127) [`b12c8471f`](https://github.com/withastro/astro/commit/b12c8471f413c0291de4a9c444bfe3079a192034) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Do not throw Error when users pass an object with a "type" property

- [#8092](https://github.com/withastro/astro/pull/8092) [`7177f7579`](https://github.com/withastro/astro/commit/7177f7579b6e866f0fd895b3fd079d8ba330b1a9) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Ensure dotfiles are cleaned during static builds

- [#8122](https://github.com/withastro/astro/pull/8122) [`fa6b68a77`](https://github.com/withastro/astro/commit/fa6b68a776c5b3cc8167fc042b7d305234ebcff9) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve fidelity of time stats when running `astro build`

- [#8070](https://github.com/withastro/astro/pull/8070) [`097a8e4e9`](https://github.com/withastro/astro/commit/097a8e4e916c7df18eafdaa6c8d6ce2991c17ab6) Thanks [@lilnasy](https://github.com/lilnasy)! - Fix a handful of edge cases with prerendered 404/500 pages

- [#8123](https://github.com/withastro/astro/pull/8123) [`1f6497c33`](https://github.com/withastro/astro/commit/1f6497c3341231ee76fc4538cfe7624cf4721d56) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Open to configured `base` when `astro dev --open` runs

- [#8105](https://github.com/withastro/astro/pull/8105) [`0e0fa605d`](https://github.com/withastro/astro/commit/0e0fa605d109cc91e08a1ae1cc560ea240fe631b) Thanks [@martrapp](https://github.com/martrapp)! - ViewTransition: bug fix for lost scroll position in browser history

- [#8116](https://github.com/withastro/astro/pull/8116) [`b290f0a99`](https://github.com/withastro/astro/commit/b290f0a99778a9b9c1045f3cd06b6aee934d7c03) Thanks [@martrapp](https://github.com/martrapp)! - On back navigation only animate view transitions that were animated going forward.

- [#7778](https://github.com/withastro/astro/pull/7778) [`d6b494376`](https://github.com/withastro/astro/commit/d6b4943764989c0e89df2d6875cd19691566dfb3) Thanks [@y-nk](https://github.com/y-nk)! - Added support for optimizing remote images from authorized sources when using `astro:assets`. This comes with two new parameters to specify which domains (`image.domains`) and host patterns (`image.remotePatterns`) are authorized for remote images.

  For example, the following configuration will only allow remote images from `astro.build` to be optimized:

  ```ts
  // astro.config.mjs
  export default defineConfig({
    image: {
      domains: ['astro.build'],
    },
  });
  ```

  The following configuration will only allow remote images from HTTPS hosts:

  ```ts
  // astro.config.mjs
  export default defineConfig({
    image: {
      remotePatterns: [{ protocol: 'https' }],
    },
  });
  ```

- [#8109](https://github.com/withastro/astro/pull/8109) [`da6e3da1c`](https://github.com/withastro/astro/commit/da6e3da1ce00bed625fc568cfe4693713448e93f) Thanks [@martrapp](https://github.com/martrapp)! - fix: reinsert attribute to specify direction of ViewTransition (forward / back)

## 2.10.9

### Patch Changes

- [#8091](https://github.com/withastro/astro/pull/8091) [`56e7c5177`](https://github.com/withastro/astro/commit/56e7c5177bd61b404978dc9b82e2d34d76a4b2f9) Thanks [@martrapp](https://github.com/martrapp)! - Handle `<noscript>` tags in `<head>` during ViewTransitions

## 2.10.8

### Patch Changes

- [#7702](https://github.com/withastro/astro/pull/7702) [`c19987df0`](https://github.com/withastro/astro/commit/c19987df0be3520cf774476cea270c03edd08354) Thanks [@shishkin](https://github.com/shishkin)! - Fix AstroConfigSchema type export

- [#8084](https://github.com/withastro/astro/pull/8084) [`560e45924`](https://github.com/withastro/astro/commit/560e45924622141206ff5b47d134cb343d6d2a71) Thanks [@hbgl](https://github.com/hbgl)! - Stream request body instead of buffering it in memory.

- [#8066](https://github.com/withastro/astro/pull/8066) [`afc45af20`](https://github.com/withastro/astro/commit/afc45af2022f7c43fbb6c5c04983695f3819e47e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add support for non-awaited imports to the Image component and `getImage`

- [#7866](https://github.com/withastro/astro/pull/7866) [`d1f7143f9`](https://github.com/withastro/astro/commit/d1f7143f9caf2ffa0e87cc55c0e05339d3501db3) Thanks [@43081j](https://github.com/43081j)! - Add second type argument to the AstroGlobal type to type Astro.self. This change will ultimately allow our editor tooling to provide props completions and intellisense for `<Astro.self />`

- [#8032](https://github.com/withastro/astro/pull/8032) [`3e46634fd`](https://github.com/withastro/astro/commit/3e46634fd540e5b967d2e5c9abd6235452cee2f2) Thanks [@natemoo-re](https://github.com/natemoo-re)! - `astro add` now passes down `--save-prod`, `--save-dev`, `--save-exact`, and `--no-save` flags for installation

- [#8035](https://github.com/withastro/astro/pull/8035) [`a12027b6a`](https://github.com/withastro/astro/commit/a12027b6af411be39700919ca47e240a335e9887) Thanks [@fyndor](https://github.com/fyndor)! - Removed extra double quotes from computed style in shiki code component

## 2.10.7

### Patch Changes

- [#8042](https://github.com/withastro/astro/pull/8042) [`4a145c4c7`](https://github.com/withastro/astro/commit/4a145c4c7d176a3fb56342844690c6999e880069) Thanks [@matthewp](https://github.com/matthewp)! - Treat same pathname with different search params as different page

## 2.10.6

### Patch Changes

- [#8027](https://github.com/withastro/astro/pull/8027) [`1b8d30209`](https://github.com/withastro/astro/commit/1b8d3020990130dabfaaf753db73a32c6e0c896a) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Ensure dev server restarts respect when `base` is removed

- [#8033](https://github.com/withastro/astro/pull/8033) [`405913cdf`](https://github.com/withastro/astro/commit/405913cdf20b26407aa351c090f0a0859a4e6f54) Thanks [@matthewp](https://github.com/matthewp)! - Prevent script re-evaluation on page transition

- [#8036](https://github.com/withastro/astro/pull/8036) [`87d4b1843`](https://github.com/withastro/astro/commit/87d4b18437c7565c48cad4bea81831c2a244ebb8) Thanks [@ematipico](https://github.com/ematipico)! - Fix a bug where the middleware entry point was passed to integrations even though the configuration `build.excludeMiddleware` was set to `false`.

- [#8022](https://github.com/withastro/astro/pull/8022) [`c23377caa`](https://github.com/withastro/astro/commit/c23377caafbc75deb91c33b9678c1b6868ad40ea) Thanks [@bluwy](https://github.com/bluwy)! - Always return a new array instance from `getCollection` in prod

- [#8013](https://github.com/withastro/astro/pull/8013) [`86bee2812`](https://github.com/withastro/astro/commit/86bee2812185df6e14025e5962a335f51853587b) Thanks [@martrapp](https://github.com/martrapp)! - Links with hash marks now trigger view transitions if they lead to a different page. Links to the same page do not trigger view transitions.

## 2.10.5

### Patch Changes

- [#8011](https://github.com/withastro/astro/pull/8011) [`5b1e39ef6`](https://github.com/withastro/astro/commit/5b1e39ef6ec6dcebea96584f95d9530bd9aa715d) Thanks [@bluwy](https://github.com/bluwy)! - Move hoisted script analysis optimization behind the `experimental.optimizeHoistedScript` option

## 2.10.4

### Patch Changes

- [#8003](https://github.com/withastro/astro/pull/8003) [`16161afb2`](https://github.com/withastro/astro/commit/16161afb2b3a04ca7605fcd16de06efe3fabdef2) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed `EndpointOutput` types with `{ encoding: 'binary' }`

- [#7995](https://github.com/withastro/astro/pull/7995) [`79376f842`](https://github.com/withastro/astro/commit/79376f842d25edfe4dc2948548e99b59e1c4d24f) Thanks [@belluzj](https://github.com/belluzj)! - Fix quadratic quote escaping in nested data in island props

- [#8007](https://github.com/withastro/astro/pull/8007) [`58b121d42`](https://github.com/withastro/astro/commit/58b121d42a9f58a5a992f0c378b036f37e9715fc) Thanks [@paperdave](https://github.com/paperdave)! - Support Bun by adjusting how `@babel/plugin-transform-react-jsx` is imported.

## 2.10.3

### Patch Changes

- [#7986](https://github.com/withastro/astro/pull/7986) [`8e5a27b48`](https://github.com/withastro/astro/commit/8e5a27b488b326c1f9be6f02c191a2fb0dafac56) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Ensure injectRoute is properly handled in `build` as well as `dev`

## 2.10.2

### Patch Changes

- [#7945](https://github.com/withastro/astro/pull/7945) [`a00cfb894`](https://github.com/withastro/astro/commit/a00cfb89429003b6e1ad28ec8cc6d46ab4ed244b) Thanks [@matthewp](https://github.com/matthewp)! - Fix race condition when performing swap for fallback

- [#7983](https://github.com/withastro/astro/pull/7983) [`6cd7290d2`](https://github.com/withastro/astro/commit/6cd7290d2c8380bdf4d7e36f3296948d10d5bc25) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix filename generation for `.astro` pages

- [#7946](https://github.com/withastro/astro/pull/7946) [`9d0070095`](https://github.com/withastro/astro/commit/9d0070095e90d4cbc31f5f9a1c6dd48a0dbeb379) Thanks [@andremralves](https://github.com/andremralves)! - Fix: missing CSS import when 404 server Response redirects to a custom 404 page.

- [#7977](https://github.com/withastro/astro/pull/7977) [`a4a637c8f`](https://github.com/withastro/astro/commit/a4a637c8f79fbbb8cc451e9155ef7b3b02c6a6d0) Thanks [@bluwy](https://github.com/bluwy)! - Fix inline root resolve logic

- [#7943](https://github.com/withastro/astro/pull/7943) [`c2682a17c`](https://github.com/withastro/astro/commit/c2682a17c05360bc80705032637159920be1f156) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Ensure that injected routes from `node_modules` are properly detected

## 2.10.1

### Patch Changes

- [#7935](https://github.com/withastro/astro/pull/7935) [`6035bb35f`](https://github.com/withastro/astro/commit/6035bb35f222fc6a80b418f13998b21c59da85b6) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Properly handle routing when multiple slashes are present in the request by collapsing them to a single `/`

- [#7936](https://github.com/withastro/astro/pull/7936) [`4b6deda36`](https://github.com/withastro/astro/commit/4b6deda360b2ba47d03427c377d5982b24ee894c) Thanks [@matthewp](https://github.com/matthewp)! - Export createTransitionScope for the runtime

- Updated dependencies [[`6035bb35f`](https://github.com/withastro/astro/commit/6035bb35f222fc6a80b418f13998b21c59da85b6)]:
  - @astrojs/internal-helpers@0.1.2

## 2.10.0

### Minor Changes

- [#7861](https://github.com/withastro/astro/pull/7861) [`41afb8405`](https://github.com/withastro/astro/commit/41afb84057f606b0e7f9a73c1e40487068e43948) Thanks [@matthewp](https://github.com/matthewp)! - Persistent DOM and Islands in Experimental View Transitions

  With `viewTransitions: true` enabled in your Astro config's experimental section, pages using the `<ViewTransition />` routing component can now access a new `transition:persist` directive.

  With this directive, you can keep the state of DOM elements and islands on the old page when transitioning to the new page.

  For example, to keep a video playing across page navigation, add `transition:persist` to the element:

  ```astro
  <video controls="" autoplay="" transition:persist>
    <source
      src="https://ia804502.us.archive.org/33/items/GoldenGa1939_3/GoldenGa1939_3_512kb.mp4"
      type="video/mp4"
    />
  </video>
  ```

  This `<video>` element, with its current state, will be moved over to the next page (if the video also exists on that page).

  Likewise, this feature works with any client-side framework component island. In this example, a counter's state is preserved and moved to the new page:

  ```astro
  <Counter count={5} client:load transition:persist />
  ```

  See our [View Transitions Guide](https://docs.astro.build/en/guides/view-transitions/#maintaining-state) to learn more on usage.

### Patch Changes

- [#7821](https://github.com/withastro/astro/pull/7821) [`c00b6f0c4`](https://github.com/withastro/astro/commit/c00b6f0c49027125ea3026e89b21fef84380d187) Thanks [@ottomated](https://github.com/ottomated)! - Fixes an issue that prevents importing `'astro/app'`

- [#7917](https://github.com/withastro/astro/pull/7917) [`1f0ee494a`](https://github.com/withastro/astro/commit/1f0ee494a5190356d130282f1f51ba2a5e6ea63f) Thanks [@bluwy](https://github.com/bluwy)! - Prevent integration hooks from re-triggering if the server restarts on config change, but the config fails to load.

- [#7901](https://github.com/withastro/astro/pull/7901) [`00cb28f49`](https://github.com/withastro/astro/commit/00cb28f4964a60bc609770108d491acc277997b9) Thanks [@bluwy](https://github.com/bluwy)! - Improve sourcemap generation and performance

- [#7911](https://github.com/withastro/astro/pull/7911) [`c264be349`](https://github.com/withastro/astro/commit/c264be3497db4aa8b3bcce0d2f79a26e35b8e91e) Thanks [@martrapp](https://github.com/martrapp)! - fix for #7882 by setting state in page navigation (view transitions)

- [#7909](https://github.com/withastro/astro/pull/7909) [`e1e958a75`](https://github.com/withastro/astro/commit/e1e958a75860292688569e82b4617fc141056202) Thanks [@tonydangblog](https://github.com/tonydangblog)! - Fix: ignore `.json` files nested in subdirectories within content collection directories starting with an `_` underscore.

## 2.9.7

### Patch Changes

- [#7754](https://github.com/withastro/astro/pull/7754) [`298dbb89f`](https://github.com/withastro/astro/commit/298dbb89f2963a547370b6e65cafd2650fdb1b27) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Refactor `404` and `500` route handling for consistency and improved prerendering support

- [#7885](https://github.com/withastro/astro/pull/7885) [`9e2203847`](https://github.com/withastro/astro/commit/9e22038472c8be05ed7a72620534b88324dce793) Thanks [@andremralves](https://github.com/andremralves)! - Fix incorrect build path logging for 404.astro pages.

- [#7887](https://github.com/withastro/astro/pull/7887) [`5c5da8d2f`](https://github.com/withastro/astro/commit/5c5da8d2fbb37830f3ee81830d4c9afcd2c1a3e3) Thanks [@ffxsam](https://github.com/ffxsam)! - Add logging for when JSON.parse fails within hydrate func

- [#7895](https://github.com/withastro/astro/pull/7895) [`0b8375fe8`](https://github.com/withastro/astro/commit/0b8375fe82a15bfff3f517f98de6454adb2779f1) Thanks [@bluwy](https://github.com/bluwy)! - Fix streaming Astro components

- [#7876](https://github.com/withastro/astro/pull/7876) [`89d015db6`](https://github.com/withastro/astro/commit/89d015db6ce4d15b5b1140f0eb6bfbef187d6ad7) Thanks [@ematipico](https://github.com/ematipico)! - Check for `getStaticPaths` only if the file has the `.astro` extension.

- [#7879](https://github.com/withastro/astro/pull/7879) [`ebf7ebbf7`](https://github.com/withastro/astro/commit/ebf7ebbf7ae767625d736fad327954cfb853837e) Thanks [@bluwy](https://github.com/bluwy)! - Refactor and improve Astro config loading flow

## 2.9.6

### Patch Changes

- [#7856](https://github.com/withastro/astro/pull/7856) [`861f10eaf`](https://github.com/withastro/astro/commit/861f10eafd4bf4fa08b8e943d64adec51a4c9c1d) Thanks [@matthewp](https://github.com/matthewp)! - Properly serialize redirect config for SSR

## 2.9.5

### Patch Changes

- [#7838](https://github.com/withastro/astro/pull/7838) [`e50f64675`](https://github.com/withastro/astro/commit/e50f646758f5a48e836523d1976d62e18e2893a4) Thanks [@bluwy](https://github.com/bluwy)! - Fix head propagation for MDX components

- [#7841](https://github.com/withastro/astro/pull/7841) [`2275c7d56`](https://github.com/withastro/astro/commit/2275c7d56b2b54e75ca1dbd1df5c7901cf358d52) Thanks [@ematipico](https://github.com/ematipico)! - Allow to return a redirect in dev mode when the original route is not present in the file system.

- [#7800](https://github.com/withastro/astro/pull/7800) [`49a4b2820`](https://github.com/withastro/astro/commit/49a4b28202cfc571897bcc74042b873a2ceecba4) Thanks [@matthewp](https://github.com/matthewp)! - Scroll position restoration with ViewTransitions router

## 2.9.4

### Patch Changes

- [#7826](https://github.com/withastro/astro/pull/7826) [`31c4031ba`](https://github.com/withastro/astro/commit/31c4031ba7aea132a861f2465f38a83741f0cd05) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `astro:assets` not working on Windows in build when using Squoosh

- [#7823](https://github.com/withastro/astro/pull/7823) [`5161cf919`](https://github.com/withastro/astro/commit/5161cf919c81bd3681af221def0abab7d25abec0) Thanks [@matthewp](https://github.com/matthewp)! - Adds an `astro:beforeload` event for the dark mode use-case

- [#7836](https://github.com/withastro/astro/pull/7836) [`59b556232`](https://github.com/withastro/astro/commit/59b556232696d3aba3c2263ea104cd9922085fd2) Thanks [@matthewp](https://github.com/matthewp)! - Upgrade compiler to bring in Image view transition support

- [#7824](https://github.com/withastro/astro/pull/7824) [`267487e63`](https://github.com/withastro/astro/commit/267487e63ea0a4cfcb771c667a088afb16c62ba6) Thanks [@matthewp](https://github.com/matthewp)! - Prevent navigation on hash change

- [#7829](https://github.com/withastro/astro/pull/7829) [`b063a2d8a`](https://github.com/withastro/astro/commit/b063a2d8aeaed18550d148511bfb68f9ba3cdb09) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `astro:assets` endpoint not working in dev and SSR if `experimental.assets` was enabled by an integration (such as Starlight)

- [#7734](https://github.com/withastro/astro/pull/7734) [`d5f526b33`](https://github.com/withastro/astro/commit/d5f526b3397cf24aa06353de2de91b2ba08cd4eb) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix some global state related to `astro:assets` not getting cleaned out properly in SSR with no pre-rendered pages

- [#7843](https://github.com/withastro/astro/pull/7843) [`7dbcbc86b`](https://github.com/withastro/astro/commit/7dbcbc86b3bd7e5458570906745364c9399d1a46) Thanks [@matthewp](https://github.com/matthewp)! - Fixes head propagation regression

## 2.9.3

### Patch Changes

- [#7782](https://github.com/withastro/astro/pull/7782) [`0f677c009`](https://github.com/withastro/astro/commit/0f677c009d102bc12232a966634136be58f34739) Thanks [@bluwy](https://github.com/bluwy)! - Refactor Astro rendering to write results directly. This improves the rendering performance for all Astro files.

- [#7786](https://github.com/withastro/astro/pull/7786) [`188eeddd4`](https://github.com/withastro/astro/commit/188eeddd47a61e04639670496924c37866180749) Thanks [@matthewp](https://github.com/matthewp)! - Execute scripts when navigating to a new page.

  When navigating to an new page with client-side navigation, scripts are executed (and re-executed) so that any new scripts on the incoming page are run and the DOM can be updated.

  However, `type=module` scripts never re-execute in Astro, and will not do so in client-side routing. To support cases where you want to modify the DOM, a new `astro:load` event listener been added:

  ```js
  document.addEventListener('astro:load', () => {
    updateTheDOMSomehow();
  });
  ```

## 2.9.2

### Patch Changes

- [#7777](https://github.com/withastro/astro/pull/7777) [`3567afac4`](https://github.com/withastro/astro/commit/3567afac4411c1054a5e999dd692e6d079825b4a) Thanks [@bluwy](https://github.com/bluwy)! - Fix rendering TextEncoder encoding error regression

- [#7759](https://github.com/withastro/astro/pull/7759) [`1792737da`](https://github.com/withastro/astro/commit/1792737dae1b24e3d678f8c4780f3cd17710944f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix SharedImageService's types not properly reflecting that image services hooks can be async

- [#7766](https://github.com/withastro/astro/pull/7766) [`da7f1128b`](https://github.com/withastro/astro/commit/da7f1128bf749dab1d9bd43e50c29a67e8271746) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix missing `referrerpolicy` on ScriptHTMLAttributes

- [#7746](https://github.com/withastro/astro/pull/7746) [`0c9959704`](https://github.com/withastro/astro/commit/0c9959704fff703417eb4602965c668c7f7a3001) Thanks [@birkskyum](https://github.com/birkskyum)! - Update Vite to 4.4

## 2.9.1

### Patch Changes

- [#7756](https://github.com/withastro/astro/pull/7756) [`274e67532`](https://github.com/withastro/astro/commit/274e6753281edde72fcb4af1cf8a9f892ee46127) Thanks [@matthewp](https://github.com/matthewp)! - Fixes case where there is FOUC caused by stylesheets not loaded

- [#7742](https://github.com/withastro/astro/pull/7742) [`e52852628`](https://github.com/withastro/astro/commit/e528526289dd9fba98e254743ded47a5c6d418a8) Thanks [@andersk](https://github.com/andersk)! - Fix parsing image assets from a Markdown line along with other markup.

- [#7757](https://github.com/withastro/astro/pull/7757) [`c2d6cfd0c`](https://github.com/withastro/astro/commit/c2d6cfd0c26f4ebb81c715389347de1c3bf5f3e6) Thanks [@matthewp](https://github.com/matthewp)! - Prevent animations when prefers-reduced-motion

- [#7750](https://github.com/withastro/astro/pull/7750) [`201d32dcf`](https://github.com/withastro/astro/commit/201d32dcfc58ca82468ac9be43b07cdc60abad88) Thanks [@matthewp](https://github.com/matthewp)! - Trigger full page refresh on back nav from page without VT enabled

## 2.9.0

### Minor Changes

- [#7686](https://github.com/withastro/astro/pull/7686) [`ec745d689`](https://github.com/withastro/astro/commit/ec745d689abc79d27bc24477589533481f077ddb) Thanks [@matthewp](https://github.com/matthewp)! - Redirects configuration

  This change moves the `redirects` configuration out of experimental. If you were previously using experimental redirects, remove the following experimental flag:

  ```js
  experimental: {
    redirects: true,
  }
  ```

  If you have been waiting for stabilization before using redirects, now you can do so. Check out [the docs on redirects](https://docs.astro.build/en/core-concepts/routing/#redirects) to learn how to use this built-in feature.

- [#7707](https://github.com/withastro/astro/pull/7707) [`3a6e42e19`](https://github.com/withastro/astro/commit/3a6e42e190421c2e172d5c408c0a7592653fccef) Thanks [@ottomated](https://github.com/ottomated)! - Improved hoisted script bundling

  Astro's static analysis to determine which `<script>` tags to bundle together just got a little smarter!

  Astro create bundles that optimize script usage between pages and place them in the head of the document so that they are downloaded as early as possible. One limitation to Astro's existing approach has been that you could not dynamically use hoisted scripts. Each page received the same, all-inclusive bundle whether or not every script was needed on that page.

  Now, Astro has improved the static analysis to take into account the actual imports used.

  For example, Astro would previously bundle the `<script>`s from both the `<Tab>` and `<Accordion>` component for the following library that re-exports multiple components:

  **@matthewp/my-astro-lib**

  ```js
  export { default as Tabs } from './Tabs.astro';
  export { default as Accordion } from './Accordion.astro';
  ```

  Now, when an Astro page only uses a single component, Astro will send only the necessary script to the page. A page that only imports the `<Accordion>` component will not receive any `<Tab>` component's scripts:

  ```astro
  ---
  import { Accordion } from '@matthewp/my-astro-lib';
  ---
  ```

  You should now see more efficient performance with Astro now supporting this common library re-export pattern.

- [#7511](https://github.com/withastro/astro/pull/7511) [`6a12fcecb`](https://github.com/withastro/astro/commit/6a12fcecb076623769eb017da9d4a17cfb0815d3) Thanks [@matthewp](https://github.com/matthewp)! - Built-in View Transitions Support (experimental)

  Astro now supports [view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/) through the new `<ViewTransitions />` component and the `transition:animate` (and associated) directives. View transitions are a great fit for content-oriented sites, and we see it as the best path to get the benefits of client-side routing (smoother transitions) without sacrificing the more simple mental model of MPAs.

  Enable support for view transitions in Astro 2.9 by adding the experimental flag to your config:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      viewTransitions: true,
    },
  });
  ```

  This enables you to use the new APIs added.

  #### <ViewTransitions />

  This is a component which acts as the _router_ for transitions between pages. Add it to the `<head>` section of each individual page where transitions should occur _in the client_ as you navigate away to another page, instead of causing a full page browser refresh. To enable support throughout your entire app, add the component in some common layout or component that targets the `<head>` of every page.

  **CommonHead.astro**

  ```astro
  ---
  import { ViewTransitions } from 'astro:transitions';
  ---

  <meta charset="utf-8" />
  <title>{Astro.props.title}</title>
  <ViewTransitions />
  ```

  With only this change, your app will now route completely in-client. You can then add transitions to individual elements using the `transition:animate` directive.

  #### Animations

  Add `transition:animate` to any element to use Astro's built-in animations.

  ```astro
  <header transition:animate="slide"></header>
  ```

  In the above, Astro's `slide` animation will cause the `<header>` element to slide out to the left, and then slide in from the right when you navigate away from the page.

  You can also customize these animations using any CSS animation properties, for example, by specifying a duration:

  ```astro
  ---
  import { slide } from 'astro:transition';
  ---

  <header transition:animate={slide({ duration: 200 })}></header>
  ```

  #### Continue learning

  Check out the [client-side routing docs](https://docs.astro.build/en/guides/client-side-routing/) to learn more.

### Patch Changes

- [#7701](https://github.com/withastro/astro/pull/7701) [`019b797bf`](https://github.com/withastro/astro/commit/019b797bf83201d2d4834cc9e0dde30f6a48daa2) Thanks [@bluwy](https://github.com/bluwy)! - Fix redirects map object-form value validation

- [#7704](https://github.com/withastro/astro/pull/7704) [`d78db48ac`](https://github.com/withastro/astro/commit/d78db48ac48bec6bd550b937a896cbcc747625f1) Thanks [@bluwy](https://github.com/bluwy)! - Fix absolute path handling when passing `root`, `srcDir`, `publicDir`, `outDir`, `cacheDir`, `build.client`, and `build.server` configs in Windows

- [#7713](https://github.com/withastro/astro/pull/7713) [`d088351f5`](https://github.com/withastro/astro/commit/d088351f54d2518e2bb539d7bbf8691427ff8a7a) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update warning when `getStaticPaths` is detected but a route is not prerendered.

## 2.8.5

### Patch Changes

- [#7711](https://github.com/withastro/astro/pull/7711) [`72bbfac97`](https://github.com/withastro/astro/commit/72bbfac976c2965a523eea88ff0543e64d848d80) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix `status` code for custom `404` and `500` pages in the dev server

- [#7693](https://github.com/withastro/astro/pull/7693) [`d401866f9`](https://github.com/withastro/astro/commit/d401866f93bfe25a50c171bc54b2b1ee0f483cc9) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix loading of `/404.astro` page when dynamic route returns 404

- [#7706](https://github.com/withastro/astro/pull/7706) [`4f6b5ae2b`](https://github.com/withastro/astro/commit/4f6b5ae2ba8eb162e03f25cbd600a905d434f529) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix Markdoc integration not being able to import `emitESMImage` from Astro

- [#7694](https://github.com/withastro/astro/pull/7694) [`06c255716`](https://github.com/withastro/astro/commit/06c255716ae8e922fb9d4ffa5595cbb34146fff6) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix route matching behavior when `getStaticPaths` result includes hyphenated params

## 2.8.4

### Patch Changes

- [#7680](https://github.com/withastro/astro/pull/7680) [`cc8e9de88`](https://github.com/withastro/astro/commit/cc8e9de88179d2ed4b70980c60b41448db393429) Thanks [@ematipico](https://github.com/ematipico)! - Throw an error when `build.split` is set to `true` but `output` isn't set to `"server"`.

- [#7679](https://github.com/withastro/astro/pull/7679) [`1a6f833c4`](https://github.com/withastro/astro/commit/1a6f833c404ba2e64e3497929b64c863b5a348c8) Thanks [@bluwy](https://github.com/bluwy)! - Handle inlining non-string boolean environment variables

- [#7691](https://github.com/withastro/astro/pull/7691) [`cc0f81c04`](https://github.com/withastro/astro/commit/cc0f81c040e912cff0c09e89327ef1655f96b67d) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix not being able to build on Vercel Edge when `astro:assets` was enabled even when using a non-Node image service

## 2.8.3

### Patch Changes

- [#7637](https://github.com/withastro/astro/pull/7637) [`af5827d4f`](https://github.com/withastro/astro/commit/af5827d4f7af9437c0c3fcff5c0239577aa68498) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `astro:assets` not respecting EXIF rotation

- [#7644](https://github.com/withastro/astro/pull/7644) [`213e10991`](https://github.com/withastro/astro/commit/213e10991af337a7c4fd38c39be5c266c16fa600) Thanks [@matthewp](https://github.com/matthewp)! - Fix for allowing the root path / as a redirect

- [#7644](https://github.com/withastro/astro/pull/7644) [`213e10991`](https://github.com/withastro/astro/commit/213e10991af337a7c4fd38c39be5c266c16fa600) Thanks [@matthewp](https://github.com/matthewp)! - Fix static redirects preferred over dynamic regular routes

- [#7643](https://github.com/withastro/astro/pull/7643) [`4b82e55cf`](https://github.com/withastro/astro/commit/4b82e55cf15899babb61128a7393362e667ff724) Thanks [@alvinometric](https://github.com/alvinometric)! - Add support for using `.svg` files with `astro:assets`'s base services. The SVGs will NOT be processed and will be return as-is, however, proper attributes, alt enforcement etc will all work correctly.

## 2.8.2

### Patch Changes

- [#7623](https://github.com/withastro/astro/pull/7623) [`86e19c7cf`](https://github.com/withastro/astro/commit/86e19c7cf8696e065c1ccdc2eb841ad0a2b61ede) Thanks [@matthewp](https://github.com/matthewp)! - Allow our Response wrapper to be cloneable

## 2.8.1

### Patch Changes

- [#7611](https://github.com/withastro/astro/pull/7611) [`904921cbe`](https://github.com/withastro/astro/commit/904921cbe44e168477c751774a2e01a6cc972a16) Thanks [@bluwy](https://github.com/bluwy)! - Ignore content .json files prefixed with underscores (regression)

- [#7618](https://github.com/withastro/astro/pull/7618) [`3669e2d27`](https://github.com/withastro/astro/commit/3669e2d2762bf8a4909be00ed212a6c5e847eedf) Thanks [@ematipico](https://github.com/ematipico)! - Add a fallback label if `astro info` command can't determine the package manager used.

- [#7620](https://github.com/withastro/astro/pull/7620) [`831dfd151`](https://github.com/withastro/astro/commit/831dfd1516c8b900ec4a0c151a40121655cdedc6) Thanks [@delucis](https://github.com/delucis)! - Filter out `astro` from integration peer dependencies when running `astro add`

## 2.8.0

### Minor Changes

- [#7532](https://github.com/withastro/astro/pull/7532) [`9e5fafa2b`](https://github.com/withastro/astro/commit/9e5fafa2b25b5128084c7072aa282642fcfbb14b) Thanks [@ematipico](https://github.com/ematipico)! - The `astro/middleware` module exports a new utility called `trySerializeLocals`.

  This utility can be used by adapters to validate their `locals` before sending it
  to the Astro middleware.

  This function will throw a runtime error if the value passed is not serializable, so
  consumers will need to handle that error.

- [#7532](https://github.com/withastro/astro/pull/7532) [`9e5fafa2b`](https://github.com/withastro/astro/commit/9e5fafa2b25b5128084c7072aa282642fcfbb14b) Thanks [@ematipico](https://github.com/ematipico)! - Astro exposes the middleware file path to the integrations in the hook `astro:build:ssr`

  ```ts
  // myIntegration.js
  import type { AstroIntegration } from 'astro';
  function integration(): AstroIntegration {
    return {
      name: 'fancy-astro-integration',
      hooks: {
        'astro:build:ssr': ({ middlewareEntryPoint }) => {
          if (middlewareEntryPoint) {
            // do some operations
          }
        },
      },
    };
  }
  ```

  The `middlewareEntryPoint` is only defined if the user has created an Astro middleware.

- [#7432](https://github.com/withastro/astro/pull/7432) [`6e9c29579`](https://github.com/withastro/astro/commit/6e9c295799cb6524841adbcbec21ff628d8d19c8) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new command `astro info`, useful for sharing debugging information about your current environment when you need help!

  ```shell
  astro info
  ```

  Output

  ```
  Astro version            v2.6.6
  Package manager          pnpm
  Platform                 darwin
  Architecture             arm64
  Adapter                  @astrojs/vercel/serverless
  Integrations             None
  ```

- [#7532](https://github.com/withastro/astro/pull/7532) [`9e5fafa2b`](https://github.com/withastro/astro/commit/9e5fafa2b25b5128084c7072aa282642fcfbb14b) Thanks [@ematipico](https://github.com/ematipico)! - The `astro/middleware` module exports a new API called `createContext`.

  This a low-level API that adapters can use to create a context that can be consumed by middleware functions.

- [#7532](https://github.com/withastro/astro/pull/7532) [`9e5fafa2b`](https://github.com/withastro/astro/commit/9e5fafa2b25b5128084c7072aa282642fcfbb14b) Thanks [@ematipico](https://github.com/ematipico)! - Introduced a new build option for SSR, called `build.excludeMiddleware`.

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    build: {
      excludeMiddleware: true,
    },
  });
  ```

  When enabled, the code that belongs to be middleware **won't** be imported
  by the final pages/entry points. The user is responsible for importing it and
  calling it manually.

### Patch Changes

- [#7532](https://github.com/withastro/astro/pull/7532) [`9e5fafa2b`](https://github.com/withastro/astro/commit/9e5fafa2b25b5128084c7072aa282642fcfbb14b) Thanks [@ematipico](https://github.com/ematipico)! - Correctly track the middleware during the SSR build.

## 2.7.4

### Patch Changes

- [#7544](https://github.com/withastro/astro/pull/7544) [`47b756e3e`](https://github.com/withastro/astro/commit/47b756e3e11703387407692e189f34c31f8565d6) Thanks [@johannesspohr](https://github.com/johannesspohr)! - Batch async iterator buffering to reduce numbers of calls to `setTimeout`

- [#7565](https://github.com/withastro/astro/pull/7565) [`5ffdec758`](https://github.com/withastro/astro/commit/5ffdec758061b55a328d2e8037684c3b2f1e0184) Thanks [@bluwy](https://github.com/bluwy)! - Fix style crawling logic for CSS HMR

## 2.7.3

### Patch Changes

- [#7527](https://github.com/withastro/astro/pull/7527) [`9e2426f75`](https://github.com/withastro/astro/commit/9e2426f75637a6318961f483de90b635f3fdadeb) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Default registry logic to fallback to NPM if registry command fails (sorry, Bun users!)

- [#7542](https://github.com/withastro/astro/pull/7542) [`cdc28326c`](https://github.com/withastro/astro/commit/cdc28326cf21f305924363e9c8c02ce54b6ff895) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix bug when using `define:vars` with a `style` object

- [#7521](https://github.com/withastro/astro/pull/7521) [`19c2d43ea`](https://github.com/withastro/astro/commit/19c2d43ea41efdd8741007de0774e7e394f174b0) Thanks [@knpwrs](https://github.com/knpwrs)! - Add `Props` generic for `APIRoute` type

- [#7531](https://github.com/withastro/astro/pull/7531) [`2172dd4f0`](https://github.com/withastro/astro/commit/2172dd4f0dd8f87d1adbc5ae90f44724e66eb964) Thanks [@wackbyte](https://github.com/wackbyte)! - Fix serialization of `undefined` in framework component props

- [#7539](https://github.com/withastro/astro/pull/7539) [`1170877b5`](https://github.com/withastro/astro/commit/1170877b51aaa13203e8c488dcf4e39d1b5553ee) Thanks [@jc1144096387](https://github.com/jc1144096387)! - Update registry logic, improving edge cases (http support, redirects, registries ending with '/')

## 2.7.2

### Patch Changes

- [#7273](https://github.com/withastro/astro/pull/7273) [`6dfd7081b`](https://github.com/withastro/astro/commit/6dfd7081b7a1532ab0fe3af8bcf079b10a5640a9) Thanks [@bluwy](https://github.com/bluwy)! - Fix error stacktrace from Vite SSR runtime

- [#7370](https://github.com/withastro/astro/pull/7370) [`83016795e`](https://github.com/withastro/astro/commit/83016795e9e149bc64e2441d477cf8c65ef5a117) Thanks [@bluwy](https://github.com/bluwy)! - Simplify nested hydration flow

- [#7488](https://github.com/withastro/astro/pull/7488) [`d3247851f`](https://github.com/withastro/astro/commit/d3247851f04e911c134cfedc22db17b7d61c53d9) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Pass `compressHTML` setting to server adapters

- [#7491](https://github.com/withastro/astro/pull/7491) [`a3928016c`](https://github.com/withastro/astro/commit/a3928016cc375842cf47e7a227835cd17e48a409) Thanks [@bluwy](https://github.com/bluwy)! - Fix CSS error line offset

- [#7494](https://github.com/withastro/astro/pull/7494) [`2726098bc`](https://github.com/withastro/astro/commit/2726098bc82f910edda4198b9fb94f2bfd048976) Thanks [@itsmatteomanf](https://github.com/itsmatteomanf)! - Replaces the instance of `setTimeout()` in the runtime to use `queueMicrotask()`, to resolve limitations on Cloudflare Workers.

- [#7509](https://github.com/withastro/astro/pull/7509) [`f4fea3b02`](https://github.com/withastro/astro/commit/f4fea3b02b0737053c7c7521a7d4dd235648918a) Thanks [@ematipico](https://github.com/ematipico)! - Correctly emit pre-rendered pages when `build.split` is set to `true`

## 2.7.1

### Patch Changes

- [#7490](https://github.com/withastro/astro/pull/7490) [`601403744`](https://github.com/withastro/astro/commit/60140374418ff0ee80899615be8e718ae57f791a) Thanks [@ematipico](https://github.com/ematipico)! - Fix the URL that belongs to `entryPoints` in the hook `astro:build:ssr`. The paths were created with the wrong output directory.

- [#7459](https://github.com/withastro/astro/pull/7459) [`869197aaf`](https://github.com/withastro/astro/commit/869197aafd9802d059dd8db1ef23794fdd938a91) Thanks [@bluwy](https://github.com/bluwy)! - Fix missing styles for Markdoc files in development

- [#7440](https://github.com/withastro/astro/pull/7440) [`2b7539952`](https://github.com/withastro/astro/commit/2b75399520bebfc537cca8204e483f0df3373904) Thanks [@bluwy](https://github.com/bluwy)! - Remove `slash` package

- [#7476](https://github.com/withastro/astro/pull/7476) [`478cd9d8f`](https://github.com/withastro/astro/commit/478cd9d8fa9452466a73e0981863ef6e82f87238) Thanks [@hirasso](https://github.com/hirasso)! - Allow astro to be installed underneath a folder with leading slashes

- [#7479](https://github.com/withastro/astro/pull/7479) [`57e603038`](https://github.com/withastro/astro/commit/57e603038fa51f5cf023c086705e2ced67434b38) Thanks [@bluwy](https://github.com/bluwy)! - Handle esbuild 0.18 changes

- [#7381](https://github.com/withastro/astro/pull/7381) [`f359d77b1`](https://github.com/withastro/astro/commit/f359d77b1844335ceeb103b9d3753eb2f440ed5f) Thanks [@matthewp](https://github.com/matthewp)! - Prevent accidental inclusion of page CSS in dev mode

- Updated dependencies [[`2b7539952`](https://github.com/withastro/astro/commit/2b75399520bebfc537cca8204e483f0df3373904)]:
  - @astrojs/internal-helpers@0.1.1

## 2.7.0

### Minor Changes

- [#7353](https://github.com/withastro/astro/pull/7353) [`76fcdb84d`](https://github.com/withastro/astro/commit/76fcdb84dd828ac373b2dc739e57fadf650820fd) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove legacy handling for MDX content collections. Ensure you are using `@astrojs/mdx` v0.18 or above.

- [#7385](https://github.com/withastro/astro/pull/7385) [`8e2923cc6`](https://github.com/withastro/astro/commit/8e2923cc6219eda01ca2c749f5c7fa2fe4319455) Thanks [@ematipico](https://github.com/ematipico)! - `Astro.locals` is now exposed to the adapter API. Node Adapter can now pass in a `locals` object in the SSR handler middleware.

- [#7220](https://github.com/withastro/astro/pull/7220) [`459b5bd05`](https://github.com/withastro/astro/commit/459b5bd05f562238f7250520efe3cf0fa156bb45) Thanks [@ematipico](https://github.com/ematipico)! - Shipped a new SSR build configuration mode: `split`.
  When enabled, Astro will "split" the single `entry.mjs` file and instead emit a separate file to render each individual page during the build process.

  These files will be emitted inside `dist/pages`, mirroring the directory structure of your page files in `src/pages/`, for example:

  ```
  ├── pages
  │   ├── blog
  │   │   ├── entry._slug_.astro.mjs
  │   │   └── entry.about.astro.mjs
  │   └── entry.index.astro.mjs
  ```

  To enable, set `build.split: true` in your Astro config:

  ```js
  // src/astro.config.mjs
  export default defineConfig({
    output: 'server',
    adapter: node({
      mode: 'standalone',
    }),
    build: {
      split: true,
    },
  });
  ```

- [#7220](https://github.com/withastro/astro/pull/7220) [`459b5bd05`](https://github.com/withastro/astro/commit/459b5bd05f562238f7250520efe3cf0fa156bb45) Thanks [@ematipico](https://github.com/ematipico)! - The Astro hook `astro:build:ssr` now receives a new option in their payload, called `entryPoints`.

  `entryPoints` is defined as a `Map<RouteData, URL>`, where `RouteData` represents the information of a Astro route and `URL` is the path to the physical file emitted at the end of the build.

  ```ts
  export function integration(): AstroIntegration {
    return {
      name: 'my-integration',
      hooks: {
        'astro:build:ssr': ({ entryPoints }) => {
          // do something with `entryPoints`
        },
      },
    };
  }
  ```

### Patch Changes

- [#7438](https://github.com/withastro/astro/pull/7438) [`30bb36371`](https://github.com/withastro/astro/commit/30bb363713e3d2c50d0d4816d970aa93b836a3b0) Thanks [@bluwy](https://github.com/bluwy)! - Fix `astro:build:setup` hook `updateConfig` utility, where the configuration wasn't correctly updated when the hook was fired.

- [#7436](https://github.com/withastro/astro/pull/7436) [`3943fa390`](https://github.com/withastro/astro/commit/3943fa390a0bd41317a673d0f841e0461c7499cd) Thanks [@kossidts](https://github.com/kossidts)! - Fix an issue related to the documentation. Destructure the argument of the function to customize the Astro dev server based on the command run.

- [#7424](https://github.com/withastro/astro/pull/7424) [`7877a06d8`](https://github.com/withastro/astro/commit/7877a06d829305eed356fbb8bfd1ef578cd5466e) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update internal types for more stable builds for Astro maintainers.

- [#7427](https://github.com/withastro/astro/pull/7427) [`e314a04bf`](https://github.com/withastro/astro/commit/e314a04bfbf0526838b7c9aac452251b27d69719) Thanks [@ematipico](https://github.com/ematipico)! - Correctly emit the middleware code during the build phase. The file emitted is now `dist/middleware.mjs`

- [#7423](https://github.com/withastro/astro/pull/7423) [`33cdc8622`](https://github.com/withastro/astro/commit/33cdc8622a56c8e5465b7a50f627ecc568870c6b) Thanks [@bmenant](https://github.com/bmenant)! - Ensure injected `/_image` endpoint for image optimization is not prerendered on hybrid output.

## 2.6.6

### Patch Changes

- [#7418](https://github.com/withastro/astro/pull/7418) [`2b34fc492`](https://github.com/withastro/astro/commit/2b34fc49282cbf5bf89de46359b51a67a5c4b8bb) Thanks [@ematipico](https://github.com/ematipico)! - Correctly type the option `server.open`

- [#7429](https://github.com/withastro/astro/pull/7429) [`89a483520`](https://github.com/withastro/astro/commit/89a4835202f05d9571aeb42740dbe907a8afc28b) Thanks [@delucis](https://github.com/delucis)! - Fix telemetry reporting for integrations that return an array

## 2.6.5

### Patch Changes

- [#7414](https://github.com/withastro/astro/pull/7414) [`bb644834e`](https://github.com/withastro/astro/commit/bb644834ef03bc00048c7381f20a1c01388438e2) Thanks [@bluwy](https://github.com/bluwy)! - Simplify telemetry Vite version detection

- [#7399](https://github.com/withastro/astro/pull/7399) [`d2020c29c`](https://github.com/withastro/astro/commit/d2020c29cf285e699f92143a70ffa30a85122bb4) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix edge case where injected routes would cause builds to fail in a PNPM workspace

## 2.6.4

### Patch Changes

- [#7366](https://github.com/withastro/astro/pull/7366) [`42baf62e7`](https://github.com/withastro/astro/commit/42baf62e7ca0351a2f2c7d06ec58086f90519bb7) Thanks [@aappaapp](https://github.com/aappaapp)! - Fixed `RedirectConfig` type definition

- [#7380](https://github.com/withastro/astro/pull/7380) [`1c7b63595`](https://github.com/withastro/astro/commit/1c7b6359563f5e83325121efb2e61915d818a35a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix missing stacktraces for Zod errors

## 2.6.3

### Patch Changes

- [#7341](https://github.com/withastro/astro/pull/7341) [`491c2db42`](https://github.com/withastro/astro/commit/491c2db424434167327e780ad57b8f665498003d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Improve error message for unsupported Zod transforms from the content config.

- [#7352](https://github.com/withastro/astro/pull/7352) [`0a8d178c9`](https://github.com/withastro/astro/commit/0a8d178c90f033fbba40666c54bcfc58c53ac905) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Raise error when multiple content collection entries have the same slug

## 2.6.2

### Patch Changes

- [#7310](https://github.com/withastro/astro/pull/7310) [`52f0480d1`](https://github.com/withastro/astro/commit/52f0480d14c328ab69bd1f2681ddfd83f7385ab1) Thanks [@Edo-San](https://github.com/Edo-San)! - Fixed a bug that threw an Exception when spreading potentially undefined values as HTML attributes

- [#7339](https://github.com/withastro/astro/pull/7339) [`e3271f8c1`](https://github.com/withastro/astro/commit/e3271f8c167288dc60b94242d01d459c162ec06d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add readable error message for invalid dynamic routes.

- [#7316](https://github.com/withastro/astro/pull/7316) [`e6bff651f`](https://github.com/withastro/astro/commit/e6bff651ff80466b3e862e637d2a6a3334d8cfda) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix Zod errors getting flagged as configuration errors

- [#7342](https://github.com/withastro/astro/pull/7342) [`bbcf69e7b`](https://github.com/withastro/astro/commit/bbcf69e7b8d4bbb759fe0c7e5fd2d2ed58090b59) Thanks [@matthewp](https://github.com/matthewp)! - Fix for experimental redirects in dev mode

- [#7326](https://github.com/withastro/astro/pull/7326) [`1430ffb47`](https://github.com/withastro/astro/commit/1430ffb4734edbb67cbeaaee7e89a9f78e00473c) Thanks [@calebdwilliams](https://github.com/calebdwilliams)! - Fixes issue where Astro doesn't respect custom npm registry settings during project creation

## 2.6.1

### Patch Changes

- [#7307](https://github.com/withastro/astro/pull/7307) [`8034edd9e`](https://github.com/withastro/astro/commit/8034edd9ecf805073395ba7f68f73cd5fc4d2c73) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix [Object AsyncGenerator] appearing in markup for Markdoc documents

## 2.6.0

### Minor Changes

- [#7067](https://github.com/withastro/astro/pull/7067) [`57f8d14c0`](https://github.com/withastro/astro/commit/57f8d14c027c30919363e12c664ccff4ed64d0fc) Thanks [@matthewp](https://github.com/matthewp)! - Experimental redirects support

  This change adds support for the redirects RFC, currently in stage 3: https://github.com/withastro/roadmap/pull/587

  Now you can specify redirects in your Astro config:

  ```js
  import { defineConfig } from 'astro/config';

  export defineConfig({
    redirects: {
      '/blog/old-post': '/blog/new-post'
    }
  });
  ```

  You can also specify spread routes using the same syntax as in file-based routing:

  ```js
  import { defineConfig } from 'astro/config';

  export defineConfig({
    redirects: {
      '/blog/[...slug]': '/articles/[...slug]'
    }
  });
  ```

  By default Astro will build HTML files that contain the `<meta http-equiv="refresh">` tag. Adapters can also support redirect routes and create configuration for real HTTP-level redirects in production.

- [#7237](https://github.com/withastro/astro/pull/7237) [`414eb19d2`](https://github.com/withastro/astro/commit/414eb19d2fcb55758f9d053076773b11b62f4c97) Thanks [@bluwy](https://github.com/bluwy)! - Remove experimental flag for custom client directives

- [#7274](https://github.com/withastro/astro/pull/7274) [`b5213654b`](https://github.com/withastro/astro/commit/b5213654b1b7f3ba573a48d3be688b2bdde7870f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update base `tsconfig.json` template with `allowJs: true` to provide a better relaxed experience for users unfamiliar with TypeScript. `allowJs` is still set to `false` (its default value) when using the `strictest` preset.

- [#7180](https://github.com/withastro/astro/pull/7180) [`e3b8c6296`](https://github.com/withastro/astro/commit/e3b8c62969d680d1915a122c610d281d6711aa63) Thanks [@lilnasy](https://github.com/lilnasy)! - The Inline Stylesheets RFC is now stable!

  You can now control how Astro bundles your css with a configuration change:

  ```ts
  export default defineConfig({
      ...
      build: {
          inlineStylesheets: "auto"
      }
      ...
  })
  ```

  The options:

  - `inlineStylesheets: "never"`: This is the behavior you are familiar with. Every stylesheet is external, and added to the page via a `<link>` tag. Default.
  - `inlineStylesheets: "auto"`: Small stylesheets are inlined into `<style>` tags and inserted into `<head>`, while larger ones remain external.
  - `inlineStylesheets: "always"`: Every style required by the page is inlined.

  As always, css files in the `public` folder are not affected.

- [#7260](https://github.com/withastro/astro/pull/7260) [`39403c32f`](https://github.com/withastro/astro/commit/39403c32faea58399c61d3344b770f195be60d5b) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Unflags support for `output: 'hybrid'` mode, which enables pre-rendering by default. The additional `experimental.hybridOutput` flag can be safely removed from your configuration.

- [#7109](https://github.com/withastro/astro/pull/7109) [`101f03209`](https://github.com/withastro/astro/commit/101f032098148b3daaac8d46ff1e535b79232e43) Thanks [@ematipico](https://github.com/ematipico)! - Remove experimental flag for the middleware

### Patch Changes

- [#7296](https://github.com/withastro/astro/pull/7296) [`a7e2b37ff`](https://github.com/withastro/astro/commit/a7e2b37ff73871c46895c615846a86a539f45330) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix HTML component type causing an error when imported in the editor

- [#7294](https://github.com/withastro/astro/pull/7294) [`dd1a6b6c9`](https://github.com/withastro/astro/commit/dd1a6b6c941aeb7af934bd12db22412af262f5a1) Thanks [@matthewp](https://github.com/matthewp)! - Fix cookies not being set by middleware

- [#7197](https://github.com/withastro/astro/pull/7197) [`d72cfa7ca`](https://github.com/withastro/astro/commit/d72cfa7cad758192163712ceb269405659fd14bc) Thanks [@bluwy](https://github.com/bluwy)! - Fix nested astro-island hydration race condition

- [#7262](https://github.com/withastro/astro/pull/7262) [`144813f73`](https://github.com/withastro/astro/commit/144813f7308dcb9de64ebe3f0f2c6cba9ad81eb1) Thanks [@andremralves](https://github.com/andremralves)! - Fix injected scripts not injected to injected routes

- [#7242](https://github.com/withastro/astro/pull/7242) [`890a2bc98`](https://github.com/withastro/astro/commit/890a2bc9891a2449ab99b01b65468f6dddba6b12) Thanks [@JerryWu1234](https://github.com/JerryWu1234)! - remove the white space after the doctype according to the property compressHTML

## 2.5.7

### Patch Changes

- [#7215](https://github.com/withastro/astro/pull/7215) [`6e27f2f6d`](https://github.com/withastro/astro/commit/6e27f2f6dbd52f980c487e875faf1b066f65cffd) Thanks [@bmenant](https://github.com/bmenant)! - Node adapter fallbacks to `:authority` http2 pseudo-header when `host` is nullish.

- [#7233](https://github.com/withastro/astro/pull/7233) [`96ae37eb0`](https://github.com/withastro/astro/commit/96ae37eb09f7406f40fba93e14b2a26ccd46640c) Thanks [@bluwy](https://github.com/bluwy)! - Fix `getViteConfig` and Vitest setup with content collections

- [#7136](https://github.com/withastro/astro/pull/7136) [`fea306936`](https://github.com/withastro/astro/commit/fea30693609cc517d8660972151f4d12a0dd4e82) Thanks [@johannesspohr](https://github.com/johannesspohr)! - Render arrays of components in parallel

- [#7257](https://github.com/withastro/astro/pull/7257) [`5156c4f90`](https://github.com/withastro/astro/commit/5156c4f90e0922f62d25fa0c82bbefae39f4c2b6) Thanks [@thiti-y](https://github.com/thiti-y)! - fix: build fail upon have 'process.env' in \*.md file.

- [#7268](https://github.com/withastro/astro/pull/7268) [`9e7366567`](https://github.com/withastro/astro/commit/9e7366567e2b83d46a46db35e74ad508d1978039) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: ignore `.json` files within content collection directories starting with an `_` underscore.

- [#7185](https://github.com/withastro/astro/pull/7185) [`339529fc8`](https://github.com/withastro/astro/commit/339529fc820bac2d514b63198ecf54a1d88c0917) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Bring back improved style and script handling across content collection files. This addresses bugs found in a previous release to `@astrojs/markdoc`.

## 2.5.6

### Patch Changes

- [#7193](https://github.com/withastro/astro/pull/7193) [`8b041bf57`](https://github.com/withastro/astro/commit/8b041bf57c76830c4070330270521e05d8e58474) Thanks [@ematipico](https://github.com/ematipico)! - Refactor how pages are emitted during the internal bundling. Now each
  page is emitted as a separate entry point.

- [#7218](https://github.com/withastro/astro/pull/7218) [`6c7df28ab`](https://github.com/withastro/astro/commit/6c7df28ab34b756b8426443bf6976e24d4611a62) Thanks [@bluwy](https://github.com/bluwy)! - Fix CSS deduping and missing chunks

- [#7235](https://github.com/withastro/astro/pull/7235) [`ee2aca80a`](https://github.com/withastro/astro/commit/ee2aca80a71afe843af943b11966fcf77f556cfb) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Prioritize dynamic prerendered routes over dynamic server routes

- [#7192](https://github.com/withastro/astro/pull/7192) [`7851f9258`](https://github.com/withastro/astro/commit/7851f9258fae2f54795470253df9ce4bcd5f9cb0) Thanks [@ematipico](https://github.com/ematipico)! - Detect `mdx` files using their full extension

- [#7244](https://github.com/withastro/astro/pull/7244) [`bef3a75db`](https://github.com/withastro/astro/commit/bef3a75dbc48d584daff9f7f3d5a8937b0356170) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove the auto-generated `$entry` variable for Markdoc entries. To access frontmatter as a variable, you can pass `entry.data` as a prop where you render your content:

  ```astro
  ---
  import { getEntry } from 'astro:content';

  const entry = await getEntry('docs', 'why-markdoc');
  const { Content } = await entry.render();
  ---

  <Content frontmatter={entry.data} />
  ```

- [#7204](https://github.com/withastro/astro/pull/7204) [`52af9ad18`](https://github.com/withastro/astro/commit/52af9ad18840ffa4e2996386c82cbe34d9fd076a) Thanks [@bluwy](https://github.com/bluwy)! - Add error message if `Astro.glob` is called outside of an Astro file

- [#7246](https://github.com/withastro/astro/pull/7246) [`f5063d0a0`](https://github.com/withastro/astro/commit/f5063d0a01e3179da902fdc0a2b22f88cb3c95c7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix content collection build errors for empty collections or underscore files of type `.json`.

- [#7062](https://github.com/withastro/astro/pull/7062) [`cf621340b`](https://github.com/withastro/astro/commit/cf621340b00fda441f4ef43196c0363d09eae70c) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - fix miss a head when the templaterender has a promise

- [#7189](https://github.com/withastro/astro/pull/7189) [`2bda7fb0b`](https://github.com/withastro/astro/commit/2bda7fb0bce346f7725086980e1648e2636bbefb) Thanks [@elevatebart](https://github.com/elevatebart)! - fix: add astro-static-slot to the list of inert tags in astro css

- [#7219](https://github.com/withastro/astro/pull/7219) [`af3c5a2e2`](https://github.com/withastro/astro/commit/af3c5a2e25bd3e7b2a3f7f08e41ee457093c8cb1) Thanks [@bluwy](https://github.com/bluwy)! - Use `AstroError` for `Astro.glob` errors

- [#7139](https://github.com/withastro/astro/pull/7139) [`f2f18b440`](https://github.com/withastro/astro/commit/f2f18b44055c6334a39d6379de88fe41e518aa1e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - The `src` property returned by ESM importing images with `astro:assets` is now an absolute path, unlocking support for importing images outside the project.

- Updated dependencies [[`bf63f615f`](https://github.com/withastro/astro/commit/bf63f615fc1b97d6fb84db55f7639084e3ada5af)]:
  - @astrojs/webapi@2.2.0

## 2.5.5

### Patch Changes

- [#6832](https://github.com/withastro/astro/pull/6832) [`904131aec`](https://github.com/withastro/astro/commit/904131aec3bacb2824ad60457a45772eba27b5ab) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - fix a bug when Fragment is as a slot

- [#7178](https://github.com/withastro/astro/pull/7178) [`57e65d247`](https://github.com/withastro/astro/commit/57e65d247f67de61bcc3a585c2254feb61ed2e74) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: revert Markdoc asset bleed changes. Production build issues were discovered that deserve a different fix.

## 2.5.4

### Patch Changes

- [#7125](https://github.com/withastro/astro/pull/7125) [`4ce8bf7c6`](https://github.com/withastro/astro/commit/4ce8bf7c62d2b19ff7bd3dd0fbad88fcac10feaa) Thanks [@bluwy](https://github.com/bluwy)! - Make vite-plugin-content-virtual-mod run `getEntrySlug` 10 at a time to prevent `EMFILE: too many open files` error

- [#7166](https://github.com/withastro/astro/pull/7166) [`626dd41d0`](https://github.com/withastro/astro/commit/626dd41d0a80155f59962e3a1b70d8dfd2719d25) Thanks [@ematipico](https://github.com/ematipico)! - Move generation of renderers code into their own file

- [#7174](https://github.com/withastro/astro/pull/7174) [`92d1f017e`](https://github.com/withastro/astro/commit/92d1f017e5c0a921973e028b90c7975e74dce433) Thanks [@ematipico](https://github.com/ematipico)! - Remove restriction around serialisable data for `Astro.locals`

- [#7172](https://github.com/withastro/astro/pull/7172) [`2ca94269e`](https://github.com/withastro/astro/commit/2ca94269ed0b5046033c47985ef50b7e7a637caf) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add types for `import.meta.env.ASSETS_PREFIX` and `import.meta.env.SITE`

- [#7134](https://github.com/withastro/astro/pull/7134) [`5b6a0312a`](https://github.com/withastro/astro/commit/5b6a0312a822565404a6334576677fc574cfcd56) Thanks [@alexvuka1](https://github.com/alexvuka1)! - value of var can be undefined when using `define:vars`

- [#7171](https://github.com/withastro/astro/pull/7171) [`79ba74832`](https://github.com/withastro/astro/commit/79ba74832fc46e6946c8235c33e9acfbb3a4139b) Thanks [@bluwy](https://github.com/bluwy)! - Prevent Vite watching on Astro config load

## 2.5.3

### Patch Changes

- [#6758](https://github.com/withastro/astro/pull/6758) [`f558a9e20`](https://github.com/withastro/astro/commit/f558a9e2056fc8f2e2d5814e74f199e398159fc4) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Improve style and script handling across content collection files. This addresses style bleed present in `@astrojs/markdoc` v0.1.0

- [#7143](https://github.com/withastro/astro/pull/7143) [`b41963b77`](https://github.com/withastro/astro/commit/b41963b775149b802eea9e12c5fe266bb9a02944) Thanks [@johannesspohr](https://github.com/johannesspohr)! - Render 404 page content when a `Response` with status 404 is returned from a page

## 2.5.2

### Patch Changes

- [#7144](https://github.com/withastro/astro/pull/7144) [`ba0636240`](https://github.com/withastro/astro/commit/ba0636240996f9f082d122a8414240196881cb96) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed an issue where scripts that weren't safe to inline were inlined.

- [#7150](https://github.com/withastro/astro/pull/7150) [`8f418d13c`](https://github.com/withastro/astro/commit/8f418d13c5d5c9c40f05020205f24380b718654b) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - fix no matched path when using `getStaticPaths` without `prerender` export.

## 2.5.1

### Patch Changes

- [#7128](https://github.com/withastro/astro/pull/7128) [`72f686a68`](https://github.com/withastro/astro/commit/72f686a68930de52f9a274c13c98acad59925b31) Thanks [@johannesspohr](https://github.com/johannesspohr)! - Fix routes created by `injectRoute` for SSR

- [#7132](https://github.com/withastro/astro/pull/7132) [`319a0a7a0`](https://github.com/withastro/astro/commit/319a0a7a0a6a950387c942b467746d590bb32fda) Thanks [@ematipico](https://github.com/ematipico)! - Emit middleware as an entrypoint during build

- [#7036](https://github.com/withastro/astro/pull/7036) [`852d59a8d`](https://github.com/withastro/astro/commit/852d59a8d68e124f10852609e0f1619d5838ac76) Thanks [@ematipico](https://github.com/ematipico)! - Emit pages as dynamic import chunks during the build

- [#7126](https://github.com/withastro/astro/pull/7126) [`530fb9ebe`](https://github.com/withastro/astro/commit/530fb9ebee77646921ec29d45d9b66484bdfb521) Thanks [@bluwy](https://github.com/bluwy)! - Add route information when warning of `getStaticPaths()` ignored

- [#7118](https://github.com/withastro/astro/pull/7118) [`3257dd289`](https://github.com/withastro/astro/commit/3257dd28901c785a6a661211b98c5ef2cb3b9aa4) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix unnecessary warning showing on start when a collection folder was empty. The warning was also enhanced to add more information about possible causes.

## 2.5.0

### Minor Changes

- [#7071](https://github.com/withastro/astro/pull/7071) [`e186ecc5e`](https://github.com/withastro/astro/commit/e186ecc5e292de8c6a2c441a2d588512c0813068) Thanks [@johannesspohr](https://github.com/johannesspohr)! - Render sibling components in parallel

- [#6850](https://github.com/withastro/astro/pull/6850) [`c6d7ebefd`](https://github.com/withastro/astro/commit/c6d7ebefdd554a9ef29cfeb426ac55cab80d6473) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Content collections now support data formats including JSON and YAML. You can also create relationships, or references, between collections to pull information from one collection entry into another. Learn more on our [updated Content Collections docs](https://docs.astro.build/en/guides/content-collections/).

- [#6991](https://github.com/withastro/astro/pull/6991) [`719002ca5`](https://github.com/withastro/astro/commit/719002ca5b128744fb4316d4a52c5dcd46a42759) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Enable experimental support for hybrid SSR with pre-rendering enabled by default

  **astro.config.mjs**

  ```js
  import { defineConfig } from 'astro/config';
  export default defineConfig({
    output: 'hybrid',
    experimental: {
      hybridOutput: true,
    },
  });
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

- [#7074](https://github.com/withastro/astro/pull/7074) [`73ec6f6c1`](https://github.com/withastro/astro/commit/73ec6f6c16cadb71dafe9f664f0debde072c3173) Thanks [@bluwy](https://github.com/bluwy)! - Integrations can add new `client:` directives through the `astro:config:setup` hook's `addClientDirective()` API. To enable this API, the user needs to set `experimental.customClientDirectives` to `true` in their config.

  ```js
  import { defineConfig } from 'astro/config';
  import onClickDirective from 'astro-click-directive';

  export default defineConfig({
    integrations: [onClickDirective()],
    experimental: {
      customClientDirectives: true,
    },
  });
  ```

  ```js
  export default function onClickDirective() {
    return {
      hooks: {
        'astro:config:setup': ({ addClientDirective }) => {
          addClientDirective({
            name: 'click',
            entrypoint: 'astro-click-directive/click.js',
          });
        },
      },
    };
  }
  ```

  ```astro
  <Counter client:click />
  ```

  The client directive file (e.g. `astro-click-directive/click.js`) should export a function of type `ClientDirective`:

  ```ts
  import type { ClientDirective } from 'astro';

  const clickDirective: ClientDirective = (load, opts, el) => {
    window.addEventListener(
      'click',
      async () => {
        const hydrate = await load();
        await hydrate();
      },
      { once: true },
    );
  };

  export default clickDirective;
  ```

- [#6706](https://github.com/withastro/astro/pull/6706) [`763ff2d1e`](https://github.com/withastro/astro/commit/763ff2d1e44f54b899d7c65386f1b4b877c95737) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - Adds an opt-in way to minify the HTML output.

  Using the `compressHTML` option Astro will remove whitespace from Astro components. This only applies to components written in `.astro` format and happens in the compiler to maximize performance. You can enable with:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    compressHTML: true,
  });
  ```

  Compression occurs both in development mode and in the final build.

- [#7069](https://github.com/withastro/astro/pull/7069) [`c1669c001`](https://github.com/withastro/astro/commit/c1669c0011eecfe65a459d727848c18c189a54ca) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Added `Polymorphic` type helper to `astro/types` to easily create polymorphic components:

  ```astro
  ---
  import { HTMLTag, Polymorphic } from 'astro/types';

  type Props<Tag extends HTMLTag> = Polymorphic<{ as: Tag }>;

  const { as: Tag, ...props } = Astro.props;
  ---

  <Tag {...props} />
  ```

- [#7093](https://github.com/withastro/astro/pull/7093) [`3d525efc9`](https://github.com/withastro/astro/commit/3d525efc95cfb2deb5d9e04856d02965d66901c9) Thanks [@matthewp](https://github.com/matthewp)! - Prevent removal of nested slots within islands

  This change introduces a new flag that renderers can add called `supportsAstroStaticSlot`. What this does is let Astro know that the render is sending `<astro-static-slot>` as placeholder values for static (non-hydrated) slots which Astro will then remove.

  This change is completely backwards compatible, but fixes bugs caused by combining ssr-only and client-side framework components like so:

  ```astro
  <Component>
    <div>
      <Component client:load>
        <span>Nested</span>
      </Component>
    </div>
  </Component>
  ```

### Patch Changes

- [#7102](https://github.com/withastro/astro/pull/7102) [`4516d7b22`](https://github.com/withastro/astro/commit/4516d7b22c5979cde4537f196b53ae2826ba9561) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix image services not being usable on Edge runtimes

- [#7044](https://github.com/withastro/astro/pull/7044) [`914c439bc`](https://github.com/withastro/astro/commit/914c439bccee9fec002c6d92beaa501c398e62ac) Thanks [@Steffan153](https://github.com/Steffan153)! - Escape closing script tag with `define:vars`

- [#6851](https://github.com/withastro/astro/pull/6851) [`e9fc2c221`](https://github.com/withastro/astro/commit/e9fc2c2213036d47cd30a47a6cdad5633481a0f8) Thanks [@timozander](https://github.com/timozander)! - Added warning message when using unsupported file extensions in pages/

- [#7106](https://github.com/withastro/astro/pull/7106) [`075eee08f`](https://github.com/withastro/astro/commit/075eee08f2e2b0baea008b97f3523f2cb937ee44) Thanks [@ematipico](https://github.com/ematipico)! - Fix middleware for API endpoints that use `Response`, and log a warning for endpoints that don't use `Response`.

- [#7110](https://github.com/withastro/astro/pull/7110) [`fc52681ba`](https://github.com/withastro/astro/commit/fc52681ba2f8fe8bcd92eeedf3c6a52fd86a390e) Thanks [@delucis](https://github.com/delucis)! - Fix formatting in the `NoMatchingRenderer` error message.

- [#7095](https://github.com/withastro/astro/pull/7095) [`fb84622af`](https://github.com/withastro/astro/commit/fb84622af04f795de8d17f24192de105f70fe910) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Generate heading `id`s and populate the `headings` property for all Markdoc files

- [#7011](https://github.com/withastro/astro/pull/7011) [`cada10a46`](https://github.com/withastro/astro/commit/cada10a466f81f8edb0aa664f9cffdb6b5b8f307) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Throw an error when unknown experimental keys are present

- [#7091](https://github.com/withastro/astro/pull/7091) [`cd410c5eb`](https://github.com/withastro/astro/commit/cd410c5eb71f825259279c27c4c39d0ad282c3f0) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Fix double prepended forward slash in SSR

- [#7108](https://github.com/withastro/astro/pull/7108) [`410428672`](https://github.com/withastro/astro/commit/410428672ed97bba7ca0b3352c1a7ee564921462) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix imports using ?raw and ?url not working when `experimental.assets` is enabled

- Updated dependencies [[`826e02890`](https://github.com/withastro/astro/commit/826e0289005f645b902375b98d5549c6a95ccafa)]:
  - @astrojs/markdown-remark@2.2.1

## 2.4.5

### Patch Changes

- [#7000](https://github.com/withastro/astro/pull/7000) [`c87d42e76`](https://github.com/withastro/astro/commit/c87d42e766d02db5352671cbf074dd637bdb23e0) Thanks [@craigjennings11](https://github.com/craigjennings11)! - Remove 'paths' requirement for tsconfig path aliasing

- [#7055](https://github.com/withastro/astro/pull/7055) [`4f1073a6a`](https://github.com/withastro/astro/commit/4f1073a6a4f3e5a4fc9df96a2ae59f2e929703fe) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix astro:assets interfering with SSR query params ending with image extensions

## 2.4.4

### Patch Changes

- [#7047](https://github.com/withastro/astro/pull/7047) [`48395c815`](https://github.com/withastro/astro/commit/48395c81522f7527126699c4f185f7b4488a4b9a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `/_image` endpoint not being prefixed with the `base` path in build SSR

- [#6916](https://github.com/withastro/astro/pull/6916) [`630f8c8ef`](https://github.com/withastro/astro/commit/630f8c8ef68fedfa393899c13a072e50145895e8) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add fast lookups for content collection entries when using `getEntryBySlug()`. This generates a lookup map to ensure O(1) retrieval.

## 2.4.3

### Patch Changes

- [#7034](https://github.com/withastro/astro/pull/7034) [`c00997033`](https://github.com/withastro/astro/commit/c0099703338cf81e2b381e6e754c73b442db4eab) Thanks [@bluwy](https://github.com/bluwy)! - Fix `astro:assets` SSR error

- [#7032](https://github.com/withastro/astro/pull/7032) [`157357e1f`](https://github.com/withastro/astro/commit/157357e1fb6ff2c14a717230cc485fb76a3fea03) Thanks [@raulfdm](https://github.com/raulfdm)! - fix middleware typing export for "moduleResolution: node"

## 2.4.2

### Patch Changes

- [#7009](https://github.com/withastro/astro/pull/7009) [`1d4db68e6`](https://github.com/withastro/astro/commit/1d4db68e64b7c3faf8863bf67f8332aa28e2f34b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix types from `astro/client` not working properly due to `client-base.d.ts` being an non-ambient declaration file

- [#7010](https://github.com/withastro/astro/pull/7010) [`e9f0dd9b4`](https://github.com/withastro/astro/commit/e9f0dd9b473c4793c958a6c81e743fd9b02b4f64) Thanks [@ematipico](https://github.com/ematipico)! - Call `next()` without return anything should work, with a warning

## 2.4.1

### Patch Changes

- [#6995](https://github.com/withastro/astro/pull/6995) [`71332cf96`](https://github.com/withastro/astro/commit/71332cf9697755884e5e2e63d6d2499cc2c5edd1) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Move sharpImageService and squooshImageService functions to `astro/config` so they can be imported

## 2.4.0

### Minor Changes

- [#6990](https://github.com/withastro/astro/pull/6990) [`818252acd`](https://github.com/withastro/astro/commit/818252acda3c00499cea51ffa0f26d4c2ccd3a02) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Generated optimized images are now cached inside the `node_modules/.astro/assets` folder. The cached images will be used to avoid doing extra work and speed up subsequent builds.

- [#6659](https://github.com/withastro/astro/pull/6659) [`80e3d4d3d`](https://github.com/withastro/astro/commit/80e3d4d3d0f7719d8eae5435bba3805503057511) Thanks [@lilnasy](https://github.com/lilnasy)! - Implement Inline Stylesheets RFC as experimental

- [#6771](https://github.com/withastro/astro/pull/6771) [`3326492b9`](https://github.com/withastro/astro/commit/3326492b94f76ed2b0154dd9b9a1a9eb883c1e31) Thanks [@matthewp](https://github.com/matthewp)! - Implements a new class-based scoping strategy

  This implements the [Scoping RFC](https://github.com/withastro/roadmap/pull/543), providing a way to opt in to increased style specificity for Astro component styles.

  This prevents bugs where global styles override Astro component styles due to CSS ordering and the use of element selectors.

  To enable class-based scoping, you can set it in your config:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    scopedStyleStrategy: 'class',
  });
  ```

  Note that the 0-specificity `:where` pseudo-selector is still the default strategy. The intent is to change `'class'` to be the default in 3.0.

- [#6959](https://github.com/withastro/astro/pull/6959) [`cac4a321e`](https://github.com/withastro/astro/commit/cac4a321e814fb805eb0e3ced469e25261a50885) Thanks [@bluwy](https://github.com/bluwy)! - Support `<Code inline />` to output inline code HTML (no `pre` tag)

- [#6721](https://github.com/withastro/astro/pull/6721) [`831b67cdb`](https://github.com/withastro/astro/commit/831b67cdb8250f93f66e3b171fab024652bf80f2) Thanks [@ematipico](https://github.com/ematipico)! - Implements a new experimental middleware in Astro.

  The middleware is available under the following experimental flag:

  ```js
  export default defineConfig({
    experimental: {
      middleware: true,
    },
  });
  ```

  Or via CLI, using the new argument `--experimental-middleware`.

  Create a file called `middleware.{js,ts}` inside the `src` folder, and
  export a `onRequest` function.

  From `astro/middleware`, use the `defineMiddleware` utility to take advantage of type-safety, and use
  the `sequence` utility to chain multiple middleware functions.

  Example:

  ```ts
  import { defineMiddleware, sequence } from 'astro/middleware';

  const redirects = defineMiddleware((context, next) => {
    if (context.request.url.endsWith('/old-url')) {
      return context.redirect('/new-url');
    }
    return next();
  });

  const minify = defineMiddleware(async (context, next) => {
    const response = await next();
    const minifiedHtml = await minifyHtml(response.text());
    return new Response(minifiedHtml, {
      status: 200,
      headers: response.headers,
    });
  });

  export const onRequest = sequence(redirects, minify);
  ```

- [#6932](https://github.com/withastro/astro/pull/6932) [`49514e4ce`](https://github.com/withastro/astro/commit/49514e4ce40fedb39bf7decd2c296258efbdafc7) Thanks [@bluwy](https://github.com/bluwy)! - Upgrade shiki to v0.14.1. This updates the shiki theme colors and adds the theme name to the `pre` tag, e.g. `<pre class="astro-code github-dark">`.

### Patch Changes

- [#6973](https://github.com/withastro/astro/pull/6973) [`0883fd487`](https://github.com/withastro/astro/commit/0883fd4875548a613df122f0b87a1ca8b7a7cf7d) Thanks [@matthewp](https://github.com/matthewp)! - Ensure multiple cookies set in dev result in multiple set-cookie headers

- Updated dependencies [[`49514e4ce`](https://github.com/withastro/astro/commit/49514e4ce40fedb39bf7decd2c296258efbdafc7)]:
  - @astrojs/markdown-remark@2.2.0

## 2.3.4

### Patch Changes

- [#6967](https://github.com/withastro/astro/pull/6967) [`a8a319aef`](https://github.com/withastro/astro/commit/a8a319aef744a64647ee16c7d558d74de6864c6c) Thanks [@bluwy](https://github.com/bluwy)! - Fix `astro-entry` error on build with multiple JSX frameworks

- [#6961](https://github.com/withastro/astro/pull/6961) [`a695e44ae`](https://github.com/withastro/astro/commit/a695e44aed6e2f5d32cb950d4237be6e5657ba98) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix getImage type

- [#6956](https://github.com/withastro/astro/pull/6956) [`367e61776`](https://github.com/withastro/astro/commit/367e61776196a17d61c28daa4dfbabb6244e040c) Thanks [@lilnasy](https://github.com/lilnasy)! - Changed where various parts of the build pipeline look to decide if a page should be prerendered. They now exclusively consider PageBuildData, allowing integrations to participate in the decision.

- [#6969](https://github.com/withastro/astro/pull/6969) [`77270cc2c`](https://github.com/withastro/astro/commit/77270cc2cd06c942d7abf1d882e36d9163edafa5) Thanks [@bluwy](https://github.com/bluwy)! - Avoid removing leading slash for `build.assetsPrefix` value in the build output

- [#6910](https://github.com/withastro/astro/pull/6910) [`895fa07d8`](https://github.com/withastro/astro/commit/895fa07d8b4b8359984e048daca5437e40f44390) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Inline `process.env` boolean values (`0`, `1`, `true`, `false`) during the build. This helps with DCE and allows for better `export const prerender` detection.

- [#6958](https://github.com/withastro/astro/pull/6958) [`72c6bf01f`](https://github.com/withastro/astro/commit/72c6bf01fe49b331ca8ad9206a7506b15caf5b8d) Thanks [@bluwy](https://github.com/bluwy)! - Fix content render imports flow

- [#6952](https://github.com/withastro/astro/pull/6952) [`e5bd084c0`](https://github.com/withastro/astro/commit/e5bd084c01e4f60a157969b50c05ce002f7b63d2) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update allowed Sharp versions to support 0.32.0

## 2.3.3

### Patch Changes

- [#6940](https://github.com/withastro/astro/pull/6940) [`a98df9374`](https://github.com/withastro/astro/commit/a98df9374dec65c678fa47319cb1481b1af123e2) Thanks [@delucis](https://github.com/delucis)! - Support custom 404s added via `injectRoute` or as `src/pages/404.html`

- [#6948](https://github.com/withastro/astro/pull/6948) [`50975f2ea`](https://github.com/withastro/astro/commit/50975f2ea3a59f9e023cc631a9372c0c7986eec9) Thanks [@imchell](https://github.com/imchell)! - Placeholders for slots are cleaned in HTML String that is rendered

- [#6848](https://github.com/withastro/astro/pull/6848) [`ebae1eaf8`](https://github.com/withastro/astro/commit/ebae1eaf87f49399036033c673b513338f7d9c42) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update `experimental.assets`'s `image.service` configuration to allow for a config option in addition to an entrypoint

- [#6953](https://github.com/withastro/astro/pull/6953) [`dc062f669`](https://github.com/withastro/astro/commit/dc062f6695ce577dc569781fc0678c903012c336) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update `astro check` to use version 1.0.0 of the Astro language server

- Updated dependencies [[`ac57b5549`](https://github.com/withastro/astro/commit/ac57b5549f828a17bdbebdaca7ace075307a3c9d)]:
  - @astrojs/telemetry@2.1.1
  - @astrojs/webapi@2.1.1

## 2.3.2

### Patch Changes

- [#6920](https://github.com/withastro/astro/pull/6920) [`b89042553`](https://github.com/withastro/astro/commit/b89042553ec45d5f6bc71747e0f3470ba969e679) Thanks [@bluwy](https://github.com/bluwy)! - Fix tsconfig alias baseUrl handling for "." and ".." imports

## 2.3.1

### Patch Changes

- [#6859](https://github.com/withastro/astro/pull/6859) [`4c7ba4da0`](https://github.com/withastro/astro/commit/4c7ba4da084d7508df91cbac03c2b099a8301e2b) Thanks [@andremralves](https://github.com/andremralves)! - Fix Astro.params does not contain path parameter from URL with non-English characters.

- [#6872](https://github.com/withastro/astro/pull/6872) [`b6154d2d5`](https://github.com/withastro/astro/commit/b6154d2d57bfb77767a3ccf9e91c1ae4051c81bc) Thanks [@bluwy](https://github.com/bluwy)! - Fix hoisted scripts path for linked package Astro components

- [#6862](https://github.com/withastro/astro/pull/6862) [`1f2699461`](https://github.com/withastro/astro/commit/1f2699461d4cdcc8007ae47ebff74ace62eee058) Thanks [@jcdogo](https://github.com/jcdogo)! - Fixes bug with assetsPrefix not being prepended to component-url and renderer-url in astro islands when using SSR mode.

- [#6877](https://github.com/withastro/astro/pull/6877) [`edabf01b4`](https://github.com/withastro/astro/commit/edabf01b44d8c99da160973cd0f779e0a0b93cd7) Thanks [@bluwy](https://github.com/bluwy)! - Upgrade to Vite 4.3

- [#6902](https://github.com/withastro/astro/pull/6902) [`0afff3274`](https://github.com/withastro/astro/commit/0afff32741247bc4c6709a30fc83787f58ec02b7) Thanks [@bluwy](https://github.com/bluwy)! - Disable Vite optimizer for sync and config loading. Improve first page load time for warm server startup.

## 2.3.0

### Minor Changes

- [#6816](https://github.com/withastro/astro/pull/6816) [`8539eb164`](https://github.com/withastro/astro/commit/8539eb1643864ae7e0f5a080915cd75535f7101b) Thanks [@bluwy](https://github.com/bluwy)! - Support tsconfig aliases in CSS `@import`

### Patch Changes

- [#6544](https://github.com/withastro/astro/pull/6544) [`a9c22994e`](https://github.com/withastro/astro/commit/a9c22994e41f92a586d8946988d29e3c62148778) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - Correctly generate directories for assets when users customise the output via rollup options.

- [#6825](https://github.com/withastro/astro/pull/6825) [`948a6d7be`](https://github.com/withastro/astro/commit/948a6d7be0c76fd1dd8550270bd29821075f799c) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix unnecessary warning when using images inside the `src/content` folder with `experimental.assets`

- Updated dependencies [[`2511d58d5`](https://github.com/withastro/astro/commit/2511d58d586af080a78e5ef8a63020b3e17770db)]:
  - @astrojs/markdown-remark@2.1.4

## 2.2.3

### Patch Changes

- [#6765](https://github.com/withastro/astro/pull/6765) [`6c09ac03b`](https://github.com/withastro/astro/commit/6c09ac03bf8f77ca9c1279dce570e0dcf3d439e3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Properly include the needed WASM files for the Squoosh service for Netlify and Vercel in SSR

- [#6817](https://github.com/withastro/astro/pull/6817) [`f882bc163`](https://github.com/withastro/astro/commit/f882bc1636d5ce1c3b8faae47df36b4dc758045a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix sourcemap warnings when using Content Collections and MDX with the `vite.build.sourcemap` option

- [#6819](https://github.com/withastro/astro/pull/6819) [`76dd53e3f`](https://github.com/withastro/astro/commit/76dd53e3f69d596754795710a457a1e570a3bad4) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Fix fallback content showing unexpectedly in some cases

- [#6582](https://github.com/withastro/astro/pull/6582) [`7653cf9e9`](https://github.com/withastro/astro/commit/7653cf9e9fedc6edc6038603248351e276191c3a) Thanks [@bluwy](https://github.com/bluwy)! - Fix CSS chunking and deduping between multiple Astro files and framework components

## 2.2.2

### Patch Changes

- [#6811](https://github.com/withastro/astro/pull/6811) [`60c16db6f`](https://github.com/withastro/astro/commit/60c16db6ff583b0656bc1937814c8bbf06831294) Thanks [@bluwy](https://github.com/bluwy)! - Fix check CLI fs load fallback behaviour

- [#6782](https://github.com/withastro/astro/pull/6782) [`c12ca5ece`](https://github.com/withastro/astro/commit/c12ca5ece34beef0fb53f911515a7c752cc2f3ad) Thanks [@amirhhashemi](https://github.com/amirhhashemi)! - Force error overlay direction to be LTR

## 2.2.1

### Patch Changes

- [#6766](https://github.com/withastro/astro/pull/6766) [`72fed684a`](https://github.com/withastro/astro/commit/72fed684a35f00d80c69bcf6e8af297fed0294fe) Thanks [@Xetera](https://github.com/Xetera)! - Exporting the ImageFunction in astro:content and grouping it under a SchemaContext

- [#6772](https://github.com/withastro/astro/pull/6772) [`45bff6fcc`](https://github.com/withastro/astro/commit/45bff6fccb3f5c71ff24c1ceb48cd532196c90f6) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Allow `import.meta.env` values of `0`, `1`, `true`, and `false` to be used for `export const prerender` statements

- [#6770](https://github.com/withastro/astro/pull/6770) [`52d7a4a01`](https://github.com/withastro/astro/commit/52d7a4a011a3bb722b522fffd88c5fe9a519a196) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated types to match newer Vite versions

- [#6774](https://github.com/withastro/astro/pull/6774) [`9e88e0f23`](https://github.com/withastro/astro/commit/9e88e0f23c5913c07f7e3e96fa0555219ef710dc) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: remove old `slug()` type from `defineCollection()` helper

- [#6775](https://github.com/withastro/astro/pull/6775) [`fa84f1a7d`](https://github.com/withastro/astro/commit/fa84f1a7d2c290479c75199f16e8de489036d7ea) Thanks [@matthewp](https://github.com/matthewp)! - Support streaming inside of slots

- [#6779](https://github.com/withastro/astro/pull/6779) [`a98f6f418`](https://github.com/withastro/astro/commit/a98f6f418c92261a06ef79624a8c86e288c21eab) Thanks [@matthewp](https://github.com/matthewp)! - Prevent body head content injection in MDX when using layout

- [#6781](https://github.com/withastro/astro/pull/6781) [`7f74326b7`](https://github.com/withastro/astro/commit/7f74326b762bfc174ebe8e37ae03733563e4214f) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix `astro:server:setup` middlewares not applying. This resolves an issue with the Partytown integration in dev.

## 2.2.0

### Minor Changes

- [#6703](https://github.com/withastro/astro/pull/6703) [`a1108e037`](https://github.com/withastro/astro/commit/a1108e037115cdb67d03505286c7d3a4fc2a1ff5) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Move `image()` to come from `schema` instead to fix it not working with refine and inside complex types

  **Migration**:

  Remove the `image` import from `astro:content`, and instead use a function to generate your schema, like such:

  ```ts
  import { defineCollection, z } from 'astro:content';

  defineCollection({
    schema: ({ image }) =>
      z.object({
        image: image().refine((img) => img.width >= 200, {
          message: 'image too small',
        }),
      }),
  });
  ```

- [#6714](https://github.com/withastro/astro/pull/6714) [`ff0430786`](https://github.com/withastro/astro/commit/ff043078630e678348ae4f4757b3015b3b862c16) Thanks [@bluwy](https://github.com/bluwy)! - Add `build.assetsPrefix` option for CDN support. If set, all Astro-generated asset links will be prefixed with it. For example, setting it to `https://cdn.example.com` would generate `https://cdn.example.com/_astro/penguin.123456.png` links.

  Also adds `import.meta.env.ASSETS_PREFIX` environment variable that can be used to manually create asset links not handled by Astro.

### Patch Changes

- [#6753](https://github.com/withastro/astro/pull/6753) [`489dd8d69`](https://github.com/withastro/astro/commit/489dd8d69cdd9d7c243cf8bec96051a914984b9c) Thanks [@bluwy](https://github.com/bluwy)! - Fix `getViteConfig` return type

- [#6744](https://github.com/withastro/astro/pull/6744) [`a1a4f45b5`](https://github.com/withastro/astro/commit/a1a4f45b51a80215fa7598da83bd0d9c5acd20d2) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix remote images in Markdown throwing errors when using `experimental.assets`

- [#6762](https://github.com/withastro/astro/pull/6762) [`8b88e4cf1`](https://github.com/withastro/astro/commit/8b88e4cf15c8bea7942b3985380164e0edf7250b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Improved error message when an error was encountered while generating types

- [#6719](https://github.com/withastro/astro/pull/6719) [`d54cbe413`](https://github.com/withastro/astro/commit/d54cbe41349e55f8544212ad9320705f07325920) Thanks [@matthewp](https://github.com/matthewp)! - Better errors for when response is already sent

  This adds clearer error messaging when a Response has already been sent to the browser and the developer attempts to use:

  - Astro.cookies.set
  - Astro.redirect

- [#6741](https://github.com/withastro/astro/pull/6741) [`4c347ab51`](https://github.com/withastro/astro/commit/4c347ab51e46f2319d614f8577fe502e3dc816e2) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix content-type header being wrong in dev on images from `astro:assets`

- [#6739](https://github.com/withastro/astro/pull/6739) [`2f2e572e9`](https://github.com/withastro/astro/commit/2f2e572e937fd25451bbc78a05d55b7caa1ca3ec) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Added more types and utilities exports related to `astro:assets` to help building custom image components and image services

- [#6759](https://github.com/withastro/astro/pull/6759) [`7116c021a`](https://github.com/withastro/astro/commit/7116c021a39eac15a6e1264dfbd11bef0f5d618a) Thanks [@bluwy](https://github.com/bluwy)! - Upgrade to Vite 4.2

- Updated dependencies [[`a1a4f45b5`](https://github.com/withastro/astro/commit/a1a4f45b51a80215fa7598da83bd0d9c5acd20d2)]:
  - @astrojs/markdown-remark@2.1.3

## 2.1.9

### Patch Changes

- [#6693](https://github.com/withastro/astro/pull/6693) [`c0b7864a4`](https://github.com/withastro/astro/commit/c0b7864a41dd9f31e5a588208d1ff806d4edf047) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: avoid calling `astro:server:setup` integration hook in production

- [#6676](https://github.com/withastro/astro/pull/6676) [`5e33c51a9`](https://github.com/withastro/astro/commit/5e33c51a9c3c3b731a33f2c4a020a36d1471b78b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix next and previous links for index routes when using pagination

- [#6717](https://github.com/withastro/astro/pull/6717) [`c2d4ae1cb`](https://github.com/withastro/astro/commit/c2d4ae1cbed622b2fadeb1fe8cc8bbed5f5adc8f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Dynamically import check command to improve startup speed and prevent Astro from crashing due to language-server stuff

- [#6679](https://github.com/withastro/astro/pull/6679) [`08e92f4f8`](https://github.com/withastro/astro/commit/08e92f4f8ece50e377af5b0caca4ad789e0f23c1) Thanks [@fcFn](https://github.com/fcFn)! - Fix incorrect path to file in error overlay on Win

- [#6649](https://github.com/withastro/astro/pull/6649) [`f0b732d32`](https://github.com/withastro/astro/commit/f0b732d326c609208f30485b9805a84a321a870e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Improve error handling when using `astro:assets`

- [#6710](https://github.com/withastro/astro/pull/6710) [`a0bdf4ce2`](https://github.com/withastro/astro/commit/a0bdf4ce2f36a0ce7045dc9f96c15dc7d9204c47) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix multiple Image / getImage calls with the same image causing multiple duplicate images to be generated

- [#6711](https://github.com/withastro/astro/pull/6711) [`c04ea0d43`](https://github.com/withastro/astro/commit/c04ea0d43cc2aa8ebe520a1def19dd89828cf662) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix InferGetStaticParamsType and InferGetStaticPropsType not working when getStaticPaths wasn't async

- [#6701](https://github.com/withastro/astro/pull/6701) [`46ecf4662`](https://github.com/withastro/astro/commit/46ecf466281450caedff5915cecde7a9fe3fdde0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove unnecessary `.wasm` files inside build output when possible

## 2.1.8

### Patch Changes

- [#6675](https://github.com/withastro/astro/pull/6675) [`1f783e320`](https://github.com/withastro/astro/commit/1f783e32075c20b13063599696644f5d47b75d8d) Thanks [@matthewp](https://github.com/matthewp)! - Prevent frontmatter errors from crashing the dev server

- [#6688](https://github.com/withastro/astro/pull/6688) [`2e92e9aa9`](https://github.com/withastro/astro/commit/2e92e9aa976735c3ddb647152bb9c4850136e386) Thanks [@JohannesKlauss](https://github.com/JohannesKlauss)! - Add a additional check for `null` on the `req.body` check in `NodeApp.render`.

- [#6578](https://github.com/withastro/astro/pull/6578) [`adecda7d6`](https://github.com/withastro/astro/commit/adecda7d6009793c5d20519a997e3b7afb08ad57) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - add new flag with open for dev and preview

- [#6680](https://github.com/withastro/astro/pull/6680) [`386336441`](https://github.com/withastro/astro/commit/386336441ad70017eea22db0683591126131db21) Thanks [@koriwi](https://github.com/koriwi)! - Invalidates cache when changing serviceEntryPoint

- [#6653](https://github.com/withastro/astro/pull/6653) [`7c439868a`](https://github.com/withastro/astro/commit/7c439868a3bc7d466418da9af669966014f3d9fe) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Simplify Markdoc configuration with a new `markdoc.config.mjs` file. This lets you import Astro components directly to render as Markdoc tags and nodes, without the need for the previous `components` property. This new configuration also unlocks passing variables to your Markdoc from the `Content` component ([see the new docs](https://docs.astro.build/en/guides/integrations-guide/markdoc/#pass-markdoc-variables)).

  ## Migration

  Move any existing Markdoc config from your `astro.config` to a new `markdoc.config.mjs` file at the root of your project. This should be applied as a default export, with the optional `defineMarkdocConfig()` helper for autocomplete in your editor.

  This example configures an `aside` Markdoc tag. Note that components should be imported and applied to the `render` attribute _directly,_ instead of passing the name as a string:

  ```js
  // markdoc.config.mjs
  import { defineMarkdocConfig } from '@astrojs/markdoc/config';
  import Aside from './src/components/Aside.astro';

  export default defineMarkdocConfig({
    tags: {
      aside: {
        render: Aside,
      },
    },
  });
  ```

  You should also remove the `components` prop from your `Content` components. Since components are imported into your config directly, this is no longer needed.

  ```diff
  ---
  - import Aside from '../components/Aside.astro';
  import { getEntryBySlug } from 'astro:content';

  const entry = await getEntryBySlug('docs', 'why-markdoc');
  const { Content } = await entry.render();
  ---

  <Content
  - components={{ Aside }}
  />
  ```

- [#6639](https://github.com/withastro/astro/pull/6639) [`25cd3e574`](https://github.com/withastro/astro/commit/25cd3e574999c1c7294a089ad8c39df27ccdbf17) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes an attribute naming mismatch in the definition for <link> elements in astro.JSX

- [#6353](https://github.com/withastro/astro/pull/6353) [`4bf87c64f`](https://github.com/withastro/astro/commit/4bf87c64ff7e9ca49e0f5c27e06bd49faaf60542) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - Throw better error when a dynamic endpoint without additional extensions is prerendered with `undefined` params.

- [#6643](https://github.com/withastro/astro/pull/6643) [`fc0ed9c53`](https://github.com/withastro/astro/commit/fc0ed9c53cd374860bbdb2503318a55ca09a2662) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix images not having the proper path when using `base`

## 2.1.7

### Patch Changes

- [#6192](https://github.com/withastro/astro/pull/6192) [`b7194103e`](https://github.com/withastro/astro/commit/b7194103e39267bf59dcd6ba00f522e424219d16) Thanks [@erg208](https://github.com/erg208)! - Updated to fix the Node SSR fails on POST with Express JSON middleware

- [#6630](https://github.com/withastro/astro/pull/6630) [`cfcf2e2ff`](https://github.com/withastro/astro/commit/cfcf2e2ffdaa68ace5c84329c05b83559a29d638) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support automatic image optimization for Markdoc images when using `experimental.assets`. You can [follow our Assets guide](https://docs.astro.build/en/guides/assets/#enabling-assets-in-your-project) to enable this feature in your project. Then, start using relative or aliased image sources in your Markdoc files for automatic optimization:

  ```md
  <!--Relative paths-->

  ![The Milky Way Galaxy](../assets/galaxy.jpg)

  <!--Or configured aliases-->

  ![Houston smiling and looking cute](~/assets/houston-smiling.jpg)
  ```

- [#6647](https://github.com/withastro/astro/pull/6647) [`45da39a86`](https://github.com/withastro/astro/commit/45da39a8642d64eb318840b18dfc2b5ccc6561bc) Thanks [@bluwy](https://github.com/bluwy)! - Fix --mode flag for builds

- [#6638](https://github.com/withastro/astro/pull/6638) [`7daef9a29`](https://github.com/withastro/astro/commit/7daef9a2993b5d457f3d243a1ebfd1dd383b3327) Thanks [@matthewp](https://github.com/matthewp)! - Avoid implicit head injection when a head is in the tree

## 2.1.6

### Patch Changes

- [#6633](https://github.com/withastro/astro/pull/6633) [`9caf2a9cc`](https://github.com/withastro/astro/commit/9caf2a9ccc2fd59af5cb2bb7ede9399fc491d38b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix failed `astro sync` call when running `astro check`. This change also reverts alias support in CSS styles.

- [#6627](https://github.com/withastro/astro/pull/6627) [`d338b6f74`](https://github.com/withastro/astro/commit/d338b6f74a3e34b494be85d24739bec9b2566faf) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update frontmatter assets to be relative to the current file instead of `src/assets`

## 2.1.5

### Patch Changes

- [#6604](https://github.com/withastro/astro/pull/6604) [`7f7a8504b`](https://github.com/withastro/astro/commit/7f7a8504b5c2df4c99d3025931860c0d50992510) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix using optimized images in Markdown not working

- [#6617](https://github.com/withastro/astro/pull/6617) [`38e6ec21e`](https://github.com/withastro/astro/commit/38e6ec21e266ad8765d8ca2293034123b34e839a) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Fix tsconfig alias regression

- [#6588](https://github.com/withastro/astro/pull/6588) [`f42f47dc6`](https://github.com/withastro/astro/commit/f42f47dc6a91cdb6534dab0ecbf9e8e85f00ba40) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Allow access to content collection entry information (including parsed frontmatter and the entry slug) from your Markdoc using the `$entry` variable:

  ```mdx
  ---
  title: Hello Markdoc!
  ---

  # {% $entry.data.title %}
  ```

- Updated dependencies [[`7f7a8504b`](https://github.com/withastro/astro/commit/7f7a8504b5c2df4c99d3025931860c0d50992510)]:
  - @astrojs/markdown-remark@2.1.2

## 2.1.4

### Patch Changes

- [#6547](https://github.com/withastro/astro/pull/6547) [`04dddd783`](https://github.com/withastro/astro/commit/04dddd783da3235aa9ed523d2856adf86b792b5f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix images having the wrong width and height when using the new astro:assets features if both dimensions were provided

- [#6566](https://github.com/withastro/astro/pull/6566) [`ea9b3dd72`](https://github.com/withastro/astro/commit/ea9b3dd72b98b3f5a542ca24a275f673faa6c7c5) Thanks [@bluwy](https://github.com/bluwy)! - Support tsconfig aliases in styles

- [#6472](https://github.com/withastro/astro/pull/6472) [`bf024cb34`](https://github.com/withastro/astro/commit/bf024cb3429c5929d98378108230bc946a376b17) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - don't finish the action of the copy before removing all files.

- [#6556](https://github.com/withastro/astro/pull/6556) [`22955b895`](https://github.com/withastro/astro/commit/22955b895ce4343e282355db64b3a5c1415f3944) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix Invalid Input error when trying to use a custom Image Service

- [#6568](https://github.com/withastro/astro/pull/6568) [`f413446a8`](https://github.com/withastro/astro/commit/f413446a859e497395b3612e44d1540cc6b9dad7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix image() type to be compatible with ImageMetadata

- [#6559](https://github.com/withastro/astro/pull/6559) [`90e5f87d0`](https://github.com/withastro/astro/commit/90e5f87d03215a833bb6ac91f9548670a25ce659) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Vendor `image-size` to fix CJS-related issues

- [#6576](https://github.com/withastro/astro/pull/6576) [`388190102`](https://github.com/withastro/astro/commit/3881901028cbb586f5a4de1b4953e2d6730458ab) Thanks [@bluwy](https://github.com/bluwy)! - Simplify internal resolver in dev

- [#6536](https://github.com/withastro/astro/pull/6536) [`035c0c4df`](https://github.com/withastro/astro/commit/035c0c4df2a623bcc2f2a1cb9e490df35fa29adc) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix Image component and `getImage` not handling images from public correctly

- [#6601](https://github.com/withastro/astro/pull/6601) [`f112c12b1`](https://github.com/withastro/astro/commit/f112c12b15dfbb278d66699f54809674dd1bded0) Thanks [@bluwy](https://github.com/bluwy)! - Fix plugin apply args when filtering

- [#6586](https://github.com/withastro/astro/pull/6586) [`689884251`](https://github.com/withastro/astro/commit/68988425119255382f94c983796574050006f003) Thanks [@solelychloe](https://github.com/solelychloe)! - fix: Add missing --watch flag for astro check when running astro check --help

- [#6572](https://github.com/withastro/astro/pull/6572) [`fa132e35c`](https://github.com/withastro/astro/commit/fa132e35c23f2cfe368fd0a7239584a2bc5c4f12) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Properly handle empty markdown files in content collections

- [#6555](https://github.com/withastro/astro/pull/6555) [`f5fddafc2`](https://github.com/withastro/astro/commit/f5fddafc248bb1ef57b7349bfecc25539ae2b5ea) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a `validateOptions` hook to the Image Service API in order to set default options and validate the passed options

- [#6605](https://github.com/withastro/astro/pull/6605) [`283734525`](https://github.com/withastro/astro/commit/28373452503bc6ca88221ffd39a5590e015e4d71) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update tsconfig.json templates to ignore TypeScript 5.0 deprecations for the moment

- [#6583](https://github.com/withastro/astro/pull/6583) [`66858f1f2`](https://github.com/withastro/astro/commit/66858f1f238a0edf6ded2b0f693bc738785d5aa3) Thanks [@francoromanol](https://github.com/francoromanol)! - Fix overflow title in error message

- [#6558](https://github.com/withastro/astro/pull/6558) [`6c465e958`](https://github.com/withastro/astro/commit/6c465e958e088ff55e5b895e67c64c0dfd4277a6) Thanks [@bluwy](https://github.com/bluwy)! - Fix prerendered 404 page handling in SSR

- Updated dependencies [[`90e5f87d0`](https://github.com/withastro/astro/commit/90e5f87d03215a833bb6ac91f9548670a25ce659), [`f5fddafc2`](https://github.com/withastro/astro/commit/f5fddafc248bb1ef57b7349bfecc25539ae2b5ea)]:
  - @astrojs/markdown-remark@2.1.1

## 2.1.3

### Patch Changes

- [#6530](https://github.com/withastro/astro/pull/6530) [`acf78c5e2`](https://github.com/withastro/astro/commit/acf78c5e271ec3d4f589782078e2a2044cc1c391) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix various inaccuracies with types related to the new Assets features:

  - getConfiguredImageService wasn't present on the astro:assets types.
  - ImageMetadata wasn't exported
  - Fixed wrong module declaration for `avif`, `heic` and `heif` files.
  - Add missing module declaration for SVGs imports

- [#6527](https://github.com/withastro/astro/pull/6527) [`04e624d06`](https://github.com/withastro/astro/commit/04e624d062c6ce385f6293afba26f3942c2290c6) Thanks [@bluwy](https://github.com/bluwy)! - Treeshake exported client components that are not imported

- [#6533](https://github.com/withastro/astro/pull/6533) [`cc90d7219`](https://github.com/withastro/astro/commit/cc90d72197e1139195e9545105b9a1d339f38e1b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Added a warning when trying to use `experimental.assets` with a not compatible adapter

- [#6483](https://github.com/withastro/astro/pull/6483) [`a9a6ae298`](https://github.com/withastro/astro/commit/a9a6ae29812339ea00f3b9afd3de09bd9d3733a9) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix images defined in content collections schemas not working

- [#6537](https://github.com/withastro/astro/pull/6537) [`6a7cf0712`](https://github.com/withastro/astro/commit/6a7cf0712da23e2c095f4bc4f2512e618bceb38e) Thanks [@matthewp](https://github.com/matthewp)! - Prevent astro:content from depending on Node builtins

- [#6488](https://github.com/withastro/astro/pull/6488) [`bfd67ea74`](https://github.com/withastro/astro/commit/bfd67ea749dbc6ffa7c9a671fcc48bea6c04a075) Thanks [@matthewp](https://github.com/matthewp)! - Remove use of createRequire breaking non-Node hosts.

- [#6503](https://github.com/withastro/astro/pull/6503) [`f6eddffa0`](https://github.com/withastro/astro/commit/f6eddffa0414d54767e9f9e1ee5a936b8a20146b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add caching to `getCollection()` queries for faster SSG production builds

- [#6508](https://github.com/withastro/astro/pull/6508) [`c63874090`](https://github.com/withastro/astro/commit/c6387409062f1d7c2afc93319748ad57086837c5) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Improve content collection error formatting:

  - Bold the collection and entry that failed
  - Consistently list the frontmatter key at the start of every error
  - Rich errors for union types

- [#6485](https://github.com/withastro/astro/pull/6485) [`d637d1ea5`](https://github.com/withastro/astro/commit/d637d1ea5b347b9c724adc895c9006c696ac8fc8) Thanks [@bluwy](https://github.com/bluwy)! - Fix `@astrojs/prism` edgecase with strict package managers

- [#6532](https://github.com/withastro/astro/pull/6532) [`637f9bc72`](https://github.com/withastro/astro/commit/637f9bc728ea7d56fc82a862d761385f0dcd9528) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `env.d.ts` changing types wrongly on every restart when `experimental.assets` is enabled

- [#6460](https://github.com/withastro/astro/pull/6460) [`77a046e88`](https://github.com/withastro/astro/commit/77a046e886c370b737208574b6934f5a1cf2b177) Thanks [@bluwy](https://github.com/bluwy)! - Add default `.npmrc` file when adding the Lit integration through `astro add lit` and using `pnpm`.

## 2.1.2

### Patch Changes

- [#6466](https://github.com/withastro/astro/pull/6466) [`ec0455352`](https://github.com/withastro/astro/commit/ec0455352568ab3ea3c5ec1625f582aa54d15bb7) Thanks [@matthewp](https://github.com/matthewp)! - In dev, load assets relative to the root

## 2.1.1

### Patch Changes

- [#6454](https://github.com/withastro/astro/pull/6454) [`05fc7ae54`](https://github.com/withastro/astro/commit/05fc7ae54c19442730971ea22d38f5dbc88050e5) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add support for ESM importing SVGs when using `astro:assets`

- [#6455](https://github.com/withastro/astro/pull/6455) [`cf0198316`](https://github.com/withastro/astro/commit/cf0198316db91a5df6750401ea3cbd7ce5330836) Thanks [@delucis](https://github.com/delucis)! - Document `image.service` configuration option

- [#6459](https://github.com/withastro/astro/pull/6459) [`964d55246`](https://github.com/withastro/astro/commit/964d55246b73410b1e09b5716914f709a97cb387) Thanks [@bluwy](https://github.com/bluwy)! - Prevent HTML-escape of raw strings in `<script>` and `<style>` tags of Astro JSX

- [#6465](https://github.com/withastro/astro/pull/6465) [`65c07ce1b`](https://github.com/withastro/astro/commit/65c07ce1b6ab8db50d3866bc36c2e387a9281c6c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes ESM imported assets to be root relative

## 2.1.0

### Minor Changes

- [#6150](https://github.com/withastro/astro/pull/6150) [`b087b83fe`](https://github.com/withastro/astro/commit/b087b83fe266c431fe34a07d5c2293cc4ab011c6) Thanks [@morellodev](https://github.com/morellodev)! - Add getStaticPaths type helpers to infer params and props

- [#6344](https://github.com/withastro/astro/pull/6344) [`694918a56`](https://github.com/withastro/astro/commit/694918a56b01104831296be0c25456135a63c784) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a new experimental flag (`experimental.assets`) to enable our new core Assets story.

  This unlocks a few features:

  - A new built-in image component and JavaScript API to transform and optimize images.
  - Relative images with automatic optimization in Markdown.
  - Support for validating assets using content collections.
  - and more!

  See [Assets (Experimental)](https://docs.astro.build/en/guides/assets/) on our docs site for more information on how to use this feature!

- [#6435](https://github.com/withastro/astro/pull/6435) [`a20610609`](https://github.com/withastro/astro/commit/a20610609863ae3b48afe96819b8f11ae4f414d5) Thanks [@matthewp](https://github.com/matthewp)! - Expose the manifest to plugins via the astro:ssr-manifest virtual module

- [#6394](https://github.com/withastro/astro/pull/6394) [`a4a74ab70`](https://github.com/withastro/astro/commit/a4a74ab70cd2aa0d812a1f6b202c4e240a8913bf) Thanks [@ematipico](https://github.com/ematipico)! - Add `--help` to various commands: `check`, `sync`, `dev`, `preview`, and `build`

- [#6356](https://github.com/withastro/astro/pull/6356) [`75921b3cd`](https://github.com/withastro/astro/commit/75921b3cd916d439f6392c487c21532fde35ed13) Thanks [@ematipico](https://github.com/ematipico)! - Added a new `--watch` flag to the command `astro check`

- [#6213](https://github.com/withastro/astro/pull/6213) [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated compilation settings to disable downlevelling for Node 14

### Patch Changes

- [#6209](https://github.com/withastro/astro/pull/6209) [`fec583909`](https://github.com/withastro/astro/commit/fec583909ab62829dc0c1600e2387979365f2b94) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Introduce the (experimental) `@astrojs/markdoc` integration. This unlocks Markdoc inside your Content Collections, bringing support for Astro and UI components in your content. This also improves Astro core internals to make Content Collections extensible to more file types in the future.

  You can install this integration using the `astro add` command:

  ```
  astro add markdoc
  ```

  [Read the `@astrojs/markdoc` documentation](https://docs.astro.build/en/guides/integrations-guide/markdoc/) for usage instructions, and browse the [new `with-markdoc` starter](https://astro.new/with-markdoc) to try for yourself.

- Updated dependencies [[`694918a56`](https://github.com/withastro/astro/commit/694918a56b01104831296be0c25456135a63c784), [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808)]:
  - @astrojs/markdown-remark@2.1.0
  - @astrojs/telemetry@2.1.0
  - @astrojs/webapi@2.1.0

## 2.0.18

### Patch Changes

- [#6412](https://github.com/withastro/astro/pull/6412) [`cd8469947`](https://github.com/withastro/astro/commit/cd8469947bb63b4233f3459614c5210feac1da96) Thanks [@liruifengv](https://github.com/liruifengv)! - Remove redundant comments when `astro add` update `astro.config.mjs`

- [#6426](https://github.com/withastro/astro/pull/6426) [`e0844852d`](https://github.com/withastro/astro/commit/e0844852d31d0f5680f2710aaa84e3e808aeb88d) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Prevent `?inline` and `?raw` css query suffixes from injecting style tags in development

- Updated dependencies [[`0abd1d3e4`](https://github.com/withastro/astro/commit/0abd1d3e42cf7bf5efb8c41f37e011b933fb0629)]:
  - @astrojs/webapi@2.0.3

## 2.0.17

### Patch Changes

- [#6391](https://github.com/withastro/astro/pull/6391) [`45501c531`](https://github.com/withastro/astro/commit/45501c531bf75f60063e1f8b7ac50f5d8d93eb6f) Thanks [@bluwy](https://github.com/bluwy)! - Teardown compiler after Vite build to free up memory when rendering pages

- [#6392](https://github.com/withastro/astro/pull/6392) [`ee8b2a067`](https://github.com/withastro/astro/commit/ee8b2a067201f94c6b06fbfc094288e068116c60) Thanks [@bluwy](https://github.com/bluwy)! - Run astro sync in build mode

- [#6368](https://github.com/withastro/astro/pull/6368) [`02a7266e3`](https://github.com/withastro/astro/commit/02a7266e3c32c196fe733a5d3480f9e308cb62ee) Thanks [@userquin](https://github.com/userquin)! - Fix regression that caused some stateful Vite plugins to assume they were running in `dev` mode during the `build` and vice versa.

- [#6358](https://github.com/withastro/astro/pull/6358) [`95164bfdd`](https://github.com/withastro/astro/commit/95164bfdd2c1cbe5f1fafeab9e998ee4c85df3e3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add warning when using headers and encoding in endpoints in SSR

## 2.0.16

### Patch Changes

- [#6363](https://github.com/withastro/astro/pull/6363) [`d94aae776`](https://github.com/withastro/astro/commit/d94aae77656f14f56898d33c6d3f83c59112212e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes cases where head is injected in body when using Astro.slots.render()

- Updated dependencies [[`5aa6580f7`](https://github.com/withastro/astro/commit/5aa6580f775405a4443835bf7eb81f0c65e5aed6)]:
  - @astrojs/webapi@2.0.2
  - @astrojs/telemetry@2.0.1

## 2.0.15

### Patch Changes

- [#6323](https://github.com/withastro/astro/pull/6323) [`5e26bc891`](https://github.com/withastro/astro/commit/5e26bc891cbebb3598acfa760c135a25c548d624) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated Undici to 5.20.0. This fixes a security issue and handling of cookies in certain cases in dev

- [#6293](https://github.com/withastro/astro/pull/6293) [`a156ecbb7`](https://github.com/withastro/astro/commit/a156ecbb7f4df6a46124a9a12eb712f9163db2ed) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Warn about setting the `allowJs` compiler option only when the `content` directory exists.

- [#6320](https://github.com/withastro/astro/pull/6320) [`ccd72e6bb`](https://github.com/withastro/astro/commit/ccd72e6bb41e570d42b1b158e8124c8e04a1943d) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - fix #6020

- [#6347](https://github.com/withastro/astro/pull/6347) [`504c7bacb`](https://github.com/withastro/astro/commit/504c7bacb8c1f2308a31e6c412825ba34983ba33) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix internal `getSetCookie` usage for `undici@5.20.x`

- [#6333](https://github.com/withastro/astro/pull/6333) [`63dda6ded`](https://github.com/withastro/astro/commit/63dda6dedd4c6ea1d5ce72e9cf3fe5f88339a927) Thanks [@ematipico](https://github.com/ematipico)! - Correctly emit mode when passing `node` to the command `astro add`

- [#6330](https://github.com/withastro/astro/pull/6330) [`f91a7f376`](https://github.com/withastro/astro/commit/f91a7f376c223f18b4d8fbed81f95f6bea1cef8d) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Ensure prefixed underscore ignores only child paths of the content directory.

## 2.0.14

### Patch Changes

- [#6277](https://github.com/withastro/astro/pull/6277) [`d9474d467`](https://github.com/withastro/astro/commit/d9474d467e9c24bedf9cdb6100de9190ab0274d0) Thanks [@bluwy](https://github.com/bluwy)! - Bump Vite to 4.1

- [#6268](https://github.com/withastro/astro/pull/6268) [`933c651fb`](https://github.com/withastro/astro/commit/933c651fb1126b7ad1ff369cd11307c47949d0b6) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Do not transform `--camelCase` custom properties to `--camel-case` when they're in a `style` attribute.

  This bug fix is backwards-compatible because we will emit both `--camelCase` and `--camel-case` temporarily. This behavior will be removed in a future version of Astro.

- Updated dependencies [[`bb1801013`](https://github.com/withastro/astro/commit/bb1801013708d9efdbbcebc53a564ac375bf4b26)]:
  - @astrojs/webapi@2.0.1

## 2.0.13

### Patch Changes

- [#6248](https://github.com/withastro/astro/pull/6248) [`ef5cea4dc`](https://github.com/withastro/astro/commit/ef5cea4dc5c4ffa33bd57ea0886e6912afb24fec) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - Deno SSR with prerender=true complains about invalid URL scheme

- [#6257](https://github.com/withastro/astro/pull/6257) [`2fec47848`](https://github.com/withastro/astro/commit/2fec4784871f2b06fd780eb4cb0bb69866c6b065) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: prevent dev server hanging for `getCollection()` calls within a layout when using the `layout` prop

## 2.0.12

### Patch Changes

- [#6238](https://github.com/withastro/astro/pull/6238) [`deacd5443`](https://github.com/withastro/astro/commit/deacd5443aae8d0ee6508e2c442783dcc2e9a014) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: run integration setup hooks during `astro sync`

- [#6244](https://github.com/withastro/astro/pull/6244) [`1c678f7eb`](https://github.com/withastro/astro/commit/1c678f7ebff6b8ea843bf4b49ab73ca942a2a755) Thanks [@bluwy](https://github.com/bluwy)! - Fix hydrate loading path to prevent multiple instance loaded for circular imports

- [#6229](https://github.com/withastro/astro/pull/6229) [`c397be324`](https://github.com/withastro/astro/commit/c397be324f97bb9700da8cd6d845470530b7d18c) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Add support for `.js/.mjs` file extensions for Content Collections configuration file.

## 2.0.11

### Patch Changes

- [#6216](https://github.com/withastro/astro/pull/6216) [`79783fc01`](https://github.com/withastro/astro/commit/79783fc0181153a8e379d3f023422510a7467ead) Thanks [@matthewp](https://github.com/matthewp)! - Fix head injection in body with slots.render() and head buffering

- [#6218](https://github.com/withastro/astro/pull/6218) [`baa2dbb3b`](https://github.com/withastro/astro/commit/baa2dbb3b5678b2bd56fb80df99d386f32e274b7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: internal content collection error on spaces in file name

- [#6049](https://github.com/withastro/astro/pull/6049) [`8b7cb64da`](https://github.com/withastro/astro/commit/8b7cb64dadfca93c65d62df54754633d398cb2ed) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Preserve `--root` CLI flag when restarting dev server

## 2.0.10

### Patch Changes

- [#6183](https://github.com/withastro/astro/pull/6183) [`436bd0934`](https://github.com/withastro/astro/commit/436bd09341693fc705f2a55d460eed3afa413432) Thanks [@Jutanium](https://github.com/Jutanium)! - Fixes the first-page value of `url.prev` when paginating a spread route at the root

- [#6198](https://github.com/withastro/astro/pull/6198) [`a9bdd9cc4`](https://github.com/withastro/astro/commit/a9bdd9cc4e41512fbe723620c995e6a110032ebf) Thanks [@matthewp](https://github.com/matthewp)! - Fixes usage of Code component in Vercel

- [#6182](https://github.com/withastro/astro/pull/6182) [`938ad514c`](https://github.com/withastro/astro/commit/938ad514cd75c09756cd24223346159172f5fd60) Thanks [@matthewp](https://github.com/matthewp)! - Ensure base configuration appended to content collection styles

- [#6197](https://github.com/withastro/astro/pull/6197) [`c75d319ee`](https://github.com/withastro/astro/commit/c75d319ee6b657402b902b1b46b9d3f2d0e5370b) Thanks [@BryceRussell](https://github.com/BryceRussell)! - Fix `border` and `frame` attribute types on `TableHTMLAttributes` interface

- [#6180](https://github.com/withastro/astro/pull/6180) [`6fa6025b3`](https://github.com/withastro/astro/commit/6fa6025b34b9447e142c4788c0cdc2dfe03f334f) Thanks [@matthewp](https://github.com/matthewp)! - Allow binary data to be returned from api routes in SSG

- [#6196](https://github.com/withastro/astro/pull/6196) [`3390cb844`](https://github.com/withastro/astro/commit/3390cb84443a43eb997f3efeb5ca298a8477aaf0) Thanks [@matthewp](https://github.com/matthewp)! - Fix head injection misplacement with Astro.slots.render()

## 2.0.9

### Patch Changes

- [#6176](https://github.com/withastro/astro/pull/6176) [`8bbdcf17d`](https://github.com/withastro/astro/commit/8bbdcf17dd6c9142c18bc1551ee4854a60bc58cb) Thanks [@matthewp](https://github.com/matthewp)! - Take dynamic import into account in CSS ordering

- [#6170](https://github.com/withastro/astro/pull/6170) [`ec2f2a31d`](https://github.com/withastro/astro/commit/ec2f2a31dec78e5749cdea524ae926a19df300e3) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Show content config errors in overlay, instead of stopping the dev server.

## 2.0.8

### Patch Changes

- [#6168](https://github.com/withastro/astro/pull/6168) [`c0e4b1df9`](https://github.com/withastro/astro/commit/c0e4b1df9fc2279a15eadb8aaa95efdc1c6e9cbf) Thanks [@matthewp](https://github.com/matthewp)! - Fix mixed usage of aliases and relative for client hydration

## 2.0.7

### Patch Changes

- [#6161](https://github.com/withastro/astro/pull/6161) [`f6fc662c3`](https://github.com/withastro/astro/commit/f6fc662c3c59d164584c6287a930fcd1c9086ee6) Thanks [@matthewp](https://github.com/matthewp)! - Prevent ?inline and ?raw CSS from being bundled as CSS

- [#6149](https://github.com/withastro/astro/pull/6149) [`592386b75`](https://github.com/withastro/astro/commit/592386b75541f3b7f7d95c631f86024b7e2d314d) Thanks [@bloycey](https://github.com/bloycey)! - Moved pagination error to AstroErrorData

- [#6153](https://github.com/withastro/astro/pull/6153) [`1b591a143`](https://github.com/withastro/astro/commit/1b591a1431b44eacd239ed8f76809916cabca1db) Thanks [@torchsmith](https://github.com/torchsmith)! - Respect `vite.build.emptyOutDir` setting during `astro build`

- [#6092](https://github.com/withastro/astro/pull/6092) [`bf8d7366a`](https://github.com/withastro/astro/commit/bf8d7366acb57e1b21181cc40fff55a821d8119e) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Ensure vite config (aliases, custom modules, etc) is respected when loading the content collection config

- [#6111](https://github.com/withastro/astro/pull/6111) [`ec38a8921`](https://github.com/withastro/astro/commit/ec38a8921f02a275949abcababe1b8afdf8184a2) Thanks [@e111077](https://github.com/e111077)! - Implement client:only functionality in Lit and add lit to the client:only warning

- [#6124](https://github.com/withastro/astro/pull/6124) [`f20a85b64`](https://github.com/withastro/astro/commit/f20a85b642994f240d8c94260fc55ffa1fd14294) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix outdated error message in `paginate()` function.

- [#6122](https://github.com/withastro/astro/pull/6122) [`9f22ac3d0`](https://github.com/withastro/astro/commit/9f22ac3d097ef2cb3b2bbe5343b8a8a49d83425d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Content collections: Fix accidental "use underscore to ignore" logs for `.DS_Store` files and underscored directory names.

- [#6163](https://github.com/withastro/astro/pull/6163) [`cee70f5c6`](https://github.com/withastro/astro/commit/cee70f5c6ac9b0d2edc1f8a6f8f5043605576026) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix returning hex / base64 images from endpoints not working in dev

- [#6114](https://github.com/withastro/astro/pull/6114) [`ac7fb04d6`](https://github.com/withastro/astro/commit/ac7fb04d6b162f28a337918138d5737e2c0fffad) Thanks [@bluwy](https://github.com/bluwy)! - Fix sourcemap generation when scanning files

- [#6152](https://github.com/withastro/astro/pull/6152) [`d1f5611fe`](https://github.com/withastro/astro/commit/d1f5611febfd020cca4078c71bafe599015edd16) Thanks [@matthewp](https://github.com/matthewp)! - Fix MDX related head placement bugs

  This fixes a variety of head content placement bugs (such as page `<link>`) related to MDX, especially when used in content collections. Issues fixed:

  - Head content being placed in the body instead of the head.
  - Head content missing when rendering an MDX component from within a nested Astro component.

- [#6119](https://github.com/withastro/astro/pull/6119) [`2189170be`](https://github.com/withastro/astro/commit/2189170be523f74f244e84ccab22c655219773ce) Thanks [@matthewp](https://github.com/matthewp)! - Fix hoisted script propagation in content collection pages

- [#6117](https://github.com/withastro/astro/pull/6117) [`32abe49bd`](https://github.com/withastro/astro/commit/32abe49bd073417b480b1b990f432a837c12eb6f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix polyfills not being available in certain cases

## 2.0.6

### Patch Changes

- [#6107](https://github.com/withastro/astro/pull/6107) [`9bec6bc41`](https://github.com/withastro/astro/commit/9bec6bc410f324a41c67e5d185fa86f78d7625f2) Thanks [@matthewp](https://github.com/matthewp)! - Fixes head contents being placed in body in MDX components

## 2.0.5

### Patch Changes

- [#6052](https://github.com/withastro/astro/pull/6052) [`9793f19ec`](https://github.com/withastro/astro/commit/9793f19ecd4e64cbf3140454fe52aeee2c22c8c9) Thanks [@mayank99](https://github.com/mayank99)! - Error overlay will now show the error's `cause` if available.

- [#6070](https://github.com/withastro/astro/pull/6070) [`f91615f5c`](https://github.com/withastro/astro/commit/f91615f5c04fde36f115dad9110dd75254efd61d) Thanks [@AirBorne04](https://github.com/AirBorne04)! - \* safe guard against TextEncode.encode(HTMLString) [errors on vercel edge]

  - safe guard against html.replace when html is undefined

- [#6064](https://github.com/withastro/astro/pull/6064) [`2fb72c887`](https://github.com/withastro/astro/commit/2fb72c887f71c0a69ab512870d65b8c867774766) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Apply MDX `components` export when rendering as a content collection entry

## 2.0.4

### Patch Changes

- [#6045](https://github.com/withastro/astro/pull/6045) [`41e97158b`](https://github.com/withastro/astro/commit/41e97158ba90d23d346b6e3ff6c7c14b5ecbe903) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve error handling when an Astro component is rendered manually

- [#6036](https://github.com/withastro/astro/pull/6036) [`e779c6242`](https://github.com/withastro/astro/commit/e779c6242418d1d4102e683ca5b851b764c89688) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve error handling when top-level `return` is present

## 2.0.3

### Patch Changes

- [#6035](https://github.com/withastro/astro/pull/6035) [`b4432cd6b`](https://github.com/withastro/astro/commit/b4432cd6b65bad685a99fe15867710b0663c13b2) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: Astro component scripts now load in development when using MDX + Content Collections

- [#6024](https://github.com/withastro/astro/pull/6024) [`98a4a914b`](https://github.com/withastro/astro/commit/98a4a914bc47f3da2764b3bdc01577d25fe2e261) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Remove `rawContent()` and `compiledContent()` from MDX import types

- [#6034](https://github.com/withastro/astro/pull/6034) [`071e1dee7`](https://github.com/withastro/astro/commit/071e1dee7e1943be67d1ded39a9af1b7a2aafd02) Thanks [@matthewp](https://github.com/matthewp)! - Ensure CSS injections properly when using multiple layouts

- [#5927](https://github.com/withastro/astro/pull/5927) [`322e059d0`](https://github.com/withastro/astro/commit/322e059d0da9ab0d6a546a111fabda755bd5f1b6) Thanks [@izmttk](https://github.com/izmttk)! - Fix undefined `remarkPluginFrontmatter` after calling `render` method

- [#6006](https://github.com/withastro/astro/pull/6006) [`b994f6f35`](https://github.com/withastro/astro/commit/b994f6f35e29b2d93ff8ddc281a69c0af3cc3edf) Thanks [@tony-sull](https://github.com/tony-sull)! - Makes the `AstroCookies` type available as an import from the main "astro" package

- [#5998](https://github.com/withastro/astro/pull/5998) [`12c68343c`](https://github.com/withastro/astro/commit/12c68343c0aa891037d39d3c9b9378b004be6642) Thanks [@andersk](https://github.com/andersk)! - Update `getCollection()` filter to support type guards _or_ unknown values

## 2.0.2

### Patch Changes

- [#5983](https://github.com/withastro/astro/pull/5983) [`b53e0717b`](https://github.com/withastro/astro/commit/b53e0717b7f6b042baaeec7f87999e99c76c031c) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes a dev server edge case where prerender + getStaticPaths would not 404 on an unmatched route

- [#5992](https://github.com/withastro/astro/pull/5992) [`60b32d585`](https://github.com/withastro/astro/commit/60b32d58565d87e87573eb268408293fc28ec657) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fix `Astro.url.protocol` when using the @astrojs/node SSR adapter with HTTPS

- [#5971](https://github.com/withastro/astro/pull/5971) [`883e0cc29`](https://github.com/withastro/astro/commit/883e0cc29968d51ed6c7515be035a40b28bafdad) Thanks [@JLarky](https://github.com/JLarky)! - improve error message: change @astrojs/solid to @astrojs/solid-js

- [#5970](https://github.com/withastro/astro/pull/5970) [`dabce6b8c`](https://github.com/withastro/astro/commit/dabce6b8c684f851c3535f8acead06cbef6dce2a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add type guard support to filters on `getCollection()`

- [#5952](https://github.com/withastro/astro/pull/5952) [`aedf23f85`](https://github.com/withastro/astro/commit/aedf23f8582e32a6b94b81ddba9b323831f2b22a) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - Fix custom theme handling for `<Code>` component

- Updated dependencies [[`7abb1e905`](https://github.com/withastro/astro/commit/7abb1e9056c4b4fd0abfced347df32a41cdfbf28)]:
  - @astrojs/markdown-remark@2.0.1

## 2.0.1

### Patch Changes

- [#5969](https://github.com/withastro/astro/pull/5969) [`f4c71e5eb`](https://github.com/withastro/astro/commit/f4c71e5eb937ce92cc8803d4a6e19400d22ae611) Thanks [@matthewp](https://github.com/matthewp)! - Fix usage of logger in Vercel Edge

  This protects against usage of `process` global in shimmed environments.

- [#5962](https://github.com/withastro/astro/pull/5962) [`46b6e1426`](https://github.com/withastro/astro/commit/46b6e14265f81ffbf1a7511909d5a9954160b504) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Fix Content Collections not loading config file when there are spaces in the folder tree

- [#5972](https://github.com/withastro/astro/pull/5972) [`02549b8ce`](https://github.com/withastro/astro/commit/02549b8ced18bf193efc407a625d908b65b3979f) Thanks [@bluwy](https://github.com/bluwy)! - Correctly detect Node.js version

## 2.0.0

> **Note**
> This is a detailed changelog of all changes in Astro v2.
> See our [upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v2/) for an overview of steps needed to upgrade an existing project.

### Major Changes

- [#5687](https://github.com/withastro/astro/pull/5687) [`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Give remark and rehype plugins access to user frontmatter via frontmatter injection. This means `data.astro.frontmatter` is now the _complete_ Markdown or MDX document's frontmatter, rather than an empty object.

  This allows plugin authors to modify existing frontmatter, or compute new properties based on other properties. For example, say you want to compute a full image URL based on an `imageSrc` slug in your document frontmatter:

  ```ts
  export function remarkInjectSocialImagePlugin() {
    return function (tree, file) {
      const { frontmatter } = file.data.astro;
      frontmatter.socialImageSrc = new URL(frontmatter.imageSrc, 'https://my-blog.com/').pathname;
    };
  }
  ```

  When using Content Collections, you can access this modified frontmatter using the `remarkPluginFrontmatter` property returned when rendering an entry.

  **Migration instructions**

  Plugin authors should now **check for user frontmatter when applying defaults.**

  For example, say a remark plugin wants to apply a default `title` if none is present. Add a conditional to check if the property is present, and update if none exists:

  ```diff
  export function remarkInjectTitlePlugin() {
    return function (tree, file) {
      const { frontmatter } = file.data.astro;
  +    if (!frontmatter.title) {
        frontmatter.title = 'Default title';
  +    }
    }
  }
  ```

  This differs from previous behavior, where a Markdown file's frontmatter would _always_ override frontmatter injected via remark or reype.

- [#5891](https://github.com/withastro/astro/pull/5891) [`05caf445d`](https://github.com/withastro/astro/commit/05caf445d4d2728f1010aeb2179a9e756c2fd17d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove deprecated Markdown APIs from Astro v0.X. This includes `getHeaders()`, the `.astro` property for layouts, and the `rawContent()` and `compiledContent()` error messages for MDX.

- [#5778](https://github.com/withastro/astro/pull/5778) [`49ab4f231`](https://github.com/withastro/astro/commit/49ab4f231c23b34891c3ee86f4b92bf8d6d267a3) Thanks [@bluwy](https://github.com/bluwy)! - Remove proload to load the Astro config. It will now use NodeJS and Vite to load the config only.

- [#5728](https://github.com/withastro/astro/pull/5728) [`8fb28648f`](https://github.com/withastro/astro/commit/8fb28648f66629741cb976bfe34ccd9d8f55661e) Thanks [@natemoo-re](https://github.com/natemoo-re)! - The previously experimental features `--experimental-error-overlay` and `--experimental-prerender`, both added in v1.7.0, are now the default.

  You'll notice that the error overlay during `astro dev` has a refreshed visual design and provides more context for your errors.

  The `prerender` feature is now enabled by default when using `output: 'server'`. To prerender a particular page, add `export const prerender = true` to your frontmatter.

  > **Warning**
  > Integration authors that previously relied on the exact structure of Astro's v1.0 build output may notice some changes to our output file structure. Please test your integrations to ensure compatibility.
  > Users that have configured a custom `vite.build.rollupOptions.output.chunkFileNames` should ensure that their Astro project is configured as an ESM Node project. Either include `"type": "module"` in your root `package.json` file or use the `.mjs` extension for `chunkFileNames`.

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 14. Minimum supported Node version is now >=16.12.0

- [#5771](https://github.com/withastro/astro/pull/5771) [`259a539d7`](https://github.com/withastro/astro/commit/259a539d7d70c783330c797794b15716921629cf) Thanks [@matthewp](https://github.com/matthewp)! - Removes support for astroFlavoredMarkdown

  In 1.0 Astro moved the old Astro Flavored Markdown (also sometimes called Components in Markdown) to a legacy feature. This change removes the `legacy.astroFlavoredMarkdown` option completely.

  In 2.0 this feature will not be available in Astro at all. We recommend migration to MDX for those were still using this feature in 1.x.

- [#5941](https://github.com/withastro/astro/pull/5941) [`304823811`](https://github.com/withastro/astro/commit/304823811eddd8e72aa1d8e2d39b40ab5cda3565) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Content collections: Introduce a new `slug` frontmatter field for overriding the generated slug. This replaces the previous `slug()` collection config option from Astro 1.X and the 2.0 beta.

  When present in a Markdown or MDX file, this will override the generated slug for that entry.

  ```diff
  # src/content/blog/post-1.md
  ---
  title: Post 1
  + slug: post-1-custom-slug
  ---
  ```

  Astro will respect this slug in the generated `slug` type and when using the `getEntryBySlug()` utility:

  ```astro
  ---
  import { getEntryBySlug } from 'astro:content';

  // Retrieve `src/content/blog/post-1.md` by slug with type safety
  const post = await getEntryBySlug('blog', 'post-1-custom-slug');
  ---
  ```

  **Migration**

  If you relied on the `slug()` config option, you will need to move all custom slugs to `slug` frontmatter properties in each collection entry.

  Additionally, Astro no longer allows `slug` as a collection schema property. This ensures Astro can manage the `slug` property for type generation and performance. Remove this property from your schema and any relevant `slug()` configuration:

  ```diff
  const blog = defineCollection({
    schema: z.object({
  -   slug: z.string().optional(),
    }),
  - slug({ defaultSlug, data }) {
  -   return data.slug ?? defaultSlug;
  - },
  })
  ```

- [#5753](https://github.com/withastro/astro/pull/5753) [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5) Thanks [@bluwy](https://github.com/bluwy)! - Default preview host to `localhost` instead of `127.0.0.1`. This allows the static server and integration preview servers to serve under ipv6.

- [#5716](https://github.com/withastro/astro/pull/5716) [`dd56c1941`](https://github.com/withastro/astro/commit/dd56c19411b126439b8bc42d681b6fa8c06e8c61) Thanks [@bluwy](https://github.com/bluwy)! - Remove MDX Fragment hack. This was used by `@astrojs/mdx` to access the `Fragment` component, but isn't required anymore since `@astrojs/mdx` v0.12.1.

- [#5584](https://github.com/withastro/astro/pull/5584) [`9963c6e4d`](https://github.com/withastro/astro/commit/9963c6e4d50c392c3d1ac4492237020f15ccb1de) & [#5842](https://github.com/withastro/astro/pull/5842) [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481) Thanks [@wulinsheng123](https://github.com/wulinsheng123) and [@natemoo-re](https://github.com/natemoo-re)! - **Breaking Change**: client assets are built to an `_astro` directory in the build output directory. Previously these were built to various locations, including `assets/`, `chunks/` and the root of build output.

  You can control this location with the new `build` configuration option named `assets`.

- [#5893](https://github.com/withastro/astro/pull/5893) [`be901dc98`](https://github.com/withastro/astro/commit/be901dc98c4a7f6b5536540aa8f7ba5108e939a0) Thanks [@matthewp](https://github.com/matthewp)! - Rename `getEntry` to `getEntryBySlug`

  This change moves `getEntry` to `getEntryBySlug` and accepts a slug rather than an id.

  In order to improve support in `[id].astro` routes, particularly in SSR where you do not know what the id of a collection is. Using `getEntryBySlug` instead allows you to map the `[id]` param in your route to the entry. You can use it like this:

  ```astro
  ---
  import { getEntryBySlug } from 'astro:content';

  const entry = await getEntryBySlug('docs', Astro.params.id);

  if (!entry) {
    return new Response(null, {
      status: 404,
    });
  }
  ---

  <!-- You have an entry! Use it! -->
  ```

- [#5685](https://github.com/withastro/astro/pull/5685) [`f6cf92b48`](https://github.com/withastro/astro/commit/f6cf92b48317a19a3840ad781b77d6d3cae143bb) Thanks [@bluwy](https://github.com/bluwy)! - Upgrade to Vite 4. Please see its [migration guide](https://vite.dev/guide/migration.html) for more information.

- [#5724](https://github.com/withastro/astro/pull/5724) [`16c7d0bfd`](https://github.com/withastro/astro/commit/16c7d0bfd49d2b9bfae45385f506bcd642f9444a) Thanks [@bluwy](https://github.com/bluwy)! - Remove outdated Vue info log. Remove `toString` support for `RenderTemplateResult`.

- [#5684](https://github.com/withastro/astro/pull/5684) [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d) & [#5769](https://github.com/withastro/astro/pull/5769) [`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Refine Markdown and MDX configuration options for ease-of-use.

  - **Markdown**

    - **Replace the `extendDefaultPlugins` option** with a `gfm` boolean and a `smartypants` boolean. These are enabled by default, and can be disabled to remove GitHub-Flavored Markdown and SmartyPants.

    - Ensure GitHub-Flavored Markdown and SmartyPants are applied whether or not custom `remarkPlugins` or `rehypePlugins` are configured. If you want to apply custom plugins _and_ remove Astro's default plugins, manually set `gfm: false` and `smartypants: false` in your config.

  - **Migrate `extendDefaultPlugins` to `gfm` and `smartypants`**

    You may have disabled Astro's built-in plugins (GitHub-Flavored Markdown and Smartypants) with the `extendDefaultPlugins` option. This has now been split into 2 flags to disable each plugin individually:

    - `markdown.gfm` to disable GitHub-Flavored Markdown
    - `markdown.smartypants` to disable SmartyPants

    ```diff
    // astro.config.mjs
    import { defineConfig } from 'astro/config';

    export default defineConfig({
      markdown: {
    -   extendDefaultPlugins: false,
    +   smartypants: false,
    +   gfm: false,
      }
    });
    ```

    Additionally, applying remark and rehype plugins **no longer disables** `gfm` and `smartypants`. You will need to opt-out manually by setting `gfm` and `smartypants` to `false`.

  - **MDX**

    - Support _all_ Markdown configuration options (except `drafts`) from your MDX integration config. This includes `syntaxHighlighting` and `shikiConfig` options to further customize the MDX renderer.

    - Simplify `extendPlugins` to an `extendMarkdownConfig` option. MDX options will default to their equivalent in your Markdown config. By setting `extendMarkdownConfig` to false, you can "eject" to set your own syntax highlighting, plugins, and more.

  - **Migrate MDX's `extendPlugins` to `extendMarkdownConfig`**

    You may have used the `extendPlugins` option to manage plugin defaults in MDX. This has been replaced by 3 flags:

    - `extendMarkdownConfig` (`true` by default) to toggle Markdown config inheritance. This replaces the `extendPlugins: 'markdown'` option.
    - `gfm` (`true` by default) and `smartypants` (`true` by default) to toggle GitHub-Flavored Markdown and SmartyPants in MDX. This replaces the `extendPlugins: 'defaults'` option.

- [#5717](https://github.com/withastro/astro/pull/5717) [`a3a7fc929`](https://github.com/withastro/astro/commit/a3a7fc9298e6d88abb4b7bee1e58f05fa9558cf1) Thanks [@bluwy](https://github.com/bluwy)! - Remove `style.postcss` Astro config. Refactor tailwind integration to configure through `vite` instead. Also disables `autoprefixer` in dev.

- [#5825](https://github.com/withastro/astro/pull/5825) [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Baseline the experimental `contentCollections` flag. You're free to remove this from your astro config!

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  - experimental: { contentCollections: true }
  })

  ```

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove deprecated `Astro` global APIs, including `Astro.resolve`, `Astro.fetchContent`, and `Astro.canonicalURL`.

  - **`Astro.resolve`**

    You can resolve asset paths using `import` instead. For example:

    ```astro
    ---
    import 'style.css';
    import imageUrl from './image.png';
    ---

    <img src={imageUrl} />
    ```

    See the [v0.25 migration guide](https://docs.astro.build/en/migrate/#deprecated-astroresolve) for more information.

  - **`Astro.fetchContent`**

    Use `Astro.glob` instead to fetch markdown files, or migrate to the [Content Collections](https://docs.astro.build/en/guides/content-collections/) feature.

    ```js
    let allPosts = await Astro.glob('./posts/*.md');
    ```

  - **`Astro.canonicalURL`**

    Use `Astro.url` instead to construct the canonical URL.

    ```js
    const canonicalURL = new URL(Astro.url.pathname, Astro.site);
    ```

- [#5608](https://github.com/withastro/astro/pull/5608) [`899214298`](https://github.com/withastro/astro/commit/899214298cee5f0c975c7245e623c649e1842d73) Thanks [@konojunya](https://github.com/konojunya)! - A trailing slash will not be automatically appended to `import.meta.env.SITE`. Instead, it will be the value of the `site` config as is. This may affect usages of `${import.meta.env.SITE}image.png`, which will need to be updated accordingly.

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove `buildConfig` option parameter from integration `astro:build:start` hook in favour of the `build.config` option in the `astro:config:setup` hook.

  ```js
  export default function myIntegration() {
    return {
      name: 'my-integration',
      hooks: {
        'astro:config:setup': ({ updateConfig }) => {
          updateConfig({
            build: {
              client: '...',
              server: '...',
              serverEntry: '...',
            },
          });
        },
      },
    };
  }
  ```

- [#5862](https://github.com/withastro/astro/pull/5862) [`1ca81c16b`](https://github.com/withastro/astro/commit/1ca81c16b8b66236e092e6eb6ec3f73f5668421c) Thanks [@bluwy](https://github.com/bluwy)! - Remove unused exports

### Minor Changes

- [#5901](https://github.com/withastro/astro/pull/5901) [`a342a486c`](https://github.com/withastro/astro/commit/a342a486c2831461e24e6c2f1ca8a9d3e15477b6) Thanks [@bluwy](https://github.com/bluwy)! - The fallback Svelte preprocessor will only be applied if a custom `preprocess` option is not passed to the `svelte()` integration option, or in the `svelte.config.js` file.

  To support IDE autocompletion, or if you're migrating from `@astrojs/svelte` v1, you can create a `svelte.config.js` file with:

  ```js
  import { vitePreprocess } from '@astrojs/svelte';

  export default {
    preprocess: vitePreprocess(),
  };
  ```

  This file will also be generated by `astro add svelte` by default.

- [#5786](https://github.com/withastro/astro/pull/5786) [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Move generated content collection types to a `.astro` directory. This replaces the previously generated `src/content/types.generated.d.ts` file.

  If you're using Git for version control, we recommend ignoring this generated directory by adding `.astro` to your .gitignore.

  Astro will also generate the [TypeScript reference path](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-path-) to include `.astro` types in your project. This will update your project's `src/env.d.ts` file, or write one if none exists.

- [#5826](https://github.com/withastro/astro/pull/5826) [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Allow Zod objects, unions, discriminated unions, intersections, and transform results as content collection schemas.

  #### Migration

  Astro requires a `z.object(...)` wrapper on all content collection schemas. Update your content collections config like so:

  ```diff
  // src/content/config.ts
  import { z, defineCollection } from 'astro:content';

  const blog = defineCollection({
  - schema: {
  + schema: z.object({
    ...
  })
  ```

- [#5823](https://github.com/withastro/astro/pull/5823) [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d) Thanks [@delucis](https://github.com/delucis)! - Generate content types when running `astro check`

- [#5832](https://github.com/withastro/astro/pull/5832) [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Add support for serving well-known URIs with the @astrojs/node SSR adapter

### Patch Changes

- [#5855](https://github.com/withastro/astro/pull/5855) [`16dc36a87`](https://github.com/withastro/astro/commit/16dc36a870df47a4151a8ed2d91d0bd1bb812458) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Remove legacy compiler error handling

- [#5822](https://github.com/withastro/astro/pull/5822) [`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix edge case with bundle generation by emitting a single chunk for pages

- [#5803](https://github.com/withastro/astro/pull/5803) [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b) Thanks [@bluwy](https://github.com/bluwy)! - Upgrade compiler and handle breaking changes

- [#5840](https://github.com/withastro/astro/pull/5840) [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a) Thanks [@chenxsan](https://github.com/chenxsan)! - Persist CLI flags when restarting the dev server

- [#5884](https://github.com/withastro/astro/pull/5884) [`ce5c5dbd4`](https://github.com/withastro/astro/commit/ce5c5dbd46afbe738b03600758bf5c35113de522) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Add a theme toggle button to the error overlay

- [#5811](https://github.com/withastro/astro/pull/5811) [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2) Thanks [@bluwy](https://github.com/bluwy)! - Simplify HMR handling

- [#5824](https://github.com/withastro/astro/pull/5824) [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Better handle content type generation failures:

  - Generate types when content directory is empty
  - Log helpful error when running `astro sync` without a content directory
  - Avoid swallowing `config.ts` syntax errors from Vite

- [#5791](https://github.com/withastro/astro/pull/5791) [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a) Thanks [@ba55ie](https://github.com/ba55ie)! - Fix Lit slotted content

- [#5499](https://github.com/withastro/astro/pull/5499) [`4987d6f44`](https://github.com/withastro/astro/commit/4987d6f44cfd0d81d88f21f5c380503403dc1e6a) Thanks [@bluwy](https://github.com/bluwy)! - Handle custom injected entry files during build

- [#5734](https://github.com/withastro/astro/pull/5734) [`55cea0a9d`](https://github.com/withastro/astro/commit/55cea0a9d8c8df91a46590fc04a9ac28089b3432) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix `prerender` when used with `getStaticPaths`

- [#5845](https://github.com/withastro/astro/pull/5845) [`e818cc046`](https://github.com/withastro/astro/commit/e818cc0466a942919ea3c41585e231c8c80cb3d0) Thanks [@bluwy](https://github.com/bluwy)! - Fix importing client-side components with alias

- [#5849](https://github.com/withastro/astro/pull/5849) [`8c100a6fe`](https://github.com/withastro/astro/commit/8c100a6fe6cc652c3799d1622e12c2c969f30510) Thanks [@bluwy](https://github.com/bluwy)! - Handle server restart from Vite plugins

- [#5756](https://github.com/withastro/astro/pull/5756) [`116d8835c`](https://github.com/withastro/astro/commit/116d8835ca9e78f8b5e477ee5a3d737b69f80706) Thanks [@matthewp](https://github.com/matthewp)! - Fix for hoisted scripts in project with spaces in the file path

- [#5917](https://github.com/withastro/astro/pull/5917) [`7325df412`](https://github.com/withastro/astro/commit/7325df412107fc0e65cd45c1b568fb686708f723) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix duplicate CSS in dev mode when `vite.css.devSourcemap` is provided

- [#5743](https://github.com/withastro/astro/pull/5743) [`2a5786419`](https://github.com/withastro/astro/commit/2a5786419599b8674473c699300172b9aacbae2e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add error location during build for user-generated errors

- [#5773](https://github.com/withastro/astro/pull/5773) [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa) Thanks [@bluwy](https://github.com/bluwy)! - Cleanup dependencies

- [#5905](https://github.com/withastro/astro/pull/5905) [`a8d3e7924`](https://github.com/withastro/astro/commit/a8d3e79246605d252dcddad159e358e2d79bd624) Thanks [@bluwy](https://github.com/bluwy)! - Fix CLI node version check

- [#5761](https://github.com/withastro/astro/pull/5761) [`fa8c131f8`](https://github.com/withastro/astro/commit/fa8c131f88ef67d14c62f1c00c97ed74d43a80ac) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add helpful error message when the MDX integration is missing.

- [#5896](https://github.com/withastro/astro/pull/5896) [`64b8082e7`](https://github.com/withastro/astro/commit/64b8082e776b832f1433ed288e6f7888adb626d0) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `@astrojs/compiler` to `v1.0.0`

- [#5829](https://github.com/withastro/astro/pull/5829) [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb) Thanks [@giuseppelt](https://github.com/giuseppelt)! - Fix `Code.astro` shiki css class replace logic

- [#5836](https://github.com/withastro/astro/pull/5836) [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix route matching when path includes special characters

- [#5909](https://github.com/withastro/astro/pull/5909) [`5fd9208d4`](https://github.com/withastro/astro/commit/5fd9208d447f5ab8909a2188b6c2491a0debd49d) Thanks [@jasikpark](https://github.com/jasikpark)! - Update compiler to 1.0.1

- [#5852](https://github.com/withastro/astro/pull/5852) [`3a00ecb3e`](https://github.com/withastro/astro/commit/3a00ecb3eb4bc44be758c064f2bde6e247e8a593) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - Respect `vite.envPrefix` if provided

- [#5872](https://github.com/withastro/astro/pull/5872) [`b66d7195c`](https://github.com/withastro/astro/commit/b66d7195c17a55ea0931bc3744888bd4f5f01ce6) Thanks [@bluwy](https://github.com/bluwy)! - Enable `skipLibCheck` by default

- Updated dependencies [[`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b), [`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`12f65a4d5`](https://github.com/withastro/astro/commit/12f65a4d55e3fd2993c2f67b18794dd536280c69), [`46ecd5de3`](https://github.com/withastro/astro/commit/46ecd5de34df619e2ee73ccea39a57acd37bc0b8), [`16107b6a1`](https://github.com/withastro/astro/commit/16107b6a10514ef1b563e585ec9add4b14f42b94), [`c55fbcb8e`](https://github.com/withastro/astro/commit/c55fbcb8edca1fe118a44f68c9f9436a4719d171), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53)]:
  - @astrojs/markdown-remark@2.0.0
  - @astrojs/telemetry@2.0.0
  - @astrojs/webapi@2.0.0

## 2.0.0-beta.4

<details>
<summary>See changes in 2.0.0-beta.4</summary>

### Major Changes

- [#5941](https://github.com/withastro/astro/pull/5941) [`304823811`](https://github.com/withastro/astro/commit/304823811eddd8e72aa1d8e2d39b40ab5cda3565) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Content collections: Introduce a new `slug` frontmatter field for overriding the generated slug. This replaces the previous `slug()` collection config option from Astro 1.X and the 2.0 beta.

  When present in a Markdown or MDX file, this will override the generated slug for that entry.

  ```diff
  # src/content/blog/post-1.md
  ---
  title: Post 1
  + slug: post-1-custom-slug
  ---
  ```

  Astro will respect this slug in the generated `slug` type and when using the `getEntryBySlug()` utility:

  ```astro
  ---
  import { getEntryBySlug } from 'astro:content';

  // Retrieve `src/content/blog/post-1.md` by slug with type safety
  const post = await getEntryBySlug('blog', 'post-1-custom-slug');
  ---
  ```

  #### Migration

  If you relied on the `slug()` config option, you will need to move all custom slugs to `slug` frontmatter properties in each collection entry.

  Additionally, Astro no longer allows `slug` as a collection schema property. This ensures Astro can manage the `slug` property for type generation and performance. Remove this property from your schema and any relevant `slug()` configuration:

  ```diff
  const blog = defineCollection({
    schema: z.object({
  -   slug: z.string().optional(),
    }),
  - slug({ defaultSlug, data }) {
  -   return data.slug ?? defaultSlug;
  - },
  })
  ```

### Patch Changes

- [#5499](https://github.com/withastro/astro/pull/5499) [`4987d6f44`](https://github.com/withastro/astro/commit/4987d6f44cfd0d81d88f21f5c380503403dc1e6a) Thanks [@bluwy](https://github.com/bluwy)! - Handle custom injected entry files during build

- [#5917](https://github.com/withastro/astro/pull/5917) [`7325df412`](https://github.com/withastro/astro/commit/7325df412107fc0e65cd45c1b568fb686708f723) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix duplicate CSS in dev mode when `vite.css.devSourcemap` is provided

- [#5905](https://github.com/withastro/astro/pull/5905) [`a8d3e7924`](https://github.com/withastro/astro/commit/a8d3e79246605d252dcddad159e358e2d79bd624) Thanks [@bluwy](https://github.com/bluwy)! - Fix CLI node version check

- [#5909](https://github.com/withastro/astro/pull/5909) [`5fd9208d4`](https://github.com/withastro/astro/commit/5fd9208d447f5ab8909a2188b6c2491a0debd49d) Thanks [@jasikpark](https://github.com/jasikpark)! - Update compiler to 1.0.1

- Updated dependencies [[`46ecd5de3`](https://github.com/withastro/astro/commit/46ecd5de34df619e2ee73ccea39a57acd37bc0b8)]:
  - @astrojs/webapi@2.0.0-beta.1

</details>

## 2.0.0-beta.3

<details>
<summary>See changes in 2.0.0-beta.3</summary>

### Major Changes

- [#5891](https://github.com/withastro/astro/pull/5891) [`05caf445d`](https://github.com/withastro/astro/commit/05caf445d4d2728f1010aeb2179a9e756c2fd17d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove deprecated Markdown APIs from Astro v0.X. This includes `getHeaders()`, the `.astro` property for layouts, and the `rawContent()` and `compiledContent()` error messages for MDX.

- [#5893](https://github.com/withastro/astro/pull/5893) [`be901dc98`](https://github.com/withastro/astro/commit/be901dc98c4a7f6b5536540aa8f7ba5108e939a0) Thanks [@matthewp](https://github.com/matthewp)! - Move getEntry to getEntryBySlug

  This change moves `getEntry` to `getEntryBySlug` and accepts a slug rather than an id.

  In order to improve support in `[id].astro` routes, particularly in SSR where you do not know what the id of a collection is. Using `getEntryBySlug` instead allows you to map the `[id]` param in your route to the entry. You can use it like this:

  ```astro
  ---
  import { getEntryBySlug } from 'astro:content';

  const entry = await getEntryBySlug('docs', Astro.params.id);

  if (!entry) {
    return new Response(null, {
      status: 404,
    });
  }
  ---

  <!-- You have an entry! Use it! -->
  ```

- [#5608](https://github.com/withastro/astro/pull/5608) [`899214298`](https://github.com/withastro/astro/commit/899214298cee5f0c975c7245e623c649e1842d73) Thanks [@konojunya](https://github.com/konojunya)! - A trailing slash will not be automatically appended to `import.meta.env.SITE`. Instead, it will be the value of the `site` config as is. This may affect usages of `${import.meta.env.SITE}image.png`, which will need to be updated accordingly.

- [#5862](https://github.com/withastro/astro/pull/5862) [`1ca81c16b`](https://github.com/withastro/astro/commit/1ca81c16b8b66236e092e6eb6ec3f73f5668421c) Thanks [@bluwy](https://github.com/bluwy)! - Remove unused exports

### Minor Changes

- [#5901](https://github.com/withastro/astro/pull/5901) [`a342a486c`](https://github.com/withastro/astro/commit/a342a486c2831461e24e6c2f1ca8a9d3e15477b6) Thanks [@bluwy](https://github.com/bluwy)! - The fallback Svelte preprocessor will only be applied if a custom `preprocess` option is not passed to the `svelte()` integration option, or in the `svelte.config.js` file.

  To support IDE autocompletion, or if you're migrating from `@astrojs/svelte` v1, you can create a `svelte.config.js` file with:

  ```js
  import { vitePreprocess } from '@astrojs/svelte';

  export default {
    preprocess: vitePreprocess(),
  };
  ```

  This file will also be generated by `astro add svelte` by default.

### Patch Changes

- [#5855](https://github.com/withastro/astro/pull/5855) [`16dc36a87`](https://github.com/withastro/astro/commit/16dc36a870df47a4151a8ed2d91d0bd1bb812458) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Remove legacy compiler error handling

- [#5884](https://github.com/withastro/astro/pull/5884) [`ce5c5dbd4`](https://github.com/withastro/astro/commit/ce5c5dbd46afbe738b03600758bf5c35113de522) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Add a theme toggle button to the error overlay

- [#5845](https://github.com/withastro/astro/pull/5845) [`e818cc046`](https://github.com/withastro/astro/commit/e818cc0466a942919ea3c41585e231c8c80cb3d0) Thanks [@bluwy](https://github.com/bluwy)! - Fix importing client-side components with alias

- [#5849](https://github.com/withastro/astro/pull/5849) [`8c100a6fe`](https://github.com/withastro/astro/commit/8c100a6fe6cc652c3799d1622e12c2c969f30510) Thanks [@bluwy](https://github.com/bluwy)! - Handle server restart from Vite plugins

- [#5896](https://github.com/withastro/astro/pull/5896) [`64b8082e7`](https://github.com/withastro/astro/commit/64b8082e776b832f1433ed288e6f7888adb626d0) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update `@astrojs/compiler` to `v1.0.0`

- [#5852](https://github.com/withastro/astro/pull/5852) [`3a00ecb3e`](https://github.com/withastro/astro/commit/3a00ecb3eb4bc44be758c064f2bde6e247e8a593) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - Respect `vite.envPrefix` if provided

- [#5872](https://github.com/withastro/astro/pull/5872) [`b66d7195c`](https://github.com/withastro/astro/commit/b66d7195c17a55ea0931bc3744888bd4f5f01ce6) Thanks [@bluwy](https://github.com/bluwy)! - Enable `skipLibCheck` by default

</details>

## 2.0.0-beta.2

<details>
<summary>See changes in 2.0.0-beta.2</summary>

### Major Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 14. Minimum supported Node version is now >=16.12.0

- [#5753](https://github.com/withastro/astro/pull/5753) [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5) Thanks [@bluwy](https://github.com/bluwy)! - Default preview host to `localhost` instead of `127.0.0.1`. This allows the static server and integration preview servers to serve under ipv6.

- [#5842](https://github.com/withastro/astro/pull/5842) [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481) Thanks [@natemoo-re](https://github.com/natemoo-re)! - **Breaking Change**: client assets are built to an `_astro` directory in the build output directory. Previously these were built to various locations, including `assets/`, `chunks/` and the root of build output.

  You can control this location with the new `build` configuration option named `assets`.

- [#5825](https://github.com/withastro/astro/pull/5825) [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Baseline the experimental `contentCollections` flag. You're free to remove this from your astro config!

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  - experimental: { contentCollections: true }
  })
  ```

### Minor Changes

- [#5786](https://github.com/withastro/astro/pull/5786) [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Move generated content collection types to a `.astro` directory. This replaces the previously generated `src/content/types.generated.d.ts` file.

  If you're using Git for version control, we recommend ignoring this generated directory by adding `.astro` to your .gitignore.

  Astro will also generate the [TypeScript reference path](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-path-) to include `.astro` types in your project. This will update your project's `src/env.d.ts` file, or write one if none exists.

- [#5826](https://github.com/withastro/astro/pull/5826) [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Allow Zod objects, unions, discriminated unions, intersections, and transform results as content collection schemas.

  #### Migration

  Astro requires a `z.object(...)` wrapper on all content collection schemas. Update your content collections config like so:

  ```diff
  // src/content/config.ts
  import { z, defineCollection } from 'astro:content';

  const blog = defineCollection({
  - schema: {
  + schema: z.object({
    ...
  })
  ```

- [#5823](https://github.com/withastro/astro/pull/5823) [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d) Thanks [@delucis](https://github.com/delucis)! - Generate content types when running `astro check`

- [#5832](https://github.com/withastro/astro/pull/5832) [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Add support for serving well-known URIs with the @astrojs/node SSR adapter

### Patch Changes

- [#5822](https://github.com/withastro/astro/pull/5822) [`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix edge case with bundle generation by emitting a single chunk for pages

- [#5803](https://github.com/withastro/astro/pull/5803) [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b) Thanks [@bluwy](https://github.com/bluwy)! - Upgrade compiler and handle breaking changes

- [#5840](https://github.com/withastro/astro/pull/5840) [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a) Thanks [@chenxsan](https://github.com/chenxsan)! - Persist CLI flags when restarting the dev server

- [#5811](https://github.com/withastro/astro/pull/5811) [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2) Thanks [@bluwy](https://github.com/bluwy)! - Simplify HMR handling

- [#5824](https://github.com/withastro/astro/pull/5824) [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Better handle content type generation failures:

  - Generate types when content directory is empty
  - Log helpful error when running `astro sync` without a content directory
  - Avoid swallowing `config.ts` syntax errors from Vite

- [#5791](https://github.com/withastro/astro/pull/5791) [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a) Thanks [@ba55ie](https://github.com/ba55ie)! - Fix Lit slotted content

- [#5773](https://github.com/withastro/astro/pull/5773) [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa) Thanks [@bluwy](https://github.com/bluwy)! - Cleanup dependencies

- [#5829](https://github.com/withastro/astro/pull/5829) [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb) Thanks [@giuseppelt](https://github.com/giuseppelt)! - Fix `Code.astro` shiki css class replace logic

- [#5836](https://github.com/withastro/astro/pull/5836) [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix route matching when path includes special characters

- Updated dependencies [[`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`12f65a4d5`](https://github.com/withastro/astro/commit/12f65a4d55e3fd2993c2f67b18794dd536280c69), [`16107b6a1`](https://github.com/withastro/astro/commit/16107b6a10514ef1b563e585ec9add4b14f42b94), [`c55fbcb8e`](https://github.com/withastro/astro/commit/c55fbcb8edca1fe118a44f68c9f9436a4719d171), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53)]:
  - @astrojs/telemetry@2.0.0-beta.0
  - @astrojs/markdown-remark@2.0.0-beta.2
  - @astrojs/webapi@2.0.0-beta.0

</details>

## 2.0.0-beta.1

<details>
<summary>See changes in 2.0.0-beta.1</summary>

### Major Changes

- [#5778](https://github.com/withastro/astro/pull/5778) [`49ab4f231`](https://github.com/withastro/astro/commit/49ab4f231c23b34891c3ee86f4b92bf8d6d267a3) Thanks [@bluwy](https://github.com/bluwy)! - Remove proload to load the Astro config. It will now use NodeJS and Vite to load the config only.

- [#5771](https://github.com/withastro/astro/pull/5771) [`259a539d7`](https://github.com/withastro/astro/commit/259a539d7d70c783330c797794b15716921629cf) Thanks [@matthewp](https://github.com/matthewp)! - Removes support for astroFlavoredMarkdown

  In 1.0 Astro moved the old Astro Flavored Markdown (also sometimes called Components in Markdown) to a legacy feature. This change removes the `legacy.astroFlavoredMarkdown` option completely.

  In 2.0 this feature will not be available in Astro at all. We recommend migration to MDX for those were still using this feature in 1.x.

- [#5717](https://github.com/withastro/astro/pull/5717) [`a3a7fc929`](https://github.com/withastro/astro/commit/a3a7fc9298e6d88abb4b7bee1e58f05fa9558cf1) Thanks [@bluwy](https://github.com/bluwy)! - Remove `style.postcss` Astro config. Refactor tailwind integration to configure through `vite` instead. Also disables `autoprefixer` in dev.

### Minor Changes

- [#5769](https://github.com/withastro/astro/pull/5769) [`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Introduce a `smartypants` flag to opt-out of Astro's default SmartyPants plugin.

  ```js
  {
    markdown: {
      smartypants: false,
    }
  }
  ```

  #### Migration

  You may have disabled Astro's built-in plugins (GitHub-Flavored Markdown and Smartypants) with the `extendDefaultPlugins` option. This has now been split into 2 flags to disable each plugin individually:

  - `markdown.gfm` to disable GitHub-Flavored Markdown
  - `markdown.smartypants` to disable SmartyPants

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    markdown: {
  -   extendDefaultPlugins: false,
  +   smartypants: false,
  +   gfm: false,
    }
  });
  ```

### Patch Changes

- [#5734](https://github.com/withastro/astro/pull/5734) [`55cea0a9d`](https://github.com/withastro/astro/commit/55cea0a9d8c8df91a46590fc04a9ac28089b3432) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix `prerender` when used with `getStaticPaths`

- [#5756](https://github.com/withastro/astro/pull/5756) [`116d8835c`](https://github.com/withastro/astro/commit/116d8835ca9e78f8b5e477ee5a3d737b69f80706) Thanks [@matthewp](https://github.com/matthewp)! - Fix for hoisted scripts in project with spaces in the file path

- [#5743](https://github.com/withastro/astro/pull/5743) [`2a5786419`](https://github.com/withastro/astro/commit/2a5786419599b8674473c699300172b9aacbae2e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add error location during build for user-generated errors

- [#5761](https://github.com/withastro/astro/pull/5761) [`fa8c131f8`](https://github.com/withastro/astro/commit/fa8c131f88ef67d14c62f1c00c97ed74d43a80ac) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add helpful error message when the MDX integration is missing.

- Updated dependencies [[`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b)]:
  - @astrojs/markdown-remark@2.0.0-beta.1

</details>

## 2.0.0-beta.0

<details>
<summary>See changes in 2.0.0-beta.0</summary>

### Major Changes

- [#5687](https://github.com/withastro/astro/pull/5687) [`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Give remark and rehype plugins access to user frontmatter via frontmatter injection. This means `data.astro.frontmatter` is now the _complete_ Markdown or MDX document's frontmatter, rather than an empty object.

  This allows plugin authors to modify existing frontmatter, or compute new properties based on other properties. For example, say you want to compute a full image URL based on an `imageSrc` slug in your document frontmatter:

  ```ts
  export function remarkInjectSocialImagePlugin() {
    return function (tree, file) {
      const { frontmatter } = file.data.astro;
      frontmatter.socialImageSrc = new URL(frontmatter.imageSrc, 'https://my-blog.com/').pathname;
    };
  }
  ```

  #### Content Collections - new `remarkPluginFrontmatter` property

  We have changed _inject_ frontmatter to _modify_ frontmatter in our docs to improve discoverability. This is based on support forum feedback, where "injection" is rarely the term used.

  To reflect this, the `injectedFrontmatter` property has been renamed to `remarkPluginFrontmatter`. This should clarify this plugin is still separate from the `data` export Content Collections expose today.

  #### Migration instructions

  Plugin authors should now **check for user frontmatter when applying defaults.**

  For example, say a remark plugin wants to apply a default `title` if none is present. Add a conditional to check if the property is present, and update if none exists:

  ```diff
  export function remarkInjectTitlePlugin() {
    return function (tree, file) {
      const { frontmatter } = file.data.astro;
  +    if (!frontmatter.title) {
        frontmatter.title = 'Default title';
  +    }
    }
  }
  ```

  This differs from previous behavior, where a Markdown file's frontmatter would _always_ override frontmatter injected via remark or reype.

- [#5728](https://github.com/withastro/astro/pull/5728) [`8fb28648f`](https://github.com/withastro/astro/commit/8fb28648f66629741cb976bfe34ccd9d8f55661e) Thanks [@natemoo-re](https://github.com/natemoo-re)! - The previously experimental features `--experimental-error-overlay` and `--experimental-prerender`, both added in v1.7.0, are now the default.

  You'll notice that the error overlay during `astro dev` has a refreshed visual design and provides more context for your errors.

  The `prerender` feature is now enabled by default when using `output: 'server'`. To prerender a particular page, add `export const prerender = true` to your frontmatter.

  > **Warning**
  > Integration authors that previously relied on the exact structure of Astro's v1.0 build output may notice some changes to our output file structure. Please test your integrations to ensure compatibility.
  > Users that have configured a custom `vite.build.rollupOptions.output.chunkFileNames` should ensure that their Astro project is configured as an ESM Node project. Either include `"type": "module"` in your root `package.json` file or use the `.mjs` extension for `chunkFileNames`.

- [#5716](https://github.com/withastro/astro/pull/5716) [`dd56c1941`](https://github.com/withastro/astro/commit/dd56c19411b126439b8bc42d681b6fa8c06e8c61) Thanks [@bluwy](https://github.com/bluwy)! - Remove MDX Fragment hack. This was used by `@astrojs/mdx` to access the `Fragment` component, but isn't require anymore since `@astrojs/mdx` v0.12.1.

- [#5685](https://github.com/withastro/astro/pull/5685) [`f6cf92b48`](https://github.com/withastro/astro/commit/f6cf92b48317a19a3840ad781b77d6d3cae143bb) Thanks [@bluwy](https://github.com/bluwy)! - Upgrade to Vite 4. Please see its [migration guide](https://vite.dev/guide/migration.html) for more information.

- [#5724](https://github.com/withastro/astro/pull/5724) [`16c7d0bfd`](https://github.com/withastro/astro/commit/16c7d0bfd49d2b9bfae45385f506bcd642f9444a) Thanks [@bluwy](https://github.com/bluwy)! - Remove outdated Vue info log. Remove `toString` support for `RenderTemplateResult`.

- [#5684](https://github.com/withastro/astro/pull/5684) [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Refine Markdown and MDX configuration options for ease-of-use.

  #### Markdown

  - **Remove `remark-smartypants`** from Astro's default Markdown plugins.
  - **Replace the `extendDefaultPlugins` option** with a simplified `gfm` boolean. This is enabled by default, and can be disabled to remove GitHub-Flavored Markdown.
  - Ensure GitHub-Flavored Markdown is applied whether or not custom `remarkPlugins` or `rehypePlugins` are configured. If you want to apply custom plugins _and_ remove GFM, manually set `gfm: false` in your config.

  #### MDX

  - Support _all_ Markdown configuration options (except `drafts`) from your MDX integration config. This includes `syntaxHighlighting` and `shikiConfig` options to further customize the MDX renderer.
  - Simplify `extendDefaults` to an `extendMarkdownConfig` option. MDX options will default to their equivalent in your Markdown config. By setting `extendMarkdownConfig` to false, you can "eject" to set your own syntax highlighting, plugins, and more.

  #### Migration

  To preserve your existing Markdown and MDX setup, you may need some configuration changes:

  ##### Smartypants manual installation

  [Smartypants](https://github.com/silvenon/remark-smartypants) has been removed from Astro's default setup. If you rely on this plugin, [install `remark-smartypants`](https://github.com/silvenon/remark-smartypants#installing) and apply to your `astro.config.*`:

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  + import smartypants from 'remark-smartypants';

  export default defineConfig({
    markdown: {
  +   remarkPlugins: [smartypants],
    }
  });
  ```

  ##### Migrate `extendDefaultPlugins` to `gfm`

  You may have disabled Astro's built-in plugins (GitHub-Flavored Markdown and Smartypants) with the `extendDefaultPlugins` option. Since Smartypants has been removed, this has been renamed to `gfm`.

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    markdown: {
  -   extendDefaultPlugins: false,
  +   gfm: false,
    }
  });
  ```

  Additionally, applying remark and rehype plugins **no longer disables** `gfm`. You will need to opt-out manually by setting `gfm` to `false`.

  ##### Migrate MDX's `extendPlugins` to `extendMarkdownConfig`

  You may have used the `extendPlugins` option to manage plugin defaults in MDX. This has been replaced by 2 flags:

  - `extendMarkdownConfig` (`true` by default) to toggle Markdown config inheritance. This replaces the `extendPlugins: 'markdown'` option.
  - `gfm` (`true` by default) to toggle GitHub-Flavored Markdown in MDX. This replaces the `extendPlugins: 'defaults'` option.

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove deprecated `Astro` global APIs, including `Astro.resolve`, `Astro.fetchContent`, and `Astro.canonicalURL`.

  #### `Astro.resolve`

  You can resolve asset paths using `import` instead. For example:

  ```astro
  ---
  import 'style.css';
  import imageUrl from './image.png';
  ---

  <img src={imageUrl} />
  ```

  See the [v0.25 migration guide](https://docs.astro.build/en/migrate/#deprecated-astroresolve) for more information.

  #### `Astro.fetchContent`

  Use `Astro.glob` instead to fetch markdown files, or migrate to the [Content Collections](https://docs.astro.build/en/guides/content-collections/) feature.

  ```js
  let allPosts = await Astro.glob('./posts/*.md');
  ```

  #### `Astro.canonicalURL`

  Use `Astro.url` instead to construct the canonical URL.

  ```js
  const canonicalURL = new URL(Astro.url.pathname, Astro.site);
  ```

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove `buildConfig` option parameter from integration `astro:build:start` hook in favour of the `build.config` option in the `astro:config:setup` hook.

  ```js
  export default function myIntegration() {
    return {
      name: 'my-integration',
      hooks: {
        'astro:config:setup': ({ updateConfig }) => {
          updateConfig({
            build: {
              client: '...',
              server: '...',
              serverEntry: '...',
            },
          });
        },
      },
    };
  }
  ```

### Patch Changes

- Updated dependencies [[`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d)]:
  - @astrojs/markdown-remark@2.0.0-beta.0

</details>

## 1.x.x

For changelogs for Astro v1, check out the [Astro v1 changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG-v1.md)

## 0.X

For older changelog entries -- including all v0.X, v1.0 Beta, and v1.0 Release Candidate versions -- check out [the v0.X changelog](https://github.com/withastro/astro/blob/astro%401.0.0/packages/astro/CHANGELOG.md).
