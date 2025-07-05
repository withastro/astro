---
'@astrojs/vercel': patch
---

Fixes a bug where the new feature `experimentalStaticHeaders` saved the information in the incorrect place of `config.json` file, causing the feature to not work as expected.
