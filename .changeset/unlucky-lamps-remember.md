---
'@astrojs/preact': minor
'@astrojs/svelte': minor
'@astrojs/react': minor
'@astrojs/solid-js': minor
'@astrojs/vue': minor
'astro': minor
---

Prevent removal of nested slots within islands

This change introduces a new flag that renderers can add called `supportsAstroStaticSlot`. What this does is let Astro know that the render is sending `<astro-static-slot>` as placeholder values for static (non-hydrated) slots which Astro will then remove.

This change is completely backwards compatible, but fixes bugs caused by combining ssr-only and client-side framework components like so:

```astro
<Component>
  <div>
    <Component client:load>
      <span>Nested</span>
    </Component>
  </div>
</Component>
```
