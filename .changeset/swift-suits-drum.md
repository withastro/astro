---
'@astrojs/vue': patch
---

Fixes an issue where Astro slot names were being rendered as attributes in components. Astro slot names will no longer be sent as props to framework components.
