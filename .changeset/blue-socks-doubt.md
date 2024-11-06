---
'astro': minor
---

Adds experimental support for built-in SVG components.

After enabling the `experimental.svg` flag, `.svg` files can be imported and used as components. They will be inlined into the HTML output.

```astro
---
import Logo from './path/to/svg/file.svg';
---

<Logo size={24} />
```

To learn more, check out [the documentation](https://docs.astro.build/reference/configuration-reference/#experimentalsvg).
