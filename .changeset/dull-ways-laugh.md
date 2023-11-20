---
'@astrojs/react': patch
---

Simplify React component check

In Astro 3 we added the `include` and `exclude` config options for controlling which type of JSX component to build. Because of that we can now simplify our React check function and prevent swallowing errors/warnings that have occured in the past.
