---
'astro': minor
---

Adds support for Astro.resolve

`Astro.resolve()` helps with creating URLs relative to the current Astro file, allowing you to reference files within your `src/` folder.

Astro *does not* resolve relative links within HTML, such as images:

```html
<img src="../images/penguin.png" />
```

The above will be sent to the browser as-is and the browser will resolve it relative to the current __page__. If you want it to be resolved relative to the .astro file you are working in, use `Astro.resolve`:

```astro
<img src={Astro.resolve('../images/penguin.png')} />
```