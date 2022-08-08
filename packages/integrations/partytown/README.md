# @astrojs/partytown 🎉

This **[Astro integration][astro-integration]** enables [Partytown](https://partytown.builder.io/) in your Astro project.


- <strong>[Why Astro Partytown](#why-astro-partytown)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Astro Partytown

Partytown is a lazy-loaded library to help relocate resource intensive scripts into a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API), and off of the [main thread](https://developer.mozilla.org/en-US/docs/Glossary/Main_thread).

If you're using third-party scripts for things like analytics or ads, Partytown is a great way to make sure that they don't slow down your site.

The Astro Partytown integration installs Partytown for you and makes sure it's enabled on all of your pages.

## Installation

### Quick Install
  
The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.
  
```sh
# Using NPM
npx astro add partytown
# Using Yarn
yarn astro add partytown
# Using PNPM
pnpx astro add partytown
```
  
Then, restart the dev server by typing `CTRL-C` and then `npm run astro dev` in the terminal window that was running Astro.
  
Because this command is new, it might not properly set things up. If that happens, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Manual Install
  
First, install the `@astrojs/partytown` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/partytown
```
Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import partytown from '@astrojs/partytown';

export default defineConfig({
  // ...
  integrations: [partytown()],
})
```
  
Then, restart the dev server.

## Usage

Partytown should be ready to go with zero config. If you have an existing 3rd party script on your site, try adding the `type="text/partytown"` attribute:

```diff
-  <script src="fancy-analytics.js"></script>
+  <script type="text/partytown" src="fancy-analytics.js"></script>
```

If you open the "Network" tab from [your browser's dev tools](https://developer.chrome.com/docs/devtools/open/), you should see the `partytown` proxy intercepting this request.

## Configuration

To configure this integration, pass a 'config' object to the `partytown()` function call in `astro.config.mjs`.

__`astro.config.mjs`__
```js
...
export default defineConfig({
  integrations: [partytown({
    config: {
      //options go here
    }
  })]
});
```

This mirrors the [Partytown config object](https://partytown.builder.io/configuration), but only `debug` and `forward` are exposed by this integration.

### config.debug

Partytown ships with a `debug` mode; enable or disable it by passing `true` or `false` to `config.debug`. If [`debug` mode](https://partytown.builder.io/debugging) is enabled, it will output detailed logs to the browser console. 

If this option isn't set, `debug` mode will be on by default in [dev](https://docs.astro.build/en/reference/cli-reference/#astro-dev) or [preview](https://docs.astro.build/en/reference/cli-reference/#astro-preview) mode. 

__`astro.config.mjs`__

```js
export default defineConfig({
  integrations: [partytown({
    // Example: Disable debug mode.
    config: { debug: false },
  
})
```

### config.forward
  
  Third-party scripts typically add variables to the `window` object so that you can communicate with them throughout your site. But when a script is loaded in a web-worker, it doesn't have access to that global `window` object.

  To solve this, Partytown can "patch" variables to the global window object and forward them to the appropriate script.

  You can specify which variables to forward with the `config.forward` option. [Read more in Partytown's documentation.](https://partytown.builder.io/forwarding-events)


__`astro.config.mjs`__

```js
export default defineConfig ({
  integrations: [partytown({
    // Example: Add dataLayer.push as a forwarding-event.
    config: { 
      forward: ["dataLayer.push"] 
    },
  })],
})
```

## Examples

- [Browse projects with Astro Partytown on GitHub](https://github.com/search?q=%22@astrojs/partytown%22+filename:package.json&type=Code) for more examples! 

## Troubleshooting

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
