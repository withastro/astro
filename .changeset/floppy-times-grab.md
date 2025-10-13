---
'@astrojs/sitemap': major
---

Adds the ability to split sitemap generation into chunks based on customizable logic. This allows for better management of large sitemaps and improved performance. The new `chunks` option in the sitemap configuration allows users to define functions that categorize sitemap items into different chunks. Each chunk is then written to a separate sitemap file. 
