---
'astro': patch
---

Adds automatic request signal abortion when the underlying socket closes in the Node.js adapter

The Node.js adapter now automatically aborts the `request.signal` when the client connection is terminated. This enables better resource management and allows applications to properly handle client disconnections through the standard `AbortSignal` API. 
