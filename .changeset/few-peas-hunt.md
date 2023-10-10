---
'@astrojs/markdoc': minor
'@astrojs/markdown-remark': minor
'astro': minor
---

Update internal `shiki` syntax highlighter to `shikiji`. Existing docs on `shiki` still stays the same, but `shikiji` will help make bundling simpler and easier to maintain.

`shikiji` also produces a smaller HTML output by attaching fallback `color` styles on the `pre` or `code` element instead of to the line `span` directly. For example:

Before:

```html
<code class="astro-code" style="background-color: #24292e">
  <pre>
    <span class="line" style="color: #e1e4e8">my code</span>
  </pre>
</code>
```

After:

```html
<code class="astro-code" style="background-color: #24292e; color: #e1e4e8">
  <pre>
    <span class="line">my code<span>
  </pre>
</code>
```

This shouldn't affect most existing styles as assigning a color to `span` or `.line` didn't work before, but if you did create this style anyways, it may now indirectly affect syntax highlighting. 
