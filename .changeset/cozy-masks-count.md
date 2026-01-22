---
'astro': minor
---

Adds support for returning a Promise from the `parser()` option of the `file()` loader. This enables you to run asynchronous code such as fetching remote data or using async parsers, when loading files with the Content Layer API.

For example:

```js
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';

const blog = defineCollection({
  loader: file('src/data/blog.json', {
    parser: async (text) => {
      const data = JSON.parse(text);
      
      // Perform async operations like fetching additional data
      const enrichedData = await fetch(`https://api.example.com/enrich`, {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(res => res.json());
      
      return enrichedData;
    },
  }),
});

export const collections = { blog };
```
