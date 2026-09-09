---
'@astrojs/solid-js': minor
---

Adds support for Solid server components (experimental)

Enable with `serverFunctions: { components: true }` — `"use server"` functions that return a component, riding the server-function endpoint:

```jsx
// src/frames/panel.jsx
'use server';

export async function getPanel(name) {
  return (props) => (
    <section>
      <h2>panel:{name}</h2>
      {props.children}
    </section>
  );
}
```

```jsx
// inside an island
const Panel = dynamic(() => getPanel(name()));
```

Server components render inline during island SSR and are adopted at boot with zero endpoint requests; re-evaluations stream over the endpoint and morph the boundary in place, preserving client slot state and DOM identity. The integration wires all the pieces: the frames render plugin and direct-call transform on the server, the endpoint response transform through the handler, and `installServerComponents()` via Astro's `before-hydration` stage on the client.
