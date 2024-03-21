---
"astro": patch
---

Use ReadableStream if asyncIterator is not supported in Response construction. This patch enables astro node integration to work in Deno.
