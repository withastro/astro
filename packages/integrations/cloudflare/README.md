# @astrojs/cloudflare

An SSR adapter for use with Cloudflare Pages Functions targets. Write your code in Astro/Javascript and deploy to Cloudflare Pages.

In your `astro.config.mjs` use:

```js
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

For most projects the adaptor default of `advanced` will be sufficiant, when in this mode the `dist` folder will contain your compiled project. However if you'd like to use [pages plugins](https://developers.cloudflare.com/pages/platform/functions/plugins/) such as [Sentry](https://developers.cloudflare.com/pages/platform/functions/plugins/sentry/) for example to enable logging, you'll need to use directory mode.

In directory mode the adaptor will compile the client side part of you app the same way, but it will move the worker script into a `functions` folder in the project root. The adaptor will only ever place a `[[path]].js` in that folder, allowing you to add additional plugins and pages middlewhere which can be checked into version control  .

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

It's then possible to update the preview script in your `package.json` to `"preview": "wrangler pages dev ./dist"`

## Streams

Some integrations such as [React](https://github.com/withastro/astro/tree/main/packages/integrations/react) rely on web streams. Currently Cloudflare Pages functions are in beta and don't support the `streams_enable_constructors` feature flag.

In order to work around this:
- install the `"web-streams-polyfill"` package
- add `import "web-streams-polyfill/es2018";` to the top of the front matter of every page which requires streams, such as server rendering a React component.
