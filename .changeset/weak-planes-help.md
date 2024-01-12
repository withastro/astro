---
"astro": minor
---

You can now let links within custom elements trigger view transitions. Presence of the `data-astro-transition` attribute on a custom component will trigger a view transition when the link is clicked. You no longer need to use the lower-level `navigate()` function.

```html
<custom-element data-astro-transition href="/two">
    #shadowroot
    <button>Navigate with view transitions.</button>
</custom-element>
```
