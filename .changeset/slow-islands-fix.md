---
'astro': minor
---

Experimental SSR Support

> ⚠️ If you are a user of Astro and see this PR and think that you can start deploying your app to a server and get SSR, slow down a second! This is only the initial flag and **very basic support**. Styles are not loading correctly at this point, for example. Like we did with the `--experimental-static-build` flag, this feature will be refined over the next few weeks/months and we'll let you know when its ready for community testing.

## Changes

- This adds a new `--experimental-ssr` flag to `astro build` which will result in `dist/server/` and `dist/client/` directories.
- SSR can be used through this API:
  ```js
  import { createServer } from 'http';
  import { loadApp } from 'astro/app/node';

  const app = await loadApp(new URL('./dist/server/', import.meta.url));

  createServer((req, res) => {
    const route = app.match(req);
    if(route) {
      let html = await app.render(req, route);
    }

  }).listen(8080);
  ```
- This API will be refined over time.
- This only works in Node.js at the moment.
- Many features will likely not work correctly, but rendering HTML at least should.
