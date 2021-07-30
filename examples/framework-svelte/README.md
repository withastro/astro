# Using Svelte with Astro

This example showcases Astro's built-in support for [Svelte](https://svelte.dev/).

## Installation

### Automatic

Bootstrap your Astro project with this template!

```shell
npm init astro -- --template framework-svelte
```

### Manual

To use Svelte components in your Astro project:

1. Install `@astrojs/renderer-svelte`

    ```shell
    npm i @astrojs/renderer-svelte
    ```

2. Add `"@astrojs/renderer-svelte"` to your `renderers` in `astro.config.mjs`.

    ```js
    export default {
      renderers: [
        "@astrojs/renderer-svelte",
        // optionally, others...
      ]
    }
    ```

## Usage

Write your Svelte components as `.svelte` files in your project.
