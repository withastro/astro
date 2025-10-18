---
"@astrojs/vercel": patch
---

Fix regression in 8.2.7: validate densities-based srcset widths against configured sizes

When using `densities` with the Vercel image adapter, calculated widths were not being validated against Vercel's configured sizes list. This caused images to fail when using densities, as Vercel would reject the invalid widths.

This fix ensures densities-calculated widths are mapped to valid configured sizes, matching the behavior already implemented for the `widths` prop.
