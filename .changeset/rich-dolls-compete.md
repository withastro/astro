---
"astro": minor
---

Improves the developer experience of the `500.astro` file.

The special `src/pages/500.astro` page now accepts an error as a prop. It can be anything, so make sure to handle it properly:

```astro
---
// src/pages/500.astro
interface Props {
    error: unknown
}

const { error } = Astro.props
---

<div>{error instanceof Error ? error.message : 'Unknown error'}</div>
```

Additionally, you can now use your custom 500 error page in development by setting the `ASTRO_CUSTOM_500` environment variable to `'true'`. For example, using a `.env` file:

```ini
ASTRO_CUSTOM_500=true
```

Or inline:

```sh
ASTRO_CUSTOM_500=true astro dev
```

Note that if an error occurs in this file, it will default to the host 500 error page in SSR and the error overlay in development.
