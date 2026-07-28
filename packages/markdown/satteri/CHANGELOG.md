# @astrojs/markdown-satteri

## 0.3.4

### Patch Changes

- [#17341](https://github.com/withastro/astro/pull/17341) [`64b0d66`](https://github.com/withastro/astro/commit/64b0d6667eabd8fe51643dfdab7004670e319810) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes custom `pre` components not applying to syntax-highlighted code blocks when using the Sätteri Markdown processor with MDX.

## 0.3.3

### Patch Changes

- Updated dependencies [[`eb6f97e`](https://github.com/withastro/astro/commit/eb6f97e391ee587747e37609c255c7cd4b9cce3c)]:
  - @astrojs/internal-helpers@0.10.1

## 0.3.2

### Patch Changes

- [#17165](https://github.com/withastro/astro/pull/17165) [`3b5e994`](https://github.com/withastro/astro/commit/3b5e994738cf58c9eed0774ce779b685c31a3a5c) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes headings being listed twice in a page's `headings` metadata when an integration (such as Starlight) assigns heading IDs with its own heading pass before adding anchor links

## 0.3.1

### Patch Changes

- [#17124](https://github.com/withastro/astro/pull/17124) [`7e7ab87`](https://github.com/withastro/astro/commit/7e7ab8775f1c70e00e30db9d3c4796246eaf1c5f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates `satteri` to `0.9.0`. See the [Sätteri changelog](https://github.com/bruits/satteri/blob/main/packages/satteri/CHANGELOG.md) for details.

- [#17129](https://github.com/withastro/astro/pull/17129) [`ff7b718`](https://github.com/withastro/astro/commit/ff7b718a301b8edc7d7db6626f65e69ce35823a7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for [modifying frontmatter programmatically](https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically) with the default Markdown processor.

  A Sätteri plugin can now read and mutate `ctx.data.astro.frontmatter`, and Astro uses the result as the page's frontmatter, in both Markdown and MDX.

- [#17027](https://github.com/withastro/astro/pull/17027) [`241250b`](https://github.com/withastro/astro/commit/241250bf126f39c86a8aedd38df106e533301752) Thanks [@ocavue](https://github.com/ocavue)! - Triggers beta prereleases for packages that are still on alpha

## 0.3.1-beta.2

### Patch Changes

- [#17124](https://github.com/withastro/astro/pull/17124) [`7e7ab87`](https://github.com/withastro/astro/commit/7e7ab8775f1c70e00e30db9d3c4796246eaf1c5f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates `satteri` to `0.9.0`. See the [Sätteri changelog](https://github.com/bruits/satteri/blob/main/packages/satteri/CHANGELOG.md) for details.

## 0.3.1-beta.1

### Patch Changes

- [#17027](https://github.com/withastro/astro/pull/17027) [`241250b`](https://github.com/withastro/astro/commit/241250bf126f39c86a8aedd38df106e533301752) Thanks [@ocavue](https://github.com/ocavue)! - Triggers beta prereleases for packages that are still on alpha

## 0.3.0-alpha.0

### Minor Changes

- [#16969](https://github.com/withastro/astro/pull/16969) [`4a31f90`](https://github.com/withastro/astro/commit/4a31f90c765bcd1c4af8b85160b74a0da338cfe7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for Prism syntax highlighting to the Sätteri Markdown and MDX processors. Setting `markdown.syntaxHighlight` to `'prism'` now highlights your code blocks with Prism.

  ```js
  // astro.config.mjs
  import { satteri } from '@astrojs/markdown-satteri';

  export default defineConfig({
    markdown: {
      processor: satteri(),
      syntaxHighlight: 'prism',
    },
  });
  ```

## 0.3.0

### Minor Changes

- [#16969](https://github.com/withastro/astro/pull/16969) [`4a31f90`](https://github.com/withastro/astro/commit/4a31f90c765bcd1c4af8b85160b74a0da338cfe7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for Prism syntax highlighting to the Sätteri Markdown and MDX processors. Setting `markdown.syntaxHighlight` to `'prism'` now highlights your code blocks with Prism.

  ```js
  // astro.config.mjs
  import { satteri } from '@astrojs/markdown-satteri';

  export default defineConfig({
    markdown: {
      processor: satteri(),
      syntaxHighlight: 'prism',
    },
  });
  ```

## 0.2.2

### Patch Changes

- [#16955](https://github.com/withastro/astro/pull/16955) [`9a93d68`](https://github.com/withastro/astro/commit/9a93d68429aa15e76f07268863badfbda7b59d23) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates Sätteri processor to v0.8.0. See [its changelog](https://github.com/bruits/satteri/blob/main/packages/satteri/CHANGELOG.md#080--2026-06-03) for details on bugs fixed and features added.

## 0.2.1

### Patch Changes

- [#16883](https://github.com/withastro/astro/pull/16883) [`eeb064c`](https://github.com/withastro/astro/commit/eeb064ca9452fd9d0ad9b7557059a646a90a3e57) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes missing provenance information on the publish

## 0.2.0

### Minor Changes

- [#16848](https://github.com/withastro/astro/pull/16848) [`f732f3c`](https://github.com/withastro/astro/commit/f732f3cc716342a63e5b03815243ba10964b89dc) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds `@astrojs/markdown-satteri`, a Markdown processor based on [Sätteri](https://satteri.bruits.org), a fast Markdown pipeline written in Rust.

  Sätteri is much faster than the default Remark-based processor, and supports a wide range of Markdown features out of the box, without requiring additional plugins. In the future, we plan to make this the default Markdown processor in Astro.

  ```sh
  npm install @astrojs/markdown-satteri
  ```

  ```js
  // astro.config.mjs
  import { satteri } from '@astrojs/markdown-satteri';

  export default defineConfig({
    markdown: {
      processor: satteri(),
    },
  });
  ```

  Note that this processor currently does not support Prism syntax highlighting, and require using `syntaxHighlight: 'shiki'` or disabling syntax highlighting altogether for now.

### Patch Changes

- Updated dependencies [[`f732f3c`](https://github.com/withastro/astro/commit/f732f3cc716342a63e5b03815243ba10964b89dc)]:
  - @astrojs/internal-helpers@0.10.0
