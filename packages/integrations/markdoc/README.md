# @astrojs/markdoc (experimental) 📝

This **[Astro integration][astro-integration]** enables the usage of [Markdoc](https://markdoc.dev/) to create components, pages, and content collection entries.

- <strong>[Why Markdoc?](#why-markdoc)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Markdoc?

Markdoc allows you to enhance your Markdown with [Astro components][astro-components]. If you have existing content authored in Markdoc, this integration allows you to bring those files to your Astro project using content collections.

## Installation

### Quick Install

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

```sh
# Using NPM
npx astro add markdoc
# Using Yarn
yarn astro add markdoc
# Using PNPM
pnpm astro add markdoc
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Manual Install

First, install the `@astrojs/markdoc` package using your package manager. If you're using npm or aren't sure, run this in the terminal:

```sh
npm install @astrojs/markdoc
```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__`astro.config.mjs`__

```js ins={2} "markdoc()"
import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';

export default defineConfig({
  // ...
  integrations: [markdoc()],
});
```


### Editor Integration

[VS Code](https://code.visualstudio.com/) supports Markdown by default. However, for Markdoc editor support, you may wish to add the following setting in your VSCode config. This ensures authoring Markdoc files provides a Markdown-like editor experience.

```json title=".vscode/settings.json"
"files.associations": {
    "*.mdoc": "markdown"
}
```

## Usage

Markdoc files can only be used within content collections. Add entries to any content collection using the `.mdoc` extension:

```sh
src/content/docs/
  why-markdoc.mdoc
  quick-start.mdoc
```

Then, query your collection using the [Content Collection APIs](https://docs.astro.build/en/guides/content-collections/#querying-collections):

```astro
---
import { getEntryBySlug } from 'astro:content';

const entry = await getEntryBySlug('docs', 'why-markdoc');
const { Content } = await entry.render();
---

<!--Access frontmatter properties with `data`-->
<h1>{entry.data.title}</h1>
<!--Render Markdoc contents with the Content component-->
<Content />
```

📚 See the [Astro Content Collection docs][astro-content-collections] for more information.

## Configuration

`@astrojs/markdoc` offers configuration options to use all of Markdoc's features and connect UI components to your content.

### Using components

You can add Astro components to your Markdoc using both [Markdoc tags][markdoc-tags] and HTML element [nodes][markdoc-nodes].

#### Render Markdoc tags as Astro components

You may configure [Markdoc tags][markdoc-tags] that map to components. You can configure a new tag by creating a `markdoc.config.mjs|ts` file at the root of your project and configuring the `tag` attribute.

This example renders an `Aside` component, and allows a `type` prop to be passed as a string:

```js
// markdoc.config.mjs
import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import Aside from './src/components/Aside.astro';

export default defineMarkdocConfig({
  tags: {
    aside: {
      render: Aside,
      attributes: {
      // Markdoc requires type defs for each attribute.
      // These should mirror the `Props` type of the component
      // you are rendering. 
      // See Markdoc's documentation on defining attributes
      // https://markdoc.dev/docs/attributes#defining-attributes
        type: { type: String },
      }
    },
  },
})
```

This component can now be used in your Markdoc files with the `{% aside %}` tag. Children will be passed to your component's default slot:

```md
# Welcome to Markdoc 👋

{% aside type="tip" %}

Use tags like this fancy "aside" to add some *flair* to your docs.

{% /aside %}
```

#### Render Markdoc nodes / HTML elements as Astro components

You may also want to map standard HTML elements like headings and paragraphs to components. For this, you can configure a custom [Markdoc node][markdoc-nodes]. This example overrides Markdoc's `heading` node to render a `Heading` component, and passes through Astro's default heading properties to define attributes and generate heading ids / slugs:

```js
// markdoc.config.mjs
import { defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';
import Heading from './src/components/Heading.astro';

export default defineMarkdocConfig({
  nodes: {
    heading: {
      render: Heading,
      ...nodes.heading,
    },
  },
})
```

All Markdown headings will render the `Heading.astro` component and pass `attributes` as component props. For headings, Astro provides the following attributes by default:

- `level: number` The heading level 1 - 6
- `id: string` An `id` generated from the heading's text contents. This corresponds to the `slug` generated by the [content `render()` function](https://docs.astro.build/en/guides/content-collections/#rendering-content-to-html).

For example, the heading `### Level 3 heading!` will pass `level: 3` and `id: 'level-3-heading'` as component props.

📚 [Find all of Markdoc's built-in nodes and node attributes on their documentation.](https://markdoc.dev/docs/nodes#built-in-nodes)

#### Use client-side UI components

Today, the `components` prop does not support the `client:` directive for hydrating components. To embed client-side components, create a wrapper `.astro` file to import your component and apply a `client:` directive manually.

This example wraps a `Aside.tsx` component with a `ClientAside.astro` wrapper:

```astro
---
// src/components/ClientAside.astro
import Aside from './Aside';
---

<Aside {...Astro.props} client:load />
```

This component can be passed to the `render` prop for any [tag][markdoc-tags] or [node][markdoc-nodes] in your config:

```js
// markdoc.config.mjs
import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import Aside from './src/components/Aside.astro';

export default defineMarkdocConfig({
  tags: {
    aside: {
      render: Aside,
      attributes: {
        type: { type: String },
      }
    },
  },
})
```

### Syntax highlighting

`@astrojs/markdoc` provides [Shiki](https://github.com/shikijs/shiki) and [Prism](https://github.com/PrismJS) extensions to highlight your code blocks.

#### Shiki

Apply the `shiki()` extension to your Markdoc config using the `extends` property. You can optionally pass a shiki configuration object:

```js
// markdoc.config.mjs
import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import shiki from '@astrojs/markdoc/shiki';

export default defineMarkdocConfig({
  extends: [
    shiki({
      // Choose from Shiki's built-in themes (or add your own)
      // Default: 'github-dark'
      // https://github.com/shikijs/shiki/blob/main/docs/themes.md
      theme: 'dracula',
      // Enable word wrap to prevent horizontal scrolling
      // Default: false
      wrap: true,
      // Pass custom languages
      // Note: Shiki has countless langs built-in, including `.astro`!
      // https://github.com/shikijs/shiki/blob/main/docs/languages.md
      langs: [],
    })
  ],
})
```

#### Prism

Apply the `prism()` extension to your Markdoc config using the `extends` property.

```js
// markdoc.config.mjs
import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import prism from '@astrojs/markdoc/prism';

export default defineMarkdocConfig({
  extends: [prism()],
})
```

📚 To learn about configuring Prism stylesheets, [see our syntax highlighting guide.](https://docs.astro.build/en/guides/markdown-content/#prism-configuration)

### Access frontmatter and content collection information from your templates

You can access content collection information from your Markdoc templates using the `$entry` variable. This includes the entry `slug`, `collection` name, and frontmatter `data` parsed by your content collection schema (if any). This example renders the `title` frontmatter property as a heading:

```md
---
title: Welcome to Markdoc 👋
---

# {% $entry.data.title %}
```

The `$entry` object matches [the `CollectionEntry` type](https://docs.astro.build/en/reference/api-reference/#collection-entry-type), excluding the `.render()` property.

### Markdoc config

The `markdoc.config.mjs|ts` file accepts [all Markdoc configuration options](https://markdoc.dev/docs/config), including [tags](https://markdoc.dev/docs/tags) and [functions](https://markdoc.dev/docs/functions).

You can pass these options from the default export in your `markdoc.config.mjs|ts` file:

```js
// markdoc.config.mjs
import { defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  functions: {
    getCountryEmoji: {
      transform(parameters) {
        const [country] = Object.values(parameters);
        const countryToEmojiMap = {
          japan: '🇯🇵',
          spain: '🇪🇸',
          france: '🇫🇷',
        }
        return countryToEmojiMap[country] ?? '🏳'
      },
    },
  },
})
```

Now, you can call this function from any Markdoc content entry:

```md
¡Hola {% getCountryEmoji("spain") %}!
```

📚 [See the Markdoc documentation](https://markdoc.dev/docs/functions#creating-a-custom-function) for more on using variables or functions in your content.

### Pass Markdoc variables

You may need to pass [variables][markdoc-variables] to your content. This is useful when passing SSR parameters like A/B tests.

Variables can be passed as props via the `Content` component:

```astro
---
import { getEntryBySlug } from 'astro:content';

const entry = await getEntryBySlug('docs', 'why-markdoc');
const { Content } = await entry.render();
---

<!--Pass the `abTest` param as a variable-->
<Content abTestGroup={Astro.params.abTestGroup} />
```

Now, `abTestGroup` is available as a variable in `docs/why-markdoc.mdoc`:

```md
{% if $abTestGroup === 'image-optimization-lover' %}

Let me tell you about image optimization...

{% /if %}
```

To make a variable global to all Markdoc files, you can use the `variables` attribute from your `markdoc.config.mjs|ts`:

```js
import { defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  variables: {
    environment: process.env.IS_PROD ? 'prod' : 'dev',
  }
})
```

## Examples

*   The [Astro Markdoc starter template](https://github.com/withastro/astro/tree/latest/examples/with-markdoc) shows how to use Markdoc files in your Astro project.

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](https://github.com/withastro/astro/tree/main/packages/integrations/markdoc/CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/

[astro-components]: https://docs.astro.build/en/core-concepts/astro-components/

[astro-content-collections]: https://docs.astro.build/en/guides/content-collections/

[markdoc-tags]: https://markdoc.dev/docs/tags

[markdoc-nodes]: https://markdoc.dev/docs/nodes

[markdoc-variables]: https://markdoc.dev/docs/variables
