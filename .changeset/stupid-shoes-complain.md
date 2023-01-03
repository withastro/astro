---
'astro': minor
---

Correctly handle spaces and capitalization in `src/content/` file names. This introduces github-slugger for slug generation to ensure slugs are usable by `getStaticPaths`. Changes:
- Resolve spaces and capitalization: `collection/Entry With Spaces.md` becomes `collection/entry-with-spaces`.
- Truncate `/index` paths to base URL: `collection/index.md` becomes `collection`
