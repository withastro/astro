---
'@astrojs/db': patch
---

Fix options parsing for the libsql client connection to ensure that proper values are being set when adding URLSearchParams to the `ASTRO_DB_REMOTE_URL`
