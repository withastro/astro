# @astrojs/og 🌄

> ⚠️ This integration is **extremely** experimental! Only `output: 'server'` environments and `node` environments are supported currently.

This **[Astro integration][astro-integration]** makes it easy to add social [Open Graph](https://ogp.me/) images to your [Astro project](https://astro.build)!

- <strong>[Why `@astrojs/og`?](#why-astrojsog)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Debugging](#debugging)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why `@astrojs/og`?

Branded Open Graph images make your content significantly more appealing on social media sites. However, creating these images has historically been difficult—static images require constant back-and-forth to keep edits in sync, whereas fully dynamic images required heavy-handed solutions like a headless browser or low-level `canvas` APIs.

This integration comes with a straight-forward `<og.image>` component that renders an image from your existing markup and components. By creating a `src/pages/og/` directory and adding `.astro` pages, you instantly have the full power of Astro at your disposal for creating Open Graph images.

## Installation

### Quick Install

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

```sh
# Using NPM
npx astro add og
# Using Yarn
yarn astro add og
# Using PNPM
pnpm astro add og
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Manual Install

First, install the `@astrojs/og` package using your package manager. If you're using npm or aren't sure, run this in the terminal:

```sh
npm install @astrojs/og
```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:

**`astro.config.mjs`**

```js
import og from "@astrojs/og";

export default {
  // Note that only `server` is supported (for now!)
  output: "server",
  integrations: [og()],
};
```

## Usage

```astro title="src/pages/index.astro"
---
import { og } from '@astrojs/image/components';
---

<og.image title="Hello world!" />
```

The included `<og.image>` component will generate a `<meta property="og:image">` tag. You must also create a `src/pages/og/` directory that contains `.astro` files which will generate your open graph images. By default, `src/pages/og/index.astro` is required.

```astro title="src/pages/og/index.astro"
---
import { Container } from '@astrojs/image/components';
const { title } = Object.fromEntries(Astro.url.searchParams.entries());
---

<Container>
    <h1>{title}</h1>
</Container>
```

### `<og.image />`

Astro’s `<og.image />` component requires the `alt` attribute, which provides descriptive text for images. A warning will be logged if alt text is missing, and a future release of the integration will throw an error if no alt text is provided.

#### src

<p>

**Type:** `string`<br>
**Required:** `false`

</p>

Source path to the image component.

For components located in your project's `src/pages/og` directory, use the file path relative to the `src/pages/og` directory. (e.g. `src="blog"` will reference `src/pages/og/blog.astro`)

#### alt

<p>

**Type:** `string`<br>
**Required:** `true`

</p>

Defines an alternative text description of the image.

#### as

<p>

**Type:** `'meta' | 'img'`<br>
**Default:** `'meta'`

</p>

The output element to render to. A `<meta>` tag will be generated if `as` is not provided.

Set `as="img"` to debug image during development.

#### width

<p>

**Type:** `number`<br>
**Default:** `1200`

</p>

The desired width of the output image. If provided, `height` is also required.

Dimensions are optional and will default to `1200 x 630` if not provided.

#### height

<p>

**Type:** `number`<br>
**Default:** `630`

</p>

The desired height of the output image. If provided, `width` is also required.

Dimensions are optional and will default to `1200 x 630` if not provided.

#### debug

<p>

**Type:** `boolean`<br>
**Default:** `false`

</p>

Enable `debug` rendering for [`satori`](https://github.com/vercel/satori#debug), which will draw bounding boxes for debugging.

## Configuration

There are no integration options at the moment. In the future, support for custom fonts will be exposed at the integration level.

## Troubleshooting

- If your installation doesn't seem to be working, try restarting the dev server.
- If you edit and save a file and don't see your site update accordingly, try refreshing the page.
- If refreshing the page doesn't update your preview, or if a new installation doesn't seem to be working, then restart the dev server.

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.
