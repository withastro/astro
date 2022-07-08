# @astrojs/deno 🦖

This adapter allows Astro to deploy your SSR site to Deno targets.

- <strong>[Why Astro Deno](#why-astro-deno)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Astro Deno

If you're using Astro as a static site builder—its behavior out of the box—you don't need an adapter.

If you wish to [use server-side rendering (SSR)](https://docs.astro.build/en/guides/server-side-rendering/), Astro requires an adapter that matches your deployment runtime.

[Deno](https://deno.land/) is a runtime similar to Node, but with an API that's more similar to the browser's API. This adapter provides access to Deno's API and creates a script to run your project on a Deno server.

## Installation

First, install the `@astrojs/deno` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/deno
```

Then, install this adapter in your `astro.config.*` file using the `adapter` property:

__astro.config.mjs__

```js
import { defineConfig } from 'astro/config';
import deno from '@astrojs/deno';

export default defineConfig({
  // ...
  adapter: deno()
});
```
  
## Usage

After [performing a build](https://docs.astro.build/en/guides/deploy/#building-your-site-locally) there will be a `dist/server/entry.mjs` module. You can start a server by importing this module in your Deno app:

```js
import './dist/entry.mjs';
```

See the `start` option below for how you can have more control over starting the Astro server.

You can also run the script directly using deno:
```
deno run --allow-net --allow-read --allow-env ./dist/server/entry.mjs
```


## Configuration

To configure this adapter, pass an object to the `deno()` function call in `astro.config.mjs`.

__astro.config.mjs__
```js
import { defineConfig } from 'astro/config';
import deno from '@astrojs/deno';

export default defineConfig({
  adapter: deno({
    //options go here
  })
});
```

<details>
  <summary><strong>start</strong></summary>
  
  <br/>

  This adapter automatically starts a server when it is imported. You can turn this off with the `start` option:

  ```js
  import { defineConfig } from 'astro/config';
  import deno from '@astrojs/deno';

  export default defineConfig({
    adapter: deno({
      start: false
    })
  });
  ```

  If you disable this, you need to write your own Deno web server. Import and call `handle` from the generated entry script to render requests:

  ```ts
  import { serve } from "https://deno.land/std@0.132.0/http/server.ts";
  import { handle } from './dist/entry.mjs';

  serve((req: Request) => {
    // Check the request, maybe do static file handling here.

    return handle(req);
  });
  ```
</details>

<details>
  <summary><strong>port</strong> and <strong>hostname</strong></summary>
  
  <br/>

  You can set the port (default: `8085`) and hostname (default: `0.0.0.0`) for the deno server to use. If `start` is false, this has no effect; your own server must configure the port and hostname.

  ```js
  import { defineConfig } from 'astro/config';
  import deno from '@astrojs/deno';

  export default defineConfig({
    adapter: deno({
      port: 8081,
      hostname: 'myhost'
    })
  });
```
</details>

## Examples

The [Astro Deno](https://github.com/withastro/astro/tree/main/examples/deno) example includes a `preview:deno` command that runs the entry script directly. Run `npm run build` then `npm run preview:deno` to run the production deno server.

## Troubleshooting

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
