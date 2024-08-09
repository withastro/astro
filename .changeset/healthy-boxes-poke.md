---
'@astrojs/db': minor
---

Adds support for connecting Astro DB to any remote LibSQL server. This allows Astro DB to be used with self-hosting and air-gapped deployments.

To connect Astro DB to a remote LibSQL server instead of Studio, set the following environment variables:

- `ASTRO_STUDIO_REMOTE_DB_URL`: the connection URL to your LibSQL server
- `ASTRO_STUDIO_APP_TOKEN`: the auth token to your LibSQL server

Details of the LibSQL connection can be configured using the connection URL.

For more details, please visit [the Astro DB documentation](https://docs.astro.build/en/guides/astro-db/#libsql)
