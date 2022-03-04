---
'astro': minor
---

New default build strategy

This change marks the "static build" as the new default build strategy. If you are unfamiliar with this build strategy check out the [migration guide](https://docs.astro.build/en/migrate/#planned-deprecations) on how to change your code to be compatible with this new bulid strategy.

If you'd like to keep using the old build strategy, use the flag `--legacy-build` both in your `astro dev` and `astro build` scripts, for ex:

```json
{
  "scripts": {
    "build": "astro build --legacy-build"
  }
}
```

Note that the legacy build *is* deprecated and will be removed in a future version. You should only use this flag until you have the time to migration your code.
