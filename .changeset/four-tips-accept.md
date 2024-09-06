---
'astro': patch
---

Allow passing a cryptography key via ASTRO_KEY

For Server islands Astro creates a cryptography key in order to hash props for the islands, preventing accidental leakage of secrets.

If you deploy to an environment with rolling updates then there could be multiple instances of your app with different keys, causing potential key mismatches.

To fix this you can now pass the `ASTRO_KEY` environment variable to your build in order to reuse the same key.

To generate a key use:

```
astro create-key
```

This will print out an environment variable to set like:

```
ASTRO_KEY=PIAuyPNn2aKU/bviapEuc/nVzdzZPizKNo3OqF/5PmQ=
```
