# @astrojs/prefetch

## 0.0.2

### Patch Changes

- [#3736](https://github.com/withastro/astro/pull/3736) [`bd4dac0e`](https://github.com/withastro/astro/commit/bd4dac0e1a8598045f10c42faf08abff96ed6766) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds a new `@astrojs/prefetch` integration with the goal of adding near-instant page navigation for Astro projects. HTML and CSS for visible links marked with `rel="prefetch"` will be preloaded in the browser when the browser is idle.

  **astro.config.mjs**

  ```js
  import prefetch from '@astrojs/prefetch';
  export default {
    // ...
    integrations: [prefetch()],
  };
  ```

  ```html
  <!-- Prefetch HTML and stylesheets for the /products page -->
  <a href="/products" rel="prefetch">All Products</a>
  ```
