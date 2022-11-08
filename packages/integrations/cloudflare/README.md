# @astrojs/cloudflare

An SSR adapter for use with Cloudflare Pages Functions targets. Write your code in Astro/Javascript and deploy to Cloudflare Pages.

## Install

Add the Cloudflare adapter to enable SSR in your Astro project with the following `astro add` command. This will install the adapter and make the appropriate changes to your `astro.config.mjs` file in one step.

```sh
# Using NPM
npx astro add cloudflare
# Using Yarn
yarn astro add cloudflare
# Using PNPM
pnpm astro add cloudflare
```

If you prefer to install the adapter manually instead, complete the following two steps:

1. Add the Cloudflare adapter to your project's dependencies using your preferred package manager. If you’re using npm or aren’t sure, run this in the terminal:

```bash
npm install @astrojs/cloudflare
```

2. Add the following to your `astro.config.mjs` file:

```js title="astro.config.mjs" ins={2, 5-6}
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare()
});
```

## Options


### Mode

`mode: "advanced" | "directory"`

default `"advanced"`

Cloudflare Pages has 2 different modes for deploying functions, `advanced` mode which picks up the `_worker.js` in `dist`, or a directory mode where pages will compile the worker out of a functions folder in the project root.

For most projects the adaptor default of `advanced` will be sufficient; the `dist` folder will contain your compiled project. Switching to directory mode allows you to use [pages plugins](https://developers.cloudflare.com/pages/platform/functions/plugins/) such as [Sentry](https://developers.cloudflare.com/pages/platform/functions/plugins/sentry/) or write custom code to enable logging.

In directory mode the adaptor will compile the client side part of you app the same way, but moves the worker script into a `functions` folder in the project root. The adaptor will only ever place a `[[path]].js` in that folder, allowing you to add additional plugins and pages middleware which can be checked into version control. Cloudflare documentation contains more information about [writing custom functions](https://developers.cloudflare.com/pages/platform/functions/).

```ts
// directory mode
export default defineConfig({
  adapter: cloudflare({ mode: "directory" }),
});

```

## Enabling Preview

In order for preview to work you must install `wrangler`

```sh
$ pnpm install wrangler --save-dev
```

It's then possible to update the preview script in your `package.json` to `"preview": "wrangler pages dev ./dist"`.This will allow you run your entire application locally with [Wrangler](https://github.com/cloudflare/wrangler2), which supports secrets, environment variables, KV namespaces, Durable Objects and [all other supported Cloudflare bindings](https://developers.cloudflare.com/pages/platform/functions/#adding-bindings).

## Access to the Cloudflare runtime

You can access all the Cloudflare bindings and environment variables from Astro components and API routes through the adapter API.

```js
import { getRuntime } from "@astrojs/cloudflare/runtime";

getRuntime(Astro.request);
```

Depending on your adapter mode (advanced = worker, directory = pages), the runtime object will look a little different due to differences in the Cloudflare API.

## Streams

Some integrations such as [React](https://github.com/withastro/astro/tree/main/packages/integrations/react) rely on web streams. Currently Cloudflare Pages Functions require enabling a flag to support Streams.

To do this:
- go to the Cloudflare Pages project
- click on Settings in the top bar, then Functions in the sidebar
- scroll down to Compatibility Flags, click Configure Production Compatibility Flags, and add `streams_enable_constructors`
- do this for both the Production Compatibility Flags and Preview Compatibility Flags

## Environment Variables

As Cloudflare Pages Functions [provides environment variables per request](https://developers.cloudflare.com/pages/platform/functions/#adding-environment-variables-locally), you can only access private environment variables when a request has happened. Usually, this means moving environment variable access inside a function.

```js
// pages/[id].json.js

export function get({ params }) {
  // Access environment variables per request inside a function
  const serverUrl = import.meta.env.SERVER_URL;
  const result = await fetch(serverUrl + "/user/" + params.id);
  return {
    body: await result.text(),
  };
}
```

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
