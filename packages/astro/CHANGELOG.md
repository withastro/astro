# astro

## 7.3.1

### Patch Changes

- [#17899](https://github.com/withastro/astro/pull/17899) [`0389640`](https://github.com/withastro/astro/commit/03896405717471f7d6ff54986ed6beaec0cac94f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an error that prevented projects using `astro:assets` from starting or building

## 7.3.0

### Minor Changes

- [#17767](https://github.com/withastro/astro/pull/17767) [`ce7c91f`](https://github.com/withastro/astro/commit/ce7c91f77dbd7be03c04bc13f87af9d01fef6cef) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Adds `--ignore-lock` flag to `astro preview`, allowing multiple preview servers to run simultaneously on different ports. This is useful for E2E testing workflows (e.g., Playwright) that need to run several preview servers at once.

- [#17818](https://github.com/withastro/astro/pull/17818) [`c0b6581`](https://github.com/withastro/astro/commit/c0b65811dfa0dafa1aa04b7d6d67fd09250ff8c1) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a `logger` parameter to image services hooks

  Custom image services now receive Astro's runtime logger as an extra argument. Messages logged with it are routed through the destination configured in `logger` and respect your log level, instead of being written straight to the console:

  ```ts
  import type { LocalImageService } from 'astro';

  const service: LocalImageService = {
    // ...
    async transform(inputBuffer, transform, imageConfig, logger) {
      logger.warn(`Could not optimize "${transform.src}". Passing it through unchanged.`);
      return { data: inputBuffer, format: 'png' };
    },
  };
  ```

  Astro's built-in Sharp service now uses this logger for the warnings it emits when it encounters an unexpected or unsupported source format.

- [#17818](https://github.com/withastro/astro/pull/17818) [`c0b6581`](https://github.com/withastro/astro/commit/c0b65811dfa0dafa1aa04b7d6d67fd09250ff8c1) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds `logger` to the context object passed to cache providers

  Custom cache providers now receive Astro's runtime logger on the context passed to `onRequest()`. Messages logged with it are routed through the destination configured in `logger` and respect your log level, instead of being written straight to the console:

  ```ts
  import type { CacheProvider } from 'astro';

  const provider: CacheProvider = {
    name: 'my-cache',
    async onRequest({ request, url, logger }, next) {
      logger.warn(`Skipping cache for ${url.pathname} because the response sets a cookie.`);
      return next();
    },
    // ...
  };
  ```

  Astro's built-in `memoryCache()` provider now uses this logger for the warnings it emits when it skips caching a response that sets cookies, and when a background revalidation fails.

### Patch Changes

- [#17818](https://github.com/withastro/astro/pull/17818) [`c0b6581`](https://github.com/withastro/astro/commit/c0b65811dfa0dafa1aa04b7d6d67fd09250ff8c1) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates Astro's remaining internal warnings and errors to be written through the configured logger instead of directly to the console, when possible

- [#17886](https://github.com/withastro/astro/pull/17886) [`e747cba`](https://github.com/withastro/astro/commit/e747cba07fcd2b9e7fb03c02ed42abfe2079daa2) Thanks [@matthewp](https://github.com/matthewp)! - Fixes the memory cache provider to skip responses with `Vary: Cookie` or `Vary: *`

- [#17885](https://github.com/withastro/astro/pull/17885) [`916b738`](https://github.com/withastro/astro/commit/916b738b0447728f1c274e32677c9bac09be78f6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Improves build performance for sites with a large number of pages coming from a large amount of different modules.

- [#17795](https://github.com/withastro/astro/pull/17795) [`15e2deb`](https://github.com/withastro/astro/commit/15e2debc7e81d353410ff76a76c3bf75b7fb3070) Thanks [@matthewp](https://github.com/matthewp)! - Adds concurrent rendering support for `experimental.incrementalBuild`, including when using `@astrojs/cloudflare`

  Incremental builds no longer disable caching when `build.concurrency` is greater than `1`. Projects that set `build.concurrency: 1` to keep the cache enabled can remove that workaround. Cloudflare builds also reduce serialization overhead for large prerendered pages.

- [#17879](https://github.com/withastro/astro/pull/17879) [`21c34a6`](https://github.com/withastro/astro/commit/21c34a6816372220157ff7e6b697275360d3e367) Thanks [@matthewp](https://github.com/matthewp)! - Fixes missing styles, links, and scripts from content collection entries rendered inside server islands

- [#17861](https://github.com/withastro/astro/pull/17861) [`3193988`](https://github.com/withastro/astro/commit/3193988d0566f53ecd10b03cd18669dcf230c8d6) Thanks [@ethanstoner](https://github.com/ethanstoner)! - Fixes i18n fallback routes being generated with a corrupted path when the locale code also appears at the start of a later path segment. A page such as `src/pages/en/enterprise.astro` with `fallback: { es: 'en' }` produced the route `/es/esterprise` instead of `/es/enterprise`, so the fallback never matched the intended URL. Only the leading locale segment is rewritten now.

## 7.2.10

### Patch Changes

- [#17262](https://github.com/withastro/astro/pull/17262) [`f8e9458`](https://github.com/withastro/astro/commit/f8e94585ab6c38e2702ee1e2e540858f72058a40) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `@astrojs/markdown-remark` being pinned to an exact version.

- [#17874](https://github.com/withastro/astro/pull/17874) [`10c7e63`](https://github.com/withastro/astro/commit/10c7e636cd14232473ae856d7e22e886f5c65689) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes SSR manifest placeholder not being replaced when the server build is minified, which caused a runtime `Invalid URL` crash at server boot

- [#17869](https://github.com/withastro/astro/pull/17869) [`2548abf`](https://github.com/withastro/astro/commit/2548abf1874f2fdfc7438aab51cfea03424753cc) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where the logger was improperly initialized at runtime in dev.

- [#17878](https://github.com/withastro/astro/pull/17878) [`76eff3d`](https://github.com/withastro/astro/commit/76eff3d5fbc5f940acb1dcb341d4b1c9d95fa2a3) Thanks [@ematipico](https://github.com/ematipico)! - Fixes browser heuristic caching for cached responses that include `Last-Modified` or `ETag` validators

- [#17833](https://github.com/withastro/astro/pull/17833) [`413a6e7`](https://github.com/withastro/astro/commit/413a6e7a9b966124913893182b83cbd30a9fd3ab) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes prerender conflict warnings to correctly identify the route that first rendered a duplicate pathname, instead of misattributing the conflict to an unrelated route that merely matches the URL pattern

- [#17872](https://github.com/withastro/astro/pull/17872) [`f7191cc`](https://github.com/withastro/astro/commit/f7191cc4257330b6ca435fb4dae66d315b16115d) Thanks [@jx-grxf](https://github.com/jx-grxf)! - Fixes Markdown images in content collections rendering an empty `srcset` attribute when no responsive candidates are generated.

- [#17755](https://github.com/withastro/astro/pull/17755) [`157c500`](https://github.com/withastro/astro/commit/157c500c38faa7ecf1251adbaeefcd109470d75c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a bug where editing a content collection entry during `astro dev` on Windows kept serving stale content until the dev server was restarted. The data store now notifies the dev server directly after each write instead of relying only on the file watcher, which can miss the atomic rename that commits the write on some platforms.

- Updated dependencies [[`f8e9458`](https://github.com/withastro/astro/commit/f8e94585ab6c38e2702ee1e2e540858f72058a40), [`f8e9458`](https://github.com/withastro/astro/commit/f8e94585ab6c38e2702ee1e2e540858f72058a40)]:
  - @astrojs/internal-helpers@0.11.0
  - @astrojs/markdown-satteri@0.4.0

## 7.2.9

### Patch Changes

- [#17846](https://github.com/withastro/astro/pull/17846) [`b441180`](https://github.com/withastro/astro/commit/b44118001c8f9b4f05ccd004cc3b4d42a8da8bfc) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes importing `.html` files not being typed outside of `.astro` files

- [#17831](https://github.com/withastro/astro/pull/17831) [`32e8b44`](https://github.com/withastro/astro/commit/32e8b44c25a80759f0ed0b47551351331584f779) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes a crash when requesting `/index.html` against a dynamic page route like `[slug].astro`

- [#17841](https://github.com/withastro/astro/pull/17841) [`c35448e`](https://github.com/withastro/astro/commit/c35448ec8e53fc0f93798840953185c9facaa39b) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes SSR manifest containing stale `entryModules` references to prerender-only chunks that no longer exist in the final build output

- [#17847](https://github.com/withastro/astro/pull/17847) [`eb87a23`](https://github.com/withastro/astro/commit/eb87a2391679ffa6fa25c61701569a474aa2e548) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `set:text` escaping in MDX script and style elements

## 7.2.8

### Patch Changes

- [#17837](https://github.com/withastro/astro/pull/17837) [`ecb4082`](https://github.com/withastro/astro/commit/ecb4082131490b4fe9a56aa44fda84b54ef8967b) Thanks [@matthewp](https://github.com/matthewp)! - Updates the minimum supported version of Sharp to 0.35.4

- [#17786](https://github.com/withastro/astro/pull/17786) [`db7c53b`](https://github.com/withastro/astro/commit/db7c53b1707856866e06cdeeef1aa4ae3598b1f2) Thanks [@gameroman](https://github.com/gameroman)! - Replaces the internal `find-process` dependency with a smaller, lighter alternative

## 7.2.7

### Patch Changes

- [#17415](https://github.com/withastro/astro/pull/17415) [`55d38c8`](https://github.com/withastro/astro/commit/55d38c868b7cbf2266649929c60ddf442abe674f) Thanks [@iseraph-dev](https://github.com/iseraph-dev)! - Deserializes each route once when loading the SSR manifest

- [#17772](https://github.com/withastro/astro/pull/17772) [`023b48b`](https://github.com/withastro/astro/commit/023b48b139a2c40420b340f61b53a62b47a557e5) Thanks [@matthewp](https://github.com/matthewp)! - Fixes route selection for normalized request paths in adapter and development request handling

- [#17819](https://github.com/withastro/astro/pull/17819) [`633855b`](https://github.com/withastro/astro/commit/633855b0cabd55cc7b913eb556a739a6a2d93dd2) Thanks [@matthewp](https://github.com/matthewp)! - Updates generated and default Cloudflare `compatibility_date` values to match the installed runtime and requires Wrangler `^4.125.0`

- [#17813](https://github.com/withastro/astro/pull/17813) [`ae26d18`](https://github.com/withastro/astro/commit/ae26d18c71515c47ecbd7e1ffe5c5dfc29fbd613) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `rewrite()` and `next(payload)` for GET and HEAD requests with host-provided bodies

- [#17816](https://github.com/withastro/astro/pull/17816) [`a0d2fe3`](https://github.com/withastro/astro/commit/a0d2fe3af25a25bc9b808070f25886c37d5be6fc) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes the experimental `svgOptimizer` not generating unique per-file ID prefixes when using SVGO's `prefixIds` plugin

## 7.2.6

### Patch Changes

- [#17812](https://github.com/withastro/astro/pull/17812) [`29af6da`](https://github.com/withastro/astro/commit/29af6da5c11aff673133f96df029f40345674f0e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a bug where `new FetchState(request)` could fail in development when server dependencies were optimized

## 7.2.5

### Patch Changes

- [#17758](https://github.com/withastro/astro/pull/17758) [`5f419e2`](https://github.com/withastro/astro/commit/5f419e25c570002a2ce0e10a973aa13336016b0c) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes a bug where `experimental_getFontFileURL()` rejected valid font URLs when using the Cloudflare adapter

- [#17416](https://github.com/withastro/astro/pull/17416) [`493796b`](https://github.com/withastro/astro/commit/493796b4c318b19985eccaac7a11aa7b787e1efe) Thanks [@iseraph-dev](https://github.com/iseraph-dev)! - Skips no-op pathname writes when normalizing SSR request URLs

- [#17712](https://github.com/withastro/astro/pull/17712) [`bd374b7`](https://github.com/withastro/astro/commit/bd374b7507de8d706c845946fd847e76de6fc06b) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Updates deprecation messages target from Astro 7 to 8

- [#17719](https://github.com/withastro/astro/pull/17719) [`dac1768`](https://github.com/withastro/astro/commit/dac17688f691c6cecdff969aa48523bf17fc0657) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes session ID validation to reject non-UUID cookie values before using them as storage keys

- [#17770](https://github.com/withastro/astro/pull/17770) [`84eb7e7`](https://github.com/withastro/astro/commit/84eb7e7db99573b80c339efe0392d959e7a9b6cf) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes `--mode`, `--site`, `--base`, `--out-dir`, `--verbose`, `--silent`, and `--open` flags being silently dropped when using `astro dev --background` or `astro preview --background`

- [#17713](https://github.com/withastro/astro/pull/17713) [`d035290`](https://github.com/withastro/astro/commit/d035290a14afac8834885b727327a7f44d3a3a48) Thanks [@wakqasahmed](https://github.com/wakqasahmed)! - Fixes `content-modules.mjs` not removing entries for deleted or renamed content files, which could cause Vite to attempt to resolve non-existent modules

  As part of this fix, `#moduleImports` is now fully rebuilt from `deferredRender` entries before every write, so a module import added only through the public `addModuleImport()` API without a corresponding `deferredRender` entry in the store will no longer be preserved across writes.

- [#17743](https://github.com/withastro/astro/pull/17743) [`adc750f`](https://github.com/withastro/astro/commit/adc750fa27ea1d4767e30fc12e64a342fbebbd89) Thanks [@contactjawad](https://github.com/contactjawad)! - Fixes `Astro.preferredLocale` and `Astro.preferredLocaleList` ignoring `Accept-Language` quality values when they are absent or `0`. An entry without an explicit `q=` now correctly counts as quality `1.0` (per RFC 7231) and an entry with `q=0` is treated as not acceptable, so the highest-quality locale is selected regardless of header order.

- [#17757](https://github.com/withastro/astro/pull/17757) [`660991c`](https://github.com/withastro/astro/commit/660991c820fbeb087b2f27361e6ebaeba8285358) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes build errors showing wrong file location, missing line:col, and misleading hints when a plugin error (e.g. from MDX) is wrapped by Vite's build error

- [#17783](https://github.com/withastro/astro/pull/17783) [`60b14ff`](https://github.com/withastro/astro/commit/60b14ffff5b7a66b06d9b12e72933ba9222f519d) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a type error when passing an image from a content collection `image()` schema to a component or `<Image />`. The schema returned by `image()` was missing the `apng` format, so it no longer matched the type of an imported image.

- [#17664](https://github.com/withastro/astro/pull/17664) [`d483125`](https://github.com/withastro/astro/commit/d48312502ef33a32aef3f25b6b6035db8b38e189) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes an issue where Astro CSP support didn't correctly handle cases `"unsafe-inline"` resource. Now when `"unsafe-inline"`, Astro won't emit hashes for the directive specified.

- [#17810](https://github.com/withastro/astro/pull/17810) [`0fc5f65`](https://github.com/withastro/astro/commit/0fc5f655ff33701711e91ca950d4f6143ba13c9a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a regression in the content collections that could cause images to not be resolved

- [#17781](https://github.com/withastro/astro/pull/17781) [`aa33b44`](https://github.com/withastro/astro/commit/aa33b440a5222604cc154f2fa1ec6d71b42d7ddc) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `memoryCache()` storing responses that set cookies through `Astro.cookies` or `Astro.session`

- [#17787](https://github.com/withastro/astro/pull/17787) [`6661fbe`](https://github.com/withastro/astro/commit/6661fbe54a2bd5e784110d89b31bc682b8ff7f21) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes `server:defer` crashing the dev server with "undefined is not a function" when a deferred component imports from `astro:i18n`

- [#17750](https://github.com/withastro/astro/pull/17750) [`dd0e3ac`](https://github.com/withastro/astro/commit/dd0e3aca0b898307431120a5bc1541681190178d) Thanks [@dobrodob](https://github.com/dobrodob)! - Fixes a regression where `transition:persist` stopped working for `<audio>` and `<video>` elements.

- [#17774](https://github.com/withastro/astro/pull/17774) [`fe1d16d`](https://github.com/withastro/astro/commit/fe1d16d9865d2e71d4e9deca6a1303dce50c393b) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Adds support for importing `.apng` files as image metadata for use with standard `<img>` elements. Astro's image components reject APNG files to avoid removing their animation

- [#17799](https://github.com/withastro/astro/pull/17799) [`8797754`](https://github.com/withastro/astro/commit/8797754d0b9c07ae7f6f53a48bc223f0e0e489ca) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes i18n `fallbackType: "rewrite"` returning 500 instead of 404 when the fallback locale also has no matching static path for a prerendered dynamic route

- [#17741](https://github.com/withastro/astro/pull/17741) [`99d3d3d`](https://github.com/withastro/astro/commit/99d3d3dbbfa4fd7b128a056337f1a719437a7377) Thanks [@ericswpark](https://github.com/ericswpark)! - Bumps the Astro compiler to the latest version. [Changelog](https://github.com/withastro/compiler-rs/releases/tag/%40astrojs%2Fcompiler-rs%400.4.0).

- [#17782](https://github.com/withastro/astro/pull/17782) [`3578d45`](https://github.com/withastro/astro/commit/3578d45d34226d63cff3d261c971c221de6794d2) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Improves the performance of the Astro CLI in local by enabling Node's module compilation cache.

- [#17705](https://github.com/withastro/astro/pull/17705) [`2043e4f`](https://github.com/withastro/astro/commit/2043e4fc0f906665a04cac2a94db2aeea1f8e225) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes incremental builds serving cached HTML that references stale CSS filenames after a stylesheet-only edit

- [#17754](https://github.com/withastro/astro/pull/17754) [`3d50dfd`](https://github.com/withastro/astro/commit/3d50dfdd14e2eff09f28645b8e788aca36323ff1) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes the dev server refusing to start in Docker containers after a restart due to PID reuse in the lock file check

- [#17769](https://github.com/withastro/astro/pull/17769) [`bbda94d`](https://github.com/withastro/astro/commit/bbda94d69b9af76baa7473a1182beb8b4bd92c82) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes a build failure when defining `vite.environments.ssr` in the Astro config. User-provided environment config for `ssr`, `prerender`, or `client` is now properly deep-merged with Astro's internal environment settings instead of silently breaking the server entry naming.

- [#17776](https://github.com/withastro/astro/pull/17776) [`0874da8`](https://github.com/withastro/astro/commit/0874da8c64dd4974bf15f22602c5eae0841f7691) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes the `glob()` content loader failing to load files with colons in their names (e.g., `Guide: Architecture.md`)

- Updated dependencies [[`0762a83`](https://github.com/withastro/astro/commit/0762a8385b5b5b093def3768a0c4d0464a9dccc4), [`0c99615`](https://github.com/withastro/astro/commit/0c996155d82acbb0c3accad1e56ba356bf47b743)]:
  - @astrojs/markdown-satteri@0.3.8

## 7.2.4

### Patch Changes

- [#17747](https://github.com/withastro/astro/pull/17747) [`a90ff66`](https://github.com/withastro/astro/commit/a90ff6650fc244bf6ec86844a82dd13b88a4fd41) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes builds hanging when an image file is malformed

- [#17701](https://github.com/withastro/astro/pull/17701) [`05763a0`](https://github.com/withastro/astro/commit/05763a0884aabb1da78a2749d5bb9d41ae620527) Thanks [@matthewp](https://github.com/matthewp)! - Fixes base path stripping to respect path-segment boundaries. With a configured `base` such as `/docs`, a request like `/docs-archive/page` is no longer treated as being under the base, so routing and `context.url.pathname` now agree on the same pathname.

- [#17742](https://github.com/withastro/astro/pull/17742) [`70b449d`](https://github.com/withastro/astro/commit/70b449ddbae465348aa9337ff7d1d62ad8286e1a) Thanks [@Kjubikstronk](https://github.com/Kjubikstronk)! - Fixes `astro build` throwing `TypeError: Missing parameter` for dynamic routes when `build.format: 'preserve'` and `trailingSlash: 'always'` are used together. Stripping the framework-injected `.html` suffix dropped the trailing slash that the compiled route pattern requires, so the route no longer matched itself and its params resolved as empty.

- [#17703](https://github.com/withastro/astro/pull/17703) [`771b0a9`](https://github.com/withastro/astro/commit/771b0a9a04ca4b4bcdd098b2062a5903cc988112) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `Astro.site` always being `undefined` when rendering components via the Container API, even when `site` is set in `astroConfig`

- Updated dependencies [[`05763a0`](https://github.com/withastro/astro/commit/05763a0884aabb1da78a2749d5bb9d41ae620527), [`bc171af`](https://github.com/withastro/astro/commit/bc171af0e29a1bb4ca56beffde1c4c03e1bb227f)]:
  - @astrojs/internal-helpers@0.10.4
  - @astrojs/markdown-satteri@0.3.7
  - @astrojs/markdown-remark@7.2.4

## 7.2.3

### Patch Changes

- [#17724](https://github.com/withastro/astro/pull/17724) [`97140b2`](https://github.com/withastro/astro/commit/97140b23f4f8d5dae1b2bfe6c69bd602e262eee9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro could run out of memory when `experimental.collectionStorage` is set to `chunked` and there are multiple concurrent updates to the same collection.

- [#17636](https://github.com/withastro/astro/pull/17636) [`51723b1`](https://github.com/withastro/astro/commit/51723b100a37d6dd6df793957d35d9216e872cef) Thanks [@matthewp](https://github.com/matthewp)! - Fixes the dev server sometimes matching against stale routes after pages were added, removed, or renamed, requiring a dev server restart to pick up the change

- [#17636](https://github.com/withastro/astro/pull/17636) [`51723b1`](https://github.com/withastro/astro/commit/51723b100a37d6dd6df793957d35d9216e872cef) Thanks [@matthewp](https://github.com/matthewp)! - Fixes the composable request helpers (`astro/fetch`) throwing an error when used on a request that had been rewritten with `Astro.rewrite()` or `next()`

- [#17636](https://github.com/withastro/astro/pull/17636) [`51723b1`](https://github.com/withastro/astro/commit/51723b100a37d6dd6df793957d35d9216e872cef) Thanks [@matthewp](https://github.com/matthewp)! - Refactors Astro's internal server-side request handling. This is an internal change: all documented public APIs, including `App` and `NodeApp`, keep their existing signatures and behavior.

  The undocumented internal `app.pipeline` property and the `AppPipeline` export from `astro/app` have been removed. Adapters that used `app.pipeline.getLogger()` to wait for the configured log destination can call the new `app.getLogger()` instead.

  As a result of this refactor, `new FetchState(request)` from `astro/fetch` now works anywhere inside a built Astro server — including custom `src/fetch.ts` entrypoints — without the request needing to first pass through `app.render()`. Previously this threw an error, breaking patterns like the Cloudflare adapter's advanced custom-worker setup.

- [#17723](https://github.com/withastro/astro/pull/17723) [`c3b9aed`](https://github.com/withastro/astro/commit/c3b9aed88d9a9b21015bab5cc6de95d1663869cf) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a link in font providers JSDoc annotations

- [#17699](https://github.com/withastro/astro/pull/17699) [`e28d227`](https://github.com/withastro/astro/commit/e28d22782bdc641261d0eca8ad00ba248a93d640) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes several documentation issues related to the JSDoc for configuration options.

  - When hovering over the `server` and `fonts` options, the JSDoc for the nested options was displayed instead of the JSDoc for the top-level property.
  - Two i18n configuration options were being used incorrectly in the examples.
  - The indentation of some code blocks was broken on hover.

- [#17572](https://github.com/withastro/astro/pull/17572) [`2066f39`](https://github.com/withastro/astro/commit/2066f39c60707a100531b4ef4bb5dab8feafa7f2) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a crash when a request arrives with a malformed port in the `Host` header (for example `example.com:65536` or `example.com:8080:8080`). Such a host made the constructed request URL invalid, and the fallback that was meant to recover reused the same invalid host and threw again. The request URL now degrades to a host the server controls when the incoming host cannot be parsed, so the request is handled instead of erroring.

- [#17685](https://github.com/withastro/astro/pull/17685) [`9f15609`](https://github.com/withastro/astro/commit/9f156094ca89d1474fbf1c471354dc94e69398a9) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a dev server error where an SSR full reload triggered by a third-party Vite plugin (such as `@tailwindcss/vite`) could fail with `Failed to load url astro:server-app.js`

- [#17636](https://github.com/withastro/astro/pull/17636) [`51723b1`](https://github.com/withastro/astro/commit/51723b100a37d6dd6df793957d35d9216e872cef) Thanks [@matthewp](https://github.com/matthewp)! - Improves error handling for custom log destinations. When the configured logger fails to load, Astro now reports the error and continues with the default console logger instead of failing the first request.

- [#17631](https://github.com/withastro/astro/pull/17631) [`cf29bec`](https://github.com/withastro/astro/commit/cf29bec66124bc7059ffe7013df040860bd197c5) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `getCollection()` and `getEntry()` throwing `DataCloneError` when a collection schema transform returns a `Temporal.PlainDate` or other class instance.

- Updated dependencies [[`8c193f6`](https://github.com/withastro/astro/commit/8c193f67cce77cf2e41fb702c88ca46f788f1277)]:
  - @astrojs/internal-helpers@0.10.3
  - @astrojs/markdown-remark@7.2.3
  - @astrojs/markdown-satteri@0.3.6

## 7.2.2

### Patch Changes

- [#17611](https://github.com/withastro/astro/pull/17611) [`9bc3207`](https://github.com/withastro/astro/commit/9bc3207fdbcdf8991596d0caeb66b707405aad07) Thanks [@thelazylamaGit](https://github.com/thelazylamaGit)! - Fixes component styles rendered from content entries remaining stale until a second save when an adapter uses Astro's fallback development environment

- [#17634](https://github.com/withastro/astro/pull/17634) [`2267eee`](https://github.com/withastro/astro/commit/2267eeec7e88a47013465682d5278d7ea9253e5b) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes incremental builds dropping optimized images for cached pages when using a `collectStaticImages` prerenderer (e.g. `@astrojs/cloudflare` with compile-time image optimization)

- [#17650](https://github.com/withastro/astro/pull/17650) [`4cdf128`](https://github.com/withastro/astro/commit/4cdf12873970dc542a18188fca1a9289ca1b0368) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes intermittent `ImageNotFound` errors during build on projects with many images. The build now limits concurrent image file reads to avoid exhausting OS file descriptors (EMFILE) and retries transient I/O errors with backoff. Non-transient errors are no longer silently swallowed.

- [#17683](https://github.com/withastro/astro/pull/17683) [`2378221`](https://github.com/withastro/astro/commit/23782215a3f49d205b3576280e788d7c714c6d0f) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `prerenderConflictBehavior` not applying to content collection duplicate ID warnings in the `glob()` and `file()` loaders. Setting it to `'error'` now throws during content sync, and `'ignore'` suppresses the warning.

- [#17659](https://github.com/withastro/astro/pull/17659) [`90c6ea4`](https://github.com/withastro/astro/commit/90c6ea4641e2ca9362c4ab0ea7a8590d07bd1868) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes the Fonts API breaking `experimental.incrementalBuild` caching by embedding a build-local, randomly-assigned server port in generated code used for the dependency hash

- [#17630](https://github.com/withastro/astro/pull/17630) [`fd1d9ee`](https://github.com/withastro/astro/commit/fd1d9ee3f4a9c196153090d0523668febb1b6024) Thanks [@ericclemmons](https://github.com/ericclemmons)! - Fixes incremental builds becoming prohibitively slow for sites with many pages or content entries that share a large dependency graph.

- [#17690](https://github.com/withastro/astro/pull/17690) [`93beecc`](https://github.com/withastro/astro/commit/93beeccc518d19caee01b0fa72f7e6244cb9288c) Thanks [@NgoQuocViet2001](https://github.com/NgoQuocViet2001)! - Prevents files in directories whose names start with `pages` from being treated as page routes

- [#17671](https://github.com/withastro/astro/pull/17671) [`09f0dc7`](https://github.com/withastro/astro/commit/09f0dc7f90ef92f8520e13b7ba130e4b8aad31bd) Thanks [@tarikermis](https://github.com/tarikermis)! - Fixes `astro dev` refusing to start after a Docker container restart when an unrelated process reuses the PID from a persisted lock file. Astro now checks the process command across platforms, so stale lock files are cleaned up and `--force` does not signal the unrelated process.

## 7.2.1

### Patch Changes

- [#17612](https://github.com/withastro/astro/pull/17612) [`7133730`](https://github.com/withastro/astro/commit/71337304965425820e81cc27d54b95d23033c017) Thanks [@thelazylamaGit](https://github.com/thelazylamaGit)! - Fixes CSS hot module replacement after navigating between pages with `ClientRouter`

- [#17628](https://github.com/withastro/astro/pull/17628) [`4ada248`](https://github.com/withastro/astro/commit/4ada24889fc1bcc1ee89f3f8e5c6bc4cbe87cce6) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a CSP violation when using both `security.csp` and `experimental.clientPrerender` with `data-astro-prefetch` links. The dynamically injected `<script type="speculationrules">` now uses a static `"source": "document"` approach with a CSS selector, producing a deterministic payload that is hashed and included in the CSP `script-src` directive at build time.

- [#17605](https://github.com/withastro/astro/pull/17605) [`89e4647`](https://github.com/withastro/astro/commit/89e4647bed74e65a2fc1c60ccb5a7fc6b7bf3bc4) Thanks [@ashleigh-yeoman](https://github.com/ashleigh-yeoman)! - Fixes middleware HMR not responding to changes in imported modules. Previously, only direct edits to the middleware file would trigger a reload.

- [#17582](https://github.com/withastro/astro/pull/17582) [`bd2c1a5`](https://github.com/withastro/astro/commit/bd2c1a5a70666cc140c73a77edb41882fc88b277) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a regression where content collection `reference()` fields silently accepted entry IDs that don't exist, such as an ID that doesn't match a loader's slugified version of it. Astro now logs an error for references that point to a missing entry after all loaders finish syncing.

- [#17661](https://github.com/withastro/astro/pull/17661) [`97b0cc7`](https://github.com/withastro/astro/commit/97b0cc79c586bb1fc2ce2ffe4c420f3cf2db769e) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Improves Markdown options documentation with links to the Markdown guide and official processors.

- [#17349](https://github.com/withastro/astro/pull/17349) [`4328c73`](https://github.com/withastro/astro/commit/4328c736b18d36576429186445c8c89e8cd0d4b6) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes an issue where requests handled by the dev prerender environment (e.g. `/_image` with `@astrojs/cloudflare`'s `prerenderEnvironment: 'node'`) returned a 500 when a prerendered catch-all route existed, because non-prerendered route modules were imported in an environment where their runtime-specific APIs are unavailable

- [#17603](https://github.com/withastro/astro/pull/17603) [`722eed6`](https://github.com/withastro/astro/commit/722eed64c4ec878a4778ab312599733b325b21ca) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `<video>` and `<audio>` elements being non-functional after navigating via view transitions (`<ClientRouter />`)

- [#17616](https://github.com/withastro/astro/pull/17616) [`3a890d2`](https://github.com/withastro/astro/commit/3a890d226482e98c41650fb66c0c14d45eba2717) Thanks [@lazerg](https://github.com/lazerg)! - Fixes `experimental.incrementalBuild` re-rendering unchanged routes that import more than one asset. The route's dependency hash depended on the order the assets finished building, so two builds of identical sources could produce different hashes. The hash is now based on the file name each asset resolves to.

- [#17547](https://github.com/withastro/astro/pull/17547) [`fba468c`](https://github.com/withastro/astro/commit/fba468c228d8661d2383a80c74206075201a187b) Thanks [@dmgawel](https://github.com/dmgawel)! - Improves `getCollection()` and `getEntry()` performance for entries without local image references

- [#17602](https://github.com/withastro/astro/pull/17602) [`16e0d9d`](https://github.com/withastro/astro/commit/16e0d9d5c1b289242d317887e8334506627f2233) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a build error caused by hash collisions in generated content collection image import identifiers

## 7.2.0

### Minor Changes

- [#17174](https://github.com/withastro/astro/pull/17174) [`0224a3a`](https://github.com/withastro/astro/commit/0224a3a356c1f2956075b77c3667bc67cf027d8c) Thanks [@matthewp](https://github.com/matthewp)! - Adds the `astro preview --background` flag to start preview servers as background processes.

  This makes preview servers easier to manage from scripts and AI coding agents because the command returns after the server is ready instead of keeping the terminal attached to the long-running process.

  ```sh
  astro preview --background
  ```

  When a preview server is running in the background, you can inspect or stop it with new `astro preview` subcommands:

  ```sh
  astro preview status
  astro preview logs
  astro preview logs --follow
  astro preview stop
  ```

  If Astro detects that `astro preview` is being run by an AI coding agent, background mode is enabled automatically. This matches the existing behavior for `astro dev`, allowing agents to continue working after the preview server starts while still receiving the server URL and process ID.

  To opt out of automatic background mode for preview servers, set `ASTRO_PREVIEW_BACKGROUND=0` before running `astro preview`.

- [#17532](https://github.com/withastro/astro/pull/17532) [`7f94895`](https://github.com/withastro/astro/commit/7f94895f8c28fc4d6977c9bfb1f90e80a9cfaa08) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds support for paths relative to your project root in `logger.entrypoint`

  Previously, pointing `logger.entrypoint` at a custom log handler living in your own project required building an absolute `URL`. You can now write the path directly:

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    logger: {
  -    entrypoint: new URL('./src/logger.js', import.meta.url),
  +    entrypoint: './src/logger.js',
    },
  });
  ```

  Paths starting with `./` or `../` are resolved against your project root. Package specifiers such as `@org/astro-logger`, absolute paths, and `URL` entrypoints keep working as before.

- [#17084](https://github.com/withastro/astro/pull/17084) [`961bbe5`](https://github.com/withastro/astro/commit/961bbe5fdf4a761adb479595dfb94dc2e80f2957) Thanks [@matthewp](https://github.com/matthewp)! - Widens the `AstroPrerenderer` `render()` return type so prerenderers can report incremental-build metadata

  A prerenderer's `render()` may now resolve to either a `Response` (as before) or a `PrerenderResult` object that pairs the response with the content entries and optimized-image transforms the page resolved. This lets prerenderers that render out of process (for example, in an adapter's runtime like workerd) report those dependencies back to the build, so [incremental static builds](https://docs.astro.build/en/reference/experimental-flags/incremental-build/) can track and replay them for skipped pages.

  ```ts
  import type { AstroPrerenderer, PrerenderResult } from 'astro';

  const prerenderer: AstroPrerenderer = {
    name: 'my-adapter:prerenderer',
    getStaticPaths,
    async render(request, { routeData }): Promise<PrerenderResult> {
      const { response, metadata } = await renderInRuntime(request, routeData);
      return { response, metadata };
    },
  };
  ```

  This is a non-breaking widening: prerenderers that return a bare `Response` continue to work unchanged, and in-process prerenderers can keep returning a `Response` since the build collects their metadata directly.

- [#16871](https://github.com/withastro/astro/pull/16871) [`90c98ae`](https://github.com/withastro/astro/commit/90c98ae21ef0444a4088b7081676b0f97915001f) Thanks [@adamchal](https://github.com/adamchal)! - Adds `session: false` in `astro.config` to opt out of session support. Projects that do not set `session: false` see no behavior change.

  ```js title="astro.config.mjs"
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    session: false,
  });
  ```

  The session runtime and dependencies (`unstorage`) are now tree-shaken out of the SSR bundle for any project where no session driver is wired via:

  - `session: false`
  - no `session` config at all
  - a `session` config without a driver

  Useful for serverless/edge runtimes where cold-start parse time is sensitive.

- [#17084](https://github.com/withastro/astro/pull/17084) [`961bbe5`](https://github.com/withastro/astro/commit/961bbe5fdf4a761adb479595dfb94dc2e80f2957) Thanks [@matthewp](https://github.com/matthewp)! - Adds experimental support for incremental static builds with `experimental.incrementalBuild`.

  When enabled, Astro can skip regenerating static pages from dynamic routes when both the page's module dependencies and its data cache key are unchanged from the previous build. This currently applies to pages returned from `getStaticPaths()` that include a `cacheKey`.

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      incrementalBuild: true,
    },
  });
  ```

  Return a `cacheKey` for each generated page from `getStaticPaths()`:

  ```astro
  ---
  export async function getStaticPaths() {
    const posts = await fetchPosts();

    return posts.map((post) => ({
      params: { slug: post.slug },
      props: { post },
      cacheKey: post.digest,
    }));
  }
  ---
  ```

  For incremental builds to skip rendering in CI, Astro's cache directory must be preserved between builds. Astro empties the output directory on each build and restores skipped pages from the cache directory, so only that directory needs to persist. For the default config, cache and restore `node_modules/.astro/` before running `astro build`.

  See the [experimental incremental static builds](https://docs.astro.build/en/reference/experimental-flags/incremental-build/) documentation for more information.

- [#17084](https://github.com/withastro/astro/pull/17084) [`961bbe5`](https://github.com/withastro/astro/commit/961bbe5fdf4a761adb479595dfb94dc2e80f2957) Thanks [@matthewp](https://github.com/matthewp)! - Adds the optional `digest` property to content collection entries.

  Loaders can provide an opaque digest value that changes when an entry changes. This is now reflected in the `CollectionEntry` type returned by `getCollection()` and `getEntry()`, making it easier to detect content changes without re-hashing large entry bodies.

  ```astro
  ---
  import { getCollection } from 'astro:content';

  const posts = await getCollection('blog');

  for (const post of posts) {
    console.log(post.digest);
  }
  ---
  ```

  The property is optional because not every loader provides a digest. See [incremental static builds](https://docs.astro.build/en/reference/experimental-flags/incremental-build/) for how `digest` can be used as a `cacheKey`.

### Patch Changes

- [#17534](https://github.com/withastro/astro/pull/17534) [`5a5337e`](https://github.com/withastro/astro/commit/5a5337ea718ab32401a37cdddc52e944289e8b66) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves `logger.entrypoint` reference docs

- [#17529](https://github.com/withastro/astro/pull/17529) [`d52a787`](https://github.com/withastro/astro/commit/d52a787b321b67a0491f33d87e670b59ba16f9fe) Thanks [@QVinto](https://github.com/QVinto)! - Fixes `astro dev` crashing with `Invalid URL` when `--host` is set to a specific non-loopback address

  Vite only reports a `local` URL for loopback hosts. When the dev server was started with `--host <custom-address>` bound to a specific non-loopback address (a LAN or Tailscale IP, for example), the URL was reported under `network` and `local` was empty, so writing the dev lock file threw `Invalid URL` and killed a server that had already started successfully.

  The lock file URL now falls back to the network URL, and a server that exposes no URL at all is left untracked rather than being taken down by lock file bookkeeping.

- [#17566](https://github.com/withastro/astro/pull/17566) [`296248c`](https://github.com/withastro/astro/commit/296248cb39e9e2cc3c0896441df75edb2d3b3959) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `fontProviders.googleicons()` returning the full icon font (~3.9MB) instead of only the requested glyphs when multiple `experimental.glyphs` are specified

- [#17560](https://github.com/withastro/astro/pull/17560) [`ef45de1`](https://github.com/withastro/astro/commit/ef45de17d21a0303fe50d7ca50fc8deef15856a7) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `Astro.url.pathname` for non-index pages when using `build.format: 'preserve'`. Previously, a page like `src/pages/about-me.astro` would output to `dist/about-me.html` but `Astro.url.pathname` would incorrectly return `/about-me/` instead of `/about-me.html`.

- [#17573](https://github.com/withastro/astro/pull/17573) [`0089f83`](https://github.com/withastro/astro/commit/0089f836320ec2aefdb6c448af31e56754115c5c) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a Content Layer build crash that could occur when another dependency causes an older version of `neotraverse` to be hoisted to the project root

- [#17571](https://github.com/withastro/astro/pull/17571) [`116f700`](https://github.com/withastro/astro/commit/116f700d63b314467256d1913d544415d109f3bc) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes cookies set via `Astro.cookies.set()` inside a custom `404.astro` or `500.astro` error page being silently dropped from the final response

- [#17579](https://github.com/withastro/astro/pull/17579) [`3ea55ce`](https://github.com/withastro/astro/commit/3ea55ce24024af7dc6ec3dcdde2f8af6ab5707d8) Thanks [@bluwy](https://github.com/bluwy)! - Supports the `devEngines` field in package.json when detecting the package manager for install commands

- [#17422](https://github.com/withastro/astro/pull/17422) [`e4e2037`](https://github.com/withastro/astro/commit/e4e20374f55c3338e4bd22275a8ad265f1c24cbf) Thanks [@jiwonyoon-dev](https://github.com/jiwonyoon-dev)! - Fixes `popover` being rendered as `popover="true"`/`popover="false"` on custom elements (tag names containing a hyphen). Per the Popover API, the attribute only accepts `"auto"`, `"manual"`, or being absent, so boolean values are now always rendered as a bare `popover` attribute (or omitted), regardless of the tag name.

## 7.1.6

### Patch Changes

- [#17536](https://github.com/withastro/astro/pull/17536) [`ff97b86`](https://github.com/withastro/astro/commit/ff97b86ab02d199af5fe0f6e9984e9919c8276bf) Thanks [@dmgawel](https://github.com/dmgawel)! - Fixes concurrent static builds failing to generate i18n rewrite fallbacks for dynamic routes

- [#17383](https://github.com/withastro/astro/pull/17383) [`296e1b0`](https://github.com/withastro/astro/commit/296e1b03770e55fe969130300c3c55674ae59b1a) Thanks [@thelazylamaGit](https://github.com/thelazylamaGit)! - Fixes stale dev CSS after editing component style blocks and CSS files in dev

- [#17543](https://github.com/withastro/astro/pull/17543) [`bbc1ec9`](https://github.com/withastro/astro/commit/bbc1ec9715160e25eb6a6fee2e133386414c0c00) Thanks [@ematipico](https://github.com/ematipico)! - Adds a feature to `experimental.collectionStorage` that allows to change the size of chunks.

  For example, you can reduce the size of chunks to 1MB:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      collectionStorage: {
        type: 'chunked',
        chunkSize: 1024 * 1024,
      },
    },
  });
  ```

- [#17545](https://github.com/withastro/astro/pull/17545) [`5214663`](https://github.com/withastro/astro/commit/5214663aa5aca47e6cd0e049cfa40844b87bbb6f) Thanks [@ematipico](https://github.com/ematipico)! - Bumps the Astro compiler to the latest version. [Changelog](https://github.com/withastro/compiler-rs/releases/tag/%40astrojs%2Fcompiler-rs%400.3.2).

## 7.1.5

### Patch Changes

- [#17524](https://github.com/withastro/astro/pull/17524) [`7613030`](https://github.com/withastro/astro/commit/761303051021764c5b8bc43ae4e32629c15b61a8) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a bug where an error while finalizing a request could prevent a response from being sent

- [#17480](https://github.com/withastro/astro/pull/17480) [`f61ba9c`](https://github.com/withastro/astro/commit/f61ba9cfb028d9f7448eda3fea2726e179d66391) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where a custom `logger.entrypoint` failed to load at runtime in a built server bundle.

- [#17525](https://github.com/withastro/astro/pull/17525) [`e614b7b`](https://github.com/withastro/astro/commit/e614b7bd8a0dae403b1f9c219250847d326cbff2) Thanks [@matthewp](https://github.com/matthewp)! - Fixes action path resolution so that properties of a resolved action function are not treated as routable path segments

- [#17284](https://github.com/withastro/astro/pull/17284) [`c775c1f`](https://github.com/withastro/astro/commit/c775c1f984d1c176bf26a0f9c435bf6c0d585443) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a bug where the custom 404 (or 500) page was not rendered when a middleware rewrite targeted a route that returned an empty 404/500 response, and a blank page was returned instead

- [#17474](https://github.com/withastro/astro/pull/17474) [`c895b12`](https://github.com/withastro/astro/commit/c895b12b99a73f5a9f98d6699452d12c138f8a18) Thanks [@nicksnyder](https://github.com/nicksnyder)! - Updates dependency `js-yaml` to v4.3.0

- Updated dependencies [[`c895b12`](https://github.com/withastro/astro/commit/c895b12b99a73f5a9f98d6699452d12c138f8a18)]:
  - @astrojs/internal-helpers@0.10.2
  - @astrojs/markdown-remark@7.2.2
  - @astrojs/markdown-satteri@0.3.5

## 7.1.4

### Patch Changes

- [#17488](https://github.com/withastro/astro/pull/17488) [`d4f266d`](https://github.com/withastro/astro/commit/d4f266de4af009876baa554708705e5ac36572bb) Thanks [@emerson-d-lopes](https://github.com/emerson-d-lopes)! - Fixes duplicate CSS files being emitted in server output when a prerendered page and a server-rendered page share the same styles (e.g. a shared layout importing Tailwind). The prerender and SSR environments each emitted their own copy of the same stylesheet (`index.X.css` and `_..Y.css`); the SSR build now reuses the CSS asset filename from the prerender build when the stylesheet is backed by the same CSS source modules, so only a single file is emitted.

- [#17472](https://github.com/withastro/astro/pull/17472) [`4dc590c`](https://github.com/withastro/astro/commit/4dc590c8fcdd9207492914dddb8e861c532ed904) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Adds the missing `background` prop to the `<Image />` and `<Picture />` component types. The prop already worked at runtime, but was absent from the types, causing `astro check` to report that `background` does not exist on the component props

- [#17292](https://github.com/withastro/astro/pull/17292) [`0fc519d`](https://github.com/withastro/astro/commit/0fc519de12d69088052b76e096a4adfdc789c30c) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes missing scoped styles for child components inside `client:only` islands in production builds

- [#17421](https://github.com/withastro/astro/pull/17421) [`f1448de`](https://github.com/withastro/astro/commit/f1448de83726a7ab21c89d45e2e26ed8f6ef6531) Thanks [@iamkaleemsajjad-hue](https://github.com/iamkaleemsajjad-hue)! - Fixes session runtime errors being silently swallowed by `console.error` instead of routing through Astro's logger

- [#17421](https://github.com/withastro/astro/pull/17421) [`f1448de`](https://github.com/withastro/astro/commit/f1448de83726a7ab21c89d45e2e26ed8f6ef6531) Thanks [@iamkaleemsajjad-hue](https://github.com/iamkaleemsajjad-hue)! - Fixes a session being left in a partial state after a storage failure during `session.regenerate()`, preventing unnecessary storage reads on subsequent operations

- [#17517](https://github.com/withastro/astro/pull/17517) [`82bf7e2`](https://github.com/withastro/astro/commit/82bf7e2008e3062cb8b32e9500804e71e4bfd30a) Thanks [@Hashim1999164](https://github.com/Hashim1999164)! - Prevents a visible terminal window from popping up on Windows when the dev server runs in background mode. The detached child process is now spawned with `windowsHide: true`, so console-subsystem grandchildren (such as `workerd.exe`) no longer get a new focus-stealing window allocated by Windows Terminal.

- [#17510](https://github.com/withastro/astro/pull/17510) [`eaa1fb0`](https://github.com/withastro/astro/commit/eaa1fb0067406a58490d55686f9f617e4c834905) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes the `glob()` loader watcher so negation patterns like `!docs/drafts/**` correctly exclude files during development, matching the behavior of the initial scan. Previously, negations were treated as independent matchers, causing unrelated files (including `.astro/data-store.json`) to be ingested as collection entries

- [#17511](https://github.com/withastro/astro/pull/17511) [`704e570`](https://github.com/withastro/astro/commit/704e570a43de11450372eb68ec467c154acc2e2e) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes TypeScript path aliases from `tsconfig.json` not resolving in `astro.config.ts`

## 7.1.3

### Patch Changes

- [#17427](https://github.com/withastro/astro/pull/17427) [`630b382`](https://github.com/withastro/astro/commit/630b382ce3303c350154338e59cb5444c5316764) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes image optimization during `astro build` using too many parallel processes in CPU-limited containers. Builds now respect the container's CPU limit, reducing peak memory usage and avoiding out-of-memory crashes.
  </content>
  </invoke>

## 7.1.2

### Patch Changes

- [#17445](https://github.com/withastro/astro/pull/17445) [`a5f7230`](https://github.com/withastro/astro/commit/a5f7230d1caf41ef1e94f9a6b9f6ee01d332455c) Thanks [@ocavue](https://github.com/ocavue)! - Updates dependency `cookie` to v2. Cookie values made entirely of URL-safe characters are no longer percent-encoded in `Set-Cookie` headers; encoded values round-trip exactly as before.

- [#17402](https://github.com/withastro/astro/pull/17402) [`a89c137`](https://github.com/withastro/astro/commit/a89c137a424b4d7bf97df067bba023eccc2317eb) Thanks [@farrosfr](https://github.com/farrosfr)! - Fixes a bug where mutated `Astro.locals` during the request lifecycle are lost and not passed to custom error pages (`404.astro`/`500.astro`)

- [#17405](https://github.com/withastro/astro/pull/17405) [`91992ef`](https://github.com/withastro/astro/commit/91992ef2ccd9a90fa4270633eb4f5d3b811bf315) Thanks [@Araluma](https://github.com/Araluma)! - Prevents an unhandled promise rejection from the prefetch `fetch` fallback. In WebKit (Safari), `<link rel="prefetch">` is unsupported, so prefetch uses the `fetch()` fallback; on a flaky connection that fetch rejects with `TypeError: Load failed`, and because the promise was not awaited or caught, it surfaced as an unhandled rejection to the page's global error handlers. The best-effort prefetch now swallows the failure with `.catch()`.

## 7.1.1

### Patch Changes

- [#17399](https://github.com/withastro/astro/pull/17399) [`4b03702`](https://github.com/withastro/astro/commit/4b0370262ce94a1f426944e659ef7a9c8773f451) Thanks [@matthewp](https://github.com/matthewp)! - Fixes encoded request paths being routed incorrectly when using domain-based i18n

## 7.1.0

### Minor Changes

- [#17302](https://github.com/withastro/astro/pull/17302) [`5f4dc03`](https://github.com/withastro/astro/commit/5f4dc0356f2c2ecf98fa88a257908c9226fac9f1) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Adds a new `deferRender` option to the `glob()` content loader

  When set to `true`, renderable entries (such as Markdown) are not rendered during content sync. Instead, rendering is deferred until the entry is actually rendered in a page, using the same on-demand path that `.mdx` files already use.

  This reduces memory usage during `astro build` for large collections whose rendered output is much larger than the source — for example, Markdown that uses heavy rehype plugins like `rehype-katex`. Such builds could previously run out of memory while storing the eagerly-rendered HTML for every entry.

  ```js
  // src/content.config.ts
  import { defineCollection } from 'astro:content';
  import { glob } from 'astro/loaders';

  const docs = defineCollection({
    loader: glob({ pattern: '**/*.md', base: 'src/content/docs', deferRender: true }),
  });
  ```

  By default `deferRender` is `false`, preserving the existing behavior of rendering entries eagerly during sync so their rendered HTML can be cached across builds.

- [#17296](https://github.com/withastro/astro/pull/17296) [`30698a2`](https://github.com/withastro/astro/commit/30698a2ed525497cdc0fce16d25d1cde0c21473c) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new experimental `collectionStorage` option for controlling how the content layer persists its data store

  By default, Astro serializes the entire content layer data store to a single file (`.astro/data-store.json`). For very large content collections, this file can grow large enough to hit platform file-size limits.

  Set `experimental.collectionStorage: 'chunked'` to instead split the data store across many smaller, content-addressed files inside a `.astro/data-store/` directory, described by a manifest:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      collectionStorage: 'chunked',
    },
  });
  ```

  Because each part file is named by a hash of its contents, unchanged parts keep the same name across builds and are not rewritten, and identical parts are deduplicated. The default value is `'single-file'`, which preserves the current behavior.

- [#17214](https://github.com/withastro/astro/pull/17214) [`44c4989`](https://github.com/withastro/astro/commit/44c4989139e84951c6579db9975a659765cf2b6c) Thanks [@ematipico](https://github.com/ematipico)! - Adds support for the more specific CSP directives `script-src-elem`, `script-src-attr`, `style-src-elem`, and `style-src-attr` through a new `kind` option.

  Previously, [`CSP`](https://docs.astro.build/en/reference/configuration-reference/#securitycsp) was only scoped to generic `script-src`/`style-src` directives. Now each source or hash can be scoped to a narrower directive — for example, to allow inline `style` attributes (such as those from `define:vars` or Shiki) without loosening the policy for your `<style>` and `<link>` elements.

  #### Scoping sources and hashes in your config

  Each entry in `resources` and `hashes` can be an object with a `kind` property. Depending on whether you use `scriptDirective` or `styleDirective`, `"element"` targets `script-src-elem` or `style-src-elem`, `"attribute"` targets `script-src-attr` or `style-src-attr`, and `"default"` (the same as a bare string or hash) targets `script-src` or `style-src`.

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    security: {
      csp: {
        scriptDirective: {
          resources: [{ resource: 'https://cdn.example.com', kind: 'element' }],
        },
        styleDirective: {
          resources: [{ resource: "'unsafe-inline'", kind: 'attribute' }],
        },
      },
    },
  });
  ```

  #### Scoping at runtime

  The same `kind` option is available on the runtime CSP API, where the existing methods now also accept an object:

  ```js
  ctx.csp.insertScriptResource({ resource: 'https://cdn.example.com', kind: 'element' });
  ctx.csp.insertStyleResource({ resource: "'unsafe-inline'", kind: 'attribute' });
  ```

- [#17258](https://github.com/withastro/astro/pull/17258) [`84814d4`](https://github.com/withastro/astro/commit/84814d40bc43eb5827148305656050f26338df5a) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Adds a new `format()` option to the [`paginate`](https://docs.astro.build/en/reference/routing-reference/#paginate) utility. The `format()` option is a function that accepts the current URL of the page, and returns a new URL.

  For example, when your host only supports URLs using the `.html` extension, you can use `format()` to add it to the generated URLs:

  ```astro
  ---
  export async function getStaticPaths({ paginate }) {
    // Load your data with fetch(), getCollection(), etc.
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
    const result = await response.json();
    const allPokemon = result.results;

    // Return a paginated collection of paths for all items
    return paginate(allPokemon, {
      pageSize: 10,
      format: (url) => `${url}.html`,
    });
  }

  const { page } = Astro.props;
  ---
  ```

- [#17331](https://github.com/withastro/astro/pull/17331) [`7db6420`](https://github.com/withastro/astro/commit/7db6420d482fc649886148acaf13e5fbf809db87) Thanks [@matthewp](https://github.com/matthewp)! - Adds a `--ignore-lock` flag to `astro dev` for starting a dev server without checking or writing the lock file, so it can run alongside an already-running dev server for the same project.

  The new instance is not tracked by `astro dev stop`, `astro dev status`, or `astro dev logs`. `--ignore-lock` cannot be combined with `--background` (or an auto-detected AI agent environment, which runs dev servers in the background automatically) or `--force`, since those rely on the lock file.

  ```shell
  astro dev --ignore-lock
  ```

- [#17389](https://github.com/withastro/astro/pull/17389) [`16de021`](https://github.com/withastro/astro/commit/16de02130575c61eb294b382e09bc863cf935ec3) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Allows passing URL entrypoints when configuring the logger

  Matching other APIs like session drivers or font providers, the logger entrypoint can now be a URL:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    logger: {
      entrypoint: new URL('./logger.js', import.meta.url),
    },
  });
  ```

### Patch Changes

- [#17332](https://github.com/withastro/astro/pull/17332) [`4407483`](https://github.com/withastro/astro/commit/4407483e6f9e159164fec83c36d66259baa87e1f) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes the JSON logger crashing with `process is not defined` in non-Node runtimes like Cloudflare's workerd. The JSON logger now uses `console.log`/`console.error` instead of `process.stdout`/`process.stderr`, matching the pattern already used by the console logger.

- [#17391](https://github.com/withastro/astro/pull/17391) [`186a1e7`](https://github.com/withastro/astro/commit/186a1e74c2eb342ea35a73fc2c0b1930b3c08921) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where an integration could not update the logger with `updateConfig()`

- [#17394](https://github.com/withastro/astro/pull/17394) [`d9f99e1`](https://github.com/withastro/astro/commit/d9f99e19e4045da75c7f38650a0f2eeb5c79892b) Thanks [@matthewp](https://github.com/matthewp)! - Fixes element-specific CSP directives to preserve the existing behavior of configured script and style resources

- [#17374](https://github.com/withastro/astro/pull/17374) [`b2d1b3e`](https://github.com/withastro/astro/commit/b2d1b3e485c37fd9e1825310a71acb1e3d011094) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes dev server returning 404 for `?url` imported assets when accessed via browser navigation

- [#17390](https://github.com/withastro/astro/pull/17390) [`ed71eaf`](https://github.com/withastro/astro/commit/ed71eaf2b5eaa837de438eb252e8651a2aa086f6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes an unused and undocumented generic from the `AstroLoggerDestination` type

- [#17393](https://github.com/withastro/astro/pull/17393) [`092da56`](https://github.com/withastro/astro/commit/092da560eea77ee63a3e2c583c80d8238544e42b) Thanks [@matthewp](https://github.com/matthewp)! - Hardens generated transition styles, development metadata, and server island URLs when embedding dynamic values

## 7.0.9

### Patch Changes

- [#17286](https://github.com/withastro/astro/pull/17286) [`a249317`](https://github.com/withastro/astro/commit/a249317e4d03ead215838a5f6f0e6fe70444d5d4) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes the first browser visit after `astro dev` starts triggering an immediate full page reload

- [#17369](https://github.com/withastro/astro/pull/17369) [`a94d4a5`](https://github.com/withastro/astro/commit/a94d4a5afde1fd6de76cb2904703df7eb984b3f0) Thanks [@adamchal](https://github.com/adamchal)! - Fixes an issue where a client island could permanently fail to hydrate if the first attempt to load its component failed. Islands now reliably recover from transient import failures, which previously did not work for React components during `astro dev`.

## 7.0.8

### Patch Changes

- [#17363](https://github.com/withastro/astro/pull/17363) [`3f4efc5`](https://github.com/withastro/astro/commit/3f4efc5d2f4cf2e38f983bf5842bbd953b5bf923) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `astro preview --open` not opening a browser when using an adapter with a custom preview entrypoint, such as `@astrojs/cloudflare`

- [#17313](https://github.com/withastro/astro/pull/17313) [`e2e319d`](https://github.com/withastro/astro/commit/e2e319d4a61bf6b9eff5224c51d8433dfeb9153b) Thanks [@ronits2407](https://github.com/ronits2407)! - Exposes the `AstroRuntimeLogger` interface to allow users to properly type the logger functions at runtime.

- [#17328](https://github.com/withastro/astro/pull/17328) [`025cc74`](https://github.com/withastro/astro/commit/025cc747d3eac4241cb4015a8789963970b0480a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `astro dev --force` not replacing an already-running dev server

- [#17353](https://github.com/withastro/astro/pull/17353) [`2bba277`](https://github.com/withastro/astro/commit/2bba2775e12285b5d7ed0710c6579d808817704d) Thanks [@ematipico](https://github.com/ematipico)! - Updates the Astro compiler to the latest version, which fixes many regressions. Refer to the [changelog](https://github.com/withastro/compiler-rs/releases/tag/%40astrojs/compiler-rs%400.3.1) for more details.

- [#17344](https://github.com/withastro/astro/pull/17344) [`79a41e0`](https://github.com/withastro/astro/commit/79a41e06add3cbb144809f88a0b5ac88d2f8e7d1) Thanks [@adamchal](https://github.com/adamchal)! - Improves rendering performance for pages with many component instances, such as repeated MDX `<Content />` components.

- Updated dependencies [[`64b0d66`](https://github.com/withastro/astro/commit/64b0d6667eabd8fe51643dfdab7004670e319810)]:
  - @astrojs/markdown-satteri@0.3.4

## 7.0.7

### Patch Changes

- [#17318](https://github.com/withastro/astro/pull/17318) [`23a4120`](https://github.com/withastro/astro/commit/23a4120b1ba546521ed66c09cb39e346aee6b75a) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes CSS module scoped-name hash mismatch in `astro dev` when using `vite.css.transformer: 'lightningcss'` with content collections. Previously, a component importing a CSS module and rendered via content collection `render()` would get different class name hashes in the element and the injected `<style>` tag, causing styles not to apply.

- [#17323](https://github.com/withastro/astro/pull/17323) [`4298883`](https://github.com/withastro/astro/commit/4298883399550cae5d5e089d73cb9adadbc2d69b) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a dev server memory leak which caused Node.js to emit warnings in the console.

- [#17323](https://github.com/withastro/astro/pull/17323) [`4298883`](https://github.com/withastro/astro/commit/4298883399550cae5d5e089d73cb9adadbc2d69b) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a dev server crash when a `.html` or `/index.html` suffixed request (such as those `netlify dev` probes as pretty-URL fallbacks) matched a dynamic endpoint route, causing a `TypeError: Missing parameter` error

- [#17325](https://github.com/withastro/astro/pull/17325) [`cebc404`](https://github.com/withastro/astro/commit/cebc40495cd09e8036af34c2f668fc2965e089b0) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a bug where CSS `@import` rules could end up mid-stylesheet after inline CSS chunks were merged during build, causing browsers to silently ignore them

- [#17323](https://github.com/withastro/astro/pull/17323) [`4298883`](https://github.com/withastro/astro/commit/4298883399550cae5d5e089d73cb9adadbc2d69b) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a build regression that could leave unresolved preload markers in inlined scripts with external dynamic imports

- Updated dependencies [[`4298883`](https://github.com/withastro/astro/commit/4298883399550cae5d5e089d73cb9adadbc2d69b), [`4298883`](https://github.com/withastro/astro/commit/4298883399550cae5d5e089d73cb9adadbc2d69b)]:
  - @astrojs/telemetry@3.3.3

## 7.0.6

### Patch Changes

- [#17261](https://github.com/withastro/astro/pull/17261) [`79aa99c`](https://github.com/withastro/astro/commit/79aa99c648b4b40b95a31d4a961b77074cf7963c) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a false deprecation warning for `markdown.gfm` and `markdown.smartypants` when using the Container API

- [#17247](https://github.com/withastro/astro/pull/17247) [`f94280d`](https://github.com/withastro/astro/commit/f94280d61496de38f97a818975bd38529569f3e8) Thanks [@chatman-media](https://github.com/chatman-media)! - Fixes route generation throwing "Missing parameter" (or silently dropping the segment) when a dynamic param's value is `0`. The generator used truthy checks instead of checking for `undefined`, so `paginate(posts, { params: { categoryId: 0 } })` would crash even though `0` is a perfectly valid param value.

- [#17278](https://github.com/withastro/astro/pull/17278) [`6f11739`](https://github.com/withastro/astro/commit/6f11739f2c7b28b108c2d8d0a2012f0711775a8c) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes missing CSS for virtual style modules (e.g., responsive image layout styles) in dev mode when JavaScript is disabled

- [#17250](https://github.com/withastro/astro/pull/17250) [`0b30b35`](https://github.com/withastro/astro/commit/0b30b35f864310bee8485c952d1877e82e2b9b1a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes the `security.checkOrigin` check so it is applied consistently to Astro Actions and on-demand endpoints, regardless of how the request pipeline is composed. Previously, the origin check could be skipped in the composable `astro/hono` pipeline depending on the order of the `middleware()` primitive (or when it was omitted).

- [#17274](https://github.com/withastro/astro/pull/17274) [`8c3579b`](https://github.com/withastro/astro/commit/8c3579b2707703037bd439992a9a4e5efceeda3b) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes missing `render()` type overload for live collection entries. Previously, calling `render()` on a `LiveDataEntry` produced a TypeScript error when using only `live.config.ts` without a `content.config.ts`.

- [#17257](https://github.com/withastro/astro/pull/17257) [`4208297`](https://github.com/withastro/astro/commit/4208297b37d1781bfe54254c0b981eb146e08691) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `astro check` failing to find `@astrojs/check` and `typescript` when astro is installed in a directory outside the project tree (e.g. pnpm virtual store)

- [#17272](https://github.com/withastro/astro/pull/17272) [`b428648`](https://github.com/withastro/astro/commit/b428648a3ce0efe7367933096949d1d18bea0168) Thanks [@matthewp](https://github.com/matthewp)! - Fixes island component paths so that extensionless imports (e.g. `import { Counter } from '../components/Counter'`) resolve to the real file on disk, matching Vite's extension order and directory `index` resolution. This makes the `include`/`exclude` options of JSX renderer integrations (React, Preact, Solid) match components imported without a file extension, and removes the spurious React 19 "Invalid hook call" warning logged on every request in dev when `include` was set alongside another JSX renderer

- [#17279](https://github.com/withastro/astro/pull/17279) [`2aeaa44`](https://github.com/withastro/astro/commit/2aeaa44a23e42426619e680c37bea5b79fb9bc9d) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a bug where `<Picture inferSize>` with a remote image could fail with `FailedToFetchRemoteImageDimensions` when the image server rate-limits requests (e.g. HTTP 429). Remote dimensions are now resolved once per render instead of once per output format.

- [#17251](https://github.com/withastro/astro/pull/17251) [`5240e26`](https://github.com/withastro/astro/commit/5240e26c9dd91f9bc7140dcfacdb48d5a132830d) Thanks [@matthewp](https://github.com/matthewp)! - Hardens the handling of attribute rendering when using with custom elements.

- [#17248](https://github.com/withastro/astro/pull/17248) [`429bd62`](https://github.com/withastro/astro/commit/429bd6287a24770461321696f87edf34758b90fd) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a crash when using Astro's `getViteConfig` with Vitest browser mode (e.g., Storybook vitest runner). Astro now skips dev server setup inside Vitest, preventing errors.

- [#17260](https://github.com/withastro/astro/pull/17260) [`14524c0`](https://github.com/withastro/astro/commit/14524c03f3d7ea84224d4e708488f30902a9f275) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a regression where a `<script>` inside a component rendered through `Astro.slots.render()` was hoisted out of its original position instead of staying next to its component content

- Updated dependencies [[`eb6f97e`](https://github.com/withastro/astro/commit/eb6f97e391ee587747e37609c255c7cd4b9cce3c)]:
  - @astrojs/internal-helpers@0.10.1
  - @astrojs/markdown-remark@7.2.1
  - @astrojs/markdown-satteri@0.3.3

## 7.0.5

### Patch Changes

- [#17242](https://github.com/withastro/astro/pull/17242) [`9c05ba4`](https://github.com/withastro/astro/commit/9c05ba474cee5e3ef5142d88e7e08d53acfbe431) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an error that could occur after the dev server restarts when using an adapter such as `@astrojs/cloudflare`, where a request would fail with a `500` referencing a missing pre-bundled dependency:

  ```
  The file does not exist at "node_modules/.vite/deps_ssr/astro_compiler-runtime.js?v=6419660d" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
  ```

- [#17202](https://github.com/withastro/astro/pull/17202) [`c6d254d`](https://github.com/withastro/astro/commit/c6d254dab889f9b15ec79eab84d8dbf7f7cd0007) Thanks [@matthewp](https://github.com/matthewp)! - Refactors path alias resolution to use Vite's native `tsconfigPaths` option

  This is an internal change with no expected impact on user projects. Astro now defers tsconfig and jsconfig `paths` alias resolution to Vite, keeping a small fallback for a few CSS cases Vite does not yet handle.

- [#17123](https://github.com/withastro/astro/pull/17123) [`72e29bd`](https://github.com/withastro/astro/commit/72e29bd7f9d6c9f86febf5c9b97417bc90de5bb1) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue where the ClientRouter wipes head elements after page transitions if the `<head>` contains a `server:defer` component.

- [#17232](https://github.com/withastro/astro/pull/17232) [`257505e`](https://github.com/withastro/astro/commit/257505ebfd8be87e6b11fd369340245edd0c937a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a bug where `<style>` tags from components such as a content collection's `Content` could be silently dropped from the output when an `await` appeared before the component in an `.astro` file's markup.

- [#17193](https://github.com/withastro/astro/pull/17193) [`a7352fd`](https://github.com/withastro/astro/commit/a7352fda1218bf48d8483a9893c6f7ed9bdf2060) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Fixes the background dev server failing to start when `astro` is hoisted outside the project's `node_modules` (for example bun workspaces). The background process is now spawned from Astro's own resolved location instead of a path assumed under the project root.

- [#17255](https://github.com/withastro/astro/pull/17255) [`581d171`](https://github.com/withastro/astro/commit/581d17113cb192e8b34aa3ad9965fe733e3ca210) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes prefetch not working for links inside `server:defer` components

## 7.0.4

### Patch Changes

- [#17212](https://github.com/withastro/astro/pull/17212) [`7ba0bb1`](https://github.com/withastro/astro/commit/7ba0bb1dc7516e88caff9abd7767322af44b0294) Thanks [@matthewp](https://github.com/matthewp)! - Ensures transition directive values are HTML-escaped when rendered on hydrated islands

- [#17224](https://github.com/withastro/astro/pull/17224) [`dc5e52f`](https://github.com/withastro/astro/commit/dc5e52f96c44a0dbf59edaf0503b53524e4e2da0) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes trailing slash handling for dynamic file endpoints in dev mode. Dynamic file endpoints (e.g., `src/pages/api/[name].json.ts`) with `trailingSlash: "always"` incorrectly required a trailing slash in dev mode, returning 404 for `/api/bar.json` and 200 for `/api/bar.json/`.

- [#17067](https://github.com/withastro/astro/pull/17067) [`23f9446`](https://github.com/withastro/astro/commit/23f9446a5666f249066c18cb9f6a7a4e261eb090) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixed a bug where the development toolbar did not output a warning even though the implicit ARIA role and the manually specified role were duplicated.

- [#17234](https://github.com/withastro/astro/pull/17234) [`d5fbee8`](https://github.com/withastro/astro/commit/d5fbee8ec341049dc5ddc7b6c251b7a859abf437) Thanks [@ocavue](https://github.com/ocavue)! - Adds support for [`sharp` v0.35](https://github.com/lovell/sharp/releases/tag/v0.35.0). pnpm users no longer need to approve `sharp`'s build script (see [`allowBuilds`](https://pnpm.io/settings#allowbuilds)) when on v0.35.

- [#17223](https://github.com/withastro/astro/pull/17223) [`5970ef4`](https://github.com/withastro/astro/commit/5970ef4f7d99b692a54df019e7b3c161ce2f842c) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes `getCollection()` returning empty in dev mode for large content collections (500k+ entries)

- [#17184](https://github.com/withastro/astro/pull/17184) [`799e5cd`](https://github.com/withastro/astro/commit/799e5cd860f85a0d2eb5f77951f7593f474f3ad8) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Upgrades the Rust compiler to the latest, which fixes some bugs. Refer to its [changelog](https://github.com/withastro/compiler-rs/releases/tag/%40astrojs%2Fcompiler-rs%400.3.0) for more information.

- [#17208](https://github.com/withastro/astro/pull/17208) [`da8b573`](https://github.com/withastro/astro/commit/da8b57354b25e2776324848f7e08530ae828e62f) Thanks [@matthewp](https://github.com/matthewp)! - Hardens forwarded header handling so the internal request helper validates `X-Forwarded-Host` against `security.allowedDomains` before trusting `X-Forwarded-For` for `clientAddress`. Previously it only checked that the header was present, which was inconsistent with the public `createRequest` helper. This aligns both code paths; behavior is unchanged for correctly configured proxies.

## 7.0.3

### Patch Changes

- [#17189](https://github.com/withastro/astro/pull/17189) [`24d2c9e`](https://github.com/withastro/astro/commit/24d2c9ec71ffcceb853762bb1295e1d893bdd4d6) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a bug where an error thrown inside one route's `getStaticPaths()` would prevent other valid routes from being matched in dev mode

- [#16932](https://github.com/withastro/astro/pull/16932) [`8f4a3db`](https://github.com/withastro/astro/commit/8f4a3db415f227b5c742c16ad18f764e952f91bd) Thanks [@fkatsuhiro](https://github.com/fkatsuhiro)! - Fixes HMR for action files during development. Editing files in `src/actions/` now takes effect on the next request without requiring a dev server restart.

- [#17087](https://github.com/withastro/astro/pull/17087) [`fb0ab02`](https://github.com/withastro/astro/commit/fb0ab02f019efd222e6976d72bcd618fd915bc1d) Thanks [@jp-knj](https://github.com/jp-knj)! - Fixes localized custom error pages in i18n projects so routes like `/pt/404` are used for missing localized pages and return the correct status code

## 7.0.2

### Patch Changes

- Updated dependencies [[`3b5e994`](https://github.com/withastro/astro/commit/3b5e994738cf58c9eed0774ce779b685c31a3a5c)]:
  - @astrojs/markdown-satteri@0.3.2

## 7.0.1

### Patch Changes

- [#17151](https://github.com/withastro/astro/pull/17151) [`ccceda3`](https://github.com/withastro/astro/commit/ccceda31550668dc8422e027475a3d0729c18d33) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `astro dev` incorrectly starting in background mode for Warp terminal users. Hybrid environments like Warp are no longer treated as AI agents for auto-background detection.

- [#17158](https://github.com/withastro/astro/pull/17158) [`164df87`](https://github.com/withastro/astro/commit/164df87aee81c1ca5cd38514301673a40e9975c7) Thanks [@ematipico](https://github.com/ematipico)! - Fixes `astro dev --background --host` not listing the network addresses. The background server start output and `astro dev status` now show every exposed network URL, matching the foreground dev server.

- [#17141](https://github.com/withastro/astro/pull/17141) [`d785b9d`](https://github.com/withastro/astro/commit/d785b9d6d2f014995ec8cb09ed5b50c49d9054d3) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes responsive image CSS overriding user styles defined inside CSS `@layer` blocks. The generated image styles are now wrapped in `@layer astro.images`, ensuring they have lower cascade priority than user-defined layers.

- [#17150](https://github.com/withastro/astro/pull/17150) [`1a61386`](https://github.com/withastro/astro/commit/1a613868c2dca8d8dd8cef99fd8e4b5cde0ba1e7) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `astro dev --background` failing on Windows with "Failed to spawn background dev server process"

## 7.0.0

### Major Changes

- [#15819](https://github.com/withastro/astro/pull/15819) [`cafec4e`](https://github.com/withastro/astro/commit/cafec4e23365061491103dfce2e889a15cf86f27) Thanks [@delucis](https://github.com/delucis)! - Upgrade to Vite v8

- [#16965](https://github.com/withastro/astro/pull/16965) [`57ead0d`](https://github.com/withastro/astro/commit/57ead0d5938e5988e3f896f3d6f8ef4516c4923f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Makes `'jsx'` the default value for `compressHTML`

  Astro now strips whitespace from your HTML using JSX rules by default, the same way frameworks like React do. Whitespace and line breaks around elements are removed, but meaningful whitespace within a single line — like a space between two inline elements — is preserved. To keep a space that would otherwise be removed, write it explicitly in your source, for example with `{" "}`.

  This can change rendered output where whitespace between inline elements was previously meaningful. To keep Astro's earlier behavior, set `compressHTML: true` for HTML-aware compression, or `compressHTML: false` to preserve all whitespace.

- [#16610](https://github.com/withastro/astro/pull/16610) [`c63e7e4`](https://github.com/withastro/astro/commit/c63e7e4411db8fc652c84ce82b45f53e951eb6fa) Thanks [@matthewp](https://github.com/matthewp)! - Adds background dev server management for AI coding agents.

  When an AI coding agent is detected, `astro dev` now automatically starts the dev server as a detached background process. This prevents the dev server from blocking the agent's terminal and allows it to continue working while the server runs.

  A lock file (`.astro/dev.json`) is written when the dev server starts, recording the server's URL, port, and PID. This prevents duplicate servers from being started for the same project.

  #### New flag and subcommands
  - `astro dev --background` — Start the dev server as a background process (this is what runs automatically when an agent is detected).
  - `astro dev stop` — Stop a running background dev server.
  - `astro dev status` — Check if a dev server is running and display its URL, PID, and uptime.
  - `astro dev logs` — View logs from a background dev server. Use `--follow` (`-f`) to stream new output as it's written.

  These allow you to start and manage dev servers programmatically and were designed with AI coding agents in mind.

  #### What should I do?

  No action is required. If you are not using an AI coding agent, `astro dev` behaves exactly as before. If you are using an agent, background mode is enabled automatically — the agent will receive the server URL and PID, and can use `astro dev stop` to shut it down.

  To opt out of automatic background mode when an agent is detected, set the environment variable `ASTRO_DEV_BACKGROUND=0` before running `astro dev`.

- [#17010](https://github.com/withastro/astro/pull/17010) [`0606073`](https://github.com/withastro/astro/commit/0606073794ddda42cac1f3e1ca56bbfc7cb178eb) Thanks [@ocavue](https://github.com/ocavue)! - Removes the `@astrojs/db` package as it is no longer maintained.

  The `@astrojs/db` package were deprecated in v6.4.5 and is now removed. This means the `astro db`, `astro login`, `astro logout`, `astro link`, and `astro init` CLI commands have also been removed.

  If you were using Astro DB in your project, remove `@astrojs/db` from your project's dependencies and replace it with one of the following alternatives:
  - **Node.js built-in SQLite**: Node.js now includes a built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) module (available since Node.js v22.5.0). This is a good option if you are using the Node.js adapter and were using `@astrojs/db` for local SQLite storage.
  - **[Drizzle ORM](https://orm.drizzle.team/)**: If you were using `@astrojs/db` for its Drizzle-based schema and query API, you can use Drizzle directly with any supported database.
  - **Other database libraries**: Use any database library that suits your deployment platform (e.g. [Turso](https://turso.tech/), [PlanetScale](https://planetscale.com/), [Neon](https://neon.tech/)).

- [#16462](https://github.com/withastro/astro/pull/16462) [`c30a778`](https://github.com/withastro/astro/commit/c30a7789a477e44826c54c8560587d09dc46a229) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Replaces the Go compiler with a Rust-based version.

  The Rust-based Astro compiler (`@astrojs/compiler-rs`) is now the default compiler. This new compiler is faster and more reliable, leading to faster build times and iteration cycles during development.

  This new compiler is more strict regarding invalid syntax. For example, unclosed HTML tags will now throw an error instead of being ignored. It also does not attempt to correct semantically invalid HTML anymore, instead leaving it to the browser to handle, similar to other tools or `document.write()` in JavaScript.

  The previous Go-based compiler has been removed, along with the `experimental.rustCompiler` flag used to opt into the Rust compiler. If you were setting `experimental.rustCompiler` in your `astro.config.mjs`, you can now remove it. No other action is required.

- [#16966](https://github.com/withastro/astro/pull/16966) [`6650ec2`](https://github.com/withastro/astro/commit/6650ec24e81bb9fdf2fcec3dc07154b94d41cb61) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Makes Sätteri the default Markdown processor

  Astro now renders `.md` files with `satteri()` from `@astrojs/markdown-satteri`, its native Markdown pipeline, instead of the remark/rehype pipeline. `@astrojs/markdown-remark` is no longer installed by default.

  To keep using the remark/rehype pipeline, install `@astrojs/markdown-remark` and set it as your processor:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import { unified } from '@astrojs/markdown-remark';

  export default defineConfig({
    markdown: {
      processor: unified(),
    },
  });
  ```

  The deprecated `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` options still work, but now require `@astrojs/markdown-remark` to be used.

- [#16877](https://github.com/withastro/astro/pull/16877) [`3b7d76e`](https://github.com/withastro/astro/commit/3b7d76e6decff6b236d1b30d901b4fa339edb960) Thanks [@matthewp](https://github.com/matthewp)! - Enables advanced routing by default.

  The advanced routing feature introduced behind a flag in [v6.3.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#630) is no longer experimental and is now enabled by default.

  This gives full control over how requests flow through your application, with first-class support for frameworks like Hono.

  Advanced routing now uses `src/fetch.ts` as default entrypoint instead of `src/app.ts`.

  If you were previously using this feature without a custom entrypoint, please configure `fetchFile` or rename your entrypoint to `src/fetch.ts`, and then remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental {
  -    advancedRouting: true,
    },
  +  fetchFile: 'app.ts' // optional, you only need this if you cannot rename your entrypoint.
  });
  ```

  `fetchFile` is now a top-level config option instead of being nested under `experimental.advancedRouting`. If you were using a custom entrypoint, please update your Astro config to move its configuration:

  ```diff
  // astro.config.mjs
  export default defineConfig({
  -  experimental: {
  -    advancedRouting: {
  -      fetchFile: 'my-custom-entrypoint.ts',
  -    },
  -  },
  +  fetchFile: 'my-custom-entrypoint.ts',
  })
  ```

  You can also set `fetchFile: null` to disable the entrypoint if you are using `src/fetch.ts` for another purpose, or don’t need advanced routing features.

  If you have been waiting for stabilization before using advanced routing, you can now do so.

  Please see [the advanced routing guide in docs](https://docs.astro.build/en/guides/routing/#advanced-routing) for more about this feature.

- [#16725](https://github.com/withastro/astro/pull/16725) [`10229f7`](https://github.com/withastro/astro/commit/10229f73dbf0f19b9936e9a23f0abc774a4c579e) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Removes deprecated APIs exported from `astro:transitions`.

  In Astro 6.x, some helpers available in `astro:transitions` and `astro:transitions/client` were deprecated.

  In Astro 7.0, the following APIs can no longer be used in your project:
  - `TRANSITION_BEFORE_PREPARATION`
  - `TRANSITION_AFTER_PREPARATION`
  - `TRANSITION_BEFORE_SWAP`
  - `TRANSITION_AFTER_SWAP`
  - `TRANSITION_PAGE_LOAD`
  - `isTransitionBeforePreparationEvent()`
  - `isTransitionBeforeSwapEvent()`
  - `createAnimationScope()`

  #### What should I do?

  Remove any occurrence of `createAnimationScope()`:

  ```diff
  -import { createAnimationScope } from 'astro:transitions';
  ```

  Replace any occurrence of the other APIs using the lifecycle event names directly:

  ```diff
  -import {
  -	TRANSITION_AFTER_SWAP,
  -	isTransitionBeforePreparationEvent,
  -} from 'astro:transitions/client';

  -console.log(isTransitionBeforePreparationEvent(event));
  +console.log(event.type === 'astro:before-preparation');

  -console.log(TRANSITION_AFTER_SWAP);
  +console.log('astro:after-swap');
  ```

  Learn more about all utilities available in the [View Transitions Router API Reference](https://docs.astro.build/en/reference/modules/astro-transitions/).

### Minor Changes

- [#16998](https://github.com/withastro/astro/pull/16998) [`57dcc31`](https://github.com/withastro/astro/commit/57dcc31bb78575a89304ab5310f2f5911a83f3af) Thanks [@matthewp](https://github.com/matthewp)! - Exposes `getFetchState()` from `astro/hono` as a public API

  The `getFetchState()` function retrieves or lazily creates a `FetchState` from a Hono context object. This allows third-party packages to build Hono middleware that interacts with Astro's per-request state, giving the `astro/hono` API the same extensibility as `astro/fetch`.

  ```ts
  import { Hono } from 'hono';
  import { getFetchState, pages } from 'astro/hono';

  const app = new Hono();

  app.use(async (context, next) => {
    const state = getFetchState(context);
    state.locals.message = 'Hello from custom middleware';
    await next();
  });

  app.use(pages());

  export default app;
  ```

- [#16996](https://github.com/withastro/astro/pull/16996) [`300641e`](https://github.com/withastro/astro/commit/300641e588ac74968197bd87e0a97f71d132946e) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a `subset` field to the `FontData` type exposed via `fontData` from `astro:assets`. When using multiple font subsets (e.g., `subsets: ["latin", "korean"]`), each font data entry now includes the subset name, making it possible to distinguish between font entries for different subsets that share the same weight and style.

- [#16745](https://github.com/withastro/astro/pull/16745) [`f864a80`](https://github.com/withastro/astro/commit/f864a808c5dd83e19be66bb5227edffbe506a697) Thanks [@ematipico](https://github.com/ematipico)! - The custom logger feature introduced behind a flag in [v6.2.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#620) is no longer experimental and is available for general use.

  This feature provides better control over Astro's logging infrastructure by allowing you to replace the default console output with custom logging implementations (e.g., structured JSON). This is particularly useful for on-demand rendering when connecting to log aggregation services such as Kibana, Logstash, CloudWatch, Grafana, or Loki.

  Astro provides three built-in log handlers (`json`, `node`, and `console`), and you can also create your own.

  #### JSON logging

  ```js
  import { defineConfig, logHandlers } from 'astro/config';

  export default defineConfig({
    logger: logHandlers.json({
      pretty: true,
      level: 'warn',
    }),
  });
  ```

  #### Custom logger

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    logger: {
      entrypoint: '@org/custom-logger',
    },
  });
  ```

  Additionally, `context.logger` is now always available in API routes and middleware, even without a custom logger configured.

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  -  experimental: {
  -    logger: {
  -      entrypoint: '@org/custom-logger',
  -    },
  -  },
  +  logger: {
  +    entrypoint: '@org/custom-logger',
  +  },
  });
  ```

  If you have been waiting for stabilization before using custom loggers, you can now do so.

  Please see the [Logger docs](https://docs.astro.build/en/reference/configuration-reference/#logger) for more about this feature.

- [#16981](https://github.com/withastro/astro/pull/16981) [`0d6d644`](https://github.com/withastro/astro/commit/0d6d64433fa31762b6fd593da902f63f3204e02a) Thanks [@ematipico](https://github.com/ematipico)! - Removes the setting `experimental.queuedRendering`. The new rendering engine is now stable and replaces the old one.

  As part of the stabilization, the queued rendering has been improved, and some features have been removed:
  - The construction of the queue has been removed, instead now Astro uses a streaming approach where components are rendered and flushed as they are encountered.
  - The node polling feature has been removed because it doesn't yield concrete savings.
  - The content cache has been descoped, and how only tag names are cached.
    If you were previously using this experimental feature, you must remove this experimental flag from your configuration as it no longer exists:

  ```diff
  // astro.config.mjs
  import { defineConfig } from "astro/config";

  export default defineConfig({
    experimental: {
  -    queuedRendering: {}
    }
  });
  ```

- [#17116](https://github.com/withastro/astro/pull/17116) [`f95e58e`](https://github.com/withastro/astro/commit/f95e58eaa6a6d7ac02f84193b485471f0cd14de6) Thanks [@ascorbic](https://github.com/ascorbic)! - Stabilizes route caching, removing the `experimental.cache` and `experimental.routeRules` flags and replacing them with the top-level `cache` and `routeRules` configuration options.

  Route caching, introduced experimentally in v6.0.0, is now stable. It gives you a platform-agnostic way to cache responses from [on-demand rendered](https://docs.astro.build/en/guides/on-demand-rendering/) pages and endpoints, based on standard HTTP caching semantics.

  Update your config to move `cache` and `routeRules` out of the `experimental` block:

  ```diff
  // astro.config.mjs
  import { defineConfig, memoryCache } from 'astro/config';

  export default defineConfig({
  -  experimental: {
  -    cache: {
  -      provider: memoryCache(),
  -    },
  -    routeRules: {
  -      '/blog/[...path]': { maxAge: 300, swr: 60 },
  -    },
  -  },
  +  cache: {
  +    provider: memoryCache(),
  +  },
  +  routeRules: {
  +    '/blog/[...path]': { maxAge: 300, swr: 60 },
  +  },
  });
  ```

  Set caching directives in your routes with `Astro.cache` (in `.astro` pages) or `context.cache` (in API routes and middleware), and Astro translates them into the appropriate headers or runtime behavior depending on your configured cache provider. You can also define cache rules for routes declaratively in your config using `routeRules`, without modifying route code.

  See the [route caching guide](https://docs.astro.build/en/guides/caching/) for more information.

### Patch Changes

- [#16980](https://github.com/withastro/astro/pull/16980) [`1f07343`](https://github.com/withastro/astro/commit/1f07343ffc69b9c982f43cd0369069fe8d1a07fa) Thanks [@matthewp](https://github.com/matthewp)! - Removes `state.provide()`, `state.resolve()`, `state.finalizeAll()`, and `App.Providers` from the public advanced routing API. These context provider extension points are now internal-only. If you were using them in an integration, use `locals` to share per-request state instead.

- [#17111](https://github.com/withastro/astro/pull/17111) [`c0f33ed`](https://github.com/withastro/astro/commit/c0f33eda8adf6f8f2588688f6205b76a96a42466) Thanks [@ematipico](https://github.com/ematipico)! - Harden the limits on the number of decoding on the URL.

- [#16982](https://github.com/withastro/astro/pull/16982) [`1e000e2`](https://github.com/withastro/astro/commit/1e000e2454fbbade0a5ed978a9dccf8307780305) Thanks [@matthewp](https://github.com/matthewp)! - Improves the warning when accessing `Astro.session` without session storage configured. The `session` property is now always defined on the context object, and accessing it without configuration logs a helpful message instead of silently returning `undefined`.

- [#16335](https://github.com/withastro/astro/pull/16335) [`9a53f77`](https://github.com/withastro/astro/commit/9a53f77d35e76bcb0165b44cbd2b7e48d48c9f59) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds shared helper utilities for CDN cache provider authors for [route caching](https://docs.astro.build/en/guides/caching/)

  Exports `astro/cache/provider-utils` with helpers for building platform-specific cache-control headers, generating path-based invalidation tags, and normalizing invalidation options. These are used internally by the first-party Netlify, Vercel, and Cloudflare cache providers.

- [#17095](https://github.com/withastro/astro/pull/17095) [`e84ebc0`](https://github.com/withastro/astro/commit/e84ebc0af84a13a26ea412460cbc491f81135ae5) Thanks [@matthewp](https://github.com/matthewp)! - Improves build performance by removing an unfiltered transform hook from the `astro:head-metadata-build` plugin. Head propagation modules are now identified by their module ID (`?astroPropagatedAssets`) instead of scanning every module's source code.

- [#17041](https://github.com/withastro/astro/pull/17041) [`4c4a91c`](https://github.com/withastro/astro/commit/4c4a91c3ef3e3316cb9faa32e37c69d69902b956) Thanks [@iseraph-dev](https://github.com/iseraph-dev)! - Fixes a bug where the advanced routing `astro/hono` / `astro/fetch` `pages()` handler returned the host framework's default `Internal Server Error` response instead of rendering the custom `500.astro` page when a page threw during render. Unmatched requests with a prerendered (or absent) custom 404 page now render the 404 error page instead of failing the same way.

- [#17097](https://github.com/withastro/astro/pull/17097) [`5e340d7`](https://github.com/withastro/astro/commit/5e340d7d81aae72215d56b8c598d350b79ad94a3) Thanks [@iseraph-dev](https://github.com/iseraph-dev)! - Fixes a bug where the advanced routing `astro/hono` / `astro/fetch` `middleware()` handler returned the host framework's default `Internal Server Error` response instead of rendering the custom `500.astro` page when middleware threw. Unmatched requests with a prerendered (or absent) custom 404 page now render the 404 error page instead of failing the same way. Errors surfaced through `next` (the host framework's downstream chain) still propagate to the host's own error handler.

- [#15819](https://github.com/withastro/astro/pull/15819) [`cafec4e`](https://github.com/withastro/astro/commit/cafec4e23365061491103dfce2e889a15cf86f27) Thanks [@delucis](https://github.com/delucis)! - Fixes `--port` flag being ignored after a Vite-triggered server restart (e.g. when a `.env` file changes)

- [#17104](https://github.com/withastro/astro/pull/17104) [`b074a37`](https://github.com/withastro/astro/commit/b074a37c5ab9364529080b3283cf9be8a6350e34) Thanks [@iseraph-dev](https://github.com/iseraph-dev)! - Fixes the custom `500.astro` page receiving an empty `error` prop when the error originated in middleware.

- [#17078](https://github.com/withastro/astro/pull/17078) [`04547ec`](https://github.com/withastro/astro/commit/04547eca5bc6b8c1b3b95398ccc49c870a68c34c) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a spurious `Astro.request.headers` warning on prerendered pages when `security.allowedDomains` is configured. The internal `allowedDomains` header validation now skips prerendered routes, since they use synthetic requests with no real headers.

- [#16603](https://github.com/withastro/astro/pull/16603) [`deaaf3f`](https://github.com/withastro/astro/commit/deaaf3f734bb2f2c8df20559ac83634f418bea18) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removes the warning that Astro does not support vite v8, since Astro v7 does support vite v8

- [#16335](https://github.com/withastro/astro/pull/16335) [`9a53f77`](https://github.com/withastro/astro/commit/9a53f77d35e76bcb0165b44cbd2b7e48d48c9f59) Thanks [@ascorbic](https://github.com/ascorbic)! - Passes the `Request` object to `CacheProvider.setHeaders()` for [route caching](https://docs.astro.build/en/guides/caching/)

  Cache providers now receive the incoming `Request` as a second argument to `setHeaders(options, request)`. This allows CDN providers to read the request URL, headers, and other properties when generating cache response headers, for example to auto-tag responses with their pathname for path-based invalidation.

- [#17098](https://github.com/withastro/astro/pull/17098) [`637a1b6`](https://github.com/withastro/astro/commit/637a1b6c6fe58fd271faf4ee7555787e4f4a0b9a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes internal Astro headers leaking from direct `pages()` handler responses

- [#17090](https://github.com/withastro/astro/pull/17090) [`3cf76c0`](https://github.com/withastro/astro/commit/3cf76c035eef5954637e78015be9c20d0129599a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Vite and Rolldown build warnings

- [#16434](https://github.com/withastro/astro/pull/16434) [`ee079d4`](https://github.com/withastro/astro/commit/ee079d4c7f143076b84d663c832911009a077c7f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where i18n domains would return 404 when `trailingSlash` is set to `never`.

- Updated dependencies [[`7e7ab87`](https://github.com/withastro/astro/commit/7e7ab8775f1c70e00e30db9d3c4796246eaf1c5f), [`ff7b718`](https://github.com/withastro/astro/commit/ff7b718a301b8edc7d7db6626f65e69ce35823a7), [`241250b`](https://github.com/withastro/astro/commit/241250bf126f39c86a8aedd38df106e533301752)]:
  - @astrojs/markdown-satteri@0.3.1

## 7.0.0-beta.6

### Minor Changes

- [#17116](https://github.com/withastro/astro/pull/17116) [`f95e58e`](https://github.com/withastro/astro/commit/f95e58eaa6a6d7ac02f84193b485471f0cd14de6) Thanks [@ascorbic](https://github.com/ascorbic)! - Stabilizes route caching, removing the `experimental.cache` and `experimental.routeRules` flags and replacing them with the top-level `cache` and `routeRules` configuration options.

  Route caching, introduced experimentally in v6.0.0, is now stable. It gives you a platform-agnostic way to cache responses from [on-demand rendered](https://docs.astro.build/en/guides/on-demand-rendering/) pages and endpoints, based on standard HTTP caching semantics.

  Update your config to move `cache` and `routeRules` out of the `experimental` block:

  ```diff
  // astro.config.mjs
  import { defineConfig, memoryCache } from 'astro/config';

  export default defineConfig({
  -  experimental: {
  -    cache: {
  -      provider: memoryCache(),
  -    },
  -    routeRules: {
  -      '/blog/[...path]': { maxAge: 300, swr: 60 },
  -    },
  -  },
  +  cache: {
  +    provider: memoryCache(),
  +  },
  +  routeRules: {
  +    '/blog/[...path]': { maxAge: 300, swr: 60 },
  +  },
  });
  ```

  Set caching directives in your routes with `Astro.cache` (in `.astro` pages) or `context.cache` (in API routes and middleware), and Astro translates them into the appropriate headers or runtime behavior depending on your configured cache provider. You can also define cache rules for routes declaratively in your config using `routeRules`, without modifying route code.

  See the [route caching guide](https://docs.astro.build/en/guides/caching/) for more information.

### Patch Changes

- [#17090](https://github.com/withastro/astro/pull/17090) [`3cf76c0`](https://github.com/withastro/astro/commit/3cf76c035eef5954637e78015be9c20d0129599a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Vite and Rolldown build warnings

- Updated dependencies [[`7e7ab87`](https://github.com/withastro/astro/commit/7e7ab8775f1c70e00e30db9d3c4796246eaf1c5f)]:
  - @astrojs/markdown-satteri@0.3.1-beta.2

## 7.0.0-beta.5

### Major Changes

- [#16965](https://github.com/withastro/astro/pull/16965) [`57ead0d`](https://github.com/withastro/astro/commit/57ead0d5938e5988e3f896f3d6f8ef4516c4923f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Makes `'jsx'` the default value for `compressHTML`

  Astro now strips whitespace from your HTML using JSX rules by default, the same way frameworks like React do. Whitespace and line breaks around elements are removed, but meaningful whitespace within a single line — like a space between two inline elements — is preserved. To keep a space that would otherwise be removed, write it explicitly in your source, for example with `{" "}`.

  This can change rendered output where whitespace between inline elements was previously meaningful. To keep Astro's earlier behavior, set `compressHTML: true` for HTML-aware compression, or `compressHTML: false` to preserve all whitespace.

### Patch Changes

- [#17111](https://github.com/withastro/astro/pull/17111) [`c0f33ed`](https://github.com/withastro/astro/commit/c0f33eda8adf6f8f2588688f6205b76a96a42466) Thanks [@ematipico](https://github.com/ematipico)! - Harden the limits on the number of decoding on the URL.

- [#17095](https://github.com/withastro/astro/pull/17095) [`e84ebc0`](https://github.com/withastro/astro/commit/e84ebc0af84a13a26ea412460cbc491f81135ae5) Thanks [@matthewp](https://github.com/matthewp)! - Improves build performance by removing an unfiltered transform hook from the `astro:head-metadata-build` plugin. Head propagation modules are now identified by their module ID (`?astroPropagatedAssets`) instead of scanning every module's source code.

- [#17041](https://github.com/withastro/astro/pull/17041) [`4c4a91c`](https://github.com/withastro/astro/commit/4c4a91c3ef3e3316cb9faa32e37c69d69902b956) Thanks [@iseraph-dev](https://github.com/iseraph-dev)! - Fixes a bug where the advanced routing `astro/hono` / `astro/fetch` `pages()` handler returned the host framework's default `Internal Server Error` response instead of rendering the custom `500.astro` page when a page threw during render. Unmatched requests with a prerendered (or absent) custom 404 page now render the 404 error page instead of failing the same way.

- [#17097](https://github.com/withastro/astro/pull/17097) [`5e340d7`](https://github.com/withastro/astro/commit/5e340d7d81aae72215d56b8c598d350b79ad94a3) Thanks [@iseraph-dev](https://github.com/iseraph-dev)! - Fixes a bug where the advanced routing `astro/hono` / `astro/fetch` `middleware()` handler returned the host framework's default `Internal Server Error` response instead of rendering the custom `500.astro` page when middleware threw. Unmatched requests with a prerendered (or absent) custom 404 page now render the 404 error page instead of failing the same way. Errors surfaced through `next` (the host framework's downstream chain) still propagate to the host's own error handler.

- [#17104](https://github.com/withastro/astro/pull/17104) [`b074a37`](https://github.com/withastro/astro/commit/b074a37c5ab9364529080b3283cf9be8a6350e34) Thanks [@iseraph-dev](https://github.com/iseraph-dev)! - Fixes the custom `500.astro` page receiving an empty `error` prop when the error originated in middleware.

- [#17098](https://github.com/withastro/astro/pull/17098) [`637a1b6`](https://github.com/withastro/astro/commit/637a1b6c6fe58fd271faf4ee7555787e4f4a0b9a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes internal Astro headers leaking from direct `pages()` handler responses

## 7.0.0-beta.4

### Major Changes

- [#16966](https://github.com/withastro/astro/pull/16966) [`6650ec2`](https://github.com/withastro/astro/commit/6650ec24e81bb9fdf2fcec3dc07154b94d41cb61) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Makes Sätteri the default Markdown processor

  Astro now renders `.md` files with `satteri()` from `@astrojs/markdown-satteri`, its native Markdown pipeline, instead of the remark/rehype pipeline. `@astrojs/markdown-remark` is no longer installed by default.

  To keep using the remark/rehype pipeline, install `@astrojs/markdown-remark` and set it as your processor:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import { unified } from '@astrojs/markdown-remark';

  export default defineConfig({
    markdown: {
      processor: unified(),
    },
  });
  ```

  The deprecated `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` options still work, but now require `@astrojs/markdown-remark` to be used.

### Patch Changes

- [#17078](https://github.com/withastro/astro/pull/17078) [`04547ec`](https://github.com/withastro/astro/commit/04547eca5bc6b8c1b3b95398ccc49c870a68c34c) Thanks [@astrobot-houston](https://github.com/astrobot-houston)! - Fixes a spurious `Astro.request.headers` warning on prerendered pages when `security.allowedDomains` is configured. The internal `allowedDomains` header validation now skips prerendered routes, since they use synthetic requests with no real headers.

## 7.0.0-beta.3

### Major Changes

- [#17010](https://github.com/withastro/astro/pull/17010) [`0606073`](https://github.com/withastro/astro/commit/0606073794ddda42cac1f3e1ca56bbfc7cb178eb) Thanks [@ocavue](https://github.com/ocavue)! - Removes the `astro db`, `astro login`, `astro logout`, `astro link`, and `astro init` CLI commands.

  The `@astrojs/db` package is now deprecated. We recommend using a database client (Drizzle, Kysely, etc.) directly instead.

- [#16877](https://github.com/withastro/astro/pull/16877) [`3b7d76e`](https://github.com/withastro/astro/commit/3b7d76e6decff6b236d1b30d901b4fa339edb960) Thanks [@matthewp](https://github.com/matthewp)! - Enables advanced routing by default.

  The advanced routing feature introduced behind a flag in [v6.3.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#630) is no longer experimental and is now enabled by default.

  This gives full control over how requests flow through your application, with first-class support for frameworks like Hono.

  Advanced routing now uses `src/fetch.ts` as default entrypoint instead of `src/app.ts`.

  If you were previously using this feature without a custom entrypoint, please configure `fetchFile` or rename your entrypoint to `src/fetch.ts`, and then remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental {
  -    advancedRouting: true,
    },
  +  fetchFile: 'app.ts' // optional, you only need this if you cannot rename your entrypoint.
  });
  ```

  `fetchFile` is now a top-level config option instead of being nested under `experimental.advancedRouting`. If you were using a custom entrypoint, please update your Astro config to move its configuration:

  ```diff
  // astro.config.mjs
  export default defineConfig({
  -  experimental: {
  -    advancedRouting: {
  -      fetchFile: 'my-custom-entrypoint.ts',
  -    },
  -  },
  +  fetchFile: 'my-custom-entrypoint.ts',
  })
  ```

  You can also set `fetchFile: null` to disable the entrypoint if you are using `src/fetch.ts` for another purpose, or don’t need advanced routing features.

  If you have been waiting for stabilization before using advanced routing, you can now do so.

  Please see [the advanced routing guide in docs](https://docs.astro.build/en/guides/routing/#advanced-routing) for more about this feature.

### Minor Changes

- [#16998](https://github.com/withastro/astro/pull/16998) [`57dcc31`](https://github.com/withastro/astro/commit/57dcc31bb78575a89304ab5310f2f5911a83f3af) Thanks [@matthewp](https://github.com/matthewp)! - Exposes `getFetchState()` from `astro/hono` as a public API

  The `getFetchState()` function retrieves or lazily creates a `FetchState` from a Hono context object. This allows third-party packages to build Hono middleware that interacts with Astro's per-request state, giving the `astro/hono` API the same extensibility as `astro/fetch`.

  ```ts
  import { Hono } from 'hono';
  import { getFetchState, pages } from 'astro/hono';

  const app = new Hono();

  app.use(async (context, next) => {
    const state = getFetchState(context);
    state.locals.message = 'Hello from custom middleware';
    await next();
  });

  app.use(pages());

  export default app;
  ```

- [#16996](https://github.com/withastro/astro/pull/16996) [`300641e`](https://github.com/withastro/astro/commit/300641e588ac74968197bd87e0a97f71d132946e) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a `subset` field to the `FontData` type exposed via `fontData` from `astro:assets`. When using multiple font subsets (e.g., `subsets: ["latin", "korean"]`), each font data entry now includes the subset name, making it possible to distinguish between font entries for different subsets that share the same weight and style.

- [#16745](https://github.com/withastro/astro/pull/16745) [`f864a80`](https://github.com/withastro/astro/commit/f864a808c5dd83e19be66bb5227edffbe506a697) Thanks [@ematipico](https://github.com/ematipico)! - The custom logger feature introduced behind a flag in [v6.2.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#620) is no longer experimental and is available for general use.

  This feature provides better control over Astro's logging infrastructure by allowing you to replace the default console output with custom logging implementations (e.g., structured JSON). This is particularly useful for on-demand rendering when connecting to log aggregation services such as Kibana, Logstash, CloudWatch, Grafana, or Loki.

  Astro provides three built-in log handlers (`json`, `node`, and `console`), and you can also create your own.

  #### JSON logging

  ```js
  import { defineConfig, logHandlers } from 'astro/config';

  export default defineConfig({
    logger: logHandlers.json({
      pretty: true,
      level: 'warn',
    }),
  });
  ```

  #### Custom logger

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    logger: {
      entrypoint: '@org/custom-logger',
    },
  });
  ```

  Additionally, `context.logger` is now always available in API routes and middleware, even without a custom logger configured.

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  -  experimental: {
  -    logger: {
  -      entrypoint: '@org/custom-logger',
  -    },
  -  },
  +  logger: {
  +    entrypoint: '@org/custom-logger',
  +  },
  });
  ```

  If you have been waiting for stabilization before using custom loggers, you can now do so.

  Please see the [Logger docs](https://docs.astro.build/en/reference/configuration-reference/#logger) for more about this feature.

- [#16981](https://github.com/withastro/astro/pull/16981) [`0d6d644`](https://github.com/withastro/astro/commit/0d6d64433fa31762b6fd593da902f63f3204e02a) Thanks [@ematipico](https://github.com/ematipico)! - Removes the setting `experimental.queuedRendering`. The new rendering engine is now stable and replaces the old one.

  As part of the stabilization, the queued rendering has been improved, and some features have been removed:
  - The construction of the queue has been removed, instead now Astro uses a streaming approach where components are rendered and flushed as they are encountered.
  - The node polling feature has been removed because it doesn't yield concrete savings.
  - The content cache has been descoped, and how only tag names are cached.
    If you were previously using this experimental feature, you must remove this experimental flag from your configuration as it no longer exists:

  ```diff
  // astro.config.mjs
  import { defineConfig } from "astro/config";

  export default defineConfig({
    experimental: {
  -    queuedRendering: {}
    }
  });
  ```

## 7.0.0-alpha.2

### Major Changes

- [#16610](https://github.com/withastro/astro/pull/16610) [`c63e7e4`](https://github.com/withastro/astro/commit/c63e7e4411db8fc652c84ce82b45f53e951eb6fa) Thanks [@matthewp](https://github.com/matthewp)! - Adds background dev server management for AI coding agents.

  When an AI coding agent is detected, `astro dev` now automatically starts the dev server as a detached background process. This prevents the dev server from blocking the agent's terminal and allows it to continue working while the server runs.

  A lock file (`.astro/dev.json`) is written when the dev server starts, recording the server's URL, port, and PID. This prevents duplicate servers from being started for the same project.

  #### New flag and subcommands
  - `astro dev --background` — Start the dev server as a background process (this is what runs automatically when an agent is detected).
  - `astro dev stop` — Stop a running background dev server.
  - `astro dev status` — Check if a dev server is running and display its URL, PID, and uptime.
  - `astro dev logs` — View logs from a background dev server. Use `--follow` (`-f`) to stream new output as it's written.

  These allow you to start and manage dev servers programmatically and were designed with AI coding agents in mind.

  #### What should I do?

  No action is required. If you are not using an AI coding agent, `astro dev` behaves exactly as before. If you are using an agent, background mode is enabled automatically — the agent will receive the server URL and PID, and can use `astro dev stop` to shut it down.

  To opt out of automatic background mode when an agent is detected, set the environment variable `ASTRO_DEV_BACKGROUND=0` before running `astro dev`.

- [#16725](https://github.com/withastro/astro/pull/16725) [`10229f7`](https://github.com/withastro/astro/commit/10229f73dbf0f19b9936e9a23f0abc774a4c579e) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Removes deprecated APIs exported from `astro:transitions`.

  In Astro 6.x, some helpers available in `astro:transitions` and `astro:transitions/client` were deprecated.

  In Astro 7.0, the following APIs can no longer be used in your project:
  - `TRANSITION_BEFORE_PREPARATION`
  - `TRANSITION_AFTER_PREPARATION`
  - `TRANSITION_BEFORE_SWAP`
  - `TRANSITION_AFTER_SWAP`
  - `TRANSITION_PAGE_LOAD`
  - `isTransitionBeforePreparationEvent()`
  - `isTransitionBeforeSwapEvent()`
  - `createAnimationScope()`

  #### What should I do?

  Remove any occurrence of `createAnimationScope()`:

  ```diff
  -import { createAnimationScope } from 'astro:transitions';
  ```

  Replace any occurrence of the other APIs using the lifecycle event names directly:

  ```diff
  -import {
  -	TRANSITION_AFTER_SWAP,
  -	isTransitionBeforePreparationEvent,
  -} from 'astro:transitions/client';

  -console.log(isTransitionBeforePreparationEvent(event));
  +console.log(event.type === 'astro:before-preparation');

  -console.log(TRANSITION_AFTER_SWAP);
  +console.log('astro:after-swap');
  ```

  Learn more about all utilities available in the [View Transitions Router API Reference](https://docs.astro.build/en/reference/modules/astro-transitions/).

### Patch Changes

- [#16980](https://github.com/withastro/astro/pull/16980) [`1f07343`](https://github.com/withastro/astro/commit/1f07343ffc69b9c982f43cd0369069fe8d1a07fa) Thanks [@matthewp](https://github.com/matthewp)! - Removes `state.provide()`, `state.resolve()`, `state.finalizeAll()`, and `App.Providers` from the public advanced routing API. These context provider extension points are now internal-only. If you were using them in an integration, use `locals` to share per-request state instead.

- [#16982](https://github.com/withastro/astro/pull/16982) [`1e000e2`](https://github.com/withastro/astro/commit/1e000e2454fbbade0a5ed978a9dccf8307780305) Thanks [@matthewp](https://github.com/matthewp)! - Improves the warning when accessing `Astro.session` without session storage configured. The `session` property is now always defined on the context object, and accessing it without configuration logs a helpful message instead of silently returning `undefined`.

- [#16990](https://github.com/withastro/astro/pull/16990) [`ebeb830`](https://github.com/withastro/astro/commit/ebeb83075ba7825a822fdcf4228b475cae38c9c5) Thanks [@ocavue](https://github.com/ocavue)! - Fixes `Astro.request.url` not reflecting validated `X-Forwarded-Proto`/`X-Forwarded-Host` headers when `security.allowedDomains` is configured. Previously, only `Astro.url` was updated with the forwarded origin while `Astro.request.url` retained the socket-derived URL, causing the two to diverge behind TLS-terminating proxies.

## 7.0.0-alpha.1

### Patch Changes

- [#16603](https://github.com/withastro/astro/pull/16603) [`deaaf3f`](https://github.com/withastro/astro/commit/deaaf3f734bb2f2c8df20559ac83634f418bea18) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removes the warning that Astro does not support vite v8, since Astro v7 does support vite v8

## 7.0.0-alpha.0

### Major Changes

- [#15819](https://github.com/withastro/astro/pull/15819) [`cafec4e`](https://github.com/withastro/astro/commit/cafec4e23365061491103dfce2e889a15cf86f27) Thanks [@delucis](https://github.com/delucis)! - Upgrade to Vite v8

- [#16462](https://github.com/withastro/astro/pull/16462) [`c30a778`](https://github.com/withastro/astro/commit/c30a7789a477e44826c54c8560587d09dc46a229) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Replaces the Go compiler with a Rust-based version.

  The Rust-based Astro compiler (`@astrojs/compiler-rs`) is now the default compiler. This new compiler is faster and more reliable, leading to faster build times and iteration cycles during development.

  This new compiler is more strict regarding invalid syntax. For example, unclosed HTML tags will now throw an error instead of being ignored. It also does not attempt to correct semantically invalid HTML anymore, instead leaving it to the browser to handle, similar to other tools or `document.write()` in JavaScript.

  The previous Go-based compiler has been removed, along with the `experimental.rustCompiler` flag used to opt into the Rust compiler. If you were setting `experimental.rustCompiler` in your `astro.config.mjs`, you can now remove it. No other action is required.

### Patch Changes

- [#15819](https://github.com/withastro/astro/pull/15819) [`cafec4e`](https://github.com/withastro/astro/commit/cafec4e23365061491103dfce2e889a15cf86f27) Thanks [@delucis](https://github.com/delucis)! - Fixes `--port` flag being ignored after a Vite-triggered server restart (e.g. when a `.env` file changes)

- [#16434](https://github.com/withastro/astro/pull/16434) [`ee079d4`](https://github.com/withastro/astro/commit/ee079d4c7f143076b84d663c832911009a077c7f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where i18n domains would return 404 when `trailingSlash` is set to `never`.
