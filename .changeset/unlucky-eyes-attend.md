---
'astro': patch
---

Add support for optional integrations

By making integration optional, Astro can now ignore null, undefined or other [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) "Integration" values instead of giving an internal error most devs can't and/or won't understand.
		 
This also enables conditional integrations,
e.g. 
```ts
integration: [ 
  // Only run `compress` integration when in production environments, etc...
  import.meta.env.production ? compress() : null
]
```