---
'astro': patch
---

Fixes an issue with the conditional rendering of scripts. 

**This change updates a v5.0 breaking change when `experimental.directRenderScript` became the default script handling behavior**.

If you have already successfully upgraded to Astro v5, you may need to review your script tags again and make sure they still behave as desired after this release. [See the v5 Upgrade Guide for more details](https://docs.astro.build/en/guides/upgrade-to/v5/#script-tags-are-rendered-directly-as-declared).
