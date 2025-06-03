---
'astro': minor
---

Adds experimental Content Security Policy (CSP) support

CSP is an important feature to provide fine-grained control over resources that can or cannot be downloaded and executed by a document. In particular, it can help protect against [cross-site scripting (XSS)](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting) attacks.

Enabling this feature adds additional security to Astro's handling of processed and bundled scripts and styles by default, and allows you to further configure these, and additional, content types. This new experimental feature has been designed to work in every Astro rendering environment (static pages, dynamic pages and single page applications), while giving you maximum flexibility and with type-safety in mind.

It is compatible with most of Astro's features such as client islands, and server islands, although Astro's view transitions using the `<ClientRouter />` are not yet fully supported. Inline scripts are not supported out of the box, but you can provide your own hashes for external and inline scripts.

To enable this feature, add the experimental flag in your Astro config:

```js
// astro.config.mjs
import { defineConfig } from "astro/config" 

export default defineConfig({
  experimental: {
    csp: true
  }
})
```

For more information on enabling and using this feature in your project, see the [Experimental CSP docs](https://docs.astro.build/en/reference/experimental-flags/csp/).

For a complete overview, and to give feedback on this experimental API, see the [Content Security Policy RFC](https://github.com/withastro/roadmap/blob/feat/rfc-csp/proposals/0055-csp.md).
