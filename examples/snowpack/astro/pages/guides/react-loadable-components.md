---
layout: layouts/content.astro
title: React + Loadable Components
published: false
---

<div class="notification">
  This guide has an example repo:
  <a href="https://github.com/snowpackjs/snowpack/examples/react-loadable-components">examples/react-loadable-components</a>
</div>

_Based on [app-template-react][app-template-react]_

You can lazy load React components in Snowpack when needed with React‘s builtin `React.lazy` ([docs][react-lazy]):

```jsx
import React, { useState, useEffect, Suspense } from 'react';

const Async = React.lazy(() => import('./Async'));

function Component() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <Async />
      </Suspense>
    </div>
  );
}
```

This works out-of-the-box in Snowpack, with no configuration needed!

### Learn more

- [`React.lazy` documentation on reactjs.org][react-lazy]

[react-lazy]: https://reactjs.org/docs/code-splitting.html#reactlazy
