---
'@astrojs/markdoc': minor
'@astrojs/markdown-remark': minor
'astro': minor
---

Updates the internal `shiki` syntax highlighter to `shikiji`, an ESM-focused alternative that simplifies bundling and maintenance. 

There are no new options and no changes to how you author code blocks and syntax highlighting.

**Potentially breaking change:** While this refactor should be transparent for most projects, the transition to `shikiji` now produces a smaller HTML markup by attaching a fallback `color` style to the `pre` or `code` element, instead of to the line `span` directly. For example:

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

This does not affect the colors as the `span` will inherit the `color` from the parent, but if you're relying on a specific HTML markup, please check your site carefully after upgrading to verify the styles.
