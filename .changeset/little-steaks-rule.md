---
'astro': patch
---

**BREAKING CHANGE to the experimental SVG Component API only**

Removes some previously available prop, attribute, and configuration options from the experimental SVG API. These items are no longer available and must be removed from your code:

- The `title` prop has been removed until we can settle on the correct balance between developer experience and accessibility. Please replace any `title` props on your components with `aria-label`:
  ```diff
  - <Logo title="My Company Logo" />
  + <Logo aria-label="My Company Logo" />
  ```
- Sprite mode has been temporarily removed while we consider a new implementation that addresses how this feature was being used in practice. This means that there are no longer multiple `mode` options, and all SVGs will be inline. All instances of `mode` must be removed from your project as you can no longer control a mode:
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
