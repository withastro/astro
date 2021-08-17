---
layout: ../../layouts/content.astro
title: Quick Start
description: A very basic guide for developers who want to run Snowpack as quickly as possible.
---

### Install Snowpack

```bash
# npm:
npm install --save-dev snowpack
# yarn:
yarn add --dev snowpack
# pnpm:
pnpm add --save-dev snowpack
```

### Run the Snowpack CLI

```bash
npx snowpack [command]
yarn run snowpack [command]
pnpm run snowpack [command]
```

Throughout our documentation, we'll use `snowpack [command]` to document the CLI. To run your locally installed version of Snowpack, add the `npx`/`yarn run`/`pnpm run` prefix of the package manager that you used to install Snowpack.

For long-term development, the best way to use Snowpack is with a package.json script. This reduces your own need to remember exact Snowpack commands/configuration, and lets you share some common scripts with the rest of your team (if applicable).

```js
// Recommended: package.json scripts
// npm run dev (or: "yarn run ...", "pnpm run ...")
"scripts": {
    "dev": "snowpack dev",
    "build": "snowpack build"
}
```

### Serve your project locally

```
snowpack dev
```

This starts the local dev server for development. By default this serves your current working directory to the browser, and will look for an `index.html` file to start. You can customize which directories you want to serve via the ["mount"](/reference/configuration) configuration.

### Build your project

```
snowpack build
```

This builds your project into a static `build/` directory that you can deploy anywhere. You can customize your build via [configuration](/reference/configuration).

### See all commands & options

```
snowpack --help
```

The `--help` flag will display helpful output.
