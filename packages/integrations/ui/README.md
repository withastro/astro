# @astrojs/ui (prototype)

> **Prototype.** This package explores an idea and is not published. The API will change or go away.

Plain TypeScript frontend code for Astro components, with signals bound directly to DOM nodes. It is progressive enhancement: the server renders HTML, and `<script scoped>` attaches behavior to it.

```astro
---
import { signal } from '@astrojs/ui';
const count = signal(Astro.props.start ?? 0);
---

<output>{count}</output>
<button class="inc">+</button>

<script scoped>
  const count = scope('output').text(); // the frontmatter signal, revived
  scope('.inc').on('click', () => count(count() + 1));
</script>
```

```js
// astro.config.mjs
import ui from '@astrojs/ui/integration';

export default defineConfig({ integrations: [ui()] });
```

## What it does

- **`<script scoped>`** runs once per component instance. `scope(selector)` sees only that instance's own markup: not other instances, not the insides of child components, but it does see content the instance passes into a child's `<slot>`. It throws if nothing matches.
- **Signals in the frontmatter** render as their value plus a marker. On the client each one is revived once by id, so a signal passed to several components is one shared signal in the browser, and bindings work with no script at all. Text bindings are one-way; `value` and `checked` on form controls are two-way.
- **`scope.list(container, template, row => item)`** adopts server-rendered rows and clones the `<template>` for new ones. The row function binds a row's DOM to signals and returns the item, so items are their own keys. Setting `items()` reorders, filters or removes rows with keyed reconciliation.
- **`Ref`**: `.text()`, `.value()`, `.checked()` and `.attr(name)` return signals; `.text(fn)`, `.attr(name, fn)`, `.class(name, fn)` and `.show(fn)` keep the DOM in sync with a function; `.on()` adds listeners.

For types inside scoped scripts, add `/// <reference types="@astrojs/ui/scope" />` to `src/env.d.ts`.

## How it works

The integration rewrites `.astro` source (parsed with `@astrojs/compiler-rs`) before Astro compiles it:

| Source                                       | Becomes                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `<script scoped>body</script>`               | `<script>` calling `__register(cid, name, (scope) => { body })`, with imports hoisted |
| template of a component with a scoped script | wrapped in `<!--ui:i cid-->` … `<!--/ui:i-->`                                         |
| `<slot />` in such a component               | wrapped in `<!--ui:s-->` … `<!--/ui:s-->`                                             |
| `{ident}` / `{a.b}` text                     | `{__ui.text(…)}`, unchanged unless the value is a signal                              |
| `attr={expr}` on an HTML element             | `attr={__ui.val(…)} data-ui-a-attr={__ui.bind(…)}`                                    |

The client runtime walks the document once. Instance markers build an element → instance ownership map (slot markers hand ownership back to the outer instance), and binding markers revive signals. Each scoped script then runs per instance of its component.

## Example: 7GUIs Cells

`test/fixtures/cells` implements [7GUIs Cells](https://eugenkiss.github.io/7guis/tasks#cells): a 26 × 100 spreadsheet with formulas (`=B1*C1`, `=sum(D1:D3)`), in-cell and formula-bar editing, keyboard navigation, error values and cycle detection.

- Each cell is one `signal` (its formula) and one `computed` (its value). Dependencies between cells are whatever a formula reads, so there is no dependency graph or recalculation code.
- The formula engine is plain TypeScript shared by the server and the client. The server renders computed values, so the sheet is readable before any JavaScript runs.
- All 2,600 cells are set up with `scope.all('td[data-ref]')`, using `.text()` and `.class()` bindings. The client ships about 6 KB gzipped, including the formula engine.

Building it turned up two things a real version should handle:

- A `computed` that ends up reading itself through other cells gets a stale value from alien-signals instead of an error. The example checks for cycles from each formula's references before evaluating. A library-level answer (throwing on re-entrant reads) would be friendlier.
- Events from an element inside a delegated container bubble to the container's handlers too. Here, the Enter that closes the cell editor also reopened it. Plain DOM rules, but easy to miss.

## Open questions

- Queries are document-wide and then filtered by owner; a real version would query within each instance's top-level nodes.
- Instances added after load (view transitions, client-inserted HTML) are not picked up yet.
- Removed list rows keep their effects so they can come back (filtering, undo); rows that are really gone should be disposed.
- Server signal ids come from a process-wide counter. Module-level signals are shared across requests, as with any framework, and should be documented as an anti-pattern.
- Only bare identifiers and member expressions are checked for signals in templates; `{count() * 2}` renders once and is not bound.
- Selectors passed to `scope()` could be checked against the template at build time.
