# @astrojs/preact ⚛️

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your [Preact](https://preactjs.com/) components.

## Installation

There are two ways to add integrations to your project. Let's try the most convenient option first!

### (experimental) `astro add` command

Astro includes a CLI tool for adding first party integrations: `astro add`. This command will:
1. (Optionally) Install all necessary dependencies and peer dependencies
2. (Also optionally) Update your `astro.config.*` file to apply this integration

To install `@astrojs/preact`, run the following from your project directory and follow the prompts:

```sh
# Using NPM
npx astro add preact
# Using Yarn
yarn astro add preact
# Using PNPM
pnpx astro add preact
```

If you run into any hiccups, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Install dependencies manually

First, install the `@astrojs/preact` integration like so:

```
npm install @astrojs/preact
```

Most package managers will install associated peer dependencies as well. Still, if you see a "Cannot find package 'preact'" (or similar) warning when you start up Astro, you'll need to install Preact:

```sh
npm install preact
```

Now, apply this integration to your `astro.config.*` file using the `integrations` property:

__astro.config.mjs__

```js
import preact from '@astrojs/preact';

export default {
  // ...
  integrations: [preact()],
}
```

## Getting started

To use your first Preact component in Astro, head to our [UI framework documentation][astro-ui-frameworks]. You'll explore:
- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🪆 opportunities to mix and nest frameworks together

Also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
