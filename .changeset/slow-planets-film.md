---
'astro': minor
---

Adds support for client:only hydrator

The new `client:only` hydrator allows you to define a component that should be skipped during the build and only hydrated in the browser.

In most cases it is best to render placeholder content during the build, but that may not always be feasible if an NPM dependency attempts to use browser APIs as soon as is imported.

**Note** If more than one renderer is included in your Astro config, you need to include a hint to determine which renderer to use. Renderers will be matched to the name provided in your Astro config, similar to `<MyComponent client:only="@astrojs/renderer-react" />`. Shorthand can be used for `@astrojs` renderers, i.e. `<MyComponent client:only="react" />` will use `@astrojs/renderer-react`.

An example usage:

```jsx
---
import BarChart from '../components/BarChart.jsx';
---

<BarChart client:only />
/**
 * If multiple renderers are included in the Astro config,
 * this will ensure that the component is hydrated with
 * the Preact renderer.
 */
<BarChart client:only="preact" />
/**
 * If a custom renderer is required, use the same name
 * provided in the Astro config.
 */
<BarChart client:only="my-custom-renderer" />
```

This allows you to import a chart component dependent on d3.js while making sure that the component isn't rendered at all at build time.