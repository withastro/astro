# astro

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
