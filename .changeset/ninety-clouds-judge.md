---
'@astrojs/netlify': minor
---

Adds `includedFiles` and `excludedFiles` configuration options to customize SSR function bundle contents.


The `includeFiles` property allows you to explicitly specify additional files that should be bundled with your function. This is useful for files that aren't automatically detected as dependencies, such as:
- Data files loaded using `fs` operations
- Configuration files
- Template files

Similarly, you can use the `excludeFiles` property to prevent specific files from being bundled that would otherwise be included. This is helpful for:
- Reducing bundle size
- Excluding large binaries
- Preventing unwanted files from being deployed

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  // ...
  output: 'server',
  adapter: netlify({
    includeFiles: ['./my-data.json'],
     excludeFiles: [
      './node_modules/package/**/*',
      './src/**/*.test.js'
    ],
  }),
});
```

See the [Netlify adapter documentation](https://docs.astro.build/en/guides/integrations-guide/netlify/#including-or-excluding-files) for detailed usage instructions and examples.
