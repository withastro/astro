# @astrojs/tailwind 💨

This **[Astro integration][astro-integration]** brings [Tailwind's](https://tailwindcss.com/) utility CSS classes to every `.astro` file and [framework component](https://docs.astro.build/en/core-concepts/framework-components/) in your project, along with support for the Tailwind configuration file.

- <strong>[Why Tailwind](#why-tailwind)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Tailwind?

Tailwind lets you use utility classes instead of writing CSS. These utility classes are mostly one-to-one with a certain CSS property setting: for example, adding the `text-lg` to an element is equivalent to setting `font-size: 1.125rem` in CSS. You might find it easier to write and maintain your styles using these predefined utility classes!

If you don't like those predefined settings, you can [customize the Tailwind configuration file](https://tailwindcss.com/docs/configuration) to your project's design requirements. For example, if the "large text" in your design is actually `2rem`, you can [change the `lg` fontSize setting](https://tailwindcss.com/docs/font-size#customizing-your-theme) to `2rem`.

Tailwind is also a great choice to add styles to React, Preact, or Solid components, which don't support a `<style>` tag in the component file. 

Note: it's generally discouraged to use both Tailwind and another styling method (e.g. Styled Components) in the same file.

## Installation

https://user-images.githubusercontent.com/4033662/169920154-4b42fc52-e2b5-4ca4-b7d2-d9057ab42ddf.mp4

### Quick Install
  
The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.
  
```sh
# Using NPM
npm run astro add tailwind
# Using Yarn
yarn astro add tailwind
# Using PNPM
pnpm astro add tailwind
```
  
Then, restart the dev server by typing `CTRL-C` and then `npm run astro dev` in the terminal window that was running Astro.
  
Because this command is new, it might not properly set things up. If that happens, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Manual Install
  
First, install the `@astrojs/tailwind` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/tailwind
```
Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__`astro.config.mjs`__

```js
import tailwind from '@astrojs/tailwind';

export default {
  // ...
  integrations: [tailwind()],
}
```
  
Then, restart the dev server.


## Usage

When you install the integration, Tailwind's utility classes should be ready to go right away. Head to the [Tailwind docs](https://tailwindcss.com/docs/utility-first) to learn how to use Tailwind, and if you see a utility class you want to try, add it to any HTML element to your project!

https://user-images.githubusercontent.com/4033662/169918388-8ed153b2-0ba0-4b24-b861-d6e1cc800b6c.mp4

## Configuration

### Configuring Tailwind

If you used the Quick Install instructions and said yes to each prompt, you'll see a `tailwind.config.cjs` file in your project's root directory. Use this file for your Tailwind configuration changes. You can learn how to customize Tailwind using this file [in the Tailwind docs](https://tailwindcss.com/docs/configuration).

If it isn't there, you add your own `tailwind.config.(js|cjs|mjs)` file to the root directory and the integration will use its configurations. This can be great if you already have Tailwind configured in another project and want to bring those settings over to this one.

### Configuring the Integration

The Astro Tailwind integration handles the communication between Astro and Tailwind and it has its own options. Change these in the `astro.config.mjs` file (_not_ the Tailwind configuration file) which is where your project's integration settings live.

#### config.path
  
If you want to use a different Tailwind configuration file instead of the default `tailwind.config.(js|cjs|mjs)`, specify that file's location using this integration's `config.path` option. If `config.path` is relative, it will be resolved relative to the root.

> **Warning**
> Changing this isn't recommended since it can cause problems with other tools that integrate with Tailwind, like the official Tailwind VSCode extension.

```js
// astro.config.mjs
import tailwind from '@astrojs/tailwind';

export default {
  integrations: [tailwind({
    // Example: Provide a custom path to a Tailwind config file
    config: { path: './custom-config.js' },
  })],
}
```

#### config.applyBaseStyles

  By default, the integration imports a basic `base.css` file on every page of your project. This basic CSS file includes the three main `@tailwind` directives:

```css
/* The integration's default injected base.css file */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

To disable this default behavior, set `config.applyBaseStyles` to `false`. This can be useful if you need to define your own `base.css` file (to include a [`@layer` directive](https://tailwindcss.com/docs/functions-and-directives#layer), for example). This can also be useful if you do not want `base.css` to be imported on every page of your project.

```js
// astro.config.mjs
export default {
  integrations: [tailwind({
    // Example: Disable injecting a basic `base.css` import on every page.
    // Useful if you need to define and/or import your own custom `base.css`.
    config: { applyBaseStyles: false },
  })],
}
```

You can now [import your own `base.css` as a local stylesheet](https://docs.astro.build/en/guides/styling/#import-a-local-stylesheet).

## Examples

- The [Astro Tailwind Starter](https://github.com/withastro/astro/tree/latest/examples/with-tailwindcss?on=github) gets you up and running with a base for your project that uses Tailwind for styling
- Astro's homepage uses Tailwind. Check out its [Tailwind configuration file](https://github.com/withastro/astro.build/blob/main/tailwind.config.js) or an [example component](https://github.com/withastro/astro.build/blob/main/src/components/integrations/IntegrationCard.astro)
- The [Astro Ink](https://github.com/one-aalam/astro-ink), [Sarissa Blog](https://github.com/iozcelik/SarissaBlogAstroStarter), and [Creek](https://github.com/robertguss/Astro-Theme-Creek) themes use Tailwind for styling
- [Browse Astro Tailwind projects on GitHub](https://github.com/search?q=%22%40astrojs%2Ftailwind%22+filename%3Apackage.json&type=Code) for more examples!

## Troubleshooting
- If your installation doesn't seem to be working, make sure to restart the dev server.
- If you edit and save a file and don't see your site update accordingly, try refreshing the page.
- If refreshing the page doesn't update your preview, or if a new installation doesn't seem to be working, then restart the dev server.

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.
