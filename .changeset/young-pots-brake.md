---
"@astrojs/db": minor
---

- Fix duplicate table recreations when you start your dev server.
- Remove eager re-seeding when updating your seed file in development. Seeding still runs on dev server startup for SQLite inspector tools.
