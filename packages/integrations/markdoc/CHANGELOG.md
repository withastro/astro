# @astrojs/markdoc

## 0.1.2

### Patch Changes

- [#6932](https://github.com/withastro/astro/pull/6932) [`49514e4ce`](https://github.com/withastro/astro/commit/49514e4ce40fedb39bf7decd2c296258efbdafc7) Thanks [@bluwy](https://github.com/bluwy)! - Upgrade shiki to v0.14.1. This updates the shiki theme colors and adds the theme name to the `pre` tag, e.g. `<pre class="astro-code github-dark">`.

- Updated dependencies [[`818252acd`](https://github.com/withastro/astro/commit/818252acda3c00499cea51ffa0f26d4c2ccd3a02), [`80e3d4d3d`](https://github.com/withastro/astro/commit/80e3d4d3d0f7719d8eae5435bba3805503057511), [`3326492b9`](https://github.com/withastro/astro/commit/3326492b94f76ed2b0154dd9b9a1a9eb883c1e31), [`cac4a321e`](https://github.com/withastro/astro/commit/cac4a321e814fb805eb0e3ced469e25261a50885), [`831b67cdb`](https://github.com/withastro/astro/commit/831b67cdb8250f93f66e3b171fab024652bf80f2), [`49514e4ce`](https://github.com/withastro/astro/commit/49514e4ce40fedb39bf7decd2c296258efbdafc7), [`0883fd487`](https://github.com/withastro/astro/commit/0883fd4875548a613df122f0b87a1ca8b7a7cf7d)]:
  - astro@2.4.0

## 0.1.1

### Patch Changes

- [#6723](https://github.com/withastro/astro/pull/6723) [`73fcc7627`](https://github.com/withastro/astro/commit/73fcc7627e27a001d3ed2f4d046999d91f1aef85) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: when using `render: null` in your config, content is now rendered without a wrapper element.

- Updated dependencies [[`489dd8d69`](https://github.com/withastro/astro/commit/489dd8d69cdd9d7c243cf8bec96051a914984b9c), [`a1a4f45b5`](https://github.com/withastro/astro/commit/a1a4f45b51a80215fa7598da83bd0d9c5acd20d2), [`a1108e037`](https://github.com/withastro/astro/commit/a1108e037115cdb67d03505286c7d3a4fc2a1ff5), [`8b88e4cf1`](https://github.com/withastro/astro/commit/8b88e4cf15c8bea7942b3985380164e0edf7250b), [`d54cbe413`](https://github.com/withastro/astro/commit/d54cbe41349e55f8544212ad9320705f07325920), [`4c347ab51`](https://github.com/withastro/astro/commit/4c347ab51e46f2319d614f8577fe502e3dc816e2), [`ff0430786`](https://github.com/withastro/astro/commit/ff043078630e678348ae4f4757b3015b3b862c16), [`2f2e572e9`](https://github.com/withastro/astro/commit/2f2e572e937fd25451bbc78a05d55b7caa1ca3ec), [`7116c021a`](https://github.com/withastro/astro/commit/7116c021a39eac15a6e1264dfbd11bef0f5d618a)]:
  - astro@2.2.0

## 0.1.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [[`1f783e320`](https://github.com/withastro/astro/commit/1f783e32075c20b13063599696644f5d47b75d8d), [`2e92e9aa9`](https://github.com/withastro/astro/commit/2e92e9aa976735c3ddb647152bb9c4850136e386), [`adecda7d6`](https://github.com/withastro/astro/commit/adecda7d6009793c5d20519a997e3b7afb08ad57), [`386336441`](https://github.com/withastro/astro/commit/386336441ad70017eea22db0683591126131db21), [`7c439868a`](https://github.com/withastro/astro/commit/7c439868a3bc7d466418da9af669966014f3d9fe), [`25cd3e574`](https://github.com/withastro/astro/commit/25cd3e574999c1c7294a089ad8c39df27ccdbf17), [`4bf87c64f`](https://github.com/withastro/astro/commit/4bf87c64ff7e9ca49e0f5c27e06bd49faaf60542), [`fc0ed9c53`](https://github.com/withastro/astro/commit/fc0ed9c53cd374860bbdb2503318a55ca09a2662)]:
  - astro@2.1.8

## 0.0.5

### Patch Changes

- [#6630](https://github.com/withastro/astro/pull/6630) [`cfcf2e2ff`](https://github.com/withastro/astro/commit/cfcf2e2ffdaa68ace5c84329c05b83559a29d638) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support automatic image optimization for Markdoc images when using `experimental.assets`. You can [follow our Assets guide](https://docs.astro.build/en/guides/assets/#enabling-assets-in-your-project) to enable this feature in your project. Then, start using relative or aliased image sources in your Markdoc files for automatic optimization:

  ```md
  <!--Relative paths-->

  ![The Milky Way Galaxy](../assets/galaxy.jpg)

  <!--Or configured aliases-->

  ![Houston smiling and looking cute](~/assets/houston-smiling.jpg)
  ```

- Updated dependencies [[`b7194103e`](https://github.com/withastro/astro/commit/b7194103e39267bf59dcd6ba00f522e424219d16), [`cfcf2e2ff`](https://github.com/withastro/astro/commit/cfcf2e2ffdaa68ace5c84329c05b83559a29d638), [`45da39a86`](https://github.com/withastro/astro/commit/45da39a8642d64eb318840b18dfc2b5ccc6561bc), [`7daef9a29`](https://github.com/withastro/astro/commit/7daef9a2993b5d457f3d243a1ebfd1dd383b3327)]:
  - astro@2.1.7

## 0.0.4

### Patch Changes

- [#6588](https://github.com/withastro/astro/pull/6588) [`f42f47dc6`](https://github.com/withastro/astro/commit/f42f47dc6a91cdb6534dab0ecbf9e8e85f00ba40) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Allow access to content collection entry information (including parsed frontmatter and the entry slug) from your Markdoc using the `$entry` variable:

  ```mdx
  ---
  title: Hello Markdoc!
  ---

  # {% $entry.data.title %}
  ```

- [#6607](https://github.com/withastro/astro/pull/6607) [`86273b588`](https://github.com/withastro/astro/commit/86273b5881cc61ebee11d40280b4c0aba8f4bb2e) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: Update Markdoc renderer internals to remove unneeded dependencies

- [#6622](https://github.com/withastro/astro/pull/6622) [`b37b86540`](https://github.com/withastro/astro/commit/b37b865400e77e92878d7e150244acce47e933c6) Thanks [@paulrudy](https://github.com/paulrudy)! - Fix README instructions for installing Markdoc manually.

## 0.0.3

### Patch Changes

- [#6552](https://github.com/withastro/astro/pull/6552) [`392ba3e4d`](https://github.com/withastro/astro/commit/392ba3e4d55f73ce9194bd94a2243f1aa62af079) Thanks [@bluwy](https://github.com/bluwy)! - Fix integration return type

## 0.0.2

### Patch Changes

- [#6494](https://github.com/withastro/astro/pull/6494) [`a13e9d7e3`](https://github.com/withastro/astro/commit/a13e9d7e33baccf51e7d4815f99b481ad174bc57) Thanks [@Yan-Thomas](https://github.com/Yan-Thomas)! - Consistency improvements to several package descriptions

## 0.0.1

### Patch Changes

- [#6209](https://github.com/withastro/astro/pull/6209) [`fec583909`](https://github.com/withastro/astro/commit/fec583909ab62829dc0c1600e2387979365f2b94) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Introduce the (experimental) `@astrojs/markdoc` integration. This unlocks Markdoc inside your Content Collections, bringing support for Astro and UI components in your content. This also improves Astro core internals to make Content Collections extensible to more file types in the future.

  You can install this integration using the `astro add` command:

  ```
  astro add markdoc
  ```

  [Read the `@astrojs/markdoc` documentation](https://docs.astro.build/en/guides/integrations-guide/markdoc/) for usage instructions, and browse the [new `with-markdoc` starter](https://astro.new/with-markdoc) to try for yourself.
