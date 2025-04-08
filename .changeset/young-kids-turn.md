---
'@astrojs/markdoc': minor
'astro': minor
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

A few other features that were available during the experimental stage have been removed. These items are no longer available and must be removed from your code:

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

If you have been waiting for stabilization before using the SVG Components feature, you can now do so.

Please see [SVG Components page in docs](https://docs.astro.build/en/svg-components/) for more about this feature.
