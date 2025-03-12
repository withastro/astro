---
'astro': minor
---

Adds a new experimental flag called `experimental.preserveScriptOrder` that renders `<script>` and `<style>` tags in the same order as they are defined.

When rendering multiple `<style>` and `<script>` tags on the same page, Astro currently reverses their order in your generated HTML output. This can give unexpected results, for example CSS styles being overridden by earlier defined style tags when your site is built.

With the new `preserveScriptOrder` flag enabled, Astro will generate the styles in the order they are defined:

```js title="astro.config.mjs"
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    preserveScriptOrder: true,
  },
});
```
For example, the following component has two `<style>` tags, and both define the same style for the `body` tag:

```html
<p>I am a component</p>
<style>
  body {
    background: red;
  }
</style>
<style>
  body {
    background: yellow;
  }
</style>
```

Once the project is compiled, Astro will create an inline style where `yellow` appears first, and then `red`. Ultimately, the `red` background is applied:

```css
body {background:#ff0} body {background:red}
```

When `experimental.preserveScriptOrder` is set to `true`, the order of the two styles is kept as it is, and in the style generated `red` appears first, and then `yellow`:

```css
body {background:red} body {background:#ff0}
```

This is a breaking change to how Astro renders project code that contains multiple `<style>` and `<script>` tags in the same component. If you were previously compensating for Astro's behavior by writing these out of order, you will need to update your code.

This will eventually become the new default Astro behavior, so we encourage you to add this experimental style and script ordering as soon as you are able! This will help us test the new behavior and ensure your code is ready when this becomes the new normal.

For more information as this feature develops, please see the [experimental script order docs](https://docs.astro.build/en/reference/experimental-flags/preserve-script-order/).
