---
'astro': patch
---

Fixes a bug where Astro didn't properly combine CSP resources from the `csp` configuration with those added using the runtime API (`Astro.csp.insertDirective()`) to form grammatically correct CSP headers

Now Astro correctly deduplicate CSP resources. For example, if you have a global resource in the configuration file, and then you add a 
a new one using the runtime APIs.
