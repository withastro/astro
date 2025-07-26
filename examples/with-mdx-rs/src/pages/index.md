---
title: 'MDX-rs Performance Demo'
description: 'Demonstration of Rust-based MDX compilation in Astro'
layout: ../layouts/Layout.astro
---

# 🚀 MDX-rs Performance Demo

Welcome to the **experimental Rust-based MDX compiler** demonstration for Astro!

## What is MDX-rs?

MDX-rs is a high-performance, Rust-based implementation of the MDX compiler that provides:

- **7-20x faster compilation** for large-scale sites
- **Lower memory usage** compared to the JavaScript implementation
- **Near-100% compatibility** with existing MDX content
- **Automatic fallback** to JavaScript on errors

## Performance Comparison

| Metric            | JavaScript    | Rust (MDX-rs) |
| ----------------- | ------------- | ------------- |
| **Speed**         | 1x (baseline) | 7-20x faster  |
| **Memory**        | Higher        | Lower         |
| **Compatibility** | 100%          | 99%+          |
| **Stability**     | Stable        | Experimental  |

## Code Example

```javascript
// Example of fast compilation with MDX-rs
import { createMarkdownProcessorRouter } from 'astro/markdown';

const processor = await createMarkdownProcessorRouter({
  markdownRS: true,
  markdownRSOptions: {
    parallelism: 4,
    fallbackToJs: true,
  },
});

// Processes 10x faster with Rust!
const result = await processor.render(content);
```

## Test Content

This site includes **100+ MDX files** to demonstrate the performance benefits at scale.

### Features Tested

- [Standard markdown syntax](/examples/standard-syntax)
- [Code highlighting](/examples/code-blocks)
- [Complex layouts](/examples/complex-layouts)
- [Image processing](/examples/images)
- [Multiple languages](/examples/i18n)

## Getting Started

Enable MDX-rs in your `astro.config.mjs`:

```js
export default defineConfig({
  experimental: {
    markdownRS: true,
  },
  markdown: {
    markdownRSOptions: {
      fallbackToJs: true,
      parallelism: 4,
    },
  },
});
```

---

**Note**: MDX-rs is an experimental feature. Please report any issues you encounter!

[View Source](https://github.com/withastro/astro) | [Documentation](https://docs.astro.build)
