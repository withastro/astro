---
'astro': minor
---

Adds a new `experimental.rustCompiler` flag to opt into the experimental Rust-based Astro compiler (`@astrojs/compiler-rs`). When enabled, `@astrojs/compiler-rs` must be installed into your project separately.

This new compiler is still in early development and may exhibit some differences compared to the existing Go-based compiler. The only expected difference at this time is that this compiler is generally more strict in regard to invalid syntax and may throw errors in cases where the Go-based compiler would have been more lenient. For example, unclosed tags will now result in errors.
