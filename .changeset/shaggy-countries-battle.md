---
'astro': minor
---

**This is a breaking change**

Updated the rendering pipeline for `astro` to truly support any framework.

For the vast majority of use cases, `astro` should _just work_ out of the box. Astro now depends on `@astro-renderer/preact`, `@astro-renderer/react`, `@astro-renderer/svelte`, and `@astro-renderer/vue`, rather than these being built into the core library. This opens the door for anyone to contribute additional renderers for Astro to support their favorite framework, as well as the ability for users to control which renderers should be used.

**Features**

- Expose a pluggable interface for controlling server-side rendering and client-side hydration
- Allows components from different frameworks to be nested within each other.
  > Note: `svelte` currently does support non-destructive hydration, so components from other frameworks cannot currently be nested inside of a Svelte component. See https://github.com/sveltejs/svelte/issues/4308.

**Breaking Changes**

- To improve compiler performance, improve framework support, and minimize JS payloads, any children passed to hydrated components are automatically wrapped with an `<astro-fragment>` element.
