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
