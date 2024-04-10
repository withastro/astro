---
"@astrojs/markdown-remark": minor
---

Adds a `data-language` attribute on the rendered `pre` elements to expose the highlighted syntax language.

For example, the following Markdown code block will expose `data-language="python"`:
```
\```python
def func():
    print('Hello Astro!')
\```
```

This allows retrieving the language in a rehype plugin from `node.properties.dataLanguage` by accessing the `<pre>` element using `{ tagName: "pre" }`:
```js
// myRehypePre.js
import { visit } from "unist-util-visit";
export default function myRehypePre() {
  return (tree) => {
    visit(tree, { tagName: "pre" }, (node) => {
      const lang = node.properties.dataLanguage;
      [...]
    });
  };
}
```

Note: The `<pre>` element is not exposed when using Astro's `<Code />` component which outputs flattened HTML.


The `data-language` attribute may also be used in css rules:
```css
pre::before {
    content: attr(data-language);
}

pre[data-language="javascript"] {
  font-size: 2rem;
}
```

