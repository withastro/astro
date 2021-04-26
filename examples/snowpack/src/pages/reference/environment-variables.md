---
layout: ../../layouts/content.astro
title: Environment Variables
description: Using environment variables with Snowpack
---

For your safety, Snowpack supports only environment variables which begin with `SNOWPACK_PUBLIC_*`. We do this because everything in your web application is sent to the browser, and we don't want you to accidentally share sensitive keys/env variables with your public web application. Prefixing your frontend web env variables with `SNOWPACK_PUBLIC_` is a good reminder that they will be shared with the world.

## Setting environment variables

You can set environment variables with snowpack in three different ways:

### Option 1: CLI

Set environment variables when you run the snowpack CLI:

```bash
SNOWPACK_PUBLIC_API_URL=api.google.com snowpack dev
```

### Option 2: Config file

Set environment variables by adding to `process.env.*` at the top of your `snowpack.config.js` file.

```js
// snowpack.config.js
process.env.SNOWPACK_PUBLIC_API_URL = 'api.google.com';
// ...rest of config
```

Note that your application won't _read_ these environment variables from `process.env`, but variables that are set here will be available on `import.meta.env` (see below).

### Option 3: Plugin

Use a plugin such as [plugin-dotenv](https://www.npmjs.com/package/@snowpack/plugin-dotenv) to load environment variables from a `.env` file.

## Reading environment variables

You can read environment variables directly in your web application via `import.meta.env`. If you've ever used `process.env` in Create React App or any Webpack application, this behaves exactly the same.

```js
// `import.meta.env` - Read process.env variables in your web app
fetch(`${import.meta.env.SNOWPACK_PUBLIC_API_URL}/users`).then(...)

// Supports destructuring as well:
const {SNOWPACK_PUBLIC_API_URL} = import.meta.env;
fetch(`${SNOWPACK_PUBLIC_API_URL}/users`).then(...)

// Instead of `import.meta.env.NODE_ENV` use `import.meta.env.MODE`
if (import.meta.env.MODE === 'development') {
  // ...
```

`import.meta.env.MODE` and `import.meta.env.NODE_ENV` are also both set to the current `process.env.NODE_ENV` value, so that you can change app behavior based on dev vs. build. The env value is set to `development` during `snowpack dev`, and `production` during `snowpack build`. Use this in your application instead of `process.env.NODE_ENV`.

You can also use environment variables in HTML files. All occurrences of `%SNOWPACK_PUBLIC_*%`, `%PUBLIC_URL%`, and `%MODE%` will be replaced at build time.

**Remember:** that these env variables are statically injected into your application for everyone at **build time**, and not runtime.
