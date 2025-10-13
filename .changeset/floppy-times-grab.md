---
'@astrojs/sitemap': minor
---

Adds the ability to split sitemap generation into chunks based on customizable logic. This allows for better management of large sitemaps and improved performance. The new `chunks` option in the sitemap configuration allows users to define functions that categorize sitemap items into different chunks. Each chunk is then written to a separate sitemap file. 

```
integrations: [
  sitemap({
    serialize(item) { th
      return item
    },
    chunks: { // this property will be treated last on the configuration
      'blog': (item) => {  // will produce a sitemap file with `blog` name (sitemap-blog-0.xml)
        if (/blog/.test(item.url)) { // filter path that will be included in this specific sitemap file 
          item.changefreq = 'weekly';
          item.lastmod = new Date();
          item.priority = 0.9; // define specific properties for this filtered path
          return item;
        }
      },
      'glossary': (item) => {
        if (/glossary/.test(item.url)) {
          item.changefreq = 'weekly';
          item.lastmod = new Date();
          item.priority = 0.7;
          return item;
        }
      }

      // the rest of the path will be stored in `sitemap-pages.0.xml`
    },
  }),
],

  ```
