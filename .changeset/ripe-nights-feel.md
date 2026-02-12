---
'astro': minor
---

Responsive images are now supported when `security.csp` is enabled, out of the box. 

Before, the styles for responsive images were injected using the `style="""` attribute, and the image would look like this:

```html
<img style="--fit: <value>; --pos: <value>" >
```

After this change, styles now use a combination of `class=""` and data attributes. The image would look like this:

```html
<img class="__a_HaSh350" data-atro-fit="value" data-astro-pos="value" >
```
