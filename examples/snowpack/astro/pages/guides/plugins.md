---
layout: ../../layouts/content.astro
title: Creating Your Own Plugin
description: Learn the basics of our Plugin API through working examples.
---

A **Snowpack plugin** lets you extend Snowpack with new behaviors. Plugins can hook into different stages of the Snowpack build pipeline to add support for new file types and your favorite dev tools. Add plugins to support Svelte, compile Sass to CSS, convert SVGs to React components, bundle your final build, type check during development, and much more.

This guide takes you though creating and publishing your first plugin.

- The basic structure of Snowpack plugins
- How to choose the right hooks from the Snowpack Plugin API
- How to publish your plugin and add it to our [Plugin](/plugins) directory

Prerequisites: Snowpack plugins are written in JavaScript and run via Node.js so basic knowledge of both is required.

## Creating and testing your first plugin

In this step you'll create a simple plugin scaffold that you can turn into a fuctional plugin based on the examples in the guide.

Create a directory for your plugin called `my-snowpack-plugin` and inside it create a `my-snowpack-plugin.js` file:

```js
// my-snowpack-plugin.js
// Example: a basic Snowpack plugin file, customize the name of the file and the value of the name in the object
// snowpackConfig = The Snowpack configuration object
// pluginOptions = user-provided configuration options
module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'my-snowpack-plugin',
  };
};
```

To test your new plugin, run `npm init` to create a basic `package.json` then run `npm link` in your plugin’s directory to expose the plugin globally (on your development machine).

For testing, [create a new, example Snowpack project](/tutorials/getting-started) in a different directory. In your example Snowpack project, run `npm install && npm link my-snowpack-plugin` (use the name from your plugin’s `package.json`).

> The alternative would be to use `npm install --save-dev path_to_your_plugin`, which would create the "symlink-like" entry in your example Snowpack project’s `package.json`

In your example Snowpack project, add your plugin to the `snowpack.config.js` along with any plugin options you’d like to test:

```js
// snowpack.config.js
// Example: enabling a Snowpack plugin called "my-snowpack-plugin"
{
  "plugins": [
    "my-snowpack-plugin"
  ]
}
```

## Testing and Troubleshooting

- TODO: create a full how to test procedure
- HINT: Add `--verbose` to the command to see the steps, e.g. `snowpack dev --verbose` or `snowpack build --verbose`

## Adding user-configurable options to your plugin

TODO make this a real example
In this step, you'll learn how to add user-configurable options to your plugin and to use them in your plugin code.

In your example Snowpack project, instead of enabling the plugin as a string containing the plugin name, use an array. The first item is name of your plugin and the second a new object containing the plugin options.

```diff
// snowpack.config.js
{
  "plugins": [
-    "my-snowpack-plugin"
+    ["my-snowpack-plugin", { "optionA": "foo", "optionB": true }]
  ]
}
```

You access these through the `pluginOptions`

```diff
// my-snowpack-plugin.js
module.exports = function (snowpackConfig, pluginOptions) {
+ let optionA = pluginOptions.optionA
+ let optionB = pluginOptions.optionB
  return {
    name: 'my-snowpack-plugin'
  };
};
```

### Plugin Use-Cases

Snowpack uses an internal **Build Pipeline** to build files in your application for development and production. Every source file passes through the build pipeline, which means that Snowpack can build more than just JavaScript. Images, CSS, SVGs and more can all be built by Snowpack.

#### Build Plugins

Snowpack finds the first plugin that claims to `resolve` the given file. It then calls that plugin's `load()` method to load the file into your application. This is where compiled languages (TypeScript, Sass, JSX, etc.) are loaded and compiled to something that can run on the web (JS, CSS, etc).

#### Transform Plugins

Once loaded, every file passes through the build pipeline again to run through matching `transform()` methods of all plugins that offer the method. Plugins can transform a file to modify its contents before finishing the file build.

#### Dev Tooling Plugins

Snowpack plugins support a `run()` method which lets you run any CLI tool and connect its output into Snowpack. You can use this to run your favorite dev tools (linters, TypeScript, etc.) with Snowpack and automatically report their output back through the Snowpack developer console. If the command fails, you can optionally fail your production build.

#### Bundler Plugins

Snowpack builds you a runnable, unbundled website by default, but you can optimize this final build with your favorite bundler (webpack, Rollup, Parcel, etc.) through the plugin `optimize()` method. When a bundler plugin is used, Snowpack will run the bundler on your build automatically to optimize it.

See our official [@snowpack/plugin-webpack](https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-webpack) bundler plugin for an example of using the current interface.

### Example: Getting Started

To create a Snowpack plugin, you can start with the following file template:

```js
// my-snowpack-plugin.js
module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'my-snowpack-plugin',
    // ...
  };
};
```

```json
// snowpack.config.json
{
  "plugins": [
    ["./my-snowpack-plugin.js", { "optionA": "foo", "optionB": "bar" }]
  ]
}
```

A Snowpack plugin should be distributed as a function that can be called with plugin-specific options to return a plugin object.
Snowpack will automatically call this function to load your plugin. That function accepts 2 parameters, in this order:

1. the [Snowpack configuration object](/reference/configuration) (`snowpackConfig`)
1. (optional) user-provided config options (`pluginOptions`)

### Example: Transform a File

For our first example, we’ll look at transforming a file.

```js
module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'my-commenter-plugin',
    async transform({ id, contents, isDev, fileExt }) {
      if (fileExt === '.js') {
        return `/* I’m a comment! */ ${contents}`;
      }
    },
  };
};
```

The object returned by this function is a **Snowpack Plugin**. A plugin consists of a `name` property and some hooks into the Snowpack lifecycle to customizes your build pipeline or dev environment. In the example above we have:

- The **name** property: The name of your plugin. This is usually the same as your package name if published to npm.
- The **transform** method: A function that allows you to transform & modify built files. In this case, we add a simple comment (`/* I’m a comment */`) to the beginning of every JS file in your build.

This covers the basics of single-file transformations. In our next example, we’ll show how to compile a source file and change the file extension in the process.

### Example: Build From Source

When you build files from source, you also have the ability to transform the file type from source code to web code. In this example, we'll use Babel to load several types of files as input and output JavaScript in the final build:

```js
const babel = require('@babel/core');

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'my-babel-plugin',
    resolve: {
      input: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
      output: ['.js'],
    },
    async load({ filePath }) {
      const result = await babel.transformFileAsync(filePath);
      return result.code;
    },
  };
};
```

This is a simplified version of the official Snowpack Babel plugin, which builds all JavaScript, TypeScript, and JSX files in your application with the `load()` method.

The `load()` method is responsible for loading and build files from disk while the `resolve` property tells Snowpack which files the plugin can load and what to expect as output. In this case, the plugin claims responsibility for files matching any of the file extensions found in `resolve.input`, and outputs `.js` JavaScript (declared via `resolve.output`).

**See it in action:** Let's say that we have a source file at `src/components/App.jsx`. Because the `.jsx` file extension matches an extension in our plugin's `resolve.input` array, Snowpack lets this plugin claim responsibility for loading this file. `load()` executes, Babel builds the JSX input file from disk, and JavaScript is returned to the final build.

### Example: Multi-File Building

For a more complicated example, we’ll take one input file (`.svelte`) and use it to generate 2 output files (`.js` and `.css`).

```js
const fs = require('fs').promises;
const svelte = require('svelte/compiler');

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'my-svelte-plugin',
    resolve: {
      input: ['.svelte'],
      output: ['.js', '.css'],
    },
    async load({ filePath }) {
      const fileContents = await fs.readFile(filePath, 'utf-8');
      const { js, css } = svelte.compile(fileContents, { filename: filePath });
      return {
        '.js': js && js.code,
        '.css': css && css.code,
      };
    },
  };
};
```

This is a simplified version of the official Snowpack Svelte plugin. Don't worry if you're not familiar with Svelte, just know that building a Svelte file (`.svelte`) generates both JS & CSS for our final build.

In that case, the `resolve` property takes only a single `input` file type (`['.svelte']`) but two `output` file types (`['.js', '.css']`). This matches the result of Svelte's build process and the returned entries of our `load()` method.

**See it in action:** Let's say that we have a source file at `src/components/App.svelte`. Because the `.svelte` file extension matches an extension in our plugin's `resolve.input` array, Snowpack lets this plugin claim responsibility for loading this file. `load()` executes, Svelte builds the file from disk, and both JavaScript & CSS are returned to the final build.

Notice that `.svelte` is missing from `resolve.output` and isn't returned by `load()`. Only the files returned by the `load()` method are included in the final build. If you wanted your plugin to keep the original source file in your final build, you could add `{ '.svelte': contents }` to the return object.

### Example: Server-Side Rendering (SSR)

Plugins can produce server-optimized code for SSR via the `load()` plugin hook. The `isSSR` flag tells the plugin that Snowpack is requesting your file for the server, and that it will expect a response that will run on the server.

Some frameworks/languages (like React) run the same code on both the browser and the server. Others (like Svelte) will create different output for the server than the browser. In the example below, we use the `isSSR` flag to tell the Svelte compiler to generate server-optimized code when requested by Snowpack.

```js
const svelte = require('svelte/compiler');
const fs = require('fs');

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'basic-svelte-plugin',
    resolve: {
      input: ['.svelte'],
      output: ['.js', '.css'],
    },
    async load({ filePath, isSSR }) {
      const svelteOptions = {
        /* ... */
      };
      const codeToCompile = fs.readFileSync(filePath, 'utf-8');
      const result = svelte.compile(codeToCompile, {
        ...svelteOptions,
        ssr: isSSR,
      });
      // ...
    },
  };
};
```

If you're not sure if your plugin needs special SSR support, you are probably fine to skip this and ignore the `isSSR` flag in your plugin. Many languages won't need this, and SSR is always an intentional opt-in by the user.

### Example: Optimizing & Bundling

Snowpack supports pluggable bundlers and other build optimizations via the `optimize()` hook. This method runs after the build and gives plugins a chance to optimize the final build directory. Webpack, Rollup, and other build-only optimizations should use this hook.

```js
module.exports = function(snowpackConfig, pluginOptions) {
  return {
    name: 'my-custom-webpack-plugin',
    async optimize({ buildDirectory }) {
      await webpack.run({...});
    }
  };
};
```

This is an (obviously) simplified version of the `@snowpack/plugin-webpack` plugin. When the build command has finished building your application, this plugin hook is called with the `buildDirectory` path as an argument. It's up to the plugin to read build files from this directory and write any changes back to the directory. Changes should be made in place, so write files only at the end and be sure to clean up after yourself (if a file is no longer needed after optimizing/bundling, it is safe to remove).

### Testing

To develop and test a Snowpack plugin, the strategy is the same as with other npm packages:

- Create your new plugin project (either with `npm init` or `yarn init`) with, for example, npm name: `my-snowpack-plugin` and paste in it the above-mentioned code snipped
- Run `npm link` in your plugin’s project folder to expose the plugin globally (in regard to your development machine).
- Create a new, example Snowpack project in a different location for testing
- In your example Snowpack project, run `npm install && npm link my-snowpack-plugin` (use the name from your plugin’s `package.json`).
  - Be aware that `npm install` will remove your linked plugin, so on any install, you will need to redo the `npm link my-snowpack-plugin`.
  - (The alternative would be to use `npm install --save-dev &lt;folder_to_your_plugin_project&gt;`, which would create the "symlink-like" entry in your example Snowpack project’s `package.json`)

In your example Snowpack project, add your plugin to the `snowpack.config.json` along with any plugin options you’d like to test:

```json
{
  "plugins": [
    ["my-snowpack-plugin", { "option-1": "testing", "another-option": false }]
  "
}
```

### Publishing a Plugin

To share a plugin with the world, you can publish it to npm. For example, take a look at [snowpack-plugin-starter-template](https://github.com/snowpackjs/snowpack-plugin-starter-template) which can get you up-and-running quickly. You can either copy this outright or simply take what you need.

In general, make sure to mind the following checklist:

- ✔️ Your `package.json` file has a `main` entry pointing to the final build
- ✔️ Your code is compiled to run on Node >= 10
- ✔️ Your package README contains a list of custom options, if your plugin is configurable

### Tips / Gotchas

- Remember: A source file will always be loaded by the first `load()` plugin to claim it, but the build result will be run through every `transform` function.
- Snowpack will always keep the original file name (`App`) and only ever change the extension in the build.
- Extensions in Snowpack always have a leading `.` character (e.g. `.js`, `.ts`). This is to match Node’s `path.extname()` behavior, as well as make sure we’re not matching extension substrings (e.g. if we matched `js` at the end of a file, we also don’t want to match `.mjs` files by accident; we want to be explicit there).
- The `resolve.input` and `resolve.output` file extension arrays are vital to how Snowpack understands your build pipeline, and are always required for `load()` to run correctly.
- If `load()` doesn't return anything, the file isn’t loaded and the `load()` of the next suitable plugin is called.
- If `transform()` doesn't return anything, the file isn’t transformed.
- If you want to build a plugin that runs some code only on initialization (such as `@snowpack/plugin-dotenv`), put your side-effect code inside the function that returns your plugin. But be sure to still return a plugin object. A simple `{ name }` object will do.
