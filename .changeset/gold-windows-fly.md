---
'@astrojs/lit': major
---

Update to use `@lit-labs/ssr@^3`
**[BREAKING]** DOM shim required for Lit SSR has been greatly reduced. `window`, `document`, and other objects are no longer available in global. Most SSR-ready component code should not be affected but, if so, they can be fixed with optional chaining or by using the `isServer` environment checker from the `lit` package. See [lit.dev docs on authoring components for SSR].(https://lit.dev/docs/ssr/authoring/#browser-only-code)
**[BREAKING]** Adds compatibility with `lit@2.7.0` hydration behavior. Do not update if you're using `lit@2.6.1` or lower.
Includes support for template[shadowrootmode] support.
