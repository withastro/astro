---
'astro': major
---

The Rust-based Astro compiler (`@astrojs/compiler-rs`) is now the default compiler. This new compiler is faster and more reliable, leading to faster build times and iteration cycles during development.

This new compiler is more strict regarding invalid syntax. For example, unclosed HTML tags will now throw an error instead of being ignored. It also does not attempt to correct semantically invalid HTML anymore, instead leaving it to the browser to handle, similar to other tools or `document.write()` in JavaScript.

The previous Go-based compiler has been removed, along with the `experimental.rustCompiler` flag used to opt into the Rust compiler. If you were setting `experimental.rustCompiler` in your `astro.config.mjs`, you can now remove it. No other action is required.
