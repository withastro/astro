---
'astro': patch
---

Fixes an issue where `Astro.currentLocale` wasn't incorrectly computed when the `defaultLocale` belonged to a custom locale path. 
