---
'astro': major
---

Updates `<script>` and `<style>` tags to render in the order they are defined

In Astro v5.5, the `experimental.preserveScriptOrder` flag was introduced to render multiple `<style>` and `<script>` tags in the same order as they were declared in the source code. Astro 5.x reversed their order in your generated HTML output. This could give unexpected results, for example, CSS styles being overridden by earlier defined style tags when your site was built.

Astro 6.0 removes this experimental flag and makes this the new default behavior in Astro: scripts and styles are now rendered in the order defined in your code.

#### What should I do?

If you were previously using this experimental feature, you must remove this experimental flag from your configuration as it no longer exists:

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
-    preserveScriptOrder: true,
  },
})
```

Review your `<script>` and `<style>` tags to make sure they behave as desired. You may need to reverse their order:

```diff
<!-- src/components/MyComponent.astro -->
<p>I am a component</p>
<style>
  body {
-    background: red;
+    background: yellow;
  }
</style>
<style>
  body {
-    background: yellow;
+    background: red;
  }
</style>
<script>
-    console.log("hello")
+    console.log("world")
</script>
<script>
-    console.log("world!")
+    console.log("hello!")
</script>
```
