# Using Preact with Astro

```
npm init astro --template framework-preact
```

This example showcases Astro's built-in support for [Preact](https://preactjs.com/).

No configuration is needed to enable Preact support—just start writing Preact components in `src/components`.

> **Note**: If used, components _must_ include the JSX factory (ex. `import { h } from "preact"`). Astro is unable to determine which framework is used without having the [JSX factory](https://mariusschulz.com/blog/per-file-jsx-factories-in-typescript#what-is-a-jsx-factory) in scope.
