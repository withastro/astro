## 6.4.7

### Patch Changes

- [#17035](https://github.com/withastro/astro/pull/17035) [`197e50e`](https://github.com/withastro/astro/commit/197e50e2e37168a9b9e8a014c13d1308b2220ca1) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `getRelativeLocaleUrl`, `getAbsoluteLocaleUrl`, and `getAbsoluteLocaleUrlList` to strip trailing slashes when `trailingSlash: 'never'` is configured

- [#16967](https://github.com/withastro/astro/pull/16967) [`3719765`](https://github.com/withastro/astro/commit/37197652630ffbc11efaaec1865869410b8dfd70) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes double URL-encoded paths returning 400 Bad Request on on-demand routes

  Previously, any URL containing a double-encoded character (like `%255B`, which is `[` encoded twice) was unconditionally rejected with a `400 Bad Request` before middleware or route handlers could run. This broke embedded tools like Sanity Studio whose client-side router legitimately produces double-encoded URLs.

  The fix replaces the rejection approach with iterative decoding — multi-level percent-encoding is now fully resolved to its canonical form before being passed to middleware and route matching. This preserves the security fix for CVE-2025-66202 (middleware authorization bypass via double encoding) because middleware now always sees the fully decoded path, making bypass impossible. For example, `/api/%2561dmin` is decoded to `/api/admin`, which middleware can correctly block.

- [#17066](https://github.com/withastro/astro/pull/17066) [`2f4d92a`](https://github.com/withastro/astro/commit/2f4d92a72b00354114359b5746d573fbfd3b334f) Thanks [@matthewp](https://github.com/matthewp)! - Fixes prerendered redirect targets being incorrectly bundled into the SSR function in hybrid mode, causing massive bundle size inflation

- [#16882](https://github.com/withastro/astro/pull/16882) [`621beb7`](https://github.com/withastro/astro/commit/621beb70fe957ecc73c3407c240392507613e0fd) Thanks [@jettwayio](https://github.com/jettwayio)! - fix(render): honour compressHTML when joining head elements

- [#16892](https://github.com/withastro/astro/pull/16892) [`8d753b0`](https://github.com/withastro/astro/commit/8d753b0b671971b78e7064fe38c2b0b518823627) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes custom elements in MDX having their children's `slot` attribute stripped by the JSX runtime

  When custom elements (tags with hyphens like `<my-element>`) are used in MDX files, the `slot` HTML attribute on their children is now correctly preserved. Previously, the shared JSX runtime would treat `slot` as an Astro slot assignment and remove it from the output, breaking Shadow DOM named slot distribution for web components.

- [#16957](https://github.com/withastro/astro/pull/16957) [`544ee76`](https://github.com/withastro/astro/commit/544ee763d7f7894e3b588daa14b09ef32a4d794a) Thanks [@thelazylamaGit](https://github.com/thelazylamaGit)! - Fixes stale inline CSS in server-rendered HTML after CSS file edits during dev

  When editing a CSS file (`.css`, `.scss`, etc.) during development, the inline `<style>` tags in server-rendered HTML would retain old CSS content instead of updating. This caused a brief flash of old CSS (FOUC) on fresh page loads before Vite's client-side HMR corrected the styles.

  The fix ensures that Astro's per-route dev CSS virtual modules are invalidated in both the SSR module graph and the module runner's evaluation cache when a style file changes, so the next page render picks up the fresh CSS.

- [#17044](https://github.com/withastro/astro/pull/17044) [`2220d22`](https://github.com/withastro/astro/commit/2220d22f8c7278988560d0e4b4f378c9967e9bae) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes CSS from `client:only` islands leaking to unrelated pages when Rollup bundles non-CSS-importing modules into the same chunk as CSS-importing modules

- [#17040](https://github.com/withastro/astro/pull/17040) [`7c4763d`](https://github.com/withastro/astro/commit/7c4763d31b94ccbdc2339992d73e087912e5b8e3) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes HMR not triggering for files inside the `src/middleware/` directory during dev

- [#16672](https://github.com/withastro/astro/pull/16672) [`52fc862`](https://github.com/withastro/astro/commit/52fc86213e6412b6f9f3b70a2616d52b5fb783a9) Thanks [@martinheidegger](https://github.com/martinheidegger)! - Fixes support for numeric IDs in YAML frontmatter when using content collection references

- [#16762](https://github.com/withastro/astro/pull/16762) [`9de80ae`](https://github.com/withastro/astro/commit/9de80ae486bc43c8680fda099a125d836e78b552) Thanks [@alexanderdombroski](https://github.com/alexanderdombroski)! - Adds a JSON schema to the Wrangler configuration file generated when running `astro add cloudflare`

- [#17046](https://github.com/withastro/astro/pull/17046) [`ef771ec`](https://github.com/withastro/astro/commit/ef771ece349eedb6e0b3b240b020fb96df208a92) Thanks [@ematipico](https://github.com/ematipico)! - Improves the diagnostics emitted when Astro parses incorrect `.astro` files.

## 6.4.6

### Patch Changes

- [#16765](https://github.com/withastro/astro/pull/16765) [`b10e86e`](https://github.com/withastro/astro/commit/b10e86e6dbaf04678127c86366befc0b78a164f6) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixes an issue where renaming an image file while the dev server is running triggers a build error. Now Astro correctly hot-reloads the image without crashing.

- [#17026](https://github.com/withastro/astro/pull/17026) [`add3df1`](https://github.com/withastro/astro/commit/add3df10fdaff469ae0228f09d99290de170029a) Thanks [@matthewp](https://github.com/matthewp)! - Hardens `addAttribute` to drop attribute names containing characters that are invalid per the HTML spec (`"`, `'`, `>`, `/`, `=`, whitespace)

- [#17033](https://github.com/withastro/astro/pull/17033) [`ffda27b`](https://github.com/withastro/astro/commit/ffda27b7c8697d4b7ed530e93385a420e1fc4acd) Thanks [@matthewp](https://github.com/matthewp)! - Validates the request origin against `allowedDomains` before fetching prerendered error pages. When `allowedDomains` is configured and the Host header matches, the original origin is used. Otherwise, the fetch falls back to `localhost`.

## 6.4.5

### Patch Changes

- [#16985](https://github.com/withastro/astro/pull/16985) [`4ecff32`](https://github.com/withastro/astro/commit/4ecff3268acb6ee3db719c4b38bbaead703ff4de) Thanks [@maximslo](https://github.com/maximslo)! - Fixes the `experimental.logger` destination not being used for the "Server listening on..." startup message. The logger is now resolved before the server starts listening, and `adapterLogger` re-creates itself when the underlying logger changes so the startup message uses the correct destination.

- [#16947](https://github.com/withastro/astro/pull/16947) [`e0703a6`](https://github.com/withastro/astro/commit/e0703a6e815be829759ab7912f7024ee8424c3ac) Thanks [@ematipico](https://github.com/ematipico)! - Fixes `Astro.request.url` not reflecting validated `X-Forwarded-Proto`/`X-Forwarded-Host` headers when `security.allowedDomains` is configured. Previously, only `Astro.url` was updated with the forwarded origin while `Astro.request.url` retained the socket-derived URL, causing the two to diverge behind TLS-terminating proxies.

- [#16997](https://github.com/withastro/astro/pull/16997) [`dc45246`](https://github.com/withastro/astro/commit/dc45246812afcaab60393e5236d27e95f98f5efa) Thanks [@matthewp](https://github.com/matthewp)! - Reverts a change to `isNode` runtime detection that caused a significant build time regression for Cloudflare adapter users with large prerendered sites

## 6.4.4

### Patch Changes

- [#16926](https://github.com/withastro/astro/pull/16926) [`1b39ae8`](https://github.com/withastro/astro/commit/1b39ae8485406937501d8a734afe2a464d671064) Thanks [@narendraio](https://github.com/narendraio)! - Prevents `App.match()` from throwing on request paths that contain an invalid percent-sequence.

- [#16924](https://github.com/withastro/astro/pull/16924) [`2c0bc94`](https://github.com/withastro/astro/commit/2c0bc943d96d602b429ce3ecbb379d01a46903b5) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes an issue where editing a client-side component (e.g. with `client:idle`, `client:load`, etc.) caused an unnecessary full program reload of the backend during development.

- [#16958](https://github.com/withastro/astro/pull/16958) [`2c1d50f`](https://github.com/withastro/astro/commit/2c1d50f5f9d557d7cdc17fd75f3a10fd203699c9) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixes a bug where static file endpoints using `getStaticPaths` with `.html` in dynamic param values (e.g. `{ path: 'file.html' }`) would fail with a `NoMatchingStaticPathFound` error during build. The `.html` suffix is no longer incorrectly stripped from endpoint route pathnames.

- [#16855](https://github.com/withastro/astro/pull/16855) [`c610cda`](https://github.com/withastro/astro/commit/c610cda44b273c15a6e7eaa4a84fa194002643e1) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes dynamic routes returning 500 "TypeError: Missing parameter" when using domain-based i18n routing in SSR.

- [#16946](https://github.com/withastro/astro/pull/16946) [`606c37b`](https://github.com/withastro/astro/commit/606c37b886a9e25170ba82634cc81a8a775e8ac6) Thanks [@ematipico](https://github.com/ematipico)! - Fixes `Astro.routePattern` to preserve original casing of dynamic parameter names from filenames. Previously, a file at `src/pages/blog/[postId].astro` would return `/blog/[postid]` for `Astro.routePattern` due to an internal `.toLowerCase()` call. It now correctly returns `/blog/[postId]`.

- [#16720](https://github.com/withastro/astro/pull/16720) [`16d49b6`](https://github.com/withastro/astro/commit/16d49b694071be212fb8c5a141ade72e8717a30e) Thanks [@thomas-callahan-collibra](https://github.com/thomas-callahan-collibra)! - Fix an issue where dynamic routes would return the string `[object Object]` instead of the expected content, in certain runtimes.

- [#16703](https://github.com/withastro/astro/pull/16703) [`17390a6`](https://github.com/withastro/astro/commit/17390a6184d5cbd5ff85b7f652a92f5a6a7b0557) Thanks [@henrybrewer00-dotcom](https://github.com/henrybrewer00-dotcom)! - Fixes styles being stripped when the project root is started with a path whose case differs from the actual filesystem case (e.g. running `astro dev` from `d:\dev\app` while the folder on disk is `D:\dev\app`).

- [#16855](https://github.com/withastro/astro/pull/16855) [`c610cda`](https://github.com/withastro/astro/commit/c610cda44b273c15a6e7eaa4a84fa194002643e1) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `Astro.currentLocale` returning the default locale instead of the domain's locale on dynamic routes served from a mapped domain.

## 6.4.3

### Patch Changes

- [#16900](https://github.com/withastro/astro/pull/16900) [`17a0fbd`](https://github.com/withastro/astro/commit/17a0fbd34d11db765e79caf269bfd5f43ef51da8) Thanks [@ocavue](https://github.com/ocavue)! - Bumps `devalue` dependency to v5.8.1

- [#16016](https://github.com/withastro/astro/pull/16016) [`0d85e1b`](https://github.com/withastro/astro/commit/0d85e1b7ea58a243bd1b61bdfb951c4fd87b9db5) Thanks [@felmonon](https://github.com/felmonon)! - Fix a false positive in the dev toolbar accessibility audit for anchors with text inside closed `<details>` elements.

- [#16911](https://github.com/withastro/astro/pull/16911) [`79c6c46`](https://github.com/withastro/astro/commit/79c6c469a735bece8a80200f7b188e15f1abff24) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a bug where `experimental.advancedRouting` with `astro/hono` handlers threw `TypeError: Cannot read properties of undefined (reading 'route')` for unmatched routes instead of rendering the custom 404 page.

- [#16899](https://github.com/withastro/astro/pull/16899) [`239c469`](https://github.com/withastro/astro/commit/239c469cd2cd66d147a302a2ca14e07a0891f9b8) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a false "does not call the middleware() handler" warning when using `astro()` in a custom `src/app.ts` and the first request is a redirect route.

- [#16887](https://github.com/withastro/astro/pull/16887) [`493acdb`](https://github.com/withastro/astro/commit/493acdb4abc56534e9efa68af16e3ef273d7d88b) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `redirectToDefaultLocale` not working after the Advanced Routing refactoring.

- [#16908](https://github.com/withastro/astro/pull/16908) [`ef53ab9`](https://github.com/withastro/astro/commit/ef53ab91e8362b50bb1a3ab73d9350b93ea41de4) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves optimized fallbacks generation when using the Fonts API by using better metrics for bold variants

## 6.4.2

### Patch Changes

- [#16889](https://github.com/withastro/astro/pull/16889) [`b94bcfd`](https://github.com/withastro/astro/commit/b94bcfd8da64a3f2862a20572e7a9847aebdbc70) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes a `plugins is not iterable` crash when using a pre-6.0 `@astrojs/mdx` alongside integrations (e.g. Starlight) that set `markdown.remarkPlugins`, `markdown.rehypePlugins`, or `markdown.remarkRehype`.

- [#16878](https://github.com/withastro/astro/pull/16878) [`b9f6bb9`](https://github.com/withastro/astro/commit/b9f6bb9a238b909d491ca4a7a99620908faf58a8) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixes an issue where on-demand (SSR) dynamic routes would return 404 when a prerendered dynamic route with the same URL pattern was sorted first alphabetically. In production builds with `@astrojs/node` adapter, if `[a_prebuild].astro` (prerender=true) came before `[b_ssr].astro` alphabetically, requests to URLs not in the prerendered route's static paths would 404 instead of falling through to the SSR route. The fix adds fallthrough logic so that when a prerendered dynamic route matches but can't serve the request, Astro tries subsequent matching routes.

## 6.4.1

### Patch Changes

- [#16883](https://github.com/withastro/astro/pull/16883) [`eeb064c`](https://github.com/withastro/astro/commit/eeb064ca9452fd9d0ad9b7557059a646a90a3e57) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Restores the `astro/jsx/rehype.js` entry point so that older versions of `@astrojs/mdx` continue to work when used with Astro 6.x. This entry point will be removed in Astro 7.0.

## 6.4.0

### Minor Changes

- [#16468](https://github.com/withastro/astro/pull/16468) [`4cff3a1`](https://github.com/withastro/astro/commit/4cff3a107c3750ab5f0878a6b41836705282b771) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `preserveBuildServerDir` adapter feature

  Adapters can now set `preserveBuildServerDir: true` in their adapter features to keep the `dist/server/` directory structure for static builds, mirroring the existing `preserveBuildClientDir` option. This is useful for adapters that require a consistent `dist/client/` and `dist/server/` layout regardless of build output type.

  ```js
  setAdapter({
    name: 'my-adapter',
    adapterFeatures: {
      buildOutput,
      preserveBuildClientDir: true,
      preserveBuildServerDir: true,
    },
  });
  ```

- [#16848](https://github.com/withastro/astro/pull/16848) [`f732f3c`](https://github.com/withastro/astro/commit/f732f3cc716342a63e5b03815243ba10964b89dc) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `markdown.processor` configuration option, allowing you to choose an alternative Markdown processor.

  Websites with many Markdown/MDX files tend to be slow to build because the unified ecosystem (e.g., remark, rehype) is slow to process. This feature introduces the ability to replace this part of the build pipeline with another processor.

  The default processor is `unified()`. This means that existing configurations remain unchanged and your remark/rehype plugins continue to work.

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import { unified } from '@astrojs/markdown-remark';
  import remarkToc from 'remark-toc';

  export default defineConfig({
    markdown: {
      processor: unified({
        remarkPlugins: [remarkToc],
      }),
    },
  });
  ```

  In addition to this new configuration option, Astro provides a new alternative processor based on Rust: [Sätteri](https://satteri.bruits.org/). You can choose to use it now by installing `@astrojs/markdown-satteri`, importing the `satteri()` processor, and adapting your existing configuration:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import { satteri } from '@astrojs/markdown-satteri';

  export default defineConfig({
    markdown: {
      processor: satteri({
        features: { directive: true },
      }),
    },
  });
  ```

  This processor does not support the remark and rehype plugins. This means you may need to convert them to [MDAST or HAST plugins](https://satteri.bruits.org/docs/plugins/) to retain your current functionality.

  The existing top-level `markdown.remarkPlugins`, `markdown.rehypePlugins`, `markdown.remarkRehype`, `markdown.gfm`, and `markdown.smartypants` options still work, but are now deprecated and will be removed in a future major update. The matching `remarkPlugins`, `rehypePlugins`, and `remarkRehype` options on the MDX integration are also deprecated for the same reason. To anticipate their removal, move them onto `unified({...})` (or your preferred plugin processor) :

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import remarkToc from 'remark-toc';
  import rehypeSlug from 'rehype-slug';
  + import { unified } from '@astrojs/markdown-remark';

  export default defineConfig({
    markdown: {
  +    processor: unified({
  +      remarkPlugins: [remarkToc],
  +      rehypePlugins: [rehypeSlug],
  +      remarkRehype: true,
  +      gfm: true,
  +      smartypants: true,
  +    }),
  -    remarkPlugins: [remarkToc],
  -    rehypePlugins: [rehypeSlug],
  -    remarkRehype: true,
  -    gfm: true,
  -    smartypants: true,
    },
  });
  ```

  For more information on enabling and using this feature in your project, see our [Markdown guide](https://docs.astro.build/en/guides/markdown-content/). To give feedback on this new Rust processor, see the [Native Markdown / MDX parsing and processing RFC](https://github.com/withastro/roadmap/pull/1364).

### Patch Changes

- [#16468](https://github.com/withastro/astro/pull/16468) [`4cff3a1`](https://github.com/withastro/astro/commit/4cff3a107c3750ab5f0878a6b41836705282b771) Thanks [@matthewp](https://github.com/matthewp)! - Skips the static preview server when an adapter provides its own `previewEntrypoint`, allowing the adapter to handle both static and dynamic routes

- [#16811](https://github.com/withastro/astro/pull/16811) [`e0e26db`](https://github.com/withastro/astro/commit/e0e26dbfe95f9d42f51ad414dbe877e60cbc637d) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `X-Forwarded-Host` and `X-Forwarded-Proto` headers being ignored when set in a custom `src/app.ts` fetch handler before creating `FetchState`

- [#16468](https://github.com/withastro/astro/pull/16468) [`4cff3a1`](https://github.com/withastro/astro/commit/4cff3a107c3750ab5f0878a6b41836705282b771) Thanks [@matthewp](https://github.com/matthewp)! - Fixes the static preview server to respect `preserveBuildClientDir`, serving files from `build.client` instead of `outDir` when the adapter requires it

- [#16770](https://github.com/withastro/astro/pull/16770) [`1e2aa11`](https://github.com/withastro/astro/commit/1e2aa11caf8e7a48f37dd614fd2d4c15cc7a8439) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a race condition where the Vite dep optimizer could lose React dependencies in dev mode when using Astro Actions

- [#16468](https://github.com/withastro/astro/pull/16468) [`4cff3a1`](https://github.com/withastro/astro/commit/4cff3a107c3750ab5f0878a6b41836705282b771) Thanks [@matthewp](https://github.com/matthewp)! - Exempts internal routes (e.g. server islands) from `getStaticPaths()` validation, fixing server island rendering on static sites

- [#16468](https://github.com/withastro/astro/pull/16468) [`4cff3a1`](https://github.com/withastro/astro/commit/4cff3a107c3750ab5f0878a6b41836705282b771) Thanks [@matthewp](https://github.com/matthewp)! - Fixes preview for static sites that contain non-prerendered routes. Previously, the preview command ignored SSR routes discovered during route scanning and always used the static preview server.

- Updated dependencies [[`f732f3c`](https://github.com/withastro/astro/commit/f732f3cc716342a63e5b03815243ba10964b89dc), [`f732f3c`](https://github.com/withastro/astro/commit/f732f3cc716342a63e5b03815243ba10964b89dc)]:
  - @astrojs/internal-helpers@0.10.0
  - @astrojs/markdown-remark@7.2.0

## 6.3.8

### Patch Changes

- [#16830](https://github.com/withastro/astro/pull/16830) [`f2bf3cb`](https://github.com/withastro/astro/commit/f2bf3cb257788ff657ffbe9044fe6225e6662cb7) Thanks [@matthewp](https://github.com/matthewp)! - Fixes 404s for dynamically imported JS chunks when using an adapter with `assetQueryParams` (e.g. Vercel skew protection)

- [#16831](https://github.com/withastro/astro/pull/16831) [`ace96ba`](https://github.com/withastro/astro/commit/ace96ba5024129cbeb9d8e75134f4f8bdf42a57a) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a misleading `GetStaticPathsRequired` error when a redirect is configured from a dynamic route to a static (or less-dynamic) destination. For example, `'/project/[slug]': '/'` previously produced a confusing error pointing at `index.astro`. Astro now detects the parameter mismatch at config validation time and throws a clear `InvalidRedirectDestination` error naming the missing parameters.

- [#16702](https://github.com/withastro/astro/pull/16702) [`b7d1758`](https://github.com/withastro/astro/commit/b7d1758efbe0544520b4b15577d2e0dd944bf8a1) Thanks [@matthewp](https://github.com/matthewp)! - Fixes scoped styles from `.astro` components being dropped when rendered inside MDX content (`<Content />` from `render(entry)`) passed through a named slot using `<Fragment slot="X">`. The Fragment component now eagerly evaluates its slot contents to ensure propagating components register their styles before head content is flushed.

- [#16823](https://github.com/withastro/astro/pull/16823) [`3df6a45`](https://github.com/withastro/astro/commit/3df6a453243ff4d1d983d0fb6d259617f50be211) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes missing CSS for conditionally rendered Svelte components in production builds

- [#16836](https://github.com/withastro/astro/pull/16836) [`3d7adfa`](https://github.com/withastro/astro/commit/3d7adfae7d063661d85d92061a15f728fa5df2bd) Thanks [@LongYC](https://github.com/LongYC)! - Document compressHTML: "jsx" config is only available since Astro v6.2.0

- [#16864](https://github.com/withastro/astro/pull/16864) [`334ce13`](https://github.com/withastro/astro/commit/334ce135807666df283dc4cd4d5f6dad1b1b80cc) Thanks [@cheets](https://github.com/cheets)! - Fixes a false-positive `Internal Warning: route cache overwritten` logged on every SSR request for dynamic routes

## 6.3.7

### Patch Changes

- [#16821](https://github.com/withastro/astro/pull/16821) [`9c76b12`](https://github.com/withastro/astro/commit/9c76b12052c445416df6b034d7b6df66957a0503) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes request body handling in the Node adapter when `req.body` is a `Buffer`, `Uint8Array`, or `ArrayBuffer`. Previously, binary body data was incorrectly JSON-stringified (producing `{"type":"Buffer","data":[...]}`) instead of being passed through directly. This affected libraries like `serverless-http` that set `req.body` to a `Buffer`.

- [#16785](https://github.com/withastro/astro/pull/16785) [`de96360`](https://github.com/withastro/astro/commit/de963608d82e9bab74896945aa6503ba164ddbb0) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `vite.build.minify`, `vite.build.sourcemap`, and `vite.build.rollupOptions.output` (e.g. `compact`) being ignored for client-side builds. These top-level Vite build options are now properly forwarded to the client environment, with environment-specific overrides (`vite.environments.client.build.*`) taking priority when set.

- [#16819](https://github.com/withastro/astro/pull/16819) [`b5dd8f1`](https://github.com/withastro/astro/commit/b5dd8f1e82813a646c4c61510764fc83b2fcafd4) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes custom elements in MDX files bypassing the renderer pipeline. Custom elements (tags containing hyphens like `<my-element>`) in `.mdx` files are now routed through registered renderers for SSR, matching the behavior of `.astro` files. If no renderer claims the element, it falls back to rendering as raw HTML.

- [#16808](https://github.com/withastro/astro/pull/16808) [`765896c`](https://github.com/withastro/astro/commit/765896cd4d03755093d6c9f47d69285ac910b848) Thanks [@ematipico](https://github.com/ematipico)! - Fixes dynamic routes returning 400 Bad Request when the URL contains a literal `%` character, such as paths built with `encodeURIComponent('%?.pdf')`

- [#16804](https://github.com/withastro/astro/pull/16804) [`90d2aca`](https://github.com/withastro/astro/commit/90d2aca7536e600062e6b9d787ef7e60990a23fe) Thanks [@jp-knj](https://github.com/jp-knj)! - Fixes a v6 regression where `astro:i18n` could not be imported from client `<script>` blocks.

## 6.3.6

### Patch Changes

- [#16774](https://github.com/withastro/astro/pull/16774) [`8f77583`](https://github.com/withastro/astro/commit/8f7758313df4af52e83e039bb64c41006de93c4e) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes markdown images with empty alt text (`![](image.jpg)`) in content collections dropping the `alt` attribute entirely. The `alt=""` attribute is now correctly preserved in the rendered HTML output, which is important for accessibility (indicating decorative images).

- [#16776](https://github.com/withastro/astro/pull/16776) [`3d10b5e`](https://github.com/withastro/astro/commit/3d10b5e16256ff9999e757f86cf2c4f04c36a311) Thanks [@matthewp](https://github.com/matthewp)! - Fixes HMR serving stale content when components are passed as props via `getStaticPaths()`

- [#16784](https://github.com/withastro/astro/pull/16784) [`7453860`](https://github.com/withastro/astro/commit/7453860fb4fb34017365c135678bfd76f1f9aeb5) Thanks [@ematipico](https://github.com/ematipico)! - Improved the printing of the build time if it goes over the 60 seconds.

- [#16665](https://github.com/withastro/astro/pull/16665) [`3dbbcee`](https://github.com/withastro/astro/commit/3dbbcee0a7015867cb1b6770440ba51d1eee3445) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes remote SVG sources erroring with `dangerouslyProcessSVG` after the v6.3 SVG-processing gate. The default Sharp service now resolves the output format from the source up-front when it can (URL extension, `data:` MIME, ESM metadata), and from the actual buffer at request time when it can't, so SVG sources pass through untouched without needing to set `image.dangerouslyProcessSVG: true` or an explicit `format="svg"`.

  The error message has also been updated to point at `format="svg"` as the simpler workaround when an SVG source is encountered without `dangerouslyProcessSVG` enabled.

- [#16777](https://github.com/withastro/astro/pull/16777) [`1754b91`](https://github.com/withastro/astro/commit/1754b91dec1e5d9839ddfc39fbf2ee1fbb9391a4) Thanks [@matthewp](https://github.com/matthewp)! - Fixes HMR serving stale content for dynamically imported components through barrel files

- [#16730](https://github.com/withastro/astro/pull/16730) [`068d924`](https://github.com/withastro/astro/commit/068d924402dced7670530774f36cca301f91e60c) Thanks [@harshagarwalnyu](https://github.com/harshagarwalnyu)! - Fixes an issue where the `file()` content loader did not generate a valid JSON Schema for collections whose JSON or YAML data is a top-level array instead of an object.

## 6.3.5

### Patch Changes

- [#16771](https://github.com/withastro/astro/pull/16771) [`07c8805`](https://github.com/withastro/astro/commit/07c880500926e3337798ca906d9422c880c6e148) Thanks [@ematipico](https://github.com/ematipico)! - Fixes `position` prop on `<Image>` and `<Picture>` components breaking Content Security Policy (CSP).

- [#16593](https://github.com/withastro/astro/pull/16593) [`50924ce`](https://github.com/withastro/astro/commit/50924cea1faf32b8c14b031936e93812033b04ca) Thanks [@yanthomasdev](https://github.com/yanthomasdev)! - Improves error messages with more consistent and correct writing.

- [#16757](https://github.com/withastro/astro/pull/16757) [`5d661cd`](https://github.com/withastro/astro/commit/5d661cd226cd9abb4f0f352231f2f68feec52ab4) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes dev server serving stale content when SSR-only modules change (e.g. `.astro` files outside the project root in a monorepo, or dynamically imported components).

  Previously, the `astro:hmr-reload` plugin returned an empty array after detecting SSR-only module changes, which prevented Vite's `updateModules` from propagating the invalidation to the SSR module runner. The runner's evaluated module cache stayed stale, so subsequent requests continued returning old content.

  Now the plugin returns the SSR-only modules so Vite can process them through `updateModules`, which properly invalidates the module runner's cache and ensures fresh content on the next request.

## 6.3.4

### Patch Changes

- [#16723](https://github.com/withastro/astro/pull/16723) [`0f10bfe`](https://github.com/withastro/astro/commit/0f10bfe70d443ebe5474a72f59c3a3e745831b98) Thanks [@matthewp](https://github.com/matthewp)! - Adds `fetchFile` option to `experimental.advancedRouting` to customize or disable the entrypoint file

  ```js
  export default defineConfig({
    experimental: {
      advancedRouting: {
        fetchFile: 'fetch.ts',
      },
    },
  });
  ```

- [#16723](https://github.com/withastro/astro/pull/16723) [`0f10bfe`](https://github.com/withastro/astro/commit/0f10bfe70d443ebe5474a72f59c3a3e745831b98) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Hono `cache()` middleware to follow the standard wrapper pattern

- [#16723](https://github.com/withastro/astro/pull/16723) [`0f10bfe`](https://github.com/withastro/astro/commit/0f10bfe70d443ebe5474a72f59c3a3e745831b98) Thanks [@matthewp](https://github.com/matthewp)! - Adds `App.Providers` interface for typing custom context providers on `Astro` and `ctx`

  ```ts
  declare namespace App {
    interface Providers {
      oauth: import('./lib/oauth').OAuthSession;
    }
  }
  ```

- [#16723](https://github.com/withastro/astro/pull/16723) [`0f10bfe`](https://github.com/withastro/astro/commit/0f10bfe70d443ebe5474a72f59c3a3e745831b98) Thanks [@matthewp](https://github.com/matthewp)! - Adds `FetchState.response` property, set automatically after `pages()` or `middleware()` completes

  ```ts
  const response = await middleware(state, (s) => pages(s));
  console.log(state.response === response); // true
  ```

- [#16723](https://github.com/withastro/astro/pull/16723) [`0f10bfe`](https://github.com/withastro/astro/commit/0f10bfe70d443ebe5474a72f59c3a3e745831b98) Thanks [@matthewp](https://github.com/matthewp)! - Adds `Fetchable` type export for typing the advanced routing entrypoint

  ```ts
  import type { Fetchable } from 'astro';

  export default {
    async fetch(request) {
      return new Response('ok');
    },
  } satisfies Fetchable;
  ```

- [#16572](https://github.com/withastro/astro/pull/16572) [`4a5a077`](https://github.com/withastro/astro/commit/4a5a0779712be11680a9fc729be2ba9dd93f68d2) Thanks [@DORI2001](https://github.com/DORI2001)! - Suppresses `[WARN] Vite warning: unused imports from "@astrojs/internal-helpers/remote"` during prerender builds. The package is now bundled alongside `astro` in the prerender environment, matching how it is handled in the SSR environment.

- [#16756](https://github.com/withastro/astro/pull/16756) [`b6ee23d`](https://github.com/withastro/astro/commit/b6ee23d339311c356ad25781f62454aee289e47b) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes styles from Markdoc/MDX custom components not being extracted to `<head>` in the dev server when using the Cloudflare adapter with `prerenderEnvironment: 'node'` and rendering content through a wrapper component.

- [#16747](https://github.com/withastro/astro/pull/16747) [`904d19a`](https://github.com/withastro/astro/commit/904d19a73e91dc166c492905ebf6c81705fa7064) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes Astro action requests failing in `astro dev` when using the Cloudflare adapter with `prerenderEnvironment: 'node'` alongside a prerendered catch-all route such as `[...page].astro`.

  Actions and other SSR POST endpoints now continue to work in dev instead of returning an HTTP 500 error.

- [#16701](https://github.com/withastro/astro/pull/16701) [`3495ce4`](https://github.com/withastro/astro/commit/3495ce4f3af103673e32b6fdd452e4108252e1b5) Thanks [@demaisj](https://github.com/demaisj)! - Fix `Map` and `Set` instances saved in a content collection being broken when retrieving entries.

- [#16614](https://github.com/withastro/astro/pull/16614) [`fca1c32`](https://github.com/withastro/astro/commit/fca1c32c329f6044c6833debdb9d683dd2103fc9) Thanks [@Eptagone](https://github.com/Eptagone)! - Fixes `entry.data` type inference when a live collection is configured without a schema.

- [#16661](https://github.com/withastro/astro/pull/16661) [`03b8f7f`](https://github.com/withastro/astro/commit/03b8f7f7644cc1d9e738a8221d6bd377399538c0) Thanks [@ocavue](https://github.com/ocavue)! - Updates `typescript` to v6. No changes are needed from users.

- [#16681](https://github.com/withastro/astro/pull/16681) [`c22770a`](https://github.com/withastro/astro/commit/c22770a58c3b312ad4bba81707be72f551ee02db) Thanks [@dotnetCarpenter](https://github.com/dotnetCarpenter)! - Fixes an issue where SVG images with `width="0"` or `height="0"` incorrectly threw a `NoImageMetadata` error instead of being treated as valid dimensions.

## 6.3.3

### Patch Changes

- [#16737](https://github.com/withastro/astro/pull/16737) [`bd84f33`](https://github.com/withastro/astro/commit/bd84f33d68cfa7d077e0a638970e28b0a9bd83db) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a reflected XSS vulnerability where slot names on hydrated components were not HTML-escaped in SSR output

## 6.3.2

### Patch Changes

- [#16675](https://github.com/withastro/astro/pull/16675) [`11d4592`](https://github.com/withastro/astro/commit/11d4592e9498e900b433ba94abed9cd615a9350b) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a regression where `Astro.cache` was `undefined` when `experimental.cache` was not configured.

  The previous documented behavior is for `Astro.cache` to always be defined as a no-op shim: `cache.set()` warns once, `cache.invalidate()` throws and `cache.enabled` can be used to gate. This allows library and user code can call cache methods without conditional checks. The cache provider registration was being gated at the call site on `experimental.cache` being configured, which meant the disabled shim branch inside the provider was unreachable and the `Astro.cache` getter was never attached to the context.

- [#16691](https://github.com/withastro/astro/pull/16691) [`0f0a4ce`](https://github.com/withastro/astro/commit/0f0a4ce1b28a6d6ec1658c7f59e0e68408935135) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `HTMLElement is not defined` error during HMR when using components with client-side scripts (e.g. Starlight `<Tabs>`) and the Cloudflare adapter

- [#16562](https://github.com/withastro/astro/pull/16562) [`07529ec`](https://github.com/withastro/astro/commit/07529eccdaef8727a375475e6d04071b770114a1) Thanks [@matthewp](https://github.com/matthewp)! - Fixes non-prerendered routes failing when a dynamic prerendered route exists in the same project with `prerenderEnvironment: 'node'`

- [#16638](https://github.com/withastro/astro/pull/16638) [`272185b`](https://github.com/withastro/astro/commit/272185bcccf6a4adcd7575f319bf91f2e5306c6d) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the Astro compiler wasn't freed at the end of the build. After the fix, the memory used by the compiler is now correctly freed at the end of the build.

- [#16544](https://github.com/withastro/astro/pull/16544) [`d365c97`](https://github.com/withastro/astro/commit/d365c975ba2d88fc1dbdfe698df2bf9e2eafadce) Thanks [@matthewp](https://github.com/matthewp)! - Tightens `isRemotePath()` to reject control characters after a leading slash and fixes the dev image endpoint origin check

- [#16685](https://github.com/withastro/astro/pull/16685) [`889e748`](https://github.com/withastro/astro/commit/889e748f1546eabc325d5112f95bc78e402fd4f0) Thanks [@farrosfr](https://github.com/farrosfr)! - Improve validation messages for `security.csp.directives` when `script-src` or `style-src` are incorrectly placed in the `directives` array.

- [#16605](https://github.com/withastro/astro/pull/16605) [`772f13a`](https://github.com/withastro/astro/commit/772f13a153db235a232a86dc533df3b07a1a09a0) Thanks [@rururux](https://github.com/rururux)! - Fixes `assetsPrefix` not being available on `build` from `astro:config/server`.

- [#16556](https://github.com/withastro/astro/pull/16556) [`f38dec7`](https://github.com/withastro/astro/commit/f38dec76a48234ae6919a118f3d626c6ed3d4e80) Thanks [@matthewp](https://github.com/matthewp)! - Rejects double-encoded URL paths with a 400 response instead of silently falling back to partial decoding

- [#16659](https://github.com/withastro/astro/pull/16659) [`38bcb25`](https://github.com/withastro/astro/commit/38bcb25282d1f794b7dff349071b089a2737f0aa) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Fixes `&` characters appearing as raw entity strings (e.g. `&#38;`) in `<meta>` tags when viewed in link previews or raw HTML.

- Updated dependencies [[`d365c97`](https://github.com/withastro/astro/commit/d365c975ba2d88fc1dbdfe698df2bf9e2eafadce), [`9256345`](https://github.com/withastro/astro/commit/92563452ce866d9f9b950ad4b2adc808d10e8014)]:
  - @astrojs/internal-helpers@0.9.1
  - @astrojs/markdown-remark@7.1.2

## 6.3.1

### Patch Changes

- [#16646](https://github.com/withastro/astro/pull/16646) [`15fbc41`](https://github.com/withastro/astro/commit/15fbc41bb2fe64e8aee15acbe01abb4792145e8a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes local images returning 404 on non-prerendered pages when using the generic image endpoint

## 6.3.0

### Minor Changes

- [#16366](https://github.com/withastro/astro/pull/16366) [`d69f858`](https://github.com/withastro/astro/commit/d69f858475bee448d0873df4579e1c635223c248) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `experimental.advancedRouting` option that lets you take full control of Astro's request handling pipeline by creating a `src/app.ts` file in your project.

  Today, Astro handles every incoming request through a fixed internal pipeline: trailing slash normalization, redirects, actions, middleware, page rendering, i18n, and so on. That pipeline works great for most sites, but as projects grow you often want to run your own logic _between_ those steps — an auth check before rendering, a rate limiter before actions, custom logging around the whole stack. Advanced routing gives you that control.

  When enabled, Astro looks for a `src/app.ts` file in your project. If it finds one, that file becomes the entrypoint for all server-rendered requests. You compose the pipeline yourself using the handlers Astro provides, and you can slot your own logic anywhere in the chain.

  #### Enabling advanced routing

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      advancedRouting: true,
    },
  });
  ```

  #### Two ways to build your pipeline

  Astro ships two entrypoints for advanced routing: `astro/fetch` and `astro/hono`.

  **`astro/fetch`** is a low-level, framework-free API built on the Web Fetch standard. You create a `FetchState` from the incoming request, then call handler functions in sequence. Each handler takes the state, does its work, and returns a `Response` (or `undefined` to pass through). This is the core primitive that everything else is built on:

  ```ts
  // src/app.ts
  import {
    FetchState,
    trailingSlash,
    redirects,
    actions,
    middleware,
    pages,
    i18n,
  } from 'astro/fetch';

  export default {
    async fetch(request: Request) {
      const state = new FetchState(request);

      // Early exits — these return a Response only when they apply.
      const slash = trailingSlash(state);
      if (slash) return slash;

      const redirect = redirects(state);
      if (redirect) return redirect;

      const action = await actions(state);
      if (action) return action;

      // Middleware wraps page rendering; i18n post-processes the response.
      const response = await middleware(state, () => pages(state));
      return i18n(state, response);
    },
  };
  ```

  **`astro/hono`** wraps the same handlers as [Hono](https://hono.dev) middleware, so you can mix Astro's pipeline with Hono's ecosystem of middleware (logger, CORS, JWT, rate limiting, etc.) using the `app.use()` pattern you already know:

  ```ts
  // src/app.ts
  import { Hono } from 'hono';
  import { getCookie } from 'hono/cookie';
  import { logger } from 'hono/logger';
  import { actions, middleware, pages, i18n } from 'astro/hono';

  const app = new Hono();

  app.use(logger());

  // Auth gate — only runs for /dashboard routes.
  app.use('/dashboard/*', async (c, next) => {
    const session = getCookie(c, 'session');
    if (!session) return c.redirect('/login');
    return next();
  });

  app.use(actions());
  app.use(middleware());
  app.use(pages());
  app.use(i18n());

  export default app;
  ```

  Both approaches give you the same power — pick whichever fits your project. If you don't need a framework, `astro/fetch` keeps things minimal. If you want a rich middleware ecosystem, `astro/hono` gets you there with one import.

  For more information on enabling and using this feature in your project, see the [experimental advanced routing docs](https://docs.astro.build/en/reference/experimental-flags/advanced-routing/). To give feedback, or to keep up with its development, see the [advanced routing RFC](https://github.com/withastro/roadmap/blob/advanced-routing-stage-3/proposals/0056-advanced-routing.md) for more information and discussion.

- [#16366](https://github.com/withastro/astro/pull/16366) [`d69f858`](https://github.com/withastro/astro/commit/d69f858475bee448d0873df4579e1c635223c248) Thanks [@matthewp](https://github.com/matthewp)! - Adds a `consume()` instance method to `AstroCookies`. This method marks the cookies as consumed and returns the `Set-Cookie` header values. After consumption, any subsequent `set()` calls will log a warning, since the headers have already been sent.

  Previously this was only available as a static method `AstroCookies.consume(cookies)`. The static method is now deprecated but kept for backward compatibility with existing adapters.

- [#16412](https://github.com/withastro/astro/pull/16412) [`ba2d2e3`](https://github.com/withastro/astro/commit/ba2d2e3a4647b6ca84af6f06d4136e2824254305) Thanks [@0xbejaxer](https://github.com/0xbejaxer)! - Add retry and error event handling for `astro-island` hydration import failures to reduce unrecoverable hydration errors on transient network failures.

- [#16582](https://github.com/withastro/astro/pull/16582) [`885cd31`](https://github.com/withastro/astro/commit/885cd31051ef848b75a0c0228747d815b24dc7da) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `image.dangerouslyProcessSVG` flag to optionally enable processing SVG inputs. For security reasons, Astro will no longer rasterizes SVG image sources by default in its default image service and endpoint.

  Set `image.dangerouslyProcessSVG: true` to opt back into processing SVG inputs.

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    // ...
    image: {
      dangerouslyProcessSVG: true,
    },
  });
  ```

  Note that this is a breaking change for users who were previously relying on Astro's default image service to rasterize SVG inputs, but it is a necessary change to improve security and prevent potential vulnerabilities.

- [#16519](https://github.com/withastro/astro/pull/16519) [`1b1c218`](https://github.com/withastro/astro/commit/1b1c218c2cf76806f94afbd1cdc2af27c8abc6d0) Thanks [@louisescher](https://github.com/louisescher)! - Adds support for redirecting URLs in remote image optimization.

  Previously, when a remote image URL meant to be optimized by Astro led to a redirect, Astro would fail silently and ignore the redirect. Now, Astro tracks up to 10 redirects for these images. If any of the redirects are not covered by a pattern in `image.remotePatterns` or a domain in `image.domains`, Astro will fail with a helpful error message.

  In the following example, the first image would be loaded successfully, while the second would lead to Astro throwing an error:

  ```mjs
  export default defineConfig({
    image: {
      domains: ['example.com', 'cdn.example.com'],
    },
  });
  ```

  ```tsx
  {
    /* Redirects to https://cdn.example.com/assets/image.png: */
  }
  <Image
    src="https://example.com/assets/image.png"
    width="1920"
    height="1080"
    alt="An example image."
  />;

  {
    /* Redirects to https://malicious.com/image.png: */
  }
  <Image
    src="https://example.com/bad-image.png"
    width="1920"
    height="1080"
    alt="An example image."
  />;
  ```

  In cases where all redirects to HTTPS hosts should be trusted, the following configuration for `image.remotePatterns` can be used:

  ```mjs
  export default defineConfig({
    image: {
      remotePatterns: [
        {
          protocol: 'https',
        },
      ],
    },
  });
  ```

### Patch Changes

- [#16592](https://github.com/withastro/astro/pull/16592) [`9c6efc5`](https://github.com/withastro/astro/commit/9c6efc5eb85d76b580ab53da412ca099c32ed825) Thanks [@matthewp](https://github.com/matthewp)! - Escapes interpolated values in the dev server redirect HTML template, consistent with how the 404 template already handles them

- [#16585](https://github.com/withastro/astro/pull/16585) [`78f305e`](https://github.com/withastro/astro/commit/78f305e6962b50f7cce69772471ab318b6ef4c8a) Thanks [@web-dev0521](https://github.com/web-dev0521)! - Fixes `z.array(z.boolean())` in form actions incorrectly coercing the string `"false"` to `true`. Boolean array elements now use the same `'true'`/`'false'` string comparison as single `z.boolean()` fields, so submitting `["false", "true", "false"]` correctly parses as `[false, true, false]`.

- [#16567](https://github.com/withastro/astro/pull/16567) [`12a03f2`](https://github.com/withastro/astro/commit/12a03f2492c2f32f0bd39dd85b8bc8bf1fbbc138) Thanks [@matthewp](https://github.com/matthewp)! - Fixes deleted content collection entries persisting in `getCollection()` results during dev

- [#16595](https://github.com/withastro/astro/pull/16595) [`ce9b25c`](https://github.com/withastro/astro/commit/ce9b25c3edb92d9de5368dcf86a6af57254f7a31) Thanks [@web-dev0521](https://github.com/web-dev0521)! - Fixes `pushDirective` in the CSP runtime duplicating the new directive once per existing non-matching directive. Calling `insertDirective()` (or otherwise pushing a directive whose name is not yet in the list) now appends it exactly once, and a directive that merges with a later existing entry no longer leaves an unmerged copy behind.

- [#16600](https://github.com/withastro/astro/pull/16600) [`94e4b7c`](https://github.com/withastro/astro/commit/94e4b7cf8566625563a0fa0ea8bc26fe831b2fe1) Thanks [@web-dev0521](https://github.com/web-dev0521)! - Fixes `Astro.preferredLocale` returning the wrong value when `i18n.locales` mixes object-form entries (`{ path, codes }`) with string entries that normalize to the same locale. The first matching code in the configured `locales` order is now selected, matching the documented behavior.

- [#16591](https://github.com/withastro/astro/pull/16591) [`cce20f7`](https://github.com/withastro/astro/commit/cce20f7c3597d555d490abe98ea213753842e35a) Thanks [@matthewp](https://github.com/matthewp)! - Uses a consistent generic error message in the image endpoint across all adapters

- [#16629](https://github.com/withastro/astro/pull/16629) [`f54be80`](https://github.com/withastro/astro/commit/f54be80069c5b43ad76bd69393afa443e1fe08cf) Thanks [@g-taki](https://github.com/g-taki)! - Fixes a bug where SSR responses in `astro dev` could crash with `TypeError: this.logger.flush is not a function`.

- [#16589](https://github.com/withastro/astro/pull/16589) [`3740b24`](https://github.com/withastro/astro/commit/3740b244431eae848b9a83e473528e583fcac2e7) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes an outdated code snippet in the documentation for session storage configuration.

- Updated dependencies [[`354e231`](https://github.com/withastro/astro/commit/354e23191f6a85fd466b512d378959cc12aebb01)]:
  - @astrojs/telemetry@3.3.2

## 6.2.2

### Patch Changes

- [#16292](https://github.com/withastro/astro/pull/16292) [`00f48ee`](https://github.com/withastro/astro/commit/00f48ee25fdc072df93210fa2d6d24ea649d4ab1) Thanks [@p-linnane](https://github.com/p-linnane)! - Fixes head metadata propagation in dev for adapters that load modules in the `prerender` Vite environment, such as `@astrojs/cloudflare`. The `astro:head-metadata` plugin previously only tracked the `ssr` environment, so `maybeRenderHead()` could fire inside an unrelated component's `<template>` element, trapping subsequent hoisted `<style>` blocks.

- [#16451](https://github.com/withastro/astro/pull/16451) [`778865f`](https://github.com/withastro/astro/commit/778865f4abe29f7dfa4009624f39e350b7735acd) Thanks [@maximslo](https://github.com/maximslo)! - Fixes build crash when processing animated AVIF images. Sharp now gracefully passes through unsupported image formats instead of crashing during the build.

- [#16548](https://github.com/withastro/astro/pull/16548) [`7214d3e`](https://github.com/withastro/astro/commit/7214d3e134766c7324e76a0ec4c91050cf4a2a18) Thanks [@senutpal](https://github.com/senutpal)! - Fixes scoped styles applying to the wrong element when `vite.css.transformer` is set to `'lightningcss'` and a selector uses a nested `&` inside `:where(...)`, such as Tailwind v4's `space-x-*`, `space-y-*`, and `divide-*` utilities.

- [#16566](https://github.com/withastro/astro/pull/16566) [`9ac96b4`](https://github.com/withastro/astro/commit/9ac96b406653d2993d35cd83dc5fa538b7417545) Thanks [@web-dev0521](https://github.com/web-dev0521)! - Fixes `data-astro-prefetch="tap"` not triggering when clicking nested elements (e.g. `<span>`, `<img>`, `<svg>`) inside an anchor tag.

- [#15994](https://github.com/withastro/astro/pull/15994) [`1e70d18`](https://github.com/withastro/astro/commit/1e70d18febca2319487c9acbd9c2e18cb961aef0) Thanks [@ossaidqadri](https://github.com/ossaidqadri)! - Fix `<style>` compilation failure when importing Astro components via tsconfig path aliases

- [#16144](https://github.com/withastro/astro/pull/16144) [`1cd6650`](https://github.com/withastro/astro/commit/1cd66504a63055dcbe54b5d3ec52cc220d3a82e1) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixed a regression where `.html` was unexpectedly stripped from dynamic route parameters on non-page routes (`.ts` endpoints and redirects). This caused endpoints like `/some/[...id].ts` returning `id: 'file.html'` on `getStaticPaths` to not serve that file because the generated route (`/some/file.html`) would get matched as `id: file` that is not part of the list returned by `getStaticPaths`.

- [#16415](https://github.com/withastro/astro/pull/16415) [`559c0fd`](https://github.com/withastro/astro/commit/559c0fd63ac8c051ee3bb634e06aadf48e8d8495) Thanks [@0xbejaxer](https://github.com/0xbejaxer)! - Fix CSS traversal boundaries so pages with `export const partial = true` still contribute styles when imported as components by other pages.

- [#16516](https://github.com/withastro/astro/pull/16516) [`17f1867`](https://github.com/withastro/astro/commit/17f1867c177d99bc5fff31aa12f6c9ab35ef4581) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixes an issue where the index route would return a 404 error when using a custom `base` path combined with `trailingSlash: 'never'`. This ensures that the home page and internal rewrites are correctly matched under these configurations.

- [#16515](https://github.com/withastro/astro/pull/16515) [`280ec88`](https://github.com/withastro/astro/commit/280ec88c0d9c75755b7616263ce516ff2122fb81) Thanks [@jp-knj](https://github.com/jp-knj)! - Fixes an issue where `i18n.fallback` pages with `fallbackType: 'rewrite'` were emitted with empty bodies during `astro build`.

- [#16565](https://github.com/withastro/astro/pull/16565) [`7959798`](https://github.com/withastro/astro/commit/7959798c33c8c5e70183e1af3ab5d9b9d663e494) Thanks [@enjoyandlove](https://github.com/enjoyandlove)! - Fixes session persistence when `session.delete()` is the first mutation in a request (no prior `get`, `set`, `has`, or `keys`). The session was marked dirty in memory, but persistence skipped the save because `#data` stayed `undefined`, so the backing store could still return the deleted key on the next request.

- [#16527](https://github.com/withastro/astro/pull/16527) [`86fd80d`](https://github.com/withastro/astro/commit/86fd80dd17cf896e5eaa185b70576d839d789978) Thanks [@enjoyandlove](https://github.com/enjoyandlove)! - Prevents script deduplication state from being consumed while rendering inert `<template>` contexts.

- [#16540](https://github.com/withastro/astro/pull/16540) [`e59c637`](https://github.com/withastro/astro/commit/e59c637fb6c589fff5b56b737bab57d7513b0559) Thanks [@ascorbic](https://github.com/ascorbic)! - Skips session storage reads when no session cookie is present. Previously, calling `session.get()` on a request without a session cookie would initialize the storage driver and make a read that was guaranteed to miss. On network-backed drivers this added latency and resource usage to every anonymous request.

- [#16517](https://github.com/withastro/astro/pull/16517) [`6ab0b3c`](https://github.com/withastro/astro/commit/6ab0b3c0266fe9c13638e22d40d46f2603e6031d) Thanks [@adamchal](https://github.com/adamchal)! - Removes inline CSS for prerendered routes from the SSR manifest. The static HTML on disk already inlines those styles, and the SSR worker never renders prerendered routes, so the data was dead weight. Builds with many prerendered routes and `build.inlineStylesheets: "always"` (or `"auto"` with small stylesheets) will see a smaller SSR entry chunk, which reduces cold-start parse time on platforms like Cloudflare Workers.

- [#16509](https://github.com/withastro/astro/pull/16509) [`d3d3557`](https://github.com/withastro/astro/commit/d3d3557c77decc59fca6f0bfbdc36ba65e420564) Thanks [@cyphercodes](https://github.com/cyphercodes)! - Fix conditional named slot callbacks receiving arguments from `Astro.slots.render()`.

- [#16236](https://github.com/withastro/astro/pull/16236) [`c6b068e`](https://github.com/withastro/astro/commit/c6b068e905a1a7b6e6a0b813c2368586b70a2214) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixes the `position` prop on `<Image />` and `<Picture />` components to correctly apply `object-position` styles

- [#16018](https://github.com/withastro/astro/pull/16018) [`d14f47c`](https://github.com/withastro/astro/commit/d14f47c46da2f50f79e9b8cfb87eaca9db8e898b) Thanks [@felmonon](https://github.com/felmonon)! - Fix `defineLiveCollection()` so `LiveLoader` data types declared as interfaces are accepted.

## 6.2.1

### Patch Changes

- [#16531](https://github.com/withastro/astro/pull/16531) [`76db01d`](https://github.com/withastro/astro/commit/76db01d332a4029f46f6df7a60fae14278321d2c) Thanks [@rodrigosdev](https://github.com/rodrigosdev)! - Fixes config validation for omitted `integrations` fields with newer Zod versions.

- [#16535](https://github.com/withastro/astro/pull/16535) [`7df0fe4`](https://github.com/withastro/astro/commit/7df0fe40b1f57529ce315a74eb83d527ff2040ec) Thanks [@rururux](https://github.com/rururux)! - Fixed an issue where a warning was displayed when the `server` property was missing during config validation, even though it is not required.

- [#16534](https://github.com/withastro/astro/pull/16534) [`5cf6c51`](https://github.com/withastro/astro/commit/5cf6c51188b52d22f133ea9373da0080f74701f9) Thanks [@matthewp](https://github.com/matthewp)! - Fixes compatibility with Zod 4.4.0 for the `server` config property and error formatting

## 6.2.0

### Minor Changes

- [#16187](https://github.com/withastro/astro/pull/16187) [`fe58071`](https://github.com/withastro/astro/commit/fe58071817f447f832d9ce4341c0b5991d3c0cda) Thanks [@gllmt](https://github.com/gllmt)! - Adds a `waitUntil` option to the `RenderOptions` so that adapters can forward runtime background-task hooks to Astro.

  When provided by an adapter, runtime cache providers receive `context.waitUntil` in
  `CacheProvider.onRequest()`, which allows background cache work such as stale-while-revalidate
  without blocking the response. The Cloudflare adapter now forwards
  `ExecutionContext.waitUntil` to this API.

- [#16290](https://github.com/withastro/astro/pull/16290) [`a49637a`](https://github.com/withastro/astro/commit/a49637ab82a6ce8506a7272f331d1101f782b3e0) Thanks [@ViVaLaDaniel](https://github.com/ViVaLaDaniel)! - Ensures that `server.allowedHosts` (and `vite.preview.allowedHosts`) configuration is respected when using `astro preview` with the `@astrojs/cloudflare` adapter. This improves security by preventing DNS rebinding attacks when previewing Cloudflare builds locally.

- [#15725](https://github.com/withastro/astro/pull/15725) [`4108ec1`](https://github.com/withastro/astro/commit/4108ec1e256c5e9d97fb29f1097a5095b73cfb8b) Thanks [@meyer](https://github.com/meyer)! - Adds support for a new `'jsx'` value for the `compressHTML` option. When set, whitespace is stripped using JSX whitespace rules instead of the default HTML compression strategy.

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    compressHTML: 'jsx',
  });
  ```

  In JSX, whitespaces never matter, as such, no amount of indentation, or newlines will not affect the rendered output. For instance, the following code:

  ```jsx
  <div>
    <span>foo</span>
    <span>bar</span>
  </div>
  ```

  will be rendered as `foobar`, whereas with HTML whitespace rules, a space would be present between the words due to the newline and indentation between the tags.

- [#16477](https://github.com/withastro/astro/pull/16477) [`28fb3e1`](https://github.com/withastro/astro/commit/28fb3e16cdf181d49fbc22fbde41958fe9b9ab9e) Thanks [@ematipico](https://github.com/ematipico)! - Adds experimental support for configurable log handlers.

  This experimental feature provides better control over Astro's logging infrastructure by allowing users to replace the default console output with custom logging implementations (e.g., structured JSON). This is particularly useful for users using on-demand rendering and wishing to connect their log aggregation services, such as Kibana, Logstash, CloudWatch, Grafana, or Loki.

  By default, Astro provides three built-in log handlers (`json`, `node`, and `console`), but you can also create your own.

  #### JSON logging

  JSON logging can be enabled via the CLI for the `build`, `dev`, and `sync` commands using the `experimentalJson` flag:

  ```js
  // astro.config.mjs
  import { defineConfig, logHandlers } from 'astro/config';

  export default defineConfig({
    experimental: {
      logger: logHandlers.json({
        pretty: true,
        level: 'warn',
      }),
    },
  });
  ```

  #### Custom logger

  You can also create your own custom logger by implementing the correct interface:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      logger: {
        entrypoint: '@org/custom-logger',
      },
    },
  });
  ```

  ```ts
  // @org/custom-logger.js
  import type { AstroLoggerDestination, AstroLoggerMessage } from 'astro';
  import { matchesLevel } from 'astor/logger';

  function customLogger(level = 'info'): AstroLoggerDestination {
    return {
      write(message: AstroLoggerMessage) {
        if (matchesLevel(message.level, level)) {
          // write message somewhere
        }
      },
    };
  }

  export default customLogger;
  ```

  For more information on enabling and using this feature in your project, see the [Experimental Logger docs](https://docs.astro.build/en/reference/experimental-flags/logger/).

  For a complete overview and to give feedback on this experimental API, see the [Custom logger RFC](https://github.com/withastro/roadmap/blob/logger/proposals/0059-custom-logger.md).

- [#16333](https://github.com/withastro/astro/pull/16333) [`0f7c3c8`](https://github.com/withastro/astro/commit/0f7c3c8e3dfe0fff58bd6e68c40f6f8fb280144e) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds an experimental flag `svgOptimizer` that enables automatic optimization of your SVG components using the provided optimizer. This supersedes the `svgo` experimental flag, which is now removed.

  When enabled, your imported SVG files used as components will be optimized for smaller file sizes and better performance while maintaining visual quality. This can significantly reduce the size of your SVG assets by removing unnecessary metadata, comments, and redundant code.

  Astro ships with a [SVGO](https://svgo.dev/) based optimizer, but any can be used.

  To enable this feature, add the experimental flag in your Astro config and remove `svgo` if it was enabled:

  ```diff
  // astro.config.mjs
  -import { defineConfig } from "astro/config";
  +import { defineConfig, svgoOptimizer } from "astro/config";

  export default defineConfig({
  +  experimental: {
  +    svgOptimizer: svgoOptimizer()
  -    svgo: true
  +  }
  });
  ```

  For more information on enabling and using this feature in your project, see the [experimental SVG optimization docs](https://docs.astro.build/en/reference/experimental-flags/svg-optimization/).

- [#16302](https://github.com/withastro/astro/pull/16302) [`f6f8e80`](https://github.com/withastro/astro/commit/f6f8e8097e93e29d00f419e5594f2c081bb32478) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new `experimental_getFontFileURL()` method to resolve font file URLs when using the Fonts API

  The `fontData` object exported from `astro:assets` was introduced to provide low-level access to font family data for advanced usage. One of the goals of this API was to be able to resolve buffers using URLs. However, it turned out to be impractical, especially during prerendering.

  Astro now exports a new `experimental_getFontFileURL()` helper function from `astro:assets` to resolve font file URLs from `fontData`. For example, when using [satori](https://github.com/vercel/satori) to generate Open Graph images:

  ```diff
  // src/pages/og.png.ts

  import type { APIRoute } from "astro";
  -import { fontData } from "astro:assets";
  +import { fontData, experimental_getFontFileURL } from "astro:assets";
  -import { outDir } from "astro:config/server";
  -import { readFile } from "node:fs/promises";
  import satori from "satori";
  import { html } from "satori-html";
  import sharp from "sharp";

  export const GET: APIRoute = async (context) => {
    const fontPath = fontData["--font-roboto"][0]?.src[0]?.url;

    if (fontPath === undefined) {
      throw new Error("Cannot find the font path.");
    }

  -  const data = import.meta.env.DEV
  -    ? await fetch(new URL(fontPath, context.url.origin)).then(async (res) => res.arrayBuffer())
  -    : await readFile(new URL(`.${fontPath}`, outDir));
  +  const url = experimental_getFontFileURL(fontPath, context.url);
  +  const data = await fetch(url).then((res) => res.arrayBuffer());

    const svg = await satori(
      html`<div style="color: black;">hello, world</div>`,
      {
        width: 600,
        height: 400,
        fonts: [
          {
            name: "Roboto",
            data,
            weight: 400,
            style: "normal",
          },
        ],
      },
    );

    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(600, 400)
      .png()
      .toBuffer();

    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
      },
    });
  };
  ```

  See the [Fonts API documentation](https://docs.astro.build/en/guides/fonts/#accessing-font-data-programmatically) for more information.

### Patch Changes

- [#15980](https://github.com/withastro/astro/pull/15980) [`8812382`](https://github.com/withastro/astro/commit/88123826690dde1e0019aa801fe7d18085f27271) Thanks [@seroperson](https://github.com/seroperson)! - Prevents script deduplication inside `<template>` elements

## 6.1.10

### Patch Changes

- [#16479](https://github.com/withastro/astro/pull/16479) [`1058428`](https://github.com/withastro/astro/commit/1058428df2d13878c6130787636dd1778273a934) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a spurious `[WARN] [content] Content config not loaded` warning during `astro dev` for projects that don't use content collections

- [#16457](https://github.com/withastro/astro/pull/16457) [`3d82220`](https://github.com/withastro/astro/commit/3d82220a1549e699e34ed433f3846a919f4c02bd) Thanks [@matthewp](https://github.com/matthewp)! - Hardens server island encryption to prevent encrypted data from one island component being replayed against a different one

- [#16481](https://github.com/withastro/astro/pull/16481) [`152700e`](https://github.com/withastro/astro/commit/152700e08178285b240d8ef947cccd47b870ee5f) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a spurious 404 request for a dev toolbar sourcemap during `astro dev` caused by the browser mis-resolving a relative `sourceMappingURL` from the `/@id/` URL prefix

- [#16480](https://github.com/withastro/astro/pull/16480) [`1bcb43b`](https://github.com/withastro/astro/commit/1bcb43bf04f3fa8f4623897ae2a937250f35216a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an unnecessary full page reload on first navigation during dev

## 6.1.9

### Patch Changes

- [#16448](https://github.com/withastro/astro/pull/16448) [`99464ed`](https://github.com/withastro/astro/commit/99464edb5fc0968f6497328e106f26ab393668bd) Thanks [@matthewp](https://github.com/matthewp)! - Updates vite, picomatch, and unstorage to latest patch versions

- [#16422](https://github.com/withastro/astro/pull/16422) [`a3951d7`](https://github.com/withastro/astro/commit/a3951d7873c7c210fedbaa77702bc33db6410715) Thanks [@matthewp](https://github.com/matthewp)! - Hardens `astro-island` export resolution and hydration error handling for malformed component metadata

- [#16420](https://github.com/withastro/astro/pull/16420) [`e21de1d`](https://github.com/withastro/astro/commit/e21de1d03b318d5045dba718291c04fe05c01490) Thanks [@matthewp](https://github.com/matthewp)! - Hardens Astro's error overlay and server logging paths to avoid unsafe HTML insertion and format-string interpolation

- [#16419](https://github.com/withastro/astro/pull/16419) [`f3485c3`](https://github.com/withastro/astro/commit/f3485c3458bc8bf70c152126e418c24f489ded9d) Thanks [@matthewp](https://github.com/matthewp)! - Hardens nested object and package metadata lookups to ignore prototype keys in content handling and project scaffolding

- [#16022](https://github.com/withastro/astro/pull/16022) [`a002540`](https://github.com/withastro/astro/commit/a002540d60d4a840db9971e73c820a8015658ffe) Thanks [@mathieumaf](https://github.com/mathieumaf)! - Fixes an issue where i18n domains would return 404 when `trailingSlash` is set to `never`.

- Updated dependencies [[`99464ed`](https://github.com/withastro/astro/commit/99464edb5fc0968f6497328e106f26ab393668bd), [`f3485c3`](https://github.com/withastro/astro/commit/f3485c3458bc8bf70c152126e418c24f489ded9d)]:
  - @astrojs/internal-helpers@0.9.0
  - @astrojs/markdown-remark@7.1.1

## 6.1.8

### Patch Changes

- [#16367](https://github.com/withastro/astro/pull/16367) [`a6866a7`](https://github.com/withastro/astro/commit/a6866a7ef086627f8f8237274361d8acc2f85121) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where build output files could contain special characters (`!`, `~`, `{`, `}`) in their names, causing deploy failures on platforms like Netlify.

- [#16381](https://github.com/withastro/astro/pull/16381) [`217c5b3`](https://github.com/withastro/astro/commit/217c5b3b937f0aee7e59280e8a10cf2bd4237605) Thanks [@ematipico](https://github.com/ematipico)! - Slightly improved the performance of the dev server by caching the internal crawling of the dependencies of a project.

- [#16348](https://github.com/withastro/astro/pull/16348) [`7d26cd7`](https://github.com/withastro/astro/commit/7d26cd77bc1b33cee81f0e7b408dc2d170be1bdd) Thanks [@ocavue](https://github.com/ocavue)! - Fixes a bug where emitted assets during a client build would contain always fresh, new hashes in their name. Now the build should be more stable.

- [#16317](https://github.com/withastro/astro/pull/16317) [`d012bfe`](https://github.com/withastro/astro/commit/d012bfeadb5b33f9ab1175191d59357d629c327e) Thanks [@das-peter](https://github.com/das-peter)! - Fixes a bug where `allowedDomains` weren't correctly propagated when using the development server.

- [#16379](https://github.com/withastro/astro/pull/16379) [`5a84551`](https://github.com/withastro/astro/commit/5a845514114ae21ca9820e98b56cce33c0cf579b) Thanks [@martrapp](https://github.com/martrapp)! - Improves Vue scoped style handling in DEV mode during client router navigation.

- [#16317](https://github.com/withastro/astro/pull/16317) [`d012bfe`](https://github.com/withastro/astro/commit/d012bfeadb5b33f9ab1175191d59357d629c327e) Thanks [@das-peter](https://github.com/das-peter)! - Adds tests to verify settings are properly propagated when using the development server.

- [#16282](https://github.com/withastro/astro/pull/16282) [`5b0fdaa`](https://github.com/withastro/astro/commit/5b0fdaa8ba3dc17f4b93d9847c3255150b0aeab2) Thanks [@jmurty](https://github.com/jmurty)! - Fixes build errors on platforms with skew protection enabled (e.g. Vercel, Netlify) for inter-chunk Javascript using dynamic imports

- Updated dependencies [[`e0b240e`](https://github.com/withastro/astro/commit/e0b240edea4db632138def3a9003b4b12e12f765)]:
  - @astrojs/telemetry@3.3.1

## 6.1.7

### Patch Changes

- [#16027](https://github.com/withastro/astro/pull/16027) [`c62516b`](https://github.com/withastro/astro/commit/c62516bbbf8fdf95d38293440d28221c048c41f0) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixes a bug where remote image dimensions were not validated during static builds on Netlify.

- [#16311](https://github.com/withastro/astro/pull/16311) [`94048f2`](https://github.com/withastro/astro/commit/94048f27c30f47ae0e01f90231e0496ed80595f7) Thanks [@Arecsu](https://github.com/Arecsu)! - Fixes `--port` flag being ignored after a Vite-triggered server restart (e.g. when a `.env` file changes)

- [#16316](https://github.com/withastro/astro/pull/16316) [`0fcd04c`](https://github.com/withastro/astro/commit/0fcd04cc985002b56c9e2d36bcb68da0d3f08d5f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes the `/_image` endpoint accepting an arbitrary `f=svg` query parameter and serving non-SVG content as `image/svg+xml`. The endpoint now validates that the source is actually SVG before honoring `f=svg`, matching the same guard already enforced on the `<Image>` component path.

## 6.1.6

### Patch Changes

- [#16202](https://github.com/withastro/astro/pull/16202) [`b5c2fba`](https://github.com/withastro/astro/commit/b5c2fba8bf2bc315db94e525f12f7661dd357822) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Actions failing with `ActionsWithoutServerOutputError` when using `output: 'static'` with an adapter

- [#16303](https://github.com/withastro/astro/pull/16303) [`b06eabf`](https://github.com/withastro/astro/commit/b06eabf01afda713066feb803bbc4c89af634aaf) Thanks [@matthewp](https://github.com/matthewp)! - Improves handling of special characters in inline `<script>` content

- [#14924](https://github.com/withastro/astro/pull/14924) [`bb4586a`](https://github.com/withastro/astro/commit/bb4586a73e32659e6cd4f610799799b634cfc658) Thanks [@aralroca](https://github.com/aralroca)! - Fixes SCSS and CSS module file changes triggering a full page reload instead of hot-updating styles in place during development

## 6.1.5

### Patch Changes

- [#16171](https://github.com/withastro/astro/pull/16171) [`5bcd03c`](https://github.com/withastro/astro/commit/5bcd03c1852cb7a7e165017089cc39c111599530) Thanks [@Desel72](https://github.com/Desel72)! - Fixes a build error that occurred when a pre-rendered page used the `<Picture>` component and another page called `render()` on content collection entries.

- [#16239](https://github.com/withastro/astro/pull/16239) [`7c65c04`](https://github.com/withastro/astro/commit/7c65c0495a12dcb86e6566223e398094566d1435) Thanks [@dataCenter430](https://github.com/dataCenter430)! - Fixes sync content inside `<Fragment>` not streaming to the browser until all async sibling expressions have resolved.

- [#16242](https://github.com/withastro/astro/pull/16242) [`686c312`](https://github.com/withastro/astro/commit/686c3124c1f4078d8395c86047020d92225e71ae) Thanks [@martrapp](https://github.com/martrapp)! - Revives UnoCSS in dev mode when used with the client router.

  This change partly reverts [#16089](https://github.com/withastro/astro/pull/16089), which in hindsight turned out to be too general. Instead of automatically persisting all style sheets, we now do this only for styles from Vue components.

- [#16192](https://github.com/withastro/astro/pull/16192) [`79d86b8`](https://github.com/withastro/astro/commit/79d86b88ef199d6a2195584ec53b225c6a9df5f9) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Uses today’s date for Cloudflare `compatibility_date` in `astro add cloudflare`

  When creating new projects, `astro add cloudflare` now sets `compatibility_date` to the current date. Previously, this date was resolved from locally installed packages, which could be unreliable in some package manager environments. Using today’s date is simpler and more reliable across environments, and is supported by [`workerd`](https://github.com/cloudflare/workers-sdk/pull/13051).

- [#16259](https://github.com/withastro/astro/pull/16259) [`34df955`](https://github.com/withastro/astro/commit/34df95585662d8d00f09e1295cdfe51f2dc78e3f) Thanks [@gameroman](https://github.com/gameroman)! - Removed `dlv` dependency

## 6.1.4

### Patch Changes

- [#16197](https://github.com/withastro/astro/pull/16197) [`21f9fe2`](https://github.com/withastro/astro/commit/21f9fe29f5de442a3e0672ea36dbe690491f3e8c) Thanks [@SchahinRohani](https://github.com/SchahinRohani)! - Remove unused re-exports from assets/utils barrel file to fix Vite build warning

- [#16059](https://github.com/withastro/astro/pull/16059) [`6d5469e`](https://github.com/withastro/astro/commit/6d5469e2c8ddd5c2a546052ac7e3b0fb801b9069) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `Expected 'miniflare' to be defined` errors and 404 responses in dev mode when using the Cloudflare adapter and the config file changes. Instead of creating a brand new Vite server on config changes, Astro now performs a Vite in-place restart, allowing the Cloudflare adapter to reuse its existing miniflare instance across restarts.

- [#16154](https://github.com/withastro/astro/pull/16154) [`7610ba4`](https://github.com/withastro/astro/commit/7610ba4552b51a64be59ad16e8450ce6672579f0) Thanks [@Desel72](https://github.com/Desel72)! - Fixes pages with dots in their filenames (e.g. `hello.world.astro`) returning 404 when accessed with a trailing slash in the dev server. The `trailingSlashForPath` function now only forces `trailingSlash: 'never'` for endpoints with file extensions, allowing pages to correctly respect the user's `trailingSlash` config.

- [#16193](https://github.com/withastro/astro/pull/16193) [`23425e2`](https://github.com/withastro/astro/commit/23425e2413b25cd304b64b4711f86f3f889546ff) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `trailingSlash: "always"` producing redirect HTML instead of the actual response for extensionless endpoints during static builds

## 6.1.3

### Patch Changes

- [#16161](https://github.com/withastro/astro/pull/16161) [`b51f297`](https://github.com/withastro/astro/commit/b51f2972d4c5d877f9087b86bb2b1d62c8293be5) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a dev rendering issue with the Cloudflare adapter where head metadata could be missing and dev CSS/scripts could be injected in the wrong place

- [#16110](https://github.com/withastro/astro/pull/16110) [`de669f0`](https://github.com/withastro/astro/commit/de669f0a11c606cc4703762a73c2566d17667453) Thanks [@tmimmanuel](https://github.com/tmimmanuel)! - Fixes skew protection query parameters not being appended to inter-chunk JavaScript imports in client bundles, which could cause version mismatches during rolling deployments on Vercel

- [#16162](https://github.com/withastro/astro/pull/16162) [`a0a49e9`](https://github.com/withastro/astro/commit/a0a49e99fd63419cae8bf143e1a58f532c52ee94) Thanks [@rururux](https://github.com/rururux)! - Fixes an issue where HMR would not trigger when modifying files while using @astrojs/cloudflare with prerenderEnvironment: 'node' enabled.

- [#16142](https://github.com/withastro/astro/pull/16142) [`7454854`](https://github.com/withastro/astro/commit/7454854dfcb9b7e9ae7f825dbf72bdf3106b78e1) Thanks [@rururux](https://github.com/rururux)! - Fixes HTML content being incorrectly escaped as plain text when rendering a MDX component using the `AstroContainer` APIs.

- [#16116](https://github.com/withastro/astro/pull/16116) [`12602a9`](https://github.com/withastro/astro/commit/12602a907c4eba0508145938c652362f37240878) Thanks [@riderx](https://github.com/riderx)! - Fixes a bug where page-level CSS could leak between unrelated pages when traversing style parents across top-level route boundaries

- [#16178](https://github.com/withastro/astro/pull/16178) [`a7e7567`](https://github.com/withastro/astro/commit/a7e75678356488416a31184cdc53204094486820) Thanks [@matthewp](https://github.com/matthewp)! - Fixes SSR builds failing with "No matching renderer found" when a project only has injected routes and no `src/pages/` directory

## 6.1.2

### Patch Changes

- [#16104](https://github.com/withastro/astro/pull/16104) [`47a394d`](https://github.com/withastro/astro/commit/47a394d7cf2eb735fcee8e90830737f9e900a274) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `astro preview` ignoring `vite.preview.allowedHosts` set in `astro.config.mjs`

- [#16047](https://github.com/withastro/astro/pull/16047) [`711f837`](https://github.com/withastro/astro/commit/711f837cfa3374a458f1f91e08bc388e7c0e12e6) Thanks [@matthewp](https://github.com/matthewp)! - Fixes catch-all routes incorrectly intercepting requests for static assets when using the `@astrojs/node` adapter in middleware mode.

- [#15981](https://github.com/withastro/astro/pull/15981) [`a60cbb6`](https://github.com/withastro/astro/commit/a60cbb6963d55aa272281edfeecf7251d987b0fb) Thanks [@moktamd](https://github.com/moktamd)! - Fix Zod v4 validation error formatting to show human-readable messages instead of raw JSON

## 6.1.1

### Patch Changes

- [#16105](https://github.com/withastro/astro/pull/16105) [`23d60de`](https://github.com/withastro/astro/commit/23d60dee6eae3d7148ef87f8b44c3d7470fef0ed) Thanks [@matthewp](https://github.com/matthewp)! - Fix dev toolbar audit crash when encountering the `image` ARIA role

- [#16089](https://github.com/withastro/astro/pull/16089) [`999c875`](https://github.com/withastro/astro/commit/999c875da5914735458e0939be8a2be2e012e580) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue with the client router where Vue's `:deep()` notation was ignored in dev mode.

## 6.1.0

### Minor Changes

- [#15804](https://github.com/withastro/astro/pull/15804) [`a5e7232`](https://github.com/withastro/astro/commit/a5e723217f30020ae82ca67190794150e9e94e15) Thanks [@merlinnot](https://github.com/merlinnot)! - Allows setting codec-specific defaults for Astro's built-in Sharp image service via `image.service.config`.

  You can now configure encoder-level options such as `jpeg.mozjpeg`, `webp.effort`, `webp.alphaQuality`, `avif.effort`, `avif.chromaSubsampling`, and `png.compressionLevel` when using `astro/assets/services/sharp` for compile-time image generation.

  These settings apply as defaults for the built-in Sharp pipeline, while per-image `quality` still takes precedence when set on `<Image />`, `<Picture />`, or `getImage()`.

- [#15455](https://github.com/withastro/astro/pull/15455) [`babf57f`](https://github.com/withastro/astro/commit/babf57f83f47d4cd1fa73a55863718b71c8eebf0) Thanks [@AhmadYasser1](https://github.com/AhmadYasser1)! - Adds `fallbackRoutes` to the `IntegrationResolvedRoute` type, exposing i18n fallback routes to integrations via the `astro:routes:resolved` hook for projects using `fallbackType: 'rewrite'`.

  This allows integrations such as the sitemap integration to properly include generated fallback routes in their output.

  ```js
  {
    'astro:routes:resolved': ({ routes }) => {
      for (const route of routes) {
        for (const fallback of route.fallbackRoutes) {
          console.log(fallback.pathname) // e.g. /fr/about/
        }
      }
    }
  }
  ```

- [#15340](https://github.com/withastro/astro/pull/15340) [`10a1a5a`](https://github.com/withastro/astro/commit/10a1a5a5232fa401ca814b396cf79aeccdfdf8a9) Thanks [@trueberryless](https://github.com/trueberryless)! - Adds support for advanced configuration of SmartyPants in Markdown.

  You can now pass an options object to `markdown.smartypants` in your Astro configuration to fine-tune how punctuation, dashes, and quotes are transformed.

  This is helpful for projects that require specific typographic standards, such as "oldschool" dash handling or localized quotation marks.

  ```js
  // astro.config.mjs
  export default defineConfig({
    markdown: {
      smartypants: {
        backticks: 'all',
        dashes: 'oldschool',
        ellipses: 'unspaced',
        openingQuotes: { double: '«', single: '‹' },
        closingQuotes: { double: '»', single: '›' },
        quotes: false,
      },
    },
  });
  ```

  See [the `retext-smartypants` options](https://github.com/retextjs/retext-smartypants?tab=readme-ov-file#fields) for more information.

### Patch Changes

- [#16025](https://github.com/withastro/astro/pull/16025) [`a09f319`](https://github.com/withastro/astro/commit/a09f3194f6ddf04874be424c28db03caf33d2c75) Thanks [@koji-1009](https://github.com/koji-1009)! - Instructs the client router to skip view transition animations when the browser is already providing its own visual transition, such as a swipe gesture.

- [#16055](https://github.com/withastro/astro/pull/16055) [`ccecb8f`](https://github.com/withastro/astro/commit/ccecb8fc057cada9b0e70924d364181391c647e4) Thanks [@Gautam-Bharadwaj](https://github.com/Gautam-Bharadwaj)! - Fixes an issue where `client:only` components could have duplicate `client:component-path` attributes added in MDX in rare cases

- [#16081](https://github.com/withastro/astro/pull/16081) [`44fc340`](https://github.com/withastro/astro/commit/44fc34015d702824c55b031c7b800165f7ba807d) Thanks [@crazylogic03](https://github.com/crazylogic03)! - Fixes the `emitFile() is not supported in serve mode` warning that appears during `astro dev` when using integrations that inject before-hydration scripts (e.g. `@astrojs/react`)

- [#16068](https://github.com/withastro/astro/pull/16068) [`31d733b`](https://github.com/withastro/astro/commit/31d733b00a7efe5b29bdadab21daf8b3eea6ae55) Thanks [@Karthikeya1500](https://github.com/Karthikeya1500)! - Fixes the dev toolbar a11y audit incorrectly classifying `menuitemradio` as a non-interactive ARIA role.

- [#16080](https://github.com/withastro/astro/pull/16080) [`e80ac73`](https://github.com/withastro/astro/commit/e80ac73e4433d1ac0518af731f2af00f8aaa46ad) Thanks [@ematipico](https://github.com/ematipico)! - Fixes `experimental.queuedRendering` incorrectly escaping the HTML output of `.html` page files, causing the page content to render as plain text instead of HTML in the browser.

- [#16048](https://github.com/withastro/astro/pull/16048) [`13b9d56`](https://github.com/withastro/astro/commit/13b9d5685d0e1b34b793d0a00d64e3f8310f9f17) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a dev server crash (`serverIslandNameMap.get is not a function`) that occurred when navigating to a page with `server:defer` after first visiting a page without one, when using `@astrojs/cloudflare`

- [#16093](https://github.com/withastro/astro/pull/16093) [`336e086`](https://github.com/withastro/astro/commit/336e086e084202d9c6f218226a3133bb1e10f0ba) Thanks [@Snugug](https://github.com/Snugug)! - Fixes Zod meta not correctly being rendered on top-level schema when converted into JSON Schema

- [#16043](https://github.com/withastro/astro/pull/16043) [`d402485`](https://github.com/withastro/astro/commit/d402485b4b196630e891d7fd21683d9b1e1c1ab8) Thanks [@ematipico](https://github.com/ematipico)! - Fixes `checkOrigin` CSRF protection in `astro dev` behind a TLS-terminating reverse proxy. The dev server now reads `X-Forwarded-Proto` (gated on `security.allowedDomains`, matching production behaviour) so the constructed request origin matches the `https://` origin the browser sends. Also ensures `security.allowedDomains` and `security.checkOrigin` are respected in dev.

- [#16064](https://github.com/withastro/astro/pull/16064) [`ba58e0d`](https://github.com/withastro/astro/commit/ba58e0d6edbc3f8a651ab0c20df9b1f33572bd7b) Thanks [@ematipico](https://github.com/ematipico)! - Updates the dependency `svgo` to the latest, to fix a security issue.

- [#16007](https://github.com/withastro/astro/pull/16007) [`2dcd8d5`](https://github.com/withastro/astro/commit/2dcd8d54c6fb00183228d757bf684e67c79029d8) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where fonts files would unecessarily be copied several times during the build

- [#16017](https://github.com/withastro/astro/pull/16017) [`b089b90`](https://github.com/withastro/astro/commit/b089b904f1ed578e9edaefd129bf9843120a808f) Thanks [@felmonon](https://github.com/felmonon)! - Fix the `astro sync` error message when `getImage()` is called while loading content collections.

- [#16014](https://github.com/withastro/astro/pull/16014) [`fa73fbb`](https://github.com/withastro/astro/commit/fa73fbbac25c96eeadb766666ea3b2aded440bab) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a build error where using `astro:config/client` inside a `<script>` tag would cause Rollup to fail with "failed to resolve import `virtual:astro:routes` from `virtual:astro:manifest`"

- [#16054](https://github.com/withastro/astro/pull/16054) [`f74465a`](https://github.com/withastro/astro/commit/f74465aa406ddfbc9d458189bf7a2e67a227b33c) Thanks [@seroperson](https://github.com/seroperson)! - Fixes an issue with the development server, where changes to the middleware weren't picked, and it required a full restart of the server.

- [#16033](https://github.com/withastro/astro/pull/16033) [`198d31b`](https://github.com/withastro/astro/commit/198d31b3a816c76b9119112589ae2bf8379346ad) Thanks [@adampage](https://github.com/adampage)! - Fixes a bug where the the role `image` was incorrectly reported by audit tool bar.

- [#15935](https://github.com/withastro/astro/pull/15935) [`278828c`](https://github.com/withastro/astro/commit/278828cd35409f6db9dab766c7208fbab5f204c1) Thanks [@oliverlynch](https://github.com/oliverlynch)! - Fixes cached assets failing to revalidate due to redirect check mishandling Not Modified responses.

- [#16075](https://github.com/withastro/astro/pull/16075) [`2c1ae85`](https://github.com/withastro/astro/commit/2c1ae859d915726d95d38ea08c4c141eeda2cd3f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where invalid URLs would be generated in development when using font families with an oblique `style` and angles

- [#16062](https://github.com/withastro/astro/pull/16062) [`87fd6a4`](https://github.com/withastro/astro/commit/87fd6a4fcb075efa10a518aa8b92a11dd3284964) Thanks [@matthewp](https://github.com/matthewp)! - Warns on dev server startup when Vite 8 is detected at the top level of the user's project, and automatically adds a `"overrides": { "vite": "^7" }` entry to `package.json` when running `astro add cloudflare`. This prevents a `require_dist is not a function` crash caused by a Vite version split between Astro (requires Vite 7) and packages like `@tailwindcss/vite` that hoist Vite 8.

- Updated dependencies [[`10a1a5a`](https://github.com/withastro/astro/commit/10a1a5a5232fa401ca814b396cf79aeccdfdf8a9)]:
  - @astrojs/markdown-remark@7.1.0

## 6.0.8

### Patch Changes

- [#15978](https://github.com/withastro/astro/pull/15978) [`6d182fe`](https://github.com/withastro/astro/commit/6d182fe267586e2ee57113ad559912a456019306) Thanks [@seroperson](https://github.com/seroperson)! - Fixes a bug where Astro Actions didn't properly support nested object properties, causing problems when users used zod functions such as `superRefine` or `discriminatedUnion`.

- [#16011](https://github.com/withastro/astro/pull/16011) [`e752170`](https://github.com/withastro/astro/commit/e752170b64f436ccb4acef9612951c50927afa0c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a dev server hang on the first request when using the Cloudflare adapter

- [#15997](https://github.com/withastro/astro/pull/15997) [`1fddff7`](https://github.com/withastro/astro/commit/1fddff7ae6510812f04e62c77eea9de6fbc76f57) Thanks [@ematipico](https://github.com/ematipico)! - Fixes `Astro.rewrite()` failing when the target path contains duplicate slashes (e.g. `//about`). The duplicate slashes are now collapsed before URL parsing, preventing them from being interpreted as a protocol-relative URL.

## 6.0.7

### Patch Changes

- [#15950](https://github.com/withastro/astro/pull/15950) [`acce5e8`](https://github.com/withastro/astro/commit/acce5e84046f1f459a8f37686cf6054e2243f5ad) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a build regression in projects with multiple frontend integrations where `server:defer` server islands could fail at runtime when all pages are prerendered.

- [#15988](https://github.com/withastro/astro/pull/15988) [`c93b4a0`](https://github.com/withastro/astro/commit/c93b4a02fdf3b477d1668a8576f23d4526f25d87) Thanks [@ossaidqadri](https://github.com/ossaidqadri)! - Fix styles from dynamically imported components not being injected on first dev server load.

- [#15968](https://github.com/withastro/astro/pull/15968) [`3e7a9d5`](https://github.com/withastro/astro/commit/3e7a9d5fe07ef17057ede6f6f443f47e11905701) Thanks [@chasemccoy](https://github.com/chasemccoy)! - Fixes `renderMarkdown` in custom content loaders not resolving images in markdown content. Images referenced in markdown processed by `renderMarkdown` are now correctly optimized, matching the behavior of the built-in `glob()` loader.

- [#15990](https://github.com/withastro/astro/pull/15990) [`1e6017f`](https://github.com/withastro/astro/commit/1e6017ffdfa11ccb5f5de33a0b8b57096c76e675) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where `Astro.currentLocale` would always be the default locale instead of the actual one when using a dynamic route like `[locale].astro` or `[locale]/index.astro`. It now resolves to the correct locale from the URL.

- [#15990](https://github.com/withastro/astro/pull/15990) [`1e6017f`](https://github.com/withastro/astro/commit/1e6017ffdfa11ccb5f5de33a0b8b57096c76e675) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where visiting an invalid locale URL (e.g. `/asdf/`) would show the content of a dynamic `[locale]` page with a 404 status code, instead of showing your custom 404 page. Now, the correct 404 page is rendered when the locale in the URL doesn't match any configured locale.

- [#15960](https://github.com/withastro/astro/pull/15960) [`1d84020`](https://github.com/withastro/astro/commit/1d840201c63f2b0dae91f5b4894afe25fc5d23ad) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Cloudflare dev server islands with `prerenderEnvironment: 'node'` by sharing the serialized manifest encryption key across dev environments and routing server island requests through the SSR runtime.

- [#15735](https://github.com/withastro/astro/pull/15735) [`9685e2d`](https://github.com/withastro/astro/commit/9685e2d5ef132ca113144c1714163511a93fd29e) Thanks [@fa-sharp](https://github.com/fa-sharp)! - Fixes an EventEmitter memory leak when serving static pages from Node.js middleware.

  When using the middleware handler, requests that were being passed on to Express / Fastify (e.g. static files / pre-rendered pages / etc.) weren't cleaning up socket listeners before calling `next()`, causing a memory leak warning. This fix makes sure to run the cleanup before calling `next()`.

## 6.0.6

### Patch Changes

- [#15965](https://github.com/withastro/astro/pull/15965) [`2dca307`](https://github.com/withastro/astro/commit/2dca3074ed3de24bd23d0a17fd10a168660b2ac1) Thanks [@matthewp](https://github.com/matthewp)! - Fixes client hydration for components imported through Node.js subpath imports (`package.json#imports`, e.g. `#components/*`), for example when using the Cloudflare adapter in development.

- [#15770](https://github.com/withastro/astro/pull/15770) [`6102ca2`](https://github.com/withastro/astro/commit/6102ca2c16d5bf0ea621764351a33a99455fa0a0) Thanks [@jpc-ae](https://github.com/jpc-ae)! - Updates the `create astro` welcome message to highlight the graceful dev/preview server quit command rather than the kill process shortcut

- [#15953](https://github.com/withastro/astro/pull/15953) [`7eddf22`](https://github.com/withastro/astro/commit/7eddf22cd4d4719d966ed7168e9890fac8fc29f5) Thanks [@Desel72](https://github.com/Desel72)! - fix(hmr): eagerly recompile on style-only change to prevent stale slots render

- [#15916](https://github.com/withastro/astro/pull/15916) [`5201ed4`](https://github.com/withastro/astro/commit/5201ed464258e799a1e898f4c4adc84d7445bad3) Thanks [@trueberryless](https://github.com/trueberryless)! - Fixes `InferLoaderSchema` type inference for content collections defined with a loader that includes a `schema`

- [#15864](https://github.com/withastro/astro/pull/15864) [`d3c7de9`](https://github.com/withastro/astro/commit/d3c7de9253e9cb31fa5c4bf9f4bdf59dd1ada7b0) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes temporary support for Node >=20.19.1 because Stackblitz now uses Node 22 by default

- [#15944](https://github.com/withastro/astro/pull/15944) [`a5e1acd`](https://github.com/withastro/astro/commit/a5e1acdebef4e061341eca24128667a3009a7048) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixes SSR dynamic routes with `.html` extension (e.g. `[slug].html.astro`) not working

- [#15937](https://github.com/withastro/astro/pull/15937) [`d236245`](https://github.com/withastro/astro/commit/d236245faf676082df6756654e504ad69e2e4d28) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where HMR didn't correctly work on Windows when adding/changing/deleting routes in `pages/`.

- [#15931](https://github.com/withastro/astro/pull/15931) [`98dfb61`](https://github.com/withastro/astro/commit/98dfb61f963d70961dc2b28d786a6280f52603a1) Thanks [@Strernd](https://github.com/Strernd)! - Fix skew protection query params not being applied to island hydration `component-url` and `renderer-url`, and ensure query params are appended safely for asset URLs with existing search/hash parts.

- Updated dependencies []:
  - @astrojs/markdown-remark@7.0.1

## 6.0.5

### Patch Changes

- [#15891](https://github.com/withastro/astro/pull/15891) [`b889231`](https://github.com/withastro/astro/commit/b88923114e3cfe30c945680a62c7bd7f667bbf4d) Thanks [@matthewp](https://github.com/matthewp)! - Fix dev routing for `server:defer` islands when adapters opt into handling prerendered routes in Astro core. Server island requests are now treated as prerender-handler eligible so prerendered pages using `prerenderEnvironment: 'node'` can load island content without `400` errors.

- [#15890](https://github.com/withastro/astro/pull/15890) [`765a887`](https://github.com/withastro/astro/commit/765a8871ed5fb30bb0211e2f8524bd97081acbca) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `astro:actions` validation to check resolved routes, so projects using default static output with at least one `prerender = false` page or endpoint no longer fail during startup.

- [#15884](https://github.com/withastro/astro/pull/15884) [`dcd2c8e`](https://github.com/withastro/astro/commit/dcd2c8e2df88ad81a027b49f6f9dcdba614f836a) Thanks [@matthewp](https://github.com/matthewp)! - Avoid a `MaxListenersExceededWarning` during `astro dev` startup by increasing the shared Vite watcher listener limit when attaching content server listeners.

- [#15904](https://github.com/withastro/astro/pull/15904) [`23d5244`](https://github.com/withastro/astro/commit/23d5244361f9452c1d124600d2cc97aa3fe4a63c) Thanks [@jlukic](https://github.com/jlukic)! - Emit the `before-hydration` script chunk for the `client` Vite environment. The chunk was only emitted for `prerender` and `ssr` environments, causing a 404 when browsers tried to load it. This broke hydration for any integration using `injectScript('before-hydration', ...)`, including Lit SSR.

- [#15933](https://github.com/withastro/astro/pull/15933) [`325901e`](https://github.com/withastro/astro/commit/325901e623462babd8d07ba7527e141e08ef1901) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where `<style>` tags inside SVG components weren't correctly tracked when enabling CSP.

- [#15875](https://github.com/withastro/astro/pull/15875) [`c43ef8a`](https://github.com/withastro/astro/commit/c43ef8a565564770f022bd7cf9d2fcccf5949308) Thanks [@matthewp](https://github.com/matthewp)! - Ensure custom prerenderers are always torn down during build, even when `getStaticPaths()` throws.

- [#15887](https://github.com/withastro/astro/pull/15887) [`1861fed`](https://github.com/withastro/astro/commit/1861fedef36394ff89604125b785aca073c0d35d) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the build incorrectly leaked server entrypoint into the client environment, causing adapters to emit warnings during the build.

- [#15888](https://github.com/withastro/astro/pull/15888) [`925252e`](https://github.com/withastro/astro/commit/925252e8c361a169d1f4dc1e3677b96b9e815dea) Thanks [@matthewp](https://github.com/matthewp)! - Fix a bug where `server:defer` could fail at runtime in prerendered pages for some adapters (including Cloudflare), causing errors like `serverIslandMap?.get is not a function`.

- [#15901](https://github.com/withastro/astro/pull/15901) [`07c1002`](https://github.com/withastro/astro/commit/07c1002835f9bd91c9acaa82515254e4e11094d4) Thanks [@delucis](https://github.com/delucis)! - Fixes JSON schema generation for content collection schemas that have differences between their input and output shapes.

- [#15882](https://github.com/withastro/astro/pull/15882) [`759f946`](https://github.com/withastro/astro/commit/759f9461bf8818380e3cc83a9bc1844c82a52c6d) Thanks [@matthewp](https://github.com/matthewp)! - Fix `Astro.url.pathname` for the root page when using `build.format: "file"` so it resolves to `/index.html` instead of `/.html` during builds.

## 6.0.4

### Patch Changes

- [#15870](https://github.com/withastro/astro/pull/15870) [`920f10b`](https://github.com/withastro/astro/commit/920f10bb3a49da8355967df99c32c43cc9f53b46) Thanks [@matthewp](https://github.com/matthewp)! - Prebundle `astro/toolbar` in dev when custom dev toolbar apps are registered, preventing re-optimization reloads that can hide or break the toolbar.

- [#15876](https://github.com/withastro/astro/pull/15876) [`f47ac53`](https://github.com/withastro/astro/commit/f47ac5352dcb36daa64ec12b7d4ac193045d10e3) Thanks [@ematipico](https://github.com/ematipico)! - Fixes `redirectToDefaultLocale` producing a protocol-relative URL (`//locale`) instead of an absolute path (`/locale`) when `base` is `'/'`.

- [#15767](https://github.com/withastro/astro/pull/15767) [`e0042f7`](https://github.com/withastro/astro/commit/e0042f720274d8763907c1d429723192a71d6932) Thanks [@matthewp](https://github.com/matthewp)! - Fixes server islands (`server:defer`) not working when only used in prerendered pages with `output: 'server'`.

- [#15873](https://github.com/withastro/astro/pull/15873) [`35841ed`](https://github.com/withastro/astro/commit/35841ed273581a567cd726bb2d14d2ed3886bed0) Thanks [@matthewp](https://github.com/matthewp)! - Fix a dev server bug where newly created pages could miss layout-imported CSS until restart.

- [#15874](https://github.com/withastro/astro/pull/15874) [`ce0669d`](https://github.com/withastro/astro/commit/ce0669d68115c5e2d00238f3e780a2af50f5be11) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a warning when using `prefetchAll`

- [#15754](https://github.com/withastro/astro/pull/15754) [`58f1d63`](https://github.com/withastro/astro/commit/58f1d63cbcdd351d80cc65ceff4cb1a8d1aa1853) Thanks [@rururux](https://github.com/rururux)! - Fixes a bug where a directory at the project root sharing the same name as a page route would cause the dev server to return a 404 instead of serving the page.

- [#15869](https://github.com/withastro/astro/pull/15869) [`76b3a5e`](https://github.com/withastro/astro/commit/76b3a5e4bb1e9f2855d4169602295d601d7e7436) Thanks [@matthewp](https://github.com/matthewp)! - Update the unknown file extension error hint to recommend `vite.resolve.noExternal`, which is the correct Vite 7 config key.

## 6.0.3

### Patch Changes

- [#15711](https://github.com/withastro/astro/pull/15711) [`b2bd27b`](https://github.com/withastro/astro/commit/b2bd27bcb605d1e44e94ab922a8d7d2aa685149d) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Improves Astro core's dev environment handling for prerendered routes by ensuring route/CSS updates and prerender middleware behavior work correctly across both SSR and prerender environments.

  This enables integrations that use Astro's prerender dev environment (such as Cloudflare with `prerenderEnvironment: 'node'`) to get consistent route matching and HMR behavior during development.

- [#15852](https://github.com/withastro/astro/pull/15852) [`1cdaf9f`](https://github.com/withastro/astro/commit/1cdaf9f488e4db158db2c80ce192890b0b9bfa00) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where the the routes emitted by the `astro:build:done` hook didn't have the `distURL` array correctly populated.

- [#15765](https://github.com/withastro/astro/pull/15765) [`ca76ff1`](https://github.com/withastro/astro/commit/ca76ff1dedafdc764f551e753e0772b54f807fa1) Thanks [@matthewp](https://github.com/matthewp)! - Hardens server island POST endpoint validation to use own-property checks for improved consistency

## 6.0.2

### Patch Changes

- [#15832](https://github.com/withastro/astro/pull/15832) [`95e12a2`](https://github.com/withastro/astro/commit/95e12a250ece206f55f8c0c07c9c05489f3df93f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `return;` syntax not working in the frontmatter correctly in certain contexts

## 6.0.1

### Patch Changes

- [#15827](https://github.com/withastro/astro/pull/15827) [`a4c0d0b`](https://github.com/withastro/astro/commit/a4c0d0b4df540b23fa85bf926f9cc97470737fa1) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `astro add` so the tsconfig preview shows the actual pending changes before confirmation

## 6.0.0

### Major Changes

- [#14446](https://github.com/withastro/astro/pull/14446) [`ece667a`](https://github.com/withastro/astro/commit/ece667a737a96c8bfea2702de7207bed0842b37c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes `entryPoints` on `astro:build:ssr` hook (Integration API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-entrypoints-on-astrobuildssr-hook-integration-api))

- [#15535](https://github.com/withastro/astro/pull/15535) [`dfe2e22`](https://github.com/withastro/astro/commit/dfe2e22042f92172442ab32777b3cce90685b76a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `loadManifest()` and `loadApp()` from `astro/app/node` (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-loadmanifest-and-loadapp-from-astroappnode-adapter-api))

- [#15006](https://github.com/withastro/astro/pull/15006) [`f361730`](https://github.com/withastro/astro/commit/f361730bc820c01a2ec3e508ac940be8077d8c04) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes session `test` driver - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-session-test-driver))

- [#15461](https://github.com/withastro/astro/pull/15461) [`9f21b24`](https://github.com/withastro/astro/commit/9f21b243d21478cdc5fb0193e05adad8e753839f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - **BREAKING CHANGE to the v6 beta Adapter API only**: renames `entryType` to `entrypointResolution` and updates possible values

  Astro 6 introduced a way to let adapters have more control over the entrypoint by passing `entryType: 'self'` to `setAdapter()`. However during beta development, the name was unclear and confusing.

  `entryType` is now renamed to `entrypointResolution` and its possible values are updated:
  - `legacy-dynamic` becomes `explicit`.
  - `self` becomes `auto`.

  If you are building an adapter with v6 beta and specifying `entryType`, update it:

  ```diff
  setAdapter({
      // ...
  -    entryType: 'legacy-dynamic'
  +    entrypointResolution: 'explicit'
  })

  setAdapter({
      // ...
  -    entryType: 'self'
  +    entrypointResolution: 'auto'
  })
  ```

- [#14426](https://github.com/withastro/astro/pull/14426) [`861b9cc`](https://github.com/withastro/astro/commit/861b9cc770a05d9fcfcb2f1f442a3ba41e94b510) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the deprecated `emitESMImage()` function - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-emitesmimage))

- [#15006](https://github.com/withastro/astro/pull/15006) [`f361730`](https://github.com/withastro/astro/commit/f361730bc820c01a2ec3e508ac940be8077d8c04) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates session driver string signature - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-session-driver-string-signature))

- [#15180](https://github.com/withastro/astro/pull/15180) [`8780ff2`](https://github.com/withastro/astro/commit/8780ff2926d59ed196c70032d2ae274b8415655c) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for converting SVGs to raster images (PNGs, WebP, etc) to the default Sharp image service - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-svg-rasterization))

- [#14446](https://github.com/withastro/astro/pull/14446) [`ece667a`](https://github.com/withastro/astro/commit/ece667a737a96c8bfea2702de7207bed0842b37c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes `routes` on `astro:build:done` hook (Integration API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-routes-on-astrobuilddone-hook-integration-api))

- [#15424](https://github.com/withastro/astro/pull/15424) [`33d6146`](https://github.com/withastro/astro/commit/33d6146e4872bb1e3feef0a6c0ea8e62f49f4c7e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Throws an error when `getImage()` from `astro:assets` is called on the client - ([v6 upgrade guidance](https://v6.docs.astro.build/en/guides/upgrade-to/v6/#changed-getimage-throws-when-called-on-the-client))

- [#14462](https://github.com/withastro/astro/pull/14462) [`9fdfd4c`](https://github.com/withastro/astro/commit/9fdfd4c620313827e65664632a9c9cb435ad07ca) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the old `app.render()` signature (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-old-apprender-signature-adapter-api))

- [#14956](https://github.com/withastro/astro/pull/14956) [`0ff51df`](https://github.com/withastro/astro/commit/0ff51dfa3c6c615af54228e159f324034472b1a2) Thanks [@matthewp](https://github.com/matthewp)! - Astro v6.0 upgrades to Zod v4 for schema validation - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#zod-4))

- [#14759](https://github.com/withastro/astro/pull/14759) [`d7889f7`](https://github.com/withastro/astro/commit/d7889f768a4d27e8c4ad3a0022099d19145a7d58) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates how schema types are inferred for content loaders with schemas (Loader API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-schema-types-are-inferred-instead-of-generated-content-loader-api))

- [#15192](https://github.com/withastro/astro/pull/15192) [`ada2808`](https://github.com/withastro/astro/commit/ada2808a23fc70ea1f1663f3e1b69c6b735251e5) Thanks [@gameroman](https://github.com/gameroman)! - Removes support for CommonJS config files - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-support-for-commonjs-config-files))

- [#14462](https://github.com/withastro/astro/pull/14462) [`9fdfd4c`](https://github.com/withastro/astro/commit/9fdfd4c620313827e65664632a9c9cb435ad07ca) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes `prefetch()` `with` option - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-prefetch-with-option))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Removes support for routes with percent-encoded percent signs (e.g. `%25`) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-percent-encoding-in-routes))

- [#14432](https://github.com/withastro/astro/pull/14432) [`b1d87ec`](https://github.com/withastro/astro/commit/b1d87ec3bc2fbe214437990e871df93909d18f62) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `Astro` in `getStaticPaths()` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-astro-in-getstaticpaths))

- [#14759](https://github.com/withastro/astro/pull/14759) [`d7889f7`](https://github.com/withastro/astro/commit/d7889f768a4d27e8c4ad3a0022099d19145a7d58) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the option to define dynamic schemas in content loaders as functions and adds a new equivalent `createSchema()` property (Loader API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-schema-function-signature-content-loader-api))

- [#14457](https://github.com/withastro/astro/pull/14457) [`049da87`](https://github.com/withastro/astro/commit/049da87cb7ce1828f3025062ce079dbf132f5b86) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates trailing slash behavior of endpoint URLs - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-endpoints-with-a-file-extension-cannot-be-accessed-with-a-trailing-slash))

- [#14494](https://github.com/withastro/astro/pull/14494) [`727b0a2`](https://github.com/withastro/astro/commit/727b0a205eb765f1c36f13a73dfc69e17e44df8f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates Markdown heading ID generation - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-markdown-heading-id-generation))

- [#14461](https://github.com/withastro/astro/pull/14461) [`55a1a91`](https://github.com/withastro/astro/commit/55a1a911aa4e0d38191f8cb9464ffd58f3eb7608) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `import.meta.env.ASSETS_PREFIX` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-importmetaenvassets_prefix))

- [#14586](https://github.com/withastro/astro/pull/14586) [`669ca5b`](https://github.com/withastro/astro/commit/669ca5b0199d9933f54c76448de9ec5a9f13c430) Thanks [@ocavue](https://github.com/ocavue)! - Changes the values allowed in `params` returned by `getStaticPaths()` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-getstaticpaths-cannot-return-params-of-type-number))

- [#15668](https://github.com/withastro/astro/pull/15668) [`1118ac4`](https://github.com/withastro/astro/commit/1118ac4f299341e15061e8a4e6e8423071c4d41c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Changes TypeScript configuration - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-typescript-configuration))

- [#14421](https://github.com/withastro/astro/pull/14421) [`df6d2d7`](https://github.com/withastro/astro/commit/df6d2d7bbcaf6b6a327a37a6437d4adade6e2485) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the previously deprecated `Astro.glob()` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-astroglob))

- [#15049](https://github.com/withastro/astro/pull/15049) [`beddfeb`](https://github.com/withastro/astro/commit/beddfeb31e807cb472a43fa56c69f85dbadc9604) Thanks [@Ntale3](https://github.com/Ntale3)! - Removes the ability to render Astro components in Vitest client environments - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-astro-components-cannot-be-rendered-in-vitest-client-environments-container-api))

- [#15461](https://github.com/withastro/astro/pull/15461) [`9f21b24`](https://github.com/withastro/astro/commit/9f21b243d21478cdc5fb0193e05adad8e753839f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `createExports()` and `start()` (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-createexports-and-start-adapter-api))

- [#15535](https://github.com/withastro/astro/pull/15535) [`dfe2e22`](https://github.com/withastro/astro/commit/dfe2e22042f92172442ab32777b3cce90685b76a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `NodeApp` from `astro/app/node` (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-nodeapp-from-astroappnode-adapter-api))

- [#14462](https://github.com/withastro/astro/pull/14462) [`9fdfd4c`](https://github.com/withastro/astro/commit/9fdfd4c620313827e65664632a9c9cb435ad07ca) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `handleForms` prop for the `<ClientRouter />` component - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-handleforms-prop-for-the-clientrouter--component))

- [#14427](https://github.com/withastro/astro/pull/14427) [`e131261`](https://github.com/withastro/astro/commit/e1312615b39c59ebc05d5bb905ee0960b50ad3cf) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Increases minimum Node.js version to 22.12.0 - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#node-22))

- [#15332](https://github.com/withastro/astro/pull/15332) [`7c55f80`](https://github.com/withastro/astro/commit/7c55f80fa1fd91f8f71ad60437f81e6c7f98f69d) Thanks [@matthewp](https://github.com/matthewp)! - Adds frontmatter parsing support to `renderMarkdown` in content loaders. When markdown content includes frontmatter, it is now extracted and available in `metadata.frontmatter`, and excluded from the HTML output. This makes `renderMarkdown` behave consistently with the `glob` loader.

  ```js
  const loader = {
    name: 'my-loader',
    load: async ({ store, renderMarkdown }) => {
      const content = `---
  title: My Post
  ---
  
  # Hello World
  `;
      const rendered = await renderMarkdown(content);
      // rendered.metadata.frontmatter is now { title: 'My Post' }
      // rendered.html contains only the content, not the frontmatter
    },
  };
  ```

- [#14400](https://github.com/withastro/astro/pull/14400) [`c69c7de`](https://github.com/withastro/astro/commit/c69c7de1ffeff29f919d97c262f245927556f875) Thanks [@ellielok](https://github.com/ellielok)! - Removes the deprecated `<ViewTransitions />` component - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-viewtransitions--component))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Removes `RouteData.generate` from the Integration API - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-routedatagenerate-adapter-api))

- [#14406](https://github.com/withastro/astro/pull/14406) [`4f11510`](https://github.com/withastro/astro/commit/4f11510c9ed932f5cb6d1075b1172909dd5db23e) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Changes the default routing configuration value of `i18n.routing.redirectToDefaultLocale` from `true` to `false` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-i18nroutingredirecttodefaultlocale-default-value))

- [#14989](https://github.com/withastro/astro/pull/14989) [`73e8232`](https://github.com/withastro/astro/commit/73e823201cc5bdd6ccab14c07ff0dca5117436ad) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates exposed `astro:transitions` internals - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-exposed-astrotransitions-internals))

- [#15726](https://github.com/withastro/astro/pull/15726) [`6f19ecc`](https://github.com/withastro/astro/commit/6f19ecc35adfb2ddaabbba2269630f95c13f5a57) Thanks [@ocavue](https://github.com/ocavue)! - Updates dependency `shiki` to v4

  Check [Shiki's upgrade guide](https://shiki.style/blog/v4).

- [#14758](https://github.com/withastro/astro/pull/14758) [`010f773`](https://github.com/withastro/astro/commit/010f7731becbaaba347da21ef07b8a410e31442a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `setManifestData` method from `App` and `NodeApp` (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-appsetmanifestdata-adapter-api))

- [#14477](https://github.com/withastro/astro/pull/14477) [`25fe093`](https://github.com/withastro/astro/commit/25fe09396dbcda2e1008c01a982f4eb2d1f33ae6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes `rewrite()` from Actions context - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-rewrite-from-actions-context))

- [#14826](https://github.com/withastro/astro/pull/14826) [`170f64e`](https://github.com/withastro/astro/commit/170f64e977290b8f9d316b5f283bd03bae33ddde) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `experimental.failOnPrerenderConflict` flag and replaces it with a new configuration option `prerenderConflictBehavior` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#experimental-flags))

- [#14923](https://github.com/withastro/astro/pull/14923) [`95a1969`](https://github.com/withastro/astro/commit/95a1969a05cc9c15f16dcf2177532882bb392581) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `astro:schema` and `z` from `astro:content` in favor of `astro/zod` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-astroschema-and-z-from-astrocontent))

- [#14844](https://github.com/withastro/astro/pull/14844) [`8d43b1d`](https://github.com/withastro/astro/commit/8d43b1d678eed5be85f99b939d55346824c03cb5) Thanks [@trueberryless](https://github.com/trueberryless)! - Removes exposed `astro:actions` internals - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-exposed-astroactions-internals))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Changes the shape of `SSRManifest` properties and adds several new required properties in the Adapter API - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-ssrmanifest-interface-structure-adapter-api))

- [#15266](https://github.com/withastro/astro/pull/15266) [`f7c9365`](https://github.com/withastro/astro/commit/f7c9365d92b2196d4ba6cffd01b01967ca73728c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Allows `Astro.csp` and `context.csp` to be undefined instead of throwing errors when `csp: true` is not configured

  When using the experimental Content Security Policy feature in Astro 5.x, `context.csp` was always defined but would throw if `experimental.csp` was not enabled in the Astro config.

  For the stable version of this API in Astro 6, `context.csp` can now be undefined if CSP is not enabled and its methods will never throw.

  #### What should I do?

  If you were using experimental CSP runtime utilities, you must now access methods conditionally:

  ```diff
  -Astro.csp.insertDirective("default-src 'self'");
  +Astro.csp?.insertDirective("default-src 'self'");
  ```

- [#14445](https://github.com/withastro/astro/pull/14445) [`ecb0b98`](https://github.com/withastro/astro/commit/ecb0b98396f639d830a99ddb5895ab9223e4dc87) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Astro v6.0 upgrades to Vite v7.0 as the development server and production bundler - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#vite-70))

- [#15407](https://github.com/withastro/astro/pull/15407) [`aedbbd8`](https://github.com/withastro/astro/commit/aedbbd818628bed0533cdd627b73e2c5365aa17e) Thanks [@ematipico](https://github.com/ematipico)! - Changes how styles of responsive images are emitted - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-how-responsive-image-styles-are-emitted))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Changes integration hooks and HMR access patterns in the Integration API - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-integration-hooks-and-hmr-access-patterns-integration-api))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Removes the unused `astro:ssr-manifest` virtual module - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-astrossr-manifest-virtual-module-integration-api))

- [#14485](https://github.com/withastro/astro/pull/14485) [`6f67c6e`](https://github.com/withastro/astro/commit/6f67c6eef2647ef1a1eab78a65a906ab633974bb) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `import.meta.env` values to always be inlined - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-importmetaenv-values-are-always-inlined))

- [#14480](https://github.com/withastro/astro/pull/14480) [`36a461b`](https://github.com/withastro/astro/commit/36a461bf3f64c467bc52aecf511cd831d238e18b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `<script>` and `<style>` tags to render in the order they are defined - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-script-and-style-tags-are-rendered-in-the-order-they-are-defined))

- [#14407](https://github.com/withastro/astro/pull/14407) [`3bda3ce`](https://github.com/withastro/astro/commit/3bda3ce4edcb1bd1349890c6ed8110f05954c791) Thanks [@ascorbic](https://github.com/ascorbic)! - Removes legacy content collection support - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-legacy-content-collections))

### Minor Changes

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Adds new optional properties to `setAdapter()` for adapter entrypoint handling in the Adapter API

  **Changes:**
  - New optional properties:
    - `entryType?: 'self' | 'legacy-dynamic'` - determines if the adapter provides its own entrypoint (`'self'`) or if Astro constructs one (`'legacy-dynamic'`, default)

  **Migration:** Adapter authors can optionally add these properties to support custom dev entrypoints. If not specified, adapters will use the legacy behavior.

- [#15700](https://github.com/withastro/astro/pull/15700) [`4e7f3e8`](https://github.com/withastro/astro/commit/4e7f3e8e6849c314a0ab031ebd7f23fb982f0529) Thanks [@ocavue](https://github.com/ocavue)! - Updates the internal logic during SSR by providing additional metadata for UI framework integrations.

- [#15231](https://github.com/withastro/astro/pull/15231) [`3928b87`](https://github.com/withastro/astro/commit/3928b879dd35fa4ec4dcf545f1610a0f0a55fdae) Thanks [@rururux](https://github.com/rururux)! - Adds a new optional `getRemoteSize()` method to the Image Service API.

  Previously, `inferRemoteSize()` had a fixed implementation that fetched the entire image to determine its dimensions.
  With this new helper function that extends `inferRemoteSize()`, you can now override or extend how remote image metadata is retrieved.

  This enables use cases such as:
  - Caching: Storing image dimensions in a database or local cache to avoid redundant network requests.
  - Provider APIs: Using a specific image provider's API (like Cloudinary or Vercel) to get dimensions without downloading the file.

  For example, you can add a simple cache layer to your existing image service:

  ```js
  const cache = new Map();

  const myService = {
    ...baseService,
    async getRemoteSize(url, imageConfig) {
      if (cache.has(url)) return cache.get(url);

      const result = await baseService.getRemoteSize(url, imageConfig);
      cache.set(url, result);
      return result;
    },
  };
  ```

  See the [Image Services API reference documentation](https://docs.astro.build/en/reference/image-service-reference/#getremotesize) for more information.

- [#15077](https://github.com/withastro/astro/pull/15077) [`a164c77`](https://github.com/withastro/astro/commit/a164c77336059f2dc3e7f7fe992aa754ed145ef3) Thanks [@matthewp](https://github.com/matthewp)! - Updates the Integration API to add `setPrerenderer()` to the `astro:build:start` hook, allowing adapters to provide custom prerendering logic.

  The new API accepts either an `AstroPrerenderer` object directly, or a factory function that receives the default prerenderer:

  ```js
  'astro:build:start': ({ setPrerenderer }) => {
    setPrerenderer((defaultPrerenderer) => ({
      name: 'my-prerenderer',
      async setup() {
        // Optional: called once before prerendering starts
      },
      async getStaticPaths() {
        // Returns array of { pathname: string, route: RouteData }
        return defaultPrerenderer.getStaticPaths();
      },
      async render(request, { routeData }) {
        // request: Request
        // routeData: RouteData
        // Returns: Response
      },
      async teardown() {
        // Optional: called after all pages are prerendered
      }
    }));
  }
  ```

  Also adds the `astro:static-paths` virtual module, which exports a `StaticPaths` class for adapters to collect all prerenderable paths from within their target runtime. This is useful when implementing a custom prerenderer that runs in a non-Node environment:

  ```js
  // In your adapter's request handler (running in target runtime)
  import { App } from 'astro/app';
  import { StaticPaths } from 'astro:static-paths';

  export function createApp(manifest) {
    const app = new App(manifest);

    return {
      async fetch(request) {
        const { pathname } = new URL(request.url);

        // Expose endpoint for prerenderer to get static paths
        if (pathname === '/__astro_static_paths') {
          const staticPaths = new StaticPaths(app);
          const paths = await staticPaths.getAll();
          return new Response(JSON.stringify({ paths }));
        }

        // Normal request handling
        return app.render(request);
      },
    };
  }
  ```

  See the [adapter reference](https://docs.astro.build/en/reference/adapter-reference/#custom-prerenderer) for more details on implementing a custom prerenderer.

- [#15345](https://github.com/withastro/astro/pull/15345) [`840fbf9`](https://github.com/withastro/astro/commit/840fbf9e4abc7f847e23da8d67904ffde4d95fff) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `emitClientAsset` function to `astro/assets/utils` for integration authors. This function allows emitting assets that will be moved to the client directory during SSR builds, useful for assets referenced in server-rendered content that need to be available on the client.

  ```ts
  import { emitClientAsset } from 'astro/assets/utils';

  // Inside a Vite plugin's transform or load hook
  const handle = emitClientAsset(this, {
    type: 'asset',
    name: 'my-image.png',
    source: imageBuffer,
  });
  ```

- [#15460](https://github.com/withastro/astro/pull/15460) [`ee7e53f`](https://github.com/withastro/astro/commit/ee7e53f9de2338517e149895efd26fca44ad80b6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates the Adapter API to allow providing a `serverEntrypoint` when using `entryType: 'self'`

  Astro 6 introduced a new powerful yet simple Adapter API for defining custom server entrypoints. You can now call `setAdapter()` with the `entryType: 'self'` option and specify your custom `serverEntrypoint`:

  ```js
  export function myAdapter() {
    return {
      name: 'my-adapter',
      hooks: {
        'astro:config:done': ({ setAdapter }) => {
          setAdapter({
            name: 'my-adapter',
            entryType: 'self',
            serverEntrypoint: 'my-adapter/server.js',
            supportedAstroFeatures: {
              // ...
            },
          });
        },
      },
    };
  }
  ```

  If you need further customization at the Vite level, you can omit `serverEntrypoint` and instead specify your custom server entrypoint with [`vite.build.rollupOptions.input`](https://rollupjs.org/configuration-options/#input).

- [#15781](https://github.com/withastro/astro/pull/15781) [`2de969d`](https://github.com/withastro/astro/commit/2de969d1f5279d2d0f3024208146f9cd895267b6) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new `clientAddress` option to the `createContext()` function

  Providing this value gives adapter and middleware authors explicit control over the client IP address. When not provided, accessing `clientAddress` throws an error consistent with other contexts where it is not set by the adapter.

  Additionally, both of the official Netlify and Vercel adapters have been updated to provide this information in their edge middleware.

  ```js
  import { createContext } from 'astro/middleware';

  createContext({
    clientAddress: context.headers.get('x-real-ip'),
  });
  ```

- [#15258](https://github.com/withastro/astro/pull/15258) [`d339a18`](https://github.com/withastro/astro/commit/d339a182b387a7a1b0d5dd0d67a0638aaa2b4262) Thanks [@ematipico](https://github.com/ematipico)! - Stabilizes the adapter feature `experimentalStatiHeaders`. If you were using this feature in any of the supported adapters, you'll need to change the name of the flag:

  ```diff
  export default defineConfig({
    adapter: netlify({
  -    experimentalStaticHeaders: true
  +    staticHeaders: true
    })
  })
  ```

- [#15535](https://github.com/withastro/astro/pull/15535) [`dfe2e22`](https://github.com/withastro/astro/commit/dfe2e22042f92172442ab32777b3cce90685b76a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Exports new `createRequest()` and `writeResponse()` utilities from `astro/app/node`

  To replace the deprecated `NodeApp.createRequest()` and `NodeApp.writeResponse()` methods, the `astro/app/node` module now exposes new `createRequest()` and `writeResponse()` utilities. These can be used to convert a NodeJS `IncomingMessage` into a web-standard `Request` and stream a web-standard `Response` into a NodeJS `ServerResponse`:

  ```js
  import { createApp } from 'astro/app/entrypoint';
  import { createRequest, writeResponse } from 'astro/app/node';
  import { createServer } from 'node:http';

  const app = createApp();

  const server = createServer(async (req, res) => {
    const request = createRequest(req);
    const response = await app.render(request);
    await writeResponse(response, res);
  });
  ```

- [#15755](https://github.com/withastro/astro/pull/15755) [`f9ee868`](https://github.com/withastro/astro/commit/f9ee8685dd26e9afeba3b48d41ad6714f624b12f) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `security.serverIslandBodySizeLimit` configuration option

  Server island POST endpoints now enforce a body size limit, similar to the existing `security.actionBodySizeLimit` for Actions. The new option defaults to `1048576` (1 MB) and can be configured independently.

  Requests exceeding the limit are rejected with a 413 response. You can customize the limit in your Astro config:

  ```js
  export default defineConfig({
    security: {
      serverIslandBodySizeLimit: 2097152, // 2 MB
    },
  });
  ```

- [#15529](https://github.com/withastro/astro/pull/15529) [`a509941`](https://github.com/withastro/astro/commit/a509941a7a7a1e53f402757234bb88e5503e5119) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new build-in font provider `npm` to access fonts installed as NPM packages

  You can now add web fonts specified in your `package.json` through Astro's type-safe Fonts API. The `npm` font provider allows you to add fonts either from locally installed packages in `node_modules` or from a CDN.

  Set `fontProviders.npm()` as your fonts provider along with the required `name` and `cssVariable` values, and add `options` as needed:

  ```js
  import { defineConfig, fontProviders } from 'astro/config';

  export default defineConfig({
    experimental: {
      fonts: [
        {
          name: 'Roboto',
          provider: fontProviders.npm(),
          cssVariable: '--font-roboto',
        },
      ],
    },
  });
  ```

  See the [NPM font provider reference documentation](https://docs.astro.build/en/reference/font-provider-reference/#npm) for more details.

- [#15471](https://github.com/withastro/astro/pull/15471) [`32b4302`](https://github.com/withastro/astro/commit/32b430213bbe51898b77ec2eadbacb9dfb220f75) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new experimental flag `queuedRendering` to enable a queue-based rendering engine

  The new engine is based on a two-pass process, where the first pass
  traverses the tree of components, emits an ordered queue, and then the queue is rendered.

  The new engine does not use recursion, and comes with two customizable options.

  Early benchmarks showed significant speed improvements and memory efficiency in big projects.

  #### Queue-rendered based

  The new engine can be enabled in your Astro config with `experimental.queuedRendering.enabled` set to `true`, and can be further customized with additional sub-features.

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      queuedRendering: {
        enabled: true,
      },
    },
  });
  ```

  #### Pooling

  With the new engine enabled, you now have the option to have a pool of nodes that can be saved and reused across page rendering. Node pooling has no effect when rendering pages on demand (SSR) because these rendering requests don't share memory. However, it can be very useful for performance when building static pages.

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      queuedRendering: {
        enabled: true,
        poolSize: 2000, // store up to 2k nodes to be reused across renderers
      },
    },
  });
  ```

  #### Content caching

  The new engine additionally unlocks a new `contentCache` option. This allows you to cache values of nodes during the rendering phase. This is currently a boolean feature with no further customization (e.g. size of cache) that uses sensible defaults for most large content collections:

  When disabled, the pool engine won't cache strings, but only types.

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      queuedRendering: {
        enabled: true,
        contentCache: true, // enable re-use of node values
      },
    },
  });
  ```

  For more information on enabling and using this feature in your project, see the [experimental queued rendering docs](https://docs.astro.build/en/reference/experimental-flags/queued-rendering/) for more details.

- [#14888](https://github.com/withastro/astro/pull/14888) [`4cd3fe4`](https://github.com/withastro/astro/commit/4cd3fe412bddbb0deb1383e83f3f8ae6e72596af) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Updates `astro add cloudflare` to better setup types, by adding `./worker-configuration.d.ts` to tsconfig includes and a `generate-types` script to package.json

- [#15646](https://github.com/withastro/astro/pull/15646) [`0dd9d00`](https://github.com/withastro/astro/commit/0dd9d00cf8be38c53217426f6b0e155a6f7c2a22) Thanks [@delucis](https://github.com/delucis)! - Removes redundant `fetchpriority` attributes from the output of Astro’s `<Image>` component

  Previously, Astro would always include `fetchpriority="auto"` on images not using the `priority` attribute.
  However, this is the default value, so specifying it is redundant. This change omits the attribute by default.

- [#15291](https://github.com/withastro/astro/pull/15291) [`89b6cdd`](https://github.com/withastro/astro/commit/89b6cdd4075f5c9362291c386bb1e7c100b467a5) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `experimental.fonts` flag and replaces it with a new configuration option `fonts` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#experimental-flags))

- [#15495](https://github.com/withastro/astro/pull/15495) [`5b99e90`](https://github.com/withastro/astro/commit/5b99e9077a92602f1e46e9b6eb9094bcd00c640e) Thanks [@leekeh](https://github.com/leekeh)! - Adds a new `middlewareMode` adapter feature to replace the previous `edgeMiddleware` option.

  This feature only impacts adapter authors. If your adapter supports `edgeMiddleware`, you should upgrade to the new `middlewareMode` option to specify the middleware mode for your adapter as soon as possible. The `edgeMiddleware` feature is deprecated and will be removed in a future major release.

  ```diff
  export default function createIntegration() {
    return {
      name: '@example/my-adapter',
      hooks: {
        'astro:config:done': ({ setAdapter }) => {
          setAdapter({
            name: '@example/my-adapter',
            serverEntrypoint: '@example/my-adapter/server.js',
            adapterFeatures: {
  -            edgeMiddleware: true
  +            middlewareMode: 'edge'
            }
          });
        },
      },
    };
  }
  ```

- [#15694](https://github.com/withastro/astro/pull/15694) [`66449c9`](https://github.com/withastro/astro/commit/66449c930e73e9a58ce547b9c32635a98a310966) Thanks [@matthewp](https://github.com/matthewp)! - Adds `preserveBuildClientDir` option to adapter features

  Adapters can now opt in to preserving the client/server directory structure for static builds by setting `preserveBuildClientDir: true` in their adapter features. When enabled, static builds will output files to `build.client` instead of directly to `outDir`.

  This is useful for adapters that require a consistent directory structure regardless of the build output type, such as deploying to platforms with specific file organization requirements.

  ```js
  // my-adapter/index.js
  export default function myAdapter() {
    return {
      name: 'my-adapter',
      hooks: {
        'astro:config:done': ({ setAdapter }) => {
          setAdapter({
            name: 'my-adapter',
            adapterFeatures: {
              buildOutput: 'static',
              preserveBuildClientDir: true,
            },
          });
        },
      },
    };
  }
  ```

- [#15332](https://github.com/withastro/astro/pull/15332) [`7c55f80`](https://github.com/withastro/astro/commit/7c55f80fa1fd91f8f71ad60437f81e6c7f98f69d) Thanks [@matthewp](https://github.com/matthewp)! - Adds a `fileURL` option to `renderMarkdown` in content loaders, enabling resolution of relative image paths. When provided, relative image paths in markdown will be resolved relative to the specified file URL and included in `metadata.localImagePaths`.

  ```js
  const loader = {
    name: 'my-loader',
    load: async ({ store, renderMarkdown }) => {
      const content = `
  # My Post
  
  ![Local image](./image.png)
  `;
      // Provide a fileURL to resolve relative image paths
      const fileURL = new URL('./posts/my-post.md', import.meta.url);
      const rendered = await renderMarkdown(content, { fileURL });
      // rendered.metadata.localImagePaths now contains the resolved image path
    },
  };
  ```

- [#15407](https://github.com/withastro/astro/pull/15407) [`aedbbd8`](https://github.com/withastro/astro/commit/aedbbd818628bed0533cdd627b73e2c5365aa17e) Thanks [@ematipico](https://github.com/ematipico)! - Adds support for responsive images when `security.csp` is enabled, out of the box.

  Astro's implementation of responsive image styles has been updated to be compatible with a configured Content Security Policy.

  Instead of, injecting style elements at runtime, Astro will now generate your styles at build time using a combination of `class=""` and `data-*` attributes. This means that your processed styles are loaded and hashed out of the box by Astro.

  If you were previously choosing between Astro's CSP feature and including responsive images on your site, you may now use them together.

- [#15543](https://github.com/withastro/astro/pull/15543) [`d43841d`](https://github.com/withastro/astro/commit/d43841dfa8998c4dc1a510a2b120fedbd9ce77c6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `experimental.rustCompiler` flag to opt into the experimental Rust-based Astro compiler

  This experimental compiler is faster, provides better error messages, and generally has better support for modern JavaScript, TypeScript, and CSS features.

  After enabling in your Astro config, the `@astrojs/compiler-rs` package must also be installed into your project separately:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      rustCompiler: true,
    },
  });
  ```

  This new compiler is still in early development and may exhibit some differences compared to the existing Go-based compiler. Notably, this compiler is generally more strict in regard to invalid HTML syntax and may throw errors in cases where the Go-based compiler would have been more lenient. For example, unclosed tags (e.g. `<p>My paragraph`) will now result in errors.

  For more information about using this experimental feature in your project, especially regarding expected differences and limitations, please see the [experimental Rust compiler reference docs](https://docs.astro.build/en/reference/experimental-flags/rust-compiler/). To give feedback on the compiler, or to keep up with its development, see the [RFC for a new compiler for Astro](https://github.com/withastro/roadmap/discussions/1306) for more information and discussion.

- [#15349](https://github.com/withastro/astro/pull/15349) [`a257c4c`](https://github.com/withastro/astro/commit/a257c4c3c7f0cdc5089b522ed216401d46d214c9) Thanks [@ascorbic](https://github.com/ascorbic)! - Passes collection name to live content loaders

  Live content collection loaders now receive the collection name as part of their parameters. This is helpful for loaders that manage multiple collections or need to differentiate behavior based on the collection being accessed.

  ```ts
  export function storeLoader({ field, key }) {
    return {
      name: 'store-loader',
      loadCollection: async ({ filter, collection }) => {
        // ...
      },
      loadEntry: async ({ filter, collection }) => {
        // ...
      },
    };
  }
  ```

- [#15006](https://github.com/withastro/astro/pull/15006) [`f361730`](https://github.com/withastro/astro/commit/f361730bc820c01a2ec3e508ac940be8077d8c04) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds new session driver object shape

  For greater flexibility and improved consistency with other Astro code, session drivers are now specified as an object:

  ```diff
  -import { defineConfig } from 'astro/config'
  +import { defineConfig, sessionDrivers } from 'astro/config'

  export default defineConfig({
    session: {
  -    driver: 'redis',
  -    options: {
  -      url: process.env.REDIS_URL
  -    },
  +    driver: sessionDrivers.redis({
  +      url: process.env.REDIS_URL
  +    }),
    }
  })
  ```

  Specifying the session driver as a string has been deprecated, but will continue to work until this feature is removed completely in a future major version. The object shape is the current recommended and documented way to configure a session driver.

- [#15291](https://github.com/withastro/astro/pull/15291) [`89b6cdd`](https://github.com/withastro/astro/commit/89b6cdd4075f5c9362291c386bb1e7c100b467a5) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new Fonts API to provide first-party support for adding custom fonts in Astro.

  This feature allows you to use fonts from both your file system and several built-in supported providers (e.g. Google, Fontsource, Bunny) through a unified API. Keep your site performant thanks to sensible defaults and automatic optimizations including preloading and fallback font generation.

  To enable this feature, configure `fonts` with one or more fonts:

  ```js title="astro.config.mjs"
  import { defineConfig, fontProviders } from 'astro/config';

  export default defineConfig({
    fonts: [
      {
        provider: fontProviders.fontsource(),
        name: 'Roboto',
        cssVariable: '--font-roboto',
      },
    ],
  });
  ```

  Import and include the `<Font />` component with the required `cssVariable` property in the head of your page, usually in a dedicated `Head.astro` component or in a layout component directly:

  ```astro
  ---
  // src/layouts/Layout.astro
  import { Font } from 'astro:assets';
  ---

  <html>
    <head>
      <Font cssVariable="--font-roboto" preload />
    </head>
    <body>
      <slot />
    </body>
  </html>
  ```

  In any page rendered with that layout, including the layout component itself, you can now define styles with your font's `cssVariable` to apply your custom font.

  In the following example, the `<h1>` heading will have the custom font applied, while the paragraph `<p>` will not.

  ```astro
  ---
  // src/pages/example.astro
  import Layout from '../layouts/Layout.astro';
  ---

  <Layout>
    <h1>In a galaxy far, far away...</h1>

    <p>Custom fonts make my headings much cooler!</p>

    <style>
      h1 {
        font-family: var('--font-roboto');
      }
    </style>
  </Layout>
  ```

  Visit the updated [fonts guide](https://docs.astro.build/en/guides/fonts/) to learn more about adding custom fonts to your project.

- [#14550](https://github.com/withastro/astro/pull/14550) [`9c282b5`](https://github.com/withastro/astro/commit/9c282b5e6d3f0d678bc478a863e883fa4765dd17) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds support for live content collections

  Live content collections are a new type of [content collection](https://docs.astro.build/en/guides/content-collections/) that fetch their data at runtime rather than build time. This allows you to access frequently updated data from CMSs, APIs, databases, or other sources using a unified API, without needing to rebuild your site when the data changes.

  #### Live collections vs build-time collections

  In Astro 5.0, the content layer API added support for adding diverse content sources to content collections. You can create loaders that fetch data from any source at build time, and then access it inside a page via `getEntry()` and `getCollection()`. The data is cached between builds, giving fast access and updates.

  However, there was no method for updating the data store between builds, meaning any updates to the data needed a full site deploy, even if the pages are rendered on demand. This meant that content collections were not suitable for pages that update frequently. Instead, these pages tended to access the APIs directly in the frontmatter. This worked, but it led to a lot of boilerplate, and meant users didn't benefit from the simple, unified API that content loaders offer. In most cases, users tended to individually create loader libraries shared between pages.

  Live content collections ([introduced experimentally in Astro 5.10](https://astro.build/blog/live-content-collections-deep-dive/)) solve this problem by allowing you to create loaders that fetch data at runtime, rather than build time. This means that the data is always up-to-date, without needing to rebuild the site.

  #### How to use

  To use live collections, create a new `src/live.config.ts` file (alongside your `src/content.config.ts` if you have one) to define your live collections with a live content loader using the new `defineLiveCollection()` function from the `astro:content` module:

  ```ts title="src/live.config.ts"
  import { defineLiveCollection } from 'astro:content';
  import { storeLoader } from '@mystore/astro-loader';

  const products = defineLiveCollection({
    loader: storeLoader({
      apiKey: process.env.STORE_API_KEY,
      endpoint: 'https://api.mystore.com/v1',
    }),
  });

  export const collections = { products };
  ```

  You can then use the `getLiveCollection()` and `getLiveEntry()` functions to access your live data, along with error handling (since anything can happen when requesting live data!):

  ```astro
  ---
  import { getLiveCollection, getLiveEntry, render } from 'astro:content';
  // Get all products
  const { entries: allProducts, error } = await getLiveCollection('products');
  if (error) {
    // Handle error appropriately
    console.error(error.message);
  }

  // Get products with a filter (if supported by your loader)
  const { entries: electronics } = await getLiveCollection('products', { category: 'electronics' });

  // Get a single product by ID (string syntax)
  const { entry: product, error: productError } = await getLiveEntry('products', Astro.params.id);
  if (productError) {
    return Astro.redirect('/404');
  }

  // Get a single product with a custom query (if supported by your loader) using a filter object
  const { entry: productBySlug } = await getLiveEntry('products', { slug: Astro.params.slug });
  const { Content } = await render(product);
  ---

  <h1>{product.data.title}</h1>
  <Content />
  ```

  #### Upgrading from experimental live collections

  If you were using the experimental feature, you must remove the `experimental.liveContentCollections` flag from your `astro.config.*` file:

  ```diff
   export default defineConfig({
     // ...
  -  experimental: {
  -    liveContentCollections: true,
  -  },
   });
  ```

  No other changes to your project code are required as long as you have been keeping up with Astro 5.x patch releases, which contained breaking changes to this experimental feature. If you experience problems with your live collections after upgrading to Astro v6 and removing this flag, please review the [Astro CHANGELOG from 5.10.2](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#5102) onwards for any potential updates you might have missed, or follow the [current v6 documentation for live collections](https://docs.astro.build/en/guides/content-collections/).

- [#15548](https://github.com/withastro/astro/pull/15548) [`5b8f573`](https://github.com/withastro/astro/commit/5b8f5737feb1a051b7cbd5d543dd230492e5211f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new optional `embeddedLangs` prop to the `<Code />` component to support languages beyond the primary `lang`

  This allows, for example, highlighting `.vue` files with a `<script setup lang="tsx">` block correctly:

  ```astro
  ---
  import { Code } from 'astro:components';

  const code = `
  <script setup lang="tsx">
  const Text = ({ text }: { text: string }) => <div>{text}</div>;
  </script>
  
  <template>
    <Text text="hello world" />
  </template>`;
  ---

  <Code {code} lang="vue" embeddedLangs={['tsx']} />
  ```

  See the [`<Code />` component documentation](https://docs.astro.build/en/guides/syntax-highlighting/#code-) for more details.

- [#14826](https://github.com/withastro/astro/pull/14826) [`170f64e`](https://github.com/withastro/astro/commit/170f64e977290b8f9d316b5f283bd03bae33ddde) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds an option `prerenderConflictBehavior` to configure the behavior of conflicting prerendered routes

  By default, Astro warns you during the build about any conflicts between multiple dynamic routes that can result in the same output path. For example `/blog/[slug]` and `/blog/[...all]` both could try to prerender the `/blog/post-1` path. In such cases, Astro renders only the [highest priority route](https://docs.astro.build/en/guides/routing/#route-priority-order) for the conflicting path. This allows your site to build successfully, although you may discover that some pages are rendered by unexpected routes.

  With the new `prerenderConflictBehavior` configuration option, you can now configure this further:
  - `prerenderConflictBehavior: 'error'` fails the build
  - `prerenderConflictBehavior: 'warn'` (default) logs a warning and the highest-priority route wins
  - `prerenderConflictBehavior: 'ignore'` silently picks the highest-priority route when conflicts occur

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  +    prerenderConflictBehavior: 'error',
  });
  ```

- [#14946](https://github.com/withastro/astro/pull/14946) [`95c40f7`](https://github.com/withastro/astro/commit/95c40f7109ce240206c3951761a7bb439dd809cb) Thanks [@ematipico](https://github.com/ematipico)! - Removes the `experimental.csp` flag and replaces it with a new configuration option `security.csp` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#experimental-flags))

- [#15579](https://github.com/withastro/astro/pull/15579) [`08437d5`](https://github.com/withastro/astro/commit/08437d531e31b79a42333a9f7aabaa9fe646ce4f) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds two new experimental flags for a Route Caching API and further configuration-level Route Rules for controlling SSR response caching.

  Route caching gives you a platform-agnostic way to cache server-rendered responses, based on web standard cache headers. You set caching directives in your routes using `Astro.cache` (in `.astro` pages) or `context.cache` (in API routes and middleware), and Astro translates them into the appropriate headers or runtime behavior depending on your adapter. You can also define cache rules for routes declaratively in your config using `experimental.routeRules`, without modifying route code.

  This feature requires on-demand rendering. Prerendered pages are already static and do not use route caching.

  #### Getting started

  Enable the feature by configuring `experimental.cache` with a cache provider in your Astro config:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import node from '@astrojs/node';
  import { memoryCache } from 'astro/config';

  export default defineConfig({
    adapter: node({ mode: 'standalone' }),
    experimental: {
      cache: {
        provider: memoryCache(),
      },
    },
  });
  ```

  #### Using `Astro.cache` and `context.cache`

  In `.astro` pages, use `Astro.cache.set()` to control caching:

  ```astro
  ---
  // src/pages/index.astro
  Astro.cache.set({
    maxAge: 120, // Cache for 2 minutes
    swr: 60, // Serve stale for 1 minute while revalidating
    tags: ['home'], // Tag for targeted invalidation
  });
  ---

  <html><body>Cached page</body></html>
  ```

  In API routes and middleware, use `context.cache`:

  ```ts
  // src/pages/api/data.ts
  export function GET(context) {
    context.cache.set({
      maxAge: 300,
      tags: ['api', 'data'],
    });
    return Response.json({ ok: true });
  }
  ```

  #### Cache options

  `cache.set()` accepts the following options:
  - **`maxAge`** (number): Time in seconds the response is considered fresh.
  - **`swr`** (number): Stale-while-revalidate window in seconds. During this window, stale content is served while a fresh response is generated in the background.
  - **`tags`** (string[]): Cache tags for targeted invalidation. Tags accumulate across multiple `set()` calls within a request.
  - **`lastModified`** (Date): When multiple `set()` calls provide `lastModified`, the most recent date wins.
  - **`etag`** (string): Entity tag for conditional requests.

  Call `cache.set(false)` to explicitly opt out of caching for a request.

  Multiple calls to `cache.set()` within a single request are merged: scalar values use last-write-wins, `lastModified` uses most-recent-wins, and tags accumulate.

  #### Invalidation

  Purge cached entries by tag or path using `cache.invalidate()`:

  ```ts
  // Invalidate all entries tagged 'data'
  await context.cache.invalidate({ tags: ['data'] });

  // Invalidate a specific path
  await context.cache.invalidate({ path: '/api/data' });
  ```

  #### Config-level route rules

  Use `experimental.routeRules` to set default cache options for routes without modifying route code. Supports Nitro-style shortcuts for ergonomic configuration:

  ```js
  import { memoryCache } from 'astro/config';

  export default defineConfig({
    experimental: {
      cache: {
        provider: memoryCache(),
      },
      routeRules: {
        // Shortcut form (Nitro-style)
        '/api/*': { swr: 600 },

        // Full form with nested cache
        '/products/*': { cache: { maxAge: 3600, tags: ['products'] } },
      },
    },
  });
  ```

  Route patterns support static paths, dynamic parameters (`[slug]`), and rest parameters (`[...path]`). Per-route `cache.set()` calls merge with (and can override) the config-level defaults.

  You can also read the current cache state via `cache.options`:

  ```ts
  const { maxAge, swr, tags } = context.cache.options;
  ```

  #### Cache providers

  Cache behavior is determined by the configured **cache provider**. There are two types:
  - **CDN providers** set response headers (e.g. `CDN-Cache-Control`, `Cache-Tag`) and let the CDN handle caching. Astro strips these headers before sending the response to the client.
  - **Runtime providers** implement `onRequest()` to intercept and cache responses in-process, adding an `X-Astro-Cache` header (HIT/MISS/STALE) for observability.

  #### Built-in memory cache provider

  Astro includes a built-in, in-memory LRU runtime cache provider. Import `memoryCache` from `astro/config` to configure it.

  Features:
  - In-memory LRU cache with configurable max entries (default: 1000)
  - Stale-while-revalidate support
  - Tag-based and path-based invalidation
  - `X-Astro-Cache` response header: `HIT`, `MISS`, or `STALE`
  - Query parameter sorting for better hit rates (`?b=2&a=1` and `?a=1&b=2` hit the same entry)
  - Common tracking parameters (`utm_*`, `fbclid`, `gclid`, etc.) excluded from cache keys by default
  - `Vary` header support — responses that set `Vary` automatically get separate cache entries per variant
  - Configurable query parameter filtering via `query.exclude` (glob patterns) and `query.include` (allowlist)

  For more information on enabling and using this feature in your project, see the [Experimental Route Caching docs](https://docs.astro.build/en/reference/experimental-flags/route-caching/).
  For a complete overview and to give feedback on this experimental API, see the [Route Caching RFC](https://github.com/withastro/roadmap/pull/1245).

- [#15483](https://github.com/withastro/astro/pull/15483) [`7be3308`](https://github.com/withastro/astro/commit/7be3308bf4b1710a3f378ba338d09a8528e01e76) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds `streaming` option to the `createApp()` function in the Adapter API, mirroring the same functionality available when creating a new `App` instance

  An adapter's `createApp()` function now accepts `streaming` (defaults to `true`) as an option. HTML streaming breaks a document into chunks to send over the network and render on the page in order. This normally results in visitors seeing your HTML as fast as possible but factors such as network conditions and waiting for data fetches can block page rendering.

  HTML streaming helps with performance and generally provides a better visitor experience. In most cases, disabling streaming is not recommended.

  However, when you need to disable HTML streaming (e.g. your host only supports non-streamed HTML caching at the CDN level), you can opt out of the default behavior by passing `streaming: false` to `createApp()`:

  ```ts
  import { createApp } from 'astro/app/entrypoint';

  const app = createApp({ streaming: false });
  ```

  See more about [the `createApp()` function](https://docs.astro.build/en/reference/adapter-reference/#createapp) in the Adapter API reference.

### Patch Changes

- [#15423](https://github.com/withastro/astro/pull/15423) [`c5ea720`](https://github.com/withastro/astro/commit/c5ea720261a35324988147fbf69d8200e496e1d0) Thanks [@matthewp](https://github.com/matthewp)! - Improves error message when a dynamic redirect destination does not match any existing route.

  Previously, configuring a redirect like `/categories/[category]` → `/categories/[category]/1` in static output mode would fail with a misleading "getStaticPaths required" error. Now, Astro detects this early and provides a clear error explaining that the destination does not match any existing route.

- [#15167](https://github.com/withastro/astro/pull/15167) [`4fca170`](https://github.com/withastro/astro/commit/4fca1701eca1d107df43ef280cab342dfdacbb44) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an issue where CSS from unused components, when using content collections, could be incorrectly included between page navigations in development mode.

- [#15565](https://github.com/withastro/astro/pull/15565) [`30cd6db`](https://github.com/withastro/astro/commit/30cd6dbebe771efb6f71dcff7e6b44026fad6797) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the use of the Astro internal logger couldn't work with Cloudflare Vite plugin.

- [#15508](https://github.com/withastro/astro/pull/15508) [`2c6484a`](https://github.com/withastro/astro/commit/2c6484a4c34e86b8a26342a48986da26768de27b) Thanks [@KTibow](https://github.com/KTibow)! - Fixes behavior when shortcuts are used before server is ready

- [#15125](https://github.com/withastro/astro/pull/15125) [`6feb0d7`](https://github.com/withastro/astro/commit/6feb0d7bec1e333eb795ae0fc51516182a73eb2b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves JSDoc annotations for `AstroGlobal`, `AstroSharedContext` and `APIContext` types

- [#15712](https://github.com/withastro/astro/pull/15712) [`7ac43c7`](https://github.com/withastro/astro/commit/7ac43c713be0c69b8df0fdaaca1e85e022361216) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves `astro info` by supporting more operating systems when copying the information to the clipboard.

- [#15054](https://github.com/withastro/astro/pull/15054) [`22db567`](https://github.com/withastro/astro/commit/22db567d4cea7a4476271c101c452a2624b7d996) Thanks [@matthewp](https://github.com/matthewp)! - Improves zod union type error messages to show expected vs received types instead of generic "Invalid input"

- [#15064](https://github.com/withastro/astro/pull/15064) [`caf5621`](https://github.com/withastro/astro/commit/caf5621b324344fc0d46fb462c88c0d79fccca6b) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused incorrect warnings of duplicate entries to be logged by the glob loader when editing a file

- [#15801](https://github.com/withastro/astro/pull/15801) [`01db4f3`](https://github.com/withastro/astro/commit/01db4f37ddc14e2148df8390e0c0c600677a2417) Thanks [@ascorbic](https://github.com/ascorbic)! - Improves the experience of working with experimental route caching in dev mode by replacing some errors with silent no-ops, avoiding the need to write conditional logic to handle different modes

  Adds a `cache.enabled` property to `CacheLike` so libraries can check whether caching is active without try/catch.

- [#15562](https://github.com/withastro/astro/pull/15562) [`e14a51d`](https://github.com/withastro/astro/commit/e14a51d30196bad534bacb14aac7033b91aed741) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes types for the `astro:ssr-manifest` module, which was removed

- [#15542](https://github.com/withastro/astro/pull/15542) [`9760404`](https://github.com/withastro/astro/commit/97604040b73ec1d029f5d5a489aa744aaecfd173) Thanks [@rururux](https://github.com/rururux)! - Improves rendering by preserving `hidden="until-found"` value in attributes

- [#15044](https://github.com/withastro/astro/pull/15044) [`7cac71b`](https://github.com/withastro/astro/commit/7cac71b89f7462e197a69d797bdfefe6c7d15689) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes an exposed internal API of the preview server

- [#15573](https://github.com/withastro/astro/pull/15573) [`d789452`](https://github.com/withastro/astro/commit/d78945221d68ceab073f93572d87f12be0c72d47) Thanks [@matthewp](https://github.com/matthewp)! - Clear the route cache on content changes so slug pages reflect updated data during dev.

- [#15308](https://github.com/withastro/astro/pull/15308) [`89cbcfa`](https://github.com/withastro/astro/commit/89cbcfadcf2d777dc5dbd210f9f88117c0101931) Thanks [@matthewp](https://github.com/matthewp)! - Fixes styles missing in dev for prerendered pages when using Cloudflare adapter

- [#15435](https://github.com/withastro/astro/pull/15435) [`957b9fe`](https://github.com/withastro/astro/commit/957b9fe2d887a365c55c6e87f0c67c10beb60d1b) Thanks [@rururux](https://github.com/rururux)! - Improves compatibility of the built-in image endpoint with runtimes that don't support CJS dependencies correctly

- [#15640](https://github.com/withastro/astro/pull/15640) [`4c1a801`](https://github.com/withastro/astro/commit/4c1a801618b9c4a3147b683d6b4c8f35dc4bdb26) Thanks [@ematipico](https://github.com/ematipico)! - Reverts the support of Shiki with CSP. Unfortunately, after exhaustive tests, the highlighter can't be supported to cover all cases.

  Adds a warning when both Content Security Policy (CSP) and Shiki syntax highlighting are enabled, as they are incompatible due to Shiki's use of inline styles

- [#15415](https://github.com/withastro/astro/pull/15415) [`cc3c46c`](https://github.com/withastro/astro/commit/cc3c46c73774d5c4b67c3b7a68f7da5de5544ba8) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where CSP headers were incorrectly injected in the development server.

- [#15412](https://github.com/withastro/astro/pull/15412) [`c546563`](https://github.com/withastro/astro/commit/c546563f361343b2494ebfb1c06ef3101a4d083c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the `AstroAdapter` type and how legacy adapters are handled

- [#15322](https://github.com/withastro/astro/pull/15322) [`18e0980`](https://github.com/withastro/astro/commit/18e09800e459ff292f33370d4cf5f70d97bdbdb4) Thanks [@matthewp](https://github.com/matthewp)! - Prevents missing CSS when using both SSR and prerendered routes

- [#15760](https://github.com/withastro/astro/pull/15760) [`f49a27f`](https://github.com/withastro/astro/commit/f49a27fd2ac2559c06671979487f642360791a92) Thanks [@ematipico](https://github.com/ematipico)! - Fixed an issue where queued rendering wasn't correctly re-using the saved nodes.

- [#15277](https://github.com/withastro/astro/pull/15277) [`cb99214`](https://github.com/withastro/astro/commit/cb99214ebb991d1b929978f46e1b3ae68b561366) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the function `createShikiHighlighter` would always create a new Shiki highlighter instance. Now the function returns a cached version of the highlighter based on the Shiki options. This should improve the performance for sites that heavily rely on Shiki and code in their pages.

- [#15394](https://github.com/withastro/astro/pull/15394) [`5520f89`](https://github.com/withastro/astro/commit/5520f89d5df125e0c2d7fcdb3f9f0c81ff754e86) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where using the Fonts API with `netlify dev` wouldn't work because of query parameters

- [#15605](https://github.com/withastro/astro/pull/15605) [`f6473fd`](https://github.com/withastro/astro/commit/f6473fd45b74291e1a038f2f4142eb61a932d01d) Thanks [@ascorbic](https://github.com/ascorbic)! - Improves `.astro` component SSR rendering performance by up to 2x.

  This includes several optimizations to the way that Astro generates and renders components on the server. These are mostly micro-optimizations, but they add up to a significant improvement in performance. Most pages will benefit, but pages with many components will see the biggest improvement, as will pages with lots of strings (e.g. text-heavy pages with lots of HTML elements).

- [#15721](https://github.com/withastro/astro/pull/15721) [`e6e146c`](https://github.com/withastro/astro/commit/e6e146cb0ac535e21c26f6b1c3d2f65be9dbdb4c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes action route handling to return 404 for requests to prototype method names like `constructor` or `toString` used as action paths

- [#15497](https://github.com/withastro/astro/pull/15497) [`a93c81d`](https://github.com/withastro/astro/commit/a93c81de493e912aeba1d829d9ccf6997b2eb806) Thanks [@matthewp](https://github.com/matthewp)! - Fix dev reloads for content collection Markdown updates under Vite 7.

- [#15780](https://github.com/withastro/astro/pull/15780) [`e0ac125`](https://github.com/withastro/astro/commit/e0ac1250bb6db87f4c2ac79b6521b0fee0092d7a) Thanks [@ematipico](https://github.com/ematipico)! - Prevents `vite.envPrefix` misconfiguration from exposing `access: "secret"` environment variables in client-side bundles. Astro now throws a clear error at startup if any `vite.envPrefix` entry matches a variable declared with `access: "secret"` in `env.schema`.

  For example, the following configuration will throw an error for `API_SECRET` because it's defined as `secret` its name matches `['PUBLIC_', 'API_']` defined in `env.schema`:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    env: {
      schema: {
        API_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
        API_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      },
    },
    vite: {
      envPrefix: ['PUBLIC_', 'API_'],
    },
  });
  ```

- [#15514](https://github.com/withastro/astro/pull/15514) [`999a7dd`](https://github.com/withastro/astro/commit/999a7dd1f2913ea04e4f18f3557e8363edef45a8) Thanks [@veeceey](https://github.com/veeceey)! - Fixes font flash (FOUT) during ClientRouter navigation by preserving inline `<style>` elements and font preload links in the head during page transitions.

  Previously, `@font-face` declarations from the `<Font>` component were removed and re-inserted on every client-side navigation, causing the browser to re-evaluate them.

- [#15560](https://github.com/withastro/astro/pull/15560) [`170ed89`](https://github.com/withastro/astro/commit/170ed89ae2b0482ddc5a6f1244452490319ae99e) Thanks [@z0mt3c](https://github.com/z0mt3c)! - Fix X-Forwarded-Proto validation when allowedDomains includes both protocol and hostname fields. The protocol check no longer fails due to hostname mismatch against the hardcoded test URL.

- [#15704](https://github.com/withastro/astro/pull/15704) [`862d77b`](https://github.com/withastro/astro/commit/862d77bd6c3e05e20fd58293f9577ae685a9b8c9) Thanks [@umutkeltek](https://github.com/umutkeltek)! - Fixes i18n fallback middleware intercepting non-404 responses

  The fallback middleware was triggering for all responses with status >= 300, including legitimate 3xx redirects, 403 forbidden, and 5xx server errors. This broke auth flows and form submissions on localized server routes. The fallback now correctly only triggers for 404 (page not found) responses.

- [#15661](https://github.com/withastro/astro/pull/15661) [`7150a2e`](https://github.com/withastro/astro/commit/7150a2e2aa022a9a957684ad8091f85aedb243f1) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a build error when generating projects with 100k+ static routes.

- [#15580](https://github.com/withastro/astro/pull/15580) [`a92333c`](https://github.com/withastro/astro/commit/a92333cb48291008dc08afd0da9e1bb349443934) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a build error when generating projects with a large number of static routes

- [#15176](https://github.com/withastro/astro/pull/15176) [`9265546`](https://github.com/withastro/astro/commit/92655460785e4b0a9eca9bac2e493a9c989dff47) Thanks [@matthewp](https://github.com/matthewp)! - Fixes hydration for framework components inside MDX when using `Astro.slots.render()`

  Previously, when multiple framework components with `client:*` directives were passed as named slots to an Astro component in MDX, only the first slot would hydrate correctly. Subsequent slots would render their HTML but fail to include the necessary hydration scripts.

- [#15506](https://github.com/withastro/astro/pull/15506) [`074901f`](https://github.com/withastro/astro/commit/074901fe6b599e9ffc740feb1c06d4590e9da43a) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a race condition where concurrent requests to dynamic routes in the dev server could produce incorrect params.

- [#15444](https://github.com/withastro/astro/pull/15444) [`10b0422`](https://github.com/withastro/astro/commit/10b0422b89d12320da3c026e8a4728ae7265cfb8) Thanks [@AhmadYasser1](https://github.com/AhmadYasser1)! - Fixes `Astro.rewrite` returning 404 when rewriting to a URL with non-ASCII characters

  When rewriting to a path containing non-ASCII characters (e.g., `/redirected/héllo`), the route lookup compared encoded `distURL` hrefs against decoded pathnames, causing the comparison to always fail and resulting in a 404. This fix compares against the encoded pathname instead.

- [#15728](https://github.com/withastro/astro/pull/15728) [`12ca621`](https://github.com/withastro/astro/commit/12ca6213a68280293485d091e14899e7f2a4fee8) Thanks [@SvetimFM](https://github.com/SvetimFM)! - Improves internal state retention for persisted elements during view transitions, especially avoiding WebGL context loss in Safari and resets of CSS transitions and iframes in modern Chromium and Firefox browsers

- [#15279](https://github.com/withastro/astro/pull/15279) [`8983f17`](https://github.com/withastro/astro/commit/8983f17d530b63d230ffb06f7ce65476f77c60b5) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the dev server would serve files like `/README.md` from the project root when they shouldn't be accessible. A new route guard middleware now blocks direct URL access to files that exist outside of `srcDir` and `publicDir`, returning a 404 instead.

- [#15703](https://github.com/withastro/astro/pull/15703) [`829182b`](https://github.com/withastro/astro/commit/829182bbdfc307a005aea00ac8c00923f76efb08) Thanks [@matthewp](https://github.com/matthewp)! - Fixes server islands returning a 500 error in dev mode for adapters that do not set `adapterFeatures.buildOutput` (e.g. `@astrojs/netlify`)

- [#15749](https://github.com/withastro/astro/pull/15749) [`573d188`](https://github.com/withastro/astro/commit/573d188de9a7e6635f24004291c3e71e0ddc7a7a) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused `session.regenerate()` to silently lose session data

  Previously, regenerated session data was not saved under the new session ID unless `set()` was also called.

- [#15549](https://github.com/withastro/astro/pull/15549) [`be1c87e`](https://github.com/withastro/astro/commit/be1c87e40e851e1020343a3a3f04e3ec9d39d832) Thanks [@0xRozier](https://github.com/0xRozier)! - Fixes an issue where original (unoptimized) images from prerendered pages could be kept in the build output during SSR builds.

- [#15454](https://github.com/withastro/astro/pull/15454) [`b47a4e1`](https://github.com/withastro/astro/commit/b47a4e19a0b0b7e57068add94adc01c88d380fa8) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes a race condition in the content layer which could result in dropped content collection entries.

- [#15685](https://github.com/withastro/astro/pull/15685) [`1a323e5`](https://github.com/withastro/astro/commit/1a323e5c64c7c23212ed80546f593d930115d55c) Thanks [@jcayzac](https://github.com/jcayzac)! - Fix regression where SVG images in content collection `image()` fields could not be rendered as inline components. This behavior is now restored while preserving the TLA deadlock fix.

- [#15603](https://github.com/withastro/astro/pull/15603) [`5bc2b2c`](https://github.com/withastro/astro/commit/5bc2b2c2f4a9928efa16452b64729586dc79a0c7) Thanks [@0xRozier](https://github.com/0xRozier)! - Fixes a deadlock that occurred when using SVG images in content collections

- [#15385](https://github.com/withastro/astro/pull/15385) [`9e16d63`](https://github.com/withastro/astro/commit/9e16d63cdd2537c406e50d005b389ac115755e8e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes content layer loaders that use dynamic imports

  Content collection loaders can now use `await import()` and `import.meta.glob()` to dynamically import modules during build. Previously, these would fail with "Vite module runner has been closed."

- [#15565](https://github.com/withastro/astro/pull/15565) [`30cd6db`](https://github.com/withastro/astro/commit/30cd6dbebe771efb6f71dcff7e6b44026fad6797) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the use of the `Code` component would result in an unexpected error.

- [#15125](https://github.com/withastro/astro/pull/15125) [`6feb0d7`](https://github.com/withastro/astro/commit/6feb0d7bec1e333eb795ae0fc51516182a73eb2b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes remote images `Etag` header handling by disabling internal cache

- [#15317](https://github.com/withastro/astro/pull/15317) [`7e1e35a`](https://github.com/withastro/astro/commit/7e1e35a8c28dba6495f9068c35faeb01abc08a1c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `?raw` imports failing when used in both SSR and prerendered routes

- [#15809](https://github.com/withastro/astro/pull/15809) [`94b4a46`](https://github.com/withastro/astro/commit/94b4a465f12e89b018bf120c9b163fc567aa0e84) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `fit` defaults not being applied unless `layout` was also specified

- [#15563](https://github.com/withastro/astro/pull/15563) [`e959698`](https://github.com/withastro/astro/commit/e959698fedee4e548053e251d103eaeb9c6995cd) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where warnings would be logged during the build using one of the official adapters

- [#15121](https://github.com/withastro/astro/pull/15121) [`06261e0`](https://github.com/withastro/astro/commit/06261e03d55a571c6affbd7321f7e28c997d6d5d) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the Astro, with the Cloudflare integration, couldn't correctly serve certain routes in the development server.

- [#15585](https://github.com/withastro/astro/pull/15585) [`98ea30c`](https://github.com/withastro/astro/commit/98ea30c56d6d317d76e2290ed903f11961204714) Thanks [@matthewp](https://github.com/matthewp)! - Add a default body size limit for server actions to prevent oversized requests from exhausting memory.

- [#15264](https://github.com/withastro/astro/pull/15264) [`11efb05`](https://github.com/withastro/astro/commit/11efb058e85cda68f9a8e8f15a2c7edafe5a4789) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Lower the Node version requirement to allow running on Stackblitz until it supports v22

- [#15778](https://github.com/withastro/astro/pull/15778) [`4ebc1e3`](https://github.com/withastro/astro/commit/4ebc1e328ac40e892078031ed9dfecf60691fd56) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the computed `clientAddress` was incorrect in cases of a Request header with multiple values. The `clientAddress` is now also validated to contain only characters valid in IP addresses, rejecting injection payloads.

- [#15565](https://github.com/withastro/astro/pull/15565) [`30cd6db`](https://github.com/withastro/astro/commit/30cd6dbebe771efb6f71dcff7e6b44026fad6797) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the new Astro v6 development server didn't log anything when navigating the pages.

- [#15024](https://github.com/withastro/astro/pull/15024) [`22c48ba`](https://github.com/withastro/astro/commit/22c48ba6643ed7153400781ca1affb3e8dc1351a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where JSON schema generation would fail for unrepresentable types

- [#15669](https://github.com/withastro/astro/pull/15669) [`d5a888b`](https://github.com/withastro/astro/commit/d5a888ba645de356673605a0b70f9c721cf6cb3b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `cssesc` dependency

  This CommonJS dependency could sometimes cause errors because Astro is ESM-only. It is now replaced with a built-in ESM-friendly implementation.

- [#15740](https://github.com/withastro/astro/pull/15740) [`c5016fc`](https://github.com/withastro/astro/commit/c5016fc86c4928a26b49dbe144b5569d5d89ac04) Thanks [@matthewp](https://github.com/matthewp)! - Removes an escape hatch that skipped attribute escaping for URL values containing `&`, ensuring all dynamic attribute values are consistently escaped

- [#15756](https://github.com/withastro/astro/pull/15756) [`b6c64d1`](https://github.com/withastro/astro/commit/b6c64d1760ded517db37e1dd86a909959f7f619d) Thanks [@matthewp](https://github.com/matthewp)! - Hardens the dev server by validating Sec-Fetch metadata headers to restrict cross-origin subresource requests

- [#15744](https://github.com/withastro/astro/pull/15744) [`fabb710`](https://github.com/withastro/astro/commit/fabb710c2514c5a1298e002dd961a1d79686f021) Thanks [@matthewp](https://github.com/matthewp)! - Fixes cookie handling during error page rendering to ensure cookies set by middleware are consistently included in the response

- [#15776](https://github.com/withastro/astro/pull/15776) [`e9a9cc6`](https://github.com/withastro/astro/commit/e9a9cc6002e35325447856e9a3e0866f285c0638) Thanks [@matthewp](https://github.com/matthewp)! - Hardens error page response merging to ensure framing headers from the original response are not carried over to the rendered error page

- [#15759](https://github.com/withastro/astro/pull/15759) [`39ff2a5`](https://github.com/withastro/astro/commit/39ff2a565614250acae83d35bf196e0463857d9e) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `bodySizeLimit` option to the `@astrojs/node` adapter

  You can now configure a maximum allowed request body size for your Node.js standalone server. The default limit is 1 GB. Set the value in bytes, or pass `0` to disable the limit entirely:

  ```js
  import node from '@astrojs/node';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    adapter: node({
      mode: 'standalone',
      bodySizeLimit: 1024 * 1024 * 100, // 100 MB
    }),
  });
  ```

- [#15777](https://github.com/withastro/astro/pull/15777) [`02e24d9`](https://github.com/withastro/astro/commit/02e24d952de29c1c633744e7408215bedeb4d436) Thanks [@matthewp](https://github.com/matthewp)! - Fixes CSRF origin check mismatch by passing the actual server listening port to `createRequest`, ensuring the constructed URL origin includes the correct port (e.g., `http://localhost:4321` instead of `http://localhost`). Also restricts `X-Forwarded-Proto` to only be trusted when `allowedDomains` is configured.

- [#15742](https://github.com/withastro/astro/pull/15742) [`9d9699c`](https://github.com/withastro/astro/commit/9d9699c04aba7524bd3c8e1b8303691db19fa5bd) Thanks [@matthewp](https://github.com/matthewp)! - Hardens `clientAddress` resolution to respect `security.allowedDomains` for `X-Forwarded-For`, consistent with the existing handling of `X-Forwarded-Host`, `X-Forwarded-Proto`, and `X-Forwarded-Port`. The `X-Forwarded-For` header is now only used to determine `Astro.clientAddress` when the request's host has been validated against an `allowedDomains` entry. Without a matching domain, `clientAddress` falls back to the socket's remote address.

- [#15768](https://github.com/withastro/astro/pull/15768) [`6328f1a`](https://github.com/withastro/astro/commit/6328f1ac7ba84d75e2889e415537620d51af5154) Thanks [@matthewp](https://github.com/matthewp)! - Hardens internal cookie parsing to use a null-prototype object consistently for the fallback path, aligning with how the cookie library handles parsed values

- [#15125](https://github.com/withastro/astro/pull/15125) [`6feb0d7`](https://github.com/withastro/astro/commit/6feb0d7bec1e333eb795ae0fc51516182a73eb2b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes images not working in development when using setups with port forwarding

- [#15811](https://github.com/withastro/astro/pull/15811) [`2ba0db5`](https://github.com/withastro/astro/commit/2ba0db5ef78d29c816a358f88487c1e9aa87a2d8) Thanks [@ematipico](https://github.com/ematipico)! - Fixes integration-injected scripts (e.g. Alpine.js via `injectScript()`) not being loaded in the dev server when using non-runnable environment adapters like `@astrojs/cloudflare`.

- [#15208](https://github.com/withastro/astro/pull/15208) [`8dbdd8e`](https://github.com/withastro/astro/commit/8dbdd8efc12926eddbe189cf67a161bebf9fb5dd) Thanks [@matthewp](https://github.com/matthewp)! - Makes `session.driver` optional in config schema, allowing adapters to provide default drivers

  Adapters like Cloudflare, Netlify, and Node provide default session drivers, so users can now configure session options (like `ttl`) without explicitly specifying a driver.

- [#15260](https://github.com/withastro/astro/pull/15260) [`abca1eb`](https://github.com/withastro/astro/commit/abca1ebc0ed4b89b1904c58b7969f8386250f8de) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where adding new pages weren't correctly shown when using the development server.

- [#15591](https://github.com/withastro/astro/pull/15591) [`1ed07bf`](https://github.com/withastro/astro/commit/1ed07bf85c07a641c255ebea28fb633d60fca1c0) Thanks [@renovate](https://github.com/apps/renovate)! - Upgrades `devalue` to v5.6.3

- [#15137](https://github.com/withastro/astro/pull/15137) [`2f70bf1`](https://github.com/withastro/astro/commit/2f70bf14ec953cd6e813ed4e1aa0ef2245846dd0) Thanks [@matthewp](https://github.com/matthewp)! - Adds `legacy.collectionsBackwardsCompat` flag that restores v5 backwards compatibility behavior for legacy content collections - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#legacy-content-collections-backwards-compatibility))

  When enabled, this flag allows:
  - Collections defined without loaders (automatically get glob loader)
  - Collections with `type: 'content'` or `type: 'data'`
  - Config files located at `src/content/config.ts` (legacy location)
  - Legacy entry API: `entry.slug` and `entry.render()` methods
  - Path-based entry IDs instead of slug-based IDs

  ```js
  // astro.config.mjs
  export default defineConfig({
    legacy: {
      collectionsBackwardsCompat: true,
    },
  });
  ```

  This is a temporary migration helper for v6 upgrades. Migrate collections to the Content Layer API, then disable this flag.

- [#15550](https://github.com/withastro/astro/pull/15550) [`58df907`](https://github.com/withastro/astro/commit/58df9072391fbfcd703e8d791ca51b7bedefb730) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the JSDoc annotations for the `AstroAdapter` type

- [#15696](https://github.com/withastro/astro/pull/15696) [`a9fd221`](https://github.com/withastro/astro/commit/a9fd221bda99db4660c241c494b6d3225eb4e51d) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes images not working in MDX when using the Cloudflare adapter in certain cases

- [#15386](https://github.com/withastro/astro/pull/15386) [`a0234a3`](https://github.com/withastro/astro/commit/a0234a36d8407d24270e187cd6133171b938583e) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Updates `astro add cloudflare` to use the latest valid `compatibility_date` in the wrangler config, if available

- [#15036](https://github.com/withastro/astro/pull/15036) [`f125a73`](https://github.com/withastro/astro/commit/f125a73ebf395d81bf44ccfce4af63a518f6f724) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes certain aliases not working when using images in JSON files with the content layer

- [#15693](https://github.com/withastro/astro/pull/15693) [`4db2089`](https://github.com/withastro/astro/commit/4db2089a8e01cdb298c49f61817daf240ae07fa5) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes the links to Astro Docs to match the v6 structure.

- [#15093](https://github.com/withastro/astro/pull/15093) [`8d5f783`](https://github.com/withastro/astro/commit/8d5f783ad8d236c9d768a629d3b929a074276ac2) Thanks [@matthewp](https://github.com/matthewp)! - Reduces build memory by filtering routes per environment so each only builds the pages it needs

- [#15268](https://github.com/withastro/astro/pull/15268) [`54e5cc4`](https://github.com/withastro/astro/commit/54e5cc476b7d8ea8da0ddaba97ced0b789a2550a) Thanks [@rururux](https://github.com/rururux)! - fix: avoid creating unused images during build in Picture component

- [#15757](https://github.com/withastro/astro/pull/15757) [`631aaed`](https://github.com/withastro/astro/commit/631aaedce99a2233d69fc2aa369164d286f34dbc) Thanks [@matthewp](https://github.com/matthewp)! - Hardens URL pathname normalization to consistently handle backslash characters after decoding, ensuring middleware and router see the same canonical pathname

- [#15337](https://github.com/withastro/astro/pull/15337) [`7ff7b11`](https://github.com/withastro/astro/commit/7ff7b1160d2d60e40073ddc422fc7a00c59696aa) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the development server couldn't serve newly created new pages while the development server is running.

- [#15535](https://github.com/withastro/astro/pull/15535) [`dfe2e22`](https://github.com/withastro/astro/commit/dfe2e22042f92172442ab32777b3cce90685b76a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes the types of `createApp()` exported from `astro/app/entrypoint`

- [#15073](https://github.com/withastro/astro/pull/15073) [`2a39c32`](https://github.com/withastro/astro/commit/2a39c32857ad090efcfd77fb781e420f43800bc9) Thanks [@ascorbic](https://github.com/ascorbic)! - Don't log an error when there is no content config

- [#15717](https://github.com/withastro/astro/pull/15717) [`4000aaa`](https://github.com/withastro/astro/commit/4000aaa2d361cbfc9bbf280a9b0e78e6db167945) Thanks [@matthewp](https://github.com/matthewp)! - Ensures that URLs with multiple leading slashes (e.g. `//admin`) are normalized to a single slash before reaching middleware, so that pathname checks like `context.url.pathname.startsWith('/admin')` work consistently regardless of the request URL format

- [#15450](https://github.com/withastro/astro/pull/15450) [`50c9129`](https://github.com/withastro/astro/commit/50c912978cca4afbe4b3ebd11c30305d5e9c8315) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `build.serverEntry` would not be respected when using the new Adapter API

- [#15331](https://github.com/withastro/astro/pull/15331) [`4592be5`](https://github.com/withastro/astro/commit/4592be5bb7490474fe5e204f60b7131d9a79dae5) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an issue where API routes would overwrite public files during build. Public files now correctly take priority over generated routes in both dev and build modes.

- [#15414](https://github.com/withastro/astro/pull/15414) [`faedcc4`](https://github.com/withastro/astro/commit/faedcc40bccc43e27a53eee495b34448532866d6) Thanks [@sapphi-red](https://github.com/sapphi-red)! - Fixes a bug where some requests to the dev server didn't start with the leading `/`.

- [#15419](https://github.com/withastro/astro/pull/15419) [`a18d727`](https://github.com/withastro/astro/commit/a18d727fc717054df85177c8e0c3d38a5252f2da) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the `add` command could accept any arbitrary value, leading the possible command injections. Now `add` and `--add` accepts
  values that are only acceptable npmjs.org names.

- [#15507](https://github.com/withastro/astro/pull/15507) [`07f6610`](https://github.com/withastro/astro/commit/07f66101ed2850874c8a49ddf1f1609e6b1339fb) Thanks [@matthewp](https://github.com/matthewp)! - Avoid bundling SSR renderers when only API endpoints are dynamic

- [#15125](https://github.com/withastro/astro/pull/15125) [`6feb0d7`](https://github.com/withastro/astro/commit/6feb0d7bec1e333eb795ae0fc51516182a73eb2b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Reduces Astro’s install size by around 8 MB

- [#15752](https://github.com/withastro/astro/pull/15752) [`918d394`](https://github.com/withastro/astro/commit/918d3949f3b92b1ae46dadd77cfb1404869c50bd) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue where a session ID from a cookie with no matching server-side data was accepted as-is. The session now generates a new ID when the cookie value has no corresponding storage entry.

- [#15743](https://github.com/withastro/astro/pull/15743) [`3b4252a`](https://github.com/withastro/astro/commit/3b4252a82a937fccbfd433d90a93ad524a7a6f7b) Thanks [@matthewp](https://github.com/matthewp)! - Hardens config-based redirects with catch-all parameters to prevent producing protocol-relative URLs (e.g. `//example.com`) in the `Location` header

- [#15761](https://github.com/withastro/astro/pull/15761) [`8939751`](https://github.com/withastro/astro/commit/89397517830fec1d5b40e57ba1e35db1eb5fee79) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where it wasn't possible to set `experimental.queuedRendering.poolSize` to `0`.

- [#15633](https://github.com/withastro/astro/pull/15633) [`9d293c2`](https://github.com/withastro/astro/commit/9d293c21afc17fccaa55ea6c69f6403ad288ba57) Thanks [@jwoyo](https://github.com/jwoyo)! - Fixes a case where `<script>` tags from components passed as slots to server islands were not included in the response

- [#15491](https://github.com/withastro/astro/pull/15491) [`6c60b05`](https://github.com/withastro/astro/commit/6c60b05b8d6774da04567dc8b85b5f2956e9da0c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a case where setting `vite.server.allowedHosts: true` was turned into an invalid array

- [#15459](https://github.com/withastro/astro/pull/15459) [`a4406b4`](https://github.com/withastro/astro/commit/a4406b4dfbca3756983b82c37d7c74f84d2de096) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `context.csp` was logging warnings in development that should be logged in production only

- [#15125](https://github.com/withastro/astro/pull/15125) [`6feb0d7`](https://github.com/withastro/astro/commit/6feb0d7bec1e333eb795ae0fc51516182a73eb2b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Enables the ClientRouter to preserve the original hash part of the target URL during server side redirects.

- [#15133](https://github.com/withastro/astro/pull/15133) [`53b125b`](https://github.com/withastro/astro/commit/53b125b7f0886f9ca75c4b2b80e3557645fb71df) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an issue where adding or removing `<style>` tags in Astro components would not visually update styles during development without restarting the development server.

- [#15362](https://github.com/withastro/astro/pull/15362) [`dbf71c0`](https://github.com/withastro/astro/commit/dbf71c021e3adf060c34e6f268cf1b5cd480233d) Thanks [@jcayzac](https://github.com/jcayzac)! - Fixes `inferSize` being kept in the HTML attributes of the emitted `<img>` when that option is used with an image that is not remote.

- [#15421](https://github.com/withastro/astro/pull/15421) [`bf62b6f`](https://github.com/withastro/astro/commit/bf62b6fa3eb7b0562cb9390a5362b23381f07276) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Removes unintended logging

- [#15732](https://github.com/withastro/astro/pull/15732) [`2ce9e74`](https://github.com/withastro/astro/commit/2ce9e7477e38bca3e13a9b6993125c798377dd50) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates docs links to point to the stable release

- [#15718](https://github.com/withastro/astro/pull/15718) [`14f37b8`](https://github.com/withastro/astro/commit/14f37b80aa2bd086cf31feccd5016c73a09822ae) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where internal headers may leak when rendering error pages

- [#15214](https://github.com/withastro/astro/pull/15214) [`6bab8c9`](https://github.com/withastro/astro/commit/6bab8c992add3ecad7581b26f6bc28a74e5d3485) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the internal performance timers weren't correctly updated to reflect new build pipeline.

- [#15112](https://github.com/withastro/astro/pull/15112) [`5751d2b`](https://github.com/withastro/astro/commit/5751d2be14ccdcb752e11b6abdb5cdd3268a5b87) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes a Windows-specific build issue when importing an Astro component with a `<script>` tag using an import alias.

- [#15345](https://github.com/withastro/astro/pull/15345) [`840fbf9`](https://github.com/withastro/astro/commit/840fbf9e4abc7f847e23da8d67904ffde4d95fff) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an issue where `.sql` files (and other non-asset module types) were incorrectly moved to the client assets folder during SSR builds, causing "no such module" errors at runtime.

  The `ssrMoveAssets` function now reads the Vite manifest to determine which files are actual client assets (CSS and static assets like images) and only moves those, leaving server-side module files in place.

- [#15259](https://github.com/withastro/astro/pull/15259) [`8670a69`](https://github.com/withastro/astro/commit/8670a699e96fcc972d441c75e503b20e8961a71f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where styles weren't correctly reloaded when using the `@astrojs/cloudflare` adapter.

- [#15473](https://github.com/withastro/astro/pull/15473) [`d653b86`](https://github.com/withastro/astro/commit/d653b864252e0b39a3774f0e1ecf4b7b69851288) Thanks [@matthewp](https://github.com/matthewp)! - Improves Host header handling for SSR deployments behind proxies

- [#15047](https://github.com/withastro/astro/pull/15047) [`5580372`](https://github.com/withastro/astro/commit/55803724bb50c0fe4303c26f0df8f254e42b4d61) Thanks [@matthewp](https://github.com/matthewp)! - Fixes wrangler config template in `astro add cloudflare` to use correct entrypoint and compatibility date

- [#14589](https://github.com/withastro/astro/pull/14589) [`7038f07`](https://github.com/withastro/astro/commit/7038f0700898a17cb87b5a2e408480c1226a47f4) Thanks [@43081j](https://github.com/43081j)! - Improves CLI styling

- [#15586](https://github.com/withastro/astro/pull/15586) [`35bc814`](https://github.com/withastro/astro/commit/35bc81428b7fd08d8d7249c58666fc13e9609d90) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an issue where allowlists were not being enforced when handling remote images

- [#15422](https://github.com/withastro/astro/pull/15422) [`68770ef`](https://github.com/withastro/astro/commit/68770ef9e981f37a0b1b8febf76958010975add9) Thanks [@matthewp](https://github.com/matthewp)! - Upgrade to @astrojs/compiler@3.0.0-beta

- [#15205](https://github.com/withastro/astro/pull/15205) [`12adc55`](https://github.com/withastro/astro/commit/12adc5507c99fa7f315d0c78e82005524e7bbb32) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue where the `astro:page-load` event did not fire on initial page loads.

- [#15125](https://github.com/withastro/astro/pull/15125) [`6feb0d7`](https://github.com/withastro/astro/commit/6feb0d7bec1e333eb795ae0fc51516182a73eb2b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - **BREAKING CHANGE to the experimental Fonts API only**

  Changes the font format downloaded by default when using the experimental Fonts API. Additionally, adds a new `formats` configuration option to specify which font formats to download.

  Previously, Astro was opinionated about which font sources would be kept for usage, mainly keeping `woff2` and `woff` files.

  You can now specify what font formats should be downloaded (if available). Only `woff2` files are downloaded by default.

  #### What should I do?

  If you were previously relying on Astro downloading the `woff` format, you will now need to specify this explicitly with the new `formats` configuration option. Additionally, you may also specify any additional file formats to download if available:

  ```diff
  // astro.config.mjs
  import { defineConfig, fontProviders } from 'astro/config'

  export default defineConfig({
      experimental: {
          fonts: [{
              name: 'Roboto',
              cssVariable: '--font-roboto',
              provider: fontProviders.google(),
  +            formats: ['woff2', 'woff', 'otf']
          }]
      }
  })
  ```

- [#15179](https://github.com/withastro/astro/pull/15179) [`8c8aee6`](https://github.com/withastro/astro/commit/8c8aee6ddefb1918b1f00415e34d2531e287acf8) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an issue when importing using an import alias a file with a name matching a directory name.

- [#15036](https://github.com/withastro/astro/pull/15036) [`f125a73`](https://github.com/withastro/astro/commit/f125a73ebf395d81bf44ccfce4af63a518f6f724) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a vite warning log during builds when using npm

- [#15269](https://github.com/withastro/astro/pull/15269) [`6f82aae`](https://github.com/withastro/astro/commit/6f82aae24c64a059531f4b924c201fbd4c3e9180) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where `build.serverEntry` stopped working as expected.

- [#15053](https://github.com/withastro/astro/pull/15053) [`674b63f`](https://github.com/withastro/astro/commit/674b63f26d2e3b1878bcc8d770b9895357752ae9) Thanks [@matthewp](https://github.com/matthewp)! - Excludes `astro:*` and `virtual:astro:*` from client optimizeDeps in core. Needed for prefetch users since virtual modules are now in the dependency graph.

- [#15764](https://github.com/withastro/astro/pull/15764) [`44daecf`](https://github.com/withastro/astro/commit/44daecfc722cd5763a2afc4b1697169a9a0bb74e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes form actions incorrectly auto-executing during error page rendering. When an error page (e.g. 404) is rendered, form actions from the original request are no longer executed, since the full request handling pipeline is not active.

- [#15788](https://github.com/withastro/astro/pull/15788) [`a91da9f`](https://github.com/withastro/astro/commit/a91da9fe6c6bfad8cc204c0f4a35268a915a0417) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Reverts changes made to TSConfig templates

- [#15657](https://github.com/withastro/astro/pull/15657) [`cb625b6`](https://github.com/withastro/astro/commit/cb625b62596582047ec8cc4256960cc11804e931) Thanks [@qzio](https://github.com/qzio)! - Adds a new `security.actionBodySizeLimit` option to configure the maximum size of Astro Actions request bodies.

  This lets you increase the default 1 MB limit when your actions need to accept larger payloads. For example, actions that handle file uploads or large JSON payloads can now opt in to a higher limit.

  If you do not set this option, Astro continues to enforce the 1 MB default to help prevent abuse.

  ```js
  // astro.config.mjs
  export default defineConfig({
    security: {
      actionBodySizeLimit: 10 * 1024 * 1024, // set to 10 MB
    },
  });
  ```

- [#15176](https://github.com/withastro/astro/pull/15176) [`9265546`](https://github.com/withastro/astro/commit/92655460785e4b0a9eca9bac2e493a9c989dff47) Thanks [@matthewp](https://github.com/matthewp)! - Fixes scripts in components not rendering when a sibling `<Fragment slot="...">` exists but is unused

- Updated dependencies [[`bbb5811`](https://github.com/withastro/astro/commit/bbb5811eb801a42dc091bb09ea19d6cde3033795), [`4ebc1e3`](https://github.com/withastro/astro/commit/4ebc1e328ac40e892078031ed9dfecf60691fd56), [`cb99214`](https://github.com/withastro/astro/commit/cb99214ebb991d1b929978f46e1b3ae68b561366), [`80f0225`](https://github.com/withastro/astro/commit/80f022559e81b5609a69ba31c7f0d93dcb0bf74d), [`727b0a2`](https://github.com/withastro/astro/commit/727b0a205eb765f1c36f13a73dfc69e17e44df8f), [`4e7f3e8`](https://github.com/withastro/astro/commit/4e7f3e8e6849c314a0ab031ebd7f23fb982f0529), [`a164c77`](https://github.com/withastro/astro/commit/a164c77336059f2dc3e7f7fe992aa754ed145ef3), [`1fa4177`](https://github.com/withastro/astro/commit/1fa41779c458123f707940a5253dbe6e540dbf7d), [`7c55f80`](https://github.com/withastro/astro/commit/7c55f80fa1fd91f8f71ad60437f81e6c7f98f69d), [`cf6ea6b`](https://github.com/withastro/astro/commit/cf6ea6b36b67c7712395ed3f9ca19cb14ba1a013), [`6f19ecc`](https://github.com/withastro/astro/commit/6f19ecc35adfb2ddaabbba2269630f95c13f5a57), [`f94d3c5`](https://github.com/withastro/astro/commit/f94d3c5313e5a7576cf2cb316a85d68d335a188f), [`a18d727`](https://github.com/withastro/astro/commit/a18d727fc717054df85177c8e0c3d38a5252f2da), [`240c317`](https://github.com/withastro/astro/commit/240c317faab52d7f22494e9181f5d2c2c404b0bd), [`745e632`](https://github.com/withastro/astro/commit/745e632fc590e41a5701509e9cc4ed971bdddf74)]:
  - @astrojs/markdown-remark@7.0.0
  - @astrojs/internal-helpers@0.8.0

## 6.0.0-beta.20

### Major Changes

- [#15424](https://github.com/withastro/astro/pull/15424) [`33d6146`](https://github.com/withastro/astro/commit/33d6146e4872bb1e3feef0a6c0ea8e62f49f4c7e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Throws an error when `getImage()` from `astro:assets` is called on the client - ([v6 upgrade guidance](https://v6.docs.astro.build/en/guides/upgrade-to/v6/#changed-getimage-throws-when-called-on-the-client))

### Minor Changes

- [#15700](https://github.com/withastro/astro/pull/15700) [`4e7f3e8`](https://github.com/withastro/astro/commit/4e7f3e8e6849c314a0ab031ebd7f23fb982f0529) Thanks [@ocavue](https://github.com/ocavue)! - Updates the internal logic during SSR by providing additional metadata for UI framework integrations.

- [#15781](https://github.com/withastro/astro/pull/15781) [`2de969d`](https://github.com/withastro/astro/commit/2de969d1f5279d2d0f3024208146f9cd895267b6) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new `clientAddress` option to the `createContext()` function

  Providing this value gives adapter and middleware authors explicit control over the client IP address. When not provided, accessing `clientAddress` throws an error consistent with other contexts where it is not set by the adapter.

  Additionally, both of the official Netlify and Vercel adapters have been updated to provide this information in their edge middleware.

  ```js
  import { createContext } from 'astro/middleware';

  createContext({
    clientAddress: context.headers.get('x-real-ip'),
  });
  ```

- [#15755](https://github.com/withastro/astro/pull/15755) [`f9ee868`](https://github.com/withastro/astro/commit/f9ee8685dd26e9afeba3b48d41ad6714f624b12f) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `security.serverIslandBodySizeLimit` configuration option

  Server island POST endpoints now enforce a body size limit, similar to the existing `security.actionBodySizeLimit` for Actions. The new option defaults to `1048576` (1 MB) and can be configured independently.

  Requests exceeding the limit are rejected with a 413 response. You can customize the limit in your Astro config:

  ```js
  export default defineConfig({
    security: {
      serverIslandBodySizeLimit: 2097152, // 2 MB
    },
  });
  ```

### Patch Changes

- [#15712](https://github.com/withastro/astro/pull/15712) [`7ac43c7`](https://github.com/withastro/astro/commit/7ac43c713be0c69b8df0fdaaca1e85e022361216) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves `astro info` by supporting more operating systems when copying the information to the clipboard.

- [#15780](https://github.com/withastro/astro/pull/15780) [`e0ac125`](https://github.com/withastro/astro/commit/e0ac1250bb6db87f4c2ac79b6521b0fee0092d7a) Thanks [@ematipico](https://github.com/ematipico)! - Prevents `vite.envPrefix` misconfiguration from exposing `access: "secret"` environment variables in client-side bundles. Astro now throws a clear error at startup if any `vite.envPrefix` entry matches a variable declared with `access: "secret"` in `env.schema`.

  For example, the following configuration will throw an error for `API_SECRET` because it's defined as `secret` its name matches `['PUBLIC_', 'API_']` defined in `env.schema`:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    env: {
      schema: {
        API_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
        API_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      },
    },
    vite: {
      envPrefix: ['PUBLIC_', 'API_'],
    },
  });
  ```

- [#15778](https://github.com/withastro/astro/pull/15778) [`4ebc1e3`](https://github.com/withastro/astro/commit/4ebc1e328ac40e892078031ed9dfecf60691fd56) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the computed `clientAddress` was incorrect in cases of a Request header with multiple values. The `clientAddress` is now also validated to contain only characters valid in IP addresses, rejecting injection payloads.

- [#15776](https://github.com/withastro/astro/pull/15776) [`e9a9cc6`](https://github.com/withastro/astro/commit/e9a9cc6002e35325447856e9a3e0866f285c0638) Thanks [@matthewp](https://github.com/matthewp)! - Hardens error page response merging to ensure framing headers from the original response are not carried over to the rendered error page

- [#15759](https://github.com/withastro/astro/pull/15759) [`39ff2a5`](https://github.com/withastro/astro/commit/39ff2a565614250acae83d35bf196e0463857d9e) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `bodySizeLimit` option to the `@astrojs/node` adapter

  You can now configure a maximum allowed request body size for your Node.js standalone server. The default limit is 1 GB. Set the value in bytes, or pass `0` to disable the limit entirely:

  ```js
  import node from '@astrojs/node';
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    adapter: node({
      mode: 'standalone',
      bodySizeLimit: 1024 * 1024 * 100, // 100 MB
    }),
  });
  ```

- [#15777](https://github.com/withastro/astro/pull/15777) [`02e24d9`](https://github.com/withastro/astro/commit/02e24d952de29c1c633744e7408215bedeb4d436) Thanks [@matthewp](https://github.com/matthewp)! - Fixes CSRF origin check mismatch by passing the actual server listening port to `createRequest`, ensuring the constructed URL origin includes the correct port (e.g., `http://localhost:4321` instead of `http://localhost`). Also restricts `X-Forwarded-Proto` to only be trusted when `allowedDomains` is configured.

- [#15768](https://github.com/withastro/astro/pull/15768) [`6328f1a`](https://github.com/withastro/astro/commit/6328f1ac7ba84d75e2889e415537620d51af5154) Thanks [@matthewp](https://github.com/matthewp)! - Hardens internal cookie parsing to use a null-prototype object consistently for the fallback path, aligning with how the cookie library handles parsed values

- [#15757](https://github.com/withastro/astro/pull/15757) [`631aaed`](https://github.com/withastro/astro/commit/631aaedce99a2233d69fc2aa369164d286f34dbc) Thanks [@matthewp](https://github.com/matthewp)! - Hardens URL pathname normalization to consistently handle backslash characters after decoding, ensuring middleware and router see the same canonical pathname

- [#15761](https://github.com/withastro/astro/pull/15761) [`8939751`](https://github.com/withastro/astro/commit/89397517830fec1d5b40e57ba1e35db1eb5fee79) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where it wasn't possible to set `experimental.queuedRendering.poolSize` to `0`.

- [#15764](https://github.com/withastro/astro/pull/15764) [`44daecf`](https://github.com/withastro/astro/commit/44daecfc722cd5763a2afc4b1697169a9a0bb74e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes form actions incorrectly auto-executing during error page rendering. When an error page (e.g. 404) is rendered, form actions from the original request are no longer executed, since the full request handling pipeline is not active.

- [#15788](https://github.com/withastro/astro/pull/15788) [`a91da9f`](https://github.com/withastro/astro/commit/a91da9fe6c6bfad8cc204c0f4a35268a915a0417) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Reverts changes made to TSConfig templates

- Updated dependencies [[`4ebc1e3`](https://github.com/withastro/astro/commit/4ebc1e328ac40e892078031ed9dfecf60691fd56), [`4e7f3e8`](https://github.com/withastro/astro/commit/4e7f3e8e6849c314a0ab031ebd7f23fb982f0529)]:
  - @astrojs/internal-helpers@0.8.0-beta.3
  - @astrojs/markdown-remark@7.0.0-beta.11

## 6.0.0-beta.19

### Patch Changes

- [#15760](https://github.com/withastro/astro/pull/15760) [`f49a27f`](https://github.com/withastro/astro/commit/f49a27fd2ac2559c06671979487f642360791a92) Thanks [@ematipico](https://github.com/ematipico)! - Fixed an issue where queued rendering wasn't correctly re-using the saved nodes.

- [#15728](https://github.com/withastro/astro/pull/15728) [`12ca621`](https://github.com/withastro/astro/commit/12ca6213a68280293485d091e14899e7f2a4fee8) Thanks [@SvetimFM](https://github.com/SvetimFM)! - Improves internal state retention for persisted elements during view transitions, especially avoiding WebGL context loss in Safari and resets of CSS transitions and iframes in modern Chromium and Firefox browsers

- [#15756](https://github.com/withastro/astro/pull/15756) [`b6c64d1`](https://github.com/withastro/astro/commit/b6c64d1760ded517db37e1dd86a909959f7f619d) Thanks [@matthewp](https://github.com/matthewp)! - Hardens the dev server by validating Sec-Fetch metadata headers to restrict cross-origin subresource requests

- [#15414](https://github.com/withastro/astro/pull/15414) [`faedcc4`](https://github.com/withastro/astro/commit/faedcc40bccc43e27a53eee495b34448532866d6) Thanks [@sapphi-red](https://github.com/sapphi-red)! - Fixes a bug where some requests to the dev server didn't start with the leading `/`.

- Updated dependencies [[`745e632`](https://github.com/withastro/astro/commit/745e632fc590e41a5701509e9cc4ed971bdddf74)]:
  - @astrojs/internal-helpers@0.8.0-beta.2
  - @astrojs/markdown-remark@7.0.0-beta.10

## 6.0.0-beta.18

### Major Changes

- [#15668](https://github.com/withastro/astro/pull/15668) [`1118ac4`](https://github.com/withastro/astro/commit/1118ac4f299341e15061e8a4e6e8423071c4d41c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Changes TypeScript configuration - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-typescript-configuration))

- [#15726](https://github.com/withastro/astro/pull/15726) [`6f19ecc`](https://github.com/withastro/astro/commit/6f19ecc35adfb2ddaabbba2269630f95c13f5a57) Thanks [@ocavue](https://github.com/ocavue)! - Updates dependency `shiki` to v4

  Check [Shiki's upgrade guide](https://shiki.style/blog/v4).

### Minor Changes

- [#15694](https://github.com/withastro/astro/pull/15694) [`66449c9`](https://github.com/withastro/astro/commit/66449c930e73e9a58ce547b9c32635a98a310966) Thanks [@matthewp](https://github.com/matthewp)! - Adds `preserveBuildClientDir` option to adapter features

  Adapters can now opt in to preserving the client/server directory structure for static builds by setting `preserveBuildClientDir: true` in their adapter features. When enabled, static builds will output files to `build.client` instead of directly to `outDir`.

  This is useful for adapters that require a consistent directory structure regardless of the build output type, such as deploying to platforms with specific file organization requirements.

  ```js
  // my-adapter/index.js
  export default function myAdapter() {
    return {
      name: 'my-adapter',
      hooks: {
        'astro:config:done': ({ setAdapter }) => {
          setAdapter({
            name: 'my-adapter',
            adapterFeatures: {
              buildOutput: 'static',
              preserveBuildClientDir: true,
            },
          });
        },
      },
    };
  }
  ```

- [#15579](https://github.com/withastro/astro/pull/15579) [`08437d5`](https://github.com/withastro/astro/commit/08437d531e31b79a42333a9f7aabaa9fe646ce4f) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds two new experimental flags for a Route Caching API and further configuration-level Route Rules for controlling SSR response caching.

  Route caching gives you a platform-agnostic way to cache server-rendered responses, based on web standard cache headers. You set caching directives in your routes using `Astro.cache` (in `.astro` pages) or `context.cache` (in API routes and middleware), and Astro translates them into the appropriate headers or runtime behavior depending on your adapter. You can also define cache rules for routes declaratively in your config using `experimental.routeRules`, without modifying route code.

  This feature requires on-demand rendering. Prerendered pages are already static and do not use route caching.

  #### Getting started

  Enable the feature by configuring `experimental.cache` with a cache provider in your Astro config:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import node from '@astrojs/node';
  import { memoryCache } from 'astro/config';

  export default defineConfig({
    adapter: node({ mode: 'standalone' }),
    experimental: {
      cache: {
        provider: memoryCache(),
      },
    },
  });
  ```

  #### Using `Astro.cache` and `context.cache`

  In `.astro` pages, use `Astro.cache.set()` to control caching:

  ```astro
  ---
  // src/pages/index.astro
  Astro.cache.set({
    maxAge: 120, // Cache for 2 minutes
    swr: 60, // Serve stale for 1 minute while revalidating
    tags: ['home'], // Tag for targeted invalidation
  });
  ---

  <html><body>Cached page</body></html>
  ```

  In API routes and middleware, use `context.cache`:

  ```ts
  // src/pages/api/data.ts
  export function GET(context) {
    context.cache.set({
      maxAge: 300,
      tags: ['api', 'data'],
    });
    return Response.json({ ok: true });
  }
  ```

  #### Cache options

  `cache.set()` accepts the following options:
  - **`maxAge`** (number): Time in seconds the response is considered fresh.
  - **`swr`** (number): Stale-while-revalidate window in seconds. During this window, stale content is served while a fresh response is generated in the background.
  - **`tags`** (string[]): Cache tags for targeted invalidation. Tags accumulate across multiple `set()` calls within a request.
  - **`lastModified`** (Date): When multiple `set()` calls provide `lastModified`, the most recent date wins.
  - **`etag`** (string): Entity tag for conditional requests.

  Call `cache.set(false)` to explicitly opt out of caching for a request.

  Multiple calls to `cache.set()` within a single request are merged: scalar values use last-write-wins, `lastModified` uses most-recent-wins, and tags accumulate.

  #### Invalidation

  Purge cached entries by tag or path using `cache.invalidate()`:

  ```ts
  // Invalidate all entries tagged 'data'
  await context.cache.invalidate({ tags: ['data'] });

  // Invalidate a specific path
  await context.cache.invalidate({ path: '/api/data' });
  ```

  #### Config-level route rules

  Use `experimental.routeRules` to set default cache options for routes without modifying route code. Supports Nitro-style shortcuts for ergonomic configuration:

  ```js
  import { memoryCache } from 'astro/config';

  export default defineConfig({
    experimental: {
      cache: {
        provider: memoryCache(),
      },
      routeRules: {
        // Shortcut form (Nitro-style)
        '/api/*': { swr: 600 },

        // Full form with nested cache
        '/products/*': { cache: { maxAge: 3600, tags: ['products'] } },
      },
    },
  });
  ```

  Route patterns support static paths, dynamic parameters (`[slug]`), and rest parameters (`[...path]`). Per-route `cache.set()` calls merge with (and can override) the config-level defaults.

  You can also read the current cache state via `cache.options`:

  ```ts
  const { maxAge, swr, tags } = context.cache.options;
  ```

  #### Cache providers

  Cache behavior is determined by the configured **cache provider**. There are two types:
  - **CDN providers** set response headers (e.g. `CDN-Cache-Control`, `Cache-Tag`) and let the CDN handle caching. Astro strips these headers before sending the response to the client.
  - **Runtime providers** implement `onRequest()` to intercept and cache responses in-process, adding an `X-Astro-Cache` header (HIT/MISS/STALE) for observability.

  #### Built-in memory cache provider

  Astro includes a built-in, in-memory LRU runtime cache provider. Import `memoryCache` from `astro/config` to configure it.

  Features:
  - In-memory LRU cache with configurable max entries (default: 1000)
  - Stale-while-revalidate support
  - Tag-based and path-based invalidation
  - `X-Astro-Cache` response header: `HIT`, `MISS`, or `STALE`
  - Query parameter sorting for better hit rates (`?b=2&a=1` and `?a=1&b=2` hit the same entry)
  - Common tracking parameters (`utm_*`, `fbclid`, `gclid`, etc.) excluded from cache keys by default
  - `Vary` header support — responses that set `Vary` automatically get separate cache entries per variant
  - Configurable query parameter filtering via `query.exclude` (glob patterns) and `query.include` (allowlist)

  For more information on enabling and using this feature in your project, see the [Experimental Route Caching docs](https://docs.astro.build/en/reference/experimental-flags/route-caching/).
  For a complete overview and to give feedback on this experimental API, see the [Route Caching RFC](https://github.com/withastro/roadmap/pull/1245).

### Patch Changes

- [#15721](https://github.com/withastro/astro/pull/15721) [`e6e146c`](https://github.com/withastro/astro/commit/e6e146cb0ac535e21c26f6b1c3d2f65be9dbdb4c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes action route handling to return 404 for requests to prototype method names like `constructor` or `toString` used as action paths

- [#15704](https://github.com/withastro/astro/pull/15704) [`862d77b`](https://github.com/withastro/astro/commit/862d77bd6c3e05e20fd58293f9577ae685a9b8c9) Thanks [@umutkeltek](https://github.com/umutkeltek)! - Fixes i18n fallback middleware intercepting non-404 responses

  The fallback middleware was triggering for all responses with status >= 300, including legitimate 3xx redirects, 403 forbidden, and 5xx server errors. This broke auth flows and form submissions on localized server routes. The fallback now correctly only triggers for 404 (page not found) responses.

- [#15703](https://github.com/withastro/astro/pull/15703) [`829182b`](https://github.com/withastro/astro/commit/829182bbdfc307a005aea00ac8c00923f76efb08) Thanks [@matthewp](https://github.com/matthewp)! - Fixes server islands returning a 500 error in dev mode for adapters that do not set `adapterFeatures.buildOutput` (e.g. `@astrojs/netlify`)

- [#15749](https://github.com/withastro/astro/pull/15749) [`573d188`](https://github.com/withastro/astro/commit/573d188de9a7e6635f24004291c3e71e0ddc7a7a) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused `session.regenerate()` to silently lose session data

  Previously, regenerated session data was not saved under the new session ID unless `set()` was also called.

- [#15685](https://github.com/withastro/astro/pull/15685) [`1a323e5`](https://github.com/withastro/astro/commit/1a323e5c64c7c23212ed80546f593d930115d55c) Thanks [@jcayzac](https://github.com/jcayzac)! - Fix regression where SVG images in content collection `image()` fields could not be rendered as inline components. This behavior is now restored while preserving the TLA deadlock fix.

- [#15740](https://github.com/withastro/astro/pull/15740) [`c5016fc`](https://github.com/withastro/astro/commit/c5016fc86c4928a26b49dbe144b5569d5d89ac04) Thanks [@matthewp](https://github.com/matthewp)! - Removes an escape hatch that skipped attribute escaping for URL values containing `&`, ensuring all dynamic attribute values are consistently escaped

- [#15744](https://github.com/withastro/astro/pull/15744) [`fabb710`](https://github.com/withastro/astro/commit/fabb710c2514c5a1298e002dd961a1d79686f021) Thanks [@matthewp](https://github.com/matthewp)! - Fixes cookie handling during error page rendering to ensure cookies set by middleware are consistently included in the response

- [#15742](https://github.com/withastro/astro/pull/15742) [`9d9699c`](https://github.com/withastro/astro/commit/9d9699c04aba7524bd3c8e1b8303691db19fa5bd) Thanks [@matthewp](https://github.com/matthewp)! - Hardens `clientAddress` resolution to respect `security.allowedDomains` for `X-Forwarded-For`, consistent with the existing handling of `X-Forwarded-Host`, `X-Forwarded-Proto`, and `X-Forwarded-Port`. The `X-Forwarded-For` header is now only used to determine `Astro.clientAddress` when the request's host has been validated against an `allowedDomains` entry. Without a matching domain, `clientAddress` falls back to the socket's remote address.

- [#15696](https://github.com/withastro/astro/pull/15696) [`a9fd221`](https://github.com/withastro/astro/commit/a9fd221bda99db4660c241c494b6d3225eb4e51d) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes images not working in MDX when using the Cloudflare adapter in certain cases

- [#15693](https://github.com/withastro/astro/pull/15693) [`4db2089`](https://github.com/withastro/astro/commit/4db2089a8e01cdb298c49f61817daf240ae07fa5) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes the links to Astro Docs to match the v6 structure.

- [#15717](https://github.com/withastro/astro/pull/15717) [`4000aaa`](https://github.com/withastro/astro/commit/4000aaa2d361cbfc9bbf280a9b0e78e6db167945) Thanks [@matthewp](https://github.com/matthewp)! - Ensures that URLs with multiple leading slashes (e.g. `//admin`) are normalized to a single slash before reaching middleware, so that pathname checks like `context.url.pathname.startsWith('/admin')` work consistently regardless of the request URL format

- [#15752](https://github.com/withastro/astro/pull/15752) [`918d394`](https://github.com/withastro/astro/commit/918d3949f3b92b1ae46dadd77cfb1404869c50bd) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue where a session ID from a cookie with no matching server-side data was accepted as-is. The session now generates a new ID when the cookie value has no corresponding storage entry.

- [#15743](https://github.com/withastro/astro/pull/15743) [`3b4252a`](https://github.com/withastro/astro/commit/3b4252a82a937fccbfd433d90a93ad524a7a6f7b) Thanks [@matthewp](https://github.com/matthewp)! - Hardens config-based redirects with catch-all parameters to prevent producing protocol-relative URLs (e.g. `//example.com`) in the `Location` header

- [#15718](https://github.com/withastro/astro/pull/15718) [`14f37b8`](https://github.com/withastro/astro/commit/14f37b80aa2bd086cf31feccd5016c73a09822ae) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where internal headers may leak when rendering error pages

- Updated dependencies [[`6f19ecc`](https://github.com/withastro/astro/commit/6f19ecc35adfb2ddaabbba2269630f95c13f5a57), [`f94d3c5`](https://github.com/withastro/astro/commit/f94d3c5313e5a7576cf2cb316a85d68d335a188f)]:
  - @astrojs/markdown-remark@7.0.0-beta.9

## 6.0.0-beta.17

### Minor Changes

- [#15495](https://github.com/withastro/astro/pull/15495) [`5b99e90`](https://github.com/withastro/astro/commit/5b99e9077a92602f1e46e9b6eb9094bcd00c640e) Thanks [@leekeh](https://github.com/leekeh)! - Adds a new `middlewareMode` adapter feature to replace the previous `edgeMiddleware` option.

  This feature only impacts adapter authors. If your adapter supports `edgeMiddleware`, you should upgrade to the new `middlewareMode` option to specify the middleware mode for your adapter as soon as possible. The `edgeMiddleware` feature is deprecated and will be removed in a future major release.

  ```diff
  export default function createIntegration() {
    return {
      name: '@example/my-adapter',
      hooks: {
        'astro:config:done': ({ setAdapter }) => {
          setAdapter({
            name: '@example/my-adapter',
            serverEntrypoint: '@example/my-adapter/server.js',
            adapterFeatures: {
  -            edgeMiddleware: true
  +            middlewareMode: 'edge'
            }
          });
        },
      },
    };
  }
  ```

### Patch Changes

- [#15657](https://github.com/withastro/astro/pull/15657) [`cb625b6`](https://github.com/withastro/astro/commit/cb625b62596582047ec8cc4256960cc11804e931) Thanks [@qzio](https://github.com/qzio)! - Adds a new `security.actionBodySizeLimit` option to configure the maximum size of Astro Actions request bodies.

  This lets you increase the default 1 MB limit when your actions need to accept larger payloads. For example, actions that handle file uploads or large JSON payloads can now opt in to a higher limit.

  If you do not set this option, Astro continues to enforce the 1 MB default to help prevent abuse.

  ```js
  // astro.config.mjs
  export default defineConfig({
    security: {
      actionBodySizeLimit: 10 * 1024 * 1024, // set to 10 MB
    },
  });
  ```

- Updated dependencies [[`1fa4177`](https://github.com/withastro/astro/commit/1fa41779c458123f707940a5253dbe6e540dbf7d)]:
  - @astrojs/markdown-remark@7.0.0-beta.8

## 6.0.0-beta.16

### Minor Changes

- [#15646](https://github.com/withastro/astro/pull/15646) [`0dd9d00`](https://github.com/withastro/astro/commit/0dd9d00cf8be38c53217426f6b0e155a6f7c2a22) Thanks [@delucis](https://github.com/delucis)! - Removes redundant `fetchpriority` attributes from the output of Astro’s `<Image>` component

  Previously, Astro would always include `fetchpriority="auto"` on images not using the `priority` attribute.
  However, this is the default value, so specifying it is redundant. This change omits the attribute by default.

### Patch Changes

- [#15661](https://github.com/withastro/astro/pull/15661) [`7150a2e`](https://github.com/withastro/astro/commit/7150a2e2aa022a9a957684ad8091f85aedb243f1) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a build error when generating projects with 100k+ static routes.

- [#15603](https://github.com/withastro/astro/pull/15603) [`5bc2b2c`](https://github.com/withastro/astro/commit/5bc2b2c2f4a9928efa16452b64729586dc79a0c7) Thanks [@0xRozier](https://github.com/0xRozier)! - Fixes a deadlock that occurred when using SVG images in content collections

- [#15669](https://github.com/withastro/astro/pull/15669) [`d5a888b`](https://github.com/withastro/astro/commit/d5a888ba645de356673605a0b70f9c721cf6cb3b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `cssesc` dependency

  This CommonJS dependency could sometimes cause errors because Astro is ESM-only. It is now replaced with a built-in ESM-friendly implementation.

## 6.0.0-beta.15

### Minor Changes

- [#15471](https://github.com/withastro/astro/pull/15471) [`32b4302`](https://github.com/withastro/astro/commit/32b430213bbe51898b77ec2eadbacb9dfb220f75) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new experimental flag `queuedRendering` to enable a queue-based rendering engine

  The new engine is based on a two-pass process, where the first pass
  traverses the tree of components, emits an ordered queue, and then the queue is rendered.

  The new engine does not use recursion, and comes with two customizable options.

  Early benchmarks showed significant speed improvements and memory efficiency in big projects.

  #### Queue-rendered based

  The new engine can be enabled in your Astro config with `experimental.queuedRendering.enabled` set to `true`, and can be further customized with additional sub-features.

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      queuedRendering: {
        enabled: true,
      },
    },
  });
  ```

  #### Pooling

  With the new engine enabled, you now have the option to have a pool of nodes that can be saved and reused across page rendering. Node pooling has no effect when rendering pages on demand (SSR) because these rendering requests don't share memory. However, it can be very useful for performance when building static pages.

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      queuedRendering: {
        enabled: true,
        poolSize: 2000, // store up to 2k nodes to be reused across renderers
      },
    },
  });
  ```

  #### Content caching

  The new engine additionally unlocks a new `contentCache` option. This allows you to cache values of nodes during the rendering phase. This is currently a boolean feature with no further customization (e.g. size of cache) that uses sensible defaults for most large content collections:

  When disabled, the pool engine won't cache strings, but only types.

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      queuedRendering: {
        enabled: true,
        contentCache: true, // enable re-use of node values
      },
    },
  });
  ```

  For more information on enabling and using this feature in your project, see the [experimental queued rendering docs](https://docs.astro.build/en/reference/experimental-flags/queued-rendering/) for more details.

- [#15543](https://github.com/withastro/astro/pull/15543) [`d43841d`](https://github.com/withastro/astro/commit/d43841dfa8998c4dc1a510a2b120fedbd9ce77c6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `experimental.rustCompiler` flag to opt into the experimental Rust-based Astro compiler

  This experimental compiler is faster, provides better error messages, and generally has better support for modern JavaScript, TypeScript, and CSS features.

  After enabling in your Astro config, the `@astrojs/compiler-rs` package must also be installed into your project separately:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      rustCompiler: true,
    },
  });
  ```

  This new compiler is still in early development and may exhibit some differences compared to the existing Go-based compiler. Notably, this compiler is generally more strict in regard to invalid HTML syntax and may throw errors in cases where the Go-based compiler would have been more lenient. For example, unclosed tags (e.g. `<p>My paragraph`) will now result in errors.

  For more information about using this experimental feature in your project, especially regarding expected differences and limitations, please see the [experimental Rust compiler reference docs](https://docs.astro.build/en/reference/experimental-flags/rust-compiler/). To give feedback on the compiler, or to keep up with its development, see the [RFC for a new compiler for Astro](https://github.com/withastro/roadmap/discussions/1306) for more information and discussion.

### Patch Changes

- [#15565](https://github.com/withastro/astro/pull/15565) [`30cd6db`](https://github.com/withastro/astro/commit/30cd6dbebe771efb6f71dcff7e6b44026fad6797) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the use of the Astro internal logger couldn't work with Cloudflare Vite plugin.

- [#15562](https://github.com/withastro/astro/pull/15562) [`e14a51d`](https://github.com/withastro/astro/commit/e14a51d30196bad534bacb14aac7033b91aed741) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes types for the `astro:ssr-manifest` module, which was removed

- [#15435](https://github.com/withastro/astro/pull/15435) [`957b9fe`](https://github.com/withastro/astro/commit/957b9fe2d887a365c55c6e87f0c67c10beb60d1b) Thanks [@rururux](https://github.com/rururux)! - Improves compatibility of the built-in image endpoint with runtimes that don't support CJS dependencies correctly

- [#15640](https://github.com/withastro/astro/pull/15640) [`4c1a801`](https://github.com/withastro/astro/commit/4c1a801618b9c4a3147b683d6b4c8f35dc4bdb26) Thanks [@ematipico](https://github.com/ematipico)! - Reverts the support of Shiki with CSP. Unfortunately, after exhaustive tests, the highlighter can't be supported to cover all cases.

  Adds a warning when both Content Security Policy (CSP) and Shiki syntax highlighting are enabled, as they are incompatible due to Shiki's use of inline styles

- [#15605](https://github.com/withastro/astro/pull/15605) [`f6473fd`](https://github.com/withastro/astro/commit/f6473fd45b74291e1a038f2f4142eb61a932d01d) Thanks [@ascorbic](https://github.com/ascorbic)! - Improves `.astro` component SSR rendering performance by up to 2x.

  This includes several optimizations to the way that Astro generates and renders components on the server. These are mostly micro-optimizations, but they add up to a significant improvement in performance. Most pages will benefit, but pages with many components will see the biggest improvement, as will pages with lots of strings (e.g. text-heavy pages with lots of HTML elements).

- [#15514](https://github.com/withastro/astro/pull/15514) [`999a7dd`](https://github.com/withastro/astro/commit/999a7dd1f2913ea04e4f18f3557e8363edef45a8) Thanks [@veeceey](https://github.com/veeceey)! - Fixes font flash (FOUT) during ClientRouter navigation by preserving inline `<style>` elements and font preload links in the head during page transitions.

  Previously, `@font-face` declarations from the `<Font>` component were removed and re-inserted on every client-side navigation, causing the browser to re-evaluate them.

- [#15580](https://github.com/withastro/astro/pull/15580) [`a92333c`](https://github.com/withastro/astro/commit/a92333cb48291008dc08afd0da9e1bb349443934) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a build error when generating projects with a large number of static routes

- [#15549](https://github.com/withastro/astro/pull/15549) [`be1c87e`](https://github.com/withastro/astro/commit/be1c87e40e851e1020343a3a3f04e3ec9d39d832) Thanks [@0xRozier](https://github.com/0xRozier)! - Fixes an issue where original (unoptimized) images from prerendered pages could be kept in the build output during SSR builds.

- [#15565](https://github.com/withastro/astro/pull/15565) [`30cd6db`](https://github.com/withastro/astro/commit/30cd6dbebe771efb6f71dcff7e6b44026fad6797) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the use of the `Code` component would result in an unexpected error.

- [#15585](https://github.com/withastro/astro/pull/15585) [`98ea30c`](https://github.com/withastro/astro/commit/98ea30c56d6d317d76e2290ed903f11961204714) Thanks [@matthewp](https://github.com/matthewp)! - Add a default body size limit for server actions to prevent oversized requests from exhausting memory.

- [#15565](https://github.com/withastro/astro/pull/15565) [`30cd6db`](https://github.com/withastro/astro/commit/30cd6dbebe771efb6f71dcff7e6b44026fad6797) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the new Astro v6 development server didn't log anything when navigating the pages.

- [#15591](https://github.com/withastro/astro/pull/15591) [`1ed07bf`](https://github.com/withastro/astro/commit/1ed07bf85c07a641c255ebea28fb633d60fca1c0) Thanks [@renovate](https://github.com/apps/renovate)! - Upgrades `devalue` to v5.6.3

- [#15633](https://github.com/withastro/astro/pull/15633) [`9d293c2`](https://github.com/withastro/astro/commit/9d293c21afc17fccaa55ea6c69f6403ad288ba57) Thanks [@jwoyo](https://github.com/jwoyo)! - Fixes a case where `<script>` tags from components passed as slots to server islands were not included in the response

- [#15586](https://github.com/withastro/astro/pull/15586) [`35bc814`](https://github.com/withastro/astro/commit/35bc81428b7fd08d8d7249c58666fc13e9609d90) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an issue where allowlists were not being enforced when handling remote images

## 6.0.0-beta.14

### Patch Changes

- [#15573](https://github.com/withastro/astro/pull/15573) [`d789452`](https://github.com/withastro/astro/commit/d78945221d68ceab073f93572d87f12be0c72d47) Thanks [@matthewp](https://github.com/matthewp)! - Clear the route cache on content changes so slug pages reflect updated data during dev.

- [#15560](https://github.com/withastro/astro/pull/15560) [`170ed89`](https://github.com/withastro/astro/commit/170ed89ae2b0482ddc5a6f1244452490319ae99e) Thanks [@z0mt3c](https://github.com/z0mt3c)! - Fix X-Forwarded-Proto validation when allowedDomains includes both protocol and hostname fields. The protocol check no longer fails due to hostname mismatch against the hardcoded test URL.

- [#15563](https://github.com/withastro/astro/pull/15563) [`e959698`](https://github.com/withastro/astro/commit/e959698fedee4e548053e251d103eaeb9c6995cd) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where warnings would be logged during the build using one of the official adapters

## 6.0.0-beta.13

### Major Changes

- [#15451](https://github.com/withastro/astro/pull/15451) [`84d6efd`](https://github.com/withastro/astro/commit/84d6efd9f1036fdf3c29e9b786b4a96453a607ed) Thanks [@ematipico](https://github.com/ematipico)! - Changes how styles applied to code blocks are emitted to support CSP - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-how-shiki-code-block-styles-are-emitted))

### Minor Changes

- [#15529](https://github.com/withastro/astro/pull/15529) [`a509941`](https://github.com/withastro/astro/commit/a509941a7a7a1e53f402757234bb88e5503e5119) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new build-in font provider `npm` to access fonts installed as NPM packages

  You can now add web fonts specified in your `package.json` through Astro's type-safe Fonts API. The `npm` font provider allows you to add fonts either from locally installed packages in `node_modules` or from a CDN.

  Set `fontProviders.npm()` as your fonts provider along with the required `name` and `cssVariable` values, and add `options` as needed:

  ```js
  import { defineConfig, fontProviders } from 'astro/config';

  export default defineConfig({
    experimental: {
      fonts: [
        {
          name: 'Roboto',
          provider: fontProviders.npm(),
          cssVariable: '--font-roboto',
        },
      ],
    },
  });
  ```

  See the [NPM font provider reference documentation](https://docs.astro.build/en/reference/font-provider-reference/#npm) for more details.

- [#15548](https://github.com/withastro/astro/pull/15548) [`5b8f573`](https://github.com/withastro/astro/commit/5b8f5737feb1a051b7cbd5d543dd230492e5211f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new optional `embeddedLangs` prop to the `<Code />` component to support languages beyond the primary `lang`

  This allows, for example, highlighting `.vue` files with a `<script setup lang="tsx">` block correctly:

  ```astro
  ---
  import { Code } from 'astro:components';

  const code = `
  <script setup lang="tsx">
  const Text = ({ text }: { text: string }) => <div>{text}</div>;
  </script>
  
  <template>
    <Text text="hello world" />
  </template>`;
  ---

  <Code {code} lang="vue" embeddedLangs={['tsx']} />
  ```

  See the [`<Code />` component documentation](https://docs.astro.build/en/guides/syntax-highlighting/#code-) for more details.

- [#15483](https://github.com/withastro/astro/pull/15483) [`7be3308`](https://github.com/withastro/astro/commit/7be3308bf4b1710a3f378ba338d09a8528e01e76) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds `streaming` option to the `createApp()` function in the Adapter API, mirroring the same functionality available when creating a new `App` instance

  An adapter's `createApp()` function now accepts `streaming` (defaults to `true`) as an option. HTML streaming breaks a document into chunks to send over the network and render on the page in order. This normally results in visitors seeing your HTML as fast as possible but factors such as network conditions and waiting for data fetches can block page rendering.

  HTML streaming helps with performance and generally provides a better visitor experience. In most cases, disabling streaming is not recommended.

  However, when you need to disable HTML streaming (e.g. your host only supports non-streamed HTML caching at the CDN level), you can opt out of the default behavior by passing `streaming: false` to `createApp()`:

  ```ts
  import { createApp } from 'astro/app/entrypoint';

  const app = createApp({ streaming: false });
  ```

  See more about [the `createApp()` function](https://docs.astro.build/en/reference/adapter-reference/#createapp) in the Adapter API reference.

### Patch Changes

- [#15542](https://github.com/withastro/astro/pull/15542) [`9760404`](https://github.com/withastro/astro/commit/97604040b73ec1d029f5d5a489aa744aaecfd173) Thanks [@rururux](https://github.com/rururux)! - Improves rendering by preserving `hidden="until-found"` value in attributes

- [#15550](https://github.com/withastro/astro/pull/15550) [`58df907`](https://github.com/withastro/astro/commit/58df9072391fbfcd703e8d791ca51b7bedefb730) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the JSDoc annotations for the `AstroAdapter` type

- [#15507](https://github.com/withastro/astro/pull/15507) [`07f6610`](https://github.com/withastro/astro/commit/07f66101ed2850874c8a49ddf1f1609e6b1339fb) Thanks [@matthewp](https://github.com/matthewp)! - Avoid bundling SSR renderers when only API endpoints are dynamic

- [#15459](https://github.com/withastro/astro/pull/15459) [`a4406b4`](https://github.com/withastro/astro/commit/a4406b4dfbca3756983b82c37d7c74f84d2de096) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `context.csp` was logging warnings in development that should be logged in production only

- Updated dependencies [[`84d6efd`](https://github.com/withastro/astro/commit/84d6efd9f1036fdf3c29e9b786b4a96453a607ed)]:
  - @astrojs/markdown-remark@7.0.0-beta.7

## 6.0.0-beta.12

### Major Changes

- [#15535](https://github.com/withastro/astro/pull/15535) [`dfe2e22`](https://github.com/withastro/astro/commit/dfe2e22042f92172442ab32777b3cce90685b76a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `loadManifest()` and `loadApp()` from `astro/app/node` (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-loadmanifest-and-loadapp-from-astroappnode-adapter-api))

- [#15461](https://github.com/withastro/astro/pull/15461) [`9f21b24`](https://github.com/withastro/astro/commit/9f21b243d21478cdc5fb0193e05adad8e753839f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - **BREAKING CHANGE to the v6 beta Adapter API only**: renames `entryType` to `entrypointResolution` and updates possible values

  Astro 6 introduced a way to let adapters have more control over the entrypoint by passing `entryType: 'self'` to `setAdapter()`. However during beta development, the name was unclear and confusing.

  `entryType` is now renamed to `entrypointResolution` and its possible values are updated:
  - `legacy-dynamic` becomes `explicit`.
  - `self` becomes `auto`.

  If you are building an adapter with v6 beta and specifying `entryType`, update it:

  ```diff
  setAdapter({
      // ...
  -    entryType: 'legacy-dynamic'
  +    entrypointResolution: 'explicit'
  })

  setAdapter({
      // ...
  -    entryType: 'self'
  +    entrypointResolution: 'auto'
  })
  ```

- [#15461](https://github.com/withastro/astro/pull/15461) [`9f21b24`](https://github.com/withastro/astro/commit/9f21b243d21478cdc5fb0193e05adad8e753839f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `createExports()` and `start()` (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-createexports-and-start-adapter-api))

- [#15535](https://github.com/withastro/astro/pull/15535) [`dfe2e22`](https://github.com/withastro/astro/commit/dfe2e22042f92172442ab32777b3cce90685b76a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `NodeApp` from `astro/app/node` (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-nodeapp-from-astroappnode-adapter-api))

- [#15407](https://github.com/withastro/astro/pull/15407) [`aedbbd8`](https://github.com/withastro/astro/commit/aedbbd818628bed0533cdd627b73e2c5365aa17e) Thanks [@ematipico](https://github.com/ematipico)! - Changes how styles of responsive images are emitted - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-how-responsive-image-styles-are-emitted))

### Minor Changes

- [#15535](https://github.com/withastro/astro/pull/15535) [`dfe2e22`](https://github.com/withastro/astro/commit/dfe2e22042f92172442ab32777b3cce90685b76a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Exports new `createRequest()` and `writeResponse()` utilities from `astro/app/node`

  To replace the deprecated `NodeApp.createRequest()` and `NodeApp.writeResponse()` methods, the `astro/app/node` module now exposes new `createRequest()` and `writeResponse()` utilities. These can be used to convert a NodeJS `IncomingMessage` into a web-standard `Request` and stream a web-standard `Response` into a NodeJS `ServerResponse`:

  ```js
  import { createApp } from 'astro/app/entrypoint';
  import { createRequest, writeResponse } from 'astro/app/node';
  import { createServer } from 'node:http';

  const app = createApp();

  const server = createServer(async (req, res) => {
    const request = createRequest(req);
    const response = await app.render(request);
    await writeResponse(response, res);
  });
  ```

- [#15407](https://github.com/withastro/astro/pull/15407) [`aedbbd8`](https://github.com/withastro/astro/commit/aedbbd818628bed0533cdd627b73e2c5365aa17e) Thanks [@ematipico](https://github.com/ematipico)! - Adds support for responsive images when `security.csp` is enabled, out of the box.

  Astro's implementation of responsive image styles has been updated to be compatible with a configured Content Security Policy.

  Instead of, injecting style elements at runtime, Astro will now generate your styles at build time using a combination of `class=""` and `data-*` attributes. This means that your processed styles are loaded and hashed out of the box by Astro.

  If you were previously choosing between Astro's CSP feature and including responsive images on your site, you may now use them together.

### Patch Changes

- [#15508](https://github.com/withastro/astro/pull/15508) [`2c6484a`](https://github.com/withastro/astro/commit/2c6484a4c34e86b8a26342a48986da26768de27b) Thanks [@KTibow](https://github.com/KTibow)! - Fixes behavior when shortcuts are used before server is ready

- [#15497](https://github.com/withastro/astro/pull/15497) [`a93c81d`](https://github.com/withastro/astro/commit/a93c81de493e912aeba1d829d9ccf6997b2eb806) Thanks [@matthewp](https://github.com/matthewp)! - Fix dev reloads for content collection Markdown updates under Vite 7.

- [#15535](https://github.com/withastro/astro/pull/15535) [`dfe2e22`](https://github.com/withastro/astro/commit/dfe2e22042f92172442ab32777b3cce90685b76a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes the types of `createApp()` exported from `astro/app/entrypoint`

- [#15491](https://github.com/withastro/astro/pull/15491) [`6c60b05`](https://github.com/withastro/astro/commit/6c60b05b8d6774da04567dc8b85b5f2956e9da0c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a case where setting `vite.server.allowedHosts: true` was turned into an invalid array

- [#14589](https://github.com/withastro/astro/pull/14589) [`7038f07`](https://github.com/withastro/astro/commit/7038f0700898a17cb87b5a2e408480c1226a47f4) Thanks [@43081j](https://github.com/43081j)! - Improves CLI styling

## 6.0.0-beta.11

### Major Changes

- [#15180](https://github.com/withastro/astro/pull/15180) [`8780ff2`](https://github.com/withastro/astro/commit/8780ff2926d59ed196c70032d2ae274b8415655c) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for converting SVGs to raster images (PNGs, WebP, etc) to the default Sharp image service - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-svg-rasterization))

### Minor Changes

- [#15460](https://github.com/withastro/astro/pull/15460) [`ee7e53f`](https://github.com/withastro/astro/commit/ee7e53f9de2338517e149895efd26fca44ad80b6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates the Adapter API to allow providing a `serverEntrypoint` when using `entryType: 'self'`

  Astro 6 introduced a new powerful yet simple Adapter API for defining custom server entrypoints. You can now call `setAdapter()` with the `entryType: 'self'` option and specify your custom `serverEntrypoint`:

  ```js
  export function myAdapter() {
    return {
      name: 'my-adapter',
      hooks: {
        'astro:config:done': ({ setAdapter }) => {
          setAdapter({
            name: 'my-adapter',
            entryType: 'self',
            serverEntrypoint: 'my-adapter/server.js',
            supportedAstroFeatures: {
              // ...
            },
          });
        },
      },
    };
  }
  ```

  If you need further customization at the Vite level, you can omit `serverEntrypoint` and instead specify your custom server entrypoint with [`vite.build.rollupOptions.input`](https://rollupjs.org/configuration-options/#input).

### Patch Changes

- [#15454](https://github.com/withastro/astro/pull/15454) [`b47a4e1`](https://github.com/withastro/astro/commit/b47a4e19a0b0b7e57068add94adc01c88d380fa8) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes a race condition in the content layer which could result in dropped content collection entries.

- [#15450](https://github.com/withastro/astro/pull/15450) [`50c9129`](https://github.com/withastro/astro/commit/50c912978cca4afbe4b3ebd11c30305d5e9c8315) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `build.serverEntry` would not be respected when using the new Adapter API

- [#15473](https://github.com/withastro/astro/pull/15473) [`d653b86`](https://github.com/withastro/astro/commit/d653b864252e0b39a3774f0e1ecf4b7b69851288) Thanks [@matthewp](https://github.com/matthewp)! - Improves Host header handling for SSR deployments behind proxies

## 6.0.0-beta.10

### Minor Changes

- [#15231](https://github.com/withastro/astro/pull/15231) [`3928b87`](https://github.com/withastro/astro/commit/3928b879dd35fa4ec4dcf545f1610a0f0a55fdae) Thanks [@rururux](https://github.com/rururux)! - Adds a new optional `getRemoteSize()` method to the Image Service API.

  Previously, `inferRemoteSize()` had a fixed implementation that fetched the entire image to determine its dimensions.
  With this new helper function that extends `inferRemoteSize()`, you can now override or extend how remote image metadata is retrieved.

  This enables use cases such as:
  - Caching: Storing image dimensions in a database or local cache to avoid redundant network requests.
  - Provider APIs: Using a specific image provider's API (like Cloudinary or Vercel) to get dimensions without downloading the file.

  For example, you can add a simple cache layer to your existing image service:

  ```js
  const cache = new Map();

  const myService = {
    ...baseService,
    async getRemoteSize(url, imageConfig) {
      if (cache.has(url)) return cache.get(url);

      const result = await baseService.getRemoteSize(url, imageConfig);
      cache.set(url, result);
      return result;
    },
  };
  ```

  See the [Image Services API reference documentation](https://docs.astro.build/en/reference/image-service-reference/#getremotesize) for more information.

- [#15077](https://github.com/withastro/astro/pull/15077) [`a164c77`](https://github.com/withastro/astro/commit/a164c77336059f2dc3e7f7fe992aa754ed145ef3) Thanks [@matthewp](https://github.com/matthewp)! - Updates the Integration API to add `setPrerenderer()` to the `astro:build:start` hook, allowing adapters to provide custom prerendering logic.

  The new API accepts either an `AstroPrerenderer` object directly, or a factory function that receives the default prerenderer:

  ```js
  'astro:build:start': ({ setPrerenderer }) => {
    setPrerenderer((defaultPrerenderer) => ({
      name: 'my-prerenderer',
      async setup() {
        // Optional: called once before prerendering starts
      },
      async getStaticPaths() {
        // Returns array of { pathname: string, route: RouteData }
        return defaultPrerenderer.getStaticPaths();
      },
      async render(request, { routeData }) {
        // request: Request
        // routeData: RouteData
        // Returns: Response
      },
      async teardown() {
        // Optional: called after all pages are prerendered
      }
    }));
  }
  ```

  Also adds the `astro:static-paths` virtual module, which exports a `StaticPaths` class for adapters to collect all prerenderable paths from within their target runtime. This is useful when implementing a custom prerenderer that runs in a non-Node environment:

  ```js
  // In your adapter's request handler (running in target runtime)
  import { App } from 'astro/app';
  import { StaticPaths } from 'astro:static-paths';

  export function createApp(manifest) {
    const app = new App(manifest);

    return {
      async fetch(request) {
        const { pathname } = new URL(request.url);

        // Expose endpoint for prerenderer to get static paths
        if (pathname === '/__astro_static_paths') {
          const staticPaths = new StaticPaths(app);
          const paths = await staticPaths.getAll();
          return new Response(JSON.stringify({ paths }));
        }

        // Normal request handling
        return app.render(request);
      },
    };
  }
  ```

  See the [adapter reference](https://docs.astro.build/en/reference/adapter-reference/#custom-prerenderer) for more details on implementing a custom prerenderer.

- [#15345](https://github.com/withastro/astro/pull/15345) [`840fbf9`](https://github.com/withastro/astro/commit/840fbf9e4abc7f847e23da8d67904ffde4d95fff) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `emitClientAsset` function to `astro/assets/utils` for integration authors. This function allows emitting assets that will be moved to the client directory during SSR builds, useful for assets referenced in server-rendered content that need to be available on the client.

  ```ts
  import { emitClientAsset } from 'astro/assets/utils';

  // Inside a Vite plugin's transform or load hook
  const handle = emitClientAsset(this, {
    type: 'asset',
    name: 'my-image.png',
    source: imageBuffer,
  });
  ```

### Patch Changes

- [#15423](https://github.com/withastro/astro/pull/15423) [`c5ea720`](https://github.com/withastro/astro/commit/c5ea720261a35324988147fbf69d8200e496e1d0) Thanks [@matthewp](https://github.com/matthewp)! - Improves error message when a dynamic redirect destination does not match any existing route.

  Previously, configuring a redirect like `/categories/[category]` → `/categories/[category]/1` in static output mode would fail with a misleading "getStaticPaths required" error. Now, Astro detects this early and provides a clear error explaining that the destination does not match any existing route.

- [#15444](https://github.com/withastro/astro/pull/15444) [`10b0422`](https://github.com/withastro/astro/commit/10b0422b89d12320da3c026e8a4728ae7265cfb8) Thanks [@AhmadYasser1](https://github.com/AhmadYasser1)! - Fixes `Astro.rewrite` returning 404 when rewriting to a URL with non-ASCII characters

  When rewriting to a path containing non-ASCII characters (e.g., `/redirected/héllo`), the route lookup compared encoded `distURL` hrefs against decoded pathnames, causing the comparison to always fail and resulting in a 404. This fix compares against the encoded pathname instead.

- [#15419](https://github.com/withastro/astro/pull/15419) [`a18d727`](https://github.com/withastro/astro/commit/a18d727fc717054df85177c8e0c3d38a5252f2da) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the `add` command could accept any arbitrary value, leading the possible command injections. Now `add` and `--add` accepts
  values that are only acceptable npmjs.org names.

- [#15345](https://github.com/withastro/astro/pull/15345) [`840fbf9`](https://github.com/withastro/astro/commit/840fbf9e4abc7f847e23da8d67904ffde4d95fff) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an issue where `.sql` files (and other non-asset module types) were incorrectly moved to the client assets folder during SSR builds, causing "no such module" errors at runtime.

  The `ssrMoveAssets` function now reads the Vite manifest to determine which files are actual client assets (CSS and static assets like images) and only moves those, leaving server-side module files in place.

- [#15422](https://github.com/withastro/astro/pull/15422) [`68770ef`](https://github.com/withastro/astro/commit/68770ef9e981f37a0b1b8febf76958010975add9) Thanks [@matthewp](https://github.com/matthewp)! - Upgrade to @astrojs/compiler@3.0.0-beta

- Updated dependencies [[`a164c77`](https://github.com/withastro/astro/commit/a164c77336059f2dc3e7f7fe992aa754ed145ef3), [`a18d727`](https://github.com/withastro/astro/commit/a18d727fc717054df85177c8e0c3d38a5252f2da)]:
  - @astrojs/internal-helpers@0.8.0-beta.1
  - @astrojs/markdown-remark@7.0.0-beta.6

## 6.0.0-beta.9

### Patch Changes

- [#15415](https://github.com/withastro/astro/pull/15415) [`cc3c46c`](https://github.com/withastro/astro/commit/cc3c46c73774d5c4b67c3b7a68f7da5de5544ba8) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where CSP headers were incorrectly injected in the development server.

- [#15412](https://github.com/withastro/astro/pull/15412) [`c546563`](https://github.com/withastro/astro/commit/c546563f361343b2494ebfb1c06ef3101a4d083c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the `AstroAdapter` type and how legacy adapters are handled

- [#15421](https://github.com/withastro/astro/pull/15421) [`bf62b6f`](https://github.com/withastro/astro/commit/bf62b6fa3eb7b0562cb9390a5362b23381f07276) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Removes unintended logging

## 6.0.0-beta.8

### Minor Changes

- [#15258](https://github.com/withastro/astro/pull/15258) [`d339a18`](https://github.com/withastro/astro/commit/d339a182b387a7a1b0d5dd0d67a0638aaa2b4262) Thanks [@ematipico](https://github.com/ematipico)! - Stabilizes the adapter feature `experimentalStatiHeaders`. If you were using this feature in any of the supported adapters, you'll need to change the name of the flag:

  ```diff
  export default defineConfig({
    adapter: netlify({
  -    experimentalStaticHeaders: true
  +    staticHeaders: true
    })
  })
  ```

### Patch Changes

- [#15167](https://github.com/withastro/astro/pull/15167) [`4fca170`](https://github.com/withastro/astro/commit/4fca1701eca1d107df43ef280cab342dfdacbb44) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an issue where CSS from unused components, when using content collections, could be incorrectly included between page navigations in development mode.

- [#15268](https://github.com/withastro/astro/pull/15268) [`54e5cc4`](https://github.com/withastro/astro/commit/54e5cc476b7d8ea8da0ddaba97ced0b789a2550a) Thanks [@rururux](https://github.com/rururux)! - fix: avoid creating unused images during build in Picture component

- [#15133](https://github.com/withastro/astro/pull/15133) [`53b125b`](https://github.com/withastro/astro/commit/53b125b7f0886f9ca75c4b2b80e3557645fb71df) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an issue where adding or removing `<style>` tags in Astro components would not visually update styles during development without restarting the development server.

- Updated dependencies [[`80f0225`](https://github.com/withastro/astro/commit/80f022559e81b5609a69ba31c7f0d93dcb0bf74d)]:
  - @astrojs/markdown-remark@7.0.0-beta.5

## 6.0.0-beta.7

### Minor Changes

- [#14888](https://github.com/withastro/astro/pull/14888) [`4cd3fe4`](https://github.com/withastro/astro/commit/4cd3fe412bddbb0deb1383e83f3f8ae6e72596af) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Updates `astro add cloudflare` to better setup types, by adding `./worker-configuration.d.ts` to tsconfig includes and a `generate-types` script to package.json

- [#15349](https://github.com/withastro/astro/pull/15349) [`a257c4c`](https://github.com/withastro/astro/commit/a257c4c3c7f0cdc5089b522ed216401d46d214c9) Thanks [@ascorbic](https://github.com/ascorbic)! - Passes collection name to live content loaders

  Live content collection loaders now receive the collection name as part of their parameters. This is helpful for loaders that manage multiple collections or need to differentiate behavior based on the collection being accessed.

  ```ts
  export function storeLoader({ field, key }) {
    return {
      name: 'store-loader',
      loadCollection: async ({ filter, collection }) => {
        // ...
      },
      loadEntry: async ({ filter, collection }) => {
        // ...
      },
    };
  }
  ```

### Patch Changes

- [#15394](https://github.com/withastro/astro/pull/15394) [`5520f89`](https://github.com/withastro/astro/commit/5520f89d5df125e0c2d7fcdb3f9f0c81ff754e86) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where using the Fonts API with `netlify dev` wouldn't work because of query parameters

- [#15385](https://github.com/withastro/astro/pull/15385) [`9e16d63`](https://github.com/withastro/astro/commit/9e16d63cdd2537c406e50d005b389ac115755e8e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes content layer loaders that use dynamic imports

  Content collection loaders can now use `await import()` and `import.meta.glob()` to dynamically import modules during build. Previously, these would fail with "Vite module runner has been closed."

- [#15386](https://github.com/withastro/astro/pull/15386) [`a0234a3`](https://github.com/withastro/astro/commit/a0234a36d8407d24270e187cd6133171b938583e) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Updates `astro add cloudflare` to use the latest valid `compatibility_date` in the wrangler config, if available

- [#15362](https://github.com/withastro/astro/pull/15362) [`dbf71c0`](https://github.com/withastro/astro/commit/dbf71c021e3adf060c34e6f268cf1b5cd480233d) Thanks [@jcayzac](https://github.com/jcayzac)! - Fixes `inferSize` being kept in the HTML attributes of the emitted `<img>` when that option is used with an image that is not remote.

- Updated dependencies [[`240c317`](https://github.com/withastro/astro/commit/240c317faab52d7f22494e9181f5d2c2c404b0bd)]:
  - @astrojs/internal-helpers@0.8.0-beta.0
  - @astrojs/markdown-remark@7.0.0-beta.4

## 6.0.0-beta.6

### Major Changes

- [#15332](https://github.com/withastro/astro/pull/15332) [`7c55f80`](https://github.com/withastro/astro/commit/7c55f80fa1fd91f8f71ad60437f81e6c7f98f69d) Thanks [@matthewp](https://github.com/matthewp)! - Adds frontmatter parsing support to `renderMarkdown` in content loaders. When markdown content includes frontmatter, it is now extracted and available in `metadata.frontmatter`, and excluded from the HTML output. This makes `renderMarkdown` behave consistently with the `glob` loader.

  ```js
  const loader = {
    name: 'my-loader',
    load: async ({ store, renderMarkdown }) => {
      const content = `---
  title: My Post
  ---
  
  # Hello World
  `;
      const rendered = await renderMarkdown(content);
      // rendered.metadata.frontmatter is now { title: 'My Post' }
      // rendered.html contains only the content, not the frontmatter
    },
  };
  ```

### Minor Changes

- [#15291](https://github.com/withastro/astro/pull/15291) [`89b6cdd`](https://github.com/withastro/astro/commit/89b6cdd4075f5c9362291c386bb1e7c100b467a5) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `experimental.fonts` flag and replaces it with a new configuration option `fonts` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#experimental-flags))

- [#15332](https://github.com/withastro/astro/pull/15332) [`7c55f80`](https://github.com/withastro/astro/commit/7c55f80fa1fd91f8f71ad60437f81e6c7f98f69d) Thanks [@matthewp](https://github.com/matthewp)! - Adds a `fileURL` option to `renderMarkdown` in content loaders, enabling resolution of relative image paths. When provided, relative image paths in markdown will be resolved relative to the specified file URL and included in `metadata.localImagePaths`.

  ```js
  const loader = {
    name: 'my-loader',
    load: async ({ store, renderMarkdown }) => {
      const content = `
  # My Post
  
  ![Local image](./image.png)
  `;
      // Provide a fileURL to resolve relative image paths
      const fileURL = new URL('./posts/my-post.md', import.meta.url);
      const rendered = await renderMarkdown(content, { fileURL });
      // rendered.metadata.localImagePaths now contains the resolved image path
    },
  };
  ```

- [#15291](https://github.com/withastro/astro/pull/15291) [`89b6cdd`](https://github.com/withastro/astro/commit/89b6cdd4075f5c9362291c386bb1e7c100b467a5) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new Fonts API to provide first-party support for adding custom fonts in Astro.

  This feature allows you to use fonts from both your file system and several built-in supported providers (e.g. Google, Fontsource, Bunny) through a unified API. Keep your site performant thanks to sensible defaults and automatic optimizations including preloading and fallback font generation.

  To enable this feature, configure `fonts` with one or more fonts:

  ```js title="astro.config.mjs"
  import { defineConfig, fontProviders } from 'astro/config';

  export default defineConfig({
    fonts: [
      {
        provider: fontProviders.fontsource(),
        name: 'Roboto',
        cssVariable: '--font-roboto',
      },
    ],
  });
  ```

  Import and include the `<Font />` component with the required `cssVariable` property in the head of your page, usually in a dedicated `Head.astro` component or in a layout component directly:

  ```astro
  ---
  // src/layouts/Layout.astro
  import { Font } from 'astro:assets';
  ---

  <html>
    <head>
      <Font cssVariable="--font-roboto" preload />
    </head>
    <body>
      <slot />
    </body>
  </html>
  ```

  In any page rendered with that layout, including the layout component itself, you can now define styles with your font's `cssVariable` to apply your custom font.

  In the following example, the `<h1>` heading will have the custom font applied, while the paragraph `<p>` will not.

  ```astro
  ---
  // src/pages/example.astro
  import Layout from '../layouts/Layout.astro';
  ---

  <Layout>
    <h1>In a galaxy far, far away...</h1>

    <p>Custom fonts make my headings much cooler!</p>

    <style>
      h1 {
        font-family: var('--font-roboto');
      }
    </style>
  </Layout>
  ```

  Visit the updated [fonts guide](https://docs.astro.build/en/guides/fonts/) to learn more about adding custom fonts to your project.

### Patch Changes

- [#15337](https://github.com/withastro/astro/pull/15337) [`7ff7b11`](https://github.com/withastro/astro/commit/7ff7b1160d2d60e40073ddc422fc7a00c59696aa) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the development server couldn't serve newly created new pages while the development server is running.

- [#15331](https://github.com/withastro/astro/pull/15331) [`4592be5`](https://github.com/withastro/astro/commit/4592be5bb7490474fe5e204f60b7131d9a79dae5) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an issue where API routes would overwrite public files during build. Public files now correctly take priority over generated routes in both dev and build modes.

- Updated dependencies [[`7c55f80`](https://github.com/withastro/astro/commit/7c55f80fa1fd91f8f71ad60437f81e6c7f98f69d)]:
  - @astrojs/markdown-remark@7.0.0-beta.3

## 6.0.0-beta.5

### Patch Changes

- [#15322](https://github.com/withastro/astro/pull/15322) [`18e0980`](https://github.com/withastro/astro/commit/18e09800e459ff292f33370d4cf5f70d97bdbdb4) Thanks [@matthewp](https://github.com/matthewp)! - Prevents missing CSS when using both SSR and prerendered routes

- [#15317](https://github.com/withastro/astro/pull/15317) [`7e1e35a`](https://github.com/withastro/astro/commit/7e1e35a8c28dba6495f9068c35faeb01abc08a1c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `?raw` imports failing when used in both SSR and prerendered routes

## 6.0.0-beta.4

### Patch Changes

- [#15308](https://github.com/withastro/astro/pull/15308) [`89cbcfa`](https://github.com/withastro/astro/commit/89cbcfadcf2d777dc5dbd210f9f88117c0101931) Thanks [@matthewp](https://github.com/matthewp)! - Fixes styles missing in dev for prerendered pages when using Cloudflare adapter

- [#15279](https://github.com/withastro/astro/pull/15279) [`8983f17`](https://github.com/withastro/astro/commit/8983f17d530b63d230ffb06f7ce65476f77c60b5) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the dev server would serve files like `/README.md` from the project root when they shouldn't be accessible. A new route guard middleware now blocks direct URL access to files that exist outside of `srcDir` and `publicDir`, returning a 404 instead.

## 6.0.0-beta.3

### Patch Changes

- [#15277](https://github.com/withastro/astro/pull/15277) [`cb99214`](https://github.com/withastro/astro/commit/cb99214ebb991d1b929978f46e1b3ae68b561366) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the function `createShikiHighlighter` would always create a new Shiki highlighter instance. Now the function returns a cached version of the highlighter based on the Shiki options. This should improve the performance for sites that heavily rely on Shiki and code in their pages.

- [#15264](https://github.com/withastro/astro/pull/15264) [`11efb05`](https://github.com/withastro/astro/commit/11efb058e85cda68f9a8e8f15a2c7edafe5a4789) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Lower the Node version requirement to allow running on Stackblitz until it supports v22

- Updated dependencies [[`cb99214`](https://github.com/withastro/astro/commit/cb99214ebb991d1b929978f46e1b3ae68b561366)]:
  - @astrojs/markdown-remark@7.0.0-beta.2

## 6.0.0-beta.2

### Major Changes

- [#15192](https://github.com/withastro/astro/pull/15192) [`ada2808`](https://github.com/withastro/astro/commit/ada2808a23fc70ea1f1663f3e1b69c6b735251e5) Thanks [@gameroman](https://github.com/gameroman)! - Removes support for CommonJS config files - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-support-for-commonjs-config-files))

- [#15266](https://github.com/withastro/astro/pull/15266) [`f7c9365`](https://github.com/withastro/astro/commit/f7c9365d92b2196d4ba6cffd01b01967ca73728c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Allows `Astro.csp` and `context.csp` to be undefined instead of throwing errors when `csp: true` is not configured

  When using the experimental Content Security Policy feature in Astro 5.x, `context.csp` was always defined but would throw if `experimental.csp` was not enabled in the Astro config.

  For the stable version of this API in Astro 6, `context.csp` can now be undefined if CSP is not enabled and its methods will never throw.

  #### What should I do?

  If you were using experimental CSP runtime utilities, you must now access methods conditionally:

  ```diff
  -Astro.csp.insertDirective("default-src 'self'");
  +Astro.csp?.insertDirective("default-src 'self'");
  ```

### Patch Changes

- [#15208](https://github.com/withastro/astro/pull/15208) [`8dbdd8e`](https://github.com/withastro/astro/commit/8dbdd8efc12926eddbe189cf67a161bebf9fb5dd) Thanks [@matthewp](https://github.com/matthewp)! - Makes `session.driver` optional in config schema, allowing adapters to provide default drivers

  Adapters like Cloudflare, Netlify, and Node provide default session drivers, so users can now configure session options (like `ttl`) without explicitly specifying a driver.

- [#15260](https://github.com/withastro/astro/pull/15260) [`abca1eb`](https://github.com/withastro/astro/commit/abca1ebc0ed4b89b1904c58b7969f8386250f8de) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where adding new pages weren't correctly shown when using the development server.

- [#15214](https://github.com/withastro/astro/pull/15214) [`6bab8c9`](https://github.com/withastro/astro/commit/6bab8c992add3ecad7581b26f6bc28a74e5d3485) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the internal performance timers weren't correctly updated to reflect new build pipeline.

- [#15259](https://github.com/withastro/astro/pull/15259) [`8670a69`](https://github.com/withastro/astro/commit/8670a699e96fcc972d441c75e503b20e8961a71f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where styles weren't correctly reloaded when using the `@astrojs/cloudflare` adapter.

- [#15205](https://github.com/withastro/astro/pull/15205) [`12adc55`](https://github.com/withastro/astro/commit/12adc5507c99fa7f315d0c78e82005524e7bbb32) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue where the `astro:page-load` event did not fire on initial page loads.

- [#15269](https://github.com/withastro/astro/pull/15269) [`6f82aae`](https://github.com/withastro/astro/commit/6f82aae24c64a059531f4b924c201fbd4c3e9180) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where `build.serverEntry` stopped working as expected.

## 6.0.0-beta.1

### Patch Changes

- Updated dependencies [[`bbb5811`](https://github.com/withastro/astro/commit/bbb5811eb801a42dc091bb09ea19d6cde3033795)]:
  - @astrojs/markdown-remark@7.0.0-beta.1

## 6.0.0-beta.0

### Patch Changes

- [#15125](https://github.com/withastro/astro/pull/15125) [`6feb0d7`](https://github.com/withastro/astro/commit/6feb0d7bec1e333eb795ae0fc51516182a73eb2b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves JSDoc annotations for `AstroGlobal`, `AstroSharedContext` and `APIContext` types

- [#15176](https://github.com/withastro/astro/pull/15176) [`9265546`](https://github.com/withastro/astro/commit/92655460785e4b0a9eca9bac2e493a9c989dff47) Thanks [@matthewp](https://github.com/matthewp)! - Fixes hydration for framework components inside MDX when using `Astro.slots.render()`

  Previously, when multiple framework components with `client:*` directives were passed as named slots to an Astro component in MDX, only the first slot would hydrate correctly. Subsequent slots would render their HTML but fail to include the necessary hydration scripts.

- [#15125](https://github.com/withastro/astro/pull/15125) [`6feb0d7`](https://github.com/withastro/astro/commit/6feb0d7bec1e333eb795ae0fc51516182a73eb2b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes remote images `Etag` header handling by disabling internal cache

- [#15121](https://github.com/withastro/astro/pull/15121) [`06261e0`](https://github.com/withastro/astro/commit/06261e03d55a571c6affbd7321f7e28c997d6d5d) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the Astro, with the Cloudflare integration, couldn't correctly serve certain routes in the development server.

- [#15125](https://github.com/withastro/astro/pull/15125) [`6feb0d7`](https://github.com/withastro/astro/commit/6feb0d7bec1e333eb795ae0fc51516182a73eb2b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes images not working in development when using setups with port forwarding

- [#15137](https://github.com/withastro/astro/pull/15137) [`2f70bf1`](https://github.com/withastro/astro/commit/2f70bf14ec953cd6e813ed4e1aa0ef2245846dd0) Thanks [@matthewp](https://github.com/matthewp)! - Adds `legacy.collectionsBackwardsCompat` flag that restores v5 backwards compatibility behavior for legacy content collections - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#legacy-content-collections-backwards-compatibility))

  When enabled, this flag allows:
  - Collections defined without loaders (automatically get glob loader)
  - Collections with `type: 'content'` or `type: 'data'`
  - Config files located at `src/content/config.ts` (legacy location)
  - Legacy entry API: `entry.slug` and `entry.render()` methods
  - Path-based entry IDs instead of slug-based IDs

  ```js
  // astro.config.mjs
  export default defineConfig({
    legacy: {
      collectionsBackwardsCompat: true,
    },
  });
  ```

  This is a temporary migration helper for v6 upgrades. Migrate collections to the Content Layer API, then disable this flag.

- [#15179](https://github.com/withastro/astro/pull/15179) [`8c8aee6`](https://github.com/withastro/astro/commit/8c8aee6ddefb1918b1f00415e34d2531e287acf8) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an issue when importing using an import alias a file with a name matching a directory name.

- [#15176](https://github.com/withastro/astro/pull/15176) [`9265546`](https://github.com/withastro/astro/commit/92655460785e4b0a9eca9bac2e493a9c989dff47) Thanks [@matthewp](https://github.com/matthewp)! - Fixes scripts in components not rendering when a sibling `<Fragment slot="...">` exists but is unused

## 6.0.0-alpha.5

### Patch Changes

- [#15064](https://github.com/withastro/astro/pull/15064) [`caf5621`](https://github.com/withastro/astro/commit/caf5621b324344fc0d46fb462c88c0d79fccca6b) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused incorrect warnings of duplicate entries to be logged by the glob loader when editing a file

- [#15093](https://github.com/withastro/astro/pull/15093) [`8d5f783`](https://github.com/withastro/astro/commit/8d5f783ad8d236c9d768a629d3b929a074276ac2) Thanks [@matthewp](https://github.com/matthewp)! - Reduces build memory by filtering routes per environment so each only builds the pages it needs

- [#15073](https://github.com/withastro/astro/pull/15073) [`2a39c32`](https://github.com/withastro/astro/commit/2a39c32857ad090efcfd77fb781e420f43800bc9) Thanks [@ascorbic](https://github.com/ascorbic)! - Don't log an error when there is no content config

- [#15112](https://github.com/withastro/astro/pull/15112) [`5751d2b`](https://github.com/withastro/astro/commit/5751d2be14ccdcb752e11b6abdb5cdd3268a5b87) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes a Windows-specific build issue when importing an Astro component with a `<script>` tag using an import alias.

## 6.0.0-alpha.4

### Major Changes

- [#15049](https://github.com/withastro/astro/pull/15049) [`beddfeb`](https://github.com/withastro/astro/commit/beddfeb31e807cb472a43fa56c69f85dbadc9604) Thanks [@Ntale3](https://github.com/Ntale3)! - Removes the ability to render Astro components in Vitest client environments - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-astro-components-cannot-be-rendered-in-vitest-client-environments-container-api))

### Patch Changes

- [#15054](https://github.com/withastro/astro/pull/15054) [`22db567`](https://github.com/withastro/astro/commit/22db567d4cea7a4476271c101c452a2624b7d996) Thanks [@matthewp](https://github.com/matthewp)! - Improves zod union type error messages to show expected vs received types instead of generic "Invalid input"

## 6.0.0-alpha.3

### Major Changes

- [#15006](https://github.com/withastro/astro/pull/15006) [`f361730`](https://github.com/withastro/astro/commit/f361730bc820c01a2ec3e508ac940be8077d8c04) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes session `test` driver - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-session-test-driver))

- [#15006](https://github.com/withastro/astro/pull/15006) [`f361730`](https://github.com/withastro/astro/commit/f361730bc820c01a2ec3e508ac940be8077d8c04) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates session driver string signature - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-session-driver-string-signature))

### Minor Changes

- [#15006](https://github.com/withastro/astro/pull/15006) [`f361730`](https://github.com/withastro/astro/commit/f361730bc820c01a2ec3e508ac940be8077d8c04) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds new session driver object shape

  For greater flexibility and improved consistency with other Astro code, session drivers are now specified as an object:

  ```diff
  -import { defineConfig } from 'astro/config'
  +import { defineConfig, sessionDrivers } from 'astro/config'

  export default defineConfig({
    session: {
  -    driver: 'redis',
  -    options: {
  -      url: process.env.REDIS_URL
  -    },
  +    driver: sessionDrivers.redis({
  +      url: process.env.REDIS_URL
  +    }),
    }
  })
  ```

  Specifying the session driver as a string has been deprecated, but will continue to work until this feature is removed completely in a future major version. The object shape is the current recommended and documented way to configure a session driver.

### Patch Changes

- [#15044](https://github.com/withastro/astro/pull/15044) [`7cac71b`](https://github.com/withastro/astro/commit/7cac71b89f7462e197a69d797bdfefe6c7d15689) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes an exposed internal API of the preview server

- [#15047](https://github.com/withastro/astro/pull/15047) [`5580372`](https://github.com/withastro/astro/commit/55803724bb50c0fe4303c26f0df8f254e42b4d61) Thanks [@matthewp](https://github.com/matthewp)! - Fixes wrangler config template in `astro add cloudflare` to use correct entrypoint and compatibility date

- [#15053](https://github.com/withastro/astro/pull/15053) [`674b63f`](https://github.com/withastro/astro/commit/674b63f26d2e3b1878bcc8d770b9895357752ae9) Thanks [@matthewp](https://github.com/matthewp)! - Excludes `astro:*` and `virtual:astro:*` from client optimizeDeps in core. Needed for prefetch users since virtual modules are now in the dependency graph.

## 6.0.0-alpha.2

### Patch Changes

- [#15024](https://github.com/withastro/astro/pull/15024) [`22c48ba`](https://github.com/withastro/astro/commit/22c48ba6643ed7153400781ca1affb3e8dc1351a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where JSON schema generation would fail for unrepresentable types

- [#15036](https://github.com/withastro/astro/pull/15036) [`f125a73`](https://github.com/withastro/astro/commit/f125a73ebf395d81bf44ccfce4af63a518f6f724) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes certain aliases not working when using images in JSON files with the content layer

- [#15036](https://github.com/withastro/astro/pull/15036) [`f125a73`](https://github.com/withastro/astro/commit/f125a73ebf395d81bf44ccfce4af63a518f6f724) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a vite warning log during builds when using npm

## 6.0.0-alpha.1

### Major Changes

- [#14956](https://github.com/withastro/astro/pull/14956) [`0ff51df`](https://github.com/withastro/astro/commit/0ff51dfa3c6c615af54228e159f324034472b1a2) Thanks [@matthewp](https://github.com/matthewp)! - Astro v6.0 upgrades to Zod v4 for schema validation - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#zod-4))

- [#14759](https://github.com/withastro/astro/pull/14759) [`d7889f7`](https://github.com/withastro/astro/commit/d7889f768a4d27e8c4ad3a0022099d19145a7d58) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates how schema types are inferred for content loaders with schemas (Loader API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-schema-types-are-inferred-instead-of-generated-content-loader-api))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Removes support for routes with percent-encoded percent signs (e.g. `%25`) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-percent-encoding-in-routes))

- [#14759](https://github.com/withastro/astro/pull/14759) [`d7889f7`](https://github.com/withastro/astro/commit/d7889f768a4d27e8c4ad3a0022099d19145a7d58) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the option to define dynamic schemas in content loaders as functions and adds a new equivalent `createSchema()` property (Loader API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-schema-function-signature-content-loader-api))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Removes `RouteData.generate` from the Integration API - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-routedatagenerate-adapter-api))

- [#14989](https://github.com/withastro/astro/pull/14989) [`73e8232`](https://github.com/withastro/astro/commit/73e823201cc5bdd6ccab14c07ff0dca5117436ad) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates exposed `astro:transitions` internals - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-exposed-astrotransitions-internals))

- [#14758](https://github.com/withastro/astro/pull/14758) [`010f773`](https://github.com/withastro/astro/commit/010f7731becbaaba347da21ef07b8a410e31442a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `setManifestData` method from `App` and `NodeApp` (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-appsetmanifestdata-adapter-api))

- [#14826](https://github.com/withastro/astro/pull/14826) [`170f64e`](https://github.com/withastro/astro/commit/170f64e977290b8f9d316b5f283bd03bae33ddde) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `experimental.failOnPrerenderConflict` flag and replaces it with a new configuration option `prerenderConflictBehavior` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#experimental-flags))

- [#14923](https://github.com/withastro/astro/pull/14923) [`95a1969`](https://github.com/withastro/astro/commit/95a1969a05cc9c15f16dcf2177532882bb392581) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `astro:schema` and `z` from `astro:content` in favor of `astro/zod` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-astroschema-and-z-from-astrocontent))

- [#14844](https://github.com/withastro/astro/pull/14844) [`8d43b1d`](https://github.com/withastro/astro/commit/8d43b1d678eed5be85f99b939d55346824c03cb5) Thanks [@trueberryless](https://github.com/trueberryless)! - Removes exposed `astro:actions` internals - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-exposed-astroactions-internals))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Changes the shape of `SSRManifest` properties and adds several new required properties in the Adapter API - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-ssrmanifest-interface-structure-adapter-api))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Changes integration hooks and HMR access patterns in the Integration API - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-integration-hooks-and-hmr-access-patterns-integration-api))

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Removes the unused `astro:ssr-manifest` virtual module - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-astrossr-manifest-virtual-module-integration-api))

### Minor Changes

- [#14306](https://github.com/withastro/astro/pull/14306) [`141c4a2`](https://github.com/withastro/astro/commit/141c4a26419fe5bb4341953ea5a0a861d9b398c0) Thanks [@ematipico](https://github.com/ematipico)! - Adds new optional properties to `setAdapter()` for adapter entrypoint handling in the Adapter API

  **Changes:**
  - New optional properties:
    - `entryType?: 'self' | 'legacy-dynamic'` - determines if the adapter provides its own entrypoint (`'self'`) or if Astro constructs one (`'legacy-dynamic'`, default)

  **Migration:** Adapter authors can optionally add these properties to support custom dev entrypoints. If not specified, adapters will use the legacy behavior.

- [#14826](https://github.com/withastro/astro/pull/14826) [`170f64e`](https://github.com/withastro/astro/commit/170f64e977290b8f9d316b5f283bd03bae33ddde) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds an option `prerenderConflictBehavior` to configure the behavior of conflicting prerendered routes

  By default, Astro warns you during the build about any conflicts between multiple dynamic routes that can result in the same output path. For example `/blog/[slug]` and `/blog/[...all]` both could try to prerender the `/blog/post-1` path. In such cases, Astro renders only the [highest priority route](https://docs.astro.build/en/guides/routing/#route-priority-order) for the conflicting path. This allows your site to build successfully, although you may discover that some pages are rendered by unexpected routes.

  With the new `prerenderConflictBehavior` configuration option, you can now configure this further:
  - `prerenderConflictBehavior: 'error'` fails the build
  - `prerenderConflictBehavior: 'warn'` (default) logs a warning and the highest-priority route wins
  - `prerenderConflictBehavior: 'ignore'` silently picks the highest-priority route when conflicts occur

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  +    prerenderConflictBehavior: 'error',
  });
  ```

- [#14946](https://github.com/withastro/astro/pull/14946) [`95c40f7`](https://github.com/withastro/astro/commit/95c40f7109ce240206c3951761a7bb439dd809cb) Thanks [@ematipico](https://github.com/ematipico)! - Removes the `experimental.csp` flag and replaces it with a new configuration option `security.csp` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#experimental-flags))

## 6.0.0-alpha.0

### Major Changes

- [#14446](https://github.com/withastro/astro/pull/14446) [`ece667a`](https://github.com/withastro/astro/commit/ece667a737a96c8bfea2702de7207bed0842b37c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes `entryPoints` on `astro:build:ssr` hook (Integration API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-entrypoints-on-astrobuildssr-hook-integration-api))

- [#14426](https://github.com/withastro/astro/pull/14426) [`861b9cc`](https://github.com/withastro/astro/commit/861b9cc770a05d9fcfcb2f1f442a3ba41e94b510) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the deprecated `emitESMImage()` function - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-emitesmimage))

- [#14446](https://github.com/withastro/astro/pull/14446) [`ece667a`](https://github.com/withastro/astro/commit/ece667a737a96c8bfea2702de7207bed0842b37c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes `routes` on `astro:build:done` hook (Integration API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-routes-on-astrobuilddone-hook-integration-api))

- [#14462](https://github.com/withastro/astro/pull/14462) [`9fdfd4c`](https://github.com/withastro/astro/commit/9fdfd4c620313827e65664632a9c9cb435ad07ca) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the old `app.render()` signature (Adapter API) - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-old-apprender-signature-adapter-api))

- [#14462](https://github.com/withastro/astro/pull/14462) [`9fdfd4c`](https://github.com/withastro/astro/commit/9fdfd4c620313827e65664632a9c9cb435ad07ca) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes `prefetch()` `with` option - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-prefetch-with-option))

- [#14432](https://github.com/withastro/astro/pull/14432) [`b1d87ec`](https://github.com/withastro/astro/commit/b1d87ec3bc2fbe214437990e871df93909d18f62) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `Astro` in `getStaticPaths()` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-astro-in-getstaticpaths))

- [#14457](https://github.com/withastro/astro/pull/14457) [`049da87`](https://github.com/withastro/astro/commit/049da87cb7ce1828f3025062ce079dbf132f5b86) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates trailing slash behavior of endpoint URLs - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-endpoints-with-a-file-extension-cannot-be-accessed-with-a-trailing-slash))

- [#14494](https://github.com/withastro/astro/pull/14494) [`727b0a2`](https://github.com/withastro/astro/commit/727b0a205eb765f1c36f13a73dfc69e17e44df8f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates Markdown heading ID generation - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-markdown-heading-id-generation))

- [#14461](https://github.com/withastro/astro/pull/14461) [`55a1a91`](https://github.com/withastro/astro/commit/55a1a911aa4e0d38191f8cb9464ffd58f3eb7608) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Deprecates `import.meta.env.ASSETS_PREFIX` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-importmetaenvassets_prefix))

- [#14586](https://github.com/withastro/astro/pull/14586) [`669ca5b`](https://github.com/withastro/astro/commit/669ca5b0199d9933f54c76448de9ec5a9f13c430) Thanks [@ocavue](https://github.com/ocavue)! - Changes the values allowed in `params` returned by `getStaticPaths()` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-getstaticpaths-cannot-return-params-of-type-number))

- [#14421](https://github.com/withastro/astro/pull/14421) [`df6d2d7`](https://github.com/withastro/astro/commit/df6d2d7bbcaf6b6a327a37a6437d4adade6e2485) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the previously deprecated `Astro.glob()` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-astroglob))

- [#14462](https://github.com/withastro/astro/pull/14462) [`9fdfd4c`](https://github.com/withastro/astro/commit/9fdfd4c620313827e65664632a9c9cb435ad07ca) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `handleForms` prop for the `<ClientRouter />` component - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-handleforms-prop-for-the-clientrouter--component))

- [#14427](https://github.com/withastro/astro/pull/14427) [`e131261`](https://github.com/withastro/astro/commit/e1312615b39c59ebc05d5bb905ee0960b50ad3cf) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Increases minimum Node.js version to 22.12.0 - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#node-22))

- [#14400](https://github.com/withastro/astro/pull/14400) [`c69c7de`](https://github.com/withastro/astro/commit/c69c7de1ffeff29f919d97c262f245927556f875) Thanks [@ellielok](https://github.com/ellielok)! - Removes the deprecated `<ViewTransitions />` component - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-viewtransitions--component))

- [#14406](https://github.com/withastro/astro/pull/14406) [`4f11510`](https://github.com/withastro/astro/commit/4f11510c9ed932f5cb6d1075b1172909dd5db23e) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Changes the default routing configuration value of `i18n.routing.redirectToDefaultLocale` from `true` to `false` - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-i18nroutingredirecttodefaultlocale-default-value))

- [#14477](https://github.com/withastro/astro/pull/14477) [`25fe093`](https://github.com/withastro/astro/commit/25fe09396dbcda2e1008c01a982f4eb2d1f33ae6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes `rewrite()` from Actions context - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-rewrite-from-actions-context))

- [#14445](https://github.com/withastro/astro/pull/14445) [`ecb0b98`](https://github.com/withastro/astro/commit/ecb0b98396f639d830a99ddb5895ab9223e4dc87) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Astro v6.0 upgrades to Vite v7.0 as the development server and production bundler - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#vite-70))

- [#14485](https://github.com/withastro/astro/pull/14485) [`6f67c6e`](https://github.com/withastro/astro/commit/6f67c6eef2647ef1a1eab78a65a906ab633974bb) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `import.meta.env` values to always be inlined - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-importmetaenv-values-are-always-inlined))

- [#14480](https://github.com/withastro/astro/pull/14480) [`36a461b`](https://github.com/withastro/astro/commit/36a461bf3f64c467bc52aecf511cd831d238e18b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `<script>` and `<style>` tags to render in the order they are defined - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-script-and-style-tags-are-rendered-in-the-order-they-are-defined))

- [#14407](https://github.com/withastro/astro/pull/14407) [`3bda3ce`](https://github.com/withastro/astro/commit/3bda3ce4edcb1bd1349890c6ed8110f05954c791) Thanks [@ascorbic](https://github.com/ascorbic)! - Removes legacy content collection support - ([v6 upgrade guidance](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-legacy-content-collections))

### Minor Changes

- [#14550](https://github.com/withastro/astro/pull/14550) [`9c282b5`](https://github.com/withastro/astro/commit/9c282b5e6d3f0d678bc478a863e883fa4765dd17) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds support for live content collections

  Live content collections are a new type of [content collection](https://docs.astro.build/en/guides/content-collections/) that fetch their data at runtime rather than build time. This allows you to access frequently updated data from CMSs, APIs, databases, or other sources using a unified API, without needing to rebuild your site when the data changes.

  #### Live collections vs build-time collections

  In Astro 5.0, the content layer API added support for adding diverse content sources to content collections. You can create loaders that fetch data from any source at build time, and then access it inside a page via `getEntry()` and `getCollection()`. The data is cached between builds, giving fast access and updates.

  However, there was no method for updating the data store between builds, meaning any updates to the data needed a full site deploy, even if the pages are rendered on demand. This meant that content collections were not suitable for pages that update frequently. Instead, these pages tended to access the APIs directly in the frontmatter. This worked, but it led to a lot of boilerplate, and meant users didn't benefit from the simple, unified API that content loaders offer. In most cases, users tended to individually create loader libraries shared between pages.

  Live content collections ([introduced experimentally in Astro 5.10](https://astro.build/blog/live-content-collections-deep-dive/)) solve this problem by allowing you to create loaders that fetch data at runtime, rather than build time. This means that the data is always up-to-date, without needing to rebuild the site.

  #### How to use

  To use live collections, create a new `src/live.config.ts` file (alongside your `src/content.config.ts` if you have one) to define your live collections with a live content loader using the new `defineLiveCollection()` function from the `astro:content` module:

  ```ts title="src/live.config.ts"
  import { defineLiveCollection } from 'astro:content';
  import { storeLoader } from '@mystore/astro-loader';

  const products = defineLiveCollection({
    loader: storeLoader({
      apiKey: process.env.STORE_API_KEY,
      endpoint: 'https://api.mystore.com/v1',
    }),
  });

  export const collections = { products };
  ```

  You can then use the `getLiveCollection()` and `getLiveEntry()` functions to access your live data, along with error handling (since anything can happen when requesting live data!):

  ```astro
  ---
  import { getLiveCollection, getLiveEntry, render } from 'astro:content';
  // Get all products
  const { entries: allProducts, error } = await getLiveCollection('products');
  if (error) {
    // Handle error appropriately
    console.error(error.message);
  }

  // Get products with a filter (if supported by your loader)
  const { entries: electronics } = await getLiveCollection('products', { category: 'electronics' });

  // Get a single product by ID (string syntax)
  const { entry: product, error: productError } = await getLiveEntry('products', Astro.params.id);
  if (productError) {
    return Astro.redirect('/404');
  }

  // Get a single product with a custom query (if supported by your loader) using a filter object
  const { entry: productBySlug } = await getLiveEntry('products', { slug: Astro.params.slug });
  const { Content } = await render(product);
  ---

  <h1>{product.data.title}</h1>
  <Content />
  ```

  #### Upgrading from experimental live collections

  If you were using the experimental feature, you must remove the `experimental.liveContentCollections` flag from your `astro.config.*` file:

  ```diff
   export default defineConfig({
     // ...
  -  experimental: {
  -    liveContentCollections: true,
  -  },
   });
  ```

  No other changes to your project code are required as long as you have been keeping up with Astro 5.x patch releases, which contained breaking changes to this experimental feature. If you experience problems with your live collections after upgrading to Astro v6 and removing this flag, please review the [Astro CHANGELOG from 5.10.2](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#5102) onwards for any potential updates you might have missed, or follow the [current v6 documentation for live collections](https://docs.astro.build/en/guides/content-collections/).

### Patch Changes

- Updated dependencies [[`727b0a2`](https://github.com/withastro/astro/commit/727b0a205eb765f1c36f13a73dfc69e17e44df8f)]:
  - @astrojs/markdown-remark@7.0.0-alpha.0

- [#15147](https://github.com/withastro/astro/pull/15147) [`9cd5b87`](https://github.com/withastro/astro/commit/9cd5b875f2d45a08bfa8312ed7282a6f0f070265) Thanks [@matthewp](https://github.com/matthewp)! - Fixes scripts in components not rendering when a sibling `<Fragment slot="...">` exists but is unused
