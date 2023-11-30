---
'astro': minor
---

Adds the `astro preferences` command to manage user preferences. User preferences are specific to individual Astro users, unlike the `astro.config.mjs` file which changes behavior for everyone working on a project.

User preferences are scoped to the current project by default, stored in a local `.astro/settings.json` file. Using the `--global` flag, user preferences can also be applied to every Astro project on the current machine. Global user preferences are stored in an operating system-specific location.

```sh
# Disable the dev overlay for the current user in the current project
npm run astro preferences disable devOverlay
# Disable the dev overlay for the current user in all Astro projects on this machine
npm run astro preferences --global disable devOverlay

# Check if the dev overlay is enabled for the current user
npm run astro preferences list devOverlay
```
