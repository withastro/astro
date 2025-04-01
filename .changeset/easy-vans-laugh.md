---
'astro': minor
---

Updates Astro config validation to also run for the Integration API. An error log will specify which integration is failing the validation.

Now, Astro will first validate the user configuration, then validate the updated configuration after each integration `astro:config:setup` hook has run. This means `updateConfig()` calls will no longer accept invalid configuration.

This fixes a situation where integrations could potentially update a project with a malformed configuration. These issues should now be caught and logged so that you can update your integration to only set valid configurations.
