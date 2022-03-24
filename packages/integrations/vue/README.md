# @astrojs/vue 💚

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your Vue components.

## Installation

There's a couple ways to install integrations. Let's try the most convenient option first!

### (experimental) `astro add` command

Astro includes a CLI tool for adding first party integrations: `astro add`. This command will:
1. (Optionally) Install all necessary dependencies and peer dependencies
2. (Also optionally) Update your `astro.config.*` file to apply this integration

To install `@astrojs/vue`, run the following from your project directory and follow the prompts:

```sh
# Using NPM
npx astro add vue
# Using Yarn
yarn astro add vue
# Using PNPM
pnpx astro add vue
```

If you run into any hiccups, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Install dependencies manually

First, install the `@astrojs/vue` integration like so:

```
npm install @astrojs/vue
```

Most package managers will install associated peer dependencies as well. Still, if you see a "Cannot find package 'vue'" (or similar) warning when you start up Astro, you'll need to install Vue:

```sh
npm install vue
```

Now, apply this integration to your `astro.config.*` file using the `integrations` property:

__astro.config.mjs__

```js
import vue from '@astrojs/vue';

export default {
  // ...
  integrations: [vue()],
}
```

## Integration Documentation

[Astro Integration Documentation][astro-integration]

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
