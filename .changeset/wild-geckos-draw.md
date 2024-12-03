---
'astro': patch
---

Keep clientAddress on cloned requests

User observed that calling actions resulted in an error about not having
clientRequest available.

This is because the user had a middleware that cloned the request, which
loses all of the symbols.

The fix is to pass the clientAddress directly into the RenderContext.
This deprecates the `clientAddressSymbol`, but we need to keep it for
now because some adapters set the clientAddress that way.

Note that similar fixes should be done for other symbol usage on the
Request object (locals is one).
