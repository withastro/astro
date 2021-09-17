---
setup: |
  import Layout from '../../layouts/BlogPost.astro'
  import Cool from '../../components/Author.astro'
name: Nate Moore
value: 128
---

# Hello world!

<Cool name={frontmatter.name} href="https://twitter.com/n_moore" client:load />

This is so cool! 

Do variables work {frontmatter.value * 2}?
