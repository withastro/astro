---
'astro': minor
---

Added support for updating TypeScript settings automatically when using `astro add`

The `astro add` command will now automatically update your `tsconfig.json` with the proper TypeScript settings needed for the chosen frameworks. 

For instance, typing `astro add solid` will update your `tsconfig.json` with the following settings, per [Solid's TypeScript guide](https://www.solidjs.com/guides/typescript):

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "solid-js"
  }
}
```
