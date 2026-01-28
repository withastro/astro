---
'astro': minor
---

Adds a new optional `getRemoteSize` method to the Image Service interface.

Previously, `inferRemoteSize()` had a fixed implementation that fetched the entire image to determine its dimensions.
By adding this method to the Image Service, developers can now override or extend how remote image metadata is retrieved.

This enables use cases such as:
- Caching: Storing image dimensions in a database or local cache to avoid redundant network requests.
- Provider APIs: Using a specific image provider's API (like Cloudinary or Vercel) to get dimensions without downloading the file.

When a custom service implements `getRemoteSize`, it will be automatically used by Astro's `inferRemoteSize()` utility.

```js
// Example: Adding a simple cache layer to an existing service
const cache = new Map();

const myService = {
  ...baseService,
  async getRemoteSize(url, imageConfig) {
    if (cache.has(url)) return cache.get(url);

    const result = await baseService.getRemoteSize(url, imageConfig);
    cache.set(url, result);
    return result;
  }
};
```