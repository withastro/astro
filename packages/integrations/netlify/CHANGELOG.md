# @astrojs/netlify

## 0.0.2

### Patch Changes

- [#2879](https://github.com/withastro/astro/pull/2879) [`80034c6c`](https://github.com/withastro/astro/commit/80034c6cbc89761618847e6df43fd49560a05aa9) Thanks [@matthewp](https://github.com/matthewp)! - Netlify Adapter

  This change adds a Netlify adapter that uses Netlify Functions. You can use it like so:

  ```js
  import { defineConfig } from 'astro/config';
  import netlify from '@astrojs/netlify/functions';

  export default defineConfig({
  	adapter: netlify(),
  });
  ```
