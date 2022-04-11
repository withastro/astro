# @astrojs/tailwind 💨

This **[Astro integration][astro-integration]** brings [Tailwind CSS](https://tailwindcss.com/) to your Astro project.

Tailwind brings utility CSS classes for fonts, colors, layouts, transforms, and more to every Astro page or [UI component](https://docs.astro.build/en/core-concepts/framework-components/) in your project. It also includes extensive theming options for unifying your styles.

## Installation

There are two ways to add integrations to your project. Let's try the most convenient option first!

### (experimental) `astro add` command

Astro includes a CLI tool for adding first party integrations: `astro add`. This command will:
1. (Optionally) Install all necessary dependencies and peer dependencies
2. (Also optionally) Update your `astro.config.*` file to apply this integration

To install `@astrojs/tailwind`, run the following from your project directory and follow the prompts:

```sh
# Using NPM
npx astro add tailwind
# Using Yarn
yarn astro add tailwind
# Using PNPM
pnpx astro add tailwind
```

If you run into any hiccups, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Install dependencies manually

First, install the `@astrojs/tailwind` integration like so:

```
npm install @astrojs/tailwind
```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__astro.config.mjs__

```js
import tailwind from '@astrojs/tailwind';

export default {
  // ...
  integrations: [tailwind()],
}
```

## Getting started

Tailwind's utility classes should be ready-to-use with zero config, including [preprocessor setup](https://tailwindcss.com/docs/using-with-preprocessors) and [production optimization](https://tailwindcss.com/docs/optimizing-for-production). Head to the [Tailwind docs](https://tailwindcss.com/docs/utility-first) to learn all of the options and features available!

## Configuration

### Custom Tailwind Config File

Add your own `tailwind.config.(js|cjs|mjs)` file to the base of your project, and this integration will respect it. This can be useful for setting a [custom theme](https://tailwindcss.com/docs/configuration) or providing other configuration?

### config.path

You can give a different config file location using this integration's `config.path` option. If `config.path` is relative, it will be resolved relative to the root. 

Changing `config.path` is well supported in Astro, but not recommended overall since it can cause problems with other Tailwind integrations, like the official Tailwind VSCode extension.

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

### config.applyAstroPreset

By default, when a custom `tailwind.config.js` file is used this integration will still append some configuration as a `preset` in the final configuration. This default configuration provides the correct `content` property so that Tailwind knows what files to scan in Astro projects (`src/**/*.{astro,html,js,jsx,svelte,ts,tsx,vue}`).

You can disable this by setting `config.applyAstroPreset` to false. enable Tailwind across all Astro files and [UI framework components](https://docs.astro.build/en/core-concepts/framework-components/). To remove this default, opt-out via the `config.applyAstroPreset` integration option:

```js
// astro.config.mjs
export default {
  integrations: [tailwind({
    // Example: Disable adding Astro configuration as a preset.
    // Only useful if a custom tailwind.config.js file is used.
    config: { applyAstroPreset: false },
  })],
}
```

### config.applyBaseStyles

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

## Read more

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
