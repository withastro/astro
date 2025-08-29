---
'astro': patch
---

**BREAKING CHANGES only to the experimental CSP feature**

The following runtime APIs of the `Astro` global have been renamed:
- `Astro.insertDirective` to `Astro.csp.insertDirective`
- `Astro.insertStyleResource` to `Astro.csp.insertStyleResource`
- `Astro.insertStyleHash` to `Astro.csp.insertStyleHash`
- `Astro.insertScriptResource` to `Astro.csp.insertScriptResource`
- `Astro.insertScriptHash` to `Astro.csp.insertScriptHash`


The following runtime APIs of the `APIContext` have been renamed:
- `ctx.insertDirective` to `ctx.csp.insertDirective`
- `ctx.insertStyleResource` to `ctx.csp.insertStyleResource`
- `ctx.insertStyleHash` to `ctx.csp.insertStyleHash`
- `ctx.insertScriptResource` to `ctx.csp.insertScriptResource`
- `ctx.insertScriptHash` to `ctx.csp.insertScriptHash`
