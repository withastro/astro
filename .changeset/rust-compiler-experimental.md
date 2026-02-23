---
'astro': minor
---

Adds a new `experimental.rustCompiler` flag to opt into the experimental Rust-based Astro compiler

This experimental compiler is faster, provides better error messages, and generally has better support for modern JavaScript, TypeScript, and CSS features.

After enabling in your Astro config, the `@astrojs/compiler-rs` package must also be installed into your project separately:

```js
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
    rustCompiler: true
  }
});
```

This new compiler is still in early development and may exhibit some differences compared to the existing Go-based compiler. Notably, this compiler is generally more strict in regard to invalid  HTML syntax and may throw errors in cases where the Go-based compiler would have been more lenient. For example, unclosed tags (e.g. `<p>My paragraph`) will now result in errors.

For more information about using this experimental feature in your project, especially regarding expected differences and limitations, please see the [experimental Rust compiler reference docs](https://v6.docs.astro.build/en/reference/experimental-flags/rust-compiler/). To give feedback on the compiler, or to keep up with its development, see the [RFC for a new compiler for Astro](https://github.com/withastro/roadmap/discussions/1306) for more information and discussion.
