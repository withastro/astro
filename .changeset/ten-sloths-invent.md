---
'astro': patch
---

Use UInt8Array instead of Buffer for both the input and return values of the `transform()` hook of the Image Service API to ensure compatibility with non-Node runtimes.

This change is unlikely to affect you, but if you were previously relying on the return value being a Buffer, you may convert an `UInt8Array` to a `Buffer` using `Buffer.from(your_array)`.
