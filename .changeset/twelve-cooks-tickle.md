---
'astro': major
---

A trailing slash will not be automatically appended to `import.meta.env.SITE`. Instead, it will be the value of the `site` config as is. This may affect usages of `${import.meta.env.SITE}image.png`, which will need to be updated accordingly.
