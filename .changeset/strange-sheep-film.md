---
'astro': minor
---

[Server Islands](https://astro.build/blog/future-of-astro-server-islands/) introduced behind an experimental flag in [v4.12.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#4120) is no longer experimental and is available for general use.

Server islands are Astro's solution for highly cacheable pages of mixed static and dynamic content. They allow you to specify components that should run on the server, allowing the rest of the page to be more aggressively cached, or even generated statically.

Turn any `.astro` component into a server island by adding the `server:defer` directive and optionally, fallback placeholder content. It will be rendered dynamically at runtime outside the context of the rest of the page, allowing you to add longer cache headers for the pages, or even prerender them.

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

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental {
-    serverIslands: true,
  },
});
```

If you have been waiting for stabilization before using server islands, you can now do so.

Please see the [server island documentation](https://docs.astro.build/en/guides/server-islands/) for more about this feature.
