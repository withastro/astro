---
layout: layouts/content.hmx
title: Preact
tags: communityGuide
img: '/img/logos/preact.svg'
imgBackground: '#333333'
description: With Snowpack you can import and use Preact without any custom configuration needed.
---

You can import and use Preact without any custom configuration needed.

**To use `preact/compat`:** (the Preact+React compatability layer) alias the "compat" package to React in your install options:

```js
// Example: Lets you import "react" in your application, but uses preact internally
// snowpack.config.json
"alias": {
    "react": "preact/compat",
    "react-dom": "preact/compat"
}
```
