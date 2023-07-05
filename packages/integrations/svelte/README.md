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
pnpm astro add svelte
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

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

```js ins={3} "svelte()"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  // ...
  integrations: [svelte()],
});
```

## Getting started

To use your first Svelte component in Astro, head to our [UI framework documentation][astro-ui-frameworks]. You'll explore:

- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🤝 opportunities to mix and nest frameworks together

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components

## Options

This integration is powered by `@sveltejs/vite-plugin-svelte`. To customize the Svelte compiler, options can be provided to the integration. See the [`@sveltejs/vite-plugin-svelte` docs](https://github.com/sveltejs/vite-plugin-svelte/blob/HEAD/docs/config.md) for more details.

### Default options

This integration passes the following default options to the Svelte compiler:

```js
const defaultOptions = {
  emitCss: true,
  compilerOptions: { dev: isDev, hydratable: true },
  preprocess: vitePreprocess(),
};
```

These `emitCss`, `compilerOptions.dev`, and `compilerOptions.hydratable` values are required to build properly for Astro and cannot be overridden.

Providing your own `preprocess` options **will** override the [`vitePreprocess()`](https://github.com/sveltejs/vite-plugin-svelte/blob/HEAD/docs/preprocess.md) default. Make sure to enable the preprocessor flags needed for your project.

You can set options either by passing them to the `svelte` integration in `astro.config.mjs` or in `svelte.config.js`. Either of these would override the default `preprocess` setting:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  integrations: [svelte({ preprocess: [] })],
});
```

```js
// svelte.config.js
export default {
  preprocess: [],
};
```

## Intellisense for TypeScript

**Added in:** `@astrojs/svelte@2.0.0`

If you're using a preprocessor like TypeScript or SCSS in your Svelte files, you can create a `svelte.config.js` file so that the Svelte IDE extension can correctly parse the Svelte files.

```js
// svelte.config.js
import { vitePreprocess } from '@astrojs/svelte';

export default {
  preprocess: vitePreprocess(),
};
```

This config file will be automatically added for you when you run `astro add svelte`.
