---
'astro': patch
---

**BREAKING CHANGE FOR THE EXPERIMENTAL FONTS API**: allows inferring `weight`, `style` and `unicodeRange` when using the local provider

If you want Astro to infer those properties directly from your local font files, let them undefined:

```js
{
    // No weight specified: infer
    style: 'normal' // Do not infer
    unicodeRange: undefined // No unicodeRange specified: infer
}
```

This may break your usage because that means `unicodeRange` is inferred by default. To opt out, use an empty array:

```diff
{
    weight: 400,
    style: 'normal',
+    unicodeRange: []
}
```
