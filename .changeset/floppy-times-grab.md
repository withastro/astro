---
'@astrojs/sitemap': major
---

Adds the ability to split sitemap generation into chunks based oncustomizable logic. This allows for better management of largesitemaps and improved performance.The new `chunks` option in the sitemap configuration allows users todefine functions that categorize sitemap items into different chunks.Each chunk is then written to a separate sitemap file.This change introduces a new `writeSitemapChunk` function to handlethe writing of individual sitemap chunks.
