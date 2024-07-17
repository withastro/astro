---
'astro': minor
---

Experimental Server Islands

Server Islands allow you to specify components that should run on the server, allowing the rest of the page to be more aggressively cached, or even generated statically. Server Islands are marked with the `server:defer` directive.

```astro
---
import Avatar from '../components/Avatar.astro';
import GenericUser from '../components/GenericUser.astro';
---

<header>
  <h1>Page Title</h1>
  <div class="header-right">
    <Avatar server:defer>
      <GenericUser slot="fallback" />
    </Avatar>
  </div>
</header>
```

The `server:defer` directive can be used on any Astro component in a project using `hybrid` or `server` mode with an adapter. There are no special APIs needed inside of the island.

This is an experimental feature that should be enabled in your config:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'hybrid',
  adapter: netlify(),
  experimental {
    serverIslands: true,
  },
});
```
