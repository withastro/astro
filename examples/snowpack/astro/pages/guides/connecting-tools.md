---
layout: layouts/content.astro
title: The Snowpack Guide to connecting your favorite tools
description: 'How do you use your favorite tools in Snowpack? This Guide will help you get started'
published: true
---

One of the most common questions we get is "How do I connect my favorite tool to Snowpack?" In this guide we'll go over the three different ways that you can integrate third-party tooling into your Snowpack dev environment or build pipeline:

- Snowpack plugin
- Integrated CLI script (via `@snowpack/plugin-run-script`)
- Run separately, outside of Snowpack (ex: in your `package.json`)

## Integrating a Tool With a Snowpack Plugin

The best way to connect a new tool to Snowpack is to search our [plugin catalog](/plugins) for a relevant plugin. Most likely, someone already created a plugin to help you integrate your favorite tool with ease.

To add a plugin first install using your package manager, then add the plugin name to the `plugins` section in your Snowpack configuration file. Many plugins have their own totally optional configuration options. These are covered in each plugin's documentation.

For example, if you'd like to use sass, you can install [`@snowpack/plugin-sass`
](https://www.npmjs.com/package/@snowpack/plugin-sass) with npm:

```bash
npm install @snowpack/plugin-sass
```

Then if you don't already have a Snowpack configuration file (`snowpack.config.js`) you can create one with this command:

```bash
snowpack init
```

Open up `snowpack.config.js` and add the name of your new plugin to the plugins object:

```diff
// snowpack.config.js
  plugins: [
-    /* ... */
+ '@snowpack/plugin-sass'
  ],
```

What about the other optional configuration options? [The `@snowpack/plugin-sass` documentation](https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-sass) lists all the options and where to put them in the `snowpack.config.js` file. If I wanted the `compressed` output `style` I'd turn the `@snowpack/plugin-sass` value into an array with an object containing the configuration:

```diff
// snowpack.config.js
  plugins: [
- '@snowpack/plugin-sass'
+ ['@snowpack/plugin-sass', { style: 'compressed'}]
  ],
```

If there isn't a plugin yet, you might be interested in making one. Check out our [Plugin API](/reference/plugins)

## Connect any other Script/CLI using plugin-run-script and plugin-build-script

If you can't find a plugin that fits your needs and don't want to write your own, you can also run CLI commands directly as a part of your build using one of our two utility plugins: `@snowpack/plugin-build-script` & `@snowpack/plugin-run-script`.

#### @snowpack/plugin-build-script

```js
// snowpack.config.json
// [npm install @snowpack/plugin-build-script]
{
  "plugins": [
    ["@snowpack/plugin-build-script", { "cmd": "postcss", "input": [".css"], "output": [".css"]}]
  ],
}
```

This plugin allows you to connect any CLI into your build process. Just give it a `cmd` CLI command that can take input from `stdin` and emit the build result via `stdout`. Check out the [plugin documentation](https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-build-script) for more information.

#### @snowpack/plugin-run-script

```js
// snowpack.config.json
// [npm install @snowpack/plugin-run-script]
{
  "plugins": [
    ["@snowpack/plugin-run-script", { "cmd": "eleventy", "watch": "$1 --watch" }]
  ],
}
```

This plugin allows you to run any CLI command as a part of your dev and build workflow. This plugin doesn't affect your build output, but it is useful for connecting developer tooling directly into Snowpack. Use this to add meaningful feedback to your dev console as you type, like TypeScript type-checking and ESLint lint errors. This doesn't affect how Snowpack builds your site. Check out the [plugin documentation](https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-run-script) for more information.

### Examples

#### PostCSS

```js
// snowpack.config.json
"plugins": [
  ["@snowpack/plugin-build-script", {"cmd": "postcss", "input": [".css"], "output": [".css"]}]
]
```

The [`postcss-cli`](https://github.com/postcss/postcss-cli) package must be installed manually. You can configure PostCSS with a `postcss.config.js` file in your current working directory.

#### ESLint

```js
// snowpack.config.json
"plugins": [
  ["@snowpack/plugin-run-script", {
    "cmd": "eslint src --ext .js,jsx,.ts,.tsx",
    // Optional: Use npm package "eslint-watch" to run on every file change
    "watch": "esw -w --clear src --ext .js,jsx,.ts,.tsx"
  }]
]
```
