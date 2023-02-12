# @astrojs/windi 💨

This **[Astro integration][astro-integration]** brings [Windi CSS's](https://windicss.org//) utility CSS classes to every `.astro` file and [framework component](https://docs.astro.build/en/core-concepts/framework-components/) in your project.

- <strong>[Why Windi](#why-windi)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Windi?

Windi CSS is fully compatible with Tailwind CSS v2. On top of that, Windi CSS has many additional features that boost your productivity further and open up many more possibilities.

If you don't like the predefined settings, you can [customize the Windi CSS configuration file](https://windicss.org/guide/configuration.html) to your project's design requirements.


## Installation

https://user-images.githubusercontent.com/4033662/197398760-8fd30eff-4d13-449d-a598-00a6a1ac4644.mp4


### Quick Install
  
The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.
  
```sh
# Using NPM
npx astro add windi
# Using Yarn
yarn astro add windi
# Using PNPM
pnpm astro add windi
```
  
If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Manual Install
  
First, install the `@astrojs/windi` and `windicss` packages using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/windi windicss
```
Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__`astro.config.mjs`__

```js ins={2} "windi()"
import { defineConfig } from 'astro/config';
import windi from '@astrojs/windi';

export default defineConfig({
  // ...
  integrations: [windi()],
});
```


## Usage

When you install the integration, Windi CSS's utility classes should be ready to go right away. Head to the [WindiCSS docs](https://windicss.org/guide/#basic-usage) to learn how to use Windi CSS, and if you see a utility class you want to try, add it to any HTML element to your project!

## Configuration

### Configuring Windi CSS

If you used the Quick Install instructions and said yes to each prompt, you'll see a `windi.config.js` file in your project's root directory. Use this file for your Windi CSS configuration changes. You can learn how to customize Windi CSS using this file [in the Windi CSS docs](https://windicss.org/guide/configuration.html).

If it isn't there, you add your own `windi.config.(js|cjs|mjs)` file to the root directory and the integration will use its configurations. This can be great if you already have Windi CSS configured in another project and want to bring those settings over to this one.


## Examples

- The [Astro WindiCSS Starter](https://github.com/withastro/astro/tree/latest/examples/with-windicss?on=github) gets you up and running with a base for your project that uses WindiCSS for styling

## Troubleshooting

### Others

- If your installation doesn't seem to be working, try restarting the dev server.
- If you edit and save a file and don't see your site update accordingly, try refreshing the page.
- If refreshing the page doesn't update your preview, or if a new installation doesn't seem to be working, then restart the dev server.

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.
