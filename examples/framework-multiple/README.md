# Kitchen Sink: Microfrontends with Astro

```
npm init astro -- --template framework-multiple
```

This example showcases Astro's built-in support for multiple frameworks ([React](https://reactjs.org), [Preact](https://preactjs.com), [Svelte](https://svelte.dev), and [Vue (`v3.x`)](https://v3.vuejs.org/)).

No configuration is needed to enable these frameworks—just start writing components in `src/components`.

> **Note**: If used, components _must_ include a JSX factory (ex. `import React from "react"`, `import { h } from "preact"`). Astro is unable to determine which framework is used without having the [JSX factory](https://mariusschulz.com/blog/per-file-jsx-factories-in-typescript#what-is-a-jsx-factory) in scope.
