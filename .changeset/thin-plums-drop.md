---
'@astrojs/react': patch
---

fix a bug where react identifierPrefix was set to null for client:only components causing React.useId to generate ids prefixed with null
