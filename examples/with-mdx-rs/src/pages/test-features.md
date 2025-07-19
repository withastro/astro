---
title: 'Comprehensive Feature Test'
description: 'Testing all MDX-rs features'
layout: ../layouts/Layout.astro
tags: ['test', 'mdx-rs', 'features']
published: true
date: 2024-01-01
---

# 🧪 Comprehensive Feature Test

This page tests all features of the MDX-rs processor.

## Frontmatter Features ✅

The frontmatter above includes:
- String values (title, description)
- Array values (tags)
- Boolean values (published)
- Date values (date)

## Heading Tests with Slugs

### Level 3 Heading with Spaces
#### Level 4 Heading with Special Characters & Symbols!
##### Level 5 Heading with Numbers 123 and More
###### Level 6 Heading with Multiple  Spaces   Between Words

## Text Formatting

**Bold text** and *italic text* and ***bold italic text***.

~~Strikethrough text~~ and `inline code`.

## Lists

### Unordered Lists
- Item 1
- Item 2
  - Nested item A
  - Nested item B
- Item 3

### Ordered Lists
1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
3. Third item

## Code Blocks

```javascript
// JavaScript code block
const processor = await createMarkdownProcessorRouter({
  markdownRS: true,
  markdownRSOptions: {
    parallelism: 4,
    fallbackToJs: true,
  },
});

console.log('MDX-rs is fast!');
```

```python
# Python code block
def hello_mdx_rs():
    return "Hello from Rust-powered MDX!"

print(hello_mdx_rs())
```

```rust
// Rust code block (meta!)
use mdx_rs::compile;

fn main() {
    let content = "# Hello MDX!";
    let result = compile(content);
    println!("Compiled: {}", result);
}
```

## Image Tests

### Markdown Images
![Remote test image](https://picsum.photos/200/100)

### HTML Images
<img src="https://picsum.photos/300/150" alt="Remote HTML image" />

### Data URLs (should be ignored)
![Data URL image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==)

## Tables

| Feature       | JavaScript | MDX-rs (Rust) | Status |
| ------------- | ---------- | -------------- | ------ |
| Speed         | 1x         | 7-20x faster   | ✅     |
| Memory        | Higher     | Lower          | ✅     |
| Frontmatter   | ✅         | ✅             | ✅     |
| Code blocks   | ✅         | ✅             | ✅     |
| Images        | ✅         | ✅             | ✅     |
| Tables        | ✅         | ✅             | ✅     |

## Links

[Internal link](/test-features)
[External link](https://astro.build)
[Link with title](https://github.com/withastro/astro "Astro GitHub")

## Blockquotes

> This is a blockquote testing MDX-rs processing.
> 
> It spans multiple lines and should be properly formatted.

> **Note**: This is a styled blockquote with formatting.

## Horizontal Rules

---

## Complex Nested Content

1. **Ordered list with formatting**
   - Nested unordered item with `inline code`
   - Another item with [a link](https://astro.build)
   
2. **Item with code block**
   ```bash
   # Command example
   pnpm run dev
   ```

3. **Item with table**
   
   | Column 1 | Column 2 |
   | -------- | -------- |
   | Value A  | Value B  |

## Special Characters

Testing unicode: 🚀 🧪 ⚡ ✅ 📝 🔧

Testing HTML entities: &lt; &gt; &amp; &quot; &#x27;

## GFM Features (if enabled)

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

## Math (if supported)

Inline math: $E = mc^2$

Block math:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

---

**Test completed!** If you can see this content properly formatted, MDX-rs is working correctly.