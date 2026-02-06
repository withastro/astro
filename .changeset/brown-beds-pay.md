---
'astro': minor
---

Adds a new optional `getRemoteSize()` method to the Image Service API.

Previously, `inferRemoteSize()` had a fixed implementation that fetched the entire image to determine its dimensions.
With this new helper function that extends `inferRemoteSize()`, you can now override or extend how remote image metadata is retrieved.

This enables use cases such as:
- Caching: Storing image dimensions in a database or local cache to avoid redundant network requests.
- Provider APIs: Using a specific image provider's API (like Cloudinary or Vercel) to get dimensions without downloading the file.

For example, you can add a simple cache layer to your existing image service:

```js
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

See the [Image Services API reference documentation](https://v6.docs.astro.build/en/reference/image-service-reference/#getremotesize) for more information.
