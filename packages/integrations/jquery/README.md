# @astrojs/jquery

This **[Astro integration][astro-integration]** adds [jQuery](https://jquery.com/) to your project so that you can use jQuery anywhere on your page.

- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Installation

### Quick Install

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

```sh
# Using NPM
npm run astro add jquery
# Using Yarn
yarn astro add jquery
# Using PNPM
pnpm astro add jquery
```

Finally, in the terminal window running Astro, press `CTRL+C` and then type `npm run astro dev` to restart the dev server. 

### Manual Install

First, install the `@astrojs/jquery` package using your package manager. If you're using npm or aren't sure, run this in the terminal:

```sh
npm install @astrojs/jquery
```

Most package managers will install associated peer dependencies as well. However, if you see a "Cannot find package 'jquery'" (or similar) warning when you start up Astro, you'll need to manually install jQuery yourself:

```sh
npm install jquery @types/jquery
```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:


```js title="astro.config.mjs" ins={2} "jquery()"
import { defineConfig } from 'astro/config';
import jquery from '@astrojs/jquery';

export default defineConfig({
  // ...
  integrations: [jquery()],
});
```

Finally, restart the dev server.

## Usage

Once the integration is installed, you can use [jQuery](https://jquery/) module in any script as `$` inside any Astro component. The jQuery script is automatically added and enabled on every page of your website.

Check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Limitations

The Apline.js integration does not give you control over how the script is loaded or initialized. If you require this control, consider installing and using jquery manually.

## Configuration

The jQuery integration does not support any custom configuration at this time.

## Examples

- The [Astro jQuery example](https://github.com/withastro/astro/tree/latest/examples/framework-jquery) shows how to use jQuery in an Astro project.

## Troubleshooting

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
