---
'@astrojs/cloudflare': patch
---

Warns at build time when the default `SESSION` KV binding will be auto-provisioned on deploy

The adapter injects a `SESSION` KV binding with no `id`, which `wrangler deploy` treats as a request to provision a new KV namespace. If your API token lacks the `Workers KV Storage: Edit` permission, the deploy fails with an opaque `Authentication error [code: 10000]` well after the build succeeded.

`astro build` now warns when this binding is about to be provisioned, pointing at both escape hatches: declaring `kv_namespaces` in your Wrangler config to use an existing namespace, or setting `session: false` in your Astro config to skip sessions entirely. No warning is emitted if you already declared the binding yourself, if sessions are disabled, or during `astro dev`.
