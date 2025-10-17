---
'astro': minor
---

Add experimental LLM optimization feature for page responses.

LLM applications often work better with Markdown content than HTML, as it's more structured and semantically clear. This feature enables dynamic content negotiation based on the `Accept` header, allowing LLM tools to request content in Markdown format.

When `experimental.llm.optimizePageResponse` is enabled in your Astro config, pages will automatically convert HTML responses to Markdown when a client sends an `Accept: text/markdown` header. This is particularly useful for:

- LLM-powered chat applications that need to process page content
- Search engines and indexing tools that prefer Markdown
- Server-side rendering scenarios where you want to serve the same page in multiple formats

**Configuration example:**

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  experimental: {
    llm: {
      optimizePageResponse: true,
    },
  },
});
```

When enabled, clients can request Markdown by setting the Accept header:

```bash
curl -H "Accept: text/markdown" https://example.com/page
```

The response will include `Content-Type: text/markdown` and the HTML content will be automatically converted to clean, well-formatted Markdown.
