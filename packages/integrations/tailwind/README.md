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

Have a [custom theme](https://tailwindcss.com/docs/configuration)? Try adding a `tailwind.config.(js|cjs|mjs)` file to the base of your project. You can also specify a custom config file using this integration's `config.path` option:

__astro.config.mjs__

```js
import tailwind from '@astrojs/tailwind';

export default {
  // ...
  integrations: [tailwind({
    config: { path: './custom-config.js' },
  })],
}
```

We will provide a `content` property to your config to enable Tailwind across all Astro files and [UI framework components](https://docs.astro.build/en/core-concepts/framework-components/). To remove this default, opt-out via the `config.applyAstroPreset` integration option:

__astro.config.mjs__

```js
export default {
  // ...
  integrations: [tailwind({
    config: { applyAstroPreset: false },
  })],
}
```

We will include `@tailwind` directives for each of Tailwind's layers to enable Tailwind styles by default. If you need to customize this behavior, with Tailwind's [`@layer` directive](https://tailwindcss.com/docs/functions-and-directives#layer) for example, opt-out via the `config.applyBaseStyles` integration option:

__astro.config.mjs__

```js
export default {
  // ...
  integrations: [tailwind({
    config: { applyBaseStyles: false },
  })],
}
```

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
