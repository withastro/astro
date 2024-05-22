---
"astro": minor
---

Adds compatibility for Astro Actions in the React 19 beta. Actions can be passed to a `form action` prop directly, and Astro will automatically add metadata for progressive enhancement.

```tsx
import { actions } from 'astro:actions';

function Like() {
  return (
    <form action={actions.like}>
      {/* auto-inserts hidden input for progressive enhancement */}
      <button type="submit">Like</button>
    </form>
  )
}
```
