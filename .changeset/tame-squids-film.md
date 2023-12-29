---
'@astrojs/node': major
---

If host is unset in standalone mode, the server host will now fallback to `localhost` instead of `172.0.0.1`. When `localhost` is used, the operating system can decide to use either `::1` (ipv6) or `172.0.0.1` (ipv4) itself. This aligns with how the Astro dev and preview server works by default.

If you rely on `172.0.0.1` (ipv4) before, you can set the `HOST` environment variable to `172.0.0.1` to explicitly use ipv4. For example, `HOST=172.0.0.1 node ./dist/server/entry.mjs`.
