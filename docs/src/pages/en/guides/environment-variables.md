---
layout: ~/layouts/MainLayout.astro
title: Using environment variables
description: Learn how to use environment variables in an Astro project.
---

Astro uses Vite for environment variables, and allows you to use any of its methods to get and set environment variables. Note that all environment variables must be prefixed with `PUBLIC_` to be accessible by client side code.

The ability to access private variables on the server side is [still being discussed](https://github.com/withastro/astro/issues/1765).

## Setting environment variables

Vite includes `dotenv` by default, allowing you to easily set environment variables without any extra configuration in Astro projects. You can also attach a mode (either `production` or `development`) to the filename, like `.env.production` or `.env.development`, which makes the environment variables only take effect in that mode.

Just create a `.env` file in the project directory and add some variables to it.

```bash
# .env
PUBLIC_POKEAPI="https://pokeapi.co/api/v2"
```

## Getting environment variables

Instead of using `process.env`, with Vite you use `import.meta.env`, which uses the `import.meta` feature added in ES2020 (don't worry about browser support though, Vite replaces all `import.meta.env` mentions with static values). For example, to get the `PUBLIC_POKEAPI` environment variable, you could use `import.meta.env.PUBLIC_POKEAPI`.

```js
fetch(`${import.meta.env.PUBLIC_POKEAPI}/pokemon/squirtle`);
```

> ⚠️WARNING⚠️:
> Because Vite statically replaces `import.meta.env`, you cannot access it with dynamic keys like `import.meta.env[key]`.

## IntelliSense for TypeScript

By default, Vite provides type definition for `import.meta.env` in `vite/client.d.ts`. While you can define more custom env variables in `.env.[mode]` files, you may want to get TypeScript IntelliSense for user-defined env variables which prefixed with `PUBLIC_`.

To achieve, you can create an `env.d.ts` in `src` directory, then augment `ImportMetaEnv` like this:

```ts
interface ImportMetaEnv {
  readonly PUBLIC_POKEAPI: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```
