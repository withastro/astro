# Using React with Astro

```
npm init astro -- --template framework-react
```

This example showcases Astro's built-in support for [React](https://reactjs.org/).

No configuration is needed to enable React support—just start writing React components in `src/components`.

> **Note**: If used, components _must_ include the JSX factory (ex. `import React from "react"`). Astro is unable to determine which framework is used without having the [JSX factory](https://mariusschulz.com/blog/per-file-jsx-factories-in-typescript#what-is-a-jsx-factory) in scope.
