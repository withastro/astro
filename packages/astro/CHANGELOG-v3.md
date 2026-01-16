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
