# Using Preact with Astro

This example showcases Astro's built-in support for [Preact](https://www.preactjs.com/).

## Installation

### Automatic

Bootstrap your Astro project with this template!

```shell
npm init astro -- --template framework-preact
```

### Manual

To use Preact components in your Astro project:

1. Install `@astrojs/renderer-preact`

    ```shell
    npm i @astrojs/renderer-preact
    ```

2. Add `"@astrojs/renderer-preact"` to your `renderers` in `astro.config.mjs`.

    ```js
    export default {
      renderers: [
        "@astrojs/renderer-preact",
        // optionally, others...
      ]
    }
    ```

## Usage

Write your Preact components as `.jsx` or `.tsx` files in your project.
