---
'@astrojs/db': minor
---

Adds support for connecting Astro DB to any remote LibSQL server. This allows Astro DB to be used with self-hosting and air-gapped deployments.

To connect Astro DB to a remote LibSQL server instead of Studio, set the following environment variables:

- `ASTRO_DB_REMOTE_URL`: the connection URL to your LibSQL server
- `ASTRO_DB_APP_TOKEN`: the auth token to your LibSQL server

Details of the LibSQL connection can be configured using the connection URL. For example, `memory:?syncUrl=libsql%3A%2F%2Fdb-server.example.com` would create an in-memory embedded replica for the LibSQL DB on `libsql://db-server.example.com`.

For more details, please visit [the Astro DB documentation](https://docs.astro.build/en/guides/astro-db/#libsql)
