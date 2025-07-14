# astro

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
          store.set(entry.id, {
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
