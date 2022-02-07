---
'astro': minor
---

Add support for the `set:html` and `set:text` directives. 

With the introduction of these directives, unescaped HTML content in expressions is now deprecated. Please migrate to `set:html` in order to continue injecting unescaped HTML in future versions of Astro—you can use `<Fragment set:html={content}>` to avoid a wrapper element. `set:text` allows you to opt-in to escaping now, but it will soon become the default.

