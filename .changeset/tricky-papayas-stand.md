---
'astro': patch
---

Allows inferring `weight` and `style` when using the local provider of the experimental fonts API

If you want Astro to infer those properties directly from your local font files, let them undefined:

```js
{
    // No weight specified: infer
    style: 'normal' // Do not infer
}
```
