# Development Server

The development server comes as part of the Astro CLI. Start the server with:

```shell
astro dev
```

In your project root. You can specify an alternative

## Special routes

The dev server will serve the following special routes:

### /400

This is a custom **400** status code page. You can add this route by adding a page component to your `src/pages` folder:

```
├── src/
│   ├── components/
│   └── pages/
│       └── 400.astro
```

For any URL you visit that doesn't have a corresponding page, the `400.astro` file will be used.

### /500

This is a custom **500** status code page. You can add this route by adding a page component to your `src/pages` folder:

```
├── src/ 
│   ├── components/ 
│   └── pages/ 
│       └── 500.astro
```

This page is used any time an error occurs in the dev server.

The 500 page will receive an `error` query parameter which you can access with:

```
---
const error = Astro.request.url.searchParams.get('error');
---

<strong>{error}</strong>
```

A default error page is included with Astro so you will get pretty error messages even without adding a custom 500 page.
