---
'astro': patch
---

Support for Deno to install npm pacakges.

Deno requires npm prefix to install packages on npm. For example, to install react, we need to run `deno add npm:react`. But currently the command executed is `deno add react`, which doesn't work. So, we change the package names to have an npm prefix if you are using Deno.
