---
'astro': major
'@astrojs/markdown-remark': major
'@astrojs/mdx': minor
---

Refine Markdown and MDX configuration options for ease-of-use.

## Markdown

- **Remove `remark-smartypants`** from Astro's default Markdown plugins.
- **Replace the `extendDefaultPlugins` option** with a simplified `githubFlavoredMarkdown` boolean. This is enabled by default, and can be disabled to remove GFM.
- Ensure GitHub-Flavored Markdown is applied whether or not custom `remarkPlugins` or `rehypePlugins` are configured. If you want to apply custom plugins _and_ remove GFM, manually set `githubFlavoredMarkdown: false` in your config.

## MDX

- Support _all_ Markdown configuration options (except `drafts`) from your MDX integration config. This includes `syntaxHighlighting` and `shikiConfig` options to further customize the MDX renderer.
- Simplify `extendDefaults` to an `extendMarkdownConfig` option. MDX options will default to their equivalent in your Markdown config. By setting `extendMarkdownConfig` to false, you can "eject" to set your own syntax highlighting, plugins, and more.

## Migration

To preserve your existing Markdown and MDX setup, you may need some configuration changes:

### Smartypants manual installation

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

### Migrate `extendDefaultPlugins` to `githubFlavoredMarkdown`

You may have disabled Astro's built-in plugins (GitHub-Flavored Markdown and Smartypants) with the `extendDefaultPlugins` option. Since Smartypants has been removed, this has been renamed to `githubFlavoredMarkdown`.

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
-   extendDefaultPlugins: false,
+   githubFlavoredMarkdown: false,
  }
});
```


Additionally, applying remark and rehype plugins **no longer disables** `githubFlavoredMarkdown`. You will need to opt-out manually by setting `githubFlavoredMarkdown` to `false`.

### Migrate MDX's `extendPlugins` to `extendMarkdownConfig`

You may have used the `extendPlugins` option to manage plugin defaults in MDX. This has been replaced by 2 flags:
- `extendMarkdownConfig` (`true` by default) to toggle Markdown config inheritance. This replaces the `extendPlugins: 'markdown'` option.
- `githubFlavoredMarkdown` (`true` by default) to toggle GitHub-Flavored Markdown in MDX. This replaces the `extendPlugins: 'defaults'` option.
