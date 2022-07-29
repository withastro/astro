---
'astro': patch
---

Adds `Astro.generator` which can be used to add a [`<meta name="generator">`](https://html.spec.whatwg.org/multipage/semantics.html#meta-generator) tag.

```astro
<html>
  <head>
    <meta name="generator" content={Astro.generator} />
  </head>
  <body>
    <footer>
      <p>Built with <a href="https://astro.build">{Astro.generator}</a></p>
    </footer>
  </body>
</html>
```
