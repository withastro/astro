---
layout: ~/layouts/MainLayout.astro
title: Using environment variables
description: Learn how to use environment variables in an Astro project.
---

Astro uses Vite for environment variables, and allows you to use any of its methods to get and set environment variables. Note that all environment variables must be prefixed with `VITE_` to be accessible by client side code.

## Setting environment variables

Vite includes `dotenv` by default, allowing you to easily set environment variables with no configuration in Astro projects. You can also attach a mode (either `production` or `development`) to the filename, like `.env.production` or `.env.development`, which makes the environment variables only take effect in that mode.

Just create a `.env` file in the project directory and add some variables to it.

```bash
# .env
VITE_POKEAPI="https://pokeapi.co/api/v2"
```

## Getting environment variables

Instead of using `process.env`, with Vite you use `import.meta.env`, which uses the `import.meta` feature added in ES2020 (don't worry about browser support though, Vite replaces all `import.meta.env` mentions with static values). For example, to get the `VITE_POKEAPI` environment variable, you could use `import.meta.env.VITE_POKEAPI`.

```js
fetch(`${import.meta.env.VITE_POKEAPI}/pokemon/squirtle`
```

> ⚠️WARNING⚠️:
> Because Vite statically replaces `import.meta.env`, you cannot access it with dynamic keys like `import.meta.env[key]`.
