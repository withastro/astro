# Using Vue with Astro

This example showcases Astro's built-in support for [Vue](https://v3.vuejs.org/).

## Installation

### Automatic

Bootstrap your Astro project with this template!

```shell
npm init astro -- --template framework-vue
```

### Manual

To use Vue components in your Astro project:

1. Install `@astrojs/renderer-vue`

    ```shell
    npm i @astrojs/renderer-vue
    ```

2. Add `"@astrojs/renderer-vue"` to your `renderers` in `astro.config.mjs`.

    ```js
    export default {
      renderers: [
        "@astrojs/renderer-vue",
        // optionally, others...
      ]
    }
    ```

## Usage

Write your Vue components as `.vue` files in your project.
