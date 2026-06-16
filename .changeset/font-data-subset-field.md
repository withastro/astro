---
'astro': minor
---

Adds a `subset` field to the `FontData` type exposed via `fontData` from `astro:assets`. When using multiple font subsets (e.g., `subsets: ["latin", "korean"]`), each font data entry now includes the subset name, making it possible to distinguish between font entries for different subsets that share the same weight and style.
