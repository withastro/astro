---
'astro': patch
---


**BREAKING CHANGE to the experimental Content Security Policy (CSP) only**

Changes the behavior of experimental Content Security Policy (CSP) to now serve hashes differently depending on whether or not a page is prerendered: 

- Via the `<meta>` element for static pages.
- Via the `Response` header `content-security-policy` for on-demand rendered pages.

This new strategy allows you to add CSP content that is not supported in a `<meta>` element (e.g. `report-uri`, `frame-ancestors`, and sandbox directives) to on-demand rendered pages.

No change to your project code is required as this is an implementation detail. However, this will result in a different HTML output for pages that are rendered on demand. Please check your production site to verify that CSP is working as intended.

To keep up to date with this developing feature, or to leave feedback, visit the [CSP Roadmap proposal](https://github.com/withastro/roadmap/blob/feat/rfc-csp/proposals/0055-csp.md).
