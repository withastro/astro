---
'astro': minor
---

Adds a new, optional property `timeout` for the `client:idle` directive. 

This value allows you to specify a maximum time to wait, in milliseconds, before hydrating a UI framework component, even if the page is not yet done with its initial load. This means you can delay hydration for lower-priority UI elements with more control to ensure your element is interactive within a specified time frame.

```astro
<ShowHideButton client:idle={{timeout: 500}} />
```
