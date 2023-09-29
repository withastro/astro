# @astrojs/react ⚛️

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your [React](https://react.dev/) components.

## Installation

There are two ways to add integrations to your project. Let's try the most convenient option first!

### `astro add` command

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
pnpm astro add react
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Install dependencies manually

First, install the `@astrojs/react` integration like so:

```sh
npm install @astrojs/react
```

Most package managers will install associated peer dependencies as well. Still, if you see a "Cannot find package 'react'" (or similar) warning when you start up Astro, you'll need to install `react` and `react-dom`:

```sh
npm install react react-dom
```

Now, apply this integration to your `astro.config.*` file using the `integrations` property:

```diff lang="js" "react()"
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
+ import react from '@astrojs/react';

  export default defineConfig({
    // ...
    integrations: [react()],
    //             ^^^^^^^
  });
```

## Getting started

To use your first React component in Astro, head to our [UI framework documentation][astro-ui-frameworks]. You'll explore:

- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🤝 opportunities to mix and nest frameworks together

## Options

### Combining multiple JSX frameworks

When you are using multiple JSX frameworks (React, Preact, Solid) in the same project, Astro needs to determine which JSX framework-specific transformations should be used for each of your components. If you have only added one JSX framework integration to your project, no extra configuration is needed.

Use the `include` (required) and `exclude` (optional) configuration options to specify which files belong to which framework. Provide an array of files and/or folders to `include` for each framework you are using. Wildcards may be used to include multiple file paths.

We recommend placing common framework components in the same folder (e.g. `/components/react/` and `/components/solid/`) to make specifying your includes easier, but this is not required:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import solid from '@astrojs/solid-js';

export default defineConfig({
  // Enable many frameworks to support all different kinds of components.
  // No `include` is needed if you are only using a single JSX framework!
  integrations: [
    preact({
      include: ['**/preact/*'],
    }),
    react({
      include: ['**/react/*'],
    }),
    solid({
      include: ['**/solid/*'],
    }),
  ],
});
```

### Children parsing

Children passed into a React component from an Astro component are parsed as plain strings, not React nodes.

For example, the `<ReactComponent />` below will only receive a single child element:

```astro
---
import ReactComponent from './ReactComponent';
---

<ReactComponent>
  <div>one</div>
  <div>two</div>
</ReactComponent>
```

If you are using a library that _expects_ more than one child element to be passed, for example so that it can slot certain elements in different places, you might find this to be a blocker.

You can set the experimental flag `experimentalReactChildren` to tell Astro to always pass children to React as React vnodes. There is some runtime cost to this, but it can help with compatibility.

You can enable this option in the configuration for the React integration:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  // ...
  integrations: [
    react({
      experimentalReactChildren: true,
    }),
  ],
});
```

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
