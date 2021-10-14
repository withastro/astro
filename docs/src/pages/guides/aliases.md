---
layout: ~/layouts/MainLayout.astro
title: Aliases
description: An intro to Snowpack aliases with Astro.
---

An **alias** is a handy shortcut for your JavaScript imports. This can be a great option if you dislike long relative import paths with many repeating `../` segments. Define an alias to import things directly from some top-level project directory, no matter how deeply nested a file is located.

With an alias, you can import from `"$components/SomeComponent.astro"` instead of `"../../../../../components/SomeComponent.astro"`.

## Adding a custom alias

To add a custom alias to your project, locate your project `snowpack.config.mjs` file. This configuration file contains the instructions and configuration for Astro's internal build tool [Snowpack](https://www.snowpack.dev/reference/configuration). If you don't see a `snowpack.config.mjs` file at the top-level of your project (inside the same folder as your `package.json`), you can create a blank file now.

To add a new import alias, define a new `alias` entry:

```ts
// snowpack.config.mjs
export default {
  alias: {
    // Map "$components/*" imports to "src/components/*"
    $components: './src/components',
    // Map "$/*" imports to "src/*"
    $: './src',
    // Define your own!
    '$my-special-alias': './src/some/special/folder',
  },
  // ...
};
```

Once you have defined your alias(es) and restarted Astro (if needed) you can start importing from the alias anywhere in your project:

```js
import MyComponent from '$components/MyComponent.astro';
import mySvgUrl from '$/logo.svg';
```

You can read more about the `alias` configuration in [the Snowpack documentation.](https://www.snowpack.dev/reference/configuration#alias)

## Tips & Tricks

- We recommend starting all aliases with the special `$` character. This is not required.
- It is common to define a top-level `$` alias for your `src` directory. This is not required.
- To add VSCode support for you aliases, you will also need to define your aliases in a `tsconfig.json` or `jsconfig.json` file via the `"paths"` config value. This will enable Intellisense in VSCode and most other text editors.
- You don't need to use an alias with Astro! Some people prefer less magic in their code, and don't want to bother with extra steps for text editor support.
