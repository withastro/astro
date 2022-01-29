---
'astro': minor
---

Standardize trailing subpath behavior in config.

Most users are not aware of the subtle differences between `/foo` and `/foo/`. Internally, we have to handle both which means that we are constantly worrying about the format of the URL, needing to add/remove trailing slashes when we go to work with this property, etc. This change transforms all `site` values to use a trailing slash internally, which should help reduce bugs for both users and maintainers.