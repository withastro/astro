---
'astro': patch
---

Add support for components defined in Frontmatter. Previously, the following code would throw an error. Now it is officially supported!

```astro
---
const { level = 1 } = Astro.props;
const Element = `h${level}`;
---

<Element>Hello world!</Element>
```
