# @astrojs/react ⚛️

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your [React](https://reactjs.org/) components.

## Installation

There's a couple ways to install integrations. Let's try the most convenient option first!

### (experimental) `astro add` command

Astro includes a CLI tool for adding first party integrations: `astro add`. This command will:
1. (Optionally) Install all necessary dependencies and peer dependencies
2. (Also optionally) Update your `astro.config.*` file to apply this integration

To install `@astrojs/react`, run the following from your project directory and follow the prompts:

```sh
# Using NPM
npx astro add react
# Using Yarn
yarn astro add react
# Using PNPM
pnpx astro add react
```

If you run into any hiccups, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Install dependencies manually

First, install the `@astrojs/react` integration like so:

```
npm install @astrojs/react
```

Most package managers will install associated peer dependencies as well. Still, if you see a "Cannot find package 'react'" (or similar) warning when you start up Astro, you'll need to install `react` and `react-dom`:

```sh
npm install react react-dom
```

Now, apply this integration to your `astro.config.*` file using the `integrations` property:

__astro.config.mjs__

```js
import react from '@astrojs/react';

export default {
  // ...
  integrations: [react()],
}
```

## Integration Documentation

[Astro Integration Documentation][astro-integration]

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
