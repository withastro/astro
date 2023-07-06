# @astrojs/preact ⚛️

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your [Preact](https://preactjs.com/) components.

- <strong>[Why Preact?](#why-preact)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Preact?

Preact is a library that lets you build interactive UI components for the web. If you want to build interactive features on your site using JavaScript, you may prefer using its component format instead of using browser APIs directly.

Preact is also a great choice if you have previously used React. Preact provides the same API as React, but in a much smaller 3kB package. It even supports rendering many React components using the `compat` configuration option (see below).

**Want to learn more about Preact before using this integration?**  
Check out [“Learn Preact in 10 minutes”](https://preactjs.com/tutorial), an interactive tutorial on their website.

## Installation

### Quick Install

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

```sh
# Using NPM
npx astro add preact
# Using Yarn
yarn astro add preact
# Using PNPM
pnpm astro add preact
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Manual Install

First, install the `@astrojs/preact` package using your package manager. If you're using npm or aren't sure, run this in the terminal:

```sh
npm install @astrojs/preact
```

Most package managers will install associated peer dependencies as well. Still, if you see a "Cannot find package 'preact'" (or similar) warning when you start up Astro, you'll need to install Preact:

```sh
npm install preact
```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:

```js ins={3} "preact()"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  // ...
  integrations: [preact()],
});
```

## Usage

To use your first Preact component in Astro, head to our [UI framework documentation][astro-ui-frameworks]. You'll explore:

- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🤝 opportunities to mix and nest frameworks together

Also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Configuration

The Astro Preact integration handles how Preact components are rendered and it has its own options. Change these in the `astro.config.mjs` file which is where your project's integration settings live.

For basic usage, you do not need to configure the Preact integration.

### compat

You can enable `preact/compat`, Preact’s compatibility layer for rendering React components without needing to install or ship React’s larger libraries to your users’ web browsers.

To do so, pass an object to the Preact integration and set `compat: true`.

```js "compat: true"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  integrations: [preact({ compat: true })],
});
```

With the `compat` option enabled, the Preact integration will render React components as well as Preact components in your project and also allow you to import React components inside Preact components. Read more in [“Switching to Preact (from React)”](https://preactjs.com/guide/v10/switching-to-preact) on the Preact website.

When importing React component libraries, in order to swap out the `react` and `react-dom` dependencies as `preact/compat`, you can use [`overrides`](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides) to do so.

```json
// package.json
{
  "overrides": {
    "react": "npm:@preact/compat@latest",
    "react-dom": "npm:@preact/compat@latest"
  }
}
```

Check out the [`pnpm` overrides](https://pnpm.io/package_json#pnpmoverrides) and [`yarn` resolutions](https://yarnpkg.com/configuration/manifest#resolutions) docs for their respective overrides features.

> **Note**
> Currently, the `compat` option only works for React libraries that export code as ESM. If an error happens during build-time, try adding the library to `vite.ssr.noExternal: ['the-react-library']` in your `astro.config.mjs` file.

## Examples

- The [Astro Preact example](https://github.com/withastro/astro/tree/latest/examples/framework-preact) shows how to use an interactive Preact component in an Astro project.
- The [Astro Nanostores example](https://github.com/withastro/astro/tree/latest/examples/with-nanostores) shows how to share state between different components — and even different frameworks! — in an Astro project.

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
