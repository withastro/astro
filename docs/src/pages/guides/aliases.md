---
layout: ~/layouts/MainLayout.astro
title: Aliases
---

An **alias** is a handy shortcut for your JavaScript import paths. This can be a great option if you dislike long relative import paths with many repeating `../` segments. Define an **alias** in your project to import directly from some directory no matter how deeply nested a file is located.

With aliases, you can import from `"components/SomeComponent.astro"` instead of `"../../../../../components/SomeComponent.astro"`.

## Adding a custom alias

To add custom aliases to your project, located in the root of your project is the `snowpack.config.mjs` file. This configuration file contains the instructions for Astro's build tool [Snowpack](https://www.snowpack.dev/reference/configuration), on how to build out your Astro project.

> **Note:** some projects don't come with this file out of the box, feel free to create it yourself. [More on snowpack.config.mjs.](https://www.snowpack.dev/reference/configuration)

Inside the file you will notice that there are already some predefined aliases.

```ts
// snowpack.config.mjs

export default {
  alias: {
    components: './src/components',
    '~': './src',
  },
  plugins: ['@snowpack/plugin-dotenv'],
  workspaceRoot: '../',
};
```

To **add your own** alias just define it on a new line, like so:

```ts
// snowpack.config.mjs

export default {
  alias: {
    components: './src/components',
    '~': './src',
    '@public': './public', // This can be virtually anything
  },
  plugins: ['@snowpack/plugin-dotenv'],
  workspaceRoot: '../',
};
```

| Key                         | Value                              |
| --------------------------- | ---------------------------------- |
| The keyword you'll be using | The path it will get replaced with |

## Usage

Now just use the **defined** aliases in a file of your choice:

```js
import '@public/assets/logo.svg';
import MyComponent from 'components/MyComponent/MyComponent.tsx';
```
