---
'astro': minor
---

Adds a new optional `prerenderedErrorPageFetch` option in the Adapter API to allow adapters to provide custom implementations for fetching prerendered error pages.

Now, adapters can override the default `fetch()` behavior, for example when `fetch()` is unavailable or when you cannot call the server from itself.

The following example provides a custom fetch for `500.html` and `404.html`, reading them from disk instead of performing an HTTP call:
```js "prerenderedErrorPageFetch"
return app.render(request, {
  prerenderedErrorPageFetch: async (url: string): Promise<Response> => {
    if (url.includes("/500")) {
        const content = await fs.promises.readFile("500.html", "utf-8");
        return new Response(content, {
          status: 500,
          headers: { "Content-Type": "text/html" },
        });
    }
    const content = await fs.promises.readFile("404.html", "utf-8");
      return new Response(content, {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
});
```
If no value is provided, Astro will fallback to its default behavior for fetching error pages.

Read more about this feature in the [Adapter API reference](https://docs.astro.build/en/reference/adapter-reference/#prerenderederrorpagefetch).
