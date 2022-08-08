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

<details>
  <summary>Quick Install</summary>

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

  ```sh
  # Using NPM
  npx astro add mdx
  # Using Yarn
  yarn astro add mdx
  # Using PNPM
  pnpx astro add mdx
  ```

Then, restart the dev server by typing `CTRL-C` and then `npm run astro dev` in the terminal window that was running Astro.

Because this command is new, it might not properly set things up. If that happens, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.
</details>

<details>
  <summary>Manual Install</summary>

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
</details>

## Usage

To write your first MDX page in Astro, head to our [UI framework documentation][astro-ui-frameworks]. You'll explore:
- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🪆 opportunities to mix and nest frameworks together

[**Client Directives**](https://docs.astro.build/en/reference/directives-reference/#client-directives) are still required in `.mdx` files.

> **Note**: `.mdx` files adhere to strict JSX syntax rather than Astro's HTML-like syntax.

Also check our [Astro Integration Documentation][astro-integration] for more on integrations.

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

Astro also supports YAML-based frontmatter out-of-the-box using the [remark-mdx-frontmatter](https://github.com/remcohaszing/remark-mdx-frontmatter) plugin. By default, all variables declared in a frontmatter fence (`---`) will be accessible via the `frontmatter` export. See the `frontmatterOptions` configuration to customize this behavior.

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

### Layouts

Layouts can be applied [in the same way as standard Astro Markdown](https://docs.astro.build/en/guides/markdown-content/#markdown-layouts). You can add a `layout` to [your frontmatter](#frontmatter) like so:

```yaml
---
layout: '../layouts/BaseLayout.astro' 
title: 'My Blog Post'
---
```

Then, you can retrieve all other frontmatter properties from your layout via the `content` property, and render your MDX using the default [`<slot />`](https://docs.astro.build/en/core-concepts/astro-components/#slots):

```astro
---
// src/layouts/BaseLayout.astro
const { content } = Astro.props;
---
<html>
  <head>
    <title>{content.title}</title>
  </head>
  <body>
    <h1>{content.title}</h1>
    <!-- Rendered MDX will be passed into the default slot. -->
    <slot />
  </body>
</html>
```

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

### Syntax highlighting

The MDX integration respects [your project's `markdown.syntaxHighlight` configuration](https://docs.astro.build/en/guides/markdown-content/#syntax-highlighting).

We will highlight your code blocks with [Shiki](https://github.com/shikijs/shiki) by default [using Shiki twoslash](https://shikijs.github.io/twoslash/). You can customize [this remark plugin](https://www.npmjs.com/package/remark-shiki-twoslash) using the `markdown.shikiConfig` option in your `astro.config`. For example, you can apply a different built-in theme like so:

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

## Configuration

<details>
  <summary><strong>remarkPlugins</strong></summary>

**Default plugins:** [remark-gfm](https://github.com/remarkjs/remark-gfm), [remark-smartypants](https://github.com/silvenon/remark-smartypants)

[Remark plugins](https://github.com/remarkjs/remark/blob/main/doc/plugins.md) allow you to extend your Markdown with new capabilities. This includes [auto-generating a table of contents](https://github.com/remarkjs/remark-toc), [applying accessible emoji labels](https://github.com/florianeckerstorfer/remark-a11y-emoji), and more. We encourage you to browse [awesome-remark](https://github.com/remarkjs/awesome-remark) for a full curated list!

We apply [GitHub-flavored Markdown](https://github.com/remarkjs/remark-gfm) and [Smartypants](https://github.com/silvenon/remark-smartypants) by default. This brings some niceties like auto-generating clickable links from text (ex. `https://example.com`) and formatting quotes for readability. When applying your own plugins, you can choose to preserve or remove these defaults.

To apply plugins _while preserving_ Astro's default plugins, use a nested `extends` object like so:

```js
// astro.config.mjs
import remarkToc from 'remark-toc';

export default {
  integrations: [mdx({
    // apply remark-toc alongside GitHub-flavored markdown and Smartypants
    remarkPlugins: { extends: [remarkToc] },
  })],
}
```

To apply plugins _without_ Astro's defaults, you can apply a plain array:

```js
// astro.config.mjs
import remarkToc from 'remark-toc';

export default {
  integrations: [mdx({
    // apply remark-toc alone, removing other defaults
    remarkPlugins: [remarkToc],
  })],
}
```

</details>

<details>
  <summary><strong>rehypePlugins</strong></summary>

[Rehype plugins](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md) allow you to transform the HTML that your Markdown generates. We recommend checking the [Remark plugin](https://github.com/remarkjs/remark/blob/main/doc/plugins.md) catalog first _before_ considering rehype plugins, since most users want to transform their Markdown syntax instead. If HTML transforms are what you need, we encourage you to browse [awesome-rehype](https://github.com/rehypejs/awesome-rehype) for a full curated list of plugins!

We apply our own (non-overridable) [`collect-headings`](https://github.com/withastro/astro/blob/main/packages/integrations/mdx/src/rehype-collect-headings.ts) plugin. This applies IDs to all headings (i.e. `h1 -> h6`) in your MDX files to [link to headings via anchor tags](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#linking_to_an_element_on_the_same_page).

To apply additional rehype plugins, pass an array to the `rehypePlugins` option like so:

```js
// astro.config.mjs
import rehypeMinifyHtml from 'rehype-minify';

export default {
  integrations: [mdx({
    rehypePlugins: [rehypeMinifyHtml],
  })],
}
```
</details>

<details>
  <summary><strong>frontmatterOptions</strong></summary>

**Default:** `{ name: 'frontmatter' }`

We use [remark-mdx-frontmatter](https://github.com/remcohaszing/remark-mdx-frontmatter) to parse YAML-based frontmatter in your MDX files. If you want to override our default configuration or extend remark-mdx-frontmatter (ex. to [apply a custom frontmatter parser](https://github.com/remcohaszing/remark-mdx-frontmatter#parsers)), you can supply a `frontmatterOptions` configuration.

For example, say you want to access frontmatter as root-level variables without a nested `frontmatter` object. You can override the [`name` configuration option](https://github.com/remcohaszing/remark-mdx-frontmatter#name) like so:

```js
// astro.config.mjs
export default {
  integrations: [mdx({
    frontmatterOptions: {
      name: '',
    }
  })],
}
```

```mdx
---
title: I'm just a variable now!
---

# {title}
```

See the [remark-mdx-frontmatter README](https://github.com/remcohaszing/remark-mdx-frontmatter#options) for a complete list of options.
</details>

## Examples

- The [Astro MDX example](https://github.com/withastro/astro/tree/latest/examples/with-mdx) shows how to use MDX files in your Astro project.

## Troubleshooting

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
