---
'@astrojs/cloudflare': minor
'astro': minor
---

Adds support for redirecting URLs in remote image optimization.

Previously, when a remote image URL meant to be optimized by Astro led to a redirect, Astro would fail silently and ignore the redirect. Now, Astro tracks up to 10 redirects for these images. If any of the redirects are not covered by a pattern in `image.remotePatterns` or a domain in `image.domains`, Astro will fail with a helpful error message.

In the following example, the first image would be loaded successfully, while the second would lead to Astro throwing an error:

```mjs
export default defineConfig({
  image: {
    domains: ["example.com", "cdn.example.com"]
  }
});
```

```tsx
{/* Redirects to https://cdn.example.com/assets/image.png: */}
<Image src="https://example.com/assets/image.png" width="1920" height="1080" alt="An example image." />

{/* Redirects to https://malicious.com/image.png: */}
<Image src="https://example.com/bad-image.png" width="1920" height="1080" alt="An example image." />
```

In cases where all redirects to HTTPS hosts should be trusted, the following configuration for `image.remotePatterns` can be used:

```mjs
export default defineConfig({
  image: {
    remotePatterns: [{
      protocol: 'https'
    }]
  }
});
```
