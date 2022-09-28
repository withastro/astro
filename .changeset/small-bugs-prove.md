---
'astro': minor
---

Order Astro styles last, to override imported styles

This fixes CSS ordering so that imported styles are placed *higher* than page/component level styles. This means that if you do:

```astro
---
import '../styles/global.css';
---
<style>
  body {
    background: limegreen;
  }
</style>
```

The `<style>` defined in this component will be placed *below* the imported CSS. When compiled for production this will result in something like this:

```css
/* /src/styles/global.css */
body {
  background: blue;
}

/* /src/pages/index.astro */
body:where(.astro-12345) {
  background: limegreen;
}
```

Given Astro's 0-specificity hashing, this change effectively makes it so that Astro styles "win" when they have the same specificity as global styles.
