---
'astro': patch
'@astrojs/parser': patch
---

Adds support for global style blocks via `<style global>`

Be careful with this escape hatch! This is best reserved for uses like importing styling libraries like Tailwind, or changing global CSS variables.
