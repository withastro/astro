# @astrojs/parser

## 0.22.1

## 0.22.0

### Minor Changes

- [#2202](https://github.com/withastro/astro/pull/2202) [`45cea6ae`](https://github.com/withastro/astro/commit/45cea6aec5a310fed4cb8da0d96670d6b99a2539) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Officially drop support for Node v12. The minimum supported version is now Node v14.15+,

## 0.20.3

## 0.20.2

### Patch Changes

- 5d2ea578: fixed an issue using namespaced attributes in astro files

## 0.18.6

## 0.18.5

### Patch Changes

- cd2b5df4: Prevents locking up checking for --- inside of the HTML portion

## 0.18.0

### Patch Changes

- a7e6666: compile javascript to target Node v12.x
- 294a656: Adds support for global style blocks via `<style global>`

  Be careful with this escape hatch! This is best reserved for uses like importing styling libraries like Tailwind, or changing global CSS variables.

- b85e68a: Fixes case where custom elements are not handled within JSX expressions

## 0.18.0-next.5

### Patch Changes

- 294a656: Adds support for global style blocks via `<style global>`

  Be careful with this escape hatch! This is best reserved for uses like importing styling libraries like Tailwind, or changing global CSS variables.

## 0.18.0-next.2

### Patch Changes

- a7e6666: compile javascript to target Node v12.x
- b85e68a: Fixes case where custom elements are not handled within JSX expressions

## 0.15.4

### Patch Changes

- 6a660f1: Adds low-level custom element support that renderers can use to enable server side rendering. This will be used in renderers such as a Lit renderer.

## 0.15.0

### Patch Changes

- 47ac2cc: Fix #521, allowing `{...spread}` props to work again

## 0.13.10

### Patch Changes

- 7f8d586: Bugfix: template literals in JSX tags breaking parser

## 0.13.9

### Patch Changes

- f9f2da4: Add repository key to all package.json

## 0.13.8

### Patch Changes

- 490f2be: Add support for Fragments with `<>` and `</>` syntax

## 0.13.3

### Patch Changes

- ab2972b: Update package.json engines for esm support

## 0.12.1

### Patch Changes

- 6de740d: Fix for when there's a parser error with unmatched backticks

## 0.12.0

### Patch Changes

- d2330a5: Improve error display for missing local files

### 0.12.0-next.0

### Patch Changes

- Fixes a few more Markdown issues

## 0.11.0

### Patch Changes

- 9cdada0: Fixes a few edge case bugs with Astro's handling of Markdown content

## 0.1.0

### Minor Changes

- b3886c2: Enhanced **Markdown** support! Markdown processing has been moved from `micromark` to `remark` to prepare Astro for user-provided `remark` plugins _in the future_.

  This change also introduces a built-in `<Markdown>` component for embedding Markdown and any Astro-supported component format inside of `.astro` files. [Read more about Astro's Markdown support.](https://docs.astro.build/markdown/)
