---
"@astrojs/db": patch
---

Improves the typing of the `asDrizzleTable()` utility

Fixes a type error when passing the output of `defineTable()` to the utility and returns a more detailed type inferred from the columns of the passed table config.
