---
'astro': patch
---

Support for non-HTML pages

> ⚠️ This feature is currently only supported with the `--experimental-static-build` CLI flag. This feature may be refined over the next few weeks/months as SSR support is finalized.

This adds support for generating non-HTML pages form `.js` and `.ts` pages during the build. Built file and extensions are based on the source file's name, ex: `src/pages/data.json.ts` will be built to `dist/data.json`.

**Is this different from SSR?** Yes! This feature allows JSON, XML, etc. files to be output at build time. Keep an eye out for full SSR support if you need to build similar files when requested, for example as a serverless function in your deployment host.

## Examples

```typescript
// src/pages/company.json.ts
export async function get() {
    return {
        body: JSON.stringify({
            name: 'Astro Technology Company',
            url: 'https://astro.build/'
        })
    }
}
```

What about `getStaticPaths()`?  It **just works**™.

```typescript
export async function getStaticPaths() {
    return [
        { params: { slug: 'thing1' }},
        { params: { slug: 'thing2' }}
    ]
}

export async function get(params) {
    const { slug } = params
    
    return {
        body: // ...JSON.stringify()
    }
}
```