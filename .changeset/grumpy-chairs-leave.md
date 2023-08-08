---
'astro': major
---

Adjust `astro-island` serialization approach.

Previously, Astro had custom serialization logic that created a large HTML attribute and came with a deserialization cost on the client. Now, component props are serialized using [`seroval`](https://github.com/lxsmnsyc/seroval) and injected as a `<script>`.

This should significantly reduce the size and runtime cost of large data objects.
