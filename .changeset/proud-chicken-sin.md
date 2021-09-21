---
'astro': patch
---

Adds the `astro check` command

This adds a new command, `astro check` which runs diagnostics on a project. The same diagnostics run within the Astro VSCode plugin! Just run:

```shell
astro check
```

Which works a lot like `tsc` and will give you error messages, if any were found. We recommend adding this to your CI setup to prevent errors from being merged.