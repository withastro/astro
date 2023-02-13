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

Markdoc allows you to enhance your Markdown with [UI components][astro-ui-frameworks]. If you have existing content authored in Markdoc, this integration allows you to bring those files to your Astro project using content collections.

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

## Usage

Markdoc files can be used within content collections. Add entries to any content collection using the `.mdoc` extension:

```sh
src/content/docs/
  why-markdoc.mdoc
  quick-start.mdoc
```

Then, query for these files using the [Content Collection APIs](https://docs.astro.build/en/guides/content-collections/#querying-collections):

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

You can configure how your Markdoc content is rendered using props via the `Content` component. This component is returned by [a content collection `render()` result](https://docs.astro.build/en/guides/content-collections/#rendering-content-to-html).

### `config` prop

The `config` prop accepts all [Markdoc configuration options](https://markdoc.dev/docs/config#full-example), including tags and variables.

This example defines a `version` variable to use within a `why-markdoc.mdoc` entry:

```astro
---
import { getEntryBySlug } from 'astro:content';

const entry = await getEntryBySlug('docs', 'why-markdoc');
const { Content } = await entry.render();
---

<Content
  config={{
    variables: {
      version: '0.0.1',
    }
  }}
/>
```

### `components` prop

The `components` prop defines mappings from an HTML element name to an Astro or UI framework component (React, Vue, Svelte, etc).

:::note
`components` does not support the `client:` directive for hydrating components. To embed client-side components, create a wrapper `.astro` file to import your component and apply a `client:` directive manually.
:::

This example renders all `h1` headings using a `Title` component:

```astro
---
import { getEntryBySlug } from 'astro:content';
import Title from '../components/Title.astro';

const entry = await getEntryBySlug('docs', 'why-markdoc');
const { Content } = await entry.render();
---

<Content
  components={{
    h1: Title,
  }}
/>
```

## Examples

*   The [Astro Markdoc starter template](https://github.com/withastro/astro/tree/latest/examples/with-mdx) shows how to use Markdoc files in your Astro project.

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](https://github.com/withastro/astro/tree/main/packages/integrations/markdoc/CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/

[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components

[astro-content-collections]: https://docs.astro.build/en/guides/content-collections/
