---
title: Shiki demo
layout: ../layouts/main.astro
---

# Shiki demo

```js
var foo = 'bar';

function doSomething() {
  return foo;
}
```

```jsx {1,4-6,11}
  import React from 'react';

  function MyComponent(props) {
    if (props.isBar) {
      return <div>Bar</div>;
    }

    return <div>Foo</div>;
  }

  export default MyComponent;
```
