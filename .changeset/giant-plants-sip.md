---
'astro': major
---

Remove backwards-compatible kebab-case transform for camelCase CSS variable names passed to the `style` attribute. If you were relying on the kebab-case transform in your styles, make sure to use the camelCase version to prevent missing styles. For example:

```astro
---
const myValue = "red"
---

<!-- input -->
<div style={{ "--myValue": myValue }}></div>

<!-- output (before) -->
<div style="--my-value:var(--myValue);--myValue:red"></div>

<!-- output (after) -->
<div style="--myValue:red"></div>
```

```diff
<style>
  div {
-   color: var(--my-value);
+   color: var(--myValue);
  }
</style>
```