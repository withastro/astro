---
'astro': minor
---

Adds support for passing values other than `"production"` or `"development"` to the `--mode` flag (e.g. `"staging"`, `"testing"`, or any custom value) to change the value of `import.meta.env.MODE` or the loaded `.env` file. This allows you take advantage of Vite's [mode](https://vite.dev/guide/env-and-mode#modes) feature.

Also adds a new `--devOutput` flag for `astro build` that will output a development-based build.

Note that changing the `mode` does not change the kind of code transform handled by Vite and Astro:

- In `astro dev`, Astro will transform code with debug information.
- In `astro build`, Astro will transform code with the most optimized output and removes debug information.
- In `astro build --devOutput` (new flag), Astro will transform code with debug information like in `astro dev`. 

This enables various usecases like:

```bash
# Run the dev server connected to a "staging" API
astro dev --mode staging

# Build a site that connects to a "staging" API
astro build --mode staging

# Build a site that connects to a "production" API with additional debug information
astro build --devOutput

# Build a site that connects to a "testing" API
astro build --mode testing
```

The different modes can be used to load different `.env` files, e.g. `.env.staging` or `.env.production`, which can be customized for each environment, for example with different `API_URL` environment variable values.
