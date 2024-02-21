---
"@astrojs/sitemap": patch
---

Revert https://github.com/withastro/astro/pull/9846 

The feature to customize the file name of the sitemap was reverted due to some internal issues with one of the dependencies. With an non-deterministic behaviour, the sitemap file was sometime emitted with incorrect syntax. 
