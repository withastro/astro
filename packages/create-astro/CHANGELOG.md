# create-astro

## 0.12.3

### Patch Changes

- [#3748](https://github.com/withastro/astro/pull/3748) [`012f093e`](https://github.com/withastro/astro/commit/012f093eeb771b42b4e9d1e0cbb0d9a9605e0514) Thanks [@delucis](https://github.com/delucis)! - Remove `astro add` step & tweak wording (PR #3715)

## 0.12.2

### Patch Changes

- [#3391](https://github.com/withastro/astro/pull/3391) [`cf8015ea`](https://github.com/withastro/astro/commit/cf8015eaa2b756f4ec399e8fd7071dee7dfa9ab6) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix [#3309](https://github.com/withastro/astro/issues/3309) default logger locale behavior.

## 0.12.1

### Patch Changes

- [#3313](https://github.com/withastro/astro/pull/3313) [`1a5335ed`](https://github.com/withastro/astro/commit/1a5335ed9abaef397ee9543a3b4ad7a3fddcf024) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update "next steps" with more informative text on each CLI command. Oh, and gradients. A lot more gradients.

## 0.12.0

### Minor Changes

- [#3227](https://github.com/withastro/astro/pull/3227) [`c8f5fa35`](https://github.com/withastro/astro/commit/c8f5fa35c4c3cf08df45e6bd6cb78960782ae08b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add "initialize git repository" step to simplify our next steps suggestion. We now give you a one-liner to easily paste in your terminal and start the dev server!

## 0.11.0

### Minor Changes

- [#3223](https://github.com/withastro/astro/pull/3223) [`b7cd6958`](https://github.com/withastro/astro/commit/b7cd69588453cf874346bf2f14c41accd183129e) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Replace the component framework selector with a new "run astro add" option. This unlocks integrations beyond components during your create-astro setup, including TailwindCSS and Partytown. This also replaces our previous "starter" template with a simplified "Just the basics" option.

## 0.10.1

### Patch Changes

- [#3212](https://github.com/withastro/astro/pull/3212) [`00fc1326`](https://github.com/withastro/astro/commit/00fc1326ed526974cc4aca9faec410df91b4bcbd) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Simplify logging during welcome message and directory selection

## 0.10.0

### Minor Changes

- [#3190](https://github.com/withastro/astro/pull/3190) [`38e5e9e9`](https://github.com/withastro/astro/commit/38e5e9e9825876cd0ae14a648b51bdf397e81169) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Feat: add option to install dependencies during setup. This respects the package manager used to run create-astro (ex. "yarn create astro" vs "pnpm create astro@latest").

## 0.9.0

### Minor Changes

- [#3168](https://github.com/withastro/astro/pull/3168) [`7c49194c`](https://github.com/withastro/astro/commit/7c49194ca2161a09cc304ba8327533f8176ae0da) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add prompt to choose a directory, now defaulting to a separate "./my-astro-site" instead of "." (current directory)

## 0.8.0

### Minor Changes

- [#2843](https://github.com/withastro/astro/pull/2843) [`1fdb63b5`](https://github.com/withastro/astro/commit/1fdb63b5d000d17edca77e870ce721e616a9c64a) Thanks [@JuanM04](https://github.com/JuanM04)! - Automatically add integration `peerDependencies` to scaffolded `package.json` files

## 0.8.0-next.0

### Minor Changes

- [#2843](https://github.com/withastro/astro/pull/2843) [`1fdb63b5`](https://github.com/withastro/astro/commit/1fdb63b5d000d17edca77e870ce721e616a9c64a) Thanks [@JuanM04](https://github.com/JuanM04)! - Automatically add integration `peerDependencies` to scaffolded `package.json` files

## 0.7.1

### Patch Changes

- [#2429](https://github.com/withastro/astro/pull/2429) [`fda857eb`](https://github.com/withastro/astro/commit/fda857eb22508f55233e297a887b356ea7b87398) Thanks [@Mikkel-T](https://github.com/Mikkel-T)! - Added an option to create-astro to use verbose logging which should help debug degit issues

## 0.7.0

### Minor Changes

- [#2202](https://github.com/withastro/astro/pull/2202) [`45cea6ae`](https://github.com/withastro/astro/commit/45cea6aec5a310fed4cb8da0d96670d6b99a2539) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Officially drop support for Node v12. The minimum supported version is now Node v14.15+,

## 0.6.10

### Patch Changes

- [#2150](https://github.com/withastro/astro/pull/2150) [`d5ebd9d1`](https://github.com/withastro/astro/commit/d5ebd9d178ed4e5d15ef43f32217c16d44f19151) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix create-astro export map entry

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
