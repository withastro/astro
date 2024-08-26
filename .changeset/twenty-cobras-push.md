---
'astro': major
---

Changes the data returned for `page.url.current`, `page.url.next`, `page.url.prev`, `page.url.first` and `page.url.last` to include the value set for `base` in your Astro config. 

Previously, you had to manually prepend your configured value for `base` to the URL path.  Now, Astro automatically includes your `base` value in `next` and `prev` URLs.

If you are using the `paginate()` function for "previous" and "next" URLs, remove any existing `base` value as it is now added for you:

```diff
---
export async function getStaticPaths({ paginate }) {
  const astronautPages = [{
    astronaut: 'Neil Armstrong',
  }, {
    astronaut: 'Buzz Aldrin',
  }, {
    astronaut: 'Sally Ride',
  }, {
    astronaut: 'John Glenn',
  }];
  return paginate(astronautPages, { pageSize: 1 });
}
const { page } = Astro.props;
// `base: /'docs'` configured in `astro.config.mjs` 
- const prev = "/docs" + page.url.prev;
+ const prev = page.url.prev;
---
<a id="prev" href={prev}>Back</a>
```

