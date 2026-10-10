---
'astro': patch
---

Fixes actions returning a 500 error when the request has a malformed JSON body, or when the action name has an invalid percent-encoding or points to a group of actions. These requests now return a 400 (`BAD_REQUEST`) or 404 (`NOT_FOUND`) action error.
