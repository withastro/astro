---
'astro': minor
---

Adds a new experimental flag called `experimental.transparentScriptOrder` that renders `<script>` and `<style>` tags in the same order as they are defined.

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

When `experimental.transparentScriptOrder` is set to `true`, the order of the two styles is kept as it is, and in the style generated `red` appears first, and then `yellow`:

```css
body {background:red} body{background:#ff0}
```


