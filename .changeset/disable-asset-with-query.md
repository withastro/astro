---
'astro': patch
---

Astro will now skip asset optimization when there is a query in the import. Instead, it will let vite deal with it using plugins.

```vue
<script>
// This will not return an optimized asset
import Component from './Component.vue?component'
</script>
```
  
