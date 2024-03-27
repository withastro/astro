---
"@astrojs/db": patch
---

Provide guidance when --remote is missing

When running the build `astro build` without the `--remote`, either require a `DATABASE_FILE` variable be defined, which means you are going expert-mode and having your own database, or error suggesting to use the `--remote` flag.
