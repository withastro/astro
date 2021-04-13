---
layout: ../layouts/content.astro
title: My Blog Post
description: This is a post about some stuff.
import:
  Hello: '../components/Hello.jsx'
  Counter: '../components/Counter.jsx'
---

## Interesting Topic

<Hello name={`world`} />
<Counter:load />