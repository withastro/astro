---
'astro': patch
---

**BREAKING** Implement [RFC0012](https://github.com/withastro/rfcs/blob/main/proposals/0012-scoped-css-with-preserved-specificity.md) to preserve authored specificity for Astro scoped styles.

If you use a mix of global styles and Astro scoped styles, **please visually inspect your site** after upgrading to confirm that styles are working as expected. 

If you previously relied on Astro's scoped styles to increase the specificity of your selectors, please update your selectors to use an additional class. For example, updating `div` to `div.my-class` will match the previous behavior.
