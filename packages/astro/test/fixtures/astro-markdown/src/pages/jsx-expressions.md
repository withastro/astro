---
title: Blog Post with JSX expressions
paragraph: JSX at the start of the line!
list: ['test-1', 'test-2', 'test-3']
---

## {frontmatter.title}

{frontmatter.paragraph}

<ul>
  {frontmatter.list.map(item => <li id={item}>{item}</li>)}
</ul>
