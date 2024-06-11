---
'astro': patch
---

**BREAKING CHANGE to the experimental `astro:env` feature only**

Server secrets specified in the schema must now be imported from `astro:env/server`. Using `getSecret()` with these keys no longer involves any special handling and the raw value will be returned.

```diff
- import { getSecret } from 'astro:env/server'
- const API_SECRET = getSecret("API_SECRET")
+ import { API_SECRET } from 'astro:env/server'
```

Note that `getSecret()` can still be used to retrieve secrets not specified in your schema.
