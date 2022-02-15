---
layout: ../layouts/content.astro
---

# Hello world

```jsx {1,4-6,11} hasLineNumber
  import React from 'react';

  function MyComponent(props) {
    if (props.isBar) {
      return <div>Bar</div>;
    }

    return <div>Foo</div>;
  }

  export default MyComponent;
```
