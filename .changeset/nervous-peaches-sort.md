---
'astro': patch
---

Ensure we target scripts for execution in the router

Using `document.scripts` is unsafe because if the application has a `name="scripts"` this will shadow the built-in `document.scripts`. Fix is to use `getElementsByTagName` to ensure we're only grabbing real scripts.
