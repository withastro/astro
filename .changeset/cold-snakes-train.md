---
"@astrojs/markdown-remark": minor
---

Adds a `data-language` attribute on the rendered `pre` elements to expose the highlighted syntax language.

For example, the following markdown fenced-codeblock will expose `data-language="python"`:
```
\```python
def func():
    print('Hello Astro!')
\```
```

This allows retrieving the language in a rehype plugin:
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

Note: if using the built-in `<Code>` component, the output of the component being flattened html, the replacement `<pre>` cannot be accessed using `{ tagName: "pre" }`.


It also allows to use the `data-language` attribute in css rules:
```css
pre::before {
    content: attr(data-language);
}

pre[data-language="javascript"] {
  font-size: 2rem;
}
```

