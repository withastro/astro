---
'astro': minor
---

Adds a new `build.format` configuration option: 'preserve'. This option will preserve your source structure in the final build.

The existing configuration options, `file` and `directory`, either build all of your HTML pages as files matching the route name (e.g. `/about.html`) or build all your files as `index.html` within a nested directory structure (e.g. `/about/index.html), respectively. It was not previously possible to control the HTML file built on a per-file basis.

One limitation of `build.format: 'file'` is that it cannot create `index.html` files for any individual routes (other than the base path of `/`) while otherwise building named files. Creating explicit index pages within your file structure still generates a file named for the page route (e.g. `src/pages/about/index.astro` builds `/about.html`) when using the `file` configuration option.

Rather than make a breaking change to allow `build.format: 'file'` to be more flexible, we decided to create a new `build.format: 'preserve'`.

The new format will preserve how the filesystem is structured and make sure that is mirrored over to production. Using this option:

- `about.astro` becomes `about.html`
- `about/index.astro` becomes `about/index.html`

See the [`build.format` configuration options reference] for more details
