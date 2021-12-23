# @astrojs/markdown-remark

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
