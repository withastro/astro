# astro

## 0.18.0-next.2

### Minor Changes

- f67e8f5: New Collections API (createCollection)

  BREAKING CHANGE: The expected return format from createCollection() has been changed. Visit https://docs.astro.build/core-concepts/collections to learn the new API.

  This feature was implemented with backwards-compatible deprecation warnings, to help you find and update pages that are using the legacy API.

- 40c882a: Fix url to find page with "index" at the end file name

### Patch Changes

- a7e6666: compile javascript to target Node v12.x
- fb8bf7e: Allow multiple Astro servers to be running simultaneously by choosing random ports if the defaults are taken.
- 0e761b9: Add ability to specify hostname in devOptions
- 007c220: Remove custom Astro.fetchContent() glob implementation, use `import.meta.globEager` internally instead.
- b85e68a: Fixes case where custom elements are not handled within JSX expressions
- Updated dependencies [a7e6666]
- Updated dependencies [b85e68a]
  - @astrojs/parser@0.18.0-next.2

## 0.18.0-next.1

### Patch Changes

- e3182c7: Adds a missing dependency

## 0.18.0-next.0

### Minor Changes

- 0340b0f: Adds support for the client:media hydrator

  The new `client:media` hydrator allows you to define a component that should only be loaded when a media query matches. An example usage:

  ```jsx
  ---
  import Sidebar from '../components/Sidebar.jsx';
  ---

  <Sidebar client:media="(max-width: 700px)" />
  ```

  This allows you to define components which, for example, only run on mobile devices. A common example is a slide-in sidebar that is needed to add navigation to a mobile app, but is never displayed in desktop view.

  Since Astro components can have expressions, you can move common media queries to a module for sharing. For example here are defining:

  **media.js**

  ```js
  export const MOBILE = '(max-width: 700px)';
  ```

  And then you can reference this in your page:

  **index.astro**

  ```jsx
  import Sidebar from '../components/Sidebar.jsx';
  import { MOBILE } from '../media.js';
  ---(<Sidebar client:media={MOBILE} />);
  ```

### Patch Changes

- 8f4562a: Improve slot support, adding support for named slots and fallback content within `slot` elements.

  See the new [Slots documentation](https://docs.astro.build/core-concepts/astro-components/#slots) for more information.

- 9859f53: Correcting typo in ReadMe

## 0.17.3

### Patch Changes

- [release/0.17] Update compile target to better support Node v12.

## 0.17.2

### Patch Changes

- 1b73f95: Only show the buildOptions.site notice if not already set
- fb78b76: Improve error handling for unsupported Node versions
- d93f768: Add support for components defined in Frontmatter. Previously, the following code would throw an error. Now it is officially supported!

  ```astro
  ---
  const { level = 1 } = Astro.props;
  const Element = `h${level}`;
  ---

  <Element>Hello world!</Element>
  ```

## 0.17.1

### Patch Changes

- 1e01251: Fixes bug with React renderer that would not hydrate correctly
- 42a6ace: Add support for components defined in Frontmatter. Previously, the following code would throw an error. Now it is officially supported!

  ```astro
  ---
  const { level = 1 } = Astro.props;
  const Element = `h${level}`;
  ---

  <Element>Hello world!</Element>
  ```

- Updated dependencies [1e01251]
  - @astrojs/renderer-react@0.1.5

## 0.17.0

### Minor Changes

- 0a7b6de: ## Adds directive syntax for component hydration

  This change updates the syntax for partial hydration from `<Button:load />` to `<Button client:load />`.

  **Why?**

  Partial hydration is about to get super powers! This clears the way for more dynamic partial hydration, i.e. `<MobileMenu client:media="(max-width: 40em)" />`.

  **How to upgrade**

  Just update `:load`, `:idle`, and `:visible` to match the `client:load` format, thats it! Don't worry, the original syntax is still supported but it's recommended to future-proof your project by updating to the newer syntax.

## 0.16.3

### Patch Changes

- 5d1ff62: Hotfix for snowpack regression

## 0.16.2

### Patch Changes

- 20b4a60: Bugfix: do not override user `alias` passed into snowpack config
- 42a1fd7: Add command line flag `--silent` to astro to set no output.

## 0.16.1

### Patch Changes

- 2d3e369: Fix for using the snowpack polyfillNode option

## 0.16.0

### Minor Changes

- d396943: Add support for [`remark`](https://github.com/remarkjs/remark#readme) and [`rehype`](https://github.com/rehypejs/rehype#readme) plugins for both `.md` pages and `.astro` pages using the [`<Markdown>`](/docs/guides/markdown-content.md) component.

  For example, the `astro.config.mjs` could be updated to include the following. [Read the Markdown documentation](/docs/guides/markdown-content.md) for more information.

  > **Note** Enabling custom `remarkPlugins` or `rehypePlugins` removes Astro's built-in support for [GitHub-flavored Markdown](https://github.github.com/gfm/) support, [Footnotes](https://github.com/remarkjs/remark-footnotes) syntax, [Smartypants](https://github.com/silvenon/remark-smartypants). You must explicitly add these plugins to your `astro.config.mjs` file, if desired.

  ```js
  export default {
    markdownOptions: {
      remarkPlugins: ['remark-slug', ['remark-autolink-headings', { behavior: 'prepend' }]],
      rehypePlugins: ['rehype-slug', ['rehype-autolink-headings', { behavior: 'prepend' }]],
    },
  };
  ```

### Patch Changes

- Updated dependencies [d396943]
- Updated dependencies [f83407e]
  - @astrojs/markdown-support@0.2.0

## 0.15.5

### Patch Changes

- 7b4c97c: Adds support for `hydrationPolyfills` in renderers

  Renderers can not specify polyfills that must run before the component code runs for hydration:

  ```js
  export default {
    name: '@matthewp/my-renderer',
    server: './server.js',
    client: './client.js',
    hydrationPolyfills: ['./my-polyfill.js'],
  };
  ```

  These will still wait for hydration to occur, but will run before the component script does.

## 0.15.4

### Patch Changes

- 6a660f1: Adds low-level custom element support that renderers can use to enable server side rendering. This will be used in renderers such as a Lit renderer.
- Updated dependencies [6a660f1]
  - @astrojs/parser@0.15.4

## 0.15.3

### Patch Changes

- 17579c2: Improves the error message when attempting to use `window` in a component.

## 0.15.2

### Patch Changes

- 1e735bb: Allows passing in a class to a child component which will be scoped
- e28d5cb: Improve error handling within `.astro` files (#526)
- aa86057: Updates collections to match URLs by exact template filename
- f721275: Fix issue where Markdown could close it's parent element early (#494)

## 0.15.1

### Patch Changes

- 8865158: Fixes postcss bug with the 'from' property

## 0.15.0

### Minor Changes

- a136c85: **This is a breaking change!**

  Astro props are now accessed from the `Astro.props` global. This change is meant to make prop definitions more ergonomic, leaning into JavaScript patterns you already know (destructuring and defaults). Astro components previously used a prop syntax borrowed from [Svelte](https://svelte.dev/docs#1_export_creates_a_component_prop), but it became clear that this was pretty confusing for most users.

  ```diff
   ---
  + const { text = 'Hello world!' } = Astro.props;
  - export let text = 'Hello world!';
   ---

   <div>{text}</div>
  ```

  [Read more about the `.astro` syntax](https://docs.astro.build/syntax/#data-and-props)

  ***

  ### How do I define what props my component accepts?

  Astro frontmatter scripts are TypeScript! Because of this, we can leverage TypeScript types to define the shape of your props.

  ```ts
  ---
  export interface Props {
    text?: string;
  }
  const { text = 'Hello world!' } = Astro.props as Props;
  ---
  ```

  > **Note** Casting `Astro.props as Props` is a temporary workaround. We expect our Language Server to handle this automatically soon!

  ### How do I access props I haven't explicitly defined?

  One of the great things about this change is that it's straight-forward to access _any_ props. Just use `...props`!

  ```ts
  ---
  export interface Props {
    text?: string;
    [attr: string]: unknown;
  }
  const { text = 'Hello world!', ...props } = Astro.props as Props;
  ---
  ```

  ### What about prop validation?

  We considered building prop validation into Astro, but decided to leave that implementation up to you! This way, you can use any set of tools you like.

  ```ts
  ---
  const { text = 'Hello world!' } = Astro.props;

  if (typeof text !== 'string') throw new Error(`Expected "text" to be of type "string" but recieved "${typeof string}"!`);
  ---
  ```

### Patch Changes

- 4cd84c6: #528 Removes unused trapWarn function
- feb9a31: Fixes livereload on static pages
- 47ac2cc: Fix #521, allowing `{...spread}` props to work again
- 5629349: Bugfix: PostCSS errors in internal Snowpack PostCSS plugin
- Updated dependencies [21dc28c]
- Updated dependencies [47ac2cc]
  - @astrojs/renderer-react@0.1.4
  - @astrojs/parser@0.15.0

## 0.14.1

### Patch Changes

- 3f3e4f1: Allow `pageSize: Infinity` when creating a collection
- 44f429a: Allow node: prefix to load builtins

## 0.14.0

### Minor Changes

- 09b5779: Removes mounting the project folder and adds a `src` root option

## 0.13.12

_Rolling back to 0.13.10 to prevent a regression in the dev server output._

## 0.13.11

### Patch Changes

- 6573bea: Fixed README header aspect ratio
- 2671b6f: Fix [472](https://github.com/snowpackjs/astro/issues/472) by not injecting `astro-*` scoped class unless it is actually used
- b547892: Makes providing a head element on pages optional
- b547892: Allows astro documents to omit the head element
- 0abd251: Allows renderers to provide knownEntrypoint config values
- Updated dependencies [0abd251]
  - @astrojs/renderer-preact@0.1.3
  - @astrojs/renderer-react@0.1.3
  - @astrojs/renderer-vue@0.1.3

## 0.13.10

### Patch Changes

- 233fbcd: Fix race condition caused by parallel build
- Updated dependencies [7f8d586]
  - @astrojs/parser@0.13.10

## 0.13.9

### Patch Changes

- 3ada25d: Pass configured Tailwind config file to the tailwindcss plugin
- f9f2da4: Add repository key to all package.json
- Updated dependencies [f9f2da4]
  - @astrojs/parser@0.13.9
  - @astrojs/prism@0.2.2
  - @astrojs/markdown-support@0.1.2

## 0.13.8

### Patch Changes

- 251b0b5: Less verbose HMR script
- 54c291e: Fix <script type="module"> resolution
- 272769d: Improve asset resolution
- 490f2be: Add support for Fragments with `<>` and `</>` syntax
- Updated dependencies [490f2be]
  - @astrojs/parser@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies [9d4a40f]
  - @astrojs/renderer-preact@0.1.2
  - @astrojs/renderer-react@0.1.2

## 0.13.6

### Patch Changes

- 016833a: Honors users HMR settings
- 73a43d9: Prevent dev from locking up on empty selectors

## 0.13.5

### Patch Changes

- 9f51e2d: Fix issue with arrow components in Preact/React

## 0.13.4

### Patch Changes

- 2d85409: Fixes serialization of boolean attributes
- e0989c6: Fix scoped CSS selector when class contains a colon
- 42dee79: Allows doctype to be written with any casing

## 0.13.3

### Patch Changes

- ab2972b: Update package.json engines for esm support
- Updated dependencies [ab2972b]
  - @astrojs/parser@0.13.3
  - @astrojs/prism@0.2.1
  - @astrojs/renderer-preact@0.1.1
  - @astrojs/renderer-react@0.1.1
  - @astrojs/renderer-svelte@0.1.1
  - @astrojs/renderer-vue@0.1.2

## 0.13.2

### Patch Changes

- c374a54: Bugfix: createCollection() API can be used without fetchContent()

## 0.13.1

### Patch Changes

- 61b5590: Pass "site" config to Snowpack as "baseUrl"

## 0.13.0

### Minor Changes

- ce93361: Set the minimum Node version in the engines field
- 1bab906: Removes a second instance of snowpack which degraded peformance

### Patch Changes

- 5fbc1cb: nit: ask user to modify devOptions.port when addr in use for dev

## 0.12.10

### Patch Changes

- 5cda571: Fix an issue with how files are watched during development

## 0.12.9

### Patch Changes

- 21b0c73: Removes some warnings that are internal to Astro

## 0.12.8

### Patch Changes

- f66fd1f: Fixes regression caused by attempting to prebuild an internal dep

## 0.12.7

### Patch Changes

- f6ef53b: Fixed a bug where recursive markdown was not working properly
- 5a871f3: Fixes logging to default to the info level
- f4a747f: improve build output

## 0.12.6

### Patch Changes

- 522c873: Fixes bug where astro build would fail when trying to log

## 0.12.5

### Patch Changes

- b1364af: Updates logging to display messages from Snowpack
- cc532cd: Properly resolve `tailwindcss` depedency if using Tailwind
- Updated dependencies [b1364af]
  - @astrojs/renderer-vue@0.1.1

## 0.12.4

### Patch Changes

- 0d6afae: Fixes a few small bugs with the `Markdown` component when there are multiple instances on the same page
- 1d930ff: Adds [`--verbose`](https://docs.astro.build/cli.md#--verbose) and [`--reload`](https://github.com/snowpackjs/astro/blob/main/docs/cli/#--reload) flags to the `astro` CLI.

## 0.12.3

### Patch Changes

- fe6a985: Fixes resolution when esinstall installs Markdown and Prism components

## 0.12.2

### Patch Changes

- 50e6f49: Fixes issues with using astro via the create script
- Updated dependencies [50e6f49]
  - @astrojs/markdown-support@0.1.1

## 0.12.1

### Patch Changes

- Updated dependencies [6de740d]
  - astro-parser@0.12.1

## 0.12.0

### Minor Changes

- 8ff7998: Enable Snowpack's [built-in HMR support](https://www.snowpack.dev/concepts/hot-module-replacement) to enable seamless live updates while editing.
- ffb6380: Support for dynamic Markdown through the content attribute.
- 8ff7998: Enabled Snowpack's built-in HMR engine for Astro pages
- 643c880: **This is a breaking change**

  Updated the rendering pipeline for `astro` to truly support any framework.

  For the vast majority of use cases, `astro` should _just work_ out of the box. Astro now depends on `@astrojs/renderer-preact`, `@astrojs/renderer-react`, `@astrojs/renderer-svelte`, and `@astrojs/renderer-vue`, rather than these being built into the core library. This opens the door for anyone to contribute additional renderers for Astro to support their favorite framework, as well as the ability for users to control which renderers should be used.

  **Features**

  - Expose a pluggable interface for controlling server-side rendering and client-side hydration
  - Allows components from different frameworks to be nested within each other.
    > Note: `svelte` currently does support non-destructive hydration, so components from other frameworks cannot currently be nested inside of a Svelte component. See https://github.com/sveltejs/svelte/issues/4308.

  **Breaking Changes**

  - To improve compiler performance, improve framework support, and minimize JS payloads, any children passed to hydrated components are automatically wrapped with an `<astro-fragment>` element.

### Patch Changes

- 3d20623: Fixed a bug where Astro did not conform to JSX Expressions' [`&&`](https://reactjs.org/docs/conditional-rendering.html#inline-if-with-logical--operator) syntax.

  Also fixed a bug where `<span data-attr="" />` would render as `<span data-attr="undefined" />`.

- 46871d2: Fixed bug where a class attribute was added to the doctype
- c9d833e: Fixed a number of bugs and re-enabled the `@astrojs/renderer-vue` renderer
- ce30bb0: Temporarily disable `@astrojs/renderer-vue` while we investigate an issue with installation
- addd67d: Rename `astroConfig` to `pages` in config. Docs updated.
- d2330a5: Improve error display for missing local files
- Updated dependencies [643c880]
- Updated dependencies [d2330a5]
- Updated dependencies [c9d833e]
  - @astrojs/renderer-preact@0.1.0
  - @astrojs/renderer-react@0.1.0
  - @astrojs/renderer-svelte@0.1.0
  - @astrojs/renderer-vue@0.1.0
  - astro-parser@0.12.0

## 0.12.0-next.1

### Patch Changes

- ce30bb0: Temporarily disable `@astrojs/renderer-vue` while we investigate an issue with installation

## 0.12.0-next.0

### Minor Changes

- 8ff7998: Enable Snowpack's [built-in HMR support](https://www.snowpack.dev/concepts/hot-module-replacement) to enable seamless live updates while editing.
- 8ff7998: Enabled Snowpack's built-in HMR engine for Astro pages
- 643c880: **This is a breaking change**

  Updated the rendering pipeline for `astro` to truly support any framework.

  For the vast majority of use cases, `astro` should _just work_ out of the box. Astro now depends on `@astrojs/renderer-preact`, `@astrojs/renderer-react`, `@astrojs/renderer-svelte`, and `@astrojs/renderer-vue`, rather than these being built into the core library. This opens the door for anyone to contribute additional renderers for Astro to support their favorite framework, as well as the ability for users to control which renderers should be used.

  **Features**

  - Expose a pluggable interface for controlling server-side rendering and client-side hydration
  - Allows components from different frameworks to be nested within each other.
    > Note: `svelte` currently does support non-destructive hydration, so components from other frameworks cannot currently be nested inside of a Svelte component. See https://github.com/sveltejs/svelte/issues/4308.

  **Breaking Changes**

  - To improve compiler performance, improve framework support, and minimize JS payloads, any children passed to hydrated components are automatically wrapped with an `<astro-fragment>` element.

### Patch Changes

- 3d20623: Fixed a bug where Astro did not conform to JSX Expressions' [`&&`](https://reactjs.org/docs/conditional-rendering.html#inline-if-with-logical--operator) syntax.

  Also fixed a bug where `<span data-attr="" />` would render as `<span data-attr="undefined" />`.

- Updated dependencies [643c880]
  - @astrojs/renderer-preact@0.1.0-next.0
  - @astrojs/renderer-react@0.1.0-next.0
  - @astrojs/renderer-svelte@0.1.0-next.0
  - @astrojs/renderer-vue@0.1.0-next.0

## 0.11.0

### Minor Changes

- 19e20f2: Add Tailwind JIT support for Astro

### Patch Changes

- c43ee95: Bugfix: CSS bundling randomizes order
- 9cdada0: Fixes a few edge case bugs with Astro's handling of Markdown content
- Updated dependencies [9cdada0]
  - astro-parser@0.11.0

## 0.10.0

`astro` has been bumped to `0.10.0` to avoid conflicts with the previously published `astro` package (which was graciously donated to us at `v0.9.2`).

### Minor Changes

- b3886c2: Enhanced **Markdown** support! Markdown processing has been moved from `micromark` to `remark` to prepare Astro for user-provided `remark` plugins _in the future_.

  This change also introduces a built-in `<Markdown>` component for embedding Markdown and any Astro-supported component format inside of `.astro` files. [Read more about Astro's Markdown support.](https://docs.astro.build/markdown/)

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
