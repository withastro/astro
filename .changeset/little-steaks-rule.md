---
'astro': patch
---

The SVG import feature introduced behind a flag in [v5.0.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#500) is no longer experimental and is available for general use.

This feature allows you to import SVG files directly into your Astro project as components and inlining them into your HTML.

To use this feature, import an SVG file in your Astro project, passing any common SVG attributes to the imported component.

```astro
---
import Logo from './path/to/svg/file.svg';
---

<Logo />
```

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
import { defineConfig } from 'astro'

export default defineConfig({
-  experimental: {
-    svg: true,
-  }
})
```

A few other features that were available during the experimental stage have been removed. Be sure to update your implementations based on the following:

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


If you have been waiting for stabilization before using the SVG Components feature, you can now do so.

Please see [SVG Components page in docs](https://docs.astro.build/en/svg-components/) for more about this feature.
