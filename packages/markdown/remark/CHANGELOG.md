# @astrojs/markdown-remark

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

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update config options to resepect [RFC0019](https://github.com/withastro/rfcs/blob/main/proposals/0019-config-finalization.md)

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
