---
layout: layouts/content.hmx
title: Plugin API
description: The Snowpack Plugin API and how to use it.
---

Looking to get started writing your own plugin? Check out our [Plugin Guide](/guides/plugins) for an overview of how plugins work and a walk-through to help you create your own.

Looking for a good summary? Check out our ["SnowpackPlugin" TypeScript definition](https://github.com/snowpackjs/snowpack/blob/main/snowpack/src/types.ts#L130) for a fully documented and up-to-date overview of the Plugin API and all supported options.

### Overview

```js
// my-first-snowpack-plugin.js
module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'my-first-snowpack-plugin',
    config() {
      console.log('Success!');
    },
  };
};

// To use this plugin, add it to your snowpack.config.js:
//
// "plugins": [
//   ["./my-first-snowpack-plugin.js", {/* pluginOptions */ }]
//  ]
```

A **Snowpack Plugin** is an object interface that lets you customize Snowpack's behavior. Snowpack provides different hooks for your plugin to connect to. For example, you can add a plugin to handle Svelte files, optimize CSS, convert SVGs to React components, run TypeScript during development, and much more.

Snowpack's plugin interface is inspired by [Rollup](https://rollupjs.org/). If you've ever written a Rollup plugin before, then hopefully these concepts and terms feel familiar.

### Lifecycle Hooks

#### config()

```js
config(snowpackConfig) {
  // modify or read from the Snowpack configuration object
}
```

Use this hook to read or make changes to the completed Snowpack configuration object. This is currently the recommended way to access the Snowpack configuration, since the one passed to the top-level plugin function is not yet finalized and may be incomplete.

#### load()

Load a file from disk and build it for your application. This is most useful for taking a file type that can't run in the browser (TypeScript, Sass, Vue, Svelte) and returning JS and/or CSS. It can even be used to load JS/CSS files directly from disk with a build step like Babel or PostCSS.

#### transform()

Transform a file's contents. Useful for making changes to all types of build output (JS, CSS, etc.) regardless of how they were originally loaded from disk.

#### run()

Run a CLI command, and connect it's output into the Snowpack console. Useful for connecting tools like TypeScript.

#### optimize()

Snowpack’s bundler plugin API is still experimental and may change in a future release. See our official bundler plugins for an example of using the current interface:

- Example: [@snowpack/plugin-webpack](https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-webpack)
- Example: [snowpack-plugin-rollup-bundle](https://github.com/ParamagicDev/snowpack-plugin-rollup-bundle)

#### onChange()

Get notified any time a watched file changes. This can be useful when paired with the `markChanged()` plugin method, to mark multiple files changed at once.

See [@snowpack/plugin-sass](https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-sass/plugin.js) for an example of how to use this method.

### Plugin Properties

#### knownEntrypoints

```
// Example: Svelte plugin needs to make sure this dependency can be loaded.
knownEntrypoints: ["svelte/internal"]
```

A list of any npm dependencies that are added as a part of `load()` or `transform()` that Snowpack will need to know about. Snowpack analyzes most dependency imports automatically when it scans the source code of a project, but some imports are added as a part of a `load()` or `transform()` step, which means that Snowpack would never see them. If your plugin does this, add them here.

#### resolve

```
// Example: Sass plugin compiles Sass files to CSS.
resolve: {input: [".sass"], output: [".css"]}

// Example: Svelte plugin compiles Svelte files to JS & CSS.
resolve: {input: [".svelte"], output: [".js", ".css"]}
```

If your plugin defines a `load()` method, Snowpack will need to know what files your plugin is responsible to load and what its output will look like. **`resolve` is needed only if you also define a `load()` method.**

- `input`: An array of file extensions that this plugin will load.
- `output`: The set of all file extensions that this plugin's `load()` method will output.
- [Full TypeScript definition](https://github.com/snowpackjs/snowpack/tree/main/snowpack/src/types/snowpack.ts).

### Plugin Methods

#### this.markChanged()

```js
// Called inside any plugin hooks
this.markChanged('/some/file/path.scss');
```

Manually mark a file as changed, regardless of whether the file changed on disk or not. This can be useful when paired with the `markChanged()` plugin hook, to mark multiple files changed at once.

- See [@snowpack/plugin-sass](https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-sass/plugin.js) for an example of how to use this method.
- [Full TypeScript definition](https://github.com/snowpackjs/snowpack/blob/main/snowpack/src/types.ts).
