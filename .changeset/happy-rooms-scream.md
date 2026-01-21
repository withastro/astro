---
'@astrojs/db': minor
---

Adds a `--db-app-token` CLI flag to `astro db` commands `execute`, `push`, `query`, and `verify`

The new Astro DB CLI flags allow you to provide a remote database app token directly instead of `ASTRO_DB_APP_TOKEN`. This ensures that no untrusted code (e.g. CI / CD workflows) has access to the secret that is only needed by the `astro db` commands.

The following command can be used to safely push database configuration changes to your project database:

```
astro db push --db-app-token <token>
```

See the [Astro DB integration documentation](https://docs.astro.build/en/guides/integrations-guide/db/#astro-db-cli-reference) for more information.
