# create-astro

## 0.6.9

### Patch Changes

- [#2124](https://github.com/withastro/astro/pull/2124) [`c0f29bcf`](https://github.com/withastro/astro/commit/c0f29bcf8c2b943e4a8101cae4f893b13a4b832c) Thanks [@leosvelperez](https://github.com/leosvelperez)! - Parse --renderers flag correctly when passed to the create-astro cli

## 0.6.8

### Patch Changes

- 3e1bdb1a: Add a helpful message for the "could not find commit hash for ..." error

## 0.6.7

## 0.6.7-next.1

### Patch Changes

- 6c66d483: Fix issue with v7.x+ versions of npm init, which changed default flag handling

## 0.6.7-next.0

### Patch Changes

- 6c66d483: Fix issue with v7.x+ versions of npm init, which changed default flag handling

## 0.6.6

### Patch Changes

- d5fdeefe: Changes create-astro to pull examples from the latest branch

## 0.6.5

### Patch Changes

- 025f5e3f: Fix to revert change pointing create-astro at the latest branch

## 0.6.4

### Patch Changes

- 28f00566: Updates create-astro to use the latest branch

## 0.6.3

### Patch Changes

- 0eeb2534: change rm to unlink for node 12 compatability

## 0.6.2

### Patch Changes

- 11a6f884: Added a check to see if the renderers array is empty and only show the message about using the templates default renderers if it isn't

## 0.6.1

### Patch Changes

- 24dce41c: Adds a new template 'minimal' which does not include a framework

## 0.6.0

### Minor Changes

- cf4c97cf: forced degit template extraction in case of non empty installation directory

## 0.5.2

### Patch Changes

- 6c52c92: Add warning when encountering 'zlib: unexpected end of file' error

## 0.5.1

### Patch Changes

- a7e6666: compile javascript to target Node v12.x
- bd18e14: Add support for [Solid](https://www.solidjs.com/)
- d45431d: create-astro does not fail when removing subdirectories

## 0.5.1-next.1

### Patch Changes

- bd18e14: Add support for [Solid](https://www.solidjs.com/)

## 0.5.1-next.0

### Patch Changes

- a7e6666: compile javascript to target Node v12.x
- d45431d: create-astro does not fail when removing subdirectories

## 0.5.0

### Minor Changes

- 36e104b: Use new client: prefix for component exmaples

## 0.4.0

### Minor Changes

- 5d5d67c: Update `create-astro` to handle framework-specific logic based on user preference

## 0.3.5

### Patch Changes

- d8ceff5: Allows using an external repo as a template

  You can do this with the `--template` flag:

  ```bash
  npm init astro my-shopify --template cassidoo/shopify-react-astro
  ```

## 0.3.4

### Patch Changes

- b0e41ea: fix small output bugs

## 0.3.3

### Patch Changes

- f9f2da4: Add repository key to package.json for create-astro

## 0.3.2

### Patch Changes

- ab2972b: Update package.json engines for esm support

## 0.3.1

### Patch Changes

- d6a7349: fix issue with empty prompt

## 0.3.0

### Minor Changes

- 6bca7c8: Redesigned create-astro internals
- 6bca7c8: New UI
