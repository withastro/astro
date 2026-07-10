---
'astro': minor
---

Adds an advanced `normalizePathname` option to `FetchState` for customizing how the incoming request pathname is turned into the canonical pathname used for routing, params, and the user-facing `Astro.url` / `context.url`.

By default, Astro normalizes request pathnames with a security-hardened function that iteratively decodes until the path stops changing and then collapses duplicate slashes, so middleware and routing always agree on one canonical path. A side effect of the decode step is that a value like `%25` is decoded to a bare `%`, so `Astro.url.pathname` can differ from `new URL(Astro.request.url).pathname`.

Advanced users building custom fetch handlers can now override this per request. The returned value is used **verbatim** — Astro applies no further decoding or slash normalization on top of it, giving you full control over the canonical pathname:

```ts
import { FetchState } from 'astro/fetch';

// Keep percent-encoded sequences (e.g. %25) intact
const state = new FetchState(request, {
	normalizePathname: (pathname) => pathname,
});
```

The built-in default is exported as `normalizePathname` so custom implementations can delegate to it (fully or partially):

```ts
import { normalizePathname } from 'astro/fetch';
```

This option only affects the **incoming request**. Rewrite targets (`Astro.rewrite()`, middleware `next(payload)`) are developer-supplied and are not run through your function.

**Note:** Replacing the default is potentially unsafe. Because the result is used verbatim, your function takes over the security-relevant canonicalization the default performs — iteratively decoding multi-encoded paths (e.g. `/%2561dmin`) and collapsing duplicate slashes (e.g. `//admin`) that could otherwise slip past middleware authorization checks. Only override it if you understand the routing and security implications. The default behavior is unchanged.
