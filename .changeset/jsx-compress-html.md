---
'astro': minor
---

Adds support for a new `'jsx'` value for the `compressHTML` option. When set, whitespace is stripped using JSX whitespace rules instead of the default HTML compression strategy.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  compressHTML: 'jsx',
});
```

In JSX, whitespaces never matter, as such, no amount of indentation, or newlines will not affect the rendered output. For instance, the following code:

```jsx
<div>
  <span>foo</span>
	<span>bar</span>
</div>
```

will be rendered as `foobar`, whereas with HTML whitespace rules, a space would be present between the words due to the newline and indentation between the tags.
