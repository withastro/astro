---
'astro': patch
---

Adds support for `Date()`, `Map()`, and `Set()` from action results. See [devalue](https://github.com/Rich-Harris/devalue) for a complete list of supported values.

Also fixes serialization exceptions when deploying Actions with edge middleware on Netlify and Vercel.
