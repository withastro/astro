---
'@astrojs/cloudflare': major
'@astrojs/netlify': major
'@astrojs/vercel': major
'astro': major
---

When using an adapter that supports neither Squoosh or Sharp, Astro will now automatically use an image service that does not support processing, but still provides the other benefits of `astro:assets` such as enforcing `alt`, no CLS etc to users
