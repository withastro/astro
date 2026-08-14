# @astrojs/appwrite

This package brings [route caching](https://docs.astro.build/en/guides/caching/) to Astro sites hosted on [Appwrite](https://appwrite.io/). Cache hits are served by the Appwrite CDN, so the site's function is never invoked for them.

Appwrite Sites runs Astro through [`@astrojs/node`](https://docs.astro.build/en/guides/integrations-guide/node/), which stays the adapter. This package supplies the cache provider next to it:

```js
// astro.config.mjs
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import { cacheAppwrite } from '@astrojs/appwrite/cache';

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  cache: {
    provider: cacheAppwrite(),
  },
  routeRules: {
    '/blog/[...path]': { maxAge: 300, swr: 60 },
  },
});
```

`Astro.cache.set()`, `routeRules` and `cache.invalidate()` then behave as documented. Cache directives are sent as `Appwrite-CDN-Cache-Control` and cache tags as `Appwrite-CDN-Cache-Key`; the Appwrite edge rewrites both into whatever the CDN in front of the domain speaks, and `cache.invalidate()` purges by cache key or by path through the Appwrite API.

For `cache.invalidate()` to be allowed to purge, the site's dynamic API key needs the `proxy.invalidations.write` scope (Appwrite console → your site → **Settings** → **Scopes**). Caching itself works without it.

## Options

Every option is optional; the defaults suit a site deployed on Appwrite Sites.

| Option      | Default                                                             | Description                                                                                                                        |
| ----------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `domain`    | the domain of the request being served                              | Domain(s) purged by `cache.invalidate()`. A purge only clears the domain it names, so a site on several domains has to list them.  |
| `endpoint`  | `APPWRITE_FUNCTION_API_ENDPOINT`, then `APPWRITE_SITE_API_ENDPOINT` | Appwrite API endpoint. Required, so pass it when neither variable is set.                                                          |
| `projectId` | `APPWRITE_FUNCTION_PROJECT_ID`, then `APPWRITE_SITE_PROJECT_ID`     | Appwrite project ID.                                                                                                               |
| `apiKey`    | the `x-appwrite-key` request header, then `APPWRITE_API_KEY`        | Key used to invalidate. Prefer the default: a value set here is baked into the build output.                                       |
| `noStore`   | `true`                                                              | Send `no-store` for responses that declare no cache intent, so the CDN's default TTL cannot cache a route that never asked for it. |

## Good to know

- **Cache keys are normalized.** The edge splits `Appwrite-CDN-Cache-Key` on whitespace and re-joins the keys with commas for the CDN's `Cache-Tag`, so a tag containing whitespace, a comma or a non-ASCII character is percent-encoded — identically on the response and on the purge. A tag longer than 128 characters once encoded cannot be named by a purge, so it is dropped with a warning; the response is still cached.
- **A purge is one API call per reference per domain**, and invalidations are rate limited to 60 per minute.
- **A path purge clears the exact path**, not copies cached under the same path with a query string. Tag those and purge by tag instead.
- **To purge a whole domain**, call `createInvalidation({ domain, type: 'all' })` directly — Astro's `invalidate()` has no equivalent.

## Support

- Get help in the [Astro Discord][discord]. Post questions in our `#support` forum, or visit our dedicated `#dev` channel to discuss current development and more!

- Check our [Astro Integration Documentation][astro-integration] for more on integrations.

- Submit bug reports and feature requests as [GitHub issues][issues].

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR! These links will help you get started:

- [Contributor Manual][contributing]
- [Code of Conduct][coc]
- [Community Guide][community]

## License

MIT

Copyright (c) 2023–present [Astro][astro]

[astro]: https://astro.build/
[contributing]: https://github.com/withastro/astro/blob/main/CONTRIBUTING.md
[coc]: https://github.com/withastro/.github/blob/main/CODE_OF_CONDUCT.md
[community]: https://github.com/withastro/.github/blob/main/COMMUNITY_GUIDE.md
[discord]: https://astro.build/chat/
[issues]: https://github.com/withastro/astro/issues
[astro-integration]: https://docs.astro.build/en/guides/integrations/
