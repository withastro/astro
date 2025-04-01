---
'astro': minor
---

Updates when the configuration is validated to include integrations

Now, Astro will first validate the user configuration, then validate the updated configuration after each integration `astro:config:setup` hook has run. This means `updateConfig()` calls will no longer accept invalid configuration.

This fixes a situation where integrations could potentially update a project with a malformed configuration. These issues should now be caught and logged so that you can update your integration to only set valid configurations.
