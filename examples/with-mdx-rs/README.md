# Astro Example: MDX-rs (Rust-based MDX Compiler)

This example demonstrates the experimental Rust-based MDX compiler integration in Astro.

The Rust MDX compiler provides significant performance improvements (7-20x faster) compared to the JavaScript implementation for large-scale sites with many MDX files.

## Features

- **Experimental Rust Compiler**: Uses `@mdx-js/mdx-rs` for fast compilation
- **Automatic Fallback**: Falls back to JavaScript compiler if Rust compilation fails
- **Performance Optimized**: Configurable parallelism and caching
- **100+ Test Files**: Includes numerous MDX files for benchmarking

## Configuration

The Rust compiler is enabled in `astro.config.mjs`:

```js
export default defineConfig({
  experimental: {
    experimentalRs: true,
  },
  markdown: {
    rsOptions: {
      fallbackToJs: true,
      cacheDir: './node_modules/.astro/mdx-rs',
      parallelism: 4,
    },
  },
});
```

## Setup

```bash
npm install
npm run dev
```

## Benchmarking

To compare performance between the Rust and JavaScript compilers:

```bash
npm run benchmark
```

## Options

### `experimental.experimentalRs`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enables the experimental Rust-based MDX compiler

### `markdown.rsOptions.fallbackToJs`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Automatically fallback to JavaScript compiler if Rust compilation fails

### `markdown.rsOptions.cacheDir`

- **Type**: `string`
- **Default**: `'./node_modules/.astro/mdx-rs'`
- **Description**: Directory to store compiled MDX cache

### `markdown.rsOptions.parallelism`

- **Type**: `number`
- **Default**: `1`
- **Description**: Number of parallel worker threads for compilation

## Requirements

- Node.js 18.20.8+ or 20.3.0+ or 22.0.0+
- `@mdx-js/mdx-rs` package (installed as optional dependency)

## Performance

The Rust compiler provides significant performance benefits:

- **Small projects** (< 10 files): Minimal difference
- **Medium projects** (10-100 files): 3-7x faster
- **Large projects** (100+ files): 7-20x faster

## Compatibility

The Rust compiler maintains near-100% compatibility with the JavaScript implementation, supporting:

- All standard Markdown syntax
- MDX components and expressions
- Frontmatter extraction
- Heading and image path extraction
- Custom remark/rehype plugins (with limitations)

## Troubleshooting

If you encounter issues:

1. **Check dependencies**: Ensure `@mdx-js/mdx-rs` is installed
2. **Fallback enabled**: Keep `fallbackToJs: true` for reliability
3. **Check logs**: Astro will log when falling back to JavaScript
4. **Report issues**: The Rust compiler is experimental - please report bugs

## Learn More

- [Astro MDX Documentation](https://docs.astro.build/en/guides/markdown-content/)
- [Experimental Flags](https://docs.astro.build/en/reference/experimental-flags/)
- [Performance Guide](https://docs.astro.build/en/guides/performance/)
