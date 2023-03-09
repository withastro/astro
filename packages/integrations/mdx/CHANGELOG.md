# @astrojs/mdx

## 0.18.0

### Minor Changes

- [#6344](https://github.com/withastro/astro/pull/6344) [`694918a56`](https://github.com/withastro/astro/commit/694918a56b01104831296be0c25456135a63c784) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a new experimental flag (`experimental.assets`) to enable our new core Assets story.

  This unlocks a few features:

  - A new built-in image component and JavaScript API to transform and optimize images.
  - Relative images with automatic optimization in Markdown.
  - Support for validating assets using content collections.
  - and more!

  See [Assets (Experimental)](https://docs.astro.build/en/guides/assets/) on our docs site for more information on how to use this feature!

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
  - @astrojs/prism@2.1.0

## 0.17.2

### Patch Changes

- [#6296](https://github.com/withastro/astro/pull/6296) [`075b87e8b`](https://github.com/withastro/astro/commit/075b87e8b72a69a608cd2ff1196dc0989e2cf1e1) Thanks [@RaphaelBossek](https://github.com/RaphaelBossek)! - Update to `es-module-lexer@1.1.1`

## 0.17.1

- Updated to es-module-lexer@1.1.1

## 0.17.0

### Minor Changes

- [#6253](https://github.com/withastro/astro/pull/6253) [`0049fda62`](https://github.com/withastro/astro/commit/0049fda62fa8650a0d250adb00a2c5d82679aeaf) Thanks [@bluwy](https://github.com/bluwy)! - Support rehype plugins that inject namespaced attributes. This introduces a breaking change if you use [custom components for HTML elements](https://docs.astro.build/en/guides/markdown-content/#assigning-custom-components-to-html-elements), where the prop passed to the component will be normal HTML casing, e.g. `class` instead of `className`, and `xlink:href` instead of `xlinkHref`.

## 0.16.2

### Patch Changes

- [#6252](https://github.com/withastro/astro/pull/6252) [`0fbcf838a`](https://github.com/withastro/astro/commit/0fbcf838a775d3b07e7c2372888a8aa6c190278e) Thanks [@bluwy](https://github.com/bluwy)! - Revert previous breaking change

## 0.16.1

### Patch Changes

- [#6243](https://github.com/withastro/astro/pull/6243) [`4f6ecba4c`](https://github.com/withastro/astro/commit/4f6ecba4c1b35bacbbc0097854ee2b7b8c878e71) Thanks [@bluwy](https://github.com/bluwy)! - Support rehype plugins that inject namespaced attributes

## 0.16.0

### Minor Changes

- [#6050](https://github.com/withastro/astro/pull/6050) [`2ab32b59e`](https://github.com/withastro/astro/commit/2ab32b59ef0a28d34757f2c2adb9cf2baa86855e) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: load syntax highlighters after MDX remark plugins. This keeps MDX consistent with Astro's markdown behavior.

### Patch Changes

- [#6062](https://github.com/withastro/astro/pull/6062) [`c6cf847bd`](https://github.com/withastro/astro/commit/c6cf847bd0b6bef3c51a5710fba5ca43b11e46f9) Thanks [@delucis](https://github.com/delucis)! - Update MDX README

## 0.15.2

### Patch Changes

- [#5478](https://github.com/withastro/astro/pull/5478) [`1c7eef308`](https://github.com/withastro/astro/commit/1c7eef308e808aa5ed4662b53e67ec8d1b814d1f) Thanks [@nemo0](https://github.com/nemo0)! - Update READMEs for consistency

## 0.15.1

### Patch Changes

- [#5978](https://github.com/withastro/astro/pull/5978) [`7abb1e905`](https://github.com/withastro/astro/commit/7abb1e9056c4b4fd0abfced347df32a41cdfbf28) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fix MDX heading IDs generation when using a frontmatter reference

- Updated dependencies [[`7abb1e905`](https://github.com/withastro/astro/commit/7abb1e9056c4b4fd0abfced347df32a41cdfbf28)]:
  - @astrojs/markdown-remark@2.0.1

## 0.15.0

### Minor Changes

- [#5684](https://github.com/withastro/astro/pull/5684) [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Refine Markdown and MDX configuration options for ease-of-use. & [#5769](https://github.com/withastro/astro/pull/5769) [`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Introduce a `smartypants` flag to opt-out of Astro's default SmartyPants plugin.

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

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 14. Minimum supported Node version is now >=16.12.0

- [#5825](https://github.com/withastro/astro/pull/5825) [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Baseline the experimental `contentCollections` flag. You're free to remove this from your astro config!

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  - experimental: { contentCollections: true }
  })
  ```

### Patch Changes

- [#5837](https://github.com/withastro/astro/pull/5837) [`12f65a4d5`](https://github.com/withastro/astro/commit/12f65a4d55e3fd2993c2f67b18794dd536280c69) Thanks [@giuseppelt](https://github.com/giuseppelt)! - fix shiki css class replace logic

- [#5741](https://github.com/withastro/astro/pull/5741) [`000d3e694`](https://github.com/withastro/astro/commit/000d3e6940839c2aebba1984e6fb3b133cec6749) Thanks [@delucis](https://github.com/delucis)! - Fix broken links in README

- Updated dependencies [[`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b), [`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`12f65a4d5`](https://github.com/withastro/astro/commit/12f65a4d55e3fd2993c2f67b18794dd536280c69), [`16107b6a1`](https://github.com/withastro/astro/commit/16107b6a10514ef1b563e585ec9add4b14f42b94), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53)]:
  - @astrojs/markdown-remark@2.0.0
  - @astrojs/prism@2.0.0

## 1.0.0-beta.2

<details>
<summary>See changes in 1.0.0-beta.2</summary>

### Major Changes

- [#5825](https://github.com/withastro/astro/pull/5825) [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Baseline the experimental `contentCollections` flag. You're free to remove this from your astro config!

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  - experimental: { contentCollections: true }
  })
  ```

### Minor Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 14. Minimum supported Node version is now >=16.12.0

### Patch Changes

- [#5837](https://github.com/withastro/astro/pull/5837) [`12f65a4d5`](https://github.com/withastro/astro/commit/12f65a4d55e3fd2993c2f67b18794dd536280c69) Thanks [@giuseppelt](https://github.com/giuseppelt)! - fix shiki css class replace logic

- Updated dependencies [[`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`12f65a4d5`](https://github.com/withastro/astro/commit/12f65a4d55e3fd2993c2f67b18794dd536280c69), [`16107b6a1`](https://github.com/withastro/astro/commit/16107b6a10514ef1b563e585ec9add4b14f42b94), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53)]:
  - @astrojs/prism@2.0.0-beta.0
  - @astrojs/markdown-remark@2.0.0-beta.2

</details>

## 0.15.0-beta.1

<details>
<summary>See changes in 0.15.0-beta.1</summary>

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

- [#5741](https://github.com/withastro/astro/pull/5741) [`000d3e694`](https://github.com/withastro/astro/commit/000d3e6940839c2aebba1984e6fb3b133cec6749) Thanks [@delucis](https://github.com/delucis)! - Fix broken links in README

- Updated dependencies [[`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b)]:
  - @astrojs/markdown-remark@2.0.0-beta.1

</details>

## 0.15.0-beta.0

<details>
<summary>See changes in 0.15.0-beta.0</summary>

### Minor Changes

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

### Patch Changes

- Updated dependencies [[`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d)]:
  - @astrojs/markdown-remark@2.0.0-beta.0

</details>

## 0.14.0

### Minor Changes

- [#5654](https://github.com/withastro/astro/pull/5654) [`2c65b433b`](https://github.com/withastro/astro/commit/2c65b433bf840a1bb93b0a1947df5949e33512ff) Thanks [@delucis](https://github.com/delucis)! - Run heading ID injection after user plugins

  ⚠️ BREAKING CHANGE ⚠️

  If you are using a rehype plugin that depends on heading IDs injected by Astro, the IDs will no longer be available when your plugin runs by default.

  To inject IDs before your plugins run, import and add the `rehypeHeadingIds` plugin to your `rehypePlugins` config:

  ```diff
  // astro.config.mjs
  + import { rehypeHeadingIds } from '@astrojs/markdown-remark';
  import mdx from '@astrojs/mdx';

  export default {
    integrations: [mdx()],
    markdown: {
      rehypePlugins: [
  +     rehypeHeadingIds,
        otherPluginThatReliesOnHeadingIDs,
      ],
    },
  }
  ```

### Patch Changes

- [#5667](https://github.com/withastro/astro/pull/5667) [`a5ba4af79`](https://github.com/withastro/astro/commit/a5ba4af79930145f4edf66d45cd40ddad045cc86) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Chore: remove verbose "Now interiting Markdown plugins..." logs

- [#5648](https://github.com/withastro/astro/pull/5648) [`853081d1c`](https://github.com/withastro/astro/commit/853081d1c857d8ad8a9634c37ed8fd123d32d241) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Prevent relative image paths in `src/content/`

- Updated dependencies [[`853081d1c`](https://github.com/withastro/astro/commit/853081d1c857d8ad8a9634c37ed8fd123d32d241), [`2c65b433b`](https://github.com/withastro/astro/commit/2c65b433bf840a1bb93b0a1947df5949e33512ff)]:
  - @astrojs/markdown-remark@1.2.0

## 0.13.0

### Minor Changes

- [#5291](https://github.com/withastro/astro/pull/5291) [`5ec0f6ed5`](https://github.com/withastro/astro/commit/5ec0f6ed55b0a14a9663a90a03428345baf126bd) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Introduce Content Collections experimental API
  - Organize your Markdown and MDX content into easy-to-manage collections.
  - Add type safety to your frontmatter with schemas.
  - Generate landing pages, static routes, and SSR endpoints from your content using the collection query APIs.

## 0.12.2

### Patch Changes

- [#5586](https://github.com/withastro/astro/pull/5586) [`f4ff69a3c`](https://github.com/withastro/astro/commit/f4ff69a3cd874c8804c6d01c7cbbaed8a8e90be7) Thanks [@delucis](https://github.com/delucis)! - Fix link in MDX integration README

- [#5570](https://github.com/withastro/astro/pull/5570) [`3f811eb68`](https://github.com/withastro/astro/commit/3f811eb682d55bd1f908f9b4bc3b795d2859d713) Thanks [@sarah11918](https://github.com/sarah11918)! - Revise README

## 0.12.1

### Patch Changes

- [#5522](https://github.com/withastro/astro/pull/5522) [`efc4363e0`](https://github.com/withastro/astro/commit/efc4363e0baf7f92900e20af339811bb3df42b0e) Thanks [@delucis](https://github.com/delucis)! - Support use of `<Fragment>` in MDX files rendered with `<Content />` component

## 0.12.0

### Minor Changes

- [#5427](https://github.com/withastro/astro/pull/5427) [`2a1c085b1`](https://github.com/withastro/astro/commit/2a1c085b199f24e34424ec8c19041c03602c53c5) Thanks [@backflip](https://github.com/backflip)! - Uses remark-rehype options from astro.config.mjs

### Patch Changes

- [#5448](https://github.com/withastro/astro/pull/5448) [`ef2ffc7ae`](https://github.com/withastro/astro/commit/ef2ffc7ae9ff554860238ecd2fb3bf6d82b5801b) Thanks [@delucis](https://github.com/delucis)! - Fix broken link in README

## 0.11.6

### Patch Changes

- [#5335](https://github.com/withastro/astro/pull/5335) [`dca762cf7`](https://github.com/withastro/astro/commit/dca762cf734a657d8f126fd6958892b6163a4f67) Thanks [@bluwy](https://github.com/bluwy)! - Preserve code element node `data.meta` in `properties.metastring` for rehype syntax highlighters, like `rehype-pretty-code``

## 0.11.5

### Patch Changes

- [#5146](https://github.com/withastro/astro/pull/5146) [`308e565ad`](https://github.com/withastro/astro/commit/308e565ad39957e3353d72ca5d3bbce1a1b45008) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support recmaPlugins config option

## 0.11.4

### Patch Changes

- [#4953](https://github.com/withastro/astro/pull/4953) [`a59731995`](https://github.com/withastro/astro/commit/a59731995b93ae69c21dc3adc5c8b482b466d12e) Thanks [@bluwy](https://github.com/bluwy)! - Log markdown hints with console.info

## 0.11.3

### Patch Changes

- [#4842](https://github.com/withastro/astro/pull/4842) [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46) Thanks [@bluwy](https://github.com/bluwy)! - Add missing dependencies, support strict dependency installation (e.g. pnpm)

## 0.11.2

### Patch Changes

- [#4700](https://github.com/withastro/astro/pull/4700) [`e5f71142e`](https://github.com/withastro/astro/commit/e5f71142eb62bd72456e889dad5774347c3753f2) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Document MDXLayoutProps utility type

- [#4858](https://github.com/withastro/astro/pull/4858) [`58a2dca22`](https://github.com/withastro/astro/commit/58a2dca2286cb14f6211cf51267c02447e78433a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Correctly parse import.meta.env in MDX files

## 0.11.1

### Patch Changes

- [#4588](https://github.com/withastro/astro/pull/4588) [`db38f61b2`](https://github.com/withastro/astro/commit/db38f61b2b2dc55f03b28797d19b163b1940f1c8) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: Add GFM and Smartypants to MDX by default

## 0.11.0

### Minor Changes

- [#4504](https://github.com/withastro/astro/pull/4504) [`8f8dff4d3`](https://github.com/withastro/astro/commit/8f8dff4d339a3a12ee155d81a97132032ef3b622) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Introduce new `extendPlugins` configuration option. This defaults to inheriting all remark and rehype plugins from your `markdown` config, with options to use either Astro's defaults or no inheritance at all.

## 0.10.3

### Patch Changes

- [#4519](https://github.com/withastro/astro/pull/4519) [`a2e8e76c3`](https://github.com/withastro/astro/commit/a2e8e76c303e8d6f39c24c122905a10f06907997) Thanks [@JuanM04](https://github.com/JuanM04)! - Upgraded Shiki to v0.11.1

- [#4530](https://github.com/withastro/astro/pull/4530) [`8504cd79b`](https://github.com/withastro/astro/commit/8504cd79b708e0d3bf1a2bb4ff9b86936bdd692b) Thanks [@kylebutts](https://github.com/kylebutts)! - Add custom components to README

## 0.10.2

### Patch Changes

- [#4423](https://github.com/withastro/astro/pull/4423) [`d4cd7a59f`](https://github.com/withastro/astro/commit/d4cd7a59fd38d411c442a818cfaab40f74106628) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update Markdown type signature to match new markdown plugin,and update top-level layout props for better alignment

## 0.10.2-next.0

### Patch Changes

- [#4423](https://github.com/withastro/astro/pull/4423) [`d4cd7a59f`](https://github.com/withastro/astro/commit/d4cd7a59fd38d411c442a818cfaab40f74106628) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update Markdown type signature to match new markdown plugin,and update top-level layout props for better alignment

## 0.10.1

### Patch Changes

- [#4443](https://github.com/withastro/astro/pull/4443) [`adb207979`](https://github.com/withastro/astro/commit/adb20797962c280d4d38f335f577fd52a1b48d4b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix MDX style imports when layout is not applied

* [#4428](https://github.com/withastro/astro/pull/4428) [`a2414bf59`](https://github.com/withastro/astro/commit/a2414bf59e2e2cd633aece68e724401c4ad281b9) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix dev server reload performance when globbing from an MDX layout

## 0.10.0

### Minor Changes

- [#4292](https://github.com/withastro/astro/pull/4292) [`f1a52c18a`](https://github.com/withastro/astro/commit/f1a52c18afe66e6d310743ae6884be76f69be265) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Switch from Shiki Twoslash to Astro's Shiki Markdown highlighter

## 0.9.0

### Minor Changes

- [#4268](https://github.com/withastro/astro/pull/4268) [`f7afdb889`](https://github.com/withastro/astro/commit/f7afdb889fe4e97177958c8ec92f80c5f6e5cb51) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Align MD with MDX on layout props and "glob" import results:
  - Add `Content` to MDX
  - Add `file` and `url` to MDX frontmatter (layout import only)
  - Update glob types to reflect differences (lack of `rawContent` and `compiledContent`)

### Patch Changes

- [#4272](https://github.com/withastro/astro/pull/4272) [`24d2f7a6e`](https://github.com/withastro/astro/commit/24d2f7a6e6700c10c863f826f37bb653d70e3a83) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Properly handle hydration for namespaced components

## 0.8.3

### Patch Changes

- [#4248](https://github.com/withastro/astro/pull/4248) [`869d00935`](https://github.com/withastro/astro/commit/869d0093596b709cfcc1a1a95ee631b48d6d1c26) Thanks [@svemat01](https://github.com/svemat01)! - Load builtin rehype plugins before user plugins instead of after

* [#4255](https://github.com/withastro/astro/pull/4255) [`411612808`](https://github.com/withastro/astro/commit/4116128082121ee276d51cb245bf8095be4728a1) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Pass injected frontmatter from remark and rehype plugins to layouts

* Updated dependencies [[`1f0dd31d9`](https://github.com/withastro/astro/commit/1f0dd31d9239b5e3dca99c88d021e7a9a3e2054d)]:
  - @astrojs/prism@1.0.1

## 0.8.2

### Patch Changes

- [#4237](https://github.com/withastro/astro/pull/4237) [`9d5ab5508`](https://github.com/withastro/astro/commit/9d5ab55086964fbede17da3d78c209c6d8d13711) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update "Astro.props.content" -> "Astro.props.frontmatter" in README

## 0.8.1

### Patch Changes

- Updated dependencies [[`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308)]:
  - @astrojs/prism@1.0.0

## 0.8.0

### Minor Changes

- [#4204](https://github.com/withastro/astro/pull/4204) [`4c2ca5352`](https://github.com/withastro/astro/commit/4c2ca5352d0c4119ed2a9e5e0b78ce71eb1b414a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove `frontmatterOptions` from MDX config

### Patch Changes

- [#4205](https://github.com/withastro/astro/pull/4205) [`6c9736cbc`](https://github.com/withastro/astro/commit/6c9736cbc90162f1de3ebccd7cfe98332749b639) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add frontmatter injection instructions to README

## 0.7.0

### Minor Changes

- [#4176](https://github.com/withastro/astro/pull/4176) [`2675b8633`](https://github.com/withastro/astro/commit/2675b8633c5d5c45b237ec87940d5eaf1bfb1b4b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support frontmatter injection for MD and MDX using remark and rehype plugins

### Patch Changes

- [#4181](https://github.com/withastro/astro/pull/4181) [`77cede720`](https://github.com/withastro/astro/commit/77cede720b09bce34f29c3d2d8b505311ce876b1) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Make collect-headings rehype plugin non-overridable

* [#4174](https://github.com/withastro/astro/pull/4174) [`8eb3a8c6d`](https://github.com/withastro/astro/commit/8eb3a8c6d9554707963c3a3bc36ed8b68d3cf0fb) Thanks [@matthewp](https://github.com/matthewp)! - Allows using React with automatic imports alongside MDX

- [#4145](https://github.com/withastro/astro/pull/4145) [`c7efcf57e`](https://github.com/withastro/astro/commit/c7efcf57e00a0fcde3bc9f813e3cc59902bd484c) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix a missing newline bug when `layout` was set.

## 0.6.0

### Minor Changes

- [#4134](https://github.com/withastro/astro/pull/4134) [`2968ba2b6`](https://github.com/withastro/astro/commit/2968ba2b6f00775b6e9872681b390cb466fdbfa2) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add `headings` and `frontmatter` properties to layout props

## 0.5.0

### Minor Changes

- [#4095](https://github.com/withastro/astro/pull/4095) [`40ef43a59`](https://github.com/withastro/astro/commit/40ef43a59b08a1a8fbcd9f4a53745a9636a4fbb9) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add IDs to MDX headings and expose via getHeadings() export

* [#4114](https://github.com/withastro/astro/pull/4114) [`64432bcb8`](https://github.com/withastro/astro/commit/64432bcb873efd0e4297c00fc9583a1fe516dfe7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Refactor `@astrojs/mdx` and `@astrojs/markdown-remark` to use `@astrojs/prism` instead of duplicating the code

### Patch Changes

- [#4112](https://github.com/withastro/astro/pull/4112) [`e33fc9bc4`](https://github.com/withastro/astro/commit/e33fc9bc46ff0a30013deb6dc76e545e70cc3a3e) Thanks [@matthewp](https://github.com/matthewp)! - Fix MDX working with a ts config file

* [#4049](https://github.com/withastro/astro/pull/4049) [`b60cc0538`](https://github.com/withastro/astro/commit/b60cc0538bc5c68dd411117780d20d892530789d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve `injectScript` handling for non-Astro pages

* Updated dependencies [[`64432bcb8`](https://github.com/withastro/astro/commit/64432bcb873efd0e4297c00fc9583a1fe516dfe7)]:
  - @astrojs/prism@0.7.0

## 0.4.0

### Minor Changes

- [#4088](https://github.com/withastro/astro/pull/4088) [`1743fe140`](https://github.com/withastro/astro/commit/1743fe140eb58d60e26cbd11a066bb60de046e0c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support "layout" frontmatter property

## 0.3.1

### Patch Changes

- [#4076](https://github.com/withastro/astro/pull/4076) [`6120a71e5`](https://github.com/withastro/astro/commit/6120a71e5425ad55a17ddac800d64a3f50273bce) Thanks [@matthewp](https://github.com/matthewp)! - Ensure file and url are always present in MDX for Astro.glob

## 0.3.0

### Minor Changes

- [#3977](https://github.com/withastro/astro/pull/3977) [`19433eb4a`](https://github.com/withastro/astro/commit/19433eb4a4441522f68492ca914ad2ab4f061343) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add remarkPlugins and rehypePlugins to config, with the same default plugins as our standard Markdown parser

* [#4002](https://github.com/withastro/astro/pull/4002) [`3b8a74452`](https://github.com/withastro/astro/commit/3b8a7445247221100462ba035f6778b43ea180e7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support Prism and Shiki syntax highlighting based on project config

- [#3995](https://github.com/withastro/astro/pull/3995) [`b2b367c96`](https://github.com/withastro/astro/commit/b2b367c969493aaf21c974064beb241d05228066) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support YAML frontmatter in MDX files

### Patch Changes

- [#4050](https://github.com/withastro/astro/pull/4050) [`9ab66c4ba`](https://github.com/withastro/astro/commit/9ab66c4ba9bf2250990114c76b792f26d0694365) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add support for injected "page-ssr" scripts

* [#3981](https://github.com/withastro/astro/pull/3981) [`61fec6304`](https://github.com/withastro/astro/commit/61fec63044e1585348e8405bee6fdf4dec635efa) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Include page url in MDX glob result

## 0.2.1

### Patch Changes

- [#3937](https://github.com/withastro/astro/pull/3937) [`31f9c0bf0`](https://github.com/withastro/astro/commit/31f9c0bf029ffa4b470e620f2c32e1370643e81e) Thanks [@delucis](https://github.com/delucis)! - Roll back supported Node engines

## 0.2.0

### Minor Changes

- [#3914](https://github.com/withastro/astro/pull/3914) [`b48767985`](https://github.com/withastro/astro/commit/b48767985359bd359df8071324952ea5f2bc0d86) Thanks [@ran-dall](https://github.com/ran-dall)! - Rollback supported `node@16` version. Minimum versions are now `node@14.20.0` or `node@16.14.0`.

## 0.1.1

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.1.0

### Minor Changes

- [#3871](https://github.com/withastro/astro/pull/3871) [`1cc5b7890`](https://github.com/withastro/astro/commit/1cc5b78905633608e5b07ad291f916f54e67feb1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update supported `node` versions. Minimum versions are now `node@14.20.0` or `node@16.16.0`.

## 0.0.3

### Patch Changes

- [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.0.2

### Patch Changes

- [#3706](https://github.com/withastro/astro/pull/3706) [`032ad1c0`](https://github.com/withastro/astro/commit/032ad1c047a62dd663067cc562537d16f2872aa7) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Initial release! 🎉
