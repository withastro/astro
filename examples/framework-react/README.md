# Using React with Astro

This example showcases Astro's built-in support for [React](https://reactjs.org/).

## Installation

### Automatic

Bootstrap your Astro project with this template!

```shell
npm init astro -- --template framework-react
```

### Manual

To use React components in your Astro project:

1. Install `@astrojs/renderer-react`

    ```shell
    npm i @astrojs/renderer-react
    ```

2. Add `"@astrojs/renderer-react"` to your `renderers` in `astro.config.mjs`.

    ```js
    export default {
      renderers: [
        "@astrojs/renderer-react",
        // optionally, others...
      ]
    }
    ```

## Usage

Write your React components as `.jsx` or `.tsx` files in your project.
