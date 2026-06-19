---
'astro': major
---

Removes the `@astrojs/db` package as it is no longer maintained.

The `@astrojs/db` package were deprecated in v6.4.5 and is now removed. This means the `astro db`, `astro login`, `astro logout`, `astro link`, and `astro init` CLI commands have also been removed.

If you were using Astro DB in your project, remove `@astrojs/db` from your project's dependencies and replace it with one of the following alternatives:

- **Node.js built-in SQLite**: Node.js now includes a built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) module (available since Node.js v22.5.0). This is a good option if you are using the Node.js adapter and were using `@astrojs/db` for local SQLite storage.
- **[Drizzle ORM](https://orm.drizzle.team/)**: If you were using `@astrojs/db` for its Drizzle-based schema and query API, you can use Drizzle directly with any supported database.
- **Other database libraries**: Use any database library that suits your deployment platform (e.g. [Turso](https://turso.tech/), [PlanetScale](https://planetscale.com/), [Neon](https://neon.tech/)).
