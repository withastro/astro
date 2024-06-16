---
'astro': patch
---

**BREAKING CHANGE to the experimental `astro:env` feature only**

Server secrets specified in the schema must now be imported from `astro:env/server`. Using `getSecret()` is no longer required to use these environment variables in your schema:

```diff
- import { getSecret } from 'astro:env/server'
- const API_SECRET = getSecret("API_SECRET")
+ import { API_SECRET } from 'astro:env/server'
```

Note that using `getSecret()` with these keys is still possible, but no longer involves any special handling and the raw value will be returned, just like retrieving secrets not specified in your schema.
