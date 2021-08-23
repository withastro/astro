---
layout: ~/layouts/MainLayout.astro
title: Debugging
---

Since Astro runs on the server and logs to your terminal, it can be difficult to debug values from Astro. Astro's built-in `<Debug>` component can help you inspect values inside your files on the clientside.

## Usage

```astro
---
import Debug from 'astro/debug';
const serverObject = {
  a: 0,
  b: "string",
  c: {
    nested: "object"
  }
}
---

<Debug {serverObject} />
```
