---
'astro': patch
---

RFC 0006: Support for non-HTML pages

This adds support for generating non-HTML pages form `.js` and `.ts` pages during the build.

> ⚠️ This API is part of static site generation! Keep an eye out for future releases with SSR support to handle building pages on-demand from an Astro server(less) function.

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