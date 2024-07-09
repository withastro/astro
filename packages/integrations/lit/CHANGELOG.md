# @astrojs/lit

## 4.3.0

### Minor Changes

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

## 4.2.0

### Minor Changes

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

## 4.1.0

### Minor Changes

- [#11164](https://github.com/withastro/astro/pull/11164) [`cf9b2ff`](https://github.com/withastro/astro/commit/cf9b2ff7967c4287ab26ec65fc4bb2eed525a235) Thanks [@scottnath](https://github.com/scottnath)! - Removes deprecated `template` attribute and replaces deprecated domparser function

## 4.0.1

### Patch Changes

- [#9479](https://github.com/withastro/astro/pull/9479) [`1baf0b0d3cbd0564954c2366a7278794fad6726e`](https://github.com/withastro/astro/commit/1baf0b0d3cbd0564954c2366a7278794fad6726e) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates README

## 4.0.0

### Major Changes

- [#8822](https://github.com/withastro/astro/pull/8822) [`b0a71946f`](https://github.com/withastro/astro/commit/b0a71946f4320d4e76f31e990fe5821f823f0e12) Thanks [@Geoffrey-Pliez](https://github.com/Geoffrey-Pliez)! - Upgrade to Lit 3.0

## 3.0.3

### Patch Changes

- [#9018](https://github.com/withastro/astro/pull/9018) [`23c9a30ad`](https://github.com/withastro/astro/commit/23c9a30ad859398d62a013d639b5b2716b583331) Thanks [@augustjk](https://github.com/augustjk)! - Fix hydration ordering of nested custom elements. Child components will now wait for their parents to hydrate before hydrating themselves.

## 3.0.2

### Patch Changes

- [#8826](https://github.com/withastro/astro/pull/8826) [`754c40f6e`](https://github.com/withastro/astro/commit/754c40f6ed941a61362d221915568c04ae85d6ad) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixed an issue where an incompatible version of lit was installed.

## 3.0.1

### Patch Changes

- [#8737](https://github.com/withastro/astro/pull/8737) [`6f60da805`](https://github.com/withastro/astro/commit/6f60da805e0014bc50dd07bef972e91c73560c3c) Thanks [@ematipico](https://github.com/ematipico)! - Add provenance statement when publishing the library from CI

## 3.0.0

### Major Changes

- [#8188](https://github.com/withastro/astro/pull/8188) [`d0679a666`](https://github.com/withastro/astro/commit/d0679a666f37da0fca396d42b9b32bbb25d29312) Thanks [@ematipico](https://github.com/ematipico)! - Remove support for Node 16. The lowest supported version by Astro and all integrations is now v18.14.1. As a reminder, Node 16 will be deprecated on the 11th September 2023.

- [#8179](https://github.com/withastro/astro/pull/8179) [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7) Thanks [@matthewp](https://github.com/matthewp)! - Astro 3.0 Release Candidate

## 3.0.0-rc.1

### Major Changes

- [#8179](https://github.com/withastro/astro/pull/8179) [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7) Thanks [@matthewp](https://github.com/matthewp)! - Astro 3.0 Release Candidate

## 3.0.0-beta.0

### Major Changes

- [`1eae2e3f7`](https://github.com/withastro/astro/commit/1eae2e3f7d693c9dfe91c8ccfbe606d32bf2fb81) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 16. The lowest supported version by Astro and all integrations is now v18.14.1. As a reminder, Node 16 will be deprecated on the 11th September 2023.

## 2.1.1

### Patch Changes

- [#7985](https://github.com/withastro/astro/pull/7985) [`ec06dd9bb`](https://github.com/withastro/astro/commit/ec06dd9bbb29cc38e891517fbf884cb7083b3240) Thanks [@delucis](https://github.com/delucis)! - Fix formatting in Lit README

## 2.1.0

### Minor Changes

- [#7373](https://github.com/withastro/astro/pull/7373) [`0986a44dd`](https://github.com/withastro/astro/commit/0986a44ddd2b48edbe318f6fceb7f4ce4670ce05) Thanks [@matthewp](https://github.com/matthewp)! - Upgrade lit dependencies

## 2.0.2

### Patch Changes

- [#7104](https://github.com/withastro/astro/pull/7104) [`826e02890`](https://github.com/withastro/astro/commit/826e0289005f645b902375b98d5549c6a95ccafa) Thanks [@bluwy](https://github.com/bluwy)! - Specify `"files"` field to only publish necessary files

## 2.0.1

### Patch Changes

- [#6752](https://github.com/withastro/astro/pull/6752) [`c7eb0d431`](https://github.com/withastro/astro/commit/c7eb0d431032edc5d4af72726d84e1c52ef36575) Thanks [@augustjk](https://github.com/augustjk)! - Provide `renderInfo` when rendering Lit components. Fixes issue with rendering nested components.

## 2.0.0

### Major Changes

- [#6681](https://github.com/withastro/astro/pull/6681) [`4b077318f`](https://github.com/withastro/astro/commit/4b077318fbc21c4350cc21c380d96b54d302759c) Thanks [@e111077](https://github.com/e111077)! - Update to use `@lit-labs/ssr@^3`
  **[BREAKING]** DOM shim required for Lit SSR has been greatly reduced. `window`, `document`, and other objects are no longer available in global. Most SSR-ready component code should not be affected but, if so, they can be fixed with optional chaining or by using the `isServer` environment checker from the `lit` package. See [lit.dev docs on authoring components for SSR].(https://lit.dev/docs/ssr/authoring/#browser-only-code)
  **[BREAKING]** Adds compatibility with `lit@2.7.0` hydration behavior. Do not update if you're using `lit@2.6.1` or lower.
  Includes support for template[shadowrootmode] support.

## 1.3.0

### Minor Changes

- [#6213](https://github.com/withastro/astro/pull/6213) [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated compilation settings to disable downlevelling for Node 14

## 1.2.1

### Patch Changes

- [#6351](https://github.com/withastro/astro/pull/6351) [`26bf12ef3`](https://github.com/withastro/astro/commit/26bf12ef3c7ab874a23ac753f841f7bb329c9361) Thanks [@hrmcdonald](https://github.com/hrmcdonald)! - Render DSD attributes based on `shadowRootOptions`

## 1.2.0

### Minor Changes

- [#6111](https://github.com/withastro/astro/pull/6111) [`ec38a8921`](https://github.com/withastro/astro/commit/ec38a8921f02a275949abcababe1b8afdf8184a2) Thanks [@e111077](https://github.com/e111077)! - Implement client:only functionality in Lit and add lit to the client:only warning

## 1.1.2

### Patch Changes

- [#6080](https://github.com/withastro/astro/pull/6080) [`0db220415`](https://github.com/withastro/astro/commit/0db22041531d981a813a07f4c4e00cfb7ebddd51) Thanks [@e111077](https://github.com/e111077)! - Fixes Lit hydration not having the same reactive values as server (losing state upon hydration)

- [#6055](https://github.com/withastro/astro/pull/6055) [`2567aa48b`](https://github.com/withastro/astro/commit/2567aa48bba8751cf7e10429555f1e85830c9169) Thanks [@e111077](https://github.com/e111077)! - Add forwards compatibility for streaming Declarative Shadow DOM

## 1.1.1

### Patch Changes

- [#5478](https://github.com/withastro/astro/pull/5478) [`1c7eef308`](https://github.com/withastro/astro/commit/1c7eef308e808aa5ed4662b53e67ec8d1b814d1f) Thanks [@nemo0](https://github.com/nemo0)! - Update READMEs for consistency

## 1.1.0

### Minor Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Only shim fetch if not already present

- [#5791](https://github.com/withastro/astro/pull/5791) [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a) Thanks [@ba55ie](https://github.com/ba55ie)! - Fix Lit slotted content

## 1.0.2

### Patch Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Only shim fetch if not already present

- [#5776](https://github.com/withastro/astro/pull/5776) [`6a31433ed`](https://github.com/withastro/astro/commit/6a31433ed79c7f84fd3ce602005b42ad95007d84) & [#5791](https://github.com/withastro/astro/pull/5791) [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a) Thanks [@ba55ie](https://github.com/ba55ie)! - Fix Lit slotted content

## 1.0.2-beta.0

<details>
<summary>See changes in 1.0.2-beta.0</summary>

### Patch Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Only shim fetch if not already present

- [#5791](https://github.com/withastro/astro/pull/5791) [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a) Thanks [@ba55ie](https://github.com/ba55ie)! - Fix Lit slotted content

</details>

## 1.0.1

### Patch Changes

- [#4503](https://github.com/withastro/astro/pull/4503) [`1222ab954`](https://github.com/withastro/astro/commit/1222ab9540d17e4e7e811240b8a2a039acc333cb) Thanks [@matthewp](https://github.com/matthewp)! - Allow using Lit's decorators

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

## 0.3.2

### Patch Changes

- [#4009](https://github.com/withastro/astro/pull/4009) [`01ba07d8f`](https://github.com/withastro/astro/commit/01ba07d8fa7eb67530b47b8530d65906f1aebf6e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Lit compat with Vite 3.0.1

## 0.3.1

### Patch Changes

- [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.3.0

### Minor Changes

- [#3652](https://github.com/withastro/astro/pull/3652) [`7373d61c`](https://github.com/withastro/astro/commit/7373d61cdcaedd64bf5fd60521b157cfa4343558) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Adds support for passing named slots from `.astro` => Lit components.

  All slots are treated as Light DOM content.

## 0.2.0

### Minor Changes

- [#3625](https://github.com/withastro/astro/pull/3625) [`f5afaf24`](https://github.com/withastro/astro/commit/f5afaf24984ee7d4d6e908a7eeed17f5ca18c61e) Thanks [@matthewp](https://github.com/matthewp)! - Conform to Constructor based rendering

  This changes `@astrojs/lit` to conform to the way rendering happens in all other frameworks. Instead of using the tag name `<my-element client:load>` you use the imported constructor function, `<MyElement client:load>` like you would do with any other framework.

  Support for `tag-name` syntax had to be removed due to the fact that it was a runtime feature that was not statically analyzable. To improve build performance, we have removed all runtime based component discovery. Using the imported Constructor name allows Astro to discover what components need to be built and bundled for production without ever running your file.

## 0.1.5

### Patch Changes

- [#3511](https://github.com/withastro/astro/pull/3511) [`2fedb974`](https://github.com/withastro/astro/commit/2fedb974899b37a8d9ddabc476764a6d35d1e446) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Patch Lit's server shim to allow for `sass` compatibility

## 0.1.4

### Patch Changes

- [#3484](https://github.com/withastro/astro/pull/3484) [`55820fa7`](https://github.com/withastro/astro/commit/55820fa784d6d4f66a45092321a47c8ce9de5546) Thanks [@matthewp](https://github.com/matthewp)! - Wait for DOMCOntentLoaded to polyfill in Lit

## 0.1.3

### Patch Changes

- [#3375](https://github.com/withastro/astro/pull/3375) [`fe61e469`](https://github.com/withastro/astro/commit/fe61e469b243c27781112499f151782baf9004a4) Thanks [@jdvivar](https://github.com/jdvivar)! - Added tests and fix a small edge case for when you call render with no props/attrs

## 0.1.2

### Patch Changes

- [#3164](https://github.com/withastro/astro/pull/3164) [`e85b16e2`](https://github.com/withastro/astro/commit/e85b16e2b3d846333f542139c82640de19bfd2f5) Thanks [@matthewp](https://github.com/matthewp)! - Fixes lit when running in SSR

## 0.1.1

### Patch Changes

- [`815d62f1`](https://github.com/withastro/astro/commit/815d62f151a36fef7d09590d4962ca71bda61b32) Thanks [@FredKSchott](https://github.com/FredKSchott)! - no changes.

## 0.1.0

### Minor Changes

- [#2979](https://github.com/withastro/astro/pull/2979) [`9d7a4b59`](https://github.com/withastro/astro/commit/9d7a4b59b53f8cb274266f5036d1cef841750252) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Welcome to the Astro v1.0.0 Beta! Read the [official announcement](https://astro.build/blog/astro-1-beta-release/) for more details.

## 0.0.2

### Patch Changes

- [#2885](https://github.com/withastro/astro/pull/2885) [`6b004363`](https://github.com/withastro/astro/commit/6b004363f99f27e581d1e2d53a2ebff39d7afb8a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add README across Astro built-in integrations

* [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site

## 0.0.2-next.0

### Patch Changes

- [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site
