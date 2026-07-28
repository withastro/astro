---
'astro': patch
---

Fixes tsconfig `baseUrl` and `paths` aliases not resolving in Sass and Less style imports

`@use` and `@import` in `<style lang="scss">`, `<style lang="sass">`, and `<style lang="less">` blocks now resolve against your `tsconfig.json` `baseUrl` and `paths`, matching how these aliases already work in JavaScript and TypeScript. For example, with `"paths": { "@styles/*": ["src/styles/*"] }`, `@import "@styles/variables"` now resolves correctly.
