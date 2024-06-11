---
"astro": minor
---

Improves the developer experience of the `500.astro` file by passing it a new `error` prop.

When an error is thrown, the special `src/pages/500.astro` page now automatically receives the error as a prop. This allows you to display more specific information about the error on a custom 500 page.

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

If an error occurs rendering this page, your host's default 500 error page will be shown to your visitor in production, and Astro's default error overlay will be shown in development.
