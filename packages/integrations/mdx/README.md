# @astrojs/mdx 📝

This **[Astro integration][astro-integration]** enables the usage of [MDX](https://mdxjs.com/) components and allows you to create pages as `.mdx` files.

- <strong>[Why MDX?](#why-mdx)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why MDX?

MDX allows you to [use variables, JSX expressions and components within Markdown content](https://docs.astro.build/en/guides/markdown-content/#mdx-only-features) in Astro. If you have existing content authored in MDX, this integration allows you to bring those files to your Astro project.

## Installation

### Quick Install

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

```sh
# Using NPM
npx astro add mdx
# Using Yarn
yarn astro add mdx
# Using PNPM
pnpm astro add mdx
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Manual Install

First, install the `@astrojs/mdx` package using your package manager. If you're using npm or aren't sure, run this in the terminal:

```sh
npm install @astrojs/mdx
```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:

```js ins={3} "mdx()"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  // ...
  integrations: [mdx()],
});
```

### Editor Integration

[VS Code](https://code.visualstudio.com/) supports Markdown by default. However, for MDX editor support, you may wish to add the following setting in your VSCode config. This ensures authoring MDX files provides a Markdown-like editor experience.

```json title=".vscode/settings.json"
{
  "files.associations": {
    "*.mdx": "markdown"
  }
}
```

## Usage

With the Astro MDX integration, you can [add MDX pages to your project](https://docs.astro.build/en/guides/markdown-content/#markdown-and-mdx-pages) by adding `.mdx` files within your `src/pages/` directory. You can also [import `.mdx` files](https://docs.astro.build/en/guides/markdown-content/#importing-markdown) into `.astro` files.

Astro's MDX integration adds extra features to standard MDX, including Markdown-style frontmatter. This allows you to use most of Astro's built-in Markdown features like a [special frontmatter `layout` property](https://docs.astro.build/en/guides/markdown-content/#frontmatter-layout) and a [property for marking a page as a draft](https://docs.astro.build/en/guides/markdown-content/#draft-pages).

See how MDX works in Astro with examples in our [Markdown & MDX guide](https://docs.astro.build/en/guides/markdown-content/).

Visit the [MDX docs](https://mdxjs.com/docs/what-is-mdx/) to learn about using standard MDX features.

## Configuration

Once the MDX integration is installed, no configuration is necessary to use `.mdx` files in your Astro project.

You can configure how your MDX is rendered with the following options:

- [Options inherited from Markdown config](#options-inherited-from-markdown-config)
- [`extendMarkdownConfig`](#extendmarkdownconfig)
- [`recmaPlugins`](#recmaplugins)
- [`optimize`](#optimize)

### Options inherited from Markdown config

All [`markdown` configuration options](https://docs.astro.build/en/reference/configuration-reference/#markdown-options) except `drafts` can be configured separately in the MDX integration. This includes remark and rehype plugins, syntax highlighting, and more. Options will default to those in your Markdown config ([see the `extendMarkdownConfig` option](#extendmarkdownconfig) to modify this).

:::note
There is no separate MDX configuration for [including pages marked as draft in the build](https://docs.astro.build/en/reference/configuration-reference/#markdowndrafts). This Markdown setting will be respected by both Markdown and MDX files and cannot be overridden for MDX files specifically.
:::

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkToc from 'remark-toc';
import rehypeMinifyHtml from 'rehype-minify-html';

export default defineConfig({
  integrations: [
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: { theme: 'dracula' },
      remarkPlugins: [remarkToc],
      rehypePlugins: [rehypeMinifyHtml],
      remarkRehype: { footnoteLabel: 'Footnotes' },
      gfm: false,
    }),
  ],
});
```

:::caution
MDX does not support passing remark and rehype plugins as a string. You should install, import, and apply the plugin function instead.
:::

📚 See the [Markdown Options reference](https://docs.astro.build/en/reference/configuration-reference/#markdown-options) for a complete list of options.

### `extendMarkdownConfig`

- **Type:** `boolean`
- **Default:** `true`

MDX will extend [your project's existing Markdown configuration](https://docs.astro.build/en/reference/configuration-reference/#markdown-options) by default. To override individual options, you can specify their equivalent in your MDX configuration.

For example, say you need to disable GitHub-Flavored Markdown and apply a different set of remark plugins for MDX files. You can apply these options like so, with `extendMarkdownConfig` enabled by default:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  markdown: {
    syntaxHighlight: 'prism',
    remarkPlugins: [remarkPlugin1],
    gfm: true,
  },
  integrations: [
    mdx({
      // `syntaxHighlight` inherited from Markdown

      // Markdown `remarkPlugins` ignored,
      // only `remarkPlugin2` applied.
      remarkPlugins: [remarkPlugin2],
      // `gfm` overridden to `false`
      gfm: false,
    }),
  ],
});
```

You may also need to disable `markdown` config extension in MDX. For this, set `extendMarkdownConfig` to `false`:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkPlugin1],
  },
  integrations: [
    mdx({
      // Markdown config now ignored
      extendMarkdownConfig: false,
      // No `remarkPlugins` applied
    }),
  ],
});
```

### `recmaPlugins`

These are plugins that modify the output [estree](https://github.com/estree/estree) directly. This is useful for modifying or injecting JavaScript variables in your MDX files.

We suggest [using AST Explorer](https://astexplorer.net/) to play with estree outputs, and trying [`estree-util-visit`](https://unifiedjs.com/explore/package/estree-util-visit/) for searching across JavaScript nodes.

### `optimize`

- **Type:** `boolean | { customComponentNames?: string[] }`

This is an optional configuration setting to optimize the MDX output for faster builds and rendering via an internal rehype plugin. This may be useful if you have many MDX files and notice slow builds. However, this option may generate some unescaped HTML, so make sure your site's interactive parts still work correctly after enabling it.

This is disabled by default. To enable MDX optimization, add the following to your MDX integration configuration:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    mdx({
      optimize: true,
    }),
  ],
});
```

#### `customComponentNames`

- **Type:** `string[]`

An optional property of `optimize` to prevent the MDX optimizer from handling any [custom components passed to imported MDX content via the components prop](https://docs.astro.build/en/guides/markdown-content/#custom-components-with-imported-mdx).

You will need to exclude these components from optimization as the optimizer eagerly converts content into a static string, which will break custom components that needs to be dynamically rendered.

For example, the intended MDX output of the following is `<Heading>...</Heading>` in place of every `"<h1>...</h1>"`:

```astro
---
import { Content, components } from '../content.mdx';
import Heading from '../Heading.astro';
---

<Content components={{ ...components, h1: Heading }} />
```

To configure optimization for this using the `customComponentNames` property, specify an array of HTML element names that should be treated as custom components:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    mdx({
      optimize: {
        // Prevent the optimizer from handling `h1` elements
        // These will be treated as custom components
        customComponentNames: ['h1'],
      },
    }),
  ],
});
```

Note that if your MDX file [configures custom components using `export const components = { ... }`](https://docs.astro.build/en/guides/markdown-content/#assigning-custom-components-to-html-elements), then you do not need to manually configure this option. The optimizer will automatically detect them.

## Examples

- The [Astro MDX starter template](https://github.com/withastro/astro/tree/latest/examples/with-mdx) shows how to use MDX files in your Astro project.

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](https://github.com/withastro/astro/tree/main/packages/integrations/mdx/CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
