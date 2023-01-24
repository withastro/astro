# create-astro

## 2.0.0-beta.1

### Patch Changes

- [#5898](https://github.com/withastro/astro/pull/5898) [`d8919b1a2`](https://github.com/withastro/astro/commit/d8919b1a2197616b70ec57f0fb00b0bde6943e43) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Support headless runs with `-y` / `--yes`

- [#5920](https://github.com/withastro/astro/pull/5920) [`f27bb3d79`](https://github.com/withastro/astro/commit/f27bb3d79f9774f01037e60e656b1f9d8e03367d) Thanks [@delucis](https://github.com/delucis)! - Improve error message for third-party template 404s

## 2.0.0-beta.0

### Major Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 14. Minimum supported Node version is now >=16.12.0

## 1.2.4

### Patch Changes

- [#5579](https://github.com/withastro/astro/pull/5579) [`2c2c65297`](https://github.com/withastro/astro/commit/2c2c65297a18c52691f09621ead55144efd601d4) Thanks [@yuhang-dong](https://github.com/yuhang-dong)! - Upgrade giget to support env proxy config

- [#5616](https://github.com/withastro/astro/pull/5616) [`61302ab7a`](https://github.com/withastro/astro/commit/61302ab7a09cc4c298c903d725e35355eb069497) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Skip Houston on Windows until we can debug the prompt issue

## 1.2.3

### Patch Changes

- [#5404](https://github.com/withastro/astro/pull/5404) [`505abfd64`](https://github.com/withastro/astro/commit/505abfd6430b1f71e52d10b02bf9beb5847df8b6) Thanks [@liruifengv](https://github.com/liruifengv)! - fix error when don't have template input

## 1.2.2

### Patch Changes

- [#5319](https://github.com/withastro/astro/pull/5319) [`b211eadef`](https://github.com/withastro/astro/commit/b211eadeffd6260700254c1492c8e6528d279ad1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix bug with `setRawMode`. Respect `--skip-houston` in all cases.

## 1.2.1

### Patch Changes

- [#5240](https://github.com/withastro/astro/pull/5240) [`d9be7e36b`](https://github.com/withastro/astro/commit/d9be7e36b872eb48516dc9d0d5c9d333aac4950b) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve error messages when `create-astro` fails

- [#5226](https://github.com/withastro/astro/pull/5226) [`641b6d7d5`](https://github.com/withastro/astro/commit/641b6d7d583886fde9529f296846d7e0a50e8624) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Allow Windows users to pass `--fancy` to enable full unicode support

## 1.2.0

### Minor Changes

- [#5088](https://github.com/withastro/astro/pull/5088) [`040837628`](https://github.com/withastro/astro/commit/04083762810a1a9e078a7e68edab945c8063b1ab) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Introducing your new automated assistant: Houston! 🎉

  ```
  ╭─────╮  Houston:
  │ ◠ ◡ ◠  Initiating launch sequence... right... now!
  ╰─────╯
  ```

  Updates template and TypeScript prompts for clarity and friendliness.

  Migrates template copying from [`degit`](https://github.com/Rich-Harris/degit) (unmaintained) to [`giget`](https://github.com/unjs/giget) for stability.

## 1.1.0

### Minor Changes

- [#4810](https://github.com/withastro/astro/pull/4810) [`7481ffda0`](https://github.com/withastro/astro/commit/7481ffda028d9028d8e28bc7c6e9960ab80acf0f) Thanks [@mrienstra](https://github.com/mrienstra)! - Always write chosen config to `tsconfig.json`.

  - Before: Only when `strict` & `strictest` was selected
  - After: Also when `base` is selected (via "Relaxed" or "I prefer not to use TypeScript")

## 1.0.2

### Patch Changes

- [#4805](https://github.com/withastro/astro/pull/4805) [`c84d85ba4`](https://github.com/withastro/astro/commit/c84d85ba4d85f250d87bbc98c74665992f6c2768) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Add support for running in cloned empty git repository

## 1.0.1

### Patch Changes

- [#4439](https://github.com/withastro/astro/pull/4439) [`77ce6be30`](https://github.com/withastro/astro/commit/77ce6be30c9cb8054ebf69a4943b984eed90152e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add tsconfig templates for users to extend from

## 1.0.1-next.0

### Patch Changes

- [#4439](https://github.com/withastro/astro/pull/4439) [`77ce6be30`](https://github.com/withastro/astro/commit/77ce6be30c9cb8054ebf69a4943b984eed90152e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add tsconfig templates for users to extend from

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

## 0.15.1

### Patch Changes

- [#4183](https://github.com/withastro/astro/pull/4183) [`77c018e51`](https://github.com/withastro/astro/commit/77c018e5159e9084304ca650487b6e99c828d3cf) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix relaxed and default TypeScript settings not working

## 0.15.0

### Minor Changes

- [#4179](https://github.com/withastro/astro/pull/4179) [`d344f9e3e`](https://github.com/withastro/astro/commit/d344f9e3ec1f69ad4d7efd433b3523ad5413b726) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a step to configure how strict TypeScript should be

## 0.14.3

### Patch Changes

- [#4075](https://github.com/withastro/astro/pull/4075) [`cc10a5c8e`](https://github.com/withastro/astro/commit/cc10a5c8e03683e64514de75e535169c187ab847) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Added better error handling when cancelling operations, providing bad templates and when there's a degit cache issue

## 0.14.2

### Patch Changes

- [#3971](https://github.com/withastro/astro/pull/3971) [`e6e216061`](https://github.com/withastro/astro/commit/e6e2160614c9af320419a599c42211d0147760f4) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes support for using templates from any GitHub repository

## 0.14.1

### Patch Changes

- [#3937](https://github.com/withastro/astro/pull/3937) [`31f9c0bf0`](https://github.com/withastro/astro/commit/31f9c0bf029ffa4b470e620f2c32e1370643e81e) Thanks [@delucis](https://github.com/delucis)! - Roll back supported Node engines

## 0.14.0

### Minor Changes

- [#3914](https://github.com/withastro/astro/pull/3914) [`b48767985`](https://github.com/withastro/astro/commit/b48767985359bd359df8071324952ea5f2bc0d86) Thanks [@ran-dall](https://github.com/ran-dall)! - Rollback supported `node@16` version. Minimum versions are now `node@14.20.0` or `node@16.14.0`.

## 0.13.0

### Minor Changes

- [#3871](https://github.com/withastro/astro/pull/3871) [`1cc5b7890`](https://github.com/withastro/astro/commit/1cc5b78905633608e5b07ad291f916f54e67feb1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update supported `node` versions. Minimum versions are now `node@14.20.0` or `node@16.16.0`.

### Patch Changes

- [#3886](https://github.com/withastro/astro/pull/3886) [`cb6a97383`](https://github.com/withastro/astro/commit/cb6a973839450dea1705407e1060919c946cca99) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix portfolio example JSX error

## 0.12.5

### Patch Changes

- [#3831](https://github.com/withastro/astro/pull/3831) [`4fb08502`](https://github.com/withastro/astro/commit/4fb08502a99396723b9eb671099482cd619b3564) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Small wording updates

## 0.12.4

### Patch Changes

- [#3756](https://github.com/withastro/astro/pull/3756) [`507cd5c8`](https://github.com/withastro/astro/commit/507cd5c868448971c6265d97f22e786263dd5a77) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Chore: remove create-astro install step test

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

- 0eeb2534: change rm to unlink for node 12 compatibility

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

- 36e104b: Use new client: prefix for component examples

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
