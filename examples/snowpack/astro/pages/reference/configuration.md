---
layout: layouts/content.hmx
title: snowpack.config.js
description: The Snowpack configuration API reference.
---

```js
// Example: snowpack.config.js
// The added "@type" comment will enable TypeScript type information via VSCode, etc.

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  plugins: [
    /* ... */
  ],
};
```

To generate a basic configuration file scaffold in your Snowpack project run `snowpack init`.

## root

**Type**: `string`  
**Default**: `/`

Specify the root of a project using Snowpack. (Previously: `config.cwd`)

## workspaceRoot

**Type**: `string`

Specify the root of your workspace or monorepo, if you are using one. When configured, Snowpack will treat any sibling packages in your workspace like source files, and pass them through your unbundled Snowpack build pipeline during development. This allows for fast refresh, HMR support, file change watching, and other dev improvements when working in monorepos.

When you build your site for production, symlinked packages will be treated like any other package, bundled and tree-shaken into single files for faster loading.

## install

Deprecated! Moved to `packageOptions.knownEntrypoints`

## extends

**Type**: `string`

Inherit from a separate "base" config.

Can be a relative file path, an npm package, or a file within an npm package. Your configuration will be merged on top of the extended base config.

## exclude

**Type**: `string[]`  
**Default**: `['**/node_modules/**/*']`

Exclude any files from the Snowpack pipeline.

Supports glob pattern matching.

## mount

```
mount: {
  [path: string]: string | {url: string, resolve: boolean, static: boolean}
}
```

Mount local directories to custom URLs in your built application.

- `mount.url` | `string` | _required_ : The URL to mount to, matching the string in the simple form above.
- `mount.static` | `boolean` | _optional_ | **Default**: `false` : If true, don't build files in this directory. Copy and serve them directly from disk to the browser.
- `mount.resolve` | `boolean` | _optional_ | **Default**: `true`: If false, don't resolve JS & CSS imports in your JS, CSS, and HTML files. Instead send every import to the browser, as written.
-

Example:

```js
// snowpack.config.js
// Example: Basic "mount" usage
{
  "mount": {
    "src": "/dist",
    "public": "/"
  }
}
```

You can further customize this the build behavior for any mounted directory by using the expanded object notation:

 <!-- snowpack/src/config.ts -->

```js
// snowpack.config.js
// Example: expanded object notation "mount" usage
{
  "mount": {
    // Same behavior as the "src" example above:
    "src": {url: "/dist"},
    // Mount "public" to the root URL path ("/*") and serve files with zero transformations:
    "public": {url: "/", static: true, resolve: false}
  }
}
```

## alias

**Type**: `object` (package: package or path)

Configure import aliases for directories and packages.

Note: In an older version of Snowpack, all mounted directories were also available as aliases by **Default**. As of Snowpack 2.7, this is no longer the case and no aliases are defined by **Default**.

```js
// snowpack.config.js
// Example: alias types
{
  alias: {
    // Type 1: Package Import Alias
    "lodash": "lodash-es",
    "react": "preact/compat",
    // Type 2: Local Directory Import Alias (relative to cwd)
    "components": "./src/components"
    "@app": "./src"
  }
}
```

## plugins

**Type**: `array` containing pluginName `string` or an array [`pluginName`, {`pluginOptions`}

Enable Snowpack plugins and their options.

Also see our [Plugin guide](/guides/plugins)

```js
// snowpack-config.js
// Example: enable plugins both simple and expanded
{
  plugins: [
    // Simple format: no options needed
    'plugin-1',
    // Expanded format: allows you to pass options to the plugin
    ['plugin-2', { 'plugin-option': false }],
  ];
}
```

## devOptions

**Type**: `object` (option name: value)

Configure the Snowpack dev server.

### devOptions.secure

**Type**: `boolean`  
**Default**: `false`

Toggles whether Snowpack dev server should use HTTPS with HTTP2 enabled.

### devOptions.hostname

**Type**: `string`  
**Default**: `localhost`

The hostname that the dev server is running on. Snowpack uses this information to configure the HMR websocket and properly open your browser on startup (see: [`devOptions.open`](#devoptions.open)).

### devOptions.port

**Type**: `number`  
**Default**: `8080`

The port the dev server runs on.

### devOptions.fallback

**Type**: `string`  
**Default**: `"index.html"`

The HTML file to serve for non-resource routes.

When using the Single-Page Application (SPA) pattern, this is the HTML "shell" file that gets served for every (non-resource) user route.

⚠️ Make sure that you configure your production servers to serve this.

### devOptions.open

**Type**: `string`  
**Default**: `"**Default**"`

Configures how the dev server opens in the browser when it starts.

Any installed browser, e.g., "chrome", "firefox", "brave". Set "none" to disable.

### devOptions.output

**Type**: `"stream" | "dashboard"`  
**Default**: `"dashboard"`

Set the output mode of the `dev` console:

- `"dashboard"` delivers an organized layout of console output and the logs of any connected tools. This is recommended for most users and results in the best logging experience.
- `"stream"` is useful when Snowpack is run in parallel with other commands, where clearing the shell would clear important output of other commands running in the same shell.

### devOptions.hmr

**Type**: `boolean`  
**Default**: `true`

Toggles HMR on the Snowpack dev server.

### devOptions.hmrDelay

**Type**: `number` (milliseconds)  
**Default**: `0`

Milliseconds to delay HMR-triggered browser update.

### devOptions.hmrPort

**Type**: `number`  
**Default**: [`devOptions.port`](#devoptions.port)

The port where Snowpack's HMR Websocket runs.

### devOptions.hmrErrorOverlay

**Type**: `boolean`  
**Default**: `true`

Toggles a browser overlay that displays JavaScript runtime errors when running HMR.

### devOptions.out

**Type**: `string`  
**Default**: `"build"`

_NOTE:_ Deprecated, see `buildOptions.out`.

## installOptions

**Type**: `object`

_NOTE:_ Deprecated, see `packageOptions`.

## packageOptions

**Type**: `object`

Configure how npm packages are installed and used.

### packageOptions.external

**Type**: `string[]`  
**Example**: `"external": ["fs"]`

Mark some imports as external. Snowpack will ignore these imports and leave them as-is in your final build.

This is an advanced feature: Bare imports are not supported in any major browser, so an ignored import will usually fail when sent directly to the browser. This will most likely fail unless you have a specific use-case that requires it.

### packageOptions.source

**Type**: `"local" | "remote"`  
**Default**: `"local"`
**Example**: `"source": "local"`

Your JavaScript npm packages can be consumed in two different ways: **local** and **remote**. Each mode supports a different set of package options. You can choose between these two different modes by setting the `packageOptions.source` property.

### packageOptions.source=local

Load your dependencies from your local `node_modules/` directory. Install and manage your dependencies using `npm` (or any other npm-ready package manager) and a project `package.json` file.

This is traditional Snowpack behavior matching Snowpack v2. This mode is recommended for anyone already using npm to manage their frontend dependencies.

#### packageOptions.knownEntrypoints

**Type**: `string[]`

Known dependencies to install with Snowpack. Used for installing packages any dependencies that cannot be detected by our automatic import scanner (ex: package CSS files).

#### packageOptions.polyfillNode

**Type**: `boolean`  
**Default**: `false`

This will automatically polyfill any Node.js dependencies as much as possible for the browser

Converts packages that depend on Node.js built-in modules (`"fs"`, `"path"`, `"url"`, etc.). You can see the full list of supported polyfills at the [rollup-plugin-node-polyfills documentation](https://github.com/ionic-team/rollup-plugin-node-polyfills)

If you'd like to customize this polyfill behavior, you can provide your own Rollup plugin for the installer:

```js
// Example: If `--polyfill-node` doesn't support your use-case, you can provide your own custom Node.js polyfill behavior
module.exports = {
  packageOptions: {
    polyfillNode: false,
    rollup: {
      plugins: [require('rollup-plugin-node-polyfills')({crypto: true, ...})],
    },
  },
};
```

When `source="remote"`, Node.js polyfills are always provided. Configuring this option is only supported in `source="local"` mode.

#### packageOptions.env

**Type**: `{[ENV_NAME: string]: (string true)}`

Sets a `process.env.` environment variable inside the installed dependencies.

If set to true (ex: `{NODE_ENV: true}` or `--env NODE_ENV`) this will inherit from your current shell environment variable. Otherwise, set to a string (ex: `{NODE_ENV: 'production'}` or `--env NODE_ENV=production`) to set the exact value manually.

This option is only supported in `source="local"` mode. `source="remote"` does not support this feature yet.

#### packageOptions.packageLookupFields

**Type**: `string[]`  
**Example**: `"packageLookupFields": ["svelte"]`

Set custom lookup fields for dependency `package.json` file entrypoints, in addition to the defaults like "module", "main", etc.

This option is only supported in `source="local"` mode. `source="remote"` does not support this feature yet.

#### packageOptions.packageExportLookupFields

**Type**: `string[]`  
**Example**: `"packageExportLookupFields": ["svelte"]`

Set custom lookup fields for dependency `package.json` ["exports" mappings.](https://nodejs.org/api/packages.html#packages_package_entry_points)

This option is only supported in `source="local"` mode. `source="remote"` does not support this feature yet.

#### packageOptions.rollup

**Type**: `Object`

Allows customization of Snowpack's internal Rollup configuration.

Snowpack uses Rollup internally to install your packages. This `rollup` config option gives you deeper control over the internal Rollup configuration that we use.

- packageOptions.rollup.plugins | `RollupPlugin[]` - Provide an array of custom Rollup plugins that will run on every installed package. Useful for dealing with non-standard file types in your npm packages.
- packageOptions.rollup.dedupe | `string[]` - If needed, deduplicate multiple versions/copies of a packages to a single one. This helps prevent issues with some packages when multiple versions are installed from your node_modules tree. See [rollup-plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve#usage) for more documentation.
- packageOptions.rollup.context | `string` - Specify top-level `this` value. Useful to silence install errors caused by legacy common.js packages that reference a top-level this variable, which does not exist in a pure ESM environment. Note that the `'THIS_IS_UNDEFINED'` warning ("'this' keyword is equivalent to 'undefined' ... and has been rewritten") is silenced by default, unless `--verbose` is used.

This option is only supported in `source="local"` mode. `source="remote"` does not support custom Rollup install options.

### packageOptions.source=remote

Enable streaming package imports. Load dependencies from our remote CDN. Manage your dependencies using `snowpack` and a project `snowpack.deps.json` file.

[Learn more about Streaming Remote Imports](/guides/streaming-imports).

#### packageOptions.origin

**Type**: `string`  
**Default**: `https://pkg.snowpack.dev`

The remote origin to import packages from. When you import a new package, Snowpack will fetch those resources from this URL.

Currently, the origin must implement a specific response format that Snowpack can parse for ESM. In future versions of Snowpack we plan to add support for custom CDNs and import origins.

#### packageOptions.cache

**Type**: `string`  
**Default**: `.snowpack`

The location of your project cache folder, relative to the project root. Snowpack will save cached data to this folder. For example, if `packageOptions.types` is set to true, Snowpack will save TypeScript types to a `types` directory within this folder.

#### packageOptions.types

**Type**: `boolean`  
**Default**: `false`

If true, Snowpack will download TypeScript types for every package.

## buildOptions

**Type**: `object` (option name: value)

Configure your final build.

### buildOptions.out

**Type**: `string`
**Default**: `"build"`

The local directory that we output your final build to.

### buildOptions.baseUrl

**Type**: `string`  
**Default**: `/`

In your HTML, replace all instances of `%PUBLIC_URL%` with this

Inspired by the same [Create React App](https://create-react-app.dev/docs/using-the-public-folder/) concept. This is useful if your app will be deployed to a subdirectory.

### buildOptions.clean

**Type**: `boolean`  
**Default**: `true`

Set to `false` to prevent Snowpack from deleting the build output folder (`buildOptions.out`) between builds.

### buildOptions.webModulesUrl

_NOTE:_ Deprecated, see `buildOptions.metaUrlPath`.

### buildOptions.metaDir

_NOTE:_ Deprecated, see `buildOptions.metaUrlPath`.

### buildOptions.metaUrlPath

**Type**: `string`  
**Default**: `_snowpack`

Rename the default directory for Snowpack metadata. In every build, Snowpack creates meta files for loading things like [HMR](/concepts/hot-module-replacement), [Environment Variables](/reference/environment-variables), and your built npm packages.

When you build your project, this will be a path on disk relative to the `buildOptions.out` directory.

### buildOptions.sourcemap

**Type**: `boolean`  
**Default**: `false`

Generates source maps.

**_Experimental:_** Still in progress, you may encounter some issues when using source maps until this support is finalized.

### buildOptions.watch

**Type**: `boolean`  
**Default**: `false`

Run Snowpack's build pipeline through a file watcher. This option works best for local development when you have a custom frontend server (ex: Rails, PHP, etc.) and the Snowpack dev server cannot be used.

### buildOptions.htmlFragments

**Type**: `boolean`  
**Default**: `false`

Toggles whether HTML fragments are transformed like full HTML pages.

HTML fragments are HTML files not starting with "<!doctype html>".

### buildOptions.jsxFactory

**Type**: `string`  
**Default**: `React.createElement` (or `h` if Preact import is detected)

Set the name of the function used to create JSX elements.

### buildOptions.jsxFragment

**Type**: `string`  
**Default**: `React.Fragment` (or `Fragment` if Preact import is detected)

Set the name of the function used to create JSX fragments.

## testOptions

Configure your tests.

### testOptions.files

**Type**: `string[]`  
**Default**: `["__tests__/**/*", "**/*.@(spec|test).*"]`

Specifies your test files. If `NODE_ENV` is set to "test", Snowpack includes these files in your site build and scan them for installable dependencies. Otherwise, Snowpack excludes these files.

## experiments

**Type**: `object` (option name: value)

This section is currently empty! In the future, this section may be used for experimental and not yet finalized.
