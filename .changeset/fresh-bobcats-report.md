---
'@astrojs/solid-js': minor
---

Adds `createIslandSignal` for sharing reactive signals across multiple Solid islands

A new `createIslandSignal` function, importable from `@astrojs/solid-js/signals`, lets you create a signal in `.astro` frontmatter and pass it to multiple `client:*` Solid components. All islands that receive the same signal share a single reactive instance on the client, so updating the signal in one island automatically updates the others.

```astro
---
import { createIslandSignal } from '@astrojs/solid-js/signals';
import Counter from '../components/Counter';
import Display from '../components/Display';
const [count, setCount] = createIslandSignal(0);
---
<Counter count={count} setCount={setCount} client:load />
<Display count={count} client:load />
```

Signals can also be passed inside arrays and objects. Setters are supported as props alongside getters.
