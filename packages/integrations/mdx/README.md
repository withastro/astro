# @astrojs/mdx 📝

This **[Astro integration][astro-integration]** enables the usage of [MDX](https://mdxjs.com/) components and allows you to create pages as `.mdx` files.

- <strong>[Why MDX?](#why-mdx)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why MDX?

MDX is the defacto solution for embedding components, such as interactive charts or alerts, within Markdown content. If you have existing content authored in MDX, this integration makes migrating to Astro a breeze.

**Want to learn more about MDX before using this integration?**  
Check out [“What is MDX?”](https://mdxjs.com/docs/what-is-mdx/), a deep-dive on the MDX format.

## Installation

<details>
  <summary>Quick Install</summary>
  <br/>

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

  ```sh
  # Using NPM
  npx astro add mdx
  # Using Yarn
  yarn astro add mdx
  # Using PNPM
  pnpx astro add mdx
  ```

Then, restart the dev server by typing `CTRL-C` and then `npm run astro dev` in the terminal window that was running Astro.

Because this command is new, it might not properly set things up. If that happens, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.
</details>

<details>
  <summary>Manual Install</summary>
  <br/>

First, install the `@astrojs/mdx` package using your package manager. If you're using npm or aren't sure, run this in the terminal:

  ```
  npm install @astrojs/mdx
  ```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__astro.config.mjs__

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  // ...
  integrations: [mdx()],
});
```

Finally, restart the dev server.
</details>

## Usage

To write your first MDX page in Astro, head to our [UI framework documentation][astro-ui-frameworks]. You'll explore:
- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🪆 opportunities to mix and nest frameworks together

[**Client Directives**](https://docs.astro.build/en/reference/directives-reference/#client-directives) are still required in `.mdx` files.

> **Note**: `.mdx` files adhere to strict JSX syntax rather than Astro's HTML-like syntax.

Also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Configuration

There are currently no configuration options for the `@astrojs/mdx` integration. Please [open an issue](https://github.com/withastro/astro/issues/new/choose) if you have a compelling use case to share.

## Examples

- The [Astro MDX example](https://github.com/withastro/astro/tree/latest/examples/with-mdx) shows how to use MDX files in your Astro project.

## Troubleshooting

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
