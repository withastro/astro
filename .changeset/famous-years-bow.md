---
'astro': minor
---

## Adds directive syntax for component hydration

This change updates the syntax for partial hydration from `<Button:load />` to `<Button client:load />`.

**Why?**

Partial hydration is about to get super powers! This clears the way for more dynamic partial hydration, i.e. `<MobileMenu client:media="(max-width: 40em)" />`.

**How to upgrade**

Just update `:load`, `:idle`, and `:visible` to match the `client:load` format, thats it! Don't worry, the original syntax is still supported but it's recommended to future-proof your project by updating to the newer syntax.
