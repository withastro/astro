---
"@astrojs/vercel": minor
---

Introduces a new config options, `isr`, that allows to deploy your project as an ISR function. [ISR (Incremental Static Regeneration)](https://vercel.com/docs/incremental-static-regeneration) caches your on-demand rendered pages in the same way as prerendered pages after first request.

To enable this feature, set `isr` to true in your `astro.config.mjs`:

```js
export default defineConfig({
    output: "server",
    adapter: vercel({ isr: true })
})
```

##### Time-based invalidation

By default, ISR responses are cached for the duration of your deployment. You can change this by setting `isr` to an object with an `expiration` field:

```js
export default defineConfig({
    output: "server",
    adapter: vercel({
        isr: {
            // caches all pages on first request and saves for 1 day
            revalidate: 60 * 60 * 24
        }
    })
})
```

##### Manual invalidation

To implement [Draft mode](https://vercel.com/docs/build-output-api/v3/features#draft-mode), or [On-Demand Incremental Static Regeneration (ISR)](https://vercel.com/docs/build-output-api/v3/features#on-demand-incremental-static-regeneration-isr), you can create a bypass token and provide it to the `isr` config: 

```js
export default defineConfig({
    output: "server",
    adapter: vercel({
        isr: {
            // A secret random string that you create.
            bypassToken: "005556d774a8",
            // Paths that will always be served fresh.
            exclude: [ "/api/invalidate" ] 
        }
    })
})
```

Note that ISR function requests do not include search params, similar to [requests](https://docs.astro.build/en/reference/api-reference/#astrorequest) in static mode.
