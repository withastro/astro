---
layout: ~/layouts/MainLayout.astro
title: CLI Reference
---

## Commands

### `astro dev`

Runs the Astro development server. This starts an HTTP server that responds to requests for pages stored in `src/pages` (or which folder is specified in your [configuration](/reference/configuration-reference)).

**Flags**

#### `--port`

Specifies should port to run on. Defaults to `3000`.

### `astro build`

Builds your site for production.

### `astro preview`

Start a local static file server to serve your built `dist/` directory. Useful for previewing your static build locally, before deploying it.

This command is meant for local testing only, and is not designed to be run in production. For help with production hosting, check out our guide on [Deploying an Astro Website](/guides/deploy).

### `astro check`

Runs diagnostics (such as type-checking) against your project and reports errors to the console. If any errors are found the process will exit with a code of **1**.

This command is intended to be used in CI workflows.

## Global Flags

### `--config path`

Specify the path to the config file. Defaults to `astro.config.mjs`. Use this if you use a different name for your configuration file or have your config file in another folder.

```shell
astro --config config/astro.config.mjs dev
```

### `--project-root path`

Specify the path to the project root. If not specified the current working directory is assumed to be the root.

The root is used for finding the Astro configuration file.

```shell
astro --project-root examples/snowpack dev
```

### `--reload`

Clears the cache (dependencies are built within Astro apps).

### `--verbose`

Enables verbose logging, which is helpful when debugging an issue.

### `--silent`

Enables silent logging, which is helpful for when you don't want to see Astro logs.

### `--version`

Print the Astro version number and exit.

### `--help`

Print the help message and exit.
