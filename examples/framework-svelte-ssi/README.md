# Astro + Svelte with Nginx SSI

This example shows the need for the additional directive `client:load="dom"`. The directive prevents hydration before
the page hasn't completely rendered. With `client:load` on the `Page.svelte` component, the hydration will start before
the document has completely loaded and will duplicate elements below the SSI.

### How to run

The demonstration utilizes Astro / Svelte and Nginx. You need to start both services.

#### Astro / Svelte

This will run the astro application on port 3001.

```shell
pnpm run dev
```

#### Nginx

Nginx is required to simulate the SSI rendering for the included fragment.

```shell
cd nginx
docker-compose up
```

#### Visit the example page

Go to [http://localhost:3000](http://localhost:3000).

This example showcases Astro working with [Svelte](https://svelte.dev/)
and [Nginx SSI](http://nginx.org/en/docs/http/ngx_http_ssi_module.html) includes.
