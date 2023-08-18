---
'astro': patch
---

Deprecate returning simple objects from endpoints. Endpoints should only return a `Response`.

To return a result with a custom encoding not supported by a `Response`, you can use the `ResponseWithEncoding` utility class instead.

Before:

```ts
export function GET() {
  return {
    body: '...',
    encoding: 'binary',
  };
}
```

After:

```ts
export function GET({ ResponseWithEncoding }) {
  return new ResponseWithEncoding('...', undefined, 'binary');
}
```
