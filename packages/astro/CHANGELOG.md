# astro

## 0.1.0

### Minor Changes

- b3886c2: Enhanced **Markdown** support! Markdown processing has been moved from `micromark` to `remark` to prepare Astro for user-provided `remark` plugins _in the future_.

  This change also introduces a built-in `<Markdown>` component for embedding Markdown and any Astro-supported component format inside of `.astro` files. [Read more about Astro's Markdown support.](https://github.com/snowpackjs/astro/blob/main/docs/markdown.md)

### Patch Changes

- 9d092b5: Bugfix: Windows collection API path bug
- Updated dependencies [b3886c2]
  - astro-parser@0.1.0

## 0.0.13

### Patch Changes

- 7184149: Added canonical URL and site globals for .astro files
- b81abd5: Add CSS bundling
- 7b55d3d: chore: Remove non-null assertions
- 000464b: Fix bug when building Svelte components
- 95b1733: Fix: wait for async operation to finish
- e0a4f5f: Allow renaming for default import components
- 9feffda: Bugfix: fixes double <pre> tags generated from markdown code blocks
- 87ab4c6: Bugfix: Scoped CSS with pseudoclasses and direct children selectors
- e0fc2ca: fix: build stuck on unhandled promise reject

## 0.0.11

### Patch Changes

- 3ad0aac: Fix `fetchContent` API bug for nested `.md` files

## 0.0.10

### Patch Changes

- d924fcb: Fix issue with Prism component missing dependency
- Updated dependencies [d924fcb]
  - astro-prism@0.0.2
