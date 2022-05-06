---
'@astrojs/vercel': minor
---


**[BREAKING]** Now with Build Output API (v3)! [See the README to get started](https://github.com/withastro/astro/tree/main/packages/integrations/vercel#readme).

- `trailingSlash` redirects works without a `vercel.json` file: just configure them inside your `astro.config.mjs`
- Multiple deploy targets: `edge`, `serverless` and `static`!
- When building to `serverless`, your code isn't transpiled to CJS anymore.

**Migrate from v0.1**

1. Change the import inside `astro.config.mjs`:
   ```diff
   - import vercel from '@astrojs/vercel';
   + import vercel from '@astrojs/vercel/serverless';
   ```
2. Rename the `ENABLE_FILE_SYSTEM_API` environment variable to `ENABLE_VC_BUILD`, as Vercel changed it.
3. The output folder changed from `.output` to `.vercel/output` — you may need to update your `.gitignore`.
