# @astrojs/react

## 2.2.0

### Minor Changes

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

- [#7104](https://github.com/withastro/astro/pull/7104) [`826e02890`](https://github.com/withastro/astro/commit/826e0289005f645b902375b98d5549c6a95ccafa) Thanks [@bluwy](https://github.com/bluwy)! - Specify `"files"` field to only publish necessary files

## 2.1.3

### Patch Changes

- [#6976](https://github.com/withastro/astro/pull/6976) [`ca329bbca`](https://github.com/withastro/astro/commit/ca329bbcae7a6075af4f428f6f64466e9d152c8f) Thanks [@SudoCat](https://github.com/SudoCat)! - Prevent ID collisions in React.useId

## 2.1.2

### Patch Changes

- [#6933](https://github.com/withastro/astro/pull/6933) [`649d70934`](https://github.com/withastro/astro/commit/649d70934e709bb1aa6e5e7583b12fa1703377cb) Thanks [@matthewp](https://github.com/matthewp)! - Automatically configure redoc

## 2.1.1

### Patch Changes

- [#6698](https://github.com/withastro/astro/pull/6698) [`fc71c3f18`](https://github.com/withastro/astro/commit/fc71c3f18819ac3ad62809a7eeff5fe7840f2c4b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update React README to reference the [new React docs](https://react.dev)

- [#6696](https://github.com/withastro/astro/pull/6696) [`239b9a2fb`](https://github.com/withastro/astro/commit/239b9a2fb864fa785e4150cd8aa833de72dd3517) Thanks [@matthewp](https://github.com/matthewp)! - Add use-immer as a noExternal module

## 2.1.0

### Minor Changes

- [#6213](https://github.com/withastro/astro/pull/6213) [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated compilation settings to disable downlevelling for Node 14

## 2.0.2

### Patch Changes

- [#5478](https://github.com/withastro/astro/pull/5478) [`1c7eef308`](https://github.com/withastro/astro/commit/1c7eef308e808aa5ed4662b53e67ec8d1b814d1f) Thanks [@nemo0](https://github.com/nemo0)! - Update READMEs for consistency

## 2.0.1

### Patch Changes

- [#5886](https://github.com/withastro/astro/pull/5886) [`9d4bfc76e`](https://github.com/withastro/astro/commit/9d4bfc76e8de7cf85997100145532a6fa7d2b025) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Support passing `children` as props to a React component

## 2.0.0

### Major Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 14. Minimum supported Node version is now >=16.12.0

## 2.0.0-beta.0

<details>
<summary>See changes in 2.0.0-beta.0</summary>

### Major Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 14. Minimum supported Node version is now >=16.12.0

</details>

## 1.2.2

### Patch Changes

- [#5218](https://github.com/withastro/astro/pull/5218) [`0b1241431`](https://github.com/withastro/astro/commit/0b12414315fa81ded96587779c63c74400466078) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - remove unnecessary `ReactDOM.renderToString` operation

## 1.2.1

### Patch Changes

- [#5095](https://github.com/withastro/astro/pull/5095) [`ddfbef5ac`](https://github.com/withastro/astro/commit/ddfbef5acbd4c56d8ce1626a458b5cbb27da47fe) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add `@types/` packages as peerDependencies

## 1.2.0

### Minor Changes

- [#5016](https://github.com/withastro/astro/pull/5016) [`6efeaeb39`](https://github.com/withastro/astro/commit/6efeaeb39ed7e6642b31603745750ccb9fe0ff1e) Thanks [@matthewp](https://github.com/matthewp)! - Add support for mui

  This adds support for [mui](https://mui.com/) through configuration. Users will now not need to configure this library to get it to work.

## 1.1.4

### Patch Changes

- [#4816](https://github.com/withastro/astro/pull/4816) [`8d059faae`](https://github.com/withastro/astro/commit/8d059faaedf212426e0fb6d93843f6855f723f56) Thanks [@matthewp](https://github.com/matthewp)! - Prevent errors in React components from crashing the dev server

## 1.1.3

### Patch Changes

- [#4756](https://github.com/withastro/astro/pull/4756) [`c271ed35e`](https://github.com/withastro/astro/commit/c271ed35ee634f2f8c9957ee04a3aadc7dd39b3e) Thanks [@matthewp](https://github.com/matthewp)! - Only pass through children prop if there are children

## 1.1.2

### Patch Changes

- [#4679](https://github.com/withastro/astro/pull/4679) [`5986517b4`](https://github.com/withastro/astro/commit/5986517b4f29af90fcfe333d4bb69ac09d4f8778) Thanks [@matthewp](https://github.com/matthewp)! - Prevent decoder from leaking

- [#4667](https://github.com/withastro/astro/pull/4667) [`9290b2414`](https://github.com/withastro/astro/commit/9290b24143d753edd3daf25945990c25a58e5bde) Thanks [@Holben888](https://github.com/Holben888)! - Fix framework components on Vercel Edge

## 1.1.1

### Patch Changes

- [#4527](https://github.com/withastro/astro/pull/4527) [`9adb7cca3`](https://github.com/withastro/astro/commit/9adb7cca33f669082d0daf750b97b1496ee79d2f) Thanks [@bluwy](https://github.com/bluwy)! - Add vite-ignore comment to suppress unknown import warnings

## 1.1.0

### Minor Changes

- [#4478](https://github.com/withastro/astro/pull/4478) [`243525b15`](https://github.com/withastro/astro/commit/243525b1565385753ae1464c5def0d7de799f906) Thanks [@matthewp](https://github.com/matthewp)! - Uses startTransition on React roots

  This prevents hydration from blocking the main thread when multiple islands are rendering at the same time.

## 1.1.0-next.0

### Minor Changes

- [#4478](https://github.com/withastro/astro/pull/4478) [`243525b15`](https://github.com/withastro/astro/commit/243525b1565385753ae1464c5def0d7de799f906) Thanks [@matthewp](https://github.com/matthewp)! - Uses startTransition on React roots

  This prevents hydration from blocking the main thread when multiple islands are rendering at the same time.

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

## 0.4.3

### Patch Changes

- [#4174](https://github.com/withastro/astro/pull/4174) [`8eb3a8c6d`](https://github.com/withastro/astro/commit/8eb3a8c6d9554707963c3a3bc36ed8b68d3cf0fb) Thanks [@matthewp](https://github.com/matthewp)! - Allows using React with automatic imports alongside MDX

## 0.4.2

### Patch Changes

- [#3937](https://github.com/withastro/astro/pull/3937) [`31f9c0bf0`](https://github.com/withastro/astro/commit/31f9c0bf029ffa4b470e620f2c32e1370643e81e) Thanks [@delucis](https://github.com/delucis)! - Roll back supported Node engines

## 0.4.1

### Patch Changes

- [#3928](https://github.com/withastro/astro/pull/3928) [`d6dfef0ca`](https://github.com/withastro/astro/commit/d6dfef0caa25f4effd0ed548d92ff48ce7a39ab2) Thanks [@matthewp](https://github.com/matthewp)! - Removes @babel/core peerDependency warning

## 0.4.0

### Minor Changes

- [#3914](https://github.com/withastro/astro/pull/3914) [`b48767985`](https://github.com/withastro/astro/commit/b48767985359bd359df8071324952ea5f2bc0d86) Thanks [@ran-dall](https://github.com/ran-dall)! - Rollback supported `node@16` version. Minimum versions are now `node@14.20.0` or `node@16.14.0`.

## 0.3.1

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.3.0

### Minor Changes

- [#3871](https://github.com/withastro/astro/pull/3871) [`1cc5b7890`](https://github.com/withastro/astro/commit/1cc5b78905633608e5b07ad291f916f54e67feb1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update supported `node` versions. Minimum versions are now `node@14.20.0` or `node@16.16.0`.

## 0.2.1

### Patch Changes

- [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.2.0

### Minor Changes

- [#3652](https://github.com/withastro/astro/pull/3652) [`7373d61c`](https://github.com/withastro/astro/commit/7373d61cdcaedd64bf5fd60521b157cfa4343558) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add support for passing named slots from `.astro` => framework components.

  Each `slot` is be passed as a top-level prop. For example:

  ```jsx
  // From .astro
  <Component>
    <h2 slot="title">Hello world!</h2>
    <h2 slot="slot-with-dash">Dash</h2>
    <div>Default</div>
  </Component>;

  // For .jsx
  export default function Component({ title, slotWithDash, children }) {
    return (
      <>
        <div id="title">{title}</div>
        <div id="slot-with-dash">{slotWithDash}</div>
        <div id="main">{children}</div>
      </>
    );
  }
  ```

## 0.1.3

### Patch Changes

- [#3455](https://github.com/withastro/astro/pull/3455) [`e9a77d86`](https://github.com/withastro/astro/commit/e9a77d861907adccfa75811f9aaa555f186d78f8) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update client hydration to check for `ssr` attribute. Requires `astro@^1.0.0-beta.36`.

## 0.1.2

### Patch Changes

- [#3337](https://github.com/withastro/astro/pull/3337) [`678c2b75`](https://github.com/withastro/astro/commit/678c2b7523c7f10cfdf2eb5a73aa2bbb7e5cbc07) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: remove hydration failures on React v18 by exposing the "client" directive from Astro core.

## 0.1.1

### Patch Changes

- [#3160](https://github.com/withastro/astro/pull/3160) [`ae9ac5cb`](https://github.com/withastro/astro/commit/ae9ac5cbdceba0687d83d56d9d5f80479ab88710) Thanks [@matthewp](https://github.com/matthewp)! - Allows using React.lazy, Suspense in SSR and with hydration

## 0.1.0

### Minor Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add support for React v18

## 0.0.2

### Patch Changes

- [#2885](https://github.com/withastro/astro/pull/2885) [`6b004363`](https://github.com/withastro/astro/commit/6b004363f99f27e581d1e2d53a2ebff39d7afb8a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add README across Astro built-in integrations

* [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site

## 0.0.2-next.0

### Patch Changes

- [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site
