# @astrojs/svelte 🧡

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your [Svelte](https://svelte.dev/) components.

## Installation

There are two ways to add integrations to your project. Let's try the most convenient option first!

### `astro add` command

Astro includes a CLI tool for adding first party integrations: `astro add`. This command will:
1. (Optionally) Install all necessary dependencies and peer dependencies
2. (Also optionally) Update your `astro.config.*` file to apply this integration

To install `@astrojs/svelte`, run the following from your project directory and follow the prompts:

```sh
# Using NPM
npx astro add svelte
# Using Yarn
yarn astro add svelte
# Using PNPM
pnpx astro add svelte
```

If you run into any hiccups, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Install dependencies manually

First, install the `@astrojs/svelte` integration like so:

```sh
npm install @astrojs/svelte
```

Most package managers will install associated peer dependencies as well. Still, if you see a "Cannot find package 'svelte'" (or similar) warning when you start up Astro, you'll need to install Svelte:

```sh
npm install svelte
```

Now, apply this integration to your `astro.config.*` file using the `integrations` property:

__`astro.config.mjs`__

```js
import svelte from '@astrojs/svelte';

export default {
  // ...
  integrations: [svelte()],
}
```

## Getting started

To use your first Svelte component in Astro, head to our [UI framework documentation][astro-ui-frameworks]. You'll explore:
- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🪆 opportunities to mix and nest frameworks together

Also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components

## Options

This integration is powered by `@sveltejs/vite-plugin-svelte`. To customize the Svelte compiler, options can be provided to the integration. See the `@sveltejs/vite-plugin-svelte` [docs](https://github.com/sveltejs/vite-plugin-svelte/blob/HEAD/docs/config.md) for more details.

### Default options

A few of the default options passed to the Svelte compiler are required to build properly for Astro and cannot be overridden.

```js
const defaultOptions = {
  emitCss: true,
  compilerOptions: { dev: isDev, hydratable: true },
  preprocess: [
    preprocess({
      less: true,
      sass: { renderSync: true },
      scss: { renderSync: true },
      stylus: true,
      typescript: true,
    }),
  ],
};
```

The `emitCss`, `compilerOptions.dev`, and `compilerOptions.hydratable` cannot be overridden.

Providing your own `preprocess` options **will** override the defaults - make sure to enable the preprocessor flags needed for your project.
