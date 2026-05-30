---
'astro': patch
---

Simplifies `context.csp.insertDirective` to remove an unreachable `else` branch that would have thrown a `TypeError` if its precondition ever held. The implementation now matches the pattern used by the sibling `insertScriptResource` / `insertStyleResource` methods.