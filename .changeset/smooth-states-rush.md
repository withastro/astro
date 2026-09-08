---
'astro': patch
---

Fixes i18n fallback routing replacing the first substring match instead of the actual locale segment, which mangled paths like `/energy/en/about` into `/esergy/en/about`
