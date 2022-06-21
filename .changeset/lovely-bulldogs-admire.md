---
'@astrojs/preact': minor
'@astrojs/react': minor
'@astrojs/solid-js': minor
---

Add support for passing named slots from `.astro` => framework components.

Each `slot` is be passed as a top-level prop. For example:

```jsx
// From .astro
<Component>
  <h2 slot="title">Hello world!</h2>
  <h2 slot="slot-with-dash">Dash</h2>
  <div>Default</div>
</Component>

// For .jsx
export default function Component({ title, slotWithDash, children }) {
  return (
    <>
      <div id="title">{title}</div>
      <div id="slot-with-dash">{slotWithDash}</div>
      <div id="main">{children}</div>
    </>
  )
}
```
