---
title: "MDX-rs Test Page"
description: "Testing Rust-based MDX compilation"
tags: ["test", "mdx-rs", "rust"]
---

# MDX-rs Basic Test

This page tests the Rust-based MDX compiler for compatibility with the JavaScript implementation.

## Features Tested

### Text Formatting
Here we test **bold text**, *italic text*, and ~~strikethrough text~~.

### Code Blocks
```javascript
// This tests syntax highlighting
const hello = "world";
console.log(`Hello, ${hello}!`);

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

### Lists
- Unordered list item 1
- Unordered list item 2
  - Nested item
  - Another nested item
- Unordered list item 3

1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

### Images
![Test Image](./test-image.png)
![Remote Image](https://example.com/remote-image.jpg)

### Links
[Internal Link](/other-page)
[External Link](https://astro.build)

### Blockquotes
> This is a blockquote to test quote handling.
> 
> Multiple paragraphs in blockquotes should work too.

### Tables
| Feature | JavaScript | Rust |
|---------|------------|------|
| Speed   | Normal     | Fast |
| Memory  | Higher     | Lower |
| Compatibility | 100% | 99%+ |

### Headings Test
# H1 Heading
## H2 Heading  
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading