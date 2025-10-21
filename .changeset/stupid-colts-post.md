---
'@astrojs/mdx': patch
'@astrojs/rss': patch
'astro': patch
'@astrojs/db': patch
---

Makes `astro` a tiny bit lighter weight by refactoring internal dependencies. Switches from `kleur` to `picocolors` for styling terminal text.
