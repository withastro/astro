---
'astro': minor
---

Experimental Server Islands

Server Islands allow you to specify components that should run on the server, allowing the rest of the page to be more aggressively cached, or even generated statically. Turn any `.astro` component into a server island by adding the `server:defer` directive and optionally, fallback placeholder content:

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

Enable server islands by adding the experimental flag to your Astro config with an appropriate `output` mode and adatper:

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

For more information, see the [server islands documentation](https://docs.astro.build/en/reference/configuration-reference/#experimentalserverislands).
