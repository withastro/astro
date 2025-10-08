---
'astro': major
---

Removes `prefetch()` `with` option

In Astro 4.8.4, the `with` option of the programmatic `prefetch()` function was deprecated in favor of a more sensible default behavior that no longer required specifying the priority of prefetching for each page.

Astro 6.0 removes this option entirely and it is no longer possible to configure the priority of prefetching by passing the `with` option. Attempting to do so will now cause errors.

By default, Astro's prefetching now uses an automatic approach that will always try to use `<link rel="prefetch>` if supported, or will fall back to `fetch()`.

#### What should I do?

Review your `prefetch()` calls and remove the `with` option if it still exists:

```diff
-prefetch('/about', { with: 'fetch' });
+prefetch('/about');
```
