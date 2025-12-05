---
'astro': major
'astro-rss': patch
---

Upgrade to Zod 4

**Breaking Changes:**

If you have custom Zod schemas in your `content.config.ts` or other configuration files, you'll need to update them for Zod 4. Refer to the [Zod migration guide](https://zod.dev/v4/changelog) for detailed changes in the Zod API.

You can import Zod from `astro/zod` to ensure you're using the same version of Zod that Astro uses internally:

```ts
import { z } from 'astro/zod';
```

**Changes:**

- Updated all internal Zod schemas to use Zod 4 API
- Updated error handling and custom error maps for Zod 4 error structure
- Removed `zod-to-json-schema` dependency (now built-in to Zod 4)
- Updated content collection schemas and type generation
- Fixed markdown and image config schema validation
