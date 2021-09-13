# @astrojs/language-server

## 0.7.8

### Patch Changes

- f2f7fc8: Removes errors shown when using Astro.resolve

## 0.7.7

### Patch Changes

- 6501757: Fixes false-positive errors on importing images

## 0.7.6

### Patch Changes

- ea2d56d: Bump version to fix unpublished version in npm

## 0.7.4

### Patch Changes

- 6604c9f: Fixes diagnostic false-positive caused by doctype

## 0.7.3

### Patch Changes

- 8f7bd34: Fixes false-positive error when using blockquotes within Markdown component

## 0.7.2

### Patch Changes

- 1b3a832: Adds diagnostics (errors and warnings)

## 0.7.1

### Patch Changes

- 7874c06: Improves completion performance

  Completion performance is improved by fixing a bug where we were giving the TypeScript compiler API the wrong name of files, causing it to search for files for a long time.

## 0.7.0

### Minor Changes

- 72d3ff0: Adds support for prop completion from ts/jsx files

## 0.6.0

- Fixes bug with signature help not appear in the component script section.
- Adds completion suggestions for Astro.\* APIs in the component script.
- Adds support for Hover based hints in the component script section.
- Fixes bug with Go to Definition (cmd + click) of Components.

## 0.5.0

- Fix `bin` file

## 0.5.0-next.1

- Expose `bin/server.js` as `astro-ls`

## 0.5.0-next.0

- Moved to scoped `@astrojs/language-server` package
- Removed some `devDependencies` from the bundle and added them to `dependencies`

## 0.4.0

### Minor Changes

- 06e2597: Adds support for import suggestions
