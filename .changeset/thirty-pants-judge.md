---
'astro': patch
---

Add project name normalization in `astro add cloudflare`

When `astro add cloudflare` generates a Wrangler config, the project name from `package.json` is now normalized to comply with Cloudflare's naming rules. Underscores are replaced with dashes, special characters are removed, leading/trailing dashes are trimmed, and the name is truncated to 63 characters. Previously, names like `my_project!` would be written as-is, causing Wrangler to reject the config.
