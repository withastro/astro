---
'@astrojs/markdoc': patch
---

Fixes custom attributes on Markdoc's built-in `{% table %}` tag causing "Invalid attribute" validation errors.

In Markdoc, `table` exists as both a tag (`{% table %}`) and a node (the inner table structure). When users defined custom attributes on either `nodes.table` or `tags.table`, the attributes weren't synced to the counterpart, causing validation to fail on whichever side was missing the declaration.

The fix automatically syncs custom attribute declarations between tags and nodes that share the same name, so users can define attributes on either side and have them work correctly.
