---
'@astrojs/preact': minor
'astro': patch
---

Shared state in Preact components with signals

This makes it possible to share client state between Preact islands via signals.

For example, you can create a signals in an Astro component and then pass it to multiple islands:

```astro
---
// Component Imports
import Counter from '../components/Counter';
import { signal } from '@preact/signals';
const count = signal(0);
---

<Count count={count} />
<Count count={count} />
```
