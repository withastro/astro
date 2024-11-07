---
'astro': minor
---

Adds experimental support for built-in SVG components.


This feature allows you to import SVG files directly into your Astro project as components. By default, Astro will inline the SVG content into your HTML output.

To enable this feature, set `experimental.svg` to `true` in your Astro config:

```js
{
  experimental: {
    svg: true,
  },
}
```

To use this feature, import an SVG file in your Astro project, passing any common SVG attributes to the imported component. Astro also provides a `size` attribute to set equal `height` and `width` properties:

```astro
---
import Logo from './path/to/svg/file.svg';
---

<Logo size={24} />
```

For a complete overview, and to give feedback on this experimental API, see the [Feature RFC](https://github.com/withastro/roadmap/pull/1035).
