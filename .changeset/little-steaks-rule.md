---
'astro': patch
---

**BREAKING CHANGE to the experimental SVG Component API only**

- The `title` prop has been removed until we can settle on the correct DX and a11y tradeoffs
  ```diff
  - <Logo title="My Company Logo" />
  + <Logo aria-label="My Company Logo" />
  ```
- Sprite mode has been removed until we can find the correct implementation without the footguns of the previous approach.
```diff
- <Logo mode="inline" />
+ <Logo />
```

```diff
import { defineConfig } from 'astro'

export default defineConfig({
  experimental: {
-    svg: {
-      mode: 'sprite'
-    },
+   svg: true
  }
});
```
- The default `role` is no longer applied due to developer feedback. Please add the appropriate `role` on each component individually as needed:
  ```diff
  - <Logo />
  + <Logo role="img" /> // To keep the role that was previously applied by default
  ```
- The `size` prop has been removed to better work in combination with `viewBox` and additional styles/attributes. Please replace `size` with explicit `width` and `height` attributes:
  ```diff
  - <Logo size={64} />
  + <Logo width={64} height={64} />
  ```
