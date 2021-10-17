---
layout: ~/layouts/MainLayout.astro
title: Using environment variables
description: Learn how to use environment variables in an Astro project.
---

Astro uses Snowpack for environment variables, and allows you to use any of it's methods to get and set environment variables. Note that all environment variables must be prefixed with `SNOWPACK_PUBLIC` to be accessible by client side code.

## Setting environment variables

The two primary methods for setting environment variables are through the `env` property in `snowpack.config.mjs` or through a `.env` file using [@snowpack/plugin-dotenv](https://www.npmjs.com/package/@snowpack/plugin-dotenv).

### Setting environment variables through snowpack.config.mjs

Environment variables can be set through the `env` object in `snowpack.config.mjs`. You do not need to prefix variables if you are passing them through the `env` config, but in this tutorial we still will. For example, you could do this:

```js
// snowpack.config.mjs
export default {
    env: {
        SNOWPACK_PUBLIC_POKEAPI: "https://pokeapi.co/api/v2"
    }
}
```

### Setting environment variables through dotenv files

Environment variables can also be set through `.env` files, although it takes more setup. First, you need to install  [@snowpack/plugin-dotenv](https://www.npmjs.com/package/@snowpack/plugin-dotenv).

```bash
# npm
npm install @snowpack/plugin-dotenv
# yarn
yarn add @snowpack/plugin-dotenv
#pnpm
pnpm add @snowpack/plugin-dotenv
```

Then add the plugin to your `snowpack.config.mjs`.

```js
// snowpack.config.mjs
export default {
  plugins: ['@snowpack/plugin-dotenv'],
};
```

Now, create a `.env` file in the project directory and add some variables to it

```bash
# .env
SNOWPACK_PUBLIC_POKEAPI="https://pokeapi.co/api/v2"
```

## Getting environment variables

Instead of using `process.env`, with Snowpack you use `__SNOWPACK_ENV__`. For example, to get the `SNOWPACK_PUBLIC_POKEAPI` environment variable, you could use `__SNOWPACK_ENV__.SNOWPACK_PUBLIC_POKEAPI`.

```js
fetch(`${__SNOWPACK_ENV__.SNOWPACK_PUBLIC_POKEAPI}/pokemon/squirtle`
```