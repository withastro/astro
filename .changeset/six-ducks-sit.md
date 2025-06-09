---
'astro': patch
---

**BREAKING CHANGE to the experimental Content Security Policy feature only**

The `ClientRouter` component doesn't support CSP anymore. Supporting CSP meant to
to make the underling implementation of view transition asynchronous, which caused
some breaking changes to users.

The support might be introduced in future releases.
