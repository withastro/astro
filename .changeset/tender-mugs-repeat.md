---
'@astrojs/language-server': patch
---

Fixes `astro check` and editor errors such as "Component 'Tag' is not a valid component" in components whose `Props` are generic, such as those using the `Polymorphic` type
