# @astrojs/markdoc

## 0.0.4

### Patch Changes

- [#6588](https://github.com/withastro/astro/pull/6588) [`f42f47dc6`](https://github.com/withastro/astro/commit/f42f47dc6a91cdb6534dab0ecbf9e8e85f00ba40) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Allow access to content collection entry information (including parsed frontmatter and the entry slug) from your Markdoc using the `$entry` variable:

  ```mdx
  ---
  title: Hello Markdoc!
  ---

  # {% $entry.data.title %}
  ```

- [#6607](https://github.com/withastro/astro/pull/6607) [`86273b588`](https://github.com/withastro/astro/commit/86273b5881cc61ebee11d40280b4c0aba8f4bb2e) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: Update Markdoc renderer internals to remove unneeded dependencies

- [#6622](https://github.com/withastro/astro/pull/6622) [`b37b86540`](https://github.com/withastro/astro/commit/b37b865400e77e92878d7e150244acce47e933c6) Thanks [@paulrudy](https://github.com/paulrudy)! - Fix README instructions for installing Markdoc manually.

## 0.0.3

### Patch Changes

- [#6552](https://github.com/withastro/astro/pull/6552) [`392ba3e4d`](https://github.com/withastro/astro/commit/392ba3e4d55f73ce9194bd94a2243f1aa62af079) Thanks [@bluwy](https://github.com/bluwy)! - Fix integration return type

## 0.0.2

### Patch Changes

- [#6494](https://github.com/withastro/astro/pull/6494) [`a13e9d7e3`](https://github.com/withastro/astro/commit/a13e9d7e33baccf51e7d4815f99b481ad174bc57) Thanks [@Yan-Thomas](https://github.com/Yan-Thomas)! - Consistency improvements to several package descriptions

## 0.0.1

### Patch Changes

- [#6209](https://github.com/withastro/astro/pull/6209) [`fec583909`](https://github.com/withastro/astro/commit/fec583909ab62829dc0c1600e2387979365f2b94) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Introduce the (experimental) `@astrojs/markdoc` integration. This unlocks Markdoc inside your Content Collections, bringing support for Astro and UI components in your content. This also improves Astro core internals to make Content Collections extensible to more file types in the future.

  You can install this integration using the `astro add` command:

  ```
  astro add markdoc
  ```

  [Read the `@astrojs/markdoc` documentation](https://docs.astro.build/en/guides/integrations-guide/markdoc/) for usage instructions, and browse the [new `with-markdoc` starter](https://astro.new/with-markdoc) to try for yourself.
