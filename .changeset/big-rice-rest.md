---
'@astrojs/markdoc': patch
'astro': patch
---

Support automatic image optimization for Markdoc images when using `experimental.assets`. You can [follow our Assets guide](https://docs.astro.build/en/guides/assets/#enabling-assets-in-your-project) to enable this feature in your project. Then, start using relative or aliased image sources in your Markdoc files for automatic optimization:

```md
<!--Relative paths-->
![The Milky Way Galaxy](../assets/galaxy.jpg)
<!--Or configured aliases-->
![Houston smiling and looking cute](~/assets/houston-smiling.jpg)
```
