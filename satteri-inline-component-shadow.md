# Sätteri MDX bug: local bindings shadowed by `_components` destructuring

## Summary

When an MDX file uses a JSX component whose name is already bound at module scope (either imported or exported locally), Sätteri's `mdxToJs` still emits a `const { Name } = _components` destructuring inside `_createMdxContent`. That destructuring shadows the module-level binding and, when `props.components.Name` is not supplied, hits `_missingMdxReference("Name", true)` and throws.

Standard `@mdx-js/mdx` doesn't destructure names that already have a module-scope binding. The local binding wins.

## Repro

```js
import { mdxToJs } from 'satteri';

const { code } = await mdxToJs(
  `export const Comp = () => <span>Comp</span>\n\n<Comp />\n`,
  { jsxImportSource: 'astro', filename: 'test.mdx' },
);
console.log(code);
```

Sätteri output (the broken part):

```js
export const Comp = () => _jsx("span", { children: "Comp" });

function _createMdxContent(props) {
    const _components = Object.assign({ p: "p" }, props.components);
    const { Comp } = _components;                    // shadows module-level Comp
    if (!Comp) _missingMdxReference("Comp", true);   // throws when prop not provided
    return _jsx(_components.p, { children: _jsx(Comp, {}) });
}
```

`@mdx-js/mdx` output for the same input:

```js
const Comp = () => <span>Comp</span>;

function _createMdxContent(props) {
    const _components = { p: "p", ...props.components };
    return <_components.p><Comp /></_components.p>;
}
```

## Cases to cover

The fix needs to skip the destructuring + missing-reference check for any uppercase JSX identifier that already has a module-scope binding. Sources of bindings:

1. Top-level `export const X = …` / `export function X() {…}` / `export class X {}`.
2. `export { X }` re-exports.
3. Top-level `import X from …` (default).
4. Top-level `import { X } from …` (named) and `import { Y as X }`.
5. Top-level `import * as X from …`.
6. Top-level `const X = …` / `let X = …` / `function X(){}` / `class X {}` that aren't exported (rare in MDX but legal).

Identifiers used in JSX that have *no* module-scope binding should still be destructured and checked — that path is correct.

Mixed example (only `NotInScope` should be destructured):

```mdx
import Other from './other.jsx'
export const Comp = () => <span>Comp</span>

<Comp /> and <Other /> and <NotInScope />
```

Current Sätteri output (incorrect):

```js
const { Comp, NotInScope } = _components;
if (!Comp) _missingMdxReference("Comp", true);
if (!NotInScope) _missingMdxReference("NotInScope", true);
```

Expected:

```js
const { NotInScope } = _components;
if (!NotInScope) _missingMdxReference("NotInScope", true);
```

`Comp` resolves to the module-level `const Comp`, `Other` resolves to the import.

## Fix plan

In the MDX-to-JS lowering pass (the stage that synthesizes `_createMdxContent`):

1. Build a set of module-scope binding names before walking JSX. Walk the program's top-level statements once and collect names from imports, exports, and top-level declarations.
2. When building the list of JSX identifiers to surface from `_components`, exclude any name present in that set.
3. When emitting the `if (!Name) _missingMdxReference("Name", true)` guards, exclude the same names.
4. If the resulting destructuring pattern is empty, omit the `const { } = _components;` statement entirely.

The set should respect lexical scope: a JSX identifier inside a nested function that shadows a module-scope name with a local declaration shouldn't be excluded. In practice MDX content is at the top level of `_createMdxContent`, so module-scope is the only scope that matters here, but the implementation should still walk scopes correctly to avoid future regressions.

## Tests to add in Sätteri

Add cases to whatever harness covers `mdxToJs`:

1. `export const Comp = …` then `<Comp />` — destructuring should not include `Comp`; no missing-ref guard for `Comp`.
2. `import X from 'foo'` then `<X />` — same.
3. `import { X } from 'foo'` then `<X />` — same.
4. `import * as N from 'foo'` then `<N.Thing />` — namespace member access uses `N` directly; `N` should not be destructured.
5. Mixed: locally-bound `<Comp />` plus unbound `<Other />` — destructuring should only include `Other`, only `Other` gets a missing-ref guard.
6. `export { X } from './x.js'` — re-exports also bind `X` in scope; should be excluded.
7. Lowercase tags (`<p>`, `<h1>`) — still get pulled from `_components` (unchanged).

## Verification in Astro

After Sätteri ships the fix:

1. Bump `satteri` and `@astrojs/markdown-satteri` to the patched version.
2. `pnpm --filter @astrojs/mdx test`. The 5 cascaded failures in `test/mdx-plus-react.test.ts` should clear without changes to `inline-component.mdx` or the test file. The build error currently raised at `src/pages/inline-component.mdx` during the fixture's `before` hook is the only thing keeping them red.

## Workaround (only if Sätteri can't ship soon)

Post-process the compiled JS in `packages/integrations/mdx/src/satteri/index.ts` after `mdxToJs` returns: scan top-level exports/imports with `es-module-lexer`, then strip matching entries from `const { … } = _components;` and remove the corresponding `_missingMdxReference` lines. This is regex-fragile and shouldn't ship if the upstream fix is in reach.
