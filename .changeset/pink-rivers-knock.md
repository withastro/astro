---
"astro": minor
---

Astro will now automatically check for updates when you run the dev server. If a new version is available, a message will appear in the terminal with instructions on how to update. Updates will be checked once per 10 days, and the message will only appear if the project is multiple versions behind the latest release.

This behavior can be disabled by running `astro preferences disable checkUpdates` or setting the `ASTRO_DISABLE_UPDATE_CHECK` environment variable to `false`.
