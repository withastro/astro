# @astrojs/markdown-satteri

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
