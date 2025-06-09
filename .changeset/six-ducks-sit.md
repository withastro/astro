---
'astro': patch
---

**BREAKING CHANGE to the experimental Content Security Policy feature only**

Removes support for experimental Content Security Policy (CSP) when using the `<ClientRouter />` component for view transitions.

It is no longer possible to enable experimental CSP while using Astro's view transitions. Support was already unstable with the `<ClientRouter />` because CSP required making its underlying implementation asynchronous. This caused breaking changes for several users and therefore, this PR removes support completely.

If you are currently using the component for view transitions, please remove the experimental CSP flag as they cannot be used together.

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
-   csp: true
   }
});
```


Alternatively, to continue using experimental CSP in your project, you can [consider migrating to the browser native View Transition API](https://events-3bg.pages.dev/jotter/astro-view-transitions/) and remove the `<ClientRouter />` from your project. You may be able to achieve similar results if you are not using Astro's enhancements to the native View Transitions and Navigation APIs.

Support might be reintroduced in future releases. You can follow this experimental feature's development in [the CSP RFC](https://github.com/withastro/roadmap/blob/feat/rfc-csp/proposals/0055-csp.md).
