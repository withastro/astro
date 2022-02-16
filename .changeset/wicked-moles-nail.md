---
'@example/with-markdown-shiki': minor
'astro': minor
---

Highlight a specific line in code block

You can specify highlighted line ranges within the language meta string (leave a space after the language). To highlight multiple lines, separate the line numbers by commas or use the range syntax to select a chunk of lines. 

```jsx {1,4-6,11}
import React from 'react';    // <--- highlighting line

function MyComponent(props) {
  if (props.isBar) {          // <--- highlighting line
    return <div>Bar</div>;    // <--- highlighting line
  }                           // <--- highlighting line

  return <div>Foo</div>;
}

export default MyComponent;   // <--- highlighting line
```

Try it `examples/with-markdown-shiki`.
