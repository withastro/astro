---
layout: ../../layouts/content.astro
title: The Build Pipeline
description: Snowpack Build creates a production-ready website with or without a bundler
---

![build output example](/img/snowpack-build-example.png)

`snowpack build` - When you're ready to deploy your application, run the build command to generate a static production build of your site. Building is tightly integrated with your dev setup so that you are guaranteed to get a near-exact copy of the same code that you saw during development.

### Bundle for Production

**You should be able to use a bundler because you want to, and not because you need to.** That was the original concept that Snowpack was designed to address. Snowpack treats bundling as an optional production optimization, which means you're free to skip over the extra complexity of bundling until you need it.

By default, `snowpack build` will build your site using the same unbundled approach as the `dev` command. This is fine for most projects, but you also may still want to bundle for production. Legacy browser support, code minification, code-splitting, tree-shaking, dead code elimination, and other performance optimizations can all be handled in Snowpack via bundling.

Bundlers normally require dozens or even hundreds of lines of configuration, but with Snowpack it's just a one-line plugin with no config required. This is possible because Snowpack builds your application _before_ sending it to the bundler, so the bundler never sees your custom source code (JSX, TS, Svelte, Vue, etc.) and instead needs to worry only about building common HTML, CSS, and JS.

```js
// Bundlers plugins are pre-configured to work with Snowpack apps.
// No config required!
{
  "plugins": [["@snowpack/plugin-webpack"]]
}
```

See [our bundling guides](/guides/optimize-and-bundle) for more information about connecting bundled (or unbundled) optimization plugins for your production builds.

## Legacy Browser Support

You can customize the set of browsers you'd like to support via the `package.json` "browserslist" property, going all the way back to IE11. This will be picked up when you run `snowpack build` to build for production.

```js
/* package.json */
"browserslist": ">0.75%, not ie 11, not UCAndroid >0, not OperaMini all",
```

If you're worried about legacy browsers, you should also add a bundler to your production build. Check out our [section on bundling for deployment](/guides/optimize-and-bundle) for more info.

Note: During development (`snowpack dev`) we perform no transpilation for older browsers. Make sure that you're using a modern browser during development.
