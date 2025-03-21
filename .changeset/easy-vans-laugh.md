---
'astro': minor
---

Updates when the configuration is validated to include integrations

From now on, Astro will validate the configuration before and after all integrations `astro:config:setup` hook have run. This means `updateConfig()` calls will no longer accept invalid configuration.
