---
'astro': patch
---

Fixes actions returning 500 for malformed JSON request bodies and undecodable action names. A `SyntaxError` from invalid JSON now returns 400 (`BAD_REQUEST`), and a `URIError` from a malformed percent-encoded action name now returns 404 (`NOT_FOUND`).
