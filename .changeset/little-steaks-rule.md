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
  - The `mode` prop has been removed due to the removal of Sprite mode.
    ```diff
    - <Logo mode="inline" />
    + <Logo />
    ```
  - The `mode` config option has been removed due to the removal of Sprite mode.
    ```diff
    import { defineConfig } from 'astro'

    export default defineConfig({
    -  experimental: {
    -    svg: {
    -      mode: 'sprite'
    -    },
    -  }
    });
    ```
- The default `role` is no longer applied due to developer feedback.
  ```diff
  - <Logo />
  + <Logo role="img" /> // NOTE: Only necessary if you wish to keep this functionality
  ```
- The `size` prop has been removed as developers expressed confusion on how it would work in combination with `viewBox` and additional styles/attributes.
  ```diff
  - <Logo size={64} />
  + <Logo width={64} height={64} />
  ```
