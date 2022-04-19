---
title: Blog Post with JSX expressions
paragraph: JSX at the start of the line!
list: ['test-1', 'test-2', 'test-3']
---

## {frontmatter.title}

{frontmatter.paragraph}

{frontmatter.list.map(item => <p id={item}>{item}</p>)}
