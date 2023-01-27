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

__`astro.config.mjs`__

```js ins={2} "mdx()"
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
"files.associations": {
    "*.mdx": "markdown"
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

### Options inherited from Markdown config

All [`markdown` configuration options](https://docs.astro.build/en/reference/configuration-reference/#markdown-options) except `drafts` can be configured separately in the MDX integration. This includes remark and rehype plugins, syntax highlighting, and more. Options will default to those in your Markdown config ([see the `extendMarkdownConfig` option](#extendmarkdownconfig) to modify this).

:::note
There is no separate MDX configuration for [including pages marked as draft in the build](https://docs.astro.build/en/reference/configuration-reference/#markdowndrafts). This Markdown setting will be respected by both Markdown and MDX files and cannot be overridden for MDX files specifically.
:::

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkToc from 'remark-toc';
import rehypeMinifyHtml from 'rehype-minify-html';

export default defineConfig({
  integrations: [
    mdx({
      remarkPlugins: [exampleRemarkPlugin],
    }),
  ],
});
```

…every MDX file will have `customProperty` in its frontmatter! See [our Markdown documentation](https://docs.astro.build/en/guides/markdown-content/#example-injecting-frontmatter) for more usage instructions and a [reading time plugin example](https://docs.astro.build/en/guides/markdown-content/#example-calculate-reading-time).

### Layouts
Layouts can be applied [in the same way as standard Astro Markdown](https://docs.astro.build/en/guides/markdown-content/#frontmatter-layout). You can add a `layout` to [your frontmatter](#frontmatter) like so:

```yaml
---
layout: '../layouts/BaseLayout.astro' 
title: 'My Blog Post'
---
```

Then, you can retrieve all other frontmatter properties from your layout via the `frontmatter` property, and render your MDX using the default [`<slot />`](https://docs.astro.build/en/core-concepts/astro-components/#slots). See [layout props](#layout-props) for a complete list of props available.

```astro title="src/layouts/BaseLayout.astro"
---
const { frontmatter, url } = Astro.props;
---
<html>
  <head>
    <meta rel="canonical" href={new URL(url, Astro.site).pathname}>
    <title>{frontmatter.title}</title>
  </head>
  <body>
    <h1>{frontmatter.title}</h1>
    <!-- Rendered MDX will be passed into the default slot. -->
    <slot />
  </body>
</html>
```

You can set a layout’s [`Props` type](/en/guides/typescript/#component-props) with the `MDXLayoutProps` helper.

:::note
`MDXLayoutProps` is the same as the `MarkdownLayoutProps` utility type with `rawContent()` and `compiledContent()` removed (since these are not available for `.mdx` files). Feel free to **use `MarkdownLayoutProps` instead** when sharing a layout across `.md` and `.mdx` files.
:::

📚 See the [Markdown Options reference](https://docs.astro.build/en/reference/configuration-reference/#markdown-options) for a complete list of options.

### `extendMarkdownConfig`

- **Type:** `boolean`
- **Default:** `true`

MDX will extend [your project's existing Markdown configuration](https://docs.astro.build/en/reference/configuration-reference/#markdown-options) by default. To override individual options, you can specify their equivalent in your MDX configuration.

For example, say you need to disable GitHub-Flavored Markdown and apply a different set of remark plugins for MDX files. You can apply these options like so, with `extendMarkdownConfig` enabled by default:

```html
<blockquote>
  <p>A blockquote with <em>some</em> emphasis.</p>
</blockquote>
```

But what if you want to specify your own markup for these blockquotes? In the above example, you could create a custom `<Blockquote />` component (in any language) that either has a `<slot />` component or accepts a `children` prop.

```astro title="src/components/Blockquote.astro"
---
const props = Astro.props;
---

<blockquote {...props} class="bg-blue-50 p-4">
  <span class="text-4xl text-blue-600 mb-2">“</span>
  <slot />
</blockquote>
```

Then in the MDX file you import the component and export it to the `components` export.

```mdx title="src/pages/posts/post-1.mdx" {2}
import Blockquote from '../components/Blockquote.astro';
export const components = { blockquote: Blockquote };
```

Now, writing the standard Markdown blockquote syntax (`>`) will use your custom `<Blockquote />` component instead. No need to use a component in Markdown, or write a remark/rehype plugin! Visit the [MDX website](https://mdxjs.com/table-of-components/) for a full list of HTML elements that can be overwritten as custom components.

#### Custom components with imported `mdx`

When rendering imported MDX content, custom components can be passed via the `components` prop.

Note: An MDX file's exported components will _not_ be used unless you manually import and pass them via the `components` property. See the example below:

```astro title="src/pages/page.astro" "components={{...components, h1: Heading }}"
---
import { Content, components } from '../content.mdx';
import Heading from '../Heading.astro';
---

<Content components={{...components, h1: Heading }} />
```

### Syntax highlighting

The MDX integration respects [your project's `markdown.syntaxHighlight` configuration](https://docs.astro.build/en/guides/markdown-content/#syntax-highlighting).

We will highlight your code blocks with [Shiki](https://github.com/shikijs/shiki) by default. You can customize this highlighter using the `markdown.shikiConfig` option in your `astro.config`. For example, you can apply a different built-in theme like so:

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'dracula',
    },
  },
  integrations: [mdx()],
});
```

Visit [our Shiki configuration docs](https://docs.astro.build/en/guides/markdown-content/#shiki-configuration) for more on using Shiki with Astro.

#### Switch to Prism

You can also use the [Prism](https://prismjs.com/) syntax highlighter by setting `markdown.syntaxHighlight` to `'prism'` in your `astro.config` like so:

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  markdown: {
    syntaxHighlight: 'prism',
    remarkPlugins: [remarkPlugin1],
    gfm: true,
  },
  integrations: [mdx()],
});
```

This applies a minimal Prism renderer with added support for `astro` code blocks. Visit [our "Prism configuration" docs](https://docs.astro.build/en/guides/markdown-content/#prism-configuration) for more on using Prism with Astro.

#### Switch to a custom syntax highlighter

You may want to apply your own syntax highlighter too. If your highlighter offers a remark or rehype plugin, you can flip off our syntax highlighting by setting `markdown.syntaxHighlight: false` and wiring up your plugin. For example, say you want to apply [Shiki Twoslash's remark plugin](https://www.npmjs.com/package/remark-shiki-twoslash):

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import shikiTwoslash from 'remark-shiki-twoslash';

export default defineConfig({
  markdown: {
    syntaxHighlight: false,
  },
  integrations: [
    mdx({
      remarkPlugins: [shikiTwoslash, { /* Shiki Twoslash config */ }],
    })
  ],
});
```

## Configuration

### remarkPlugins

[Remark plugins](https://github.com/remarkjs/remark/blob/main/doc/plugins.md) allow you to extend your Markdown with new capabilities. This includes [auto-generating a table of contents](https://github.com/remarkjs/remark-toc), [applying accessible emoji labels](https://github.com/florianeckerstorfer/remark-a11y-emoji), and more. We encourage you to browse [awesome-remark](https://github.com/remarkjs/awesome-remark) for a full curated list!

This example applies the [`remark-toc`](https://github.com/remarkjs/remark-toc) plugin to `.mdx` files. To customize plugin inheritance from your Markdown config or Astro's defaults, [see the `extendPlugins` option](#extendplugins).

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkToc from 'remark-toc';

export default defineConfig({
  integrations: [mdx({
    remarkPlugins: [remarkToc],
  })],
});
```

### rehypePlugins

[Rehype plugins](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md) allow you to transform the HTML that your Markdown generates. We encourage you to browse [awesome-rehype](https://github.com/rehypejs/awesome-rehype) for a full curated list of plugins!

We apply our own (non-removable) [`collect-headings`](https://github.com/withastro/astro/blob/main/packages/integrations/mdx/src/rehype-collect-headings.ts) plugin. This applies IDs to all headings (i.e. `h1 -> h6`) in your MDX files to [link to headings via anchor tags](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#linking_to_an_element_on_the_same_page).

This example applies the [`rehype-minify`](https://github.com/rehypejs/rehype-minify) plugin to `.mdx` files. To customize plugin inheritance from your Markdown config or Astro's defaults, [see the `extendPlugins` option](#extendplugins).

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import rehypeMinifyHtml from 'rehype-minify';

export default defineConfig({
  integrations: [mdx({
    rehypePlugins: [rehypeMinifyHtml],
  })],
});
```

### extendPlugins

**Type:** `'markdown' | 'astroDefaults' | false`

**Default:** `'markdown'`

#### `markdown` (default)

By default, Astro inherits all [remark](#remarkplugins) and [rehype](#rehypeplugins) plugins from [the `markdown` option in your Astro config](https://docs.astro.build/en/guides/markdown-content/#markdown-plugins). This also respects the [`markdown.extendDefaultPlugins`](https://docs.astro.build/en/reference/configuration-reference/#markdownextenddefaultplugins) option to extend Astro's defaults. Any additional plugins you apply in your MDX config will be applied _after_ your configured Markdown plugins.

This example applies [`remark-toc`](https://github.com/remarkjs/remark-toc) to Markdown _and_ MDX, and [`rehype-minify`](https://github.com/rehypejs/rehype-minify) to MDX alone:

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkToc from 'remark-toc';
import rehypeMinify from 'rehype-minify';

export default defineConfig({
  markdown: {
    // Applied to .md and .mdx files
    remarkPlugins: [remarkToc],
  },
  integrations: [mdx({
    // Applied to .mdx files only
    rehypePlugins: [rehypeMinify],
  })],
});
```

You may also need to disable `markdown` config extension in MDX. For this, set `extendMarkdownConfig` to `false`:

__`astro.config.mjs`__

```js "extendPlugins: 'astroDefaults'"
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkToc from 'remark-toc';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkPlugin1],
  },
  integrations: [mdx({
    remarkPlugins: [remarkToc],
    // Astro defaults applied
    extendPlugins: 'astroDefaults',
  })],
});
```

#### `false`

If you don't want to extend any plugins, set `extendPlugins` to `false`:

__`astro.config.mjs`__

```js "extendPlugins: false"
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkToc from 'remark-toc';

export default defineConfig({
  integrations: [mdx({
    remarkPlugins: [remarkToc],
    // Astro defaults not applied
    extendPlugins: false,
  })],
});
```

### `recmaPlugins`

These are plugins that modify the output [estree](https://github.com/estree/estree) directly. This is useful for modifying or injecting JavaScript variables in your MDX files.

We suggest [using AST Explorer](https://astexplorer.net/) to play with estree outputs, and trying [`estree-util-visit`](https://unifiedjs.com/explore/package/estree-util-visit/) for searching across JavaScript nodes.

### remarkRehype

Markdown content is transformed into HTML through remark-rehype which has [a number of options](https://github.com/remarkjs/remark-rehype#options).

You can use remark-rehype options in your MDX integration config file like so:

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [mdx({
    remarkRehype: {
      footnoteLabel: 'Catatan kaki',
      footnoteBackLabel: 'Kembali ke konten',
    },
  })],
});
```

This inherits the configuration of `markdown.remarkRehype`. This behavior can be changed by configuring `extendPlugins`.

## Examples

*   The [Astro MDX starter template](https://github.com/withastro/astro/tree/latest/examples/with-mdx) shows how to use MDX files in your Astro project.

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](https://github.com/withastro/astro/tree/main/packages/integrations/mdx/CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/

[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
