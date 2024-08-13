---
'astro': major
---

Changes the data returned for `page.url.next` and `page.url.prev` to include the value set for `base` in your Astro config. 

Previously, you had to manually prepend your configured value for `base`  to the URL path.  Now, Astro automatically includes your `base` value to `next` and `prev` URLs.

If you are using the `paginate()` function for "previous" and "next" URLs, remove any existing `base` value as it is now added for you:

```diff

show a line of code plz!
```

