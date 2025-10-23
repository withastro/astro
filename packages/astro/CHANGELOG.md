# astro

## 5.15.1

### Patch Changes

- [#14612](https://github.com/withastro/astro/pull/14612) [`18552c7`](https://github.com/withastro/astro/commit/18552c733c55792a4bf8374d66134742d666e902) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression introduced in Astro v5.14.7 that caused `?url` imports to not work correctly. This release reverts [#14142](https://github.com/withastro/astro/pull/14142).

## 5.15.0

### Minor Changes

- [#14543](https://github.com/withastro/astro/pull/14543) [`9b3241d`](https://github.com/withastro/astro/commit/9b3241d8a903ce0092905205af883cef5498d0b2) Thanks [@matthewp](https://github.com/matthewp)! - Adds two new adapter configuration options `assetQueryParams` and `internalFetchHeaders` to the Adapter API.

  Official and community-built adapters can now use `client.assetQueryParams` to specify query parameters that should be appended to asset URLs (CSS, JavaScript, images, fonts, etc.). The query parameters are automatically appended to all generated asset URLs during the build process.

  Adapters can also use `client.internalFetchHeaders` to specify headers that should be included in Astro's internal fetch calls (Actions, View Transitions, Server Islands, Prefetch).

  This enables features like Netlify's skew protection, which requires the deploy ID to be sent with both internal requests and asset URLs to ensure client and server versions match during deployments.

- [#14489](https://github.com/withastro/astro/pull/14489) [`add4277`](https://github.com/withastro/astro/commit/add4277b6d78080a9da32554f495d870978656af) Thanks [@dev-shetty](https://github.com/dev-shetty)! - Adds a new Copy to Clipboard button to the error overlay stack trace.

  When an error occurs in dev mode, you can now copy the stack trace with a single click to more easily share it in a bug report, a support thread, or with your favorite LLM.

- [#14564](https://github.com/withastro/astro/pull/14564) [`5e7cebb`](https://github.com/withastro/astro/commit/5e7cebbfaa935dab462de6efb0bab507644e10de) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `astro add cloudflare` to scaffold more configuration files

  Running `astro add cloudflare` will now emit `wrangler.jsonc` and `public/.assetsignore`, allowing your Astro project to work out of the box as a worker.

### Patch Changes

- [#14591](https://github.com/withastro/astro/pull/14591) [`3e887ec`](https://github.com/withastro/astro/commit/3e887ec523b8e4ec4d01978f0fedf246dfdfbc81) Thanks [@matthewp](https://github.com/matthewp)! - Adds TypeScript support for the `components` prop on MDX `Content` component when using `await render()`. Developers now get proper IntelliSense and type checking when passing custom components to override default MDX element rendering.

- [#14598](https://github.com/withastro/astro/pull/14598) [`7b45c65`](https://github.com/withastro/astro/commit/7b45c65c62e37d4225fb14ea378e2301de31cbea) Thanks [@delucis](https://github.com/delucis)! - Reduces terminal text styling dependency size by switching from `kleur` to `picocolors`

- [#13826](https://github.com/withastro/astro/pull/13826) [`8079482`](https://github.com/withastro/astro/commit/807948204d3838031e8952a5b3eadb26f5612b8f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds the option to specify in the `preload` directive which weights, styles, or subsets to preload for a given font family when using the experimental Fonts API:

  ```astro
  ---
  import { Font } from 'astro:assets';
  ---

  <Font
    cssVariable="--font-roboto"
    preload={[{ subset: 'latin', style: 'normal' }, { weight: '400' }]}
  />
  ```

  Variable weight font files will be preloaded if any weight within its range is requested. For example, a font file for font weight `100 900` will be included when `400` is specified in a `preload` object.

## 5.14.8

### Patch Changes

- [#14590](https://github.com/withastro/astro/pull/14590) [`577d051`](https://github.com/withastro/astro/commit/577d051637d1b5d0df3100bed4c1d815eae7291c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes image path resolution in content layer collections to support bare filenames. The `image()` helper now normalizes bare filenames like `"cover.jpg"` to relative paths `"./cover.jpg"` for consistent resolution behavior between markdown frontmatter and JSON content collections.

## 5.14.7

### Patch Changes

- [#14582](https://github.com/withastro/astro/pull/14582) [`7958c6b`](https://github.com/withastro/astro/commit/7958c6b44c4bcdaa827d33f71ae7c2def26dc1b4) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a regression that caused Actions to throw errors while loading

- [#14567](https://github.com/withastro/astro/pull/14567) [`94500bb`](https://github.com/withastro/astro/commit/94500bb22236b77c842d88407b9a73bfc7fde488) Thanks [@matthewp](https://github.com/matthewp)! - Fixes the actions endpoint to return 404 for non-existent actions instead of throwing an unhandled error

- [#14566](https://github.com/withastro/astro/pull/14566) [`946fe68`](https://github.com/withastro/astro/commit/946fe68c973c966a4f589ae43858bf486cc70eb5) Thanks [@matthewp](https://github.com/matthewp)! - Fixes handling malformed cookies gracefully by returning the unparsed value instead of throwing

  When a cookie with an invalid value is present (e.g., containing invalid URI sequences), `Astro.cookies.get()` now returns the raw cookie value instead of throwing a URIError. This aligns with the behavior of the underlying `cookie` package and prevents crashes when manually-set or corrupted cookies are encountered.

- [#14142](https://github.com/withastro/astro/pull/14142) [`73c5de9`](https://github.com/withastro/astro/commit/73c5de9263c1de17804a1720d91d3475425b24d1) Thanks [@P4tt4te](https://github.com/P4tt4te)! - Updates handling of CSS for hydrated client components to prevent duplicates

- [#14576](https://github.com/withastro/astro/pull/14576) [`2af62c6`](https://github.com/withastro/astro/commit/2af62c659c3b428561ddf1fa3d0f02126841b672) Thanks [@aprici7y](https://github.com/aprici7y)! - Fixes a regression that caused `Astro.site` to always be `undefined` in `getStaticPaths()`

## 5.14.6

### Patch Changes

- [#14562](https://github.com/withastro/astro/pull/14562) [`722bba0`](https://github.com/withastro/astro/commit/722bba0a57984b6b1c4585627cafa22af64e4251) Thanks [@erbierc](https://github.com/erbierc)! - Fixes a bug where the behavior of the "muted" HTML attribute was inconsistent with that of other attributes.

- [#14538](https://github.com/withastro/astro/pull/14538) [`51ebe6a`](https://github.com/withastro/astro/commit/51ebe6ae9307f5c2124162212493f61152221a43) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves how Actions are implemented

- [#14548](https://github.com/withastro/astro/pull/14548) [`6cdade4`](https://github.com/withastro/astro/commit/6cdade49c975e717f098bb4aa7f03a7b845d0a7c) Thanks [@ascorbic](https://github.com/ascorbic)! - Removes support for the `maxAge` property in `cacheHint` objects returned by live loaders.

  #### :warning: Breaking change for experimental live content collections only

  Feedback showed that this did not make sense to set at the loader level, since the loader does not know how long each individual entry should be cached for.

  If your live loader returns cache hints with `maxAge`, you need to remove this property:

  ```diff
  return {
    entries: [...],
    cacheHint: {
      tags: ['my-tag'],
  -   maxAge: 60,
      lastModified: new Date(),
    },
  };
  ```

  The `cacheHint` object now only supports `tags` and `lastModified` properties. If you want to set the max age for a page, you can set the headers manually:

  ```astro
  ---
  Astro.headers.set('cdn-cache-control', 'max-age=3600');
  ---
  ```

- [#14548](https://github.com/withastro/astro/pull/14548) [`6cdade4`](https://github.com/withastro/astro/commit/6cdade49c975e717f098bb4aa7f03a7b845d0a7c) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds missing `rendered` property to experimental live collections entry type

  Live collections support a `rendered` property that allows you to provide pre-rendered HTML for each entry. While this property was documented and implemented, it was missing from the TypeScript types. This could lead to type errors when trying to use it in a TypeScript project.

  No changes to your project code are necessary. You can continue to use the `rendered` property as before, and it will no longer produce TypeScript errors.

## 5.14.5

### Patch Changes

- [#14525](https://github.com/withastro/astro/pull/14525) [`4f55781`](https://github.com/withastro/astro/commit/4f5578190dab96ad0cd117b9e9bb96fdd18730ae) Thanks [@penx](https://github.com/penx)! - Fixes `defineLiveCollection()` types

- [#14441](https://github.com/withastro/astro/pull/14441) [`62ec8ea`](https://github.com/withastro/astro/commit/62ec8ea14a42c1dba81f68c50e987b111fabcce5) Thanks [@upsuper](https://github.com/upsuper)! - Updates redirect handling to be consistent across `static` and `server` output, aligning with the behavior of other adapters.

  Previously, the Node.js adapter used default HTML files with meta refresh tags when in `static` output. This often resulted in an extra flash of the page on redirect, while also not applying the proper status code for redirections. It's also likely less friendly to search engines.

  This update ensures that configured redirects are always handled as HTTP redirects regardless of output mode, and the default HTML files for the redirects are no longer generated in `static` output. It makes the Node.js adapter more consistent with the other official adapters.

  No change to your project is required to take advantage of this new adapter functionality. It is not expected to cause any breaking changes. However, if you relied on the previous redirecting behavior, you may need to handle your redirects differently now. Otherwise you should notice smoother redirects, with more accurate HTTP status codes, and may potentially see some SEO gains.

- [#14506](https://github.com/withastro/astro/pull/14506) [`ec3cbe1`](https://github.com/withastro/astro/commit/ec3cbe178094e94fcb49cccdcc15c6ffee3104ba) Thanks [@abdo-spices](https://github.com/abdo-spices)! - Updates the `<Font />` component so that preload links are generated after the style tag, as recommended by capo.js

## 5.14.4

### Patch Changes

- [#14509](https://github.com/withastro/astro/pull/14509) [`7e04caf`](https://github.com/withastro/astro/commit/7e04caf9a4a75c75f06c4207fae601a5fd251735) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes an error in the docs that specified an incorrect version for the `security.allowedDomains` release.

## 5.14.3

### Patch Changes

- [#14505](https://github.com/withastro/astro/pull/14505) [`28b2a1d`](https://github.com/withastro/astro/commit/28b2a1db4f3f265632f280b0dbc4c5f241c387e2) Thanks [@matthewp](https://github.com/matthewp)! - Fixes `Cannot set property manifest` error in test utilities by adding a protected setter for the manifest property

- [#14235](https://github.com/withastro/astro/pull/14235) [`c4d84bb`](https://github.com/withastro/astro/commit/c4d84bb654c9a5064b243e971c3b5b280e2b3791) Thanks [@toxeeec](https://github.com/toxeeec)! - Fixes a bug where the "tap" prefetch strategy worked only on the first clicked link with view transitions enabled

## 5.14.2

### Patch Changes

- [#14459](https://github.com/withastro/astro/pull/14459) [`916f9c2`](https://github.com/withastro/astro/commit/916f9c2e094f19562cfe722ca0a5fafb0f313c2e) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves font files URLs in development when using the experimental fonts API by showing the subset if present

- [`b8ca69b`](https://github.com/withastro/astro/commit/b8ca69b97149becefaf89bf21853de9c905cdbb7) Thanks [@ascorbic](https://github.com/ascorbic)! - Aligns dev image server file base with Vite rules

- [#14469](https://github.com/withastro/astro/pull/14469) [`1c090b0`](https://github.com/withastro/astro/commit/1c090b00c1f5c3d8e938ac873fc63ab2f1ae37f1) Thanks [@delucis](https://github.com/delucis)! - Updates `tinyexec` dependency

- [#14460](https://github.com/withastro/astro/pull/14460) [`008dc75`](https://github.com/withastro/astro/commit/008dc75d860eadbb394e86dac68c7f4962e40489) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `astro:config/server` values typed as URLs would be serialized as strings

- [#13730](https://github.com/withastro/astro/pull/13730) [`7260367`](https://github.com/withastro/astro/commit/72603676818d1c433ac2751843a8a9b0cc9b48c9) Thanks [@razonyang](https://github.com/razonyang)! - Fixes a bug in i18n, where Astro caused an infinite loop when a locale that doesn't have an index, and Astro falls back to the index of the default locale.

- [`6ee63bf`](https://github.com/withastro/astro/commit/6ee63bfac4856f21b4d4633021b3d2ee059e553f) Thanks [@matthewp](https://github.com/matthewp)! - Adds `security.allowedDomains` configuration to validate `X-Forwarded-Host` headers in SSR

  The `X-Forwarded-Host` header will now only be trusted if it matches one of the configured allowed host patterns. This prevents [host header injection attacks](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection) that can lead to cache poisoning and other security vulnerabilities.

  Configure allowed host patterns to enable `X-Forwarded-Host` support:

  ```js
  // astro.config.mjs
  export default defineConfig({
    output: 'server',
    adapter: node(),
    security: {
      allowedDomains: [
        { hostname: 'example.com' },
        { hostname: '*.example.com' },
        { hostname: 'cdn.example.com', port: '443' },
      ],
    },
  });
  ```

  The patterns support wildcards (`*` and `**`) for flexible hostname matching and can optionally specify protocol and port.

  ### Breaking change

  Previously, `Astro.url` would reflect the value of the `X-Forwarded-Host` header. While this header is commonly used by reverse proxies like Nginx to communicate the original host, it can be sent by any client, potentially allowing malicious actors to poison caches with incorrect URLs.

  If you were relying on `X-Forwarded-Host` support, add `security.allowedDomains` to your configuration to restore this functionality securely. When `allowedDomains` is not configured, `X-Forwarded-Host` headers are now ignored by default.

- [#14488](https://github.com/withastro/astro/pull/14488) [`badc929`](https://github.com/withastro/astro/commit/badc9292a702250430b9ba11d9b26d75bd441934) Thanks [@olcanebrem](https://github.com/olcanebrem)! - Fixes a case where styles on the custom 500 error page would not be included

- [#14487](https://github.com/withastro/astro/pull/14487) [`1e5b72c`](https://github.com/withastro/astro/commit/1e5b72c8df709b8ab966ed1d0f74977758bbf445) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where the URLs generated by the experimental Fonts API would be incorrect in dev

- [#14475](https://github.com/withastro/astro/pull/14475) [`ae034ae`](https://github.com/withastro/astro/commit/ae034ae38cf1fd4837acc2c7da0c35f298fa8035) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Warns if the font family name is not supported by the provider when using the experimental fonts API

- [`b8ca69b`](https://github.com/withastro/astro/commit/b8ca69b97149becefaf89bf21853de9c905cdbb7) Thanks [@ascorbic](https://github.com/ascorbic)! - Refactor remote path detection

- [#14468](https://github.com/withastro/astro/pull/14468) [`2f2a5da`](https://github.com/withastro/astro/commit/2f2a5da27e1ea6b27bfa244513a15922b726c6ac) Thanks [@delucis](https://github.com/delucis)! - Updates `@capsizecss/unpack` dependency

- Updated dependencies [[`b8ca69b`](https://github.com/withastro/astro/commit/b8ca69b97149becefaf89bf21853de9c905cdbb7)]:
  - @astrojs/internal-helpers@0.7.4
  - @astrojs/markdown-remark@6.3.8

## 5.14.1

### Patch Changes

- [#14440](https://github.com/withastro/astro/pull/14440) [`a3e16ab`](https://github.com/withastro/astro/commit/a3e16ab6dd0bef9ab6259f23bfeebed747e27497) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where the URLs generated by the experimental Fonts API would be incorrect in dev

## 5.14.0

### Minor Changes

- [#13520](https://github.com/withastro/astro/pull/13520) [`a31edb8`](https://github.com/withastro/astro/commit/a31edb8daad8632bacd1861adf6ac720695f7173) Thanks [@openscript](https://github.com/openscript)! - Adds a new property `routePattern` available to `GetStaticPathsOptions`

  This provides the original, dynamic segment definition in a routing file path (e.g. `/[...locale]/[files]/[slug]`) from the Astro render context that would not otherwise be available within the scope of `getStaticPaths()`. This can be useful to calculate the `params` and `props` for each page route.

  For example, you can now localize your route segments and return an array of static paths by passing `routePattern` to a custom `getLocalizedData()` helper function. The `params` object will be set with explicit values for each route segment (e.g. `locale`, `files`, and `slug)`. Then, these values will be used to generate the routes and can be used in your page template via `Astro.params`.

  ```astro
  ---
  // src/pages/[...locale]/[files]/[slug].astro
  import { getLocalizedData } from '../../../utils/i18n';

  export async function getStaticPaths({ routePattern }) {
    const response = await fetch('...');
    const data = await response.json();

    console.log(routePattern); // [...locale]/[files]/[slug]

    // Call your custom helper with `routePattern` to generate the static paths
    return data.flatMap((file) => getLocalizedData(file, routePattern));
  }

  const { locale, files, slug } = Astro.params;
  ---
  ```

  For more information about this advanced routing pattern, see Astro's [routing reference](https://docs.astro.build/en/reference/routing-reference/#routepattern).

- [#13651](https://github.com/withastro/astro/pull/13651) [`dcfbd8c`](https://github.com/withastro/astro/commit/dcfbd8c9d5dc798d1bcb9b36531c2eded301050d) Thanks [@ADTC](https://github.com/ADTC)! - Adds a new `SvgComponent` type

  You can now more easily enforce type safety for your `.svg` assets by directly importing `SVGComponent` from `astro/types`:

  ```astro
  ---
  // src/components/Logo.astro
  import type { SvgComponent } from 'astro/types';
  import HomeIcon from './Home.svg';
  interface Link {
    url: string;
    text: string;
    icon: SvgComponent;
  }
  const links: Link[] = [
    {
      url: '/',
      text: 'Home',
      icon: HomeIcon,
    },
  ];
  ---
  ```

- [#14206](https://github.com/withastro/astro/pull/14206) [`16a23e2`](https://github.com/withastro/astro/commit/16a23e23c3ad2309d3b84962b055f4b2d1c8604c) Thanks [@Fryuni](https://github.com/Fryuni)! - Warn on prerendered routes collision.

  Previously, when two dynamic routes `/[foo]` and `/[bar]` returned values on their `getStaticPaths` that resulted in the same final path, only one of the routes would be rendered while the other would be silently ignored. Now, when this happens, a warning will be displayed explaining which routes collided and on which path.

  Additionally, a new experimental flag `failOnPrerenderConflict` can be used to fail the build when such a collision occurs.

### Patch Changes

- [#13811](https://github.com/withastro/astro/pull/13811) [`69572c0`](https://github.com/withastro/astro/commit/69572c0aa2d453cc399948406dbcbfd12e03c4a8) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new `getFontData()` method to retrieve lower-level font family data programmatically when using the experimental Fonts API

  The `getFontData()` helper function from `astro:assets` provides access to font family data for use outside of Astro. This can then be used in an [API Route](/en/guides/endpoints/#server-endpoints-api-routes) or to generate your own meta tags.

  ```ts
  import { getFontData } from 'astro:assets';

  const data = getFontData('--font-roboto');
  ```

  For example, `getFontData()` can get the font buffer from the URL when using [satori](https://github.com/vercel/satori) to generate OpenGraph images:

  ```tsx
  // src/pages/og.png.ts

  import type { APIRoute } from 'astro';
  import { getFontData } from 'astro:assets';
  import satori from 'satori';

  export const GET: APIRoute = (context) => {
    const data = getFontData('--font-roboto');

    const svg = await satori(<div style={{ color: 'black' }}>hello, world</div>, {
      width: 600,
      height: 400,
      fonts: [
        {
          name: 'Roboto',
          data: await fetch(new URL(data[0].src[0].url, context.url.origin)).then((res) =>
            res.arrayBuffer(),
          ),
          weight: 400,
          style: 'normal',
        },
      ],
    });

    // ...
  };
  ```

  See the [experimental Fonts API documentation](https://docs.astro.build/en/reference/experimental-flags/fonts/#accessing-font-data-programmatically) for more information.

## 5.13.11

### Patch Changes

- [#14409](https://github.com/withastro/astro/pull/14409) [`250a595`](https://github.com/withastro/astro/commit/250a595596e9c7e1a966c5cda40f9bd5cf9d3f66) Thanks [@louisescher](https://github.com/louisescher)! - Fixes an issue where `astro info` would log errors to console in certain cases.

- [#14398](https://github.com/withastro/astro/pull/14398) [`a7df80d`](https://github.com/withastro/astro/commit/a7df80d284652b500079e4476b17d5d1b7746b06) Thanks [@idawnlight](https://github.com/idawnlight)! - Fixes an unsatisfiable type definition when calling `addServerRenderer` on an experimental container instance

- [#13747](https://github.com/withastro/astro/pull/13747) [`120866f`](https://github.com/withastro/astro/commit/120866f35a6b27c31bae1c04c0ea9d6bdaf09b16) Thanks [@jp-knj](https://github.com/jp-knj)! - Adds automatic request signal abortion when the underlying socket closes in the Node.js adapter

  The Node.js adapter now automatically aborts the `request.signal` when the client connection is terminated. This enables better resource management and allows applications to properly handle client disconnections through the standard `AbortSignal` API.

- [#14428](https://github.com/withastro/astro/pull/14428) [`32a8acb`](https://github.com/withastro/astro/commit/32a8acba50bb15101c099fc7a14081d1a8cf0331) Thanks [@drfuzzyness](https://github.com/drfuzzyness)! - Force sharpService to return a Uint8Array if Sharp returns a SharedArrayBuffer

- [#14411](https://github.com/withastro/astro/pull/14411) [`a601186`](https://github.com/withastro/astro/commit/a601186fb9ac0e7c8ff20887024234ecbfdd6ff1) Thanks [@GameRoMan](https://github.com/GameRoMan)! - Fixes relative links to docs that could not be opened in the editor.

## 5.13.10

### Patch Changes

- Updated dependencies [[`1e2499e`](https://github.com/withastro/astro/commit/1e2499e8ea83ebfa233a18a7499e1ccf169e56f4)]:
  - @astrojs/internal-helpers@0.7.3
  - @astrojs/markdown-remark@6.3.7

## 5.13.9

### Patch Changes

- [#14402](https://github.com/withastro/astro/pull/14402) [`54dcd04`](https://github.com/withastro/astro/commit/54dcd04350b83cbf368dfb8d72f7d2ddf209a91e) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Removes warning that caused unexpected console spam when using Bun

## 5.13.8

### Patch Changes

- [#14300](https://github.com/withastro/astro/pull/14300) [`bd4a70b`](https://github.com/withastro/astro/commit/bd4a70bde3c8e0c04e2754cf26d222aa36d3c3c8) Thanks [@louisescher](https://github.com/louisescher)! - Adds Vite version & integration versions to output of `astro info`

- [#14341](https://github.com/withastro/astro/pull/14341) [`f75fd99`](https://github.com/withastro/astro/commit/f75fd9977f0f3f8afd1128cc3616205edec0a11c) Thanks [@delucis](https://github.com/delucis)! - Fixes support for declarative Shadow DOM when using the `<ClientRouter>` component

- [#14350](https://github.com/withastro/astro/pull/14350) [`f59581f`](https://github.com/withastro/astro/commit/f59581f2d4566c684c587af816e22763440ded19) Thanks [@ascorbic](https://github.com/ascorbic)! - Improves error reporting for content collections by adding logging for configuration errors that had previously been silently ignored. Also adds a new error that is thrown if a live collection is used in `content.config.ts` rather than `live.config.ts`.

- [#14343](https://github.com/withastro/astro/pull/14343) [`13f7d36`](https://github.com/withastro/astro/commit/13f7d36688042cdb5644786d795fc921841da76a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a regression in non node runtimes

## 5.13.7

### Patch Changes

- [#14330](https://github.com/withastro/astro/pull/14330) [`72e14ab`](https://github.com/withastro/astro/commit/72e14abed6e20d31b1cd2caeeaa7e43703bf3aa3) Thanks [@ascorbic](https://github.com/ascorbic)! - Removes pinned package that is no longer needed.

- [#14335](https://github.com/withastro/astro/pull/14335) [`17c7b03`](https://github.com/withastro/astro/commit/17c7b0395c00a0ea29dad9517b60bad3bd3a87a1) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Bumps `sharp` minimal version to `0.34.0`

## 5.13.6

### Patch Changes

- [#14294](https://github.com/withastro/astro/pull/14294) [`e005855`](https://github.com/withastro/astro/commit/e0058553b2a6bb03fd864d77a1f07c25c60f7d91) Thanks [@martrapp](https://github.com/martrapp)! - Restores the ability to use Google Analytics `History change trigger` with the `<ClientRouter />`.

- [#14326](https://github.com/withastro/astro/pull/14326) [`c24a8f4`](https://github.com/withastro/astro/commit/c24a8f42a17410ea78fc2d68ff0105b931a381eb) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Updates `vite` version to fix CVE

- [#14108](https://github.com/withastro/astro/pull/14108) [`218e070`](https://github.com/withastro/astro/commit/218e07054f4fe7a16e13479861dc162f6d886edc) Thanks [@JusticeMatthew](https://github.com/JusticeMatthew)! - Updates dynamic route split regex to avoid infinite retries/exponential complexity

- [#14327](https://github.com/withastro/astro/pull/14327) [`c1033be`](https://github.com/withastro/astro/commit/c1033beafa331bbd67f0ee76b47303deb3db806f) Thanks [@ascorbic](https://github.com/ascorbic)! - Pins simple-swizzle to avoid compromised version

## 5.13.5

### Patch Changes

- [#14286](https://github.com/withastro/astro/pull/14286) [`09c5db3`](https://github.com/withastro/astro/commit/09c5db37d12862eef8d4ecf62389e10f30a22de9) Thanks [@ematipico](https://github.com/ematipico)! - **BREAKING CHANGES only to the experimental CSP feature**

  The following runtime APIs of the `Astro` global have been renamed:
  - `Astro.insertDirective` to `Astro.csp.insertDirective`
  - `Astro.insertStyleResource` to `Astro.csp.insertStyleResource`
  - `Astro.insertStyleHash` to `Astro.csp.insertStyleHash`
  - `Astro.insertScriptResource` to `Astro.csp.insertScriptResource`
  - `Astro.insertScriptHash` to `Astro.csp.insertScriptHash`

  The following runtime APIs of the `APIContext` have been renamed:
  - `ctx.insertDirective` to `ctx.csp.insertDirective`
  - `ctx.insertStyleResource` to `ctx.csp.insertStyleResource`
  - `ctx.insertStyleHash` to `ctx.csp.insertStyleHash`
  - `ctx.insertScriptResource` to `ctx.csp.insertScriptResource`
  - `ctx.insertScriptHash` to `ctx.csp.insertScriptHash`

- [#14283](https://github.com/withastro/astro/pull/14283) [`3224637`](https://github.com/withastro/astro/commit/3224637eca5c065872d92449216cb33baac2dbfd) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where CSP headers were incorrectly injected in the development server.

- [#14275](https://github.com/withastro/astro/pull/14275) [`3e2f20d`](https://github.com/withastro/astro/commit/3e2f20d07e92b1acfadb1357a59b6952e85227f3) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds support for experimental CSP when using experimental fonts

  Experimental fonts now integrate well with experimental CSP by injecting hashes for the styles it generates, as well as `font-src` directives.

  No action is required to benefit from it.

- [#14280](https://github.com/withastro/astro/pull/14280) [`4b9fb73`](https://github.com/withastro/astro/commit/4b9fb736dab42b8864012db0a981d3441366c388) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused cookies to not be correctly set when using middleware sequences

- [#14276](https://github.com/withastro/astro/pull/14276) [`77281c4`](https://github.com/withastro/astro/commit/77281c4616b65959715dcbac42bf948bebfee755) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Adds a missing export for `resolveSrc`, a documented image services utility.

## 5.13.4

### Patch Changes

- [#14260](https://github.com/withastro/astro/pull/14260) [`86a1e40`](https://github.com/withastro/astro/commit/86a1e40ce21b629a956057b059d06ba78bd89402) Thanks [@jp-knj](https://github.com/jp-knj)! - Fixes `Astro.url.pathname` to respect `trailingSlash: 'never'` configuration when using a base path. Previously, the root path with a base would incorrectly return `/base/` instead of `/base` when `trailingSlash` was set to 'never'.

- [#14248](https://github.com/withastro/astro/pull/14248) [`e81c4bd`](https://github.com/withastro/astro/commit/e81c4bd1cca6739192d33068cbfb2c9e4ced1ffe) Thanks [@julesyoungberg](https://github.com/julesyoungberg)! - Fixes a bug where actions named 'apply' do not work due to being a function prototype method.

## 5.13.3

### Patch Changes

- [#14239](https://github.com/withastro/astro/pull/14239) [`d7d93e1`](https://github.com/withastro/astro/commit/d7d93e19fbfa52cf74dee40f5af6b7ea6a7503d2) Thanks [@wtchnm](https://github.com/wtchnm)! - Fixes a bug where the types for the live content collections were not being generated correctly in dev mode

- [#14221](https://github.com/withastro/astro/pull/14221) [`eadc9dd`](https://github.com/withastro/astro/commit/eadc9dd277d0075d7bff0e33c7a86f3fb97fdd61) Thanks [@delucis](https://github.com/delucis)! - Fixes JSON schema support for content collections using the `file()` loader

- [#14229](https://github.com/withastro/astro/pull/14229) [`1a9107a`](https://github.com/withastro/astro/commit/1a9107a4049f43c1e4e9f40e07033f6bfe4398e4) Thanks [@jonmichaeldarby](https://github.com/jonmichaeldarby)! - Ensures `Astro.currentLocale` returns the correct locale during SSG for pages that use a locale param (such as `[locale].astro` or `[locale]/index.astro`, which produce `[locale].html`)

## 5.13.2

### Patch Changes

- [`4d16de7`](https://github.com/withastro/astro/commit/4d16de7f95db5d1ec1ce88610d2a95e606e83820) Thanks [@ematipico](https://github.com/ematipico)! - Improves the detection of remote paths in the `_image` endpoint. Now `href` parameters that start with `//` are considered remote paths.

- Updated dependencies [[`4d16de7`](https://github.com/withastro/astro/commit/4d16de7f95db5d1ec1ce88610d2a95e606e83820)]:
  - @astrojs/internal-helpers@0.7.2
  - @astrojs/markdown-remark@6.3.6

## 5.13.1

### Patch Changes

- [#14225](https://github.com/withastro/astro/pull/14225) [`f2490ab`](https://github.com/withastro/astro/commit/f2490aba420a8999c0e8d12b9e1e69d4e33ae29e) Thanks [@delucis](https://github.com/delucis)! - Fixes the `experimental.chromeDevtoolsWorkspace` feature.

## 5.13.0

### Minor Changes

- [#14173](https://github.com/withastro/astro/pull/14173) [`39911b8`](https://github.com/withastro/astro/commit/39911b823d4617d99cc95e4b7584e9e4b7b90038) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds an experimental flag `staticImportMetaEnv` to disable the replacement of `import.meta.env` values with `process.env` calls and their coercion of environment variable values. This supersedes the `rawEnvValues` experimental flag, which is now removed.

  Astro allows you to configure a [type-safe schema for your environment variables](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables), and converts variables imported via `astro:env` into the expected type. This is the recommended way to use environment variables in Astro, as it allows you to easily see and manage whether your variables are public or secret, available on the client or only on the server at build time, and the data type of your values.

  However, you can still access environment variables through `process.env` and `import.meta.env` directly when needed. This was the only way to use environment variables in Astro before `astro:env` was added in Astro 5.0, and Astro's default handling of `import.meta.env` includes some logic that was only needed for earlier versions of Astro.

  The `experimental.staticImportMetaEnv` flag updates the behavior of `import.meta.env` to align with [Vite's handling of environment variables](https://vite.dev/guide/env-and-mode.html#env-variables) and for better ease of use with Astro's current implementations and features. **This will become the default behavior in Astro 6.0**, and this early preview is introduced as an experimental feature.

  Currently, non-public `import.meta.env` environment variables are replaced by a reference to `process.env`. Additionally, Astro may also convert the value type of your environment variables used through `import.meta.env`, which can prevent access to some values such as the strings `"true"` (which is converted to a boolean value), and `"1"` (which is converted to a number).

  The `experimental.staticImportMetaEnv` flag simplifies Astro's default behavior, making it easier to understand and use. Astro will no longer replace any `import.meta.env` environment variables with a `process.env` call, nor will it coerce values.

  To enable this feature, add the experimental flag in your Astro config and remove `rawEnvValues` if it was enabled:

  ```diff
  // astro.config.mjs
  import { defineConfig } from "astro/config";

  export default defineConfig({
  +  experimental: {
  +    staticImportMetaEnv: true
  -    rawEnvValues: false
  +  }
  });
  ```

  #### Updating your project

  If you were relying on Astro's default coercion, you may need to update your project code to apply it manually:

  ```diff
  // src/components/MyComponent.astro
  - const enabled: boolean = import.meta.env.ENABLED;
  + const enabled: boolean = import.meta.env.ENABLED === "true";
  ```

  If you were relying on the transformation into `process.env` calls, you may need to update your project code to apply it manually:

  ```diff
  // src/components/MyComponent.astro
  - const enabled: boolean = import.meta.env.DB_PASSWORD;
  + const enabled: boolean = process.env.DB_PASSWORD;
  ```

  You may also need to update types:

  ```diff
  // src/env.d.ts
  interface ImportMetaEnv {
    readonly PUBLIC_POKEAPI: string;
  -  readonly DB_PASSWORD: string;
  -  readonly ENABLED: boolean;
  +  readonly ENABLED: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  + namespace NodeJS {
  +  interface ProcessEnv {
  +    DB_PASSWORD: string;
  +  }
  + }
  ```

  See the [experimental static `import.meta.env` documentation](https://docs.astro.build/en/reference/experimental-flags/static-import-meta-env/) for more information about this feature. You can learn more about using environment variables in Astro, including `astro:env`, in the [environment variables documentation](https://docs.astro.build/en/guides/environment-variables/).

- [#14122](https://github.com/withastro/astro/pull/14122) [`41ed3ac`](https://github.com/withastro/astro/commit/41ed3ac54adf1025a38031757ee0bfaef8504092) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds experimental support for automatic [Chrome DevTools workspace folders](https://developer.chrome.com/docs/devtools/workspaces)

  This feature allows you to edit files directly in the browser and have those changes reflected in your local file system via a connected workspace folder. This allows you to apply edits such as CSS tweaks without leaving your browser tab!

  With this feature enabled, the Astro dev server will automatically configure a Chrome DevTools workspace for your project. Your project will then appear as a workspace source, ready to connect. Then, changes that you make in the "Sources" panel are automatically saved to your project source code.

  To enable this feature, add the experimental flag `chromeDevtoolsWorkspace` to your Astro config:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      chromeDevtoolsWorkspace: true,
    },
  });
  ```

  See the [experimental Chrome DevTools workspace feature documentation](https://docs.astro.build/en/reference/experimental-flags/chrome-devtools-workspace/) for more information.

## 5.12.9

### Patch Changes

- [#14020](https://github.com/withastro/astro/pull/14020) [`9518975`](https://github.com/withastro/astro/commit/951897553921c1419fb96aef74d42ec99976d8be) Thanks [@jp-knj](https://github.com/jp-knj) and [@asieradzk](https://github.com/asieradzk)! - Prevent double-prefixed redirect paths when using fallback and redirectToDefaultLocale together

  Fixes an issue where i18n fallback routes would generate double-prefixed paths (e.g., `/es/es/test/item1/`) when `fallback` and `redirectToDefaultLocale` configurations were used together. The fix adds proper checks to prevent double prefixing in route generation.

- [#14199](https://github.com/withastro/astro/pull/14199) [`3e4cb8e`](https://github.com/withastro/astro/commit/3e4cb8e52a83974cc2671d13fb1b4595fe65085d) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that prevented HMR from working with inline styles

## 5.12.8

### Patch Changes

- [`0567fb7`](https://github.com/withastro/astro/commit/0567fb7b50c0c452be387dd7c7264b96bedab48f) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds `//` to list of internal path prefixes that do not have automated trailing slash handling

- [#13894](https://github.com/withastro/astro/pull/13894) [`b36e72f`](https://github.com/withastro/astro/commit/b36e72f11fbcc0f3d5826f2b1939084f1fb1e3a8) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes Astro Studio commands from the CLI help

- Updated dependencies [[`0567fb7`](https://github.com/withastro/astro/commit/0567fb7b50c0c452be387dd7c7264b96bedab48f)]:
  - @astrojs/internal-helpers@0.7.1
  - @astrojs/markdown-remark@6.3.5

## 5.12.7

### Patch Changes

- [#14169](https://github.com/withastro/astro/pull/14169) [`f4e8889`](https://github.com/withastro/astro/commit/f4e8889c10c25aeb7650b389c35a70780d5ed172) Thanks [@ascorbic](https://github.com/ascorbic)! - Skips trailing slash handling for paths that start with `/.`.

- [#14170](https://github.com/withastro/astro/pull/14170) [`34e6b3a`](https://github.com/withastro/astro/commit/34e6b3a87dd3e9be4886059d1c0efee4c5fa3cda) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where static redirects couldn't correctly generate a redirect when the destination is a prerendered route, and the `output` is set to `"server"`.

- [#14169](https://github.com/withastro/astro/pull/14169) [`f4e8889`](https://github.com/withastro/astro/commit/f4e8889c10c25aeb7650b389c35a70780d5ed172) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that prevented images from being displayed in dev when using the Netlify adapter with `trailingSlash` set to `always`

- Updated dependencies [[`f4e8889`](https://github.com/withastro/astro/commit/f4e8889c10c25aeb7650b389c35a70780d5ed172)]:
  - @astrojs/internal-helpers@0.7.0
  - @astrojs/markdown-remark@6.3.4

## 5.12.6

### Patch Changes

- [#14153](https://github.com/withastro/astro/pull/14153) [`29e9283`](https://github.com/withastro/astro/commit/29e928391a90844f8b701a581c4f163e0b6c46db) Thanks [@jp-knj](https://github.com/jp-knj)! - Fixes a regression introduced by a recent optimisation of how SVG images are emitted during the build.

- [#14156](https://github.com/withastro/astro/pull/14156) [`592f08d`](https://github.com/withastro/astro/commit/592f08d1b4a3e03c61b34344e36cb772bd67709a) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fix the client router not submitting forms if the active URL contained a hash

- [#14160](https://github.com/withastro/astro/pull/14160) [`d2e25c6`](https://github.com/withastro/astro/commit/d2e25c6e9d52160d4f8d8cbf7bc44e6794483f20) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that meant some remote image URLs could cause invalid filenames to be used for processed images

- [#14167](https://github.com/withastro/astro/pull/14167) [`62bd071`](https://github.com/withastro/astro/commit/62bd0717ab810c049ed7f3f63029895dfb402797) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that prevented destroyed sessions from being deleted from storage unless the session had been loaded

## 5.12.5

### Patch Changes

- [#14059](https://github.com/withastro/astro/pull/14059) [`19f53eb`](https://github.com/withastro/astro/commit/19f53eb59dfeeff08078cec0a903c8722b5650ca) Thanks [@benosmac](https://github.com/benosmac)! - Fixes a bug in i18n implementation, where Astro didn't emit the correct pages when `fallback` is enabled, and a locale uses a catch-all route, e.g. `src/pages/es/[...catchAll].astro`

- [#14155](https://github.com/withastro/astro/pull/14155) [`31822c3`](https://github.com/withastro/astro/commit/31822c3f0c8401e20129d0fc6bf8d1d670249265) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused an error "serverEntrypointModule[_start] is not a function" in some adapters

## 5.12.4

### Patch Changes

- [#14031](https://github.com/withastro/astro/pull/14031) [`e9206c1`](https://github.com/withastro/astro/commit/e9206c192fc4a4dbf2d02f921fa540f987ccbe89) Thanks [@jp-knj](https://github.com/jp-knj)! - Optimized the build pipeline for SVG images. Now, Astro doesn't reprocess images that have already been processed.

- [#14132](https://github.com/withastro/astro/pull/14132) [`976879a`](https://github.com/withastro/astro/commit/976879a400af9f44aee52c9112a7bd9788163588) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the property `Astro.routePattern`/`context.routePattern` wasn't updated when using a rewrite via middleware.

- [#14131](https://github.com/withastro/astro/pull/14131) [`aafc4d7`](https://github.com/withastro/astro/commit/aafc4d7f8b3f198ace24a8a7f6cc9298771542da) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where an error occurring in a middleware would show the dev overlay instead of the custom `500.astro` page

- [#14127](https://github.com/withastro/astro/pull/14127) [`2309ada`](https://github.com/withastro/astro/commit/2309ada1c6d96c75815eda0760656147de435ba2) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Upgrades zod

- [#14134](https://github.com/withastro/astro/pull/14134) [`186c201`](https://github.com/withastro/astro/commit/186c201a1bd83593c880ab784d79f69245b445c2) Thanks [@ascorbic](https://github.com/ascorbic)! - Throws a more helpful error in dev if trying to use a server island without an adapter

- [#14129](https://github.com/withastro/astro/pull/14129) [`3572d85`](https://github.com/withastro/astro/commit/3572d85ba89ef9c374f3631654eee704adf00e73) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the CSP headers was incorrectly added to a page when using an adapter.

## 5.12.3

### Patch Changes

- [#14119](https://github.com/withastro/astro/pull/14119) [`14807a4`](https://github.com/withastro/astro/commit/14807a4581b5ba2e61bc63ef9ef9f14848564edd) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused builds to fail if a client directive was mistakenly added to an Astro component

- [#14001](https://github.com/withastro/astro/pull/14001) [`4b03d9c`](https://github.com/withastro/astro/commit/4b03d9c9d9237d9af38425062559eafdfc27f76f) Thanks [@dnek](https://github.com/dnek)! - Fixes an issue where `getImage()` assigned the resized base URL to the srcset URL of `ImageTransform`, which matched the width, height, and format of the original image.

## 5.12.2

### Patch Changes

- [#14071](https://github.com/withastro/astro/pull/14071) [`d2cb35d`](https://github.com/withastro/astro/commit/d2cb35d2b7ff999fea8aa39c79f9f048c3500aeb) Thanks [@Grisoly](https://github.com/Grisoly)! - Exposes the `Code` component `lang` prop type:

  ```ts
  import type { CodeLanguage } from 'astro';
  ```

- [#14111](https://github.com/withastro/astro/pull/14111) [`5452ee6`](https://github.com/withastro/astro/commit/5452ee67f95f51dcfdca8c1988b29f89553efe1c) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that prevented "key" from being used as a prop for Astro components in MDX

- [#14106](https://github.com/withastro/astro/pull/14106) [`b5b39e4`](https://github.com/withastro/astro/commit/b5b39e4d4bf5e5816bccf7fbfd9a48e4d8ee302a) Thanks [@ascorbic](https://github.com/ascorbic)! - Exits with non-zero exit code when config has an error

- [#14112](https://github.com/withastro/astro/pull/14112) [`37458b3`](https://github.com/withastro/astro/commit/37458b31aeee23df0b5a8ab9e319a23ee4eddc6d) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that meant that SVG components could no longer be serialized with `JSON.stringify`

- [#14061](https://github.com/withastro/astro/pull/14061) [`c7a7dd5`](https://github.com/withastro/astro/commit/c7a7dd5f612b302f02a0ff468beeadd8e142a5ad) Thanks [@jonasgeiler](https://github.com/jonasgeiler)! - Add module declaration for `?no-inline` asset imports

- [#14109](https://github.com/withastro/astro/pull/14109) [`5a08fa2`](https://github.com/withastro/astro/commit/5a08fa22b4023810fea45876f62152bd196e6062) Thanks [@ascorbic](https://github.com/ascorbic)! - Throw a more helpful error if defineLiveCollection is used outside of a live.config file

- [#14110](https://github.com/withastro/astro/pull/14110) [`e7dd4e1`](https://github.com/withastro/astro/commit/e7dd4e1116103892ddc6a83052c8f1ba25d8abdc) Thanks [@ascorbic](https://github.com/ascorbic)! - Warn if duplicate IDs are found by file loader

## 5.12.1

### Patch Changes

- [#14094](https://github.com/withastro/astro/pull/14094) [`22e9087`](https://github.com/withastro/astro/commit/22e90873f85d7b5b5d556f456362656f04b32341) Thanks [@ascorbic](https://github.com/ascorbic)! - Correct types to allow `priority` on all images

- [#14091](https://github.com/withastro/astro/pull/14091) [`26c6b6d`](https://github.com/withastro/astro/commit/26c6b6db264f9cbd98ddf97c3f7a34ec7f488095) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused a type error when defining session options without a driver

- [#14082](https://github.com/withastro/astro/pull/14082) [`93322cb`](https://github.com/withastro/astro/commit/93322cbe36c40401256eea2a9e34f5fbe13a28ec) Thanks [@louisescher](https://github.com/louisescher)! - Fixes an issue where Astro's default 404 route would incorrectly match routes containing "/404" in dev

- [#14089](https://github.com/withastro/astro/pull/14089) [`687d253`](https://github.com/withastro/astro/commit/687d25365a41ff8a9e6da155d3527f841abb70dd) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `astro:env` would not load the right environments variables in dev

- [#14092](https://github.com/withastro/astro/pull/14092) [`6692c71`](https://github.com/withastro/astro/commit/6692c71ed609690ebf6a697d88582130a5cbfdfb) Thanks [@ascorbic](https://github.com/ascorbic)! - Improves error handling in live collections

- [#14074](https://github.com/withastro/astro/pull/14074) [`144a950`](https://github.com/withastro/astro/commit/144a950b55f22c2beeff710e5672e9fa611520b3) Thanks [@abcfy2](https://github.com/abcfy2)! - Fixes a bug that caused some image service builds to fail

- [#14092](https://github.com/withastro/astro/pull/14092) [`6692c71`](https://github.com/withastro/astro/commit/6692c71ed609690ebf6a697d88582130a5cbfdfb) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a case where zod could not be imported from `astro:content` virtual module in live collection config

## 5.12.0

### Minor Changes

- [#13971](https://github.com/withastro/astro/pull/13971) [`fe35ee2`](https://github.com/withastro/astro/commit/fe35ee2835997e7e6c3e1975dc6dacfa1052a765) Thanks [@adamhl8](https://github.com/adamhl8)! - Adds an experimental flag `rawEnvValues` to disable coercion of `import.meta.env` values (e.g. converting strings to other data types) that are populated from `process.env`

  Astro allows you to configure a [type-safe schema for your environment variables](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables), and converts variables imported via `astro:env` into the expected type.

  However, Astro also converts your environment variables used through `import.meta.env` in some cases, and this can prevent access to some values such as the strings `"true"` (which is converted to a boolean value), and `"1"` (which is converted to a number).

  The `experimental.rawEnvValues` flag disables coercion of `import.meta.env` values that are populated from `process.env`, allowing you to use the raw value.

  To enable this feature, add the experimental flag in your Astro config:

  ```diff
  import { defineConfig } from "astro/config"

  export default defineConfig({
  +  experimental: {
  +    rawEnvValues: true,
  +  }
  })
  ```

  If you were relying on this coercion, you may need to update your project code to apply it manually:

  ```ts diff
  - const enabled: boolean = import.meta.env.ENABLED
  + const enabled: boolean = import.meta.env.ENABLED === "true"
  ```

  See the [experimental raw environment variables reference docs](https://docs.astro.build/en/reference/experimental-flags/raw-env-values/) for more information.

- [#13941](https://github.com/withastro/astro/pull/13941) [`6bd5f75`](https://github.com/withastro/astro/commit/6bd5f75806cb4df39d9e4e9b1f2225dcfdd724b0) Thanks [@aditsachde](https://github.com/aditsachde)! - Adds support for TOML files to Astro's built-in `glob()` and `file()` content loaders.

  In Astro 5.2, Astro added support for using TOML frontmatter in Markdown files instead of YAML. However, if you wanted to use TOML files as local content collection entries themselves, you needed to write your own loader.

  Astro 5.12 now directly supports loading data from TOML files in content collections in both the `glob()` and the `file()` loaders.

  If you had added your own TOML content parser for the `file()` loader, you can now remove it as this functionality is now included:

  ```diff
  // src/content.config.ts
  import { defineCollection } from "astro:content";
  import { file } from "astro/loaders";
  - import { parse as parseToml } from "toml";
  const dogs = defineCollection({
  -  loader: file("src/data/dogs.toml", { parser: (text) => parseToml(text) }),
  + loader: file("src/data/dogs.toml")
    schema: /* ... */
  })
  ```

  Note that TOML does not support top-level arrays. Instead, the `file()` loader considers each top-level table to be an independent entry. The table header is populated in the `id` field of the entry object.

  See Astro's [content collections guide](https://docs.astro.build/en/guides/content-collections/#built-in-loaders) for more information on using the built-in content loaders.

### Patch Changes

- Updated dependencies [[`6bd5f75`](https://github.com/withastro/astro/commit/6bd5f75806cb4df39d9e4e9b1f2225dcfdd724b0)]:
  - @astrojs/markdown-remark@6.3.3

## 5.11.2

### Patch Changes

- [#14064](https://github.com/withastro/astro/pull/14064) [`2eb77d8`](https://github.com/withastro/astro/commit/2eb77d8f54be3faea38370693d33fb220231ea84) Thanks [@jp-knj](https://github.com/jp-knj)! - Allows using `tsconfig` `compilerOptions.paths` without setting `compilerOptions.baseUrl`

- [#14068](https://github.com/withastro/astro/pull/14068) [`10189c0`](https://github.com/withastro/astro/commit/10189c0b44881fd22bac69acc182834d597d9603) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Fixes the incorrect CSS import path shown in the terminal message during Tailwind integration setup.

## 5.11.1

### Patch Changes

- [#14045](https://github.com/withastro/astro/pull/14045) [`3276b79`](https://github.com/withastro/astro/commit/3276b798d4ecb41c98f97e94d4ddeaa91aa25013) Thanks [@ghubo](https://github.com/ghubo)! - Fixes a problem where importing animated `.avif` files returns a `NoImageMetadata` error.

- [#14041](https://github.com/withastro/astro/pull/14041) [`0c4d5f8`](https://github.com/withastro/astro/commit/0c4d5f8d57d166fc24d12b37cf208d263f330868) Thanks [@dixslyf](https://github.com/dixslyf)! - Fixes a `<ClientRouter />` bug where the fallback view transition animations when exiting a page
  ran too early for browsers that do not support the View Transition API.
  This bug prevented `event.viewTransition?.skipTransition()` from skipping the page exit animation
  when used in an `astro:before-swap` event hook.

## 5.11.0

### Minor Changes

- [#13972](https://github.com/withastro/astro/pull/13972) [`db8f8be`](https://github.com/withastro/astro/commit/db8f8becc9508fa4f292d45c14af92ba59c414d1) Thanks [@ematipico](https://github.com/ematipico)! - Updates the `NodeApp.match()` function in the Adapter API to accept a second, optional parameter to allow adapter authors to add headers to static, prerendered pages.

  `NodeApp.match(request)` currently checks whether there is a route that matches the given `Request`. If there is a prerendered route, the function returns `undefined`, because static routes are already rendered and their headers cannot be updated.

  When the new, optional boolean parameter is passed (e.g. `NodeApp.match(request, true)`), Astro will return the first matched route, even when it's a prerendered route. This allows your adapter to now access static routes and provides the opportunity to set headers for these pages, for example, to implement a Content Security Policy (CSP).

### Patch Changes

- [#14029](https://github.com/withastro/astro/pull/14029) [`42562f9`](https://github.com/withastro/astro/commit/42562f9d7b0bef173aca631f9d59e1bf000133c5) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where server islands wouldn't be correctly rendered when they are rendered inside fragments.

  Now the following examples work as expected:

  ```astro
  ---
  import { Cart } from '../components/Cart.astro';
  ---

  <>
    <Cart server:defer />
  </>

  <Fragment slot="rest">
    <Cart server:defer>
      <div slot="fallback">Not working</div>
    </Cart>
  </Fragment>
  ```

- [#14017](https://github.com/withastro/astro/pull/14017) [`8d238bc`](https://github.com/withastro/astro/commit/8d238bcb21f1d3863d4e86bf0064d98390936208) Thanks [@dmgawel](https://github.com/dmgawel)! - Fixes a bug where i18n fallback rewrites didn't work in dynamic pages.

## 5.10.2

### Patch Changes

- [#14000](https://github.com/withastro/astro/pull/14000) [`3cbedae`](https://github.com/withastro/astro/commit/3cbedae129579b93f5c18c900ae66c6c11c46da5) Thanks [@feelixe](https://github.com/feelixe)! - Fix routePattern JSDoc examples to show correct return values

- [#13990](https://github.com/withastro/astro/pull/13990) [`de6cfd6`](https://github.com/withastro/astro/commit/de6cfd6dc8e53911190b2b5788e0508e557f86eb) Thanks [@isVivek99](https://github.com/isVivek99)! - Fixes a case where `astro:config/client` and `astro:config/server` virtual modules would not contain config passed to integrations `updateConfig()` during the build

- [#14019](https://github.com/withastro/astro/pull/14019) [`a160d1e`](https://github.com/withastro/astro/commit/a160d1e8b711b7a214e54406fdf85be2b7338ed2) Thanks [@ascorbic](https://github.com/ascorbic)! - Removes the requirement to set `type: 'live'` when defining experimental live content collections

  Previously, live collections required a `type` and `loader` configured. Now, Astro can determine that your collection is a `live` collection without defining it explicitly.

  This means it is now safe to remove `type: 'live'` from your collections defined in `src/live.config.ts`:

  ```diff
  import { defineLiveCollection } from 'astro:content';
  import { storeLoader } from '@mystore/astro-loader';

  const products = defineLiveCollection({
  -  type: 'live',
    loader: storeLoader({
      apiKey: process.env.STORE_API_KEY,
      endpoint: 'https://api.mystore.com/v1',
    }),
  });

  export const collections = { products };
  ```

  This is not a breaking change: your existing live collections will continue to work even if you still include `type: 'live'`. However, we suggest removing this line at your earliest convenience for future compatibility when the feature becomes stable and this config option may be removed entirely.

- [#13966](https://github.com/withastro/astro/pull/13966) [`598da21`](https://github.com/withastro/astro/commit/598da21746a6b9cda023c818804b32dc37b9819b) Thanks [@msamoylov](https://github.com/msamoylov)! - Fixes a broken link on the default 404 page in development

## 5.10.1

### Patch Changes

- [#13988](https://github.com/withastro/astro/pull/13988) [`609044c`](https://github.com/withastro/astro/commit/609044ca6a6254b1db11bb3fc8e0bb54213eab8e) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug in live collections that caused it to incorrectly complain about the collection being defined in the wrong file

- [#13909](https://github.com/withastro/astro/pull/13909) [`b258d86`](https://github.com/withastro/astro/commit/b258d86d47086d3a17d6d9e6b79ac21f9770f765) Thanks [@isVivek99](https://github.com/isVivek99)! - Fixes rendering of special boolean attributes for custom elements

- [#13983](https://github.com/withastro/astro/pull/13983) [`e718375`](https://github.com/withastro/astro/commit/e718375c1714a631eba75f70118653cf93a4326d) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where the toolbar audit would incorrectly flag images processed by Astro in content collections documents

- [#13999](https://github.com/withastro/astro/pull/13999) [`f077b68`](https://github.com/withastro/astro/commit/f077b68f4debe8d716a8610e561b4fe17b1245b3) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds `lastModified` field to experimental live collection cache hints

  Live loaders can now set a `lastModified` field in the cache hints for entries and collections to indicate when the data was last modified. This is then available in the `cacheHint` field returned by `getCollection` and `getEntry`.

- [#13987](https://github.com/withastro/astro/pull/13987) [`08f34b1`](https://github.com/withastro/astro/commit/08f34b19c8953426ce35093414a27ecd8d405309) Thanks [@ematipico](https://github.com/ematipico)! - Adds an informative message in dev mode when the CSP feature is enabled.

- [#14005](https://github.com/withastro/astro/pull/14005) [`82aad62`](https://github.com/withastro/astro/commit/82aad62efd2b817cc9cff46b606fedaa64e0c922) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where inline styles and scripts didn't work when CSP was enabled. Now when adding `<styles>` elements inside an Astro component, their hashes care correctly computed.

- [#13985](https://github.com/withastro/astro/pull/13985) [`0b4c641`](https://github.com/withastro/astro/commit/0b4c641b22b31d0dea15911c0daba995a48261a9) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Updates wrong link

## 5.10.0

### Minor Changes

- [#13917](https://github.com/withastro/astro/pull/13917) [`e615216`](https://github.com/withastro/astro/commit/e615216c55bca5d61b8c5c1b49d62671f0238509) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a new `priority` attribute for Astro's image components.

  This change introduces a new `priority` option for the `<Image />` and `<Picture />` components, which automatically sets the `loading`, `decoding`, and `fetchpriority` attributes to their optimal values for above-the-fold images which should be loaded immediately.

  It is a boolean prop, and you can use the shorthand syntax by simply adding `priority` as a prop to the `<Image />` or `<Picture />` component. When set, it will apply the following attributes:
  - `loading="eager"`
  - `decoding="sync"`
  - `fetchpriority="high"`

  The individual attributes can still be set manually if you need to customize your images further.

  By default, the Astro [`<Image />` component](https://docs.astro.build/en/guides/images/#display-optimized-images-with-the-image--component) generates `<img>` tags that lazy-load their content by setting `loading="lazy"` and `decoding="async"`. This improves performance by deferring the loading of images that are not immediately visible in the viewport, and gives the best scores in performance audits like Lighthouse.

  The new `priority` attribute will override those defaults and automatically add the best settings for your high-priority assets.

  This option was previously available for experimental responsive images, but now it is a standard feature for all images.

  #### Usage

  ```astro
  <Image src="/path/to/image.jpg" alt="An example image" priority />
  ```

  > [!Note]
  > You should only use the `priority` option for images that are critical to the initial rendering of the page, and ideally only one image per page. This is often an image identified as the [LCP element](https://web.dev/articles/lcp) when running Lighthouse tests. Using it for too many images will lead to performance issues, as it forces the browser to load those images immediately, potentially blocking the rendering of other content.

- [#13917](https://github.com/withastro/astro/pull/13917) [`e615216`](https://github.com/withastro/astro/commit/e615216c55bca5d61b8c5c1b49d62671f0238509) Thanks [@ascorbic](https://github.com/ascorbic)! - The responsive images feature introduced behind a flag in [v5.0.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#500) is no longer experimental and is available for general use.

  The new responsive images feature in Astro automatically generates optimized images for different screen sizes and resolutions, and applies the correct attributes to ensure that images are displayed correctly on all devices.

  Enable the `image.responsiveStyles` option in your Astro config. Then, set a `layout` attribute on any <Image /> or <Picture /> component, or configure a default `image.layout`, for instantly responsive images with automatically generated `srcset` and `sizes` attributes based on the image's dimensions and the layout type.

  Displaying images correctly on the web can be challenging, and is one of the most common performance issues seen in sites. This new feature simplifies the most challenging part of the process: serving your site visitor an image optimized for their viewing experience, and for your website's performance.

  For full details, see the updated [Image guide](https://docs.astro.build/en/guides/images/#responsive-image-behavior).

  #### Migration from Experimental Responsive Images

  The `experimental.responsiveImages` flag has been removed, and all experimental image configuration options have been renamed to their final names.

  If you were using the experimental responsive images feature, you'll need to update your configuration:

  ##### Remove the experimental flag

  ```diff
  export default defineConfig({
     experimental: {
  -    responsiveImages: true,
     },
  });
  ```

  ##### Update image configuration options

  During the experimental phase, default styles were applied automatically to responsive images. Now, you need to explicitly set the `responsiveStyles` option to `true` if you want these styles applied.

  ```diff
  export default defineConfig({
    image: {
  +    responsiveStyles: true,
    },
  });
  ```

  The experimental image configuration options have been renamed:

  **Before:**

  ```js
  export default defineConfig({
    image: {
      experimentalLayout: 'constrained',
      experimentalObjectFit: 'cover',
      experimentalObjectPosition: 'center',
      experimentalBreakpoints: [640, 750, 828, 1080, 1280],
      experimentalDefaultStyles: true,
    },
    experimental: {
      responsiveImages: true,
    },
  });
  ```

  **After:**

  ```js
  export default defineConfig({
    image: {
      layout: 'constrained',
      objectFit: 'cover',
      objectPosition: 'center',
      breakpoints: [640, 750, 828, 1080, 1280],
      responsiveStyles: true, // This is now *false* by default
    },
  });
  ```

  ##### Component usage remains the same

  The `layout`, `fit`, and `position` props on `<Image>` and `<Picture>` components work exactly the same as before:

  ```astro
  <Image
    src={myImage}
    alt="A responsive image"
    layout="constrained"
    fit="cover"
    position="center"
  />
  ```

  If you weren't using the experimental responsive images feature, no changes are required.

  Please see the [Image guide](https://docs.astro.build/en/guides/images/#responsive-image-behavior) for more information on using responsive images in Astro.

- [#13685](https://github.com/withastro/astro/pull/13685) [`3c04c1f`](https://github.com/withastro/astro/commit/3c04c1f43027e2f9be0854f65c549fa1832f622a) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds experimental support for live content collections

  Live content collections are a new type of [content collection](https://docs.astro.build/en/guides/content-collections/) that fetch their data at runtime rather than build time. This allows you to access frequently-updated data from CMSs, APIs, databases, or other sources using a unified API, without needing to rebuild your site when the data changes.

  #### Live collections vs build-time collections

  In Astro 5.0, the content layer API added support for adding diverse content sources to content collections. You can create loaders that fetch data from any source at build time, and then access it inside a page via `getEntry()` and `getCollection()`. The data is cached between builds, giving fast access and updates.

  However there is no method for updating the data store between builds, meaning any updates to the data need a full site deploy, even if the pages are rendered on-demand. This means that content collections are not suitable for pages that update frequently. Instead, today these pages tend to access the APIs directly in the frontmatter. This works, but leads to a lot of boilerplate, and means users don't benefit from the simple, unified API that content loaders offer. In most cases users tend to individually create loader libraries that they share between pages.

  Live content collections solve this problem by allowing you to create loaders that fetch data at runtime, rather than build time. This means that the data is always up-to-date, without needing to rebuild the site.

  #### How to use

  To enable live collections add the `experimental.liveContentCollections` flag to your `astro.config.mjs` file:

  ```js title="astro.config.mjs"
  {
    experimental: {
      liveContentCollections: true,
    },
  }
  ```

  Then create a new `src/live.config.ts` file (alongside your `src/content.config.ts` if you have one) to define your live collections with a [live loader](https://docs.astro.build/en/reference/experimental-flags/live-content-collections/#creating-a-live-loader) and optionally a [schema](https://docs.astro.build/en/reference/experimental-flags/live-content-collections/#using-zod-schemas) using the new `defineLiveCollection()` function from the `astro:content` module.

  ```ts title="src/live.config.ts"
  import { defineLiveCollection } from 'astro:content';
  import { storeLoader } from '@mystore/astro-loader';

  const products = defineLiveCollection({
    type: 'live',
    loader: storeLoader({
      apiKey: process.env.STORE_API_KEY,
      endpoint: 'https://api.mystore.com/v1',
    }),
  });

  export const collections = { products };
  ```

  You can then use the dedicated `getLiveCollection()` and `getLiveEntry()` functions to access your live data:

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

  <h1>{product.title}</h1>
  <Content />
  ```

  See [the docs for the experimental live content collections feature](https://docs.astro.build/en/reference/experimental-flags/live-content-collections/) for more details on how to use this feature, including how to create a live loader. Please give feedback on [the RFC PR](https://github.com/withastro/roadmap/pull/1164) if you have any suggestions or issues.

### Patch Changes

- [#13957](https://github.com/withastro/astro/pull/13957) [`304df34`](https://github.com/withastro/astro/commit/304df34b7c4ef69f3f6d93835b7a1e415666ddc9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where `report-uri` wasn't available in `experimental.csp.directives`, causing a typing error and a runtime validation error.

- [#13957](https://github.com/withastro/astro/pull/13957) [`304df34`](https://github.com/withastro/astro/commit/304df34b7c4ef69f3f6d93835b7a1e415666ddc9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a type error for the CSP directives `upgrade-insecure-requests`, `sandbox`, and `trusted-type`.

- [#13862](https://github.com/withastro/astro/pull/13862) [`fe8f61a`](https://github.com/withastro/astro/commit/fe8f61ab6dafe2c4da6d55db7316cd614927dd07) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where the dev toolbar would crash if it could not retrieve some essential data

- [#13976](https://github.com/withastro/astro/pull/13976) [`0a31d99`](https://github.com/withastro/astro/commit/0a31d9912de6b94f4e8fba3c820a00b6861dff19) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where Astro Actions types would be broken when using a `tsconfig.json` with `"moduleResolution": "nodenext"`

## 5.9.4

### Patch Changes

- [#13951](https://github.com/withastro/astro/pull/13951) [`7eb88f1`](https://github.com/withastro/astro/commit/7eb88f1e9113943b47e35e9f0033ab516f0a4f40) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a issue that caused errors when using an adapter-provided session driver with custom options

- [#13953](https://github.com/withastro/astro/pull/13953) [`448bddc`](https://github.com/withastro/astro/commit/448bddc49492c6a92a23735cd29a93baec0dda48) Thanks [@zaitovalisher](https://github.com/zaitovalisher)! - Fixes a bug where quotes were not added to the 'strict-dynamic' CSP directive

## 5.9.3

### Patch Changes

- [#13923](https://github.com/withastro/astro/pull/13923) [`a9ac5ed`](https://github.com/withastro/astro/commit/a9ac5ed3ff461d1c8e66fc40df3205df67c63059) Thanks [@ematipico](https://github.com/ematipico)! - **BREAKING CHANGE to the experimental Content Security Policy (CSP) only**

  Changes the behavior of experimental Content Security Policy (CSP) to now serve hashes differently depending on whether or not a page is prerendered:
  - Via the `<meta>` element for static pages.
  - Via the `Response` header `content-security-policy` for on-demand rendered pages.

  This new strategy allows you to add CSP content that is not supported in a `<meta>` element (e.g. `report-uri`, `frame-ancestors`, and sandbox directives) to on-demand rendered pages.

  No change to your project code is required as this is an implementation detail. However, this will result in a different HTML output for pages that are rendered on demand. Please check your production site to verify that CSP is working as intended.

  To keep up to date with this developing feature, or to leave feedback, visit the [CSP Roadmap proposal](https://github.com/withastro/roadmap/blob/feat/rfc-csp/proposals/0055-csp.md).

- [#13926](https://github.com/withastro/astro/pull/13926) [`953a249`](https://github.com/withastro/astro/commit/953a24924eda1ea564c97d10d68c97cbbc9db7a4) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new Astro Adapter Feature called `experimentalStaticHeaders` to allow your adapter to receive the `Headers` for rendered static pages.

  Adapters that enable support for this feature can access header values directly, affecting their handling of some Astro features such as Content Security Policy (CSP). For example, Astro will no longer serve the CSP `<meta http-equiv="content-security-policy">` element in static pages to adapters with this support.

  Astro will serve the value of the header inside a map that can be retrieved from the hook `astro:build:generated`. Adapters can read this mapping and use their hosting headers capabilities to create a configuration file.

  A new field called `experimentalRouteToHeaders` will contain a map of `Map<IntegrationResolvedRoute, Headers>` where the `Headers` type contains the headers emitted by the rendered static route.

  To enable support for this experimental Astro Adapter Feature, add it to your `adapterFeatures` in your adapter config:

  ```js
  // my-adapter.mjs
  export default function createIntegration() {
    return {
      name: '@example/my-adapter',
      hooks: {
        'astro:config:done': ({ setAdapter }) => {
          setAdapter({
            name: '@example/my-adapter',
            serverEntrypoint: '@example/my-adapter/server.js',
            adapterFeatures: {
              experimentalStaticHeaders: true,
            },
          });
        },
      },
    };
  }
  ```

  See the [Adapter API docs](https://docs.astro.build/en/reference/adapter-reference/#adapter-features) for more information about providing adapter features.

- [#13697](https://github.com/withastro/astro/pull/13697) [`af83b85`](https://github.com/withastro/astro/commit/af83b85d6ea1e2e27ee2b9357f794fee0418f453) Thanks [@benosmac](https://github.com/benosmac)! - Fixes issues with fallback route pattern matching when `i18n.routing.fallbackType` is `rewrite`.
  - Adds conditions for route matching in `generatePath` when building fallback routes and checking for existing translated pages

  Now for a route to be matched it needs to be inside a named `[locale]` folder. This fixes an issue where `route.pattern.test()` incorrectly matched dynamic routes, causing the page to be skipped.
  - Adds conditions for route matching in `findRouteToRewrite`

  Now the requested pathname must exist in `route.distURL` for a dynamic route to match. This fixes an issue where `route.pattern.test()` incorrectly matched dynamic routes, causing the build to fail.

- [#13924](https://github.com/withastro/astro/pull/13924) [`1cd8c3b`](https://github.com/withastro/astro/commit/1cd8c3bafca39f3cfe2178d5db72480d30ed28c2) Thanks [@qw-in](https://github.com/qw-in)! - Fixes an edge case where `isPrerendered` was incorrectly set to `false` for static redirects.

- [#13926](https://github.com/withastro/astro/pull/13926) [`953a249`](https://github.com/withastro/astro/commit/953a24924eda1ea564c97d10d68c97cbbc9db7a4) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the experimental CSP `meta` element wasn't placed in the `<head>` element as early as possible, causing these policies to not apply to styles and scripts that came before the `meta` element.

## 5.9.2

### Patch Changes

- [#13919](https://github.com/withastro/astro/pull/13919) [`423fe60`](https://github.com/withastro/astro/commit/423fe6048dfb4c24d198611f60a5815459efacd3) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where Astro added quotes to the CSP resources.

  Only certain resources require quotes (e.g. `'self'` but not `https://cdn.example.com`), so Astro no longer adds quotes to any resources. You must now provide the quotes yourself for resources such as `'self'` when necessary:

  ```diff
  export default defineConfig({
    experimental: {
      csp: {
        styleDirective: {
          resources: [
  -          "self",
  +          "'self'",
            "https://cdn.example.com"
          ]
        }
      }
    }
  })
  ```

- [#13914](https://github.com/withastro/astro/pull/13914) [`76c5480`](https://github.com/withastro/astro/commit/76c5480ac0ab1f64df38c23a848f8d28f7640562) Thanks [@ematipico](https://github.com/ematipico)! - **BREAKING CHANGE to the experimental Content Security Policy feature only**

  Removes support for experimental Content Security Policy (CSP) when using the `<ClientRouter />` component for view transitions.

  It is no longer possible to enable experimental CSP while using Astro's view transitions. Support was already unstable with the `<ClientRouter />` because CSP required making its underlying implementation asynchronous. This caused breaking changes for several users and therefore, this PR removes support completely.

  If you are currently using the component for view transitions, please remove the experimental CSP flag as they cannot be used together.

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
  -   csp: true
     }
  });
  ```

  Alternatively, to continue using experimental CSP in your project, you can [consider migrating to the browser native View Transition API](https://events-3bg.pages.dev/jotter/astro-view-transitions/) and remove the `<ClientRouter />` from your project. You may be able to achieve similar results if you are not using Astro's enhancements to the native View Transitions and Navigation APIs.

  Support might be reintroduced in future releases. You can follow this experimental feature's development in [the CSP RFC](https://github.com/withastro/roadmap/blob/feat/rfc-csp/proposals/0055-csp.md).

## 5.9.1

### Patch Changes

- [#13899](https://github.com/withastro/astro/pull/13899) [`7a1303d`](https://github.com/withastro/astro/commit/7a1303dbcebe0f0b5c8c3278669af5577115c0a3) Thanks [@reknih](https://github.com/reknih)! - Fix bug where error pages would return invalid bodies if the upstream response was compressed

- [#13902](https://github.com/withastro/astro/pull/13902) [`051bc30`](https://github.com/withastro/astro/commit/051bc3025523756474ff5be350a7680e9fed3384) Thanks [@arHSM](https://github.com/arHSM)! - Fixes a bug where vite virtual module ids were incorrectly added in the dev server

- [#13905](https://github.com/withastro/astro/pull/13905) [`81f71ca`](https://github.com/withastro/astro/commit/81f71ca6fd8b313b055eb4659c02a8e0e0335204) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Fixes wrong contents in CSP meta tag.

- [#13907](https://github.com/withastro/astro/pull/13907) [`8246bcc`](https://github.com/withastro/astro/commit/8246bcc0008880a49d9374136ec44488b629a2c3) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a bug that caused view transition names to be lost.

- [#13901](https://github.com/withastro/astro/pull/13901) [`37fa0a2`](https://github.com/withastro/astro/commit/37fa0a228cdfdaf20dd135835fdc84337f2d9637) Thanks [@ansg191](https://github.com/ansg191)! - fix fallback not being removed when server island is rendered

## 5.9.0

### Minor Changes

- [#13802](https://github.com/withastro/astro/pull/13802) [`0eafe14`](https://github.com/withastro/astro/commit/0eafe14b08c627b116842ea0a5299a00f9baa3d1) Thanks [@ematipico](https://github.com/ematipico)! - Adds experimental Content Security Policy (CSP) support

  CSP is an important feature to provide fine-grained control over resources that can or cannot be downloaded and executed by a document. In particular, it can help protect against [cross-site scripting (XSS)](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting) attacks.

  Enabling this feature adds additional security to Astro's handling of processed and bundled scripts and styles by default, and allows you to further configure these, and additional, content types. This new experimental feature has been designed to work in every Astro rendering environment (static pages, dynamic pages and single page applications), while giving you maximum flexibility and with type-safety in mind.

  It is compatible with most of Astro's features such as client islands, and server islands, although Astro's view transitions using the `<ClientRouter />` are not yet fully supported. Inline scripts are not supported out of the box, but you can provide your own hashes for external and inline scripts.

  To enable this feature, add the experimental flag in your Astro config:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      csp: true,
    },
  });
  ```

  For more information on enabling and using this feature in your project, see the [Experimental CSP docs](https://docs.astro.build/en/reference/experimental-flags/csp/).

  For a complete overview, and to give feedback on this experimental API, see the [Content Security Policy RFC](https://github.com/withastro/roadmap/blob/feat/rfc-csp/proposals/0055-csp.md).

- [#13850](https://github.com/withastro/astro/pull/13850) [`1766d22`](https://github.com/withastro/astro/commit/1766d222e7bb4adb6d15090e2d6331a0d8978303) Thanks [@ascorbic](https://github.com/ascorbic)! - Provides a Markdown renderer to content loaders

  When creating a content loader, you will now have access to a `renderMarkdown` function that allows you to render Markdown content directly within your loaders. It uses the same settings and plugins as the renderer used for Markdown files in Astro, and follows any Markdown settings you have configured in your Astro project.

  This allows you to render Markdown content from various sources, such as a CMS or other data sources, directly in your loaders without needing to preprocess the Markdown content separately.

  ```ts
  import type { Loader } from 'astro/loaders';
  import { loadFromCMS } from './cms';

  export function myLoader(settings): Loader {
    return {
      name: 'my-loader',
      async load({ renderMarkdown, store }) {
        const entries = await loadFromCMS();

        store.clear();

        for (const entry of entries) {
          // Assume each entry has a 'content' field with markdown content
          store.set({
            id: entry.id,
            data: entry,
            rendered: await renderMarkdown(entry.content),
          });
        }
      },
    };
  }
  ```

  The return value of `renderMarkdown` is an object with two properties: `html` and `metadata`. These match the `rendered` property of content entries in content collections, so you can use them to render the content in your components or pages.

  ```astro
  ---
  import { getEntry, render } from 'astro:content';
  const entry = await getEntry('my-collection', Astro.params.id);
  const { Content } = await render(entry);
  ---

  <Content />
  ```

  For more information, see the [Content Loader API docs](https://docs.astro.build/en/reference/content-loader-reference/#rendermarkdown).

- [#13887](https://github.com/withastro/astro/pull/13887) [`62f0668`](https://github.com/withastro/astro/commit/62f0668aa1e066c1c07ee0e774192def4cac43c4) Thanks [@yanthomasdev](https://github.com/yanthomasdev)! - Adds an option for integration authors to suppress adapter warning/errors in `supportedAstroFeatures`. This is useful when either an warning/error isn't applicable in a specific context or the default one might conflict and confuse users.

  To do so, you can add `suppress: "all"` (to suppress both the default and custom message) or `suppress: "default"` (to only suppress the default one):

  ```ts
  setAdapter({
    name: 'my-astro-integration',
    supportedAstroFeatures: {
      staticOutput: 'stable',
      hybridOutput: 'stable',
      sharpImageService: {
        support: 'limited',
        message:
          "The sharp image service isn't available in the deploy environment, but will be used by prerendered pages on build.",
        suppress: 'default',
      },
    },
  });
  ```

  For more information, see the [Adapter API reference docs](https://docs.astro.build/en/reference/adapter-reference/#astro-features).

## 5.8.2

### Patch Changes

- [#13877](https://github.com/withastro/astro/pull/13877) [`5a7797f`](https://github.com/withastro/astro/commit/5a7797fdd6ad3f1377e2719c79da9486a232dfcd) Thanks [@yuhang-dong](https://github.com/yuhang-dong)! - Fixes a bug that caused `Astro.rewrite` to fail when used in `sequence`d middleware

- [#13872](https://github.com/withastro/astro/pull/13872) [`442b841`](https://github.com/withastro/astro/commit/442b8413dc9d29892499cfa97e54798a3a6ee136) Thanks [@isVivek99](https://github.com/isVivek99)! - Fixes rendering of the `download` attribute when it has a boolean value

## 5.8.1

### Patch Changes

- [#13037](https://github.com/withastro/astro/pull/13037) [`de2fc9b`](https://github.com/withastro/astro/commit/de2fc9b3c406c21683b8a692fafa3cbc77ca552b) Thanks [@nanarino](https://github.com/nanarino)! - Fixes rendering of the `popover` attribute when it has a boolean value

- [#13851](https://github.com/withastro/astro/pull/13851) [`45ae95a`](https://github.com/withastro/astro/commit/45ae95a507d5e83b5e38ce1b338c3202ab7e8d76) Thanks [@ascorbic](https://github.com/ascorbic)! - Allows disabling default styles for responsive images

  This change adds a new `image.experimentalDefaultStyles` option that allows you to disable the default styles applied to responsive images.

  When using experimental responsive images, Astro applies default styles to ensure the images resize correctly. In most cases this is what you want – and they are applied with low specificity so your own styles override them. However in some cases you may want to disable these default styles entirely. This is particularly useful when using Tailwind 4, because it uses CSS cascade layers to apply styles, making it difficult to override the default styles.

  `image.experimentalDefaultStyles` is a boolean option that defaults to `true`, so you can change it in your Astro config file like this:

  ```js
  export default {
    image: {
      experimentalDefaultStyles: false,
    },
    experimental: {
      responsiveImages: true,
    },
  };
  ```

- [#13858](https://github.com/withastro/astro/pull/13858) [`cb1a168`](https://github.com/withastro/astro/commit/cb1a1681c844737477670ac42bb051bf93fae0a3) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes the warning shown when client directives are used on Astro components

- [#12574](https://github.com/withastro/astro/pull/12574) [`da266d0`](https://github.com/withastro/astro/commit/da266d0578c1a603d6f57913c6fa8eefd61a354e) Thanks [@apatel369](https://github.com/apatel369)! - Allows using server islands in mdx files

- [#13843](https://github.com/withastro/astro/pull/13843) [`fbcfa68`](https://github.com/withastro/astro/commit/fbcfa683d38f13378678c25b53cd789107752087) Thanks [@z1haze](https://github.com/z1haze)! - Export type `AstroSession` to allow use in explicitly typed safe code.

## 5.8.0

### Minor Changes

- [#13809](https://github.com/withastro/astro/pull/13809) [`3c3b492`](https://github.com/withastro/astro/commit/3c3b492375bd6a63f1fb6cede3685aff999be3c9) Thanks [@ascorbic](https://github.com/ascorbic)! - Increases minimum Node.js version to 18.20.8

  Node.js 18 has now reached end-of-life and should not be used. For now, Astro will continue to support Node.js 18.20.8, which is the final LTS release of Node.js 18, as well as Node.js 20 and Node.js 22 or later. We will drop support for Node.js 18 in a future release, so we recommend upgrading to Node.js 22 as soon as possible. See Astro's [Node.js support policy](https://docs.astro.build/en/upgrade-astro/#support) for more details.

  :warning: **Important note for users of Cloudflare Pages**: The current build image for Cloudflare Pages uses Node.js 18.17.1 by default, which is no longer supported by Astro. If you are using Cloudflare Pages you should [override the default Node.js version](https://developers.cloudflare.com/pages/configuration/build-image/#override-default-versions) to Node.js 22. This does not affect users of Cloudflare Workers, which uses Node.js 22 by default.

### Patch Changes

- Updated dependencies [[`3c3b492`](https://github.com/withastro/astro/commit/3c3b492375bd6a63f1fb6cede3685aff999be3c9)]:
  - @astrojs/telemetry@3.3.0
  - @astrojs/markdown-remark@6.3.2

## 5.7.14

### Patch Changes

- [#13773](https://github.com/withastro/astro/pull/13773) [`3aa5337`](https://github.com/withastro/astro/commit/3aa5337eaf01dbcc987dee9413c6985514ef7d6b) Thanks [@sijad](https://github.com/sijad)! - Ignores lightningcss unsupported pseudo-class warning.

- [#13833](https://github.com/withastro/astro/pull/13833) [`5a6d2ae`](https://github.com/withastro/astro/commit/5a6d2aede4b397227be5acecfa9bfefb9a1af0f8) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue where session modules would fail to resolve in Node.js < 20.6

- [#13383](https://github.com/withastro/astro/pull/13383) [`f7f712c`](https://github.com/withastro/astro/commit/f7f712cc29f80c4f8096489d7368c2fda223e097) Thanks [@Haberkamp](https://github.com/Haberkamp)! - Stop toolbar settings from overflowing

- [#13794](https://github.com/withastro/astro/pull/13794) [`85b19d8`](https://github.com/withastro/astro/commit/85b19d87b6416957c245bd3e239fbf6da2038075) Thanks [@alexcarpenter](https://github.com/alexcarpenter)! - Exclude pre tags from `a11y-no-noninteractive-tabindex` audit check.

- [#13373](https://github.com/withastro/astro/pull/13373) [`50ef568`](https://github.com/withastro/astro/commit/50ef568413b5fe7add36c089b77f9f180739f43f) Thanks [@jpwienekus](https://github.com/jpwienekus)! - Fixes a bug where highlights and tooltips render over the audit list window.

- [#13769](https://github.com/withastro/astro/pull/13769) [`e9fc456`](https://github.com/withastro/astro/commit/e9fc456b58511da3ae2f932256217b3db4c42998) Thanks [@romanstetsyk](https://github.com/romanstetsyk)! - Expand ActionError codes to include all IANA-registered HTTP error codes.

- [#13668](https://github.com/withastro/astro/pull/13668) [`866285a`](https://github.com/withastro/astro/commit/866285a5fb3e4ba9d8ca6aadb129d3a6ed2b0f69) Thanks [@sapphi-red](https://github.com/sapphi-red)! - Replaces internal CSS chunking behavior for Astro components' scoped styles to use Vite's `cssScopeTo` feature. The feature is a port of Astro's implementation so this should not change the behavior.

## 5.7.13

### Patch Changes

- [#13761](https://github.com/withastro/astro/pull/13761) [`a2e8463`](https://github.com/withastro/astro/commit/a2e84631ad0a8dbc466d1301cc07a031334ffe5b) Thanks [@jp-knj](https://github.com/jp-knj)! - Adds new content collections errors

- [#13788](https://github.com/withastro/astro/pull/13788) [`7d0b7ac`](https://github.com/withastro/astro/commit/7d0b7acb38d5140939d9660b2cf5718e9a8b2c15) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where an error would not be thrown when using the `<Font />` component from the experimental fonts API without adding fonts in the Astro config

- [#13784](https://github.com/withastro/astro/pull/13784) [`d7a1889`](https://github.com/withastro/astro/commit/d7a188988427d1b157d27b789f918c208ece41f7) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes the experimental fonts API to correctly take `config.base`, `config.build.assets` and `config.build.assetsPrefix` into account

- [#13777](https://github.com/withastro/astro/pull/13777) [`a56b8ea`](https://github.com/withastro/astro/commit/a56b8eaec486d26cbc61a7c94c152f4ee8cabc7a) Thanks [@L4Ph](https://github.com/L4Ph)! - Fixed an issue where looping GIF animation would stop when converted to WebP

- [#13566](https://github.com/withastro/astro/pull/13566) [`0489d8f`](https://github.com/withastro/astro/commit/0489d8fe96fb8ee90284277358e38f55c8e0ab1d) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fix build errors being ignored when build.concurrency > 1

## 5.7.12

### Patch Changes

- [#13752](https://github.com/withastro/astro/pull/13752) [`a079c21`](https://github.com/withastro/astro/commit/a079c21629ecf95b7539d9afdf90831266d00daf) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves handling of font URLs not ending with a file extension when using the experimental fonts API

- [#13750](https://github.com/withastro/astro/pull/13750) [`7d3127d`](https://github.com/withastro/astro/commit/7d3127db9191556d2ead8a1ea35acb972ee67ec3) Thanks [@martrapp](https://github.com/martrapp)! - Allows the ClientRouter to open new tabs or windows when submitting forms by clicking while holding the Cmd, Ctrl, or Shift key.

- [#13765](https://github.com/withastro/astro/pull/13765) [`d874fe0`](https://github.com/withastro/astro/commit/d874fe08f903a44cd8017313accbc02bcf9cb7d9) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where font sources with relative protocol URLs would fail when using the experimental fonts API

- [#13640](https://github.com/withastro/astro/pull/13640) [`5e582e7`](https://github.com/withastro/astro/commit/5e582e7b4d56425d622c97ad933b1da0e7434155) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Allows inferring `weight` and `style` when using the local provider of the experimental fonts API

  If you want Astro to infer those properties directly from your local font files, leave them undefined:

  ```js
  {
    // No weight specified: infer
    style: 'normal'; // Do not infer
  }
  ```

## 5.7.11

### Patch Changes

- [#13734](https://github.com/withastro/astro/pull/13734) [`30aec73`](https://github.com/withastro/astro/commit/30aec7372b630649e1e484d9453842d3c36eaa26) Thanks [@ascorbic](https://github.com/ascorbic)! - Loosen content layer schema types

- [#13751](https://github.com/withastro/astro/pull/13751) [`5816b8a`](https://github.com/withastro/astro/commit/5816b8a6d1295b297c9562ec245db6c60c37f1b1) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `unifont` to support subsets when using the `google` provider with the experimental fonts API

- [#13756](https://github.com/withastro/astro/pull/13756) [`d4547ba`](https://github.com/withastro/astro/commit/d4547bafef559b4f9ecd6e407d531aa51c46f7be) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a terminal warning when a remote provider returns no data for a family when using the experimental fonts API

- [#13742](https://github.com/withastro/astro/pull/13742) [`f599463`](https://github.com/withastro/astro/commit/f5994639120552e38e65c5d4d9688c1a3aa92f90) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes optimized fallback css generation to properly add a `src` when using the experimental fonts API

- [#13740](https://github.com/withastro/astro/pull/13740) [`6935540`](https://github.com/withastro/astro/commit/6935540e44e5c75fd2106e3ae37add5e8ae7c67f) Thanks [@vixalien](https://github.com/vixalien)! - Fix cookies set after middleware did a rewrite with `next(url)` not being applied

- [#13759](https://github.com/withastro/astro/pull/13759) [`4a56d0a`](https://github.com/withastro/astro/commit/4a56d0a44fb472ef2e3a9999c1b69a52da1afed3) Thanks [@jp-knj](https://github.com/jp-knj)! - Improved the error handling of certain error cases.

## 5.7.10

### Patch Changes

- [#13731](https://github.com/withastro/astro/pull/13731) [`c3e80c2`](https://github.com/withastro/astro/commit/c3e80c25b90c803e2798b752583a8e77cdad3146) Thanks [@jsparkdev](https://github.com/jsparkdev)! - update vite to latest version for fixing CVE

## 5.7.9

### Patch Changes

- [#13711](https://github.com/withastro/astro/pull/13711) [`2103991`](https://github.com/withastro/astro/commit/210399155a6004e8e975f9024ae6d7e9945ae9a9) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes height for responsive images

## 5.7.8

### Patch Changes

- [#13715](https://github.com/withastro/astro/pull/13715) [`b32dffa`](https://github.com/withastro/astro/commit/b32dffab6e16388c87fb5e8bb423ed02d88586bb) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `unifont` to fix a case where a `unicodeRange` related error would be thrown when using the experimental fonts API

## 5.7.7

### Patch Changes

- [#13705](https://github.com/withastro/astro/pull/13705) [`28f8716`](https://github.com/withastro/astro/commit/28f8716ceef8b30ebb4da8c6ef32acc72405c1e6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates unifont to latest and adds support for `fetch` options from remote providers when using the experimental fonts API

- [#13692](https://github.com/withastro/astro/pull/13692) [`60d5be4`](https://github.com/withastro/astro/commit/60d5be4af49a72e3739f74424c3d5c423f98c133) Thanks [@Le0Developer](https://github.com/Le0Developer)! - Fixes a bug where Astro couldn't probably use `inferSize` for images that contain apostrophe `'` in their name.

- [#13698](https://github.com/withastro/astro/pull/13698) [`ab98f88`](https://github.com/withastro/astro/commit/ab98f884f2f8639a8f385cdbc919bc829014f64d) Thanks [@sarah11918](https://github.com/sarah11918)! - Improves the configuration reference docs for the `adapter` entry with more relevant text and links.

- [#13706](https://github.com/withastro/astro/pull/13706) [`b4929ae`](https://github.com/withastro/astro/commit/b4929ae9e77f74bde251e81abc0a80e160de774a) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes typechecking for content config schema

- [#13653](https://github.com/withastro/astro/pull/13653) [`a7b2dc6`](https://github.com/withastro/astro/commit/a7b2dc60ca94f42a66575feb190e8b0f36b48e7c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Reduces the amount of preloaded files for the local provider when using the experimental fonts API

- [#13653](https://github.com/withastro/astro/pull/13653) [`a7b2dc6`](https://github.com/withastro/astro/commit/a7b2dc60ca94f42a66575feb190e8b0f36b48e7c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where invalid CSS was emitted when using an experimental fonts API family name containing a space

## 5.7.6

### Patch Changes

- [#13703](https://github.com/withastro/astro/pull/13703) [`659904b`](https://github.com/withastro/astro/commit/659904bd999c6abdd62f18230954b7097dcbb7fe) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug where empty fallbacks could not be provided when using the experimental fonts API

- [#13680](https://github.com/withastro/astro/pull/13680) [`18e1b97`](https://github.com/withastro/astro/commit/18e1b978f045f4c21d9cb4241a8c7fbb956d2efe) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the `UnsupportedExternalRedirect` error message to include more details such as the concerned destination

- [#13703](https://github.com/withastro/astro/pull/13703) [`659904b`](https://github.com/withastro/astro/commit/659904bd999c6abdd62f18230954b7097dcbb7fe) Thanks [@ascorbic](https://github.com/ascorbic)! - Simplifies styles for experimental responsive images

  :warning: **BREAKING CHANGE FOR EXPERIMENTAL RESPONSIVE IMAGES ONLY** :warning:

  The generated styles for image layouts are now simpler and easier to override. Previously the responsive image component used CSS to set the size and aspect ratio of the images, but this is no longer needed. Now the styles just include `object-fit` and `object-position` for all images, and sets `max-width: 100%` for constrained images and `width: 100%` for full-width images.

  This is an implementation change only, and most users will see no change. However, it may affect any custom styles you have added to your responsive images. Please check your rendered images to determine whether any change to your CSS is needed.

  The styles now use the [`:where()` pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/:where), which has a [specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity) of 0, meaning that it is easy to override with your own styles. You can now be sure that your own classes will always override the applied styles, as will global styles on `img`.

  An exception is Tailwind 4, which uses [cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), meaning the rules are always lower specificity. Astro supports browsers that do not support cascade layers, so we cannot use this. If you need to override the styles using Tailwind 4, you must use `!important` classes. Do check if this is needed though: there may be a layout that is more appropriate for your use case.

- [#13703](https://github.com/withastro/astro/pull/13703) [`659904b`](https://github.com/withastro/astro/commit/659904bd999c6abdd62f18230954b7097dcbb7fe) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds warnings about using local font files in the `publicDir` when the experimental fonts API is enabled.

- [#13703](https://github.com/withastro/astro/pull/13703) [`659904b`](https://github.com/withastro/astro/commit/659904bd999c6abdd62f18230954b7097dcbb7fe) Thanks [@ascorbic](https://github.com/ascorbic)! - Renames experimental responsive image layout option from "responsive" to "constrained"

  :warning: **BREAKING CHANGE FOR EXPERIMENTAL RESPONSIVE IMAGES ONLY** :warning:

  The layout option called `"responsive"` is renamed to `"constrained"` to better reflect its behavior.

  The previous name was causing confusion, because it is also the name of the feature. The `responsive` layout option is specifically for images that are displayed at the requested size, unless they do not fit the width of their container, at which point they would be scaled down to fit. They do not get scaled beyond the intrinsic size of the source image, or the `width` prop if provided.

  It became clear from user feedback that many people (understandably) thought that they needed to set `layout` to `responsive` if they wanted to use responsive images. They then struggled with overriding styles to make the image scale up for full-width hero images, for example, when they should have been using `full-width` layout. Renaming the layout to `constrained` should make it clearer that this layout is for when you want to constrain the maximum size of the image, but allow it to scale-down.

  #### Upgrading

  If you set a default `image.experimentalLayout` in your `astro.config.mjs`, or set it on a per-image basis using the `layout` prop, you will need to change all occurences to `constrained`:

  ```diff lang="ts"
  // astro.config.mjs
  export default {
    image: {
  -    experimentalLayout: 'responsive',
  +    experimentalLayout: 'constrained',
    },
  }
  ```

  ```diff lang="astro"
  // src/pages/index.astro
  ---
  import { Image } from 'astro:assets';
  ---
  - <Image src="/image.jpg" layout="responsive" />
  + <Image src="/image.jpg" layout="constrained" />
  ```

  Please [give feedback on the RFC](https://github.com/withastro/roadmap/pull/1051) if you have any questions or comments about the responsive images API.

## 5.7.5

### Patch Changes

- [#13660](https://github.com/withastro/astro/pull/13660) [`620d15d`](https://github.com/withastro/astro/commit/620d15d8483dfb1822cd47833bc1653e0b704ccb) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Adds `server.allowedHosts` docs comment to `AstroUserConfig`

- [#13591](https://github.com/withastro/astro/pull/13591) [`5dd2d3f`](https://github.com/withastro/astro/commit/5dd2d3fde8a138ed611dedf39ffa5dfeeed315f8) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes unused code

- [#13669](https://github.com/withastro/astro/pull/13669) [`73f24d4`](https://github.com/withastro/astro/commit/73f24d400acdc48462a7bc5277b8cee2bcf97580) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where `Astro.originPathname` wasn't returning the correct value when using rewrites.

- [#13674](https://github.com/withastro/astro/pull/13674) [`42388b2`](https://github.com/withastro/astro/commit/42388b24d6eb866a3129118d22b2f6c71071d0bd) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where an experimental fonts API error would be thrown when using another `astro:assets` API

- [#13654](https://github.com/withastro/astro/pull/13654) [`4931457`](https://github.com/withastro/astro/commit/49314575a76b52b43e491a0a33c0ccaf9cafb058) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes `fontProviders.google()` so it can forward options to the unifont provider, when using the experimental fonts API

- Updated dependencies [[`5dd2d3f`](https://github.com/withastro/astro/commit/5dd2d3fde8a138ed611dedf39ffa5dfeeed315f8)]:
  - @astrojs/telemetry@3.2.1

## 5.7.4

### Patch Changes

- [#13647](https://github.com/withastro/astro/pull/13647) [`ffbe8f2`](https://github.com/withastro/astro/commit/ffbe8f27a3e897971432eed1fde566db328b540d) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused a session error to be logged when using actions without sessions

- [#13646](https://github.com/withastro/astro/pull/13646) [`6744842`](https://github.com/withastro/astro/commit/67448426fb4e2289ef8bc25d97bd617456b18b68) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where extra font sources were removed when using the experimental fonts API

- [#13635](https://github.com/withastro/astro/pull/13635) [`d75cac4`](https://github.com/withastro/astro/commit/d75cac45de8790331aad134ae91bfeb1943cd458) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - The experimental fonts API now generates optimized fallbacks for every weight and style

## 5.7.3

### Patch Changes

- [#13643](https://github.com/withastro/astro/pull/13643) [`67b7493`](https://github.com/withastro/astro/commit/67b749391a9069ae1d94ef646b68a99973ef44d7) Thanks [@tanishqmanuja](https://github.com/tanishqmanuja)! - Fixes a case where the font face `src` format would be invalid when using the experimental fonts API

- [#13639](https://github.com/withastro/astro/pull/13639) [`23410c6`](https://github.com/withastro/astro/commit/23410c644f5fc528ef630f2bcbe58c68dfe0c719) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where some font families would not be downloaded when using the same font provider several times, using the experimental fonts API

## 5.7.2

### Patch Changes

- [#13632](https://github.com/withastro/astro/pull/13632) [`cb05cfb`](https://github.com/withastro/astro/commit/cb05cfba12d1c6ea8cee98552c86a98bfb56794c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the optimized fallback name generated by the experimental Fonts API

- [#13630](https://github.com/withastro/astro/pull/13630) [`3e7db4f`](https://github.com/withastro/astro/commit/3e7db4f802f69404ad2a3c3a3710452554ee40ec) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where fonts using a local provider would not work because of an invalid generated `src`

- [#13634](https://github.com/withastro/astro/pull/13634) [`516de7d`](https://github.com/withastro/astro/commit/516de7dbe6d8aac20bb0ca8243c92cc7cbd730ce) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where using `next('/')` didn't correctly return the requested route.

- [#13632](https://github.com/withastro/astro/pull/13632) [`cb05cfb`](https://github.com/withastro/astro/commit/cb05cfba12d1c6ea8cee98552c86a98bfb56794c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the quality of optimized fallbacks generated by the experimental Fonts API

- [#13616](https://github.com/withastro/astro/pull/13616) [`d475afc`](https://github.com/withastro/astro/commit/d475afcae7259204072e644e3d66e5479510f410) Thanks [@lfilho](https://github.com/lfilho)! - Fixes a regression where relative static redirects didn't work as expected.

## 5.7.1

### Patch Changes

- [#13594](https://github.com/withastro/astro/pull/13594) [`dc4a015`](https://github.com/withastro/astro/commit/dc4a015cf33c01b659e07b7d31dbd49f1c2ebfdf) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Reduces the number of font files downloaded

- [#13627](https://github.com/withastro/astro/pull/13627) [`7f1a624`](https://github.com/withastro/astro/commit/7f1a62484ed17fe7a9be5d1e2bb71e2fd12b9fed) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where using the `<Font />` component would throw a Rollup error during the build

- [#13626](https://github.com/withastro/astro/pull/13626) [`3838efe`](https://github.com/withastro/astro/commit/3838efe5028256e0e28bf823f868bcda6ef1e775) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates fallback font generation to always read font files returned by font providers

- [#13625](https://github.com/withastro/astro/pull/13625) [`f1311d2`](https://github.com/withastro/astro/commit/f1311d2acb6dd7a75f7ea10eea3a02fbe674eb2a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates the `<Font />` component so that preload links are generated before the style tag if `preload` is passed

- [#13622](https://github.com/withastro/astro/pull/13622) [`a70d32a`](https://github.com/withastro/astro/commit/a70d32a4284ef18c3f93196f44c1fcf3ff56d3d5) Thanks [@ascorbic](https://github.com/ascorbic)! - Improve autocomplete for session keys

## 5.7.0

### Minor Changes

- [#13527](https://github.com/withastro/astro/pull/13527) [`2fd6a6b`](https://github.com/withastro/astro/commit/2fd6a6b7aa51a4713af7fac37d5dfd824543c1bc) Thanks [@ascorbic](https://github.com/ascorbic)! - The experimental session API introduced in Astro 5.1 is now stable and ready for production use.

  Sessions are used to store user state between requests for [on-demand rendered pages](https://astro.build/en/guides/on-demand-rendering/). You can use them to store user data, such as authentication tokens, shopping cart contents, or any other data that needs to persist across requests:

  ```astro
  ---
  export const prerender = false; // Not needed with 'server' output
  const cart = await Astro.session.get('cart');
  ---

  <a href="/checkout">🛒 {cart?.length ?? 0} items</a>
  ```

  #### Configuring session storage

  Sessions require a storage driver to store the data. The Node, Cloudflare and Netlify adapters automatically configure a default driver for you, but other adapters currently require you to specify a custom storage driver in your configuration.

  If you are using an adapter that doesn't have a default driver, or if you want to choose a different driver, you can configure it using the `session` configuration option:

  ```js
  import { defineConfig } from 'astro/config';
  import vercel from '@astrojs/vercel';

  export default defineConfig({
    adapter: vercel(),
    session: {
      driver: 'upstash',
    },
  });
  ```

  #### Using sessions

  Sessions are available in on-demand rendered pages, API endpoints, actions and middleware.

  In pages and components, you can access the session using `Astro.session`:

  ```astro
  ---
  const cart = await Astro.session.get('cart');
  ---

  <a href="/checkout">🛒 {cart?.length ?? 0} items</a>
  ```

  In endpoints, actions, and middleware, you can access the session using `context.session`:

  ```js
  export async function GET(context) {
    const cart = await context.session.get('cart');
    return Response.json({ cart });
  }
  ```

  If you attempt to access the session when there is no storage driver configured, or in a prerendered page, the session object will be `undefined` and an error will be logged in the console:

  ```astro
  ---
  export const prerender = true;
  const cart = await Astro.session?.get('cart'); // Logs an error. Astro.session is undefined
  ---
  ```

  #### Upgrading from Experimental to Stable

  If you were previously using the experimental API, please remove the `experimental.session` flag from your configuration:

  ```diff
  import { defineConfig } from 'astro/config';
  import node from '@astrojs/node';

  export default defineConfig({
     adapter: node({
       mode: "standalone",
     }),
  -  experimental: {
  -    session: true,
  -  },
  });
  ```

  See [the sessions guide](https://docs.astro.build/en/guides/sessions/) for more information.

- [#12775](https://github.com/withastro/astro/pull/12775) [`b1fe521`](https://github.com/withastro/astro/commit/b1fe521e2c45172b786594c50c0ca595105a6d68) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new, experimental Fonts API to provide first-party support for fonts in Astro.

  This experimental feature allows you to use fonts from both your file system and several built-in supported providers (e.g. Google, Fontsource, Bunny) through a unified API. Keep your site performant thanks to sensible defaults and automatic optimizations including fallback font generation.

  To enable this feature, configure an `experimental.fonts` object with one or more fonts:

  ```js title="astro.config.mjs"
  import { defineConfig, fontProviders } from "astro/config"

  export default defineConfig({
      experimental: {
          fonts: [{
              provider: fontProviders.google(),
        `      name: "Roboto",
              cssVariable: "--font-roboto",
          }]
      }
  })
  ```

  Then, add a `<Font />` component and site-wide styling in your `<head>`:

  ```astro title="src/components/Head.astro"
  ---
  import { Font } from 'astro:assets';
  ---

  <Font cssVariable="--font-roboto" preload />
  <style>
    body {
      font-family: var(--font-roboto);
    }
  </style>
  ```

  Visit [the experimental Fonts documentation](https://docs.astro.build/en/reference/experimental-flags/fonts/) for the full API, how to get started, and even how to build your own custom `AstroFontProvider` if we don't yet support your preferred font service.

  For a complete overview, and to give feedback on this experimental API, see the [Fonts RFC](https://github.com/withastro/roadmap/pull/1039) and help shape its future.

- [#13560](https://github.com/withastro/astro/pull/13560) [`df3fd54`](https://github.com/withastro/astro/commit/df3fd5434514b68cf1fe499a2e28bc1215bd253d) Thanks [@ematipico](https://github.com/ematipico)! - The virtual module `astro:config` introduced behind a flag in [v5.2.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#520) is no longer experimental and is available for general use.

  This virtual module exposes two sub-paths for type-safe, controlled access to your configuration:
  - `astro:config/client`: exposes config information that is safe to expose to the client.
  - `astro:config/server`: exposes additional information that is safe to expose to the server, such as file and directory paths.

  Access these in any file inside your project to import and use select values from your Astro config:

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

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  // astro.config.mjs
  export default defineConfig({
  -  experimental: {
  -    serializeConfig: true
  -  }
  })
  ```

  If you have been waiting for feature stabilization before using configuration imports, you can now do so.

  Please see [the `astro:config` reference](https://docs.astro.build/en/my-feature/) for more about this feature.

- [#13578](https://github.com/withastro/astro/pull/13578) [`406501a`](https://github.com/withastro/astro/commit/406501aeb7f314ae5c31f31a373c270e3b9ec715) Thanks [@stramel](https://github.com/stramel)! - The SVG import feature introduced behind a flag in [v5.0.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#500) is no longer experimental and is available for general use.

  This feature allows you to import SVG files directly into your Astro project as components and inline them into your HTML.

  To use this feature, import an SVG file in your Astro project, passing any common SVG attributes to the imported component.

  ```astro
  ---
  import Logo from './path/to/svg/file.svg';
  ---

  <Logo width={64} height={64} fill="currentColor" />
  ```

  If you have been waiting for stabilization before using the SVG Components feature, you can now do so.

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    svg: true,
  -  }
  })
  ```

  Additionally, a few features that were available during the experimental stage were removed in a previous release. Please see [the v5.6.0 changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#560) for details if you have not yet already updated your project code for the experimental feature accordingly.

  Please see the [SVG Components guide in docs](https://docs.astro.build/en/guides/images/#svg-components) for more about this feature.

### Patch Changes

- [#13602](https://github.com/withastro/astro/pull/13602) [`3213450`](https://github.com/withastro/astro/commit/3213450bda5b21527a03d292a5f222f35293f9bb) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Updates the [Audit](http://docs.astro.build/en/guides/dev-toolbar/#audit) dev toolbar app to automatically strip `data-astro-source-file` and `data-astro-source-loc` attributes in dev mode.

- [#13598](https://github.com/withastro/astro/pull/13598) [`f5de51e`](https://github.com/withastro/astro/commit/f5de51e94755cdbeaa19667309b5f1aa0c416bd4) Thanks [@dreyfus92](https://github.com/dreyfus92)! - Fix routing with base paths when trailingSlash is set to 'never'. This ensures requests to '/base' are correctly matched when the base path is set to '/base', without requiring a trailing slash.

- [#13603](https://github.com/withastro/astro/pull/13603) [`d038030`](https://github.com/withastro/astro/commit/d038030770b294e811beb99c9478fbe4b4cbb968) Thanks [@sarah11918](https://github.com/sarah11918)! - Adds the minimal starter template to the list of `create astro` options

  Good news if you're taking the introductory tutorial in docs, making a minimal reproduction, or just want to start a project with as little to rip out as possible. Astro's `minimal` (empty) template is now back as one of the options when running `create astro@latest` and starting a new project!

## 5.6.2

### Patch Changes

- [#13606](https://github.com/withastro/astro/pull/13606) [`793ecd9`](https://github.com/withastro/astro/commit/793ecd916e4e815886a57b85bd1739f704faae7f) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes a regression that allowed prerendered code to leak into the server bundle.

- [#13576](https://github.com/withastro/astro/pull/13576) [`1c60ec3`](https://github.com/withastro/astro/commit/1c60ec3c4d8518208737de405b1bc0b5b285a0c9) Thanks [@ascorbic](https://github.com/ascorbic)! - Reduces duplicate code in server islands scripts by extracting shared logic into a helper function.

- [#13588](https://github.com/withastro/astro/pull/13588) [`57e59be`](https://github.com/withastro/astro/commit/57e59bec40ec2febd32065324505087caec9038a) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes a memory leak when using SVG assets.

- [#13589](https://github.com/withastro/astro/pull/13589) [`5a0563d`](https://github.com/withastro/astro/commit/5a0563de9e377ba7b0af7e055a85893773616d4b) Thanks [@ematipico](https://github.com/ematipico)! - Deprecates the asset utility function `emitESMImage()` and adds a new `emitImageMetadata()` to be used instead

  The function
  `emitESMImage()` is now deprecated. It will continue to function, but it is no longer recommended nor supported. This function will be completely removed in a next major release of Astro.

  Please replace it with the new function`emitImageMetadata()` as soon as you are able to do so:

  ```diff
  - import { emitESMImage } from "astro/assets/utils";
  + import { emitImageMetadata } from "astro/assets/utils";
  ```

  The new function returns the same signature as the previous one. However, the new function removes two deprecated arguments that were not meant to be exposed for public use: `_watchMode` and `experimentalSvgEnabled`. Since it was possible to access these with the old function, you may need to verify that your code still works as intended with `emitImageMetadata()`.

- [#13596](https://github.com/withastro/astro/pull/13596) [`3752519`](https://github.com/withastro/astro/commit/375251966d1b28a570bff45ff0fe7e7d2fe46f72) Thanks [@jsparkdev](https://github.com/jsparkdev)! - update vite to latest version to fix CVE

- [#13547](https://github.com/withastro/astro/pull/13547) [`360cb91`](https://github.com/withastro/astro/commit/360cb9199a4314f90825c5639ff4396760e9cfcc) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Updates vite to the latest version

- [#13548](https://github.com/withastro/astro/pull/13548) [`e588527`](https://github.com/withastro/astro/commit/e588527b4c3de7759ef7d10d3004405d0b197f48) Thanks [@ryuapp](https://github.com/ryuapp)! - Support for Deno to install npm pacakges.

  Deno requires npm prefix to install packages on npm. For example, to install react, we need to run `deno add npm:react`. But currently the command executed is `deno add react`, which doesn't work. So, we change the package names to have an npm prefix if you are using Deno.

- [#13587](https://github.com/withastro/astro/pull/13587) [`a0774b3`](https://github.com/withastro/astro/commit/a0774b376a4f24e2bf1db5b70616dff63d7412dd) Thanks [@robertoms99](https://github.com/robertoms99)! - Fixes an issue with the client router where some attributes of the root element were not updated during swap, including the transition scope.

## 5.6.1

### Patch Changes

- [#13519](https://github.com/withastro/astro/pull/13519) [`3323f5c`](https://github.com/withastro/astro/commit/3323f5c554a3af966463cc95a42d7ca789ba678b) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Refactors some internals to improve Rolldown compatibility

- [#13545](https://github.com/withastro/astro/pull/13545) [`a7aff41`](https://github.com/withastro/astro/commit/a7aff41681f9235719c03f97650db288f9f5f71a) Thanks [@stramel](https://github.com/stramel)! - Prevent empty attributes from appearing in the SVG output

- [#13552](https://github.com/withastro/astro/pull/13552) [`9cd0fd4`](https://github.com/withastro/astro/commit/9cd0fd432634ed664a820ac78c6a3033684c7a83) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro validated the i18n configuration incorrectly, causing false positives in downstream libraries.

## 5.6.0

### Minor Changes

- [#13403](https://github.com/withastro/astro/pull/13403) [`dcb9526`](https://github.com/withastro/astro/commit/dcb9526c6ece3b716c677205fb99b483c95bfa7d) Thanks [@yurynix](https://github.com/yurynix)! - Adds a new optional `prerenderedErrorPageFetch` option in the Adapter API to allow adapters to provide custom implementations for fetching prerendered error pages.

  Now, adapters can override the default `fetch()` behavior, for example when `fetch()` is unavailable or when you cannot call the server from itself.

  The following example provides a custom fetch for `500.html` and `404.html`, reading them from disk instead of performing an HTTP call:

  ```js "prerenderedErrorPageFetch"
  return app.render(request, {
    prerenderedErrorPageFetch: async (url: string): Promise<Response> => {
      if (url.includes("/500")) {
          const content = await fs.promises.readFile("500.html", "utf-8");
          return new Response(content, {
            status: 500,
            headers: { "Content-Type": "text/html" },
          });
      }
      const content = await fs.promises.readFile("404.html", "utf-8");
        return new Response(content, {
          status: 404,
          headers: { "Content-Type": "text/html" },
        });
  });
  ```

  If no value is provided, Astro will fallback to its default behavior for fetching error pages.

  Read more about this feature in the [Adapter API reference](https://docs.astro.build/en/reference/adapter-reference/#prerenderederrorpagefetch).

- [#13482](https://github.com/withastro/astro/pull/13482) [`ff257df`](https://github.com/withastro/astro/commit/ff257df4e1a7f3e29e9bf7f92d52bf72f7b595a4) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates Astro config validation to also run for the Integration API. An error log will specify which integration is failing the validation.

  Now, Astro will first validate the user configuration, then validate the updated configuration after each integration `astro:config:setup` hook has run. This means `updateConfig()` calls will no longer accept invalid configuration.

  This fixes a situation where integrations could potentially update a project with a malformed configuration. These issues should now be caught and logged so that you can update your integration to only set valid configurations.

- [#13405](https://github.com/withastro/astro/pull/13405) [`21e7e80`](https://github.com/withastro/astro/commit/21e7e8077d6f0c9ad14fe1876d87bb445f5584b1) Thanks [@Marocco2](https://github.com/Marocco2)! - Adds a new `eagerness` option for `prefetch()` when using `experimental.clientPrerender`

  With the experimental [`clientPrerender`](https://docs.astro.build/en/reference/experimental-flags/client-prerender/) flag enabled, you can use the `eagerness` option on `prefetch()` to suggest to the browser how eagerly it should prefetch/prerender link targets.

  This follows the same API described in the [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/speculationrules#eagerness) and allows you to balance the benefit of reduced wait times against bandwidth, memory, and CPU costs for your site visitors.

  For example, you can now use `prefetch()` programmatically with large sets of links and avoid [browser limits in place to guard against over-speculating](https://developer.chrome.com/blog/speculation-rules-improvements#chrome-limits) (prerendering/prefetching too many links). Set `eagerness: 'moderate'` to take advantage of [First In, First Out (FIFO)](<https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)>) strategies and browser heuristics to let the browser decide when to prerender/prefetch them and in what order:

  ```astro
  <a class="link-moderate" href="/nice-link-1">A Nice Link 1</a>
  <a class="link-moderate" href="/nice-link-2">A Nice Link 2</a>
  <a class="link-moderate" href="/nice-link-3">A Nice Link 3</a>
  <a class="link-moderate" href="/nice-link-4">A Nice Link 4</a>
  ...
  <a class="link-moderate" href="/nice-link-20">A Nice Link 20</a>
  <script>
    import { prefetch } from 'astro:prefetch';
    const linkModerate = document.getElementsByClassName('link-moderate');
    linkModerate.forEach((link) => prefetch(link.getAttribute('href'), { eagerness: 'moderate' }));
  </script>
  ```

- [#13482](https://github.com/withastro/astro/pull/13482) [`ff257df`](https://github.com/withastro/astro/commit/ff257df4e1a7f3e29e9bf7f92d52bf72f7b595a4) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves integrations error handling

  If an error is thrown from an integration hook, an error log will now provide information about the concerned integration and hook

### Patch Changes

- [#13539](https://github.com/withastro/astro/pull/13539) [`c43bf8c`](https://github.com/withastro/astro/commit/c43bf8cd0513c2260d4ba32b5beffe97306e2e09) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a new `session.load()` method to the experimental session API that allows you to load a session by ID.

  When using [the experimental sessions API](https://docs.astro.build/en/reference/experimental-flags/sessions/), you don't normally need to worry about managing the session ID and cookies: Astro automatically reads the user's cookies and loads the correct session when needed. However, sometimes you need more control over which session to load.

  The new `load()` method allows you to manually load a session by ID. This is useful if you are handling the session ID yourself, or if you want to keep track of a session without using cookies. For example, you might want to restore a session from a logged-in user on another device, or work with an API endpoint that doesn't use cookies.

  ```ts
  // src/pages/api/cart.ts
  import type { APIRoute } from 'astro';

  export const GET: APIRoute = async ({ session, request }) => {
    // Load the session from a header instead of cookies
    const sessionId = request.headers.get('x-session-id');
    await session.load(sessionId);
    const cart = await session.get('cart');
    return Response.json({ cart });
  };
  ```

  If a session with that ID doesn't exist, a new one will be created. This allows you to generate a session ID in the client if needed.

  For more information, see the [experimental sessions docs](https://docs.astro.build/en/reference/experimental-flags/sessions/).

- [#13488](https://github.com/withastro/astro/pull/13488) [`d777420`](https://github.com/withastro/astro/commit/d7774207b11d042711ec310f2ad46d15246482f0) Thanks [@stramel](https://github.com/stramel)! - **BREAKING CHANGE to the experimental SVG Component API only**

  Removes some previously available prop, attribute, and configuration options from the experimental SVG API. These items are no longer available and must be removed from your code:
  - The `title` prop has been removed until we can settle on the correct balance between developer experience and accessibility. Please replace any `title` props on your components with `aria-label`:
    ```diff
    - <Logo title="My Company Logo" />
    + <Logo aria-label="My Company Logo" />
    ```
  - Sprite mode has been temporarily removed while we consider a new implementation that addresses how this feature was being used in practice. This means that there are no longer multiple `mode` options, and all SVGs will be inline. All instances of `mode` must be removed from your project as you can no longer control a mode:

    ```diff
    - <Logo mode="inline" />
    + <Logo />
    ```

    ```diff
    import { defineConfig } from 'astro'

    export default defineConfig({
      experimental: {
    -    svg: {
    -      mode: 'sprite'
    -    },
    +   svg: true
      }
    });
    ```

  - The default `role` is no longer applied due to developer feedback. Please add the appropriate `role` on each component individually as needed:
    ```diff
    - <Logo />
    + <Logo role="img" /> // To keep the role that was previously applied by default
    ```
  - The `size` prop has been removed to better work in combination with `viewBox` and additional styles/attributes. Please replace `size` with explicit `width` and `height` attributes:
    ```diff
    - <Logo size={64} />
    + <Logo width={64} height={64} />
    ```

## 5.5.6

### Patch Changes

- [#13429](https://github.com/withastro/astro/pull/13429) [`06de673`](https://github.com/withastro/astro/commit/06de673375f2339eb1bf8eda03d79177598979a9) Thanks [@ematipico](https://github.com/ematipico)! - The `ActionAPIContext.rewrite` method is deprecated and will be removed in a future major version of Astro

- [#13524](https://github.com/withastro/astro/pull/13524) [`82cd583`](https://github.com/withastro/astro/commit/82cd5832860d70ea7524473ae927db0cc2682b12) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the functions `Astro.preferredLocale` and `Astro.preferredLocaleList` would return the incorrect locales
  when the Astro configuration specifies a list of `codes`. Before, the functions would return the `path`, instead now the functions
  return a list built from `codes`.

- [#13526](https://github.com/withastro/astro/pull/13526) [`ff9d69e`](https://github.com/withastro/astro/commit/ff9d69e3443c80059c54f6296d19f66bb068ead3) Thanks [@jsparkdev](https://github.com/jsparkdev)! - update `vite` to the latest version

## 5.5.5

### Patch Changes

- [#13510](https://github.com/withastro/astro/pull/13510) [`5b14d33`](https://github.com/withastro/astro/commit/5b14d33f81cdac0f7ac77186113dcce4369d848d) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `astro:env` secrets used in actions would not be available

- [#13485](https://github.com/withastro/astro/pull/13485) [`018fbe9`](https://github.com/withastro/astro/commit/018fbe90f4030bbc2b2db7589d750e5392f38e59) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused cookies to ignore custom decode function if has() had been called before

- [#13505](https://github.com/withastro/astro/pull/13505) [`a98ae5b`](https://github.com/withastro/astro/commit/a98ae5b8f5c33900379012e9e253a755c0a8927e) Thanks [@ematipico](https://github.com/ematipico)! - Updates the dependency `vite` to the latest.

- [#13483](https://github.com/withastro/astro/pull/13483) [`fc2dcb8`](https://github.com/withastro/astro/commit/fc2dcb83543d88af9e0920b90a035652d6db5166) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where an Astro adapter couldn't call the middleware when there isn't a route that matches the incoming request.

## 5.5.4

### Patch Changes

- [#13457](https://github.com/withastro/astro/pull/13457) [`968e713`](https://github.com/withastro/astro/commit/968e713c268e1b2176c9265b6c438c56105c2730) Thanks [@ascorbic](https://github.com/ascorbic)! - Sets correct response status text for custom error pages

- [#13447](https://github.com/withastro/astro/pull/13447) [`d80ba2b`](https://github.com/withastro/astro/commit/d80ba2b27d33d2972ffa3242330fb00d0fc58ba9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where `site` was added to the generated redirects.

- [#13481](https://github.com/withastro/astro/pull/13481) [`e9e9245`](https://github.com/withastro/astro/commit/e9e9245c7c0ad6e3bda2b7600ff2bd845921a19d) Thanks [@martrapp](https://github.com/martrapp)! - Makes server island work with the client router again.

- [#13484](https://github.com/withastro/astro/pull/13484) [`8b5e4dc`](https://github.com/withastro/astro/commit/8b5e4dc733bccce7d77defdbb973204aa9b8126b) Thanks [@ascorbic](https://github.com/ascorbic)! - Display useful errors when config loading fails because of Node addons being disabled on Stackblitz

## 5.5.3

### Patch Changes

- [#13437](https://github.com/withastro/astro/pull/13437) [`013fa87`](https://github.com/withastro/astro/commit/013fa87982ea92675e899d2f71a200e5298db608) Thanks [@Vardhaman619](https://github.com/Vardhaman619)! - Handle server.allowedHosts when the value is true without attempting to push it into an array.

- [#13324](https://github.com/withastro/astro/pull/13324) [`ea74336`](https://github.com/withastro/astro/commit/ea7433666e0cc7e1301e638e80f90323f20db3e1) Thanks [@ematipico](https://github.com/ematipico)! - Upgrade to shiki v3

- [#13372](https://github.com/withastro/astro/pull/13372) [`7783dbf`](https://github.com/withastro/astro/commit/7783dbf8117650c60d7633b43f0d42da487aa2b1) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused some very large data stores to save incomplete data.

- [#13358](https://github.com/withastro/astro/pull/13358) [`8c21663`](https://github.com/withastro/astro/commit/8c21663c4a6363765f2caa5705a93a41492a95c9) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new function called `insertPageRoute` to the Astro Container API.

  The new function is useful when testing routes that, for some business logic, use `Astro.rewrite`.

  For example, if you have a route `/blog/post` and for some business decision there's a rewrite to `/generic-error`, the container API implementation will look like this:

  ```js
  import Post from '../src/pages/Post.astro';
  import GenericError from '../src/pages/GenericError.astro';
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';

  const container = await AstroContainer.create();
  container.insertPageRoute('/generic-error', GenericError);
  const result = await container.renderToString(Post);
  console.log(result); // this should print the response from GenericError.astro
  ```

  This new method only works for page routes, which means that endpoints aren't supported.

- [#13426](https://github.com/withastro/astro/pull/13426) [`565583b`](https://github.com/withastro/astro/commit/565583bd6c99163ce5d9475b26075149cc8c155b) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that caused the `astro add` command to ignore the `--yes` flag for third-party integrations

- [#13428](https://github.com/withastro/astro/pull/13428) [`9cac9f3`](https://github.com/withastro/astro/commit/9cac9f314277def0ee584e45d4937bac0235738a) Thanks [@matthewp](https://github.com/matthewp)! - Prevent bad value in x-forwarded-host from crashing request

- [#13432](https://github.com/withastro/astro/pull/13432) [`defad33`](https://github.com/withastro/astro/commit/defad33140dccde324b9357bc6331f7e5cdec266) Thanks [@P4tt4te](https://github.com/P4tt4te)! - Fix an issue in the Container API, where the `renderToString` function doesn't render adequately nested slots when they are components.

- Updated dependencies [[`ea74336`](https://github.com/withastro/astro/commit/ea7433666e0cc7e1301e638e80f90323f20db3e1)]:
  - @astrojs/markdown-remark@6.3.1

## 5.5.2

### Patch Changes

- [#13415](https://github.com/withastro/astro/pull/13415) [`be866a1`](https://github.com/withastro/astro/commit/be866a1d1db12793e0953b228d0b2dc1c00929e2) Thanks [@ascorbic](https://github.com/ascorbic)! - Reuses experimental session storage object between requests. This prevents memory leaks and improves performance for drivers that open persistent connections to a database.

- [#13420](https://github.com/withastro/astro/pull/13420) [`2f039b9`](https://github.com/withastro/astro/commit/2f039b927a3a1334948adc7788b1f24c074dfac7) Thanks [@ematipico](https://github.com/ematipico)! - It fixes an issue that caused some regressions in how styles are bundled.

## 5.5.1

### Patch Changes

- [#13413](https://github.com/withastro/astro/pull/13413) [`65903c9`](https://github.com/withastro/astro/commit/65903c995408397c63c911e184218c0206e5853f) Thanks [@ascorbic](https://github.com/ascorbic)! - Makes experimental flag optional

## 5.5.0

### Minor Changes

- [#13402](https://github.com/withastro/astro/pull/13402) [`3e7b498`](https://github.com/withastro/astro/commit/3e7b498dce52648484bb4deb04bf9e960c3d08e3) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new experimental flag called `experimental.preserveScriptOrder` that renders `<script>` and `<style>` tags in the same order as they are defined.

  When rendering multiple `<style>` and `<script>` tags on the same page, Astro currently reverses their order in your generated HTML output. This can give unexpected results, for example CSS styles being overridden by earlier defined style tags when your site is built.

  With the new `preserveScriptOrder` flag enabled, Astro will generate the styles in the order they are defined:

  ```js title="astro.config.mjs"
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      preserveScriptOrder: true,
    },
  });
  ```

  For example, the following component has two `<style>` tags, and both define the same style for the `body` tag:

  ```html
  <p>I am a component</p>
  <style>
    body {
      background: red;
    }
  </style>
  <style>
    body {
      background: yellow;
    }
  </style>
  ```

  Once the project is compiled, Astro will create an inline style where `yellow` appears first, and then `red`. Ultimately, the `red` background is applied:

  ```css
  body {
    background: #ff0;
  }
  body {
    background: red;
  }
  ```

  When `experimental.preserveScriptOrder` is set to `true`, the order of the two styles is kept as it is, and in the style generated `red` appears first, and then `yellow`:

  ```css
  body {
    background: red;
  }
  body {
    background: #ff0;
  }
  ```

  This is a breaking change to how Astro renders project code that contains multiple `<style>` and `<script>` tags in the same component. If you were previously compensating for Astro's behavior by writing these out of order, you will need to update your code.

  This will eventually become the new default Astro behavior, so we encourage you to add this experimental style and script ordering as soon as you are able! This will help us test the new behavior and ensure your code is ready when this becomes the new normal.

  For more information as this feature develops, please see the [experimental script order docs](https://docs.astro.build/en/reference/experimental-flags/preserve-script-order/).

- [#13352](https://github.com/withastro/astro/pull/13352) [`cb886dc`](https://github.com/withastro/astro/commit/cb886dcde6c28acca286a66be46228a4d4cc52e7) Thanks [@delucis](https://github.com/delucis)! - Adds support for a new `experimental.headingIdCompat` flag

  By default, Astro removes a trailing `-` from the end of IDs it generates for headings ending with
  special characters. This differs from the behavior of common Markdown processors.

  You can now disable this behavior with a new configuration flag:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    experimental: {
      headingIdCompat: true,
    },
  });
  ```

  This can be useful when heading IDs and anchor links need to behave consistently across your site
  and other platforms such as GitHub and npm.

  If you are [using the `rehypeHeadingIds` plugin directly](https://docs.astro.build/en/guides/markdown-content/#heading-ids-and-plugins), you can also pass this new option:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import { rehypeHeadingIds } from '@astrojs/markdown-remark';
  import { otherPluginThatReliesOnHeadingIDs } from 'some/plugin/source';

  export default defineConfig({
    markdown: {
      rehypePlugins: [
        [rehypeHeadingIds, { experimentalHeadingIdCompat: true }],
        otherPluginThatReliesOnHeadingIDs,
      ],
    },
  });
  ```

- [#13311](https://github.com/withastro/astro/pull/13311) [`a3327ff`](https://github.com/withastro/astro/commit/a3327ffbe6373228339824684eaa6f340a20a32e) Thanks [@chrisirhc](https://github.com/chrisirhc)! - Adds a new configuration option for Markdown syntax highlighting `excludeLangs`

  This option provides better support for diagramming tools that rely on Markdown code blocks, such as Mermaid.js and D2 by allowing you to exclude specific languages from Astro's default syntax highlighting.

  This option allows you to avoid rendering conflicts with tools that depend on the code not being highlighted without forcing you to disable syntax highlighting for other code blocks.

  The following example configuration will exclude highlighting for `mermaid` and `math` code blocks:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    markdown: {
      syntaxHighlight: {
        type: 'shiki',
        excludeLangs: ['mermaid', 'math'],
      },
    },
  });
  ```

  Read more about this new option in the [Markdown syntax highlighting configuration docs](https://docs.astro.build/en/reference/configuration-reference/#markdownsyntaxhighlight).

### Patch Changes

- [#13404](https://github.com/withastro/astro/pull/13404) [`4e78b4d`](https://github.com/withastro/astro/commit/4e78b4d10d2214c94752a1fef74db325053cf071) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug in error handling that saving a content file with a schema error would display an "unhandled rejection" error instead of the correct schema error

- [#13379](https://github.com/withastro/astro/pull/13379) [`d59eb22`](https://github.com/withastro/astro/commit/d59eb227334b788289533bac41f015b498179a2f) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an edge case where the client router executed scripts twice when used with a custom swap function that only swaps parts of the DOM.

- [#13393](https://github.com/withastro/astro/pull/13393) [`6b8fdb8`](https://github.com/withastro/astro/commit/6b8fdb8a113b6f76448b41beb990c33fafb09b3e) Thanks [@renovate](https://github.com/apps/renovate)! - Updates `primsjs` to version 1.30.0, which adds support for more languages and fixes a security advisory which does not affect Astro.

- [#13374](https://github.com/withastro/astro/pull/13374) [`7b75bc5`](https://github.com/withastro/astro/commit/7b75bc5c36bc338bcef5ef41502e87c184c117ec) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes the documentation of the i18n configuration where `manual` was presented as a key of `routing` instead of an available value.

- [#13380](https://github.com/withastro/astro/pull/13380) [`9bfa6e6`](https://github.com/withastro/astro/commit/9bfa6e6d8b95424436be405a80d5df3f2e2e72df) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue where astro:page-load fires before all scripts are executed

- [#13407](https://github.com/withastro/astro/pull/13407) [`0efdc22`](https://github.com/withastro/astro/commit/0efdc22b182f6cec4155a972f0dde1da686c5453) Thanks [@ascorbic](https://github.com/ascorbic)! - Displays correct error message when sharp isn't installed

- Updated dependencies [[`cb886dc`](https://github.com/withastro/astro/commit/cb886dcde6c28acca286a66be46228a4d4cc52e7), [`a3327ff`](https://github.com/withastro/astro/commit/a3327ffbe6373228339824684eaa6f340a20a32e)]:
  - @astrojs/markdown-remark@6.3.0

## 5.4.3

### Patch Changes

- [#13381](https://github.com/withastro/astro/pull/13381) [`249d52a`](https://github.com/withastro/astro/commit/249d52a3ff17f792c451ea0e42b97a209667290c) Thanks [@martrapp](https://github.com/martrapp)! - Adds the `types` property to the viewTransition object when the ClientRouter simulates parts of the View Transition API on browsers w/o native support.

- [#13367](https://github.com/withastro/astro/pull/13367) [`3ce4ad9`](https://github.com/withastro/astro/commit/3ce4ad965f576f2f4c53b5f2b876d449ed60c023) Thanks [@ematipico](https://github.com/ematipico)! - Adds documentation to various utility functions used for remote image services

- [#13347](https://github.com/withastro/astro/pull/13347) [`d83f92a`](https://github.com/withastro/astro/commit/d83f92a20403ffc8d088cfd13d2806e0f4f1a11e) Thanks [@bluwy](https://github.com/bluwy)! - Updates internal CSS chunking behavior for Astro components' scoped styles. This may result in slightly more CSS chunks created, but should allow the scoped styles to only be included on pages that use them.

- [#13388](https://github.com/withastro/astro/pull/13388) [`afadc70`](https://github.com/withastro/astro/commit/afadc702d7d928e7b650d3c071cca3d21e14333f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where `astro:config/server` and `astro:config/client` had incorrect types.

- [#13355](https://github.com/withastro/astro/pull/13355) [`042d1de`](https://github.com/withastro/astro/commit/042d1de901fd9aa66157ce078b28bcd9786e1373) Thanks [@ematipico](https://github.com/ematipico)! - Adds documentation to the assets utilities for remote service images.

- [#13395](https://github.com/withastro/astro/pull/13395) [`6d1c63f`](https://github.com/withastro/astro/commit/6d1c63fa46a624b1c4981d4324ebabf37cc2b958) Thanks [@bluwy](https://github.com/bluwy)! - Uses `package-manager-detector` to detect the package manager used in the project

- [#13363](https://github.com/withastro/astro/pull/13363) [`a793636`](https://github.com/withastro/astro/commit/a793636928d0014a7faa4431afdfb9404e9ea819) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the internal function `makeSvgComponent` was incorrectly exposed as a public API.

- Updated dependencies [[`042d1de`](https://github.com/withastro/astro/commit/042d1de901fd9aa66157ce078b28bcd9786e1373)]:
  - @astrojs/internal-helpers@0.6.1
  - @astrojs/markdown-remark@6.2.1

## 5.4.2

### Patch Changes

- [#12985](https://github.com/withastro/astro/pull/12985) [`84e94cc`](https://github.com/withastro/astro/commit/84e94cc85cc0f4ea9b5dba2009dc89e83a798f59) Thanks [@matthewp](https://github.com/matthewp)! - Prevent re-executing scripts in client router

- [#13349](https://github.com/withastro/astro/pull/13349) [`50e2e0b`](https://github.com/withastro/astro/commit/50e2e0b3749d6dba3d301ea1a0a3a33a273e7a81) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly escapes attributes in Markdown images

- [#13262](https://github.com/withastro/astro/pull/13262) [`0025df3`](https://github.com/withastro/astro/commit/0025df37af4dcd390d41c9b175fbdb3edd87edf7) Thanks [@ematipico](https://github.com/ematipico)! - Refactor Astro Actions to not use a middleware. Doing so should avoid unexpected issues when using the Astro middleware at the edge.

## 5.4.1

### Patch Changes

- [#13336](https://github.com/withastro/astro/pull/13336) [`8f632ef`](https://github.com/withastro/astro/commit/8f632efe9934fbe7547d890fd01b3892d14c8189) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where some asset utilities were move across monorepo, and not re-exported anymore.

- [#13320](https://github.com/withastro/astro/pull/13320) [`b5dabe9`](https://github.com/withastro/astro/commit/b5dabe9878510237ceb603ebd3e004da6e965a26) Thanks [@{](https://github.com/{)! - Adds support for typing experimental session data

  You can add optional types to your session data by creating a `src/env.d.ts` file in your project that extends the global `App.SessionData` interface. For example:

  ```ts
  declare namespace App {
    interface SessionData {

        id: string;
        email: string;
      };
      lastLogin: Date;
    }
  }
  ```

  Any keys not defined in this interface will be treated as `any`.

  Then when you access `Astro.session` in your components, any defined keys will be typed correctly:

  ```astro
  ---
  const user = await Astro.session.get('user');
  //    ^? const: user: { id: string; email: string; } | undefined

  const something = await Astro.session.get('something');
  //    ^? const: something: any

  Astro.session.set('user', 1);
  //    ^? Argument of type 'number' is not assignable to parameter of type '{ id: string; email: string; }'.
  ---
  ```

  See [the experimental session docs](https://docs.astro.build/en/reference/experimental-flags/sessions/) for more information.

- [#13330](https://github.com/withastro/astro/pull/13330) [`5e7646e`](https://github.com/withastro/astro/commit/5e7646efc12d47bbb65d8c80a160f4f27329903c) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue with the conditional rendering of scripts.

  **This change updates a v5.0 breaking change when `experimental.directRenderScript` became the default script handling behavior**.

  If you have already successfully upgraded to Astro v5, you may need to review your script tags again and make sure they still behave as desired after this release. [See the v5 Upgrade Guide for more details](https://docs.astro.build/en/guides/upgrade-to/v5/#script-tags-are-rendered-directly-as-declared).

## 5.4.0

### Minor Changes

- [#12052](https://github.com/withastro/astro/pull/12052) [`5be12b2`](https://github.com/withastro/astro/commit/5be12b2bc9f359d3ecfa29b766f13ed2aabd119f) Thanks [@Fryuni](https://github.com/Fryuni)! - Exposes extra APIs for scripting and testing.

  #### Config helpers

  Two new helper functions exported from `astro/config`:
  - `mergeConfig()` allows users to merge partially defined Astro configurations on top of a base config while following the merge rules of `updateConfig()` available for integrations.
  - `validateConfig()` allows users to validate that a given value is a valid Astro configuration and fills in default values as necessary.

  These helpers are particularly useful for integration authors and for developers writing scripts that need to manipulate Astro configurations programmatically.

  #### Programmatic build

  The `build` API now receives a second optional `BuildOptions` argument where users can specify:
  - `devOutput` (default `false`): output a development-based build similar to code transformed in `astro dev`.
  - `teardownCompiler` (default `true`): teardown the compiler WASM instance after build.

  These options provide more control when running Astro builds programmatically, especially for testing scenarios or custom build pipelines.

- [#13278](https://github.com/withastro/astro/pull/13278) [`4a43c4b`](https://github.com/withastro/astro/commit/4a43c4b743affb78b1502801c797157b626c77a1) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new configuration option `server.allowedHosts` and CLI option `--allowed-hosts`.

  Now you can specify the hostnames that the dev and preview servers are allowed to respond to. This is useful for allowing additional subdomains, or running the dev server in a web container.

  `allowedHosts` checks the Host header on HTTP requests from browsers and if it doesn't match, it will reject the request to prevent CSRF and XSS attacks.

  ```shell
  astro dev --allowed-hosts=foo.bar.example.com,bar.example.com
  ```

  ```shell
  astro preview --allowed-hosts=foo.bar.example.com,bar.example.com
  ```

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    server: {
      allowedHosts: ['foo.bar.example.com', 'bar.example.com'],
    },
  });
  ```

  This feature is the same as [Vite's `server.allowHosts` configuration](https://vite.dev/config/server-options.html#server-allowedhosts).

- [#13254](https://github.com/withastro/astro/pull/13254) [`1e11f5e`](https://github.com/withastro/astro/commit/1e11f5e8b722b179e382f3c792cd961b2b51f61b) Thanks [@p0lyw0lf](https://github.com/p0lyw0lf)! - Adds the ability to process and optimize remote images in Markdown files

  Previously, Astro only allowed local images to be optimized when included using `![]()` syntax in plain Markdown files. Astro's image service could only display remote images without any processing.

  Now, Astro's image service can also optimize remote images written in standard Markdown syntax. This allows you to enjoy the benefits of Astro's image processing when your images are stored externally, for example in a CMS or digital asset manager.

  No additional configuration is required to use this feature! Any existing remote images written in Markdown will now automatically be optimized. To opt-out of this processing, write your images in Markdown using the HTML `<img>` tag instead. Note that images located in your `public/` folder are still never processed.

### Patch Changes

- [#13256](https://github.com/withastro/astro/pull/13256) [`509fa67`](https://github.com/withastro/astro/commit/509fa671a137515bd1818c81ee78de439a27e5dc) Thanks [@p0lyw0lf](https://github.com/p0lyw0lf)! - Adds experimental responsive image support in Markdown

  Previously, the `experimental.responsiveImages` feature could only provide responsive images when using the `<Image />` and `<Picture />` components.

  Now, images written with the `![]()` Markdown syntax in Markdown and MDX files will generate responsive images by default when using this experimental feature.

  To try this experimental feature, set `experimental.responsiveImages` to true in your `astro.config.mjs` file:

  ```js
  {
     experimental: {
        responsiveImages: true,
     },
  }
  ```

  Learn more about using this feature in the [experimental responsive images feature reference](https://docs.astro.build/en/reference/experimental-flags/responsive-images/).

  For a complete overview, and to give feedback on this experimental API, see the [Responsive Images RFC](https://github.com/withastro/roadmap/blob/responsive-images/proposals/0053-responsive-images.md).

- [#13323](https://github.com/withastro/astro/pull/13323) [`80926fa`](https://github.com/withastro/astro/commit/80926fadc06492fcae55f105582b9dc8279da6b3) Thanks [@ematipico](https://github.com/ematipico)! - Updates `esbuild` and `vite` to the latest to avoid false positives audits warnings caused by `esbuild`.

- [#13313](https://github.com/withastro/astro/pull/13313) [`9e7c71d`](https://github.com/withastro/astro/commit/9e7c71d19c89407d9b27ded85d8c0fde238ce16c) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue where a form field named "attributes" shadows the form.attributes property.

- [#12052](https://github.com/withastro/astro/pull/12052) [`5be12b2`](https://github.com/withastro/astro/commit/5be12b2bc9f359d3ecfa29b766f13ed2aabd119f) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes incorrect config update when calling `updateConfig` from `astro:build:setup` hook.

  The function previously called a custom update config function made for merging an Astro config. Now it calls the appropriate `mergeConfig()` utility exported by Vite that updates functional options correctly.

- [#13303](https://github.com/withastro/astro/pull/13303) [`5f72a58`](https://github.com/withastro/astro/commit/5f72a58935d9bdd5237bdf86d2e94bcdc544c7b3) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the dev server was applying second decoding of the URL of the incoming request, causing issues for certain URLs.

- Updated dependencies [[`1e11f5e`](https://github.com/withastro/astro/commit/1e11f5e8b722b179e382f3c792cd961b2b51f61b), [`1e11f5e`](https://github.com/withastro/astro/commit/1e11f5e8b722b179e382f3c792cd961b2b51f61b)]:
  - @astrojs/internal-helpers@0.6.0
  - @astrojs/markdown-remark@6.2.0

## 5.3.1

### Patch Changes

- [#13233](https://github.com/withastro/astro/pull/13233) [`32fafeb`](https://github.com/withastro/astro/commit/32fafeb874cc4b6312eb50d54d9f0ca6b83aedbc) Thanks [@joshmkennedy](https://github.com/joshmkennedy)! - Ensures consistent behaviour of `Astro.rewrite`/`ctx.rewrite` when using `base` and `trailingSlash` options.

- [#13003](https://github.com/withastro/astro/pull/13003) [`ea79054`](https://github.com/withastro/astro/commit/ea790542e186b0d2d2e828cb3ebd23bde4d04879) Thanks [@chaegumi](https://github.com/chaegumi)! - Fixes a bug that caused the `vite.base` value to be ignored when running `astro dev`

- [#13299](https://github.com/withastro/astro/pull/13299) [`2e1321e`](https://github.com/withastro/astro/commit/2e1321e9d5b27da3e86bc4021e4136661a8055aa) Thanks [@bluwy](https://github.com/bluwy)! - Uses `tinyglobby` for globbing files

- [#13233](https://github.com/withastro/astro/pull/13233) [`32fafeb`](https://github.com/withastro/astro/commit/32fafeb874cc4b6312eb50d54d9f0ca6b83aedbc) Thanks [@joshmkennedy](https://github.com/joshmkennedy)! - Ensures that `Astro.url`/`ctx.url` is correctly updated with the `base` path after rewrites.

  This change fixes an issue where `Astro.url`/`ctx.url` did not include the configured base path after Astro.rewrite was called. Now, the base path is correctly reflected in Astro.url.

  Previously, any rewrites performed through `Astro.rewrite`/`ctx.rewrite` failed to append the base path to `Astro.url`/`ctx.rewrite`, which could lead to incorrect URL handling in downstream logic. By fixing this, we ensure that all routes remain consistent and predictable after a rewrite.

  If you were relying on the work around of including the base path in astro.rewrite you can now remove it from the path.

## 5.3.0

### Minor Changes

- [#13210](https://github.com/withastro/astro/pull/13210) [`344e9bc`](https://github.com/withastro/astro/commit/344e9bc480a075161a7811b7733593556e7560da) Thanks [@VitaliyR](https://github.com/VitaliyR)! - Handle `HEAD` requests to an endpoint when a handler is not defined.

  If an endpoint defines a handler for `GET`, but does not define a handler for `HEAD`, Astro will call the `GET` handler and return the headers and status but an empty body.

- [#13195](https://github.com/withastro/astro/pull/13195) [`3b66955`](https://github.com/withastro/astro/commit/3b669555d7ab9da5427e7b7037699d4f905d3536) Thanks [@MatthewLymer](https://github.com/MatthewLymer)! - Improves SSR performance for synchronous components by avoiding the use of Promises. With this change, SSR rendering of on-demand pages can be up to 4x faster.

- [#13145](https://github.com/withastro/astro/pull/13145) [`8d4e566`](https://github.com/withastro/astro/commit/8d4e566f5420c8a5406e1e40e8bae1c1f87cbe37) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds support for adapters auto-configuring experimental session storage drivers.

  Adapters can now configure a default session storage driver when the `experimental.session` flag is enabled. If a hosting platform has a storage primitive that can be used for session storage, the adapter can automatically configure the session storage using that driver. This allows Astro to provide a more seamless experience for users who want to use sessions without needing to manually configure the session storage.

### Patch Changes

- [#13145](https://github.com/withastro/astro/pull/13145) [`8d4e566`](https://github.com/withastro/astro/commit/8d4e566f5420c8a5406e1e40e8bae1c1f87cbe37) Thanks [@ascorbic](https://github.com/ascorbic)! - :warning: **BREAKING CHANGE FOR EXPERIMENTAL SESSIONS ONLY** :warning:

  Changes the `experimental.session` option to a boolean flag and moves session config to a top-level value. This change is to allow the new automatic session driver support. You now need to separately enable the `experimental.session` flag, and then configure the session driver using the top-level `session` key if providing manual configuration.

  ```diff
  defineConfig({
    // ...
    experimental: {
  -    session: {
  -      driver: 'upstash',
  -    },
  +    session: true,
    },
  +  session: {
  +    driver: 'upstash',
  +  },
  });
  ```

  You no longer need to configure a session driver if you are using an adapter that supports automatic session driver configuration and wish to use its default settings.

  ```diff
  defineConfig({
    adapter: node({
      mode: "standalone",
    }),
    experimental: {
  -    session: {
  -      driver: 'fs',
  -      cookie: 'astro-cookie',
  -    },
  +    session: true,
    },
  +  session: {
  +    cookie: 'astro-cookie',
  +  },
  });
  ```

  However, you can still manually configure additional driver options or choose a non-default driver to use with your adapter with the new top-level `session` config option. For more information, see the [experimental session docs](https://docs.astro.build/en/reference/experimental-flags/sessions/).

- [#13101](https://github.com/withastro/astro/pull/13101) [`2ed67d5`](https://github.com/withastro/astro/commit/2ed67d5dc5c8056f9ab1e29e539bf086b93c60c2) Thanks [@corneliusroemer](https://github.com/corneliusroemer)! - Fixes a bug where `HEAD` and `OPTIONS` requests for non-prerendered pages were incorrectly rejected with 403 FORBIDDEN

## 5.2.6

### Patch Changes

- [#13188](https://github.com/withastro/astro/pull/13188) [`7bc8256`](https://github.com/withastro/astro/commit/7bc825649bfb790a0206abd31df1676513a03b22) Thanks [@ematipico](https://github.com/ematipico)! - Fixes the wording of the an error message

- [#13205](https://github.com/withastro/astro/pull/13205) [`9d56602`](https://github.com/withastro/astro/commit/9d5660223b46e024b4e8c8eafead8a4e20e28ec5) Thanks [@ematipico](https://github.com/ematipico)! - Fixes and issue where a server island component returns 404 when `base` is configured in i18n project.

- [#13212](https://github.com/withastro/astro/pull/13212) [`fb38840`](https://github.com/withastro/astro/commit/fb3884074f261523cd89fe6e1745a0e9c01198f2) Thanks [@joshmkennedy](https://github.com/joshmkennedy)! - An additional has been added during the build command to add clarity around output and buildOutput.

- [#13213](https://github.com/withastro/astro/pull/13213) [`6bac644`](https://github.com/withastro/astro/commit/6bac644241bc42bb565730955ffd575878a0e41b) Thanks [@joshmkennedy](https://github.com/joshmkennedy)! - Allows readonly arrays to be passed to the `paginate()` function

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
