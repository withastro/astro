---
"@astrojs/mdx": patch
---

Updates the `optimize` option to group static sibling nodes as a `<Fragment />`. This reduces the number of AST nodes and simplifies runtime rendering of MDX pages.
