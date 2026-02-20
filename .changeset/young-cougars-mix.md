---
'astro': minor
---

Make the body request limit a configurable

example:

```js
security: {
  checkOrigin: true,
  allowedDomains: [{hostname: 'example.com', port: 443, protocol: 'https'}],
  bodyRequestLimit: 10485760, // 10 MB
}
```
