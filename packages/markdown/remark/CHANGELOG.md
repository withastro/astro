# @astrojs/markdown-remark

## 2.0.0

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

- [#5785](https://github.com/withastro/astro/pull/5785) [`16107b6a1`](https://github.com/withastro/astro/commit/16107b6a10514ef1b563e585ec9add4b14f42b94) Thanks [@delucis](https://github.com/delucis)! - Drop support for legacy Astro-flavored Markdown

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

- [#5825](https://github.com/withastro/astro/pull/5825) [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Baseline the experimental `contentCollections` flag. You're free to remove this from your astro config!

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  - experimental: { contentCollections: true }
  })

  ```

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a `peerDependency` of integrations

  This marks `astro` as a `peerDependency` of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.


**Patch Changes**

- [#5837](https://github.com/withastro/astro/pull/5837) [`12f65a4d5`](https://github.com/withastro/astro/commit/12f65a4d55e3fd2993c2f67b18794dd536280c69) Thanks [@giuseppelt](https://github.com/giuseppelt)! - fix shiki css class replace logic

- Updated dependencies [[`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b), [`16dc36a87`](https://github.com/withastro/astro/commit/16dc36a870df47a4151a8ed2d91d0bd1bb812458), [`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`05caf445d`](https://github.com/withastro/astro/commit/05caf445d4d2728f1010aeb2179a9e756c2fd17d), [`49ab4f231`](https://github.com/withastro/astro/commit/49ab4f231c23b34891c3ee86f4b92bf8d6d267a3), [`a342a486c`](https://github.com/withastro/astro/commit/a342a486c2831461e24e6c2f1ca8a9d3e15477b6), [`8fb28648f`](https://github.com/withastro/astro/commit/8fb28648f66629741cb976bfe34ccd9d8f55661e), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ce5c5dbd4`](https://github.com/withastro/astro/commit/ce5c5dbd46afbe738b03600758bf5c35113de522), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`259a539d7`](https://github.com/withastro/astro/commit/259a539d7d70c783330c797794b15716921629cf), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`4987d6f44`](https://github.com/withastro/astro/commit/4987d6f44cfd0d81d88f21f5c380503403dc1e6a), [`304823811`](https://github.com/withastro/astro/commit/304823811eddd8e72aa1d8e2d39b40ab5cda3565), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`55cea0a9d`](https://github.com/withastro/astro/commit/55cea0a9d8c8df91a46590fc04a9ac28089b3432), [`dd56c1941`](https://github.com/withastro/astro/commit/dd56c19411b126439b8bc42d681b6fa8c06e8c61), [`9963c6e4d`](https://github.com/withastro/astro/commit/9963c6e4d50c392c3d1ac4492237020f15ccb1de), [`be901dc98`](https://github.com/withastro/astro/commit/be901dc98c4a7f6b5536540aa8f7ba5108e939a0), [`f6cf92b48`](https://github.com/withastro/astro/commit/f6cf92b48317a19a3840ad781b77d6d3cae143bb), [`e818cc046`](https://github.com/withastro/astro/commit/e818cc0466a942919ea3c41585e231c8c80cb3d0), [`8c100a6fe`](https://github.com/withastro/astro/commit/8c100a6fe6cc652c3799d1622e12c2c969f30510), [`116d8835c`](https://github.com/withastro/astro/commit/116d8835ca9e78f8b5e477ee5a3d737b69f80706), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`7325df412`](https://github.com/withastro/astro/commit/7325df412107fc0e65cd45c1b568fb686708f723), [`16c7d0bfd`](https://github.com/withastro/astro/commit/16c7d0bfd49d2b9bfae45385f506bcd642f9444a), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d), [`2a5786419`](https://github.com/withastro/astro/commit/2a5786419599b8674473c699300172b9aacbae2e), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`a8d3e7924`](https://github.com/withastro/astro/commit/a8d3e79246605d252dcddad159e358e2d79bd624), [`fa8c131f8`](https://github.com/withastro/astro/commit/fa8c131f88ef67d14c62f1c00c97ed74d43a80ac), [`64b8082e7`](https://github.com/withastro/astro/commit/64b8082e776b832f1433ed288e6f7888adb626d0), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`a3a7fc929`](https://github.com/withastro/astro/commit/a3a7fc9298e6d88abb4b7bee1e58f05fa9558cf1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`5fd9208d4`](https://github.com/withastro/astro/commit/5fd9208d447f5ab8909a2188b6c2491a0debd49d), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`899214298`](https://github.com/withastro/astro/commit/899214298cee5f0c975c7245e623c649e1842d73), [`3a00ecb3e`](https://github.com/withastro/astro/commit/3a00ecb3eb4bc44be758c064f2bde6e247e8a593), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0), [`1ca81c16b`](https://github.com/withastro/astro/commit/1ca81c16b8b66236e092e6eb6ec3f73f5668421c), [`b66d7195c`](https://github.com/withastro/astro/commit/b66d7195c17a55ea0931bc3744888bd4f5f01ce6)]:
  - astro@2.0.0
  - @astrojs/prism@2.0.0

## 2.0.0-beta.2

<details>
<summary>See changes in 2.0.0-beta.2</summary>

### Major Changes

- [#5785](https://github.com/withastro/astro/pull/5785) [`16107b6a1`](https://github.com/withastro/astro/commit/16107b6a10514ef1b563e585ec9add4b14f42b94) Thanks [@delucis](https://github.com/delucis)! - Drop support for legacy Astro-flavored Markdown

- [#5825](https://github.com/withastro/astro/pull/5825) [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Baseline the experimental `contentCollections` flag. You're free to remove this from your astro config!

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  - experimental: { contentCollections: true }
  })

  ```

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a peerDependency of integrations

  This marks `astro` as a peerDependency of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.

### Patch Changes

- [#5837](https://github.com/withastro/astro/pull/5837) [`12f65a4d5`](https://github.com/withastro/astro/commit/12f65a4d55e3fd2993c2f67b18794dd536280c69) Thanks [@giuseppelt](https://github.com/giuseppelt)! - fix shiki css class replace logic

- Updated dependencies [[`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0)]:
  - astro@2.0.0-beta.2
  - @astrojs/prism@2.0.0-beta.0

</details>

## 2.0.0-beta.1

<details>
<summary>See changes in 2.0.0-beta.1</summary>

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

</details>

## 1.2.0

### Minor Changes

- [#5654](https://github.com/withastro/astro/pull/5654) [`2c65b433b`](https://github.com/withastro/astro/commit/2c65b433bf840a1bb93b0a1947df5949e33512ff) Thanks [@delucis](https://github.com/delucis)! - Refactor and export `rehypeHeadingIds` plugin

  The `rehypeHeadingIds` plugin injects IDs for all headings in a Markdown document and can now also handle MDX inputs if needed. You can import and use this plugin if you need heading IDs to be injected _before_ other rehype plugins run.

### Patch Changes

- [#5648](https://github.com/withastro/astro/pull/5648) [`853081d1c`](https://github.com/withastro/astro/commit/853081d1c857d8ad8a9634c37ed8fd123d32d241) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Prevent relative image paths in `src/content/`

## 1.1.3

### Patch Changes

- [#4842](https://github.com/withastro/astro/pull/4842) [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46) Thanks [@bluwy](https://github.com/bluwy)! - Fix non-hoisted remark/rehype plugin loading

- [#4842](https://github.com/withastro/astro/pull/4842) [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46) Thanks [@bluwy](https://github.com/bluwy)! - Add missing dependencies, support strict dependency installation (e.g. pnpm)

## 1.1.2

### Patch Changes

- [#4787](https://github.com/withastro/astro/pull/4787) [`df54595a8`](https://github.com/withastro/astro/commit/df54595a8836448a621fceeb38fbaacde1bb27cf) Thanks [@merceyz](https://github.com/merceyz)! - declare `hast-util-to-html` as a dependency

## 1.1.1

### Patch Changes

- [#4519](https://github.com/withastro/astro/pull/4519) [`a2e8e76c3`](https://github.com/withastro/astro/commit/a2e8e76c303e8d6f39c24c122905a10f06907997) Thanks [@JuanM04](https://github.com/JuanM04)! - Upgraded Shiki to v0.11.1

## 1.1.0

### Minor Changes

- [#4474](https://github.com/withastro/astro/pull/4474) [`ac0321824`](https://github.com/withastro/astro/commit/ac03218247763e4782824e220a384fd20ae6d769) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add "extends" to markdown plugin config to preserve Astro defaults

* [#4138](https://github.com/withastro/astro/pull/4138) [`839097c84`](https://github.com/withastro/astro/commit/839097c84e830542c17c18d8337a88de8885c356) Thanks [@gtnbssn](https://github.com/gtnbssn)! - Makes remark-rehype options available in astro.config.mjs

## 1.1.0-next.0

### Minor Changes

- [#4474](https://github.com/withastro/astro/pull/4474) [`ac0321824`](https://github.com/withastro/astro/commit/ac03218247763e4782824e220a384fd20ae6d769) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add "extends" to markdown plugin config to preserve Astro defaults

* [#4138](https://github.com/withastro/astro/pull/4138) [`839097c84`](https://github.com/withastro/astro/commit/839097c84e830542c17c18d8337a88de8885c356) Thanks [@gtnbssn](https://github.com/gtnbssn)! - Makes remark-rehype options available in astro.config.mjs

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

### Patch Changes

- Updated dependencies [[`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308)]:
  - @astrojs/prism@1.0.0

## 0.14.1

### Patch Changes

- [#4176](https://github.com/withastro/astro/pull/4176) [`2675b8633`](https://github.com/withastro/astro/commit/2675b8633c5d5c45b237ec87940d5eaf1bfb1b4b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support frontmatter injection for MD and MDX using remark and rehype plugins

* [#4137](https://github.com/withastro/astro/pull/4137) [`471c6f784`](https://github.com/withastro/astro/commit/471c6f784e21399676c8b2002665ffdf83a1c59e) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Speed up internal markdown builds with new vite-plugin markdown

- [#4169](https://github.com/withastro/astro/pull/4169) [`16034f0dd`](https://github.com/withastro/astro/commit/16034f0dd5b3683e9e022dbd413e85bd18d2b031) Thanks [@hippotastic](https://github.com/hippotastic)! - Fix double-escaping of non-highlighted code blocks in Astro-flavored markdown

## 0.14.0

### Minor Changes

- [#4114](https://github.com/withastro/astro/pull/4114) [`64432bcb8`](https://github.com/withastro/astro/commit/64432bcb873efd0e4297c00fc9583a1fe516dfe7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Refactor `@astrojs/mdx` and `@astrojs/markdown-remark` to use `@astrojs/prism` instead of duplicating the code

### Patch Changes

- Updated dependencies [[`64432bcb8`](https://github.com/withastro/astro/commit/64432bcb873efd0e4297c00fc9583a1fe516dfe7)]:
  - @astrojs/prism@0.7.0

## 0.13.0

### Minor Changes

- [`ba11b3399`](https://github.com/withastro/astro/commit/ba11b33996d79c32da947986edb0f32dbcc04aaf) Thanks [@RafidMuhymin](https://github.com/RafidMuhymin)! - fixed generated slugs in markdown that ends with a dash

* [#4016](https://github.com/withastro/astro/pull/4016) [`00fab4ce1`](https://github.com/withastro/astro/commit/00fab4ce135eb799cac69140403d7724686733d6) Thanks [@bholmesdev](https://github.com/bholmesdev)! - The use of components and JSX expressions in Markdown are no longer supported by default.

  For long term support, migrate to the `@astrojs/mdx` integration for MDX support (including `.mdx` pages!).

  Not ready to migrate to MDX? Add the legacy flag to your Astro config to re-enable the previous Markdown support.

  ```js
  // https://astro.build/config
  export default defineConfig({
    legacy: {
      astroFlavoredMarkdown: true,
    },
  });
  ```

- [#4031](https://github.com/withastro/astro/pull/4031) [`6e27a5fdc`](https://github.com/withastro/astro/commit/6e27a5fdc21276cad26cd50e16a2709a40a7cbac) Thanks [@natemoo-re](https://github.com/natemoo-re)! - **BREAKING** Renamed Markdown utility function `getHeaders()` to `getHeadings()`.

### Patch Changes

- [#4008](https://github.com/withastro/astro/pull/4008) [`399d7e269`](https://github.com/withastro/astro/commit/399d7e269834d11c046b390705a9a53d3738f3cf) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Avoid parsing JSX, components, and Astro islands when using "plain" md mode. This brings `markdown.mode: 'md'` in-line with our docs description.

## 0.12.0

### Minor Changes

- [#3924](https://github.com/withastro/astro/pull/3924) [`07fb544da`](https://github.com/withastro/astro/commit/07fb544dab142a3d4bb9d0d878aab34eaea447b2) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Remove unused ssr-utils file

### Patch Changes

- Updated dependencies [[`31f9c0bf0`](https://github.com/withastro/astro/commit/31f9c0bf029ffa4b470e620f2c32e1370643e81e)]:
  - @astrojs/prism@0.6.1

## 0.11.7

### Patch Changes

- [#3919](https://github.com/withastro/astro/pull/3919) [`01a55467d`](https://github.com/withastro/astro/commit/01a55467d561974f843a9e0cd6963af7c840abb9) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add back missing ssr-utils.js file

## 0.11.6

### Patch Changes

- [#3911](https://github.com/withastro/astro/pull/3911) [`ca45c0c27`](https://github.com/withastro/astro/commit/ca45c0c270f5ca3f7d2fb113a235d415cecdb333) Thanks [@JuanM04](https://github.com/JuanM04)! - Don't throw when Shiki doesn't recognize a language

- Updated dependencies [[`b48767985`](https://github.com/withastro/astro/commit/b48767985359bd359df8071324952ea5f2bc0d86)]:
  - @astrojs/prism@0.6.0

## 0.11.5

### Patch Changes

- [#3669](https://github.com/withastro/astro/pull/3669) [`93e1020b1`](https://github.com/withastro/astro/commit/93e1020b1e8549b08cf5646e1ebc3ae34e14ebc8) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Tooling: reintroduce smoke test across example projects

## 0.11.4

### Patch Changes

- Updated dependencies [[`1cc5b7890`](https://github.com/withastro/astro/commit/1cc5b78905633608e5b07ad291f916f54e67feb1)]:
  - @astrojs/prism@0.5.0

## 0.11.3

### Patch Changes

- [#3638](https://github.com/withastro/astro/pull/3638) [`80c71c7c`](https://github.com/withastro/astro/commit/80c71c7c56d15dc05ec0c5a848130aad222d7d51) Thanks [@tony-sull](https://github.com/tony-sull)! - Fix: HTML comments in markdown code blocks should not be wrapped in JS comments

* [#3612](https://github.com/withastro/astro/pull/3612) [`fca58cfd`](https://github.com/withastro/astro/commit/fca58cfd91b68501ec82350ab023170b208d8ce7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: "vpath" import error when building for netlify edge

- [#3630](https://github.com/withastro/astro/pull/3630) [`48e67fe0`](https://github.com/withastro/astro/commit/48e67fe05398dc4b1fca12db36c1b37bb341277a) Thanks [@tony-sull](https://github.com/tony-sull)! - Encodes ampersand characters in code blocks

* [#3620](https://github.com/withastro/astro/pull/3620) [`05aa7244`](https://github.com/withastro/astro/commit/05aa72442cd4512b94abdb39623e8caa2c1839b0) Thanks [@hippotastic](https://github.com/hippotastic)! - Remove extra newlines around Markdown components

## 0.11.2

### Patch Changes

- [#3572](https://github.com/withastro/astro/pull/3572) [`5c73f614`](https://github.com/withastro/astro/commit/5c73f614e8f579e04fe61c948b69be7bc6d81d5d) Thanks [@hippotastic](https://github.com/hippotastic)! - Fix remarkMdxish performance issue on huge sites

## 0.11.1

### Patch Changes

- [#3564](https://github.com/withastro/astro/pull/3564) [`76fb01cf`](https://github.com/withastro/astro/commit/76fb01cff1002f2a37e93869378802156c4eca7c) Thanks [@hippotastic](https://github.com/hippotastic)! - Fix autolinking of URLs inside links

* [#3554](https://github.com/withastro/astro/pull/3554) [`c549f161`](https://github.com/withastro/astro/commit/c549f161cadd76a666672556f2c2d63b5f97f00d) Thanks [@hippotastic](https://github.com/hippotastic)! - Allow AlpineJS syntax extensions in Markdown

## 0.11.0

### Minor Changes

- [#3502](https://github.com/withastro/astro/pull/3502) [`939fe159`](https://github.com/withastro/astro/commit/939fe159255cecf1cab5c1b3da2670d30ac8e4a7) Thanks [@nokazn](https://github.com/nokazn)! - Fix cases for JSX-like expressions in code blocks of headings

### Patch Changes

- [#3514](https://github.com/withastro/astro/pull/3514) [`6c955ca6`](https://github.com/withastro/astro/commit/6c955ca643a7a071609ce8a5258cc7faf5a636b2) Thanks [@hippotastic](https://github.com/hippotastic)! - Fix Markdown errors missing source filename

* [#3516](https://github.com/withastro/astro/pull/3516) [`30578015`](https://github.com/withastro/astro/commit/30578015919e019cd8dd354288a45c1fc63bd01f) Thanks [@hippotastic](https://github.com/hippotastic)! - Fix: Allow self-closing tags in Markdown

## 0.10.2

### Patch Changes

- [#3486](https://github.com/withastro/astro/pull/3486) [`119ecf8d`](https://github.com/withastro/astro/commit/119ecf8d469f034eaf1b1217523954d29f492cb6) Thanks [@hippotastic](https://github.com/hippotastic)! - Fix components in markdown regressions

## 0.10.1

### Patch Changes

- [#3444](https://github.com/withastro/astro/pull/3444) [`51db2b9b`](https://github.com/withastro/astro/commit/51db2b9b4efd899bdd7efc481a5f226b3b040614) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: markdown imports failing due to internal dependency issue

## 0.10.0

### Minor Changes

- [#3410](https://github.com/withastro/astro/pull/3410) [`cfae9760`](https://github.com/withastro/astro/commit/cfae9760b252052b6189e96398b819a4337634a8) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Significantally more stable behavior for "Markdown + Components" usage, which now handles component serialization much more similarly to MDX. Also supports switching between Components and Markdown without extra newlines, removes wrapping `<p>` tags from standalone components, and improves JSX expression handling.

## 0.9.4

### Patch Changes

- [#3275](https://github.com/withastro/astro/pull/3275) [`8f8f05c1`](https://github.com/withastro/astro/commit/8f8f05c1b99d073a43af3020ba3922ea2d5b466d) Thanks [@matthewp](https://github.com/matthewp)! - Fixes regression in passing JS args to islands

## 0.9.3

### Patch Changes

- [#3234](https://github.com/withastro/astro/pull/3234) [`de123b28`](https://github.com/withastro/astro/commit/de123b28b3ff398b800cb598f20326ca85a0fb60) Thanks [@JuanM04](https://github.com/JuanM04)! - Removed `rehype-slug` in favor of our own implementation. The behavior of the slugging should remain the same

* [#3234](https://github.com/withastro/astro/pull/3234) [`de123b28`](https://github.com/withastro/astro/commit/de123b28b3ff398b800cb598f20326ca85a0fb60) Thanks [@JuanM04](https://github.com/JuanM04)! - Moved some type from `astro` to `@astrojs/markdown-remark`

## 0.9.2

### Patch Changes

- [#3152](https://github.com/withastro/astro/pull/3152) [`9ba1f4f8`](https://github.com/withastro/astro/commit/9ba1f4f8251155b69398a8af22d6ab8587b96120) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix JSX expression inconsistencies within markdown files

## 0.9.1

### Patch Changes

- [#3108](https://github.com/withastro/astro/pull/3108) [`ef198ff8`](https://github.com/withastro/astro/commit/ef198ff8351ac8fbc868e209f9cd410dc8b6f265) Thanks [@FredKSchott](https://github.com/FredKSchott)! - shiki: Add `diff` symbol handling to disable `user-select` on `+`/`-` symbols.

## 0.9.0

### Minor Changes

- [`53162534`](https://github.com/withastro/astro/commit/53162534450e160f65b95e7ef1523a106347ca28) Thanks [@FredKSchott](https://github.com/FredKSchott)! - - Removed `renderMarkdownWithFrontmatter` because it wasn't being used
  - All options of `renderMarkdown` are now required — see the exported interface `AstroMarkdownOptions`
  - New types: RemarkPlugin, RehypePlugin and ShikiConfig

## 0.8.2

### Patch Changes

- [#2970](https://github.com/withastro/astro/pull/2970) [`b835e285`](https://github.com/withastro/astro/commit/b835e285defb4f31fc5ac1039c7f607c07f3c00b) Thanks [@JuanM04](https://github.com/JuanM04)! - Improved type checking

## 0.8.1

### Patch Changes

- [#2971](https://github.com/withastro/astro/pull/2971) [`ad3c3916`](https://github.com/withastro/astro/commit/ad3c391696c5b9cc350a22831717682e73e25776) Thanks [@JuanM04](https://github.com/JuanM04)! - Escape expressions when mode == 'md'

## 0.8.0

### Minor Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update config options to respect [RFC0019](https://github.com/withastro/rfcs/blob/main/proposals/0019-config-finalization.md)

## 0.7.0

### Minor Changes

- [#2824](https://github.com/withastro/astro/pull/2824) [`0a3d3e51`](https://github.com/withastro/astro/commit/0a3d3e51a66af80fa949ba0f5e2104439d2be634) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Change shiki to our default markdown syntax highlighter. This includes updates to all relevant starter projects that used Prism-specific styles.

### Patch Changes

- [#2870](https://github.com/withastro/astro/pull/2870) [`d763ec18`](https://github.com/withastro/astro/commit/d763ec183ea391ad79ca16bf2b2e76848fc1180c) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix a shiki performance issue affecting large sites

- Updated dependencies [[`2db97f10`](https://github.com/withastro/astro/commit/2db97f10dc50f9498413181b78c477fe8833895b)]:
  - @astrojs/prism@0.4.1

## 0.7.0-next.1

### Patch Changes

- [#2870](https://github.com/withastro/astro/pull/2870) [`d763ec18`](https://github.com/withastro/astro/commit/d763ec183ea391ad79ca16bf2b2e76848fc1180c) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix a shiki performance issue affecting large sites

- Updated dependencies [[`2db97f10`](https://github.com/withastro/astro/commit/2db97f10dc50f9498413181b78c477fe8833895b)]:
  - @astrojs/prism@0.4.1-next.0

## 0.7.0-next.0

### Minor Changes

- [#2824](https://github.com/withastro/astro/pull/2824) [`0a3d3e51`](https://github.com/withastro/astro/commit/0a3d3e51a66af80fa949ba0f5e2104439d2be634) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Change shiki to our default markdown syntax highlighter. This includes updates to all relevant starter projects that used Prism-specific styles.

## 0.6.4

### Patch Changes

- [#2706](https://github.com/withastro/astro/pull/2706) [`b2c37385`](https://github.com/withastro/astro/commit/b2c37385f94614232d9a378ef2ef3264d5405cc8) Thanks [@JuanM04](https://github.com/JuanM04)! - Changed `data-astro-raw` to `is:raw` internally

## 0.6.3

### Patch Changes

- [#2697](https://github.com/withastro/astro/pull/2697) [`91765d79`](https://github.com/withastro/astro/commit/91765d79b1ec1181417fb6a4604a9e20564bb10e) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Improve performance by optimizing calls to `getHighlighter`

## 0.6.2

### Patch Changes

- [#2628](https://github.com/withastro/astro/pull/2628) [`9b7e2ab2`](https://github.com/withastro/astro/commit/9b7e2ab2516cd36520364490df8e3482008292e3) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed shiki to work with `{ "type": "module" }`

## 0.6.1

### Patch Changes

- [#2534](https://github.com/withastro/astro/pull/2534) [`cfeaa941`](https://github.com/withastro/astro/commit/cfeaa9414acdecec6f5d66ee0e33fe4fde574eee) Thanks [@JuanM04](https://github.com/JuanM04)! - Now you can use local plugins by passing a function instead of an `import`

* [#2518](https://github.com/withastro/astro/pull/2518) [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141) Thanks [@JuanM04](https://github.com/JuanM04)! - Added the ability to use custom themes and langs with Shiki (`<Code />` and `@astrojs/markdown-remark`)

- [#2497](https://github.com/withastro/astro/pull/2497) [`6fe1b027`](https://github.com/withastro/astro/commit/6fe1b0279fce5a7a0e90ff79746ea0b641da3e21) Thanks [@JuanM04](https://github.com/JuanM04)! - Add Shiki as an alternative to Prism

* [#2518](https://github.com/withastro/astro/pull/2518) [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141) Thanks [@JuanM04](https://github.com/JuanM04)! - Added `wrap` to Shiki config

- [#2564](https://github.com/withastro/astro/pull/2564) [`d71c4620`](https://github.com/withastro/astro/commit/d71c46207af40de6811596ca4f5e10aa9006377b) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed curly braces inside Shiki codeblocks

## 0.6.1-next.2

### Patch Changes

- [#2564](https://github.com/withastro/astro/pull/2564) [`d71c4620`](https://github.com/withastro/astro/commit/d71c46207af40de6811596ca4f5e10aa9006377b) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed curly braces inside Shiki codeblocks

## 0.6.1-next.1

### Patch Changes

- [#2534](https://github.com/withastro/astro/pull/2534) [`cfeaa941`](https://github.com/withastro/astro/commit/cfeaa9414acdecec6f5d66ee0e33fe4fde574eee) Thanks [@JuanM04](https://github.com/JuanM04)! - Now you can use local plugins by passing a function instead of an `import`

* [#2518](https://github.com/withastro/astro/pull/2518) [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141) Thanks [@JuanM04](https://github.com/JuanM04)! - Added the ability to use custom themes and langs with Shiki (`<Code />` and `@astrojs/markdown-remark`)

- [#2518](https://github.com/withastro/astro/pull/2518) [`2bc91543`](https://github.com/withastro/astro/commit/2bc91543ceeb5f3dd45e201bf75d79f186e85141) Thanks [@JuanM04](https://github.com/JuanM04)! - Added `wrap` to Shiki config

## 0.6.1-next.0

### Patch Changes

- [#2497](https://github.com/withastro/astro/pull/2497) [`6fe1b027`](https://github.com/withastro/astro/commit/6fe1b0279fce5a7a0e90ff79746ea0b641da3e21) Thanks [@JuanM04](https://github.com/JuanM04)! - Add Shiki as an alternative to Prism

## 0.6.0

### Minor Changes

- [#2202](https://github.com/withastro/astro/pull/2202) [`45cea6ae`](https://github.com/withastro/astro/commit/45cea6aec5a310fed4cb8da0d96670d6b99a2539) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Officially drop support for Node v12. The minimum supported version is now Node v14.15+,

### Patch Changes

- Updated dependencies [[`45cea6ae`](https://github.com/withastro/astro/commit/45cea6aec5a310fed4cb8da0d96670d6b99a2539)]:
  - @astrojs/prism@0.4.0

## 0.5.0

### Minor Changes

- 679d4395: - Upgraded dependencies
  - Replaced `remark-slug` with `rehype-slug` because [it was deprecated](https://github.com/remarkjs/remark-slug)
  - Replaced `@silvenon/remark-smartypants` with `remark-smartypants` because its name was changed
  - Disable **all** built-in plugins when custom remark and/or rehype plugins are added
  - Removed `remark-footnotes` because [`remark-gfm` now supports footnotes](https://github.com/remarkjs/remark-gfm/releases/tag/3.0.0)
  - Re-added `remark-smartypants` and `rehype-slug` to the default plugins list

## 0.4.0

### Minor Changes

- e6aaeff5: Initial release.

### Patch Changes

- Updated dependencies [e6aaeff5]
  - @astrojs/prism@0.3.0

## 0.4.0-next.2

### Patch Changes

- 00d2b625: Move gray-matter to deps

## 0.4.0-next.1

### Patch Changes

- 7eaabbb0: Fix bug where code blocks would not be escaped properly

## 0.4.0-next.0

### Minor Changes

- d84bfe71: Adds prism support within the Markdown plugin.

### Patch Changes

- Updated dependencies [d84bfe71]
  - @astrojs/prism@0.3.0-next.0

## 0.3.1

### Patch Changes

- b03f8771: Fix parsing of an empty `<pre></pre>` tag in markdown files, which expected the pre tag to have a child
- b03f8771: Fix the importing of `unified` `Plugin` and `UnifiedPlugin` types

## 0.3.0

### Minor Changes

- 397d8f3d: Upgrade `@astrojs/markdown-support` dependencies. The `remark-rehype@9` upgrade enables accessible footnotes with `remark-footnotes`.

## 0.2.4

### Patch Changes

- a421329f: Fix the left-brace issue

## 0.2.3

### Patch Changes

- 460e625: Move remaining missing dependencies

## 0.2.2

### Patch Changes

- 7015356: Move rehype-raw to a dependency

## 0.2.1

### Patch Changes

- 70f0a09: Added remark-slug to default plugins

## 0.2.0

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

- f83407e: Expose `html` to `Astro.fetchContent` (#571)

## 0.1.2

### Patch Changes

- f9f2da4: Add repository key to all package.json

## 0.1.1

### Patch Changes

- 50e6f49: Fixes issues with using astro via the create script
