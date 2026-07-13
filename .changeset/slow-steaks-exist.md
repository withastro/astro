---
'@astrojs/netlify': patch
---

Fixes the generated Netlify Image CDN `remote_images` patterns so that regex metacharacters (such as `.`) in `image.remotePatterns` (`hostname`, `pathname`) and `image.domains` are matched literally instead of behaving like wildcards. This makes the generated patterns consistent with how Astro matches these values elsewhere.
