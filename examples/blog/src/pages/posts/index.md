---
setup: |
  import Layout from '../../layouts/BlogPost.astro'
  import Cool from '../../components/Author.astro'
title: Hello world!
publishDate: 12 Sep 2021
name: Nate Moore
value: 128
description: Just a Hello World Post!
---

<Cool name={frontmatter.name} href="https://twitter.com/n_moore" client:load />

This is so cool!

Do variables work {frontmatter.value * 2}?

```javascript
// Example JavaScript

const x = 7;
function returnSeven() {
  return x;
}

```
