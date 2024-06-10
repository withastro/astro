---
'astro': patch
---

**BREAKING CHANGE to the experimental `astro:env` feature only**

Server secrets specfied in the schema must now be imported from `astro:env/server`:

```diff
- import { getSecret } from 'astro:env/server'
+ import { FOO, getSecret } from 'astro:env/server'

- const FOO = getSecret("FOO")
const UNKNOWN = getSecret("UNKNOWN")
```

Note that `getSecret` can still be used to retrieve secrets not specified in your schema. If the key is also in the schema, no special handling will occur and the raw value will be returned.