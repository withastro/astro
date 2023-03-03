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

Once the Markdoc integration is installed, no configuration is necessary to use `.mdoc` files in your Content Collections.

### Markdoc config

The Markdoc integration accepts [all Markdoc configuration options](https://markdoc.dev/docs/config), including [tags](https://markdoc.dev/docs/tags) and [variables](https://markdoc.dev/docs/variables).

You can pass these options from the `markdoc()` integration in your `astro.config`. This example declares a `countries` variable and an `includes` function for use across all Markdoc Content Collection entries:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
  integrations: [
    markdoc({
      variables: {
        // Declare a global list of countries
        // Usage in Markdoc: `$countries`
        countries: ['EN', 'ES', 'JP'],
      },
      functions: {
        // Check if array includes value
        // Usage in Markdoc: `includes(arr, value)`
        includes: {
          transform(parameters) {
            const [array, value] = Object.values(parameters);
            return array.includes(value);
          },
        },
      },
    }),
  ],
});
```

:::note
These options will be applied during [the Markdoc "transform" phase](https://markdoc.dev/docs/render#transform). This is run **at build time** (rather than server request time) both for static and SSR Astro projects.
::

📚 [See the Markdoc documentation](https://markdoc.dev/docs/functions#creating-a-custom-function) for more on using variables or functions in your content.

### Content `components` prop

The `Content` component accepts a `components` prop, which defines mappings from Markdoc tags and HTML element names to Astro or UI framework components (React, Vue, Svelte, etc).

#### Render Markdoc nodes / HTML elements as Astro components

You may want to map standard HTML elements like headings and paragraphs to components. For this, you can configure a custom [Markdoc node](https://markdoc.dev/docs/nodes). This example overrides Markdoc's `heading` node to render a `Heading` component, passing the built-in `level` attribute as a prop:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
	integrations: [
		markdoc({
			nodes: {
				heading: {
					render: 'Heading',
          // Markdoc requires type defs for each attribute.
          // These should mirror the `Props` type of the component
          // you are rendering. 
          // See Markdoc's documentation on defining attributes
          // https://markdoc.dev/docs/attributes#defining-attributes
          attributes: {
            level: { type: String },
          }
				},
			},
		}),
	],
});
```

Now, you can map the string passed to render (`'Heading'` in this example) to a component import. This is configured from the `<Content />` component used to render your Markdoc using the `components` prop:

```astro
---
import { getEntryBySlug } from 'astro:content';
import Heading from '../components/Heading.astro';

const entry = await getEntryBySlug('docs', 'why-markdoc');
const { Content } = await entry.render();
---

<Content
  components={{
    Heading: Heading,
  }}
/>
```

📚 [Find all of Markdoc's built-in nodes and node attributes on their documentation.](https://markdoc.dev/docs/nodes#built-in-nodes)

#### Render Markdoc tags as Astro components

You may also configure [Markdoc tags](https://markdoc.dev/docs/tags) that map to components. You can configure a new tag from your `astro.config` using the `tags` attribute.


```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
	integrations: [
		markdoc({
			tags: {
				aside: {
					render: 'Aside',
          attributes: {
            // Component props as attribute definitions
            // See Markdoc's documentation on defining attributes
            // https://markdoc.dev/docs/attributes#defining-attributes
            type: { type: String },
          }
				},
			},
		}),
	],
});
```

Then, you can wire this render name (`'Aside'`) to a component from the `components` prop via the `<Content />` component:


```astro
---
import { getEntryBySlug } from 'astro:content';
import Aside from '../components/Aside.astro';

const entry = await getEntryBySlug('docs', 'why-markdoc');
const { Content } = await entry.render();
---

<Content
  components={{
    Aside: Aside,
  }}
/>
```

#### Use client-side UI components

Today, the `components` prop does not support the `client:` directive for hydrating components. To embed client-side components, create a wrapper `.astro` file to import your component and apply a `client:` directive manually.

This example wraps a `Aside.tsx` component with a `ClientAside.astro` wrapper:

```astro
---
// src/components/ClientAside.astro
import Aside from './Aside';
---

<Aside client:load />
```

This component [can be applied via the `components` prop](#render-html-elements-as-astro-components):

```astro
---
// src/pages/why-markdoc.astro
import { getEntryBySlug } from 'astro:content';
import ClientAside from '../components/ClientAside.astro';

const entry = await getEntryBySlug('docs', 'why-markdoc');
const { Content } = await entry.render();
---

<Content
  components={{
    aside: ClientAside,
  }}
/>
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
