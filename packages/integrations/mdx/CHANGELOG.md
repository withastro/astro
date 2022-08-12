# @astrojs/mdx

## 0.9.0

### Minor Changes

- [#4268](https://github.com/withastro/astro/pull/4268) [`f7afdb889`](https://github.com/withastro/astro/commit/f7afdb889fe4e97177958c8ec92f80c5f6e5cb51) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Align MD with MDX on layout props and "glob" import results:
  - Add `Content` to MDX
  - Add `file` and `url` to MDX frontmatter (layout import only)
  - Update glob types to reflect differences (lack of `rawContent` and `compiledContent`)

### Patch Changes

- [#4272](https://github.com/withastro/astro/pull/4272) [`24d2f7a6e`](https://github.com/withastro/astro/commit/24d2f7a6e6700c10c863f826f37bb653d70e3a83) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Properly handle hydration for namespaced components

## 0.8.3

### Patch Changes

- [#4248](https://github.com/withastro/astro/pull/4248) [`869d00935`](https://github.com/withastro/astro/commit/869d0093596b709cfcc1a1a95ee631b48d6d1c26) Thanks [@svemat01](https://github.com/svemat01)! - Load builtin rehype plugins before user plugins instead of after

* [#4255](https://github.com/withastro/astro/pull/4255) [`411612808`](https://github.com/withastro/astro/commit/4116128082121ee276d51cb245bf8095be4728a1) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Pass injected frontmatter from remark and rehype plugins to layouts

* Updated dependencies [[`1f0dd31d9`](https://github.com/withastro/astro/commit/1f0dd31d9239b5e3dca99c88d021e7a9a3e2054d)]:
  - @astrojs/prism@1.0.1

## 0.8.2

### Patch Changes

- [#4237](https://github.com/withastro/astro/pull/4237) [`9d5ab5508`](https://github.com/withastro/astro/commit/9d5ab55086964fbede17da3d78c209c6d8d13711) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update "Astro.props.content" -> "Astro.props.frontmatter" in README

## 0.8.1

### Patch Changes

- Updated dependencies [[`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308)]:
  - @astrojs/prism@1.0.0

## 0.8.0

### Minor Changes

- [#4204](https://github.com/withastro/astro/pull/4204) [`4c2ca5352`](https://github.com/withastro/astro/commit/4c2ca5352d0c4119ed2a9e5e0b78ce71eb1b414a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove `frontmatterOptions` from MDX config

### Patch Changes

- [#4205](https://github.com/withastro/astro/pull/4205) [`6c9736cbc`](https://github.com/withastro/astro/commit/6c9736cbc90162f1de3ebccd7cfe98332749b639) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add frontmatter injection instructions to README

## 0.7.0

### Minor Changes

- [#4176](https://github.com/withastro/astro/pull/4176) [`2675b8633`](https://github.com/withastro/astro/commit/2675b8633c5d5c45b237ec87940d5eaf1bfb1b4b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support frontmatter injection for MD and MDX using remark and rehype plugins

### Patch Changes

- [#4181](https://github.com/withastro/astro/pull/4181) [`77cede720`](https://github.com/withastro/astro/commit/77cede720b09bce34f29c3d2d8b505311ce876b1) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Make collect-headings rehype plugin non-overridable

* [#4174](https://github.com/withastro/astro/pull/4174) [`8eb3a8c6d`](https://github.com/withastro/astro/commit/8eb3a8c6d9554707963c3a3bc36ed8b68d3cf0fb) Thanks [@matthewp](https://github.com/matthewp)! - Allows using React with automatic imports alongside MDX

- [#4145](https://github.com/withastro/astro/pull/4145) [`c7efcf57e`](https://github.com/withastro/astro/commit/c7efcf57e00a0fcde3bc9f813e3cc59902bd484c) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix a missing newline bug when `layout` was set.

## 0.6.0

### Minor Changes

- [#4134](https://github.com/withastro/astro/pull/4134) [`2968ba2b6`](https://github.com/withastro/astro/commit/2968ba2b6f00775b6e9872681b390cb466fdbfa2) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add `headings` and `frontmatter` properties to layout props

## 0.5.0

### Minor Changes

- [#4095](https://github.com/withastro/astro/pull/4095) [`40ef43a59`](https://github.com/withastro/astro/commit/40ef43a59b08a1a8fbcd9f4a53745a9636a4fbb9) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add IDs to MDX headings and expose via getHeadings() export

* [#4114](https://github.com/withastro/astro/pull/4114) [`64432bcb8`](https://github.com/withastro/astro/commit/64432bcb873efd0e4297c00fc9583a1fe516dfe7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Refactor `@astrojs/mdx` and `@astrojs/markdown-remark` to use `@astrojs/prism` instead of duplicating the code

### Patch Changes

- [#4112](https://github.com/withastro/astro/pull/4112) [`e33fc9bc4`](https://github.com/withastro/astro/commit/e33fc9bc46ff0a30013deb6dc76e545e70cc3a3e) Thanks [@matthewp](https://github.com/matthewp)! - Fix MDX working with a ts config file

* [#4049](https://github.com/withastro/astro/pull/4049) [`b60cc0538`](https://github.com/withastro/astro/commit/b60cc0538bc5c68dd411117780d20d892530789d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improve `injectScript` handling for non-Astro pages

* Updated dependencies [[`64432bcb8`](https://github.com/withastro/astro/commit/64432bcb873efd0e4297c00fc9583a1fe516dfe7)]:
  - @astrojs/prism@0.7.0

## 0.4.0

### Minor Changes

- [#4088](https://github.com/withastro/astro/pull/4088) [`1743fe140`](https://github.com/withastro/astro/commit/1743fe140eb58d60e26cbd11a066bb60de046e0c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support "layout" frontmatter property

## 0.3.1

### Patch Changes

- [#4076](https://github.com/withastro/astro/pull/4076) [`6120a71e5`](https://github.com/withastro/astro/commit/6120a71e5425ad55a17ddac800d64a3f50273bce) Thanks [@matthewp](https://github.com/matthewp)! - Ensure file and url are always present in MDX for Astro.glob

## 0.3.0

### Minor Changes

- [#3977](https://github.com/withastro/astro/pull/3977) [`19433eb4a`](https://github.com/withastro/astro/commit/19433eb4a4441522f68492ca914ad2ab4f061343) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add remarkPlugins and rehypePlugins to config, with the same default plugins as our standard Markdown parser

* [#4002](https://github.com/withastro/astro/pull/4002) [`3b8a74452`](https://github.com/withastro/astro/commit/3b8a7445247221100462ba035f6778b43ea180e7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support Prism and Shiki syntax highlighting based on project config

- [#3995](https://github.com/withastro/astro/pull/3995) [`b2b367c96`](https://github.com/withastro/astro/commit/b2b367c969493aaf21c974064beb241d05228066) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support YAML frontmatter in MDX files

### Patch Changes

- [#4050](https://github.com/withastro/astro/pull/4050) [`9ab66c4ba`](https://github.com/withastro/astro/commit/9ab66c4ba9bf2250990114c76b792f26d0694365) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add support for injected "page-ssr" scripts

* [#3981](https://github.com/withastro/astro/pull/3981) [`61fec6304`](https://github.com/withastro/astro/commit/61fec63044e1585348e8405bee6fdf4dec635efa) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Include page url in MDX glob result

## 0.2.1

### Patch Changes

- [#3937](https://github.com/withastro/astro/pull/3937) [`31f9c0bf0`](https://github.com/withastro/astro/commit/31f9c0bf029ffa4b470e620f2c32e1370643e81e) Thanks [@delucis](https://github.com/delucis)! - Roll back supported Node engines

## 0.2.0

### Minor Changes

- [#3914](https://github.com/withastro/astro/pull/3914) [`b48767985`](https://github.com/withastro/astro/commit/b48767985359bd359df8071324952ea5f2bc0d86) Thanks [@ran-dall](https://github.com/ran-dall)! - Rollback supported `node@16` version. Minimum versions are now `node@14.20.0` or `node@16.14.0`.

## 0.1.1

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.1.0

### Minor Changes

- [#3871](https://github.com/withastro/astro/pull/3871) [`1cc5b7890`](https://github.com/withastro/astro/commit/1cc5b78905633608e5b07ad291f916f54e67feb1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update supported `node` versions. Minimum versions are now `node@14.20.0` or `node@16.16.0`.

## 0.0.3

### Patch Changes

- [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.0.2

### Patch Changes

- [#3706](https://github.com/withastro/astro/pull/3706) [`032ad1c0`](https://github.com/withastro/astro/commit/032ad1c047a62dd663067cc562537d16f2872aa7) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Initial release! 🎉
