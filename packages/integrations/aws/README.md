# @astrojs/aws

This adapter allows Astro to deploy your SSR site to [AWS](https://aws.amazon.com/).

<!--
TODO: link to the deploy to AWS guide after the @astrojs/aws adapter is released.

Learn how to deploy your Astro site in our [AWS deployment guide](https://docs.astro.build/en/guides/deploy/aws/).
-->

- <strong>[Installation](#installation)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>

## Installation

Add the AWS adapter to enable SSR in your Astro project with the following `astro add` command. This will install the adapter and make the appropriate changes to your `astro.config.mjs` file in one step.

```sh
# Using NPM
npx astro add aws
# Using Yarn
yarn astro add aws
# Using PNPM
pnpm astro add aws
```

If you prefer to install the adapter manually instead, complete the following two steps:

1. Install the AWS adapter to your project’s dependencies using your preferred package manager. If you’re using npm or aren’t sure, run this in the terminal:

    ```bash
      npm install @astrojs/aws
    ```

1. Add two new lines to your `astro.config.mjs` project configuration file.

    ```js title="astro.config.mjs" ins={2, 5-6}
    import { defineConfig } from 'astro/config';
    import aws from '@astrojs/aws/lambda';

    export default defineConfig({
      output: 'server',
      adapter: aws(),
    });
    ```

### Targets

You can deploy to different targets:

- `edge`: SSR inside a [Lambda@Edge function](https://aws.amazon.com/lambda/).
- `lambda`: SSR inside a [Lambda function](https://aws.amazon.com/lambda/edge/).

You can change where to target by changing the import:

```js
import aws from '@astrojs/aws/lambda';
import aws from '@astrojs/aws/edge';
```

## Configuration

There are no configuration options available for this adapter.

## Examples

We don't have any example projects using this new adaptor yet. Submit a PR to this page and add yours!

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!