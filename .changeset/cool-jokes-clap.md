---
'astro': major
---

Fixes for the `class:list` directive

- Previously, `class:list` would ocassionally not be merged the `class` prop when passed to Astro components. Now, `class:list` is always converted to a `class` prop (as a string value).
- Previously, `class:list` diverged from [`clsx`](https://github.com/lukeed/clsx) in a few edge cases. Now, `class:list` uses [`clsx`](https://github.com/lukeed/clsx) directly.
  - `class:list` used to deduplicate matching values, but it no longer does
  - `class:list` used to sort individual values, but it no longer does
  - `class:list` used to support `Set` and other iterables, but it no longer does
