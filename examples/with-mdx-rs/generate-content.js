import fs from 'node:fs';
import path from 'node:path';

// Generate multiple MDX files for benchmarking
const CONTENT_COUNT = 100;
const EXAMPLES_DIR = './src/pages/examples';

// Ensure directory exists
fs.mkdirSync(EXAMPLES_DIR, { recursive: true });

// Sample content templates
const templates = [
  {
    name: 'blog-post',
    content: `---
title: "Blog Post {id}"
date: "2024-01-{day:02d}"
author: "Test Author"
tags: ["blog", "performance", "test"]
---

# Blog Post {id}: Performance Testing

This is a sample blog post to test MDX-rs compilation performance.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Code Example

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci({id}));
\`\`\`

## Features

- **Fast compilation** with Rust
- **Memory efficient** processing
- **Automatic fallback** to JavaScript

### Performance Metrics

| Metric | Value |
|--------|-------|
| Compilation Time | {time}ms |
| Memory Usage | {memory}MB |
| File Size | {size}KB |

## Conclusion

The Rust-based MDX compiler provides significant performance improvements for large-scale Astro sites.

![Performance Chart](https://example.com/chart-{id}.png)
`
  },
  {
    name: 'documentation',
    content: `---
title: "Documentation Page {id}"
category: "docs"
order: {id}
---

# Documentation: Feature {id}

This documentation page tests complex markdown features.

## Overview

\`\`\`typescript
interface Config{id} {
  enabled: boolean;
  performance: {
    parallelism: number;
    cacheDir: string;
  };
}

const config: Config{id} = {
  enabled: true,
  performance: {
    parallelism: 4,
    cacheDir: './cache',
  },
};
\`\`\`

## Usage Examples

### Basic Usage

\`\`\`bash
npm install feature-{id}
npm run build
\`\`\`

### Advanced Configuration

> **Note**: This feature requires Node.js 18+

1. Install dependencies
2. Configure settings
3. Run build process

## API Reference

### \`function process{id}()\`

Processes data with feature {id}.

**Parameters:**
- \`data\`: Input data
- \`options\`: Configuration options

**Returns:** Processed result

## Examples

![Example {id}](./images/example-{id}.jpg)

### Code Snippet

\`\`\`python
def process_data_{id}(data):
    result = []
    for item in data:
        if item.valid:
            result.append(transform(item))
    return result
\`\`\`
`
  },
  {
    name: 'tutorial',
    content: `---
title: "Tutorial {id}: Getting Started"
difficulty: "beginner"
duration: "{time} minutes"
---

# Tutorial {id}: Building with MDX-rs

Learn how to use feature {id} effectively.

## Prerequisites

- Basic knowledge of Markdown
- Familiarity with React/JSX
- Node.js {version} or higher

## Step 1: Installation

\`\`\`bash
npm create astro@latest my-project-{id}
cd my-project-{id}
npm install
\`\`\`

## Step 2: Configuration

Create \`astro.config.mjs\`:

\`\`\`javascript
export default defineConfig({
  experimental: {
    experimentalRs: true,
  },
  markdown: {
    rsOptions: {
      parallelism: {id},
    },
  },
});
\`\`\`

## Step 3: Create Content

\`\`\`markdown
---
title: "My Page {id}"
---

# Hello from Tutorial {id}

This is **bold** and *italic* text.
\`\`\`

## Step 4: Build and Test

\`\`\`bash
npm run build
npm run preview
\`\`\`

### Expected Results

- Build time: ~{time}ms
- Bundle size: ~{size}KB
- Performance score: {score}/100

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version
2. **Slow compilation**: Increase parallelism
3. **Memory errors**: Reduce parallelism

### Solutions

> If you encounter issues, try enabling fallback mode:

\`\`\`javascript
rsOptions: {
  fallbackToJs: true,
}
\`\`\`

## Next Steps

- [Advanced Configuration](/tutorial-{next})
- [Performance Optimization](/docs/performance)
- [Deployment Guide](/deploy)
`
  }
];

console.log(`Generating ${CONTENT_COUNT} content files...`);

for (let i = 1; i <= CONTENT_COUNT; i++) {
  const template = templates[i % templates.length];
  const day = (i % 30) + 1;
  const time = Math.floor(Math.random() * 1000) + 100;
  const memory = Math.floor(Math.random() * 50) + 10;
  const size = Math.floor(Math.random() * 100) + 20;
  const version = Math.floor(Math.random() * 3) + 18;
  const score = Math.floor(Math.random() * 30) + 70;
  const next = (i % CONTENT_COUNT) + 1;
  
  let content = template.content
    .replace(/{id}/g, i)
    .replace(/{day:02d}/g, day.toString().padStart(2, '0'))
    .replace(/{time}/g, time)
    .replace(/{memory}/g, memory)
    .replace(/{size}/g, size)
    .replace(/{version}/g, version)
    .replace(/{score}/g, score)
    .replace(/{next}/g, next);
  
  const filename = `${template.name}-${i.toString().padStart(3, '0')}.md`;
  const filepath = path.join(EXAMPLES_DIR, filename);
  
  fs.writeFileSync(filepath, content);
  
  if (i % 10 === 0) {
    console.log(`Generated ${i}/${CONTENT_COUNT} files...`);
  }
}

console.log(`✅ Generated ${CONTENT_COUNT} content files in ${EXAMPLES_DIR}/`);
console.log('Run `npm run build` to test compilation performance!');