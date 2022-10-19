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

MDX is the defacto solution for embedding components, such as interactive charts or alerts, within Markdown content. If you have existing content authored in MDX, this integration makes migrating to Astro a breeze.

**Want to learn more about MDX before using this integration?**  
Check out [“What is MDX?”](https://mdxjs.com/docs/what-is-mdx/), a deep-dive on the MDX format.

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

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  // ...
  integrations: [mdx()],
});
```

Finally, restart the dev server.

### Editor Integration

[VS Code](https://code.visualstudio.com/) supports Markdown by default. However, for MDX editor support, you may wish to add the following setting in your VSCode config. This ensures authoring MDX files provides a Markdown-like editor experience.

```json title=".vscode/settings.json"
"files.associations": {
    "*.mdx": "markdown"
}
```

## Usage

You can [add MDX pages to your project](https://docs.astro.build/en/guides/markdown-content/#markdown-and-mdx-pages) by adding `.mdx` files within your `src/pages/` directory. 

### Components

To use components in your MDX pages in Astro, head to our [UI framework documentation][astro-ui-frameworks]. You'll explore:
- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🤝 opportunities to mix and nest frameworks together

[**Client Directives**](https://docs.astro.build/en/reference/directives-reference/#client-directives) are still required in `.mdx` files.

> **Note**: `.mdx` files adhere to strict JSX syntax rather than Astro's HTML-like syntax.

### Variables

MDX supports `export` statements to add variables to your templates. These variables are accessible both from the template itself _and_ as named properties when importing the template somewhere else.

For instance, you can export a `title` field from an MDX page or component to use as a heading with `{JSX expressions}`:

```mdx
export const title = 'My first MDX post'

# {title}
```

This `title` will be accessible from `import` and [glob](https://docs.astro.build/en/reference/api-reference/#astroglob) statements as well:

```astro
---
// src/pages/index.astro
const posts = await Astro.glob('./*.mdx');
---

{posts.map(post => <p>{post.title}</p>)}
```

See [the official "how MDX works" guide](https://mdxjs.com/docs/using-mdx/#how-mdx-works) for more on MDX variables.

### Exported properties

Alongside your [MDX variable exports](#variables), we generate a few helpful exports as well. These are accessible when importing an MDX file via `import` statements or [`Astro.glob`](https://docs.astro.build/en/reference/api-reference/#astroglob).

#### `file`

The absolute path to the MDX file (e.g. `home/user/projects/.../file.md`).

#### `url`

The browser-ready URL for MDX files under `src/pages/`. For example, `src/pages/en/about.mdx` will provide a `url` of `/en/about/`. For MDX files outside of `src/pages`, `url` will be `undefined`.

#### `getHeadings()`

**Returns:** `{ depth: number; slug: string; text: string }[]`

A function that returns an array of all headings (i.e. `h1 -> h6` elements) in the MDX file. Each heading’s `slug` corresponds to the generated ID for a given heading and can be used for anchor links.

### Frontmatter

Astro also supports YAML-based frontmatter out-of-the-box. By default, all variables declared in a frontmatter fence (`---`) will be accessible via the `frontmatter` export.

For example, we can add a `title` and `publishDate` to an MDX page or component like so:

```mdx
---
title: 'My first MDX post'
publishDate: '21 September 2022'
---

# {frontmatter.title}
```

Now, this `title` and `publishDate` will be accessible from `import` and [glob](https://docs.astro.build/en/reference/api-reference/#astroglob) statements via the `frontmatter` property. This matches the behavior of [plain markdown in Astro](https://docs.astro.build/en/reference/api-reference/#markdown-files) as well!

```astro
---
// src/pages/index.astro
const posts = await Astro.glob('./*.mdx');
---

{posts.map(post => (
  <Fragment>
    <h2>{post.frontmatter.title}</h2>
    <time>{post.frontmatter.publishDate}</time>
  </Fragment>
))}
```

### Inject frontmatter via remark or rehype plugins

You may want to inject frontmatter properties across all of your MDX files. By using a [remark](#remarkPlugins) or [rehype](#remarkplugins) plugin, you can generate these properties based on a file’s contents.

You can append to the `data.astro.frontmatter` property from your plugin’s `file` argument like so:

```js
// example-remark-plugin.mjs
export function exampleRemarkPlugin() {
  // All remark and rehype plugins return a separate function
  return function (tree, file) {
    file.data.astro.frontmatter.customProperty = 'Generated property';
  }
}
```

After applying this plugin to your MDX integration config:

```js
// astro.config.mjs
import mdx from '@astrojs/mdx';
import { exampleRemarkPlugin } from './example-remark-plugin.mjs';

export default {
  integrations: [
    mdx({
      remarkPlugins: [exampleRemarkPlugin],
    }),
  ],
};
```

…every MDX file will have `customProperty` in its frontmatter! See [our Markdown documentation](https://docs.astro.build/en/guides/markdown-content/#injecting-frontmatter) for more usage instructions and a [reading time plugin example](https://docs.astro.build/en/guides/markdown-content/#example-calculate-reading-time).

### Layouts

Layouts can be applied [in the same way as standard Astro Markdown](https://docs.astro.build/en/guides/markdown-content/#markdown-layouts). You can add a `layout` to [your frontmatter](#frontmatter) like so:

```yaml
---
layout: '../layouts/BaseLayout.astro' 
title: 'My Blog Post'
---
```

Then, you can retrieve all other frontmatter properties from your layout via the `frontmatter` property, and render your MDX using the default [`<slot />`](https://docs.astro.build/en/core-concepts/astro-components/#slots). See [layout props](#layout-props) for a complete list of props available.

```astro
---
// src/layouts/BaseLayout.astro
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

```astro ins={2,4-9}
---
// src/layouts/BaseLayout.astro
import type { MDXLayoutProps } from 'astro';

type Props = MDXLayoutProps<{
  // Define frontmatter props here
  title: string;
  author: string;
  date: string;
}>;

// Now, `frontmatter`, `url`, and other MDX layout properties
// are accessible with type safety
const { frontmatter, url } = Astro.props;
---
<html>
  <head>
    <meta rel="canonical" href={new URL(url, Astro.site).pathname}>
    <title>{frontmatter.title}</title>
  </head>
  <body>
    <h1>{frontmatter.title}</h1>
    <slot />
  </body>
</html>
```

#### Layout props

All [exported properties](#exported-properties) are available from `Astro.props` in your layout, **with two key differences:**
- Heading information (i.e. `h1 -> h6` elements) is available via the `headings` array, rather than a `getHeadings()` function.
- `file` and `url` are _also_ available as nested `frontmatter` properties (i.e. `frontmatter.url` and `frontmatter.file`). This is consistent with Astro's Markdown layout properties.

Astro recommends using the `MDXLayoutProps` type (see previous section) to explore all available properties.

#### Importing layouts manually

You may need to pass information to your layouts that does not (or cannot) exist in your frontmatter. In this case, you can import and use a [`<Layout />` component](https://docs.astro.build/en/core-concepts/layouts/) like any other component:

```mdx
---
// src/pages/posts/first-post.mdx

title: 'My first MDX post'
publishDate: '21 September 2022'
---
import BaseLayout from '../layouts/BaseLayout.astro';

function fancyJsHelper() {
  return "Try doing that with YAML!";
}

<BaseLayout title={frontmatter.title} fancyJsHelper={fancyJsHelper}>
  Welcome to my new Astro blog, using MDX!
</BaseLayout>
```
Then, your values are available to you through `Astro.props` in your layout, and your MDX content will be injected into the page where your `<slot />` component is written:

```astro
---
// src/layouts/BaseLayout.astro
const { title, fancyJsHelper } = Astro.props;
---
<!-- -->
<h1>{title}</h1>
<slot />
<p>{fancyJsHelper()}</p>
<!-- -->
```

### Custom components

Under the hood, MDX will convert Markdown into HTML components. For example, this blockquote:

```md
> A blockquote with *some* emphasis.
```

will be converted into this HTML:

```html
<blockquote>
  <p>A blockquote with <em>some</em> emphasis.</p>
</blockquote>
```

But what if you want to specify your own markup for these blockquotes? In the above example, you could create a custom `<Blockquote />` component (in any language) that either has a `<slot />` component or accepts a `children` prop.

```astro title="src/components/Blockquote.astro"
<blockquote class="bg-blue-50 p-4">
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

When rendering imported MDX content, custom components can also be passed via the `components` prop:

```astro title="src/pages/page.astro" "components={{ h1: Heading }}"
---
import Content from '../content.mdx';
import Heading from '../Heading.astro';
---

<Content components={{ h1: Heading }} />
```

### Syntax highlighting

The MDX integration respects [your project's `markdown.syntaxHighlight` configuration](https://docs.astro.build/en/guides/markdown-content/#syntax-highlighting).

We will highlight your code blocks with [Shiki](https://github.com/shikijs/shiki) by default. You can customize this highlighter using the `markdown.shikiConfig` option in your `astro.config`. For example, you can apply a different built-in theme like so:

```js
// astro.config.mjs
export default {
  markdown: {
    shikiConfig: {
      theme: 'dracula',
    },
  },
  integrations: [mdx()],
}
```

Visit [our Shiki configuration docs](https://docs.astro.build/en/guides/markdown-content/#shiki-configuration) for more on using Shiki with Astro.

#### Switch to Prism

You can also use the [Prism](https://prismjs.com/) syntax highlighter by setting `markdown.syntaxHighlight` to `'prism'` in your `astro.config` like so:

```js
// astro.config.mjs
export default {
  markdown: {
    syntaxHighlight: 'prism',
  },
  integrations: [mdx()],
}
```

This applies a minimal Prism renderer with added support for `astro` code blocks. Visit [our "Prism configuration" docs](https://docs.astro.build/en/guides/markdown-content/#prism-configuration) for more on using Prism with Astro.

#### Switch to a custom syntax highlighter

You may want to apply your own syntax highlighter too. If your highlighter offers a remark or rehype plugin, you can flip off our syntax highlighting by setting `markdown.syntaxHighlight: false` and wiring up your plugin. For example, say you want to apply [Shiki Twoslash's remark plugin](https://www.npmjs.com/package/remark-shiki-twoslash):

```js
// astro.config.mjs
import shikiTwoslash from 'remark-shiki-twoslash';

export default {
  markdown: {
  syntaxHighlight: false,
  },
  integrations: [mdx({
    remarkPlugins: [shikiTwoslash, { /* Shiki Twoslash config */ }],
  })],
```

## Configuration

### remarkPlugins

[Remark plugins](https://github.com/remarkjs/remark/blob/main/doc/plugins.md) allow you to extend your Markdown with new capabilities. This includes [auto-generating a table of contents](https://github.com/remarkjs/remark-toc), [applying accessible emoji labels](https://github.com/florianeckerstorfer/remark-a11y-emoji), and more. We encourage you to browse [awesome-remark](https://github.com/remarkjs/awesome-remark) for a full curated list!

This example applies the [`remark-toc`](https://github.com/remarkjs/remark-toc) plugin to `.mdx` files. To customize plugin inheritance from your Markdown config or Astro's defaults, [see the `extendPlugins` option](#extendPlugins).

```js
// astro.config.mjs
import remarkToc from 'remark-toc';

export default {
  integrations: [mdx({
    remarkPlugins: [remarkToc],
  })],
}
```

### rehypePlugins

[Rehype plugins](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md) allow you to transform the HTML that your Markdown generates. We encourage you to browse [awesome-rehype](https://github.com/rehypejs/awesome-rehype) for a full curated list of plugins!

We apply our own (non-removable) [`collect-headings`](https://github.com/withastro/astro/blob/main/packages/integrations/mdx/src/rehype-collect-headings.ts) plugin. This applies IDs to all headings (i.e. `h1 -> h6`) in your MDX files to [link to headings via anchor tags](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#linking_to_an_element_on_the_same_page).

This example applies the [`rehype-minify`](https://github.com/rehypejs/rehype-minify) plugin to `.mdx` files. To customize plugin inheritance from your Markdown config or Astro's defaults, [see the `extendPlugins` option](#extendPlugins).

```js
// astro.config.mjs
import rehypeMinifyHtml from 'rehype-minify';

export default {
  integrations: [mdx({
    rehypePlugins: [rehypeMinifyHtml],
  })],
}
```

### extendPlugins

**Type:** `'markdown' | 'astroDefaults' | false`

**Default:** `'markdown'`

#### `markdown` (default)

By default, Astro inherits all [remark](#remarkPlugins) and [rehype](#rehypePlugins) plugins from [the `markdown` option in your Astro config](https://docs.astro.build/en/guides/markdown-content/#markdown-plugins). This also respects the [`markdown.extendDefaultPlugins`](https://docs.astro.build/en/reference/configuration-reference/#markdownextenddefaultplugins) option to extend Astro's defaults. Any additional plugins you apply in your MDX config will be applied _after_ your configured Markdown plugins.

This example applies [`remark-toc`](https://github.com/remarkjs/remark-toc) to Markdown _and_ MDX, and [`rehype-minify`](https://github.com/rehypejs/rehype-minify) to MDX alone:

```js
// astro.config.mjs
import remarkToc from 'remark-toc';
import rehypeMinify from 'rehype-minify';

export default {
  markdown: {
    // Applied to .md and .mdx files
    remarkPlugins: [remarkToc],
  },
  integrations: [mdx({
    // Applied to .mdx files only
    rehypePlugins: [rehypeMinify],
  })],
}
```

#### `astroDefaults`

You may _only_ want to extend [Astro's default plugins](https://docs.astro.build/en/reference/configuration-reference/#markdownextenddefaultplugins) without inheriting your Markdown config. This example will apply the default [GitHub-Flavored Markdown](https://github.com/remarkjs/remark-gfm) and [Smartypants](https://github.com/silvenon/remark-smartypants) plugins alongside [`remark-toc`](https://github.com/remarkjs/remark-toc):

```js "extendPlugins: 'astroDefaults'"
// astro.config.mjs
import remarkToc from 'remark-toc';

export default {
  markdown: {
    remarkPlugins: [/** ignored */]
  },
  integrations: [mdx({
    remarkPlugins: [remarkToc],
    // Astro defaults applied
    extendPlugins: 'astroDefaults',
  })],
}
```

#### `false`

If you don't want to extend any plugins, set `extendPlugins` to `false`:

```js "extendPlugins: false"
// astro.config.mjs
import remarkToc from 'remark-toc';

export default {
  integrations: [mdx({
    remarkPlugins: [remarkToc],
    // Astro defaults not applied
    extendPlugins: false,
  })],
}
```

## Examples

- The [Astro MDX example](https://github.com/withastro/astro/tree/latest/examples/with-mdx) shows how to use MDX files in your Astro project.

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
