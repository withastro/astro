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

https://user-images.githubusercontent.com/4033662/197398760-8fd30eff-4d13-449d-a598-00a6a1ac4644.mp4

### Quick Install

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

```sh
# Using NPM
npx astro add tailwind
# Using Yarn
yarn astro add tailwind
# Using PNPM
pnpm astro add tailwind
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Manual Install

First, install the `@astrojs/tailwind` and `tailwindcss` packages using your package manager. If you're using npm or aren't sure, run this in the terminal:

```sh
npm install @astrojs/tailwind tailwindcss
```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:

```js ins={3} "tailwind()"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // ...
  integrations: [tailwind()],
});
```

## Usage

When you install the integration, Tailwind's utility classes should be ready to go right away. Head to the [Tailwind docs](https://tailwindcss.com/docs/utility-first) to learn how to use Tailwind, and if you see a utility class you want to try, add it to any HTML element to your project!

[Autoprefixer](https://github.com/postcss/autoprefixer) is also set up automatically when working in dev mode, and for production builds, so Tailwind classes will work in older browsers.

https://user-images.githubusercontent.com/4033662/169918388-8ed153b2-0ba0-4b24-b861-d6e1cc800b6c.mp4

## Configuration

### Configuring Tailwind

If you used the Quick Install instructions and said yes to each prompt, you'll see a `tailwind.config.cjs` file in your project's root directory. Use this file for your Tailwind configuration changes. You can learn how to customize Tailwind using this file [in the Tailwind docs](https://tailwindcss.com/docs/configuration).

If it isn't there, you add your own `tailwind.config.(js|cjs|mjs)` file to the root directory and the integration will use its configurations. This can be great if you already have Tailwind configured in another project and want to bring those settings over to this one.

### Configuring the Integration

The Astro Tailwind integration handles the communication between Astro and Tailwind and it has its own options. Change these in the `astro.config.mjs` file (_not_ the Tailwind configuration file) which is where your project's integration settings live.

#### configFile

Previously known as `config.path` in `@astrojs/tailwind` v3. See the [v4 changelog](https://github.com/withastro/astro/blob/main/packages/integrations/tailwind/CHANGELOG.md#400) for updating your config.

If you want to use a different Tailwind configuration file instead of the default `tailwind.config.(js|cjs|mjs)`, specify that file's location using this integration's `configFile` option. If `configFile` is relative, it will be resolved relative to the current working directory.

> **Warning**
> Changing this isn't recommended since it can cause problems with other tools that integrate with Tailwind, like the official Tailwind VSCode extension.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    tailwind({
      // Example: Provide a custom path to a Tailwind config file
      configFile: './custom-config.cjs',
    }),
  ],
});
```

#### applyBaseStyles

Previously known as `config.applyBaseStyles` in `@astrojs/tailwind` v3. See the [v4 changelog](https://github.com/withastro/astro/blob/main/packages/integrations/tailwind/CHANGELOG.md#400) for updating your config.

By default, the integration imports a basic `base.css` file on every page of your project. This basic CSS file includes the three main `@tailwind` directives:

```css
/* The integration's default injected base.css file */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

To disable this default behavior, set `applyBaseStyles` to `false`. This can be useful if you need to define your own `base.css` file (to include a [`@layer` directive](https://tailwindcss.com/docs/functions-and-directives#layer), for example). This can also be useful if you do not want `base.css` to be imported on every page of your project.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    tailwind({
      // Example: Disable injecting a basic `base.css` import on every page.
      // Useful if you need to define and/or import your own custom `base.css`.
      applyBaseStyles: false,
    }),
  ],
});
```

You can now [import your own `base.css` as a local stylesheet](https://docs.astro.build/en/guides/styling/#import-a-local-stylesheet).

## Examples

- The [Astro Tailwind Starter](https://github.com/withastro/astro/tree/latest/examples/with-tailwindcss?on=github) gets you up and running with a base for your project that uses Tailwind for styling
- Astro's homepage uses Tailwind. Check out its [Tailwind configuration file](https://github.com/withastro/astro.build/blob/main/tailwind.config.cjs) or an [example component](https://github.com/withastro/astro.build/blob/main/src/components/Checkbox.astro)
- The [Astro Ink](https://github.com/one-aalam/astro-ink), [Sarissa Blog](https://github.com/iozcelik/SarissaBlogAstroStarter), and [Creek](https://github.com/robertguss/Astro-Theme-Creek) themes use Tailwind for styling
- [Browse Astro Tailwind projects on GitHub](https://github.com/search?q=%22%40astrojs%2Ftailwind%22%3A+path%3A%2Fpackage.json&type=code) for more examples!

## Troubleshooting

### Class does not exist with `@apply` directives

When using the `@apply` directive in an Astro, Vue, Svelte, or another component integration's `<style>` tag, it may generate errors about your custom Tailwind class not existing and cause your build to fail.

```sh
error   The `text-special` class does not exist. If `text-special` is a custom class, make sure it is defined within a `@layer` directive.
```

[Instead of using `@layer` directives in a global stylesheet](https://tailwindcss.com/docs/functions-and-directives#using-apply-with-per-component-css), define your custom styles by adding a plugin to your Tailwind config to fix it:

```js
// tailwind.config.cjs
module.exports = {
  // ...
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        '.btn': {
          padding: theme('spacing.4'),
          margin: 'auto',
        },
      });
    },
  ],
};
```

### Class-based modifiers do not work with `@apply` directives

Certain Tailwind classes with modifiers rely on combining classes across multiple elements. For example, `group-hover:text-gray` compiles to `.group:hover .text-gray`. When this is used with the `@apply` directive in Astro `<style>` tags, the compiled styles are removed from the build output because they do not match any markup in the `.astro` file. The same issue may also happen in framework components that support scoped styles like Vue and Svelte.

To fix this, you can use inline classes instead:

```html
<p class="text-black group-hover:text-gray">Astro</p>
```

### Others

- If your installation doesn't seem to be working, try restarting the dev server.
- If you edit and save a file and don't see your site update accordingly, try refreshing the page.
- If refreshing the page doesn't update your preview, or if a new installation doesn't seem to be working, then restart the dev server.

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.
