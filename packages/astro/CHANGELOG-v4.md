## 4.16.16

### Patch Changes

- [#12542](https://github.com/withastro/astro/pull/12542) [`65e50eb`](https://github.com/withastro/astro/commit/65e50eb7b6d7b10a193bba7d292804ac0e55be18) Thanks [@kadykov](https://github.com/kadykov)! - Fix JPEG image size determination

- [#12525](https://github.com/withastro/astro/pull/12525) [`cf0d8b0`](https://github.com/withastro/astro/commit/cf0d8b08a0f16bba7310d1a92c82b5a276682e8c) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where with `i18n` enabled, Astro couldn't render the `404.astro` component for non-existent routes.

## 4.16.15

### Patch Changes

- [#12498](https://github.com/withastro/astro/pull/12498) [`b140a3f`](https://github.com/withastro/astro/commit/b140a3f6d821127f927b7cb938294549e41c5168) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where Astro was trying to access `Request.headers`

## 4.16.14

### Patch Changes

- [#12480](https://github.com/withastro/astro/pull/12480) [`c3b7e7c`](https://github.com/withastro/astro/commit/c3b7e7cfa13603c08eb923703f31a92d514e82db) Thanks [@matthewp](https://github.com/matthewp)! - Removes the default throw behavior in `astro:env`

- [#12444](https://github.com/withastro/astro/pull/12444) [`28dd3ce`](https://github.com/withastro/astro/commit/28dd3ce5222a667fe113238254edf59318b3fa14) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where a server island hydration script might fail case the island ID misses from the DOM.

- [#12476](https://github.com/withastro/astro/pull/12476) [`80a9a52`](https://github.com/withastro/astro/commit/80a9a5299a9d51f2b09900d3200976d687feae8f) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where the Content Layer `glob()` loader would not update when renaming or deleting an entry

- [#12418](https://github.com/withastro/astro/pull/12418) [`25baa4e`](https://github.com/withastro/astro/commit/25baa4ed0c5f55fa85c2c7e2c15848937ed1dc9b) Thanks [@oliverlynch](https://github.com/oliverlynch)! - Fix cached image redownloading if it is the first asset

- [#12477](https://github.com/withastro/astro/pull/12477) [`46f6b38`](https://github.com/withastro/astro/commit/46f6b386b3db6332f286d79958ef10261958cceb) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the SSR build was emitting the `dist/server/entry.mjs` file with an incorrect import at the top of the file/

- [#12365](https://github.com/withastro/astro/pull/12365) [`a23985b`](https://github.com/withastro/astro/commit/a23985b02165c2ddce56d511b3f97b6815c452c9) Thanks [@apatel369](https://github.com/apatel369)! - Fixes an issue where `Astro.currentLocale` was not correctly returning the locale for 404 and 500 pages.

## 4.16.13

### Patch Changes

- [#12436](https://github.com/withastro/astro/pull/12436) [`453ec6b`](https://github.com/withastro/astro/commit/453ec6b12f8c021e0bd0fd0ea9f71c8fc280f4b1) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a potential null access in the clientside router

- [#12392](https://github.com/withastro/astro/pull/12392) [`0462219`](https://github.com/withastro/astro/commit/0462219612183b65867aaaef9fa538d89f201999) Thanks [@apatel369](https://github.com/apatel369)! - Fixes an issue where scripts were not correctly injected during the build. The issue was triggered when there were injected routes with the same `entrypoint` and different `pattern`

## 4.16.12

### Patch Changes

- [#12420](https://github.com/withastro/astro/pull/12420) [`acac0af`](https://github.com/withastro/astro/commit/acac0af53466f8a381ccdac29ed2ad735d7b4e79) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the dev server returns a 404 status code when a user middleware returns a valid `Response`.

## 4.16.11

### Patch Changes

- [#12305](https://github.com/withastro/astro/pull/12305) [`f5f7109`](https://github.com/withastro/astro/commit/f5f71094ec74961b4cca2ee451798abd830c617a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where the error overlay would not escape the message

- [#12402](https://github.com/withastro/astro/pull/12402) [`823e73b`](https://github.com/withastro/astro/commit/823e73b164eab4115af31b1de8e978f2b4e0a95d) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where Astro allowed to call an action without using `Astro.callAction`. This is now invalid, and Astro will show a proper error.

  ```diff
  ---
  import { actions } from "astro:actions";

  -const result = actions.getUser({ userId: 123 });
  +const result = Astro.callAction(actions.getUser, { userId: 123 });
  ---
  ```

- [#12401](https://github.com/withastro/astro/pull/12401) [`9cca108`](https://github.com/withastro/astro/commit/9cca10843912698e13d35f1bc3c493e2c96a06ee) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes unexpected 200 status in dev server logs for action errors and redirects.

## 4.16.10

### Patch Changes

- [#12311](https://github.com/withastro/astro/pull/12311) [`bf2723e`](https://github.com/withastro/astro/commit/bf2723e83140099914b29c6d51eb147a065be460) Thanks [@dinesh-58](https://github.com/dinesh-58)! - Adds `checked` to the list of boolean attributes.

- [#12363](https://github.com/withastro/astro/pull/12363) [`222f718`](https://github.com/withastro/astro/commit/222f71894cc7118319ce83b3b29fa61a9dbebb75) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes code generated by `astro add` command when adding a version of an integration other than the default `latest`.

- [#12368](https://github.com/withastro/astro/pull/12368) [`493fe43`](https://github.com/withastro/astro/commit/493fe43cd3ef94b087b8958031ecc964ae73463b) Thanks [@bluwy](https://github.com/bluwy)! - Improves error logs when executing commands

- [#12355](https://github.com/withastro/astro/pull/12355) [`c4726d7`](https://github.com/withastro/astro/commit/c4726d7ba8cc93157390ce64d5c8b718ed5cac29) Thanks [@apatel369](https://github.com/apatel369)! - Improves error reporting for invalid frontmatter in MDX files during the `astro build` command. The error message now includes the file path where the frontmatter parsing failed.

## 4.16.9

### Patch Changes

- [#12333](https://github.com/withastro/astro/pull/12333) [`836cd91`](https://github.com/withastro/astro/commit/836cd91c37cea8ae58dd04a326435fcb2c88f358) Thanks [@imattacus](https://github.com/imattacus)! - Destroy the server response stream if async error is thrown

- [#12358](https://github.com/withastro/astro/pull/12358) [`7680349`](https://github.com/withastro/astro/commit/76803498738f9e86e7948ce81e01e63607e03549) Thanks [@spacedawwwg](https://github.com/spacedawwwg)! - Honors `inlineAstroConfig` parameter in `getViteConfig` when creating a logger

- [#12353](https://github.com/withastro/astro/pull/12353) [`35795a1`](https://github.com/withastro/astro/commit/35795a1a54b2bfaf331c58ca91b47e5672e08c4e) Thanks [@hippotastic](https://github.com/hippotastic)! - Fixes an issue in dev server watch file handling that could cause multiple restarts for a single file change.

- [#12351](https://github.com/withastro/astro/pull/12351) [`5751488`](https://github.com/withastro/astro/commit/57514881655b62a0bc39ace1e1ed4b89b96f74ca) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Reverts a change made in `4.16.6` that prevented usage of `astro:env` secrets inside middleware in SSR

- [#12346](https://github.com/withastro/astro/pull/12346) [`20e5a84`](https://github.com/withastro/astro/commit/20e5a843c86e9328814615edf3e8a6fb5e4696cc) Thanks [@bluwy](https://github.com/bluwy)! - Fixes sourcemap generation when prefetch is enabled

- [#12349](https://github.com/withastro/astro/pull/12349) [`1fc83d3`](https://github.com/withastro/astro/commit/1fc83d3ba8315c31b2a3aadc77b20b1615d261a0) Thanks [@norskeld](https://github.com/norskeld)! - Fixes the `getImage` options type so it properly extends `ImageTransform`

## 4.16.8

### Patch Changes

- [#12338](https://github.com/withastro/astro/pull/12338) [`9ca89b3`](https://github.com/withastro/astro/commit/9ca89b3e13d47e146989cfabb916d6599d140f03) Thanks [@situ2001](https://github.com/situ2001)! - Resets `NODE_ENV` to ensure install command run in dev mode

- [#12286](https://github.com/withastro/astro/pull/12286) [`9d6bcdb`](https://github.com/withastro/astro/commit/9d6bcdb88fcb9df0c5c70e2b591bcf962ce55f63) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where a warning for experimental `astro:env` support would be shown when using an adapter but not actually using `astro:env`

- [#12342](https://github.com/withastro/astro/pull/12342) [`ffc836b`](https://github.com/withastro/astro/commit/ffc836bac0cdea684ea91f958ac8298d4ee4b07d) Thanks [@liruifengv](https://github.com/liruifengv)! - Fixes a typo in the command name of the CLI

- [#12301](https://github.com/withastro/astro/pull/12301) [`0cfc69d`](https://github.com/withastro/astro/commit/0cfc69d499815d4e1f1dc37cf32653195586087a) Thanks [@apatel369](https://github.com/apatel369)! - Fixes an issue with action handler context by passing the correct context (`ActionAPIContext`).

- [#12312](https://github.com/withastro/astro/pull/12312) [`5642ef9`](https://github.com/withastro/astro/commit/5642ef9029890fc29793c160321f78f62cdaafcb) Thanks [@koyopro](https://github.com/koyopro)! - Fixes an issue where using `getViteConfig()` returns incorrect and duplicate configuration

- [#12245](https://github.com/withastro/astro/pull/12245) [`1d4f6a4`](https://github.com/withastro/astro/commit/1d4f6a4989bc1cfd7109b1bff41503f115660e02) Thanks [@bmenant](https://github.com/bmenant)! - Add `components` property to MDXInstance type definition (RenderResult and module import)

- [#12340](https://github.com/withastro/astro/pull/12340) [`94eaeea`](https://github.com/withastro/astro/commit/94eaeea1c437402ffc44103126b355adab4b8a01) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro actions didn't work when `base` was different from `/`

## 4.16.7

### Patch Changes

- [#12263](https://github.com/withastro/astro/pull/12263) [`e9e8080`](https://github.com/withastro/astro/commit/e9e8080a8139f898dcfa3c030f5ddaa98413c160) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes conflict between server islands and on-demand dynamic routes in the form of `/[...rest]` or `/[paramA]/[paramB]`.

- [#12279](https://github.com/withastro/astro/pull/12279) [`b781f88`](https://github.com/withastro/astro/commit/b781f8860c7d11e51fb60a0d6528bc88913ffc35) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Update wrong error message

- [#12273](https://github.com/withastro/astro/pull/12273) [`c2ee963`](https://github.com/withastro/astro/commit/c2ee963cb6c0a65481be505848a7272d800f2f7b) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue with some package managers where sites would not build if TypeScript was not installed.

- [#12235](https://github.com/withastro/astro/pull/12235) [`a75bc5e`](https://github.com/withastro/astro/commit/a75bc5e3068ed80366a03efbec78b3b0f8837516) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where Astro Actions couldn't redirect to the correct pathname when there was a rewrite involved.

- [#11839](https://github.com/withastro/astro/pull/11839) [`ff522b9`](https://github.com/withastro/astro/commit/ff522b96a01391a29b44f820dfcc2a2176d871e7) Thanks [@icaliman](https://github.com/icaliman)! - Fixes error when returning a top-level `null` from an Astro file frontmatter

- [#12272](https://github.com/withastro/astro/pull/12272) [`388d237`](https://github.com/withastro/astro/commit/388d2375b6900e6401e1c711087ee0b2176418dd) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly handles local images when using a base path in SSR

## 4.16.6

### Patch Changes

- [#11823](https://github.com/withastro/astro/pull/11823) [`a3d30a6`](https://github.com/withastro/astro/commit/a3d30a602aaa1755197c73f0b51cace61f9088b3) Thanks [@DerTimonius](https://github.com/DerTimonius)! - fix: improve error message when inferSize is used in local images with the Image component

- [#12227](https://github.com/withastro/astro/pull/12227) [`8b1a641`](https://github.com/withastro/astro/commit/8b1a641be9de4baa9ae48dd0d045915fbbeffa8c) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where environment variables would not be refreshed when using `astro:env`

- [#12239](https://github.com/withastro/astro/pull/12239) [`2b6daa5`](https://github.com/withastro/astro/commit/2b6daa5840c18729c41f6cd8b4571b88d0cba119) Thanks [@ematipico](https://github.com/ematipico)! - **BREAKING CHANGE to the experimental Container API only**

  Changes the default page rendering behavior of Astro components in containers, and adds a new option `partial: false` to render full Astro pages as before.

  Previously, the Container API was rendering all Astro components as if they were full Astro pages containing `<!DOCTYPE html>` by default. This was not intended, and now by default, all components will render as [page partials](https://docs.astro.build/en/basics/astro-pages/#page-partials): only the contents of the components without a page shell.

  To render the component as a full-fledged Astro page, pass a new option called `partial: false` to `renderToString()` and `renderToResponse()`:

  ```js
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import Card from '../src/components/Card.astro';

  const container = AstroContainer.create();

  await container.renderToString(Card); // the string will not contain `<!DOCTYPE html>`
  await container.renderToString(Card, { partial: false }); // the string will contain `<!DOCTYPE html>`
  ```

## 4.16.5

### Patch Changes

- [#12232](https://github.com/withastro/astro/pull/12232) [`ff68ba5`](https://github.com/withastro/astro/commit/ff68ba5e1ca00f06d1afd5fbf89acea3092bb660) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue with cssesc in dev mode when setting `vite.ssr.noExternal: true`

## 4.16.4

### Patch Changes

- [#12223](https://github.com/withastro/astro/pull/12223) [`79ffa5d`](https://github.com/withastro/astro/commit/79ffa5d9f75c16465134aa4ed4a3d1d59908ba8b) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes a false positive reported by the dev toolbar Audit app where a label was considered missing when associated with a button

  The `button` element can be [used with a label](https://www.w3.org/TR/2011/WD-html5-author-20110809/forms.html#category-label) (e.g. to create a switch) and should not be reported as an accessibility issue when used as a child of a `label`.

- [#12199](https://github.com/withastro/astro/pull/12199) [`c351352`](https://github.com/withastro/astro/commit/c3513523608f319b43c050e391be08e68b801329) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression in the computation of `Astro.currentLocale`

- [#12222](https://github.com/withastro/astro/pull/12222) [`fb55695`](https://github.com/withastro/astro/commit/fb5569583b11ef585cd0a79e97e7e9dc653f6afa) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the edge middleware couldn't correctly compute the client IP address when calling `ctx.clientAddress()`

## 4.16.3

### Patch Changes

- [#12220](https://github.com/withastro/astro/pull/12220) [`b049359`](https://github.com/withastro/astro/commit/b0493596dc338377198d0a39efc813dad515b624) Thanks [@bluwy](https://github.com/bluwy)! - Fixes accidental internal `setOnSetGetEnv` parameter rename that caused runtime errors

- [#12197](https://github.com/withastro/astro/pull/12197) [`2aa2dfd`](https://github.com/withastro/astro/commit/2aa2dfd05dc7b7e6ad13451e6cc2afa9b1c92a32) Thanks [@ematipico](https://github.com/ematipico)! - Fix a regression where a port was incorrectly added to the `Astro.url`

## 4.16.2

### Patch Changes

- [#12206](https://github.com/withastro/astro/pull/12206) [`12b0022`](https://github.com/withastro/astro/commit/12b00225067445629e5ae451d763d03f70065f88) Thanks [@bluwy](https://github.com/bluwy)! - Reverts https://github.com/withastro/astro/pull/12173 which caused `Can't modify immutable headers` warnings and 500 errors on Cloudflare Pages

## 4.16.1

### Patch Changes

- [#12177](https://github.com/withastro/astro/pull/12177) [`a4ffbfa`](https://github.com/withastro/astro/commit/a4ffbfaa5cb460c12bd486fd75e36147f51d3e5e) Thanks [@matthewp](https://github.com/matthewp)! - Ensure we target scripts for execution in the router

  Using `document.scripts` is unsafe because if the application has a `name="scripts"` this will shadow the built-in `document.scripts`. Fix is to use `getElementsByTagName` to ensure we're only grabbing real scripts.

- [#12173](https://github.com/withastro/astro/pull/12173) [`2d10de5`](https://github.com/withastro/astro/commit/2d10de5f212323e6e19c7ea379826dcc18fe739c) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where Astro Actions couldn't redirect to the correct pathname when there was a rewrite involved.

## 4.16.0

### Minor Changes

- [#12039](https://github.com/withastro/astro/pull/12039) [`710a1a1`](https://github.com/withastro/astro/commit/710a1a11f488ff6ed3da6d3e0723b2322ccfe27b) Thanks [@ematipico](https://github.com/ematipico)! - Adds a `markdown.shikiConfig.langAlias` option that allows [aliasing a non-supported code language to a known language](https://shiki.style/guide/load-lang#custom-language-aliases). This is useful when the language of your code samples is not [a built-in Shiki language](https://shiki.style/languages), but you want your Markdown source to contain an accurate language while also displaying syntax highlighting.

  The following example configures Shiki to highlight `cjs` code blocks using the `javascript` syntax highlighter:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    markdown: {
      shikiConfig: {
        langAlias: {
          cjs: 'javascript',
        },
      },
    },
  });
  ```

  Then in your Markdown, you can use the alias as the language for a code block for syntax highlighting:

  ````md
  ```cjs
  'use strict';

  function commonJs() {
    return 'I am a commonjs file';
  }
  ```
  ````

- [#11984](https://github.com/withastro/astro/pull/11984) [`3ac2263`](https://github.com/withastro/astro/commit/3ac2263ff6070136bec9cffb863c38bcc31ccdfe) Thanks [@chaegumi](https://github.com/chaegumi)! - Adds a new `build.concurrency` configuration option to specify the number of pages to build in parallel

  **In most cases, you should not change the default value of `1`.**

  Use this option only when other attempts to reduce the overall rendering time (e.g. batch or cache long running tasks like fetch calls or data access) are not possible or are insufficient.

  Use this option only if the refactors are not possible. If the number is set too high, the page rendering may slow down due to insufficient memory resources and because JS is single-threaded.

  > [!WARNING]
  > This feature is stable and is not considered experimental. However, this feature is only intended to address difficult performance issues, and breaking changes may occur in a [minor release](https://docs.astro.build/en/upgrade-astro/#semantic-versioning) to keep this option as performant as possible.

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro';

  export default defineConfig({
    build: {
      concurrency: 2,
    },
  });
  ```

### Patch Changes

- [#12160](https://github.com/withastro/astro/pull/12160) [`c6fd1df`](https://github.com/withastro/astro/commit/c6fd1df695d0f2a24bb49e6954064f92664ccf67) Thanks [@louisescher](https://github.com/louisescher)! - Fixes a bug where `astro.config.mts` and `astro.config.cts` weren't reloading the dev server upon modifications.

- [#12130](https://github.com/withastro/astro/pull/12130) [`e96bcae`](https://github.com/withastro/astro/commit/e96bcae535ef2f0661f539c1d49690c531df2d4e) Thanks [@thehansys](https://github.com/thehansys)! - Fixes a bug in the parsing of `x-forwarded-\*` `Request` headers, where multiple values assigned to those headers were not correctly parsed.

  Now, headers like `x-forwarded-proto: https,http` are correctly parsed.

- [#12147](https://github.com/withastro/astro/pull/12147) [`9db755a`](https://github.com/withastro/astro/commit/9db755ab7cfe658ec426387e297bdcd32c4bc8de) Thanks [@ascorbic](https://github.com/ascorbic)! - Skips setting statusMessage header for HTTP/2 response

  HTTP/2 doesn't support status message, so setting this was logging a warning.

- [#12151](https://github.com/withastro/astro/pull/12151) [`bb6d37f`](https://github.com/withastro/astro/commit/bb6d37f94a283433994f9243189cb4386df0e11a) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where `Astro.currentLocale` wasn't incorrectly computed when the `defaultLocale` belonged to a custom locale path.

- Updated dependencies [[`710a1a1`](https://github.com/withastro/astro/commit/710a1a11f488ff6ed3da6d3e0723b2322ccfe27b)]:
  - @astrojs/markdown-remark@5.3.0

## 4.15.12

### Patch Changes

- [#12121](https://github.com/withastro/astro/pull/12121) [`2490ceb`](https://github.com/withastro/astro/commit/2490cebdb93f13ee552cffa72b2e274d64e6b4a7) Thanks [@ascorbic](https://github.com/ascorbic)! - Support passing the values `Infinity` and `-Infinity` as island props.

- [#12118](https://github.com/withastro/astro/pull/12118) [`f47b347`](https://github.com/withastro/astro/commit/f47b347da899c6e1dcd0b2e7887f7fce6ec8e270) Thanks [@Namchee](https://github.com/Namchee)! - Removes the `strip-ansi` dependency in favor of the native Node API

- [#12126](https://github.com/withastro/astro/pull/12126) [`6e1dfeb`](https://github.com/withastro/astro/commit/6e1dfeb76bec09d24928bab798c6ad3280f42e84) Thanks [@ascorbic](https://github.com/ascorbic)! - Clear content layer cache when astro version changes

- [#12117](https://github.com/withastro/astro/pull/12117) [`a46839a`](https://github.com/withastro/astro/commit/a46839a5c818b7de63c36d0c7e27f1a8f3b773dc) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Updates Vite links to use their new domain

- [#12124](https://github.com/withastro/astro/pull/12124) [`499fbc9`](https://github.com/withastro/astro/commit/499fbc91a6bdad8c86ff13a8caf1fa09433796b9) Thanks [@ascorbic](https://github.com/ascorbic)! - Allows special characters in Action names

- [#12123](https://github.com/withastro/astro/pull/12123) [`b8673df`](https://github.com/withastro/astro/commit/b8673df51c6cc4ce6a288f8eb609b7a438a07d82) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes missing `body` property on CollectionEntry types for content layer entries

- [#12132](https://github.com/withastro/astro/pull/12132) [`de35daa`](https://github.com/withastro/astro/commit/de35daa8517555c1b9c72bc7fe9cc955c4997a83) Thanks [@jcayzac](https://github.com/jcayzac)! - Updates the [`cookie`](https://npmjs.com/package/cookie) dependency to avoid the [CVE 2024-47764](https://nvd.nist.gov/vuln/detail/CVE-2024-47764) vulnerability.

- [#12113](https://github.com/withastro/astro/pull/12113) [`a54e520`](https://github.com/withastro/astro/commit/a54e520d3c139fa123e7029c5933951b5c7f5a39) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a helpful error when attempting to render an undefined collection entry

## 4.15.11

### Patch Changes

- [#12097](https://github.com/withastro/astro/pull/12097) [`11d447f`](https://github.com/withastro/astro/commit/11d447f66b1a0f39489c2600139ebfb565336ce7) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes error where references in content layer schemas sometimes incorrectly report as missing

- [#12108](https://github.com/withastro/astro/pull/12108) [`918953b`](https://github.com/withastro/astro/commit/918953bd09f057131dfe029e810019c0909345cf) Thanks [@lameuler](https://github.com/lameuler)! - Fixes a bug where [data URL images](https://developer.mozilla.org/en-US/docs/Web/URI/Schemes/data) were not correctly handled. The bug resulted in an `ENAMETOOLONG` error.

- [#12105](https://github.com/withastro/astro/pull/12105) [`42037f3`](https://github.com/withastro/astro/commit/42037f33e644d5a2bfba71377697fc7336ecb15b) Thanks [@ascorbic](https://github.com/ascorbic)! - Returns custom statusText that has been set in a Response

- [#12109](https://github.com/withastro/astro/pull/12109) [`ea22558`](https://github.com/withastro/astro/commit/ea225585fd12d27006434266163512ca66ad572b) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression that was introduced by an internal refactor of how the middleware is loaded by the Astro application. The regression was introduced by [#11550](https://github.com/withastro/astro/pull/11550).

  When the edge middleware feature is opted in, Astro removes the middleware function from the SSR manifest, and this wasn't taken into account during the refactor.

- [#12106](https://github.com/withastro/astro/pull/12106) [`d3a74da`](https://github.com/withastro/astro/commit/d3a74da19644477ffc81acf2a3efb26ad3335a5e) Thanks [@ascorbic](https://github.com/ascorbic)! - Handles case where an immutable Response object is returned from an endpoint

- [#12090](https://github.com/withastro/astro/pull/12090) [`d49a537`](https://github.com/withastro/astro/commit/d49a537f2aaccd132154a15f1da4db471272ee90) Thanks [@markjaquith](https://github.com/markjaquith)! - Server islands: changes the server island HTML placeholder comment so that it is much less likely to get removed by HTML minifiers.

## 4.15.10

### Patch Changes

- [#12084](https://github.com/withastro/astro/pull/12084) [`12dae50`](https://github.com/withastro/astro/commit/12dae50c776474748a80cb65c8bf1c67f0825cb0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds missing filePath property on content layer entries

- [#12046](https://github.com/withastro/astro/pull/12046) [`d7779df`](https://github.com/withastro/astro/commit/d7779dfae7bc00ff94b1e4596ff5b4897f65aabe) Thanks [@martrapp](https://github.com/martrapp)! - View transitions: Fixes Astro's fade animation to prevent flashing during morph transitions.

- [#12043](https://github.com/withastro/astro/pull/12043) [`1720c5b`](https://github.com/withastro/astro/commit/1720c5b1d2bfd106ad065833823aed622bee09bc) Thanks [@bluwy](https://github.com/bluwy)! - Fixes injected endpoint `prerender` option detection

- [#12095](https://github.com/withastro/astro/pull/12095) [`76c5fbd`](https://github.com/withastro/astro/commit/76c5fbd6f3a8d41367f1d7033278d133d518213b) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fix installing non-stable versions of integrations with `astro add`

## 4.15.9

### Patch Changes

- [#12034](https://github.com/withastro/astro/pull/12034) [`5b3ddfa`](https://github.com/withastro/astro/commit/5b3ddfadcb2d09b6cbd9cd42641f30ca565d0f58) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the middleware wasn't called when a project uses `404.astro`.

- [#12042](https://github.com/withastro/astro/pull/12042) [`243ecb6`](https://github.com/withastro/astro/commit/243ecb6d6146dc483b4726d0e76142fb25e56243) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a problem in the Container API, where a polyfill wasn't correctly applied. This caused an issue in some environments where `crypto` isn't supported.

- [#12038](https://github.com/withastro/astro/pull/12038) [`26ea5e8`](https://github.com/withastro/astro/commit/26ea5e814ab8c973e683fff62389fda28c180940) Thanks [@ascorbic](https://github.com/ascorbic)! - Resolves image paths in content layer with initial slash as project-relative

  When using the `image()` schema helper, previously paths with an initial slash were treated as public URLs. This was to match the behavior of markdown images. However this is a change from before, where paths with an initial slash were treated as project-relative. This change restores the previous behavior, so that paths with an initial slash are treated as project-relative.

## 4.15.8

### Patch Changes

- [#12014](https://github.com/withastro/astro/pull/12014) [`53cb41e`](https://github.com/withastro/astro/commit/53cb41e30ea5768bf33d9f6be608fb57d31b7b9e) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue where component styles were not correctly included in rendered MDX

- [#12031](https://github.com/withastro/astro/pull/12031) [`8c0cae6`](https://github.com/withastro/astro/commit/8c0cae6d1bd70b332286d83d0f01cfce5272fbbe) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the rewrite via `next(/*..*/)` inside a middleware didn't compute the new `APIContext.params`

- [#12026](https://github.com/withastro/astro/pull/12026) [`40e7a1b`](https://github.com/withastro/astro/commit/40e7a1b05d9e5ea3fcda176c9663bbcff86edb63) Thanks [@bluwy](https://github.com/bluwy)! - Initializes the Markdown processor only when there's `.md` files

- [#12028](https://github.com/withastro/astro/pull/12028) [`d3bd673`](https://github.com/withastro/astro/commit/d3bd673392e63720e241d6a002a131a3564c169c) Thanks [@bluwy](https://github.com/bluwy)! - Handles route collision detection only if it matches `getStaticPaths`

- [#12027](https://github.com/withastro/astro/pull/12027) [`dd3b753`](https://github.com/withastro/astro/commit/dd3b753aba6400558671d85214e27b8e4fb1654b) Thanks [@fviolette](https://github.com/fviolette)! - Add `selected` to the list of boolean attributes

- [#12001](https://github.com/withastro/astro/pull/12001) [`9be3e1b`](https://github.com/withastro/astro/commit/9be3e1bba789af96d8b21d9c8eca8542cfb4ff77) Thanks [@uwej711](https://github.com/uwej711)! - Remove dependency on path-to-regexp

## 4.15.7

### Patch Changes

- [#12000](https://github.com/withastro/astro/pull/12000) [`a2f8c5d`](https://github.com/withastro/astro/commit/a2f8c5d85ff15803f5cedf9148cd70ffc138ddef) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes an outdated link used to document Content Layer API

- [#11915](https://github.com/withastro/astro/pull/11915) [`0b59fe7`](https://github.com/withastro/astro/commit/0b59fe74d5922c572007572ddca8d11482e2fb5c) Thanks [@azhirov](https://github.com/azhirov)! - Fix: prevent island from re-rendering when using transition:persist (#11854)

## 4.15.6

### Patch Changes

- [#11993](https://github.com/withastro/astro/pull/11993) [`ffba5d7`](https://github.com/withastro/astro/commit/ffba5d716edcdfc42899afaa4188b7a4cd0c91eb) Thanks [@matthewp](https://github.com/matthewp)! - Fix getStaticPaths regression

  This reverts a previous change meant to remove a dependency, to fix a regression with multiple nested spread routes.

- [#11964](https://github.com/withastro/astro/pull/11964) [`06eff60`](https://github.com/withastro/astro/commit/06eff60cabb55d91fe4075421b1693b1ab33225c) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Add wayland (wl-copy) support to `astro info`

## 4.15.5

### Patch Changes

- [#11939](https://github.com/withastro/astro/pull/11939) [`7b09c62`](https://github.com/withastro/astro/commit/7b09c62b565cd7b50c35fb68d390729f936a43fb) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds support for Zod discriminated unions on Action form inputs. This allows forms with different inputs to be submitted to the same action, using a given input to decide which object should be used for validation.

  This example accepts either a `create` or `update` form submission, and uses the `type` field to determine which object to validate against.

  ```ts
  import { defineAction } from 'astro:actions';
  import { z } from 'astro:schema';

  export const server = {
    changeUser: defineAction({
      accept: 'form',
      input: z.discriminatedUnion('type', [
        z.object({
          type: z.literal('create'),
          name: z.string(),
          email: z.string().email(),
        }),
        z.object({
          type: z.literal('update'),
          id: z.number(),
          name: z.string(),
          email: z.string().email(),
        }),
      ]),
      async handler(input) {
        if (input.type === 'create') {
          // input is { type: 'create', name: string, email: string }
        } else {
          // input is { type: 'update', id: number, name: string, email: string }
        }
      },
    }),
  };
  ```

  The corresponding `create` and `update` forms may look like this:

  ```astro
  ---
  import { actions } from 'astro:actions';
  ---

  <!--Create-->
  <form action={actions.changeUser} method="POST">
    <input type="hidden" name="type" value="create" />
    <input type="text" name="name" required />
    <input type="email" name="email" required />
    <button type="submit">Create User</button>
  </form>

  <!--Update-->
  <form action={actions.changeUser} method="POST">
    <input type="hidden" name="type" value="update" />
    <input type="hidden" name="id" value="user-123" />
    <input type="text" name="name" required />
    <input type="email" name="email" required />
    <button type="submit">Update User</button>
  </form>
  ```

- [#11968](https://github.com/withastro/astro/pull/11968) [`86ad1fd`](https://github.com/withastro/astro/commit/86ad1fd223e2d2c448372caa159090efbee69237) Thanks [@NikolaRHristov](https://github.com/NikolaRHristov)! - Fixes a typo in the server island JSDoc

- [#11983](https://github.com/withastro/astro/pull/11983) [`633eeaa`](https://github.com/withastro/astro/commit/633eeaa9d8a8a35bba638fde06fd8f52cc1c2ce3) Thanks [@uwej711](https://github.com/uwej711)! - Remove dependency on path-to-regexp

## 4.15.4

### Patch Changes

- [#11879](https://github.com/withastro/astro/pull/11879) [`bd1d4aa`](https://github.com/withastro/astro/commit/bd1d4aaf8262187b4f132d7fe0365902131ddf1a) Thanks [@matthewp](https://github.com/matthewp)! - Allow passing a cryptography key via ASTRO_KEY

  For Server islands Astro creates a cryptography key in order to hash props for the islands, preventing accidental leakage of secrets.

  If you deploy to an environment with rolling updates then there could be multiple instances of your app with different keys, causing potential key mismatches.

  To fix this you can now pass the `ASTRO_KEY` environment variable to your build in order to reuse the same key.

  To generate a key use:

  ```
  astro create-key
  ```

  This will print out an environment variable to set like:

  ```
  ASTRO_KEY=PIAuyPNn2aKU/bviapEuc/nVzdzZPizKNo3OqF/5PmQ=
  ```

- [#11935](https://github.com/withastro/astro/pull/11935) [`c58193a`](https://github.com/withastro/astro/commit/c58193a691775af5c568e461c63040a42e2471f7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `astro add` not using the proper export point when adding certain adapters

## 4.15.3

### Patch Changes

- [#11902](https://github.com/withastro/astro/pull/11902) [`d63bc50`](https://github.com/withastro/astro/commit/d63bc50d9940c1107e0fee7687e5c332549a0eff) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes case where content layer did not update during clean dev builds on Linux and Windows

- [#11886](https://github.com/withastro/astro/pull/11886) [`7ff7134`](https://github.com/withastro/astro/commit/7ff7134b8038a3b798293b2218bbf6dd02d2ac32) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a missing error message when actions throws during `astro sync`

- [#11904](https://github.com/withastro/astro/pull/11904) [`ca54e3f`](https://github.com/withastro/astro/commit/ca54e3f819fad009ac3c3c8b57a26014a2652a73) Thanks [@wtchnm](https://github.com/wtchnm)! - perf(assets): avoid downloading original image when using cache

## 4.15.2

### Patch Changes

- [#11870](https://github.com/withastro/astro/pull/11870) [`8e5257a`](https://github.com/withastro/astro/commit/8e5257addaeff809ed6f0c47ac0ed4ded755320e) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes typo in documenting the `fallbackType` property in i18n routing

- [#11884](https://github.com/withastro/astro/pull/11884) [`e450704`](https://github.com/withastro/astro/commit/e45070459f18976400fc8939812e172781eba351) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly handles content layer data where the transformed value does not match the input schema

- [#11900](https://github.com/withastro/astro/pull/11900) [`80b4a18`](https://github.com/withastro/astro/commit/80b4a181a077266c44065a737e61cc7cff6bc6d7) Thanks [@delucis](https://github.com/delucis)! - Fixes the user-facing type of the new `i18n.routing.fallbackType` option to be optional

## 4.15.1

### Patch Changes

- [#11872](https://github.com/withastro/astro/pull/11872) [`9327d56`](https://github.com/withastro/astro/commit/9327d56755404b481993b058bbfc4aa7880b2304) Thanks [@bluwy](https://github.com/bluwy)! - Fixes `astro add` importing adapters and integrations

- [#11767](https://github.com/withastro/astro/pull/11767) [`d1bd1a1`](https://github.com/withastro/astro/commit/d1bd1a11f7aca4d2141d1c4665f2db0440393d03) Thanks [@ascorbic](https://github.com/ascorbic)! - Refactors content layer sync to use a queue

## 4.15.0

### Minor Changes

- [#11729](https://github.com/withastro/astro/pull/11729) [`1c54e63`](https://github.com/withastro/astro/commit/1c54e633274ad47f6c83c9a16f375f0caa983fbe) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new variant `sync` for the `astro:config:setup` hook's `command` property. This value is set when calling the command `astro sync`.

  If your integration previously relied on knowing how many variants existed for the `command` property, you must update your logic to account for this new option.

- [#11743](https://github.com/withastro/astro/pull/11743) [`cce0894`](https://github.com/withastro/astro/commit/cce08945340312776a0480fc9ffe43929257639a) Thanks [@ph1p](https://github.com/ph1p)! - Adds a new, optional property `timeout` for the `client:idle` directive.

  This value allows you to specify a maximum time to wait, in milliseconds, before hydrating a UI framework component, even if the page is not yet done with its initial load. This means you can delay hydration for lower-priority UI elements with more control to ensure your element is interactive within a specified time frame.

  ```astro
  <ShowHideButton client:idle={{ timeout: 500 }} />
  ```

- [#11677](https://github.com/withastro/astro/pull/11677) [`cb356a5`](https://github.com/withastro/astro/commit/cb356a5db6b1ec2799790a603f931a961883ab31) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new option `fallbackType` to `i18n.routing` configuration that allows you to control how fallback pages are handled.

  When `i18n.fallback` is configured, this new routing option controls whether to [redirect](https://docs.astro.build/en/guides/routing/#redirects) to the fallback page, or to [rewrite](https://docs.astro.build/en/guides/routing/#rewrites) the fallback page's content in place.

  The `"redirect"` option is the default value and matches the current behavior of the existing fallback system.

  The option `"rewrite"` uses the new [rewriting system](https://docs.astro.build/en/guides/routing/#rewrites) to create fallback pages that render content on the original, requested URL without a browser refresh.

  For example, the following configuration will generate a page `/fr/index.html` that will contain the same HTML rendered by the page `/en/index.html` when `src/pages/fr/index.astro` does not exist.

  ```js
  // astro.config.mjs
  export default defineConfig({
    i18n: {
      locals: ['en', 'fr'],
      defaultLocale: 'en',
      routing: {
        prefixDefaultLocale: true,
        fallbackType: 'rewrite',
      },
      fallback: {
        fr: 'en',
      },
    },
  });
  ```

- [#11708](https://github.com/withastro/astro/pull/11708) [`62b0d20`](https://github.com/withastro/astro/commit/62b0d20b974dc932769221d210b751627fb4bbc6) Thanks [@martrapp](https://github.com/martrapp)! - Adds a new object `swapFunctions` to expose the necessary utility functions on `astro:transitions/client` that allow you to build custom swap functions to be used with view transitions.

  The example below uses these functions to replace Astro's built-in default `swap` function with one that only swaps the `<main>` part of the page:

  ```html
  <script>
    import { swapFunctions } from 'astro:transitions/client';

    document.addEventListener('astro:before-swap', (e) => { e.swap = () => swapMainOnly(e.newDocument) });

    function swapMainOnly(doc: Document) {
      swapFunctions.deselectScripts(doc);
      swapFunctions.swapRootAttributes(doc);
      swapFunctions.swapHeadElements(doc);
      const restoreFocusFunction = swapFunctions.saveFocus();
      const newMain = doc.querySelector('main');
      const oldMain = document.querySelector('main');
      if (newMain && oldMain) {
        swapFunctions.swapBodyElement(newMain, oldMain);
      } else {
        swapFunctions.swapBodyElement(doc.body, document.body);
      }
      restoreFocusFunction();
    };
  </script>
  ```

  See the [view transitions guide](https://docs.astro.build/en/guides/view-transitions/#astrobefore-swap) for more information about hooking into the `astro:before-swap` lifecycle event and adding a custom swap implementation.

- [#11843](https://github.com/withastro/astro/pull/11843) [`5b4070e`](https://github.com/withastro/astro/commit/5b4070efef877a77247bb05a4806b75f22e557c8) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Exposes `z` from the new `astro:schema` module. This is the new recommended import source for all Zod utilities when using Astro Actions.

  ## Migration for Astro Actions users

  `z` will no longer be exposed from `astro:actions`. To use `z` in your actions, import it from `astro:schema` instead:

  ```diff
  import {
    defineAction,
  -  z,
  } from 'astro:actions';
  + import { z } from 'astro:schema';
  ```

- [#11843](https://github.com/withastro/astro/pull/11843) [`5b4070e`](https://github.com/withastro/astro/commit/5b4070efef877a77247bb05a4806b75f22e557c8) Thanks [@bholmesdev](https://github.com/bholmesdev)! - The Astro Actions API introduced behind a flag in [v4.8.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#480) is no longer experimental and is available for general use.

  Astro Actions allow you to define and call backend functions with type-safety, performing data fetching, JSON parsing, and input validation for you.

  Actions can be called from client-side components and HTML forms. This gives you to flexibility to build apps using any technology: React, Svelte, HTMX, or just plain Astro components. This example calls a newsletter action and renders the result using an Astro component:

  ```astro
  ---
  // src/pages/newsletter.astro
  import { actions } from 'astro:actions';
  const result = Astro.getActionResult(actions.newsletter);
  ---

  {result && !result.error && <p>Thanks for signing up!</p>}
  <form method="POST" action={actions.newsletter}>
    <input type="email" name="email" />
    <button>Sign up</button>
  </form>
  ```

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    actions: true,
  -  }
  })
  ```

  If you have been waiting for stabilization before using Actions, you can now do so.

  For more information and usage examples, see our [brand new Actions guide](https://docs.astro.build/en/guides/actions).

### Patch Changes

- [#11677](https://github.com/withastro/astro/pull/11677) [`cb356a5`](https://github.com/withastro/astro/commit/cb356a5db6b1ec2799790a603f931a961883ab31) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug in the logic of `Astro.rewrite()` which led to the value for `base`, if configured, being automatically prepended to the rewrite URL passed. This was unintended behavior and has been corrected, and Astro now processes the URLs exactly as passed.

  If you use the `rewrite()` function on a project that has `base` configured, you must now prepend the base to your existing rewrite URL:

  ```js
  // astro.config.mjs
  export default defineConfig({
    base: '/blog',
  });
  ```

  ```diff
  // src/middleware.js
  export function onRequest(ctx, next) {
  -  return ctx.rewrite("/about")
  +  return ctx.rewrite("/blog/about")
  }
  ```

- [#11862](https://github.com/withastro/astro/pull/11862) [`0e35afe`](https://github.com/withastro/astro/commit/0e35afe44f5a3c9f87b41dc89d5128b02e448895) Thanks [@ascorbic](https://github.com/ascorbic)! - **BREAKING CHANGE to experimental content layer loaders only!**

  Passes `AstroConfig` instead of `AstroSettings` object to content layer loaders.

  This will not affect you unless you have created a loader that uses the `settings` object. If you have, you will need to update your loader to use the `config` object instead.

  ```diff
  export default function myLoader() {
    return {
      name: 'my-loader'
  -   async load({ settings }) {
  -     const base = settings.config.base;
  +   async load({ config }) {
  +     const base = config.base;
        // ...
      }
    }
  }

  ```

  Other properties of the settings object are private internals, and should not be accessed directly. If you think you need access to other properties, please open an issue to discuss your use case.

- [#11772](https://github.com/withastro/astro/pull/11772) [`6272e6c`](https://github.com/withastro/astro/commit/6272e6cec07778e81f853754bffaac40e658c700) Thanks [@bluwy](https://github.com/bluwy)! - Uses `magicast` to update the config for `astro add`

- [#11845](https://github.com/withastro/astro/pull/11845) [`440a4be`](https://github.com/withastro/astro/commit/440a4be0a6ca135e47b0d37124c1be03735ba7ff) Thanks [@bluwy](https://github.com/bluwy)! - Replaces `execa` with `tinyexec` internally

- [#11858](https://github.com/withastro/astro/pull/11858) [`8bab233`](https://github.com/withastro/astro/commit/8bab2339374763d19dbc4cc2c7ce4ad8a2a49694) Thanks [@ascorbic](https://github.com/ascorbic)! - Correctly resolves content layer images when filePath is not set

## 4.14.6

### Patch Changes

- [#11847](https://github.com/withastro/astro/pull/11847) [`45b599c`](https://github.com/withastro/astro/commit/45b599c4d40ded6a3e03881181b441ae494cbfcf) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a case where Vite would be imported by the SSR runtime, causing bundling errors and bloat.

- [#11822](https://github.com/withastro/astro/pull/11822) [`6fcaab8`](https://github.com/withastro/astro/commit/6fcaab84de1044ff4d186b2dfa5831964460062d) Thanks [@bluwy](https://github.com/bluwy)! - Marks internal `vite-plugin-fileurl` plugin with `enforce: 'pre'`

- [#11713](https://github.com/withastro/astro/pull/11713) [`497324c`](https://github.com/withastro/astro/commit/497324c4e87538dc1dc13aea3ced9bd3642d9ba6) Thanks [@voidfill](https://github.com/voidfill)! - Prevents prefetching of the same urls with different hashes.

- [#11814](https://github.com/withastro/astro/pull/11814) [`2bb72c6`](https://github.com/withastro/astro/commit/2bb72c63969f8f21dd279fa927c32f192ff79a3f) Thanks [@eduardocereto](https://github.com/eduardocereto)! - Updates the documentation for experimental Content Layer API with a corrected code example

- [#11842](https://github.com/withastro/astro/pull/11842) [`1ffaae0`](https://github.com/withastro/astro/commit/1ffaae04cf790390f730bf900b9722b99642adc1) Thanks [@stephan281094](https://github.com/stephan281094)! - Fixes a typo in the `MissingImageDimension` error message

- [#11828](https://github.com/withastro/astro/pull/11828) [`20d47aa`](https://github.com/withastro/astro/commit/20d47aa85a3a0d7ac3390f749715d92de830cf3e) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Improves error message when invalid data is returned by an Action.

## 4.14.5

### Patch Changes

- [#11809](https://github.com/withastro/astro/pull/11809) [`62e97a2`](https://github.com/withastro/astro/commit/62e97a20f72bacb017c633ddcb776abc89167660) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes usage of `.transform()`, `.refine()`, `.passthrough()`, and other effects on Action form inputs.

- [#11812](https://github.com/withastro/astro/pull/11812) [`260c4be`](https://github.com/withastro/astro/commit/260c4be050f91353bc5ba6af073e7bc17429d552) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Exposes `ActionAPIContext` type from the `astro:actions` module.

- [#11813](https://github.com/withastro/astro/pull/11813) [`3f7630a`](https://github.com/withastro/astro/commit/3f7630afd697809b1d4fbac6edd18153983c70ac) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes unexpected `undefined` value when calling an action from the client without a return value.

## 4.14.4

### Patch Changes

- [#11794](https://github.com/withastro/astro/pull/11794) [`3691a62`](https://github.com/withastro/astro/commit/3691a626fb67d617e5f8bd057443cd2ff6caa054) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes unexpected warning log when using Actions on "hybrid" rendered projects.

- [#11801](https://github.com/withastro/astro/pull/11801) [`9f943c1`](https://github.com/withastro/astro/commit/9f943c1344671b569a0d1ddba683b3cca0068adc) Thanks [@delucis](https://github.com/delucis)! - Fixes a bug where the `filePath` property was not available on content collection entries when using the content layer `file()` loader with a JSON file that contained an object instead of an array. This was breaking use of the `image()` schema utility among other things.

## 4.14.3

### Patch Changes

- [#11780](https://github.com/withastro/astro/pull/11780) [`c6622ad`](https://github.com/withastro/astro/commit/c6622adaeb405e961b12c91f0e5d02c7333d01cf) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Deprecates the Squoosh image service, to be removed in Astro 5.0. We recommend migrating to the default Sharp service.

- [#11790](https://github.com/withastro/astro/pull/11790) [`41c3fcb`](https://github.com/withastro/astro/commit/41c3fcb6189709450a67ea8f726071d5f3cdc80e) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates the documentation for experimental `astro:env` with a corrected link to the RFC proposal

- [#11773](https://github.com/withastro/astro/pull/11773) [`86a3391`](https://github.com/withastro/astro/commit/86a33915ff41b23ff6b35bcfb1805fefc0760ca7) Thanks [@ematipico](https://github.com/ematipico)! - Changes messages logged when using unsupported, deprecated, or experimental adapter features for clarity

- [#11745](https://github.com/withastro/astro/pull/11745) [`89bab1e`](https://github.com/withastro/astro/commit/89bab1e70786123fbe933a9d7a1b80c9334dcc5f) Thanks [@bluwy](https://github.com/bluwy)! - Prints prerender dynamic value usage warning only if it's used

- [#11774](https://github.com/withastro/astro/pull/11774) [`c6400ab`](https://github.com/withastro/astro/commit/c6400ab99c5e5f4477bc6ef7e801b7869b0aa9ab) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes the path returned by `injectTypes`

- [#11730](https://github.com/withastro/astro/pull/11730) [`2df49a6`](https://github.com/withastro/astro/commit/2df49a6fb4f6d92fe45f7429430abe63defeacd6) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Simplifies path operations of `astro sync`

- [#11771](https://github.com/withastro/astro/pull/11771) [`49650a4`](https://github.com/withastro/astro/commit/49650a45550af46c70c6cf3f848b7b529103a649) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes an error thrown by `astro sync` when an `astro:env` virtual module is imported inside the Content Collections config

- [#11744](https://github.com/withastro/astro/pull/11744) [`b677429`](https://github.com/withastro/astro/commit/b67742961a384c10e5cd04cf5b02d0f014ea7362) Thanks [@bluwy](https://github.com/bluwy)! - Disables the WebSocket server when creating a Vite server for loading config files

## 4.14.2

### Patch Changes

- [#11733](https://github.com/withastro/astro/pull/11733) [`391324d`](https://github.com/withastro/astro/commit/391324df969db71d1c7ca25c2ed14c9eb6eea5ee) Thanks [@bluwy](https://github.com/bluwy)! - Reverts back to `yargs-parser` package for CLI argument parsing

## 4.14.1

### Patch Changes

- [#11725](https://github.com/withastro/astro/pull/11725) [`6c1560f`](https://github.com/withastro/astro/commit/6c1560fb0d19ce659bc9f9090f8050254d5c03f3) Thanks [@ascorbic](https://github.com/ascorbic)! - Prevents content layer importing node builtins in runtime

- [#11692](https://github.com/withastro/astro/pull/11692) [`35af73a`](https://github.com/withastro/astro/commit/35af73aace97a7cc898b9aa5040db8bc2ac62687) Thanks [@matthewp](https://github.com/matthewp)! - Prevent errant HTML from crashing server islands

  When an HTML minifier strips away the server island comment, the script can't correctly know where the end of the fallback content is. This makes it so that it simply doesn't remove any DOM in that scenario. This means the fallback isn't removed, but it also doesn't crash the browser.

- [#11727](https://github.com/withastro/astro/pull/11727) [`3c2f93b`](https://github.com/withastro/astro/commit/3c2f93b66c6b8e9d2ab58e2cbe941c14ffab89b5) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a type issue when using the Content Layer in dev

## 4.14.0

### Minor Changes

- [#11657](https://github.com/withastro/astro/pull/11657) [`a23c69d`](https://github.com/withastro/astro/commit/a23c69d0d0bed229bee52a32e61f135f9ebf9122) Thanks [@bluwy](https://github.com/bluwy)! - Deprecates the option for route-generating files to export a dynamic value for `prerender`. Only static values are now supported (e.g. `export const prerender = true` or `= false`). This allows for better treeshaking and bundling configuration in the future.

  Adds a new [`"astro:route:setup"` hook](https://docs.astro.build/en/reference/integrations-reference/#astroroutesetup) to the Integrations API to allow you to dynamically set options for a route at build or request time through an integration, such as enabling [on-demand server rendering](https://docs.astro.build/en/guides/server-side-rendering/#opting-in-to-pre-rendering-in-server-mode).

  To migrate from a dynamic export to the new hook, update or remove any dynamic `prerender` exports from individual routing files:

  ```diff
  // src/pages/blog/[slug].astro
  - export const prerender = import.meta.env.PRERENDER
  ```

  Instead, create an integration with the `"astro:route:setup"` hook and update the route's `prerender` option:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import { loadEnv } from 'vite';

  export default defineConfig({
    integrations: [setPrerender()],
  });

  function setPrerender() {
    const { PRERENDER } = loadEnv(process.env.NODE_ENV, process.cwd(), '');

    return {
      name: 'set-prerender',
      hooks: {
        'astro:route:setup': ({ route }) => {
          if (route.component.endsWith('/blog/[slug].astro')) {
            route.prerender = PRERENDER;
          }
        },
      },
    };
  }
  ```

- [#11360](https://github.com/withastro/astro/pull/11360) [`a79a8b0`](https://github.com/withastro/astro/commit/a79a8b0230b06ed32ce1802f2a5f84a6cf92dbe7) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a new [`injectTypes()` utility](https://docs.astro.build/en/reference/integrations-reference/#injecttypes-options) to the Integration API and refactors how type generation works

  Use `injectTypes()` in the `astro:config:done` hook to inject types into your user's project by adding a new a `*.d.ts` file.

  The `filename` property will be used to generate a file at `/.astro/integrations/<normalized_integration_name>/<normalized_filename>.d.ts` and must end with `".d.ts"`.

  The `content` property will create the body of the file, and must be valid TypeScript.

  Additionally, `injectTypes()` returns a URL to the normalized path so you can overwrite its content later on, or manipulate it in any way you want.

  ```js
  // my-integration/index.js
  export default {
    name: 'my-integration',
    'astro:config:done': ({ injectTypes }) => {
      injectTypes({
        filename: 'types.d.ts',
        content: "declare module 'virtual:my-integration' {}",
      });
    },
  };
  ```

  Codegen has been refactored. Although `src/env.d.ts` will continue to work as is, we recommend you update it:

  ```diff
  - /// <reference types="astro/client" />
  + /// <reference path="../.astro/types.d.ts" />
  - /// <reference path="../.astro/env.d.ts" />
  - /// <reference path="../.astro/actions.d.ts" />
  ```

- [#11605](https://github.com/withastro/astro/pull/11605) [`d3d99fb`](https://github.com/withastro/astro/commit/d3d99fba269da9e812e748539a11dfed785ef8a4) Thanks [@jcayzac](https://github.com/jcayzac)! - Adds a new property `meta` to Astro's [built-in `<Code />` component](https://docs.astro.build/en/reference/api-reference/#code-).

  This allows you to provide a value for [Shiki's `meta` attribute](https://shiki.style/guide/transformers#meta) to pass options to transformers.

  The following example passes an option to highlight lines 1 and 3 to Shiki's `transformerMetaHighlight`:

  ```astro
  ---
  // src/components/Card.astro
  import { Code } from 'astro:components';
  import { transformerMetaHighlight } from '@shikijs/transformers';
  ---

  <Code code={code} lang="js" transformers={[transformerMetaHighlight()]} meta="{1,3}" />
  ```

- [#11360](https://github.com/withastro/astro/pull/11360) [`a79a8b0`](https://github.com/withastro/astro/commit/a79a8b0230b06ed32ce1802f2a5f84a6cf92dbe7) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds support for Intellisense features (e.g. code completion, quick hints) for your content collection entries in compatible editors under the `experimental.contentIntellisense` flag.

  ```js
  import { defineConfig } from 'astro';

  export default defineConfig({
    experimental: {
      contentIntellisense: true,
    },
  });
  ```

  When enabled, this feature will generate and add JSON schemas to the `.astro` directory in your project. These files can be used by the Astro language server to provide Intellisense inside content files (`.md`, `.mdx`, `.mdoc`).

  Note that at this time, this also require enabling the `astro.content-intellisense` option in your editor, or passing the `contentIntellisense: true` initialization parameter to the Astro language server for editors using it directly.

  See the [experimental content Intellisense docs](https://docs.astro.build/en/reference/configuration-reference/#experimentalcontentintellisense) for more information updates as this feature develops.

- [#11360](https://github.com/withastro/astro/pull/11360) [`a79a8b0`](https://github.com/withastro/astro/commit/a79a8b0230b06ed32ce1802f2a5f84a6cf92dbe7) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds experimental support for the Content Layer API.

  The new Content Layer API builds upon content collections, taking them beyond local files in `src/content/` and allowing you to fetch content from anywhere, including remote APIs. These new collections work alongside your existing content collections, and you can migrate them to the new API at your own pace. There are significant improvements to performance with large collections of local files.

  ### Getting started

  To try out the new Content Layer API, enable it in your Astro config:

  ```js
  import { defineConfig } from 'astro';

  export default defineConfig({
    experimental: {
      contentLayer: true,
    },
  });
  ```

  You can then create collections in your `src/content/config.ts` using the Content Layer API.

  ### Loading your content

  The core of the new Content Layer API is the loader, a function that fetches content from a source and caches it in a local data store. Astro 4.14 ships with built-in `glob()` and `file()` loaders to handle your local Markdown, MDX, Markdoc, and JSON files:

  ```ts {3,7}
  // src/content/config.ts
  import { defineCollection, z } from 'astro:content';
  import { glob } from 'astro/loaders';

  const blog = defineCollection({
    // The ID is a slug generated from the path of the file relative to `base`
    loader: glob({ pattern: '**/*.md', base: './src/data/blog' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.coerce.date(),
    }),
  });

  export const collections = { blog };
  ```

  You can then query using the existing content collections functions, and enjoy a simplified `render()` function to display your content:

  ```astro
  ---
  import { getEntry, render } from 'astro:content';

  const post = await getEntry('blog', Astro.params.slug);

  const { Content } = await render(entry);
  ---

  <Content />
  ```

  ### Creating a loader

  You're not restricted to the built-in loaders – we hope you'll try building your own. You can fetch content from anywhere and return an array of entries:

  ```ts
  // src/content/config.ts
  const countries = defineCollection({
    loader: async () => {
      const response = await fetch('https://restcountries.com/v3.1/all');
      const data = await response.json();
      // Must return an array of entries with an id property,
      // or an object with IDs as keys and entries as values
      return data.map((country) => ({
        id: country.cca3,
        ...country,
      }));
    },
    // optionally add a schema to validate the data and make it type-safe for users
    // schema: z.object...
  });

  export const collections = { countries };
  ```

  For more advanced loading logic, you can define an object loader. This allows incremental updates and conditional loading, and gives full access to the data store. It also allows a loader to define its own schema, including generating it dynamically based on the source API. See the [the Content Layer API RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0047-content-layer.md#loaders) for more details.

  ### Sharing your loaders

  Loaders are better when they're shared. You can create a package that exports a loader and publish it to npm, and then anyone can use it on their site. We're excited to see what the community comes up with! To get started, [take a look at some examples](https://github.com/ascorbic/astro-loaders/). Here's how to load content using an RSS/Atom feed loader:

  ```ts
  // src/content/config.ts
  import { defineCollection } from 'astro:content';
  import { feedLoader } from '@ascorbic/feed-loader';

  const podcasts = defineCollection({
    loader: feedLoader({
      url: 'https://feeds.99percentinvisible.org/99percentinvisible',
    }),
  });

  export const collections = { podcasts };
  ```

  ### Learn more

  To find out more about using the Content Layer API, check out [the Content Layer RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0047-content-layer.md) and [share your feedback](https://github.com/withastro/roadmap/pull/982).

### Patch Changes

- [#11716](https://github.com/withastro/astro/pull/11716) [`f4057c1`](https://github.com/withastro/astro/commit/f4057c18c91f969e3e508545fb988aff94c3ff08) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes content types sync in dev

- [#11645](https://github.com/withastro/astro/pull/11645) [`849e4c6`](https://github.com/withastro/astro/commit/849e4c6c23e61f7fa59f583419048b998bef2475) Thanks [@bluwy](https://github.com/bluwy)! - Refactors internally to use `node:util` `parseArgs` instead of `yargs-parser`

- [#11712](https://github.com/withastro/astro/pull/11712) [`791d809`](https://github.com/withastro/astro/commit/791d809cbc22ed30dda1195ca026daa46a54b551) Thanks [@matthewp](https://github.com/matthewp)! - Fix mixed use of base + trailingSlash in Server Islands

- [#11709](https://github.com/withastro/astro/pull/11709) [`3d8ae76`](https://github.com/withastro/astro/commit/3d8ae767fd4952af7332542b58fe98886eb2e99e) Thanks [@matthewp](https://github.com/matthewp)! - Fix adapter causing Netlify to break

## 4.13.4

### Patch Changes

- [#11678](https://github.com/withastro/astro/pull/11678) [`34da907`](https://github.com/withastro/astro/commit/34da907f3b4fb411024e6d28fdb291fa78116950) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where omitting a semicolon and line ending with carriage return - CRLF - in the `prerender` option could throw an error.

- [#11535](https://github.com/withastro/astro/pull/11535) [`932bd2e`](https://github.com/withastro/astro/commit/932bd2eb07f1d7cb2c91e7e7d31fe84c919e302b) Thanks [@matthewp](https://github.com/matthewp)! - Encrypt server island props

  Server island props are now encrypted with a key generated at build-time. This is intended to prevent accidentally leaking secrets caused by exposing secrets through prop-passing. This is not intended to allow a server island to be trusted to skip authentication, or to protect against any other vulnerabilities other than secret leakage.

  See the RFC for an explanation: https://github.com/withastro/roadmap/blob/server-islands/proposals/server-islands.md#props-serialization

- [#11655](https://github.com/withastro/astro/pull/11655) [`dc0a297`](https://github.com/withastro/astro/commit/dc0a297e2a4bea3db8310cc98c51b2f94ede5fde) Thanks [@billy-le](https://github.com/billy-le)! - Fixes Astro Actions `input` validation when using `default` values with a form input.

- [#11689](https://github.com/withastro/astro/pull/11689) [`c7bda4c`](https://github.com/withastro/astro/commit/c7bda4cd672864babc3cebd19a2dd2e1af85c087) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue in the Astro actions, where the size of the generated cookie was exceeding the size permitted by the `Set-Cookie` header.

## 4.13.3

### Patch Changes

- [#11653](https://github.com/withastro/astro/pull/11653) [`32be549`](https://github.com/withastro/astro/commit/32be5494f6d33dbe32208704405162c95a64f0bc) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Updates `astro:env` docs to reflect current developments and usage guidance

- [#11658](https://github.com/withastro/astro/pull/11658) [`13b912a`](https://github.com/withastro/astro/commit/13b912a8702afb96e2d0bc20dcc1b4135ae58147) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes `orThrow()` type when calling an Action without an `input` validator.

- [#11603](https://github.com/withastro/astro/pull/11603) [`f31d466`](https://github.com/withastro/astro/commit/f31d4665c1cbb0918b9e00ba1431fb6f264025f7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Improves user experience when render an Action result from a form POST request:
  - Removes "Confirm post resubmission?" dialog when refreshing a result.
  - Removes the `?_astroAction=NAME` flag when a result is rendered.

  Also improves the DX of directing to a new route on success. Actions will now redirect to the route specified in your `action` string on success, and redirect back to the previous page on error. This follows the routing convention of established backend frameworks like Laravel.

  For example, say you want to redirect to a `/success` route when `actions.signup` succeeds. You can add `/success` to your `action` string like so:

  ```astro
  <form method="POST" action={'/success' + actions.signup}></form>
  ```

  - On success, Astro will redirect to `/success`.
  - On error, Astro will redirect back to the current page.

  You can retrieve the action result from either page using the `Astro.getActionResult()` function.

  ### Note on security

  This uses a temporary cookie to forward the action result to the next page. The cookie will be deleted when that page is rendered.

  ⚠ **The action result is not encrypted.** In general, we recommend returning minimal data from an action handler to a) avoid leaking sensitive information, and b) avoid unexpected render issues once the temporary cookie is deleted. For example, a `login` function may return a user's session id to retrieve from your Astro frontmatter, rather than the entire user object.

## 4.13.2

### Patch Changes

- [#11648](https://github.com/withastro/astro/pull/11648) [`589d351`](https://github.com/withastro/astro/commit/589d35158da1a2136387d0ad76609f5c8535c03a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes unexpected error when refreshing a POST request from a form using Actions.

- [#11600](https://github.com/withastro/astro/pull/11600) [`09ec2ca`](https://github.com/withastro/astro/commit/09ec2cadce01a9a1f9c54ac433f137348907aa56) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Deprecates `getEntryBySlug` and `getDataEntryById` functions exported by `astro:content` in favor of `getEntry`.

- [#11593](https://github.com/withastro/astro/pull/11593) [`81d7150`](https://github.com/withastro/astro/commit/81d7150e02472430eab555dfc4f053738bf99bb6) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds support for `Date()`, `Map()`, and `Set()` from action results. See [devalue](https://github.com/Rich-Harris/devalue) for a complete list of supported values.

  Also fixes serialization exceptions when deploying Actions with edge middleware on Netlify and Vercel.

- [#11617](https://github.com/withastro/astro/pull/11617) [`196092a`](https://github.com/withastro/astro/commit/196092ae69eb1249206846ddfc162049b03f42b4) Thanks [@abubakriz](https://github.com/abubakriz)! - Fix toolbar audit incorrectly flagging images as above the fold.

- [#11634](https://github.com/withastro/astro/pull/11634) [`2716f52`](https://github.com/withastro/astro/commit/2716f52aae7194439ebb2336849ddd9e8226658a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes internal server error when calling an Astro Action without arguments on Vercel.

- [#11628](https://github.com/withastro/astro/pull/11628) [`9aaf58c`](https://github.com/withastro/astro/commit/9aaf58c1339b54f2c1394e718a0f6f609f0b6342) Thanks [@madbook](https://github.com/madbook)! - Ensures consistent CSS chunk hashes across different environments

## 4.13.1

### Patch Changes

- [#11584](https://github.com/withastro/astro/pull/11584) [`a65ffe3`](https://github.com/withastro/astro/commit/a65ffe314b112213421def26c7cc5b7e7b93558c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Removes async local storage dependency from Astro Actions. This allows Actions to run in Cloudflare and Stackblitz without opt-in flags or other configuration.

  This also introduces a new convention for calling actions from server code. Instead of calling actions directly, you must wrap function calls with the new `Astro.callAction()` utility.

  > `callAction()` is meant to _trigger_ an action from server code. `getActionResult()` usage with form submissions remains unchanged.

  ```astro
  ---
  import { actions } from 'astro:actions';

  const result = await Astro.callAction(actions.searchPosts, {
    searchTerm: Astro.url.searchParams.get('search'),
  });
  ---

  {
    result.data &&
      {
        /* render the results */
      }
  }
  ```

  ## Migration

  If you call actions directly from server code, update function calls to use the `Astro.callAction()` wrapper for pages and `context.callAction()` for endpoints:

  ```diff
  ---
  import { actions } from 'astro:actions';

  - const result = await actions.searchPosts({ searchTerm: 'test' });
  + const result = await Astro.callAction(actions.searchPosts, { searchTerm: 'test' });
  ---
  ```

  If you deploy with Cloudflare and added [the `nodejs_compat` or `nodejs_als` flags](https://developers.cloudflare.com/workers/runtime-apis/nodejs) for Actions, we recommend removing these:

  ```diff
  compatibility_flags = [
  - "nodejs_compat",
  - "nodejs_als"
  ]
  ```

  You can also remove `node:async_hooks` from the `vite.ssr.external` option in your `astro.config` file:

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  - vite: {
  -   ssr: {
  -     external: ["node:async_hooks"]
  -   }
  - }
  })
  ```

## 4.13.0

### Minor Changes

- [#11507](https://github.com/withastro/astro/pull/11507) [`a62345f`](https://github.com/withastro/astro/commit/a62345fd182ae4886d586c8406ed8f3e5f942730) Thanks [@ematipico](https://github.com/ematipico)! - Adds color-coding to the console output during the build to highlight slow pages.

  Pages that take more than 500 milliseconds to render will have their build time logged in red. This change can help you discover pages of your site that are not performant and may need attention.

- [#11379](https://github.com/withastro/astro/pull/11379) [`e5e2d3e`](https://github.com/withastro/astro/commit/e5e2d3ed3076f10b4645f011b13888d5fa16e92e) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - The `experimental.contentCollectionJsonSchema` feature introduced behind a flag in [v4.5.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#450) is no longer experimental and is available for general use.

  If you are working with collections of type `data`, Astro will now auto-generate JSON schema files for your editor to get IntelliSense and type-checking. A separate file will be created for each data collection in your project based on your collections defined in `src/content/config.ts` using a library called [`zod-to-json-schema`](https://github.com/StefanTerdell/zod-to-json-schema).

  This feature requires you to manually set your schema's file path as the value for `$schema` in each data entry file of the collection:

  ```json title="src/content/authors/armand.json" ins={2}
  {
    "$schema": "../../../.astro/collections/authors.schema.json",
    "name": "Armand",
    "skills": ["Astro", "Starlight"]
  }
  ```

  Alternatively, you can set this value in your editor settings. For example, to set this value in [VSCode's `json.schemas` setting](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings), provide the path of files to match and the location of your JSON schema:

  ```json
  {
    "json.schemas": [
      {
        "fileMatch": ["/src/content/authors/**"],
        "url": "./.astro/collections/authors.schema.json"
      }
    ]
  }
  ```

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    contentCollectionJsonSchema: true
  -  }
  })
  ```

  If you have been waiting for stabilization before using JSON Schema generation for content collections, you can now do so.

  Please see [the content collections guide](https://docs.astro.build/en/guides/content-collections/#enabling-json-schema-generation) for more about this feature.

- [#11542](https://github.com/withastro/astro/pull/11542) [`45ad326`](https://github.com/withastro/astro/commit/45ad326932971b44630a32d9092c9505f24f42f8) Thanks [@ematipico](https://github.com/ematipico)! - The `experimental.rewriting` feature introduced behind a flag in [v4.8.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#480) is no longer experimental and is available for general use.

  `Astro.rewrite()` and `context.rewrite()` allow you to render a different page without changing the URL in the browser. Unlike using a redirect, your visitor is kept on the original page they visited.

  Rewrites can be useful for showing the same content at multiple paths (e.g. /products/shoes/men/ and /products/men/shoes/) without needing to maintain two identical source files.

  Rewrites are supported in Astro pages, endpoints, and middleware.

  Return `Astro.rewrite()` in the frontmatter of a `.astro` page component to display a different page's content, such as fallback localized content:

  ```astro
  ---
  // src/pages/es-cu/articles/introduction.astro
  return Astro.rewrite('/es/articles/introduction');
  ---
  ```

  Use `context.rewrite()` in endpoints, for example to reroute to a different page:

  ```js
  // src/pages/api.js
  export function GET(context) {
    if (!context.locals.allowed) {
      return context.rewrite('/');
    }
  }
  ```

  The middleware `next()` function now accepts a parameter with the same type as the `rewrite()` function. For example, with `next("/")`, you can call the next middleware function with a new `Request`.

  ```js
  // src/middleware.js
  export function onRequest(context, next) {
    if (!context.cookies.get('allowed')) {
      return next('/'); // new signature
    }
    return next();
  }
  ```

  If you were previously using this feature, please remove the experimental flag from your Astro config:

  ```diff
  // astro.config.mjs
  export default defineConfig({
  -  experimental: {
  -    rewriting: true
  -  }
  })
  ```

  If you have been waiting for stabilization before using rewrites in Astro, you can now do so.

  Please see [the routing guide in docs](https://docs.astro.build/en/guides/routing/#rewrites) for more about using this feature.

## 4.12.3

### Patch Changes

- [#11509](https://github.com/withastro/astro/pull/11509) [`dfbca06`](https://github.com/withastro/astro/commit/dfbca06dda674c64c7010db2f4de951496a1e631) Thanks [@bluwy](https://github.com/bluwy)! - Excludes hoisted scripts and styles from Astro components imported with `?url` or `?raw`

- [#11561](https://github.com/withastro/astro/pull/11561) [`904f1e5`](https://github.com/withastro/astro/commit/904f1e535aeb7a14ba7ce07c3130e25f3e708266) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Uses the correct pageSize default in `page.size` JSDoc comment

- [#11571](https://github.com/withastro/astro/pull/11571) [`1c3265a`](https://github.com/withastro/astro/commit/1c3265a8c9c0b1b1bd597f756b63463146bacc3a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - **BREAKING CHANGE to the experimental Actions API only.** Install the latest `@astrojs/react` integration as well if you're using React 19 features.

  Make `.safe()` the default return value for actions. This means `{ data, error }` will be returned when calling an action directly. If you prefer to get the data while allowing errors to throw, chain the `.orThrow()` modifier.

  ```ts
  import { actions } from 'astro:actions';

  // Before
  const { data, error } = await actions.like.safe();
  // After
  const { data, error } = await actions.like();

  // Before
  const newLikes = await actions.like();
  // After
  const newLikes = await actions.like.orThrow();
  ```

  ## Migration

  To migrate your existing action calls:
  - Remove `.safe` from existing _safe_ action calls
  - Add `.orThrow` to existing _unsafe_ action calls

- [#11546](https://github.com/withastro/astro/pull/11546) [`7f26de9`](https://github.com/withastro/astro/commit/7f26de906e87f1e8973a1f84399f23e36e506bb3) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Remove "SSR Only" mention in `Astro.redirect` inline documentation and update reference link.

- [#11525](https://github.com/withastro/astro/pull/11525) [`8068131`](https://github.com/withastro/astro/commit/80681318c6cb0f612fcb5188933fdd20a8f474a3) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where the build was failing when `experimental.actions` was enabled, an adapter was in use, and there were not actions inside the user code base.

- [#11574](https://github.com/withastro/astro/pull/11574) [`e3f29d4`](https://github.com/withastro/astro/commit/e3f29d416a2e0a0b5328ae1075b12575260dddfd) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes line with the error not being properly highlighted in the error overlay

- [#11570](https://github.com/withastro/astro/pull/11570) [`84189b6`](https://github.com/withastro/astro/commit/84189b6511dc2a14bcfe608696f56a64c2046f39) Thanks [@bholmesdev](https://github.com/bholmesdev)! - **BREAKING CHANGE to the experimental Actions API only.** Install the latest `@astrojs/react` integration as well if you're using React 19 features.

  Updates the Astro Actions fallback to support `action={actions.name}` instead of using `getActionProps().` This will submit a form to the server in zero-JS scenarios using a search parameter:

  ```astro
  ---
  import { actions } from 'astro:actions';
  ---

  <form action={actions.logOut}>
    <!--output: action="?_astroAction=logOut"-->
    <button>Log Out</button>
  </form>
  ```

  You may also construct form action URLs using string concatenation, or by using the `URL()` constructor, with the an action's `.queryString` property:

  ```astro
  ---
  import { actions } from 'astro:actions';

  const confirmationUrl = new URL('/confirmation', Astro.url);
  confirmationUrl.search = actions.queryString;
  ---

  <form method="POST" action={confirmationUrl.pathname}>
    <button>Submit</button>
  </form>
  ```

  ## Migration

  `getActionProps()` is now deprecated. To use the new fallback pattern, remove the `getActionProps()` input from your form and pass your action function to the form `action` attribute:

  ```diff
  ---
  import {
    actions,
  - getActionProps,
  } from 'astro:actions';
  ---

  + <form method="POST" action={actions.logOut}>
  - <form method="POST">
  - <input {...getActionProps(actions.logOut)} />
    <button>Log Out</button>
  </form>
  ```

- [#11559](https://github.com/withastro/astro/pull/11559) [`1953dbb`](https://github.com/withastro/astro/commit/1953dbbd41d2d7803837601a9e192654f02275ef) Thanks [@bryanwood](https://github.com/bryanwood)! - Allows actions to return falsy values without an error

- [#11553](https://github.com/withastro/astro/pull/11553) [`02c85b5`](https://github.com/withastro/astro/commit/02c85b541241a07db45bf9e15717e111104898e5) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue in content collection caching, where two documents with the same contents were generating an error during the build.

- [#11548](https://github.com/withastro/astro/pull/11548) [`602c5bf`](https://github.com/withastro/astro/commit/602c5bf05de4fe5ec1ea97f8e10455485aceb05f) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fixes `astro add` for packages with only prerelease versions

- [#11566](https://github.com/withastro/astro/pull/11566) [`0dcef3a`](https://github.com/withastro/astro/commit/0dcef3ab171bd7f81c2f99e9366db3724aa7091b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes DomException errors not being handled properly

- [#11529](https://github.com/withastro/astro/pull/11529) [`504c383`](https://github.com/withastro/astro/commit/504c383e20dfb5d8eb0825a70935f221b43577b2) Thanks [@matthewp](https://github.com/matthewp)! - Fix server islands with trailingSlash: always

## 4.12.2

### Patch Changes

- [#11505](https://github.com/withastro/astro/pull/11505) [`8ff7658`](https://github.com/withastro/astro/commit/8ff7658001c2c7bedf6adcddf7a9341196f2d376) Thanks [@ematipico](https://github.com/ematipico)! - Enhances the dev server logging when rewrites occur during the lifecycle or rendering.

  The dev server will log the status code **before** and **after** a rewrite:

  ```shell
  08:16:48 [404] (rewrite) /foo/about 200ms
  08:22:13 [200] (rewrite) /about 23ms
  ```

- [#11506](https://github.com/withastro/astro/pull/11506) [`026e8ba`](https://github.com/withastro/astro/commit/026e8baf3323e99f96530999fd32a0a9b305854d) Thanks [@sarah11918](https://github.com/sarah11918)! - Fixes typo in documenting the `slot="fallback"` attribute for Server Islands experimental feature.

- [#11508](https://github.com/withastro/astro/pull/11508) [`ca335e1`](https://github.com/withastro/astro/commit/ca335e1dc09bc83d3f8f5b9dd54f116bcb4881e4) Thanks [@cramforce](https://github.com/cramforce)! - Escapes HTML in serialized props

- [#11501](https://github.com/withastro/astro/pull/11501) [`4db78ae`](https://github.com/withastro/astro/commit/4db78ae046a39628dfe8d68e776706559d4f8ba7) Thanks [@martrapp](https://github.com/martrapp)! - Adds the missing export for accessing the `getFallback()` function of the client site router.

## 4.12.1

### Patch Changes

- [#11486](https://github.com/withastro/astro/pull/11486) [`9c0c849`](https://github.com/withastro/astro/commit/9c0c8492d987cd9214ed53e71fb29599c206966a) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new function called `addClientRenderer` to the Container API.

  This function should be used when rendering components using the `client:*` directives. The `addClientRenderer` API must be used
  _after_ the use of the `addServerRenderer`:

  ```js
  const container = await experimental_AstroContainer.create();
  container.addServerRenderer({ renderer });
  container.addClientRenderer({ name: '@astrojs/react', entrypoint: '@astrojs/react/client.js' });
  const response = await container.renderToResponse(Component);
  ```

- [#11500](https://github.com/withastro/astro/pull/11500) [`4e142d3`](https://github.com/withastro/astro/commit/4e142d38cbaf0938be7077c88e32b38a6b60eaed) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes inferRemoteSize type not working

- [#11496](https://github.com/withastro/astro/pull/11496) [`53ccd20`](https://github.com/withastro/astro/commit/53ccd206f9bfe5f6a0d888d199776b4043f63f58) Thanks [@alfawal](https://github.com/alfawal)! - Hide the dev toolbar on `window.print()` (CTRL + P)

## 4.12.0

### Minor Changes

- [#11341](https://github.com/withastro/astro/pull/11341) [`49b5145`](https://github.com/withastro/astro/commit/49b5145158a603b9bb951bf914a6a9780c218704) Thanks [@madcampos](https://github.com/madcampos)! - Adds support for [Shiki's `defaultColor` option](https://shiki.style/guide/dual-themes#without-default-color).

  This option allows you to override the values of a theme's inline style, adding only CSS variables to give you more flexibility in applying multiple color themes.

  Configure `defaultColor: false` in your Shiki config to apply throughout your site, or pass to Astro's built-in `<Code>` component to style an individual code block.

  ```js title="astro.config.mjs"
  import { defineConfig } from 'astro/config';
  export default defineConfig({
    markdown: {
      shikiConfig: {
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        defaultColor: false,
      },
    },
  });
  ```

  ```astro
  ---
  import { Code } from 'astro:components';
  ---

  <Code code={`const useMyColors = true`} lang="js" defaultColor={false} />
  ```

- [#11304](https://github.com/withastro/astro/pull/11304) [`2e70741`](https://github.com/withastro/astro/commit/2e70741362afc1e7d03c8b2a9d8edb8466dfe9c3) Thanks [@Fryuni](https://github.com/Fryuni)! - Refactors the type for integration hooks so that integration authors writing custom integration hooks can now allow runtime interactions between their integration and other integrations.

  This internal change should not break existing code for integration authors.

  To declare your own hooks for your integration, extend the `Astro.IntegrationHooks` interface:

  ```ts
  // your-integration/types.ts
  declare global {
    namespace Astro {
      interface IntegrationHooks {
        'myLib:eventHappened': (your: string, parameters: number) => Promise<void>;
      }
    }
  }
  ```

  Call your hooks on all other integrations installed in a project at the appropriate time. For example, you can call your hook on initialization before either the Vite or Astro config have resolved:

  ```ts
  // your-integration/index.ts
  import './types.ts';

  export default (): AstroIntegration => {
    return {
      name: 'your-integration',
      hooks: {
        'astro:config:setup': async ({ config }) => {
          for (const integration of config.integrations) {
            await integration.hooks['myLib:eventHappened'].?('your values', 123);
          }
        },
      }
    }
  }
  ```

  Other integrations can also now declare your hooks:

  ```ts
  // other-integration/index.ts
  import 'your-integration/types.ts';

  export default (): AstroIntegration => {
    return {
      name: 'other-integration',
      hooks: {
        'myLib:eventHappened': async (your, values) => {
          // ...
        },
      },
    };
  };
  ```

- [#11305](https://github.com/withastro/astro/pull/11305) [`d495df5`](https://github.com/withastro/astro/commit/d495df5361e16ebdf83dea6e2de004f438e698c4) Thanks [@matthewp](https://github.com/matthewp)! - Experimental Server Islands

  Server Islands allow you to specify components that should run on the server, allowing the rest of the page to be more aggressively cached, or even generated statically. Turn any `.astro` component into a server island by adding the `server:defer` directive and optionally, fallback placeholder content:

  ```astro
  ---
  import Avatar from '../components/Avatar.astro';
  import GenericUser from '../components/GenericUser.astro';
  ---

  <header>
    <h1>Page Title</h1>
    <div class="header-right">
      <Avatar server:defer>
        <GenericUser slot="fallback" />
      </Avatar>
    </div>
  </header>
  ```

  The `server:defer` directive can be used on any Astro component in a project using `hybrid` or `server` mode with an adapter. There are no special APIs needed inside of the island.

  Enable server islands by adding the experimental flag to your Astro config with an appropriate `output` mode and adapter:

  ```js
  import { defineConfig } from 'astro/config';
  import netlify from '@astrojs/netlify';

  export default defineConfig({
    output: 'hybrid',
    adapter: netlify(),
    experimental: {
      serverIslands: true,
    },
  });
  ```

  For more information, see the [server islands documentation](https://docs.astro.build/en/reference/configuration-reference/#experimentalserverislands).

- [#11482](https://github.com/withastro/astro/pull/11482) [`7c9ed71`](https://github.com/withastro/astro/commit/7c9ed71bf1e13a0c825ba67946b6307d06f77233) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a `--noSync` parameter to the `astro check` command to skip the type-gen step. This can be useful when running `astro check` inside packages that have Astro components, but are not Astro projects

- [#11098](https://github.com/withastro/astro/pull/11098) [`36e30a3`](https://github.com/withastro/astro/commit/36e30a33092c32c2de1deac316f49660247902b0) Thanks [@itsmatteomanf](https://github.com/itsmatteomanf)! - Adds a new `inferRemoteSize()` function that can be used to infer the dimensions of a remote image.

  Previously, the ability to infer these values was only available by adding the [`inferSize`] attribute to the `<Image>` and `<Picture>` components or `getImage()`. Now, you can also access this data outside of these components.

  This is useful for when you need to know the dimensions of an image for styling purposes or to calculate different densities for responsive images.

  ```astro
  ---
  import { inferRemoteSize, Image } from 'astro:assets';

  const imageUrl = 'https://...';
  const { width, height } = await inferRemoteSize(imageUrl);
  ---

  <Image src={imageUrl} width={width / 2} height={height} densities={[1.5, 2]} />
  ```

- [#11391](https://github.com/withastro/astro/pull/11391) [`6f9b527`](https://github.com/withastro/astro/commit/6f9b52710567f3bec7939a98eb8c76f5ea0b2f91) Thanks [@ARipeAppleByYoursTruly](https://github.com/ARipeAppleByYoursTruly)! - Adds Shiki's [`defaultColor`](https://shiki.style/guide/dual-themes#without-default-color) option to the `<Code />` component, giving you more control in applying multiple themes

- [#11176](https://github.com/withastro/astro/pull/11176) [`a751458`](https://github.com/withastro/astro/commit/a75145871b7bb9277584066e1f625df2aaabebce) Thanks [@tsawada](https://github.com/tsawada)! - Adds two new values to the [pagination `page` prop](https://docs.astro.build/en/reference/api-reference/#the-pagination-page-prop): `page.first` and `page.last` for accessing the URLs of the first and last pages.

### Patch Changes

- [#11477](https://github.com/withastro/astro/pull/11477) [`7e9c4a1`](https://github.com/withastro/astro/commit/7e9c4a134c6ea7c8b92ea00038c0845b58c02bc5) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the development server was emitting a 404 status code when the user uses a rewrite that emits a 200 status code.

- [#11479](https://github.com/withastro/astro/pull/11479) [`ca969d5`](https://github.com/withastro/astro/commit/ca969d538a6a8d64573f426b8a87ebd7e434bd71) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where invalid `astro:env` variables at runtime would not throw correctly

- [#11489](https://github.com/withastro/astro/pull/11489) [`061f1f4`](https://github.com/withastro/astro/commit/061f1f4d0cb306efd0c768645439111aec765c76) Thanks [@ematipico](https://github.com/ematipico)! - Move root inside the manifest and make serialisable

- [#11415](https://github.com/withastro/astro/pull/11415) [`e9334d0`](https://github.com/withastro/astro/commit/e9334d05ca88ed6df1becc1512c673e20414bf47) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Refactors how `sync` works and when it's called. Fixes an issue with `astro:env` types in dev not being generated

- [#11478](https://github.com/withastro/astro/pull/11478) [`3161b67`](https://github.com/withastro/astro/commit/3161b6789c57a3bb740ed117205dc55997eb74ea) Thanks [@bluwy](https://github.com/bluwy)! - Supports importing Astro components with Vite queries, like `?url`, `?raw`, and `?direct`

- [#11491](https://github.com/withastro/astro/pull/11491) [`fe3afeb`](https://github.com/withastro/astro/commit/fe3afebd652289ec1b65eed983e804dbb37ed092) Thanks [@matthewp](https://github.com/matthewp)! - Fix for Server Islands in Vercel adapter

  Vercel, and probably other adapters only allow pre-defined routes. This makes it so that the `astro:build:done` hook includes the `_server-islands/` route as part of the route data, which is used to configure available routes.

- [#11483](https://github.com/withastro/astro/pull/11483) [`34f9c25`](https://github.com/withastro/astro/commit/34f9c25740f8eaae0d5e2a2b685b83556d23e63e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes Astro not working on low versions of Node 18 and 20

- Updated dependencies [[`49b5145`](https://github.com/withastro/astro/commit/49b5145158a603b9bb951bf914a6a9780c218704)]:
  - @astrojs/markdown-remark@5.2.0

## 4.11.6

### Patch Changes

- [#11459](https://github.com/withastro/astro/pull/11459) [`bc2e74d`](https://github.com/withastro/astro/commit/bc2e74de384776caa252fd47dbeda895c0488c11) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes false positive audit warnings on elements with the role "tabpanel".

- [#11472](https://github.com/withastro/astro/pull/11472) [`cb4e6d0`](https://github.com/withastro/astro/commit/cb4e6d09deb7507058115a3fd2a567019a501e4d) Thanks [@delucis](https://github.com/delucis)! - Avoids targeting all files in the `src/` directory for eager optimization by Vite. After this change, only JSX, Vue, Svelte, and Astro components get scanned for early optimization.

- [#11387](https://github.com/withastro/astro/pull/11387) [`b498461`](https://github.com/withastro/astro/commit/b498461e277bffb0abe21b59a94b1e56a8c69d47) Thanks [@bluwy](https://github.com/bluwy)! - Fixes prerendering not removing unused dynamic imported chunks

- [#11437](https://github.com/withastro/astro/pull/11437) [`6ccb30e`](https://github.com/withastro/astro/commit/6ccb30e610eed34c2cc2c275485a8ac45c9b6b9e) Thanks [@NuroDev](https://github.com/NuroDev)! - Fixes a case where Astro's config `experimental.env.schema` keys did not allow numbers. Numbers are still not allowed as the first character to be able to generate valid JavaScript identifiers

- [#11439](https://github.com/withastro/astro/pull/11439) [`08baf56`](https://github.com/withastro/astro/commit/08baf56f328ce4b6814a7f90089c0b3398d8bbfe) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Expands the `isInputError()` utility from `astro:actions` to accept errors of any type. This should now allow type narrowing from a try / catch block.

  ```ts
  // example.ts
  import { actions, isInputError } from 'astro:actions';

  try {
    await actions.like(new FormData());
  } catch (error) {
    if (isInputError(error)) {
      console.log(error.fields);
    }
  }
  ```

- [#11452](https://github.com/withastro/astro/pull/11452) [`0e66849`](https://github.com/withastro/astro/commit/0e6684983b9b24660a8fef83fe401ec1d567378a) Thanks [@FugiTech](https://github.com/FugiTech)! - Fixes an issue where using .nullish() in a formdata Astro action would always parse as a string

- [#11438](https://github.com/withastro/astro/pull/11438) [`619f07d`](https://github.com/withastro/astro/commit/619f07db701ebab2d2f2598dd2dcf93ba1e5719c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Exposes utility types from `astro:actions` for the `defineAction` handler (`ActionHandler`) and the `ActionError` code (`ActionErrorCode`).

- [#11456](https://github.com/withastro/astro/pull/11456) [`17e048d`](https://github.com/withastro/astro/commit/17e048de0e79d76b933d128676be2388954b419e) Thanks [@RickyC0626](https://github.com/RickyC0626)! - Fixes `astro dev --open` unexpected behavior that spawns a new tab every time a config file is saved

- [#11337](https://github.com/withastro/astro/pull/11337) [`0a4b31f`](https://github.com/withastro/astro/commit/0a4b31ffeb41ad1dfb3141384e22787763fcae3d) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds a new property `experimental.env.validateSecrets` to allow validating private variables on the server.

  By default, this is set to `false` and only public variables are checked on start. If enabled, secrets will also be checked on start (dev/build modes). This is useful for example in some CIs to make sure all your secrets are correctly set before deploying.

  ```js
  // astro.config.mjs
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    experimental: {
      env: {
        schema: {
          // ...
        },
        validateSecrets: true,
      },
    },
  });
  ```

- [#11443](https://github.com/withastro/astro/pull/11443) [`ea4bc04`](https://github.com/withastro/astro/commit/ea4bc04e9489c456e2b4b5dbd67d5e4cf3f89f97) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Expose new `ActionReturnType` utility from `astro:actions`. This infers the return type of an action by passing `typeof actions.name` as a type argument. This example defines a `like` action that returns `likes` as an object:

  ```ts
  // actions/index.ts
  import { defineAction } from 'astro:actions';

  export const server = {
    like: defineAction({
      handler: () => {
        /* ... */
        return { likes: 42 };
      },
    }),
  };
  ```

  In your client code, you can infer this handler return value with `ActionReturnType`:

  ```ts
  // client.ts
  import { actions, ActionReturnType } from 'astro:actions';

  type LikesResult = ActionReturnType<typeof actions.like>;
  // -> { likes: number }
  ```

- [#11436](https://github.com/withastro/astro/pull/11436) [`7dca68f`](https://github.com/withastro/astro/commit/7dca68ff2e0f089a3fd090650ee05b1942792fed) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes `astro:actions` autocompletion for the `defineAction` `accept` property

- [#11455](https://github.com/withastro/astro/pull/11455) [`645e128`](https://github.com/withastro/astro/commit/645e128537f1f20da6703afc115d06371d7da5dd) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves `astro:env` invalid variables errors

## 4.11.5

### Patch Changes

- [#11408](https://github.com/withastro/astro/pull/11408) [`b9e906f`](https://github.com/withastro/astro/commit/b9e906f8e75444739aa259b62489d9f5749260b9) Thanks [@matthewp](https://github.com/matthewp)! - Revert change to how boolean attributes work

## 4.11.4

### Patch Changes

- [#11362](https://github.com/withastro/astro/pull/11362) [`93993b7`](https://github.com/withastro/astro/commit/93993b77cf4915b4c0d245df9ecbf2265f5893e7) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where creating manually the i18n middleware could break the logic of the functions of the virtual module `astro:i18n`

- [#11349](https://github.com/withastro/astro/pull/11349) [`98d9ce4`](https://github.com/withastro/astro/commit/98d9ce41f20c8bf024c937e8bde80d3c3dbbed99) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where Astro didn't throw an error when `Astro.rewrite` was used without providing the experimental flag

- [#11352](https://github.com/withastro/astro/pull/11352) [`a55ee02`](https://github.com/withastro/astro/commit/a55ee0268e1ca22597e9b5e6d1f24b4f28ad978b) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the rewrites didn't update the status code when using manual i18n routing.

- [#11388](https://github.com/withastro/astro/pull/11388) [`3a223b4`](https://github.com/withastro/astro/commit/3a223b4811708cc93ebb27706118c1723e1fc013) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Adjusts the color of punctuations in error overlay.

- [#11369](https://github.com/withastro/astro/pull/11369) [`e6de11f`](https://github.com/withastro/astro/commit/e6de11f4a941e29123da3714e5b8f17d25744f0f) Thanks [@bluwy](https://github.com/bluwy)! - Fixes attribute rendering for non-boolean attributes with boolean values

## 4.11.3

### Patch Changes

- [#11347](https://github.com/withastro/astro/pull/11347) [`33bdc54`](https://github.com/withastro/astro/commit/33bdc5472929f72fa8e39624598bf929c48e60c0) Thanks [@bluwy](https://github.com/bluwy)! - Fixes installed packages detection when running `astro check`

- [#11327](https://github.com/withastro/astro/pull/11327) [`0df8142`](https://github.com/withastro/astro/commit/0df81422a81c8f8900684d100e9b8f26365fa0b1) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue with the container APIs where a runtime error was thrown during the build, when using `pnpm` as package manager.

## 4.11.2

### Patch Changes

- [#11335](https://github.com/withastro/astro/pull/11335) [`4c4741b`](https://github.com/withastro/astro/commit/4c4741b42dc531403f7b9647bd51951d0cdb8f5b) Thanks [@ematipico](https://github.com/ematipico)! - Reverts [#11292](https://github.com/withastro/astro/pull/11292), which caused a regression to the input type

- [#11326](https://github.com/withastro/astro/pull/11326) [`41121fb`](https://github.com/withastro/astro/commit/41121fbe00e144d4d93835811e1c4349664d9003) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where running `astro sync` when using the experimental `astro:env` feature would fail if environment variables were missing

- [#11338](https://github.com/withastro/astro/pull/11338) [`9752a0b`](https://github.com/withastro/astro/commit/9752a0b27526270fd0066f3db7049e9ae6af1ef8) Thanks [@zaaakher](https://github.com/zaaakher)! - Fixes svg icon margin in devtool tooltip title to look coherent in `rtl` and `ltr` layouts

- [#11331](https://github.com/withastro/astro/pull/11331) [`f1b78a4`](https://github.com/withastro/astro/commit/f1b78a496034d53b0e9dfc276a4a1b1d691772c4) Thanks [@bluwy](https://github.com/bluwy)! - Removes `resolve` package and simplify internal resolve check

- [#11339](https://github.com/withastro/astro/pull/11339) [`8fdbf0e`](https://github.com/withastro/astro/commit/8fdbf0e45beffdae3da1e7f36797575c92f8a0ba) Thanks [@matthewp](https://github.com/matthewp)! - Remove non-fatal errors from telemetry

  Previously we tracked non-fatal errors in telemetry to get a good idea of the types of errors that occur in `astro dev`. However this has become noisy over time and results in a lot of data that isn't particularly useful. This removes those non-fatal errors from being tracked.

## 4.11.1

### Patch Changes

- [#11308](https://github.com/withastro/astro/pull/11308) [`44c61dd`](https://github.com/withastro/astro/commit/44c61ddfd85f1c23f8cec8caeaa5e25897121996) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where custom `404.astro` and `500.astro` were not returning the correct status code when rendered inside a rewriting cycle.

- [#11302](https://github.com/withastro/astro/pull/11302) [`0622567`](https://github.com/withastro/astro/commit/06225673269201044358788f2a81dbe13912adce) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue with the view transition router when redirecting to an URL with different origin.

- Updated dependencies [[`b6afe6a`](https://github.com/withastro/astro/commit/b6afe6a782f68f4a279463a144baaf99cb96b6dc), [`41064ce`](https://github.com/withastro/astro/commit/41064cee78c1cccd428f710a24c483aeb275fd95)]:
  - @astrojs/markdown-remark@5.1.1
  - @astrojs/internal-helpers@0.4.1

## 4.11.0

### Minor Changes

- [#11197](https://github.com/withastro/astro/pull/11197) [`4b46bd9`](https://github.com/withastro/astro/commit/4b46bd9bdcbb302f294aa27b8aa07099e104fa17) Thanks [@braebo](https://github.com/braebo)! - Adds [`ShikiTransformer`](https://shiki.style/packages/transformers#shikijs-transformers) support to the [`<Code />`](https://docs.astro.build/en/reference/api-reference/#code-) component with a new `transformers` prop.

  Note that `transformers` only applies classes and you must provide your own CSS rules to target the elements of your code block.

  ```astro
  ---
  import { transformerNotationFocus } from '@shikijs/transformers';
  import { Code } from 'astro:components';

  const code = `const foo = 'hello'
  const bar = ' world'
  console.log(foo + bar) // [!code focus]
  `;
  ---

  <Code {code} lang="js" transformers={[transformerNotationFocus()]} />

  <style is:global>
    pre.has-focused .line:not(.focused) {
      filter: blur(1px);
    }
  </style>
  ```

- [#11134](https://github.com/withastro/astro/pull/11134) [`9042be0`](https://github.com/withastro/astro/commit/9042be049157ce859355f911565bc0c3d68f0aa1) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the developer experience of the `500.astro` file by passing it a new `error` prop.

  When an error is thrown, the special `src/pages/500.astro` page now automatically receives the error as a prop. This allows you to display more specific information about the error on a custom 500 page.

  ```astro
  ---
  // src/pages/500.astro
  interface Props {
    error: unknown;
  }

  const { error } = Astro.props;
  ---

  <div>{error instanceof Error ? error.message : 'Unknown error'}</div>
  ```

  If an error occurs rendering this page, your host's default 500 error page will be shown to your visitor in production, and Astro's default error overlay will be shown in development.

### Patch Changes

- [#11280](https://github.com/withastro/astro/pull/11280) [`fd3645f`](https://github.com/withastro/astro/commit/fd3645fe8364ec5e280b6802d1468867890d463c) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a bug that prevented cookies from being set when using experimental rewrites

- [#11275](https://github.com/withastro/astro/pull/11275) [`bab700d`](https://github.com/withastro/astro/commit/bab700d69085b1de8f03fc1b0b31651f709cbfe3) Thanks [@syhily](https://github.com/syhily)! - Drop duplicated brackets in data collections schema generation.

- [#11272](https://github.com/withastro/astro/pull/11272) [`ea987d7`](https://github.com/withastro/astro/commit/ea987d7da589ead9aa4b550f167f5e2f6c939d2e) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where rewriting `/` would cause an issue, when `trailingSlash` was set to `"never"`.

- [#11272](https://github.com/withastro/astro/pull/11272) [`ea987d7`](https://github.com/withastro/astro/commit/ea987d7da589ead9aa4b550f167f5e2f6c939d2e) Thanks [@ematipico](https://github.com/ematipico)! - Reverts a logic where it wasn't possible to rewrite `/404` in static mode. It's **now possible** again

- [#11264](https://github.com/withastro/astro/pull/11264) [`5a9c9a6`](https://github.com/withastro/astro/commit/5a9c9a60e7c32aa461b86b5bc667cb955e23d4d9) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes type generation for empty content collections

- [#11279](https://github.com/withastro/astro/pull/11279) [`9a08d74`](https://github.com/withastro/astro/commit/9a08d74bc00ae2c3bc254f99580a22ce4df1d002) Thanks [@ascorbic](https://github.com/ascorbic)! - Improves type-checking and error handling to catch case where an image import is passed directly to `getImage()`

- [#11292](https://github.com/withastro/astro/pull/11292) [`7f8f347`](https://github.com/withastro/astro/commit/7f8f34799528ed0b2011e1ea273bd0636f6e767d) Thanks [@jdtjenkins](https://github.com/jdtjenkins)! - Fixes a case where `defineAction` autocomplete for the `accept` prop would not show `"form"` as a possible value

- [#11273](https://github.com/withastro/astro/pull/11273) [`cb4d078`](https://github.com/withastro/astro/commit/cb4d07819f0dbdfd94bc4f084edf7720ada01323) Thanks [@ascorbic](https://github.com/ascorbic)! - Corrects an inconsistency in dev where middleware would run for prerendered 404 routes.
  Middleware is not run for prerendered 404 routes in production, so this was incorrect.

- [#11284](https://github.com/withastro/astro/pull/11284) [`f4b029b`](https://github.com/withastro/astro/commit/f4b029b08264268c68fc81ea25b264e81f47e683) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes an issue that would break `Astro.request.url` and `Astro.request.headers` in `astro dev` if HTTP/2 was enabled.

  HTTP/2 is now enabled by default in `astro dev` if `https` is configured in the Vite config.

## 4.10.3

### Patch Changes

- [#11213](https://github.com/withastro/astro/pull/11213) [`94ac7ef`](https://github.com/withastro/astro/commit/94ac7efd70fd264b10887805a02d5d1877af8701) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes the `PUBLIC_` prefix constraint for `astro:env` public variables

- [#11213](https://github.com/withastro/astro/pull/11213) [`94ac7ef`](https://github.com/withastro/astro/commit/94ac7efd70fd264b10887805a02d5d1877af8701) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - **BREAKING CHANGE to the experimental `astro:env` feature only**

  Server secrets specified in the schema must now be imported from `astro:env/server`. Using `getSecret()` is no longer required to use these environment variables in your schema:

  ```diff
  - import { getSecret } from 'astro:env/server'
  - const API_SECRET = getSecret("API_SECRET")
  + import { API_SECRET } from 'astro:env/server'
  ```

  Note that using `getSecret()` with these keys is still possible, but no longer involves any special handling and the raw value will be returned, just like retrieving secrets not specified in your schema.

- [#11234](https://github.com/withastro/astro/pull/11234) [`4385bf7`](https://github.com/withastro/astro/commit/4385bf7a4dc9c65bff53a30c660f7a909fcabfc9) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new function called `addServerRenderer` to the Container API. Use this function to manually store renderers inside the instance of your container.

  This new function should be preferred when using the Container API in environments like on-demand pages:

  ```ts
  import type { APIRoute } from 'astro';
  import { experimental_AstroContainer } from 'astro/container';
  import reactRenderer from '@astrojs/react/server.js';
  import vueRenderer from '@astrojs/vue/server.js';
  import ReactComponent from '../components/button.jsx';
  import VueComponent from '../components/button.vue';

  // MDX runtime is contained inside the Astro core
  import mdxRenderer from 'astro/jsx/server.js';

  // In case you need to import a custom renderer
  import customRenderer from '../renderers/customRenderer.js';

  export const GET: APIRoute = async (ctx) => {
    const container = await experimental_AstroContainer.create();
    container.addServerRenderer({ renderer: reactRenderer });
    container.addServerRenderer({ renderer: vueRenderer });
    container.addServerRenderer({ renderer: customRenderer });
    // You can pass a custom name too
    container.addServerRenderer({
      name: 'customRenderer',
      renderer: customRenderer,
    });
    const vueComponent = await container.renderToString(VueComponent);
    return await container.renderToResponse(Component);
  };
  ```

- [#11249](https://github.com/withastro/astro/pull/11249) [`de60c69`](https://github.com/withastro/astro/commit/de60c69aa06c41f76a5510cc1d0bee4c8a5326a5) Thanks [@markgaze](https://github.com/markgaze)! - Fixes a performance issue with JSON schema generation

- [#11242](https://github.com/withastro/astro/pull/11242) [`e4fc2a0`](https://github.com/withastro/astro/commit/e4fc2a0bafb4723566552d0c5954b25447890f51) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where the virtual module `astro:container` wasn't resolved

- [#11236](https://github.com/withastro/astro/pull/11236) [`39bc3a5`](https://github.com/withastro/astro/commit/39bc3a5e8161232d6fdc6cc52b1f246083966d8e) Thanks [@ascorbic](https://github.com/ascorbic)! - Fixes a case where symlinked content collection directories were not correctly resolved

- [#11258](https://github.com/withastro/astro/pull/11258) [`d996db6`](https://github.com/withastro/astro/commit/d996db6f0bf361ebd84b23d022db7bb10fb316e6) Thanks [@ascorbic](https://github.com/ascorbic)! - Adds a new error `RewriteWithBodyUsed` that throws when `Astro.rewrite` is used after the request body has already been read.

- [#11243](https://github.com/withastro/astro/pull/11243) [`ba2b14c`](https://github.com/withastro/astro/commit/ba2b14cc28bd219c241313cdf142b736e7442014) Thanks [@V3RON](https://github.com/V3RON)! - Fixes a prerendering issue for libraries in `node_modules` when a folder with an underscore is in the path.

- [#11244](https://github.com/withastro/astro/pull/11244) [`d07d2f7`](https://github.com/withastro/astro/commit/d07d2f7ac9d87af907beaca700ba4116dc1d6f37) Thanks [@ematipico](https://github.com/ematipico)! - Improves the developer experience of the custom `500.astro` page in development mode.

  Before, in development, an error thrown during the rendering phase would display the default error overlay, even when users had the `500.astro` page.

  Now, the development server will display the `500.astro` and the original error is logged in the console.

- [#11240](https://github.com/withastro/astro/pull/11240) [`2851b0a`](https://github.com/withastro/astro/commit/2851b0aa2e2abe80ea603b53c67770e94980a8d3) Thanks [@ascorbic](https://github.com/ascorbic)! - Ignores query strings in module identifiers when matching ".astro" file extensions in Vite plugin

- [#11245](https://github.com/withastro/astro/pull/11245) [`e22be22`](https://github.com/withastro/astro/commit/e22be22e5729e60220726e92b52d2833c937fd1c) Thanks [@bluwy](https://github.com/bluwy)! - Refactors prerendering chunk handling to correctly remove unused code during the SSR runtime

## 4.10.2

### Patch Changes

- [#11231](https://github.com/withastro/astro/pull/11231) [`58d7dbb`](https://github.com/withastro/astro/commit/58d7dbb5e0cabea1ac7a35af5b46685fce50d723) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression for `getViteConfig`, where the inline config wasn't merged in the final config.

- [#11228](https://github.com/withastro/astro/pull/11228) [`1e293a1`](https://github.com/withastro/astro/commit/1e293a1b819024f16bfe482f272df0678cdd7874) Thanks [@ascorbic](https://github.com/ascorbic)! - Updates `getCollection()` to always return a cloned array

- [#11207](https://github.com/withastro/astro/pull/11207) [`7d9aac3`](https://github.com/withastro/astro/commit/7d9aac376c4b8844917901f7f566f7259d7f66c8) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue in the rewriting logic where old data was not purged during the rewrite flow. This caused some false positives when checking the validity of URL path names during the rendering phase.

- [#11189](https://github.com/withastro/astro/pull/11189) [`75a8fe7`](https://github.com/withastro/astro/commit/75a8fe7e72b95f20c36f034de2b51b6a9550e27e) Thanks [@ematipico](https://github.com/ematipico)! - Improve error message when using `getLocaleByPath` on path that doesn't contain any locales.

- [#11195](https://github.com/withastro/astro/pull/11195) [`0a6ab6f`](https://github.com/withastro/astro/commit/0a6ab6f562651b558ca90761feed5c07f54f2633) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds support for enums to `astro:env`

  You can now call `envField.enum`:

  ```js
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    experimental: {
      env: {
        schema: {
          API_VERSION: envField.enum({
            context: 'server',
            access: 'secret',
            values: ['v1', 'v2'],
          }),
        },
      },
    },
  });
  ```

- [#11210](https://github.com/withastro/astro/pull/11210) [`66fc028`](https://github.com/withastro/astro/commit/66fc0283d3f1d1a4f17d7db65ca3521a01fb5bec) Thanks [@matthewp](https://github.com/matthewp)! - Close the iterator only after rendering is complete

- [#11195](https://github.com/withastro/astro/pull/11195) [`0a6ab6f`](https://github.com/withastro/astro/commit/0a6ab6f562651b558ca90761feed5c07f54f2633) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds additional validation options to `astro:env`

  `astro:env` schema datatypes `string` and `number` now have new optional validation rules:

  ```js
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    experimental: {
      env: {
        schema: {
          FOO: envField.string({
            // ...
            max: 32,
            min: 3,
            length: 12,
            url: true,
            includes: 'foo',
            startsWith: 'bar',
            endsWith: 'baz',
          }),
          BAR: envField.number({
            // ...
            gt: 2,
            min: 3,
            lt: 10,
            max: 9,
            int: true,
          }),
        },
      },
    },
  });
  ```

- [#11211](https://github.com/withastro/astro/pull/11211) [`97724da`](https://github.com/withastro/astro/commit/97724da93ed7b1db19632c0cdb4b3aab1ff84812) Thanks [@matthewp](https://github.com/matthewp)! - Let middleware handle the original request URL

- [#10607](https://github.com/withastro/astro/pull/10607) [`7327c6a`](https://github.com/withastro/astro/commit/7327c6acb197e1f2ea6cf94cfbc5700bc755f982) Thanks [@frankbits](https://github.com/frankbits)! - Fixes an issue where a leading slash created incorrect conflict resolution between pages generated from static routes and catch-all dynamic routes

## 4.10.1

### Patch Changes

- [#11198](https://github.com/withastro/astro/pull/11198) [`8b9a499`](https://github.com/withastro/astro/commit/8b9a499d3733e9d0fc6a0bd067ece19bd36f4726) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where `astro:env` `getSecret` would not retrieve environment variables properly in dev and build modes

- [#11206](https://github.com/withastro/astro/pull/11206) [`734b98f`](https://github.com/withastro/astro/commit/734b98fecf0212cd76be3c935a49f84a9a7dab34) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - **BREAKING CHANGE to the experimental `astro:env` feature only**

  Updates the adapter `astro:env` entrypoint from `astro:env/setup` to `astro/env/setup`

- [#11205](https://github.com/withastro/astro/pull/11205) [`8c45391`](https://github.com/withastro/astro/commit/8c4539145f0b6a735b65852b2f2b1a7e9f5a9c3f) Thanks [@Nin3lee](https://github.com/Nin3lee)! - Fixes a typo in the config reference

## 4.10.0

### Minor Changes

- [#10974](https://github.com/withastro/astro/pull/10974) [`2668ef9`](https://github.com/withastro/astro/commit/2668ef984104574f25f29ef75e2572a0745d1666) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Adds experimental support for the `astro:env` API.

  The `astro:env` API lets you configure a type-safe schema for your environment variables, and indicate whether they should be available on the server or the client. Import and use your defined variables from the appropriate `/client` or `/server` module:

  ```astro
  ---
  import { PUBLIC_APP_ID } from 'astro:env/client';
  import { PUBLIC_API_URL, getSecret } from 'astro:env/server';
  const API_TOKEN = getSecret('API_TOKEN');

  const data = await fetch(`${PUBLIC_API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ appId: PUBLIC_APP_ID }),
  });
  ---
  ```

  To define the data type and properties of your environment variables, declare a schema in your Astro config in `experimental.env.schema`. The `envField` helper allows you define your variable as a string, number, or boolean and pass properties in an object:

  ```js
  // astro.config.mjs
  import { defineConfig, envField } from 'astro/config';

  export default defineConfig({
    experimental: {
      env: {
        schema: {
          PUBLIC_API_URL: envField.string({ context: 'client', access: 'public', optional: true }),
          PUBLIC_PORT: envField.number({ context: 'server', access: 'public', default: 4321 }),
          API_SECRET: envField.string({ context: 'server', access: 'secret' }),
        },
      },
    },
  });
  ```

  There are three kinds of environment variables, determined by the combination of `context` (`client` or `server`) and `access` (`private` or `public`) settings defined in your [`env.schema`](#experimentalenvschema):
  - **Public client variables**: These variables end up in both your final client and server bundles, and can be accessed from both client and server through the `astro:env/client` module:

    ```js
    import { PUBLIC_API_URL } from 'astro:env/client';
    ```

  - **Public server variables**: These variables end up in your final server bundle and can be accessed on the server through the `astro:env/server` module:

    ```js
    import { PUBLIC_PORT } from 'astro:env/server';
    ```

  - **Secret server variables**: These variables are not part of your final bundle and can be accessed on the server through the `getSecret()` helper function available from the `astro:env/server` module:

    ```js
    import { getSecret } from 'astro:env/server';

    const API_SECRET = getSecret('API_SECRET'); // typed
    const SECRET_NOT_IN_SCHEMA = getSecret('SECRET_NOT_IN_SCHEMA'); // string | undefined
    ```

  **Note:** Secret client variables are not supported because there is no safe way to send this data to the client. Therefore, it is not possible to configure both `context: "client"` and `access: "secret"` in your schema.

  To learn more, check out [the documentation](https://docs.astro.build/en/reference/configuration-reference/#experimentalenv).

### Patch Changes

- [#11192](https://github.com/withastro/astro/pull/11192) [`58b10a0`](https://github.com/withastro/astro/commit/58b10a073192030a251cff8ad706ab5b015180c9) Thanks [@liruifengv](https://github.com/liruifengv)! - Improves DX by throwing the original `AstroUserError` when an error is thrown inside a `.mdx` file.

- [#11136](https://github.com/withastro/astro/pull/11136) [`35ef53c`](https://github.com/withastro/astro/commit/35ef53c0897c0d360efc086a71c5f4406721d2fe) Thanks [@ematipico](https://github.com/ematipico)! - Errors that are emitted during a rewrite are now bubbled up and shown to the user. A 404 response is not returned anymore.

- [#11144](https://github.com/withastro/astro/pull/11144) [`803dd80`](https://github.com/withastro/astro/commit/803dd8061df02138b4928442bcb76e77dcf6f5e7) Thanks [@ematipico](https://github.com/ematipico)! - The integration now exposes a function called `getContainerRenderer`, that can be used inside the Container APIs to load the relative renderer.

  ```js
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import ReactWrapper from '../src/components/ReactWrapper.astro';
  import { loadRenderers } from 'astro:container';
  import { getContainerRenderer } from '@astrojs/react';

  test('ReactWrapper with react renderer', async () => {
    const renderers = await loadRenderers([getContainerRenderer()]);
    const container = await AstroContainer.create({
      renderers,
    });
    const result = await container.renderToString(ReactWrapper);

    expect(result).toContain('Counter');
    expect(result).toContain('Count: <!-- -->5');
  });
  ```

- [#11144](https://github.com/withastro/astro/pull/11144) [`803dd80`](https://github.com/withastro/astro/commit/803dd8061df02138b4928442bcb76e77dcf6f5e7) Thanks [@ematipico](https://github.com/ematipico)! - **BREAKING CHANGE to the experimental Container API only**

  Changes the **type** of the `renderers` option of the `AstroContainer::create` function and adds a dedicated function `loadRenderers()` to load the rendering scripts from renderer integration packages (`@astrojs/react`, `@astrojs/preact`, `@astrojs/solid-js`, `@astrojs/svelte`, `@astrojs/vue`, `@astrojs/lit`, and `@astrojs/mdx`).

  You no longer need to know the individual, direct file paths to the client and server rendering scripts for each renderer integration package. Now, there is a dedicated function to load the renderer from each package, which is available from `getContainerRenderer()`:

  ```diff
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import ReactWrapper from '../src/components/ReactWrapper.astro';
  import { loadRenderers } from "astro:container";
  import { getContainerRenderer } from "@astrojs/react";

  test('ReactWrapper with react renderer', async () => {
  + const renderers = await loadRenderers([getContainerRenderer()])
  - const renderers = [
  - {
  -  name: '@astrojs/react',
  -   clientEntrypoint: '@astrojs/react/client.js',
  -   serverEntrypoint: '@astrojs/react/server.js',
  -  },
  - ];
    const container = await AstroContainer.create({
      renderers,
    });
    const result = await container.renderToString(ReactWrapper);

    expect(result).toContain('Counter');
    expect(result).toContain('Count: <!-- -->5');
  });
  ```

  The new `loadRenderers()` helper function is available from `astro:container`, a virtual module that can be used when running the Astro container inside `vite`.

- [#11136](https://github.com/withastro/astro/pull/11136) [`35ef53c`](https://github.com/withastro/astro/commit/35ef53c0897c0d360efc086a71c5f4406721d2fe) Thanks [@ematipico](https://github.com/ematipico)! - It's not possible anymore to use `Astro.rewrite("/404")` inside static pages. This isn't counterproductive because Astro will end-up emitting a page that contains the HTML of 404 error page.

  It's still possible to use `Astro.rewrite("/404")` inside on-demand pages, or pages that opt-out from prerendering.

- [#11191](https://github.com/withastro/astro/pull/11191) [`6e29a17`](https://github.com/withastro/astro/commit/6e29a172f153d15fac07320488fae01dece71748) Thanks [@matthewp](https://github.com/matthewp)! - Fixes a case where `Astro.url` would be incorrect when having `build.format` set to `'preserve'` in the Astro config

- [#11182](https://github.com/withastro/astro/pull/11182) [`40b0b4d`](https://github.com/withastro/astro/commit/40b0b4d1e4ef1aa95d5e9011652444b855ab0b9c) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where `Astro.rewrite` wasn't carrying over the body of a `Request` in on-demand pages.

- [#11194](https://github.com/withastro/astro/pull/11194) [`97fbe93`](https://github.com/withastro/astro/commit/97fbe938a9b07d52d61011da4bd5a8b5ad85a700) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the function `getViteConfig` wasn't returning the correct merged Astro configuration

## 4.9.3

### Patch Changes

- [#11171](https://github.com/withastro/astro/pull/11171) [`ff8004f`](https://github.com/withastro/astro/commit/ff8004f6a7b2aab4c6ac367f13744a341c3c5462) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Guard globalThis.astroAsset usage in proxy code to avoid errors in wonky situations

- [#11178](https://github.com/withastro/astro/pull/11178) [`1734c49`](https://github.com/withastro/astro/commit/1734c49f516ff7d778d6724a0db6d39649921b4b) Thanks [@theoephraim](https://github.com/theoephraim)! - Improves `isPromise` utility to check the presence of `then` on an object before trying to access it - which can cause undesired side-effects on Proxy objects

- [#11183](https://github.com/withastro/astro/pull/11183) [`3cfa2ac`](https://github.com/withastro/astro/commit/3cfa2ac7e51d7bea96980403c393f9bcda1e9375) Thanks [@66Leo66](https://github.com/66Leo66)! - Suggest `pnpm dlx` instead of `pnpx` in update check.

- [#11147](https://github.com/withastro/astro/pull/11147) [`2d93902`](https://github.com/withastro/astro/commit/2d93902f4c51dcc62b077b0546ead688e6f32c63) Thanks [@kitschpatrol](https://github.com/kitschpatrol)! - Fixes invalid MIME types in Picture source elements for jpg and svg extensions, which was preventing otherwise valid source variations from being shown by the browser

- [#11141](https://github.com/withastro/astro/pull/11141) [`19df89f`](https://github.com/withastro/astro/commit/19df89f87c74205ebc76aeac43ca20b00694acec) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an internal error that prevented the `AstroContainer` to render the `Content` component.

  You can now write code similar to the following to render content collections:

  ```js
  const entry = await getEntry(collection, slug);
  const { Content } = await entry.render();
  const content = await container.renderToString(Content);
  ```

- [#11170](https://github.com/withastro/astro/pull/11170) [`ba20c71`](https://github.com/withastro/astro/commit/ba20c718a4ccd1009bdf81f8265956bff1d19d05) Thanks [@matthewp](https://github.com/matthewp)! - Retain client scripts in content cache

## 4.9.2

### Patch Changes

- [#11138](https://github.com/withastro/astro/pull/11138) [`98e0372`](https://github.com/withastro/astro/commit/98e0372cfd47a3e025be2ac68d1e9ebf06cf548b) Thanks [@ematipico](https://github.com/ematipico)! - You can now pass `props` when rendering a component using the Container APIs:

  ```js
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import Card from '../src/components/Card.astro';

  const container = await AstroContainer.create();
  const result = await container.renderToString(Card, {
    props: {
      someState: true,
    },
  });
  ```

## 4.9.1

### Patch Changes

- [#11129](https://github.com/withastro/astro/pull/11129) [`4bb9269`](https://github.com/withastro/astro/commit/4bb926908d9a7ee134701c3e5a1b5e6ea688f843) Thanks [@matthewp](https://github.com/matthewp)! - Prevent errors from adapters when i18n domains is not used

## 4.9.0

### Minor Changes

- [#11051](https://github.com/withastro/astro/pull/11051) [`12a1bcc`](https://github.com/withastro/astro/commit/12a1bccc818af292cdd2a8ed0f3e3c042b9819b4) Thanks [@ematipico](https://github.com/ematipico)! - Introduces an experimental Container API to render `.astro` components in isolation.

  This API introduces three new functions to allow you to create a new container and render an Astro component returning either a string or a Response:
  - `create()`: creates a new instance of the container.
  - `renderToString()`: renders a component and return a string.
  - `renderToResponse()`: renders a component and returns the `Response` emitted by the rendering phase.

  The first supported use of this new API is to enable unit testing. For example, with `vitest`, you can create a container to render your component with test data and check the result:

  ```js
  import { experimental_AstroContainer as AstroContainer } from 'astro/container';
  import { expect, test } from 'vitest';
  import Card from '../src/components/Card.astro';

  test('Card with slots', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Card, {
      slots: {
        default: 'Card content',
      },
    });

    expect(result).toContain('This is a card');
    expect(result).toContain('Card content');
  });
  ```

  For a complete reference, see the [Container API docs](https://docs.astro.build/en/reference/container-reference/).

  For a feature overview, and to give feedback on this experimental API, see the [Container API roadmap discussion](https://github.com/withastro/roadmap/pull/916).

- [#11021](https://github.com/withastro/astro/pull/11021) [`2d4c8fa`](https://github.com/withastro/astro/commit/2d4c8faa56a64d963fe7847b5be2d7a59e12ed5b) Thanks [@ematipico](https://github.com/ematipico)! - The CSRF protection feature that was introduced behind a flag in [v4.6.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#460) is no longer experimental and is available for general use.

  To enable the stable version, add the new top-level `security` option in `astro.config.mjs`. If you were previously using the experimental version of this feature, also delete the experimental flag:

  ```diff
  export default defineConfig({
  -  experimental: {
  -    security: {
  -      csrfProtection: {
  -        origin: true
  -      }
  -    }
  -  },
  +  security: {
  +    checkOrigin: true
  +  }
  })
  ```

  Enabling this setting performs a check that the `"origin"` header, automatically passed by all modern browsers, matches the URL sent by each Request.

  This check is executed only for pages rendered on demand, and only for the requests `POST`, `PATCH`, `DELETE` and `PUT` with one of the following `"content-type"` headers: `'application/x-www-form-urlencoded'`, `'multipart/form-data'`, `'text/plain'`.

  If the `"origin"` header doesn't match the pathname of the request, Astro will return a 403 status code and won't render the page.

  For more information, see the [`security` configuration docs](https://docs.astro.build/en/reference/configuration-reference/#security).

- [#11022](https://github.com/withastro/astro/pull/11022) [`be68ab4`](https://github.com/withastro/astro/commit/be68ab47e236476ba980cbf74daf85f27cd866f4) Thanks [@ematipico](https://github.com/ematipico)! - The `i18nDomains` routing feature introduced behind a flag in [v3.4.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#430) is no longer experimental and is available for general use.

  This routing option allows you to configure different domains for individual locales in entirely server-rendered projects using the [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) or [@astrojs/vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/) adapter with a `site` configured.

  If you were using this feature, please remove the experimental flag from your Astro config:

  ```diff
  import { defineConfig } from 'astro'

  export default defineConfig({
  -  experimental: {
  -    i18nDomains: true,
  -  }
  })
  ```

  If you have been waiting for stabilization before using this routing option, you can now do so.

  Please see [the internationalization docs](https://docs.astro.build/en/guides/internationalization/#domains) for more about this feature.

- [#11071](https://github.com/withastro/astro/pull/11071) [`8ca7c73`](https://github.com/withastro/astro/commit/8ca7c731dea894e77f84b314ebe3a141d5daa918) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds two new functions `experimental_getActionState()` and `experimental_withState()` to support [the React 19 `useActionState()` hook](https://react.dev/reference/react/useActionState) when using Astro Actions. This introduces progressive enhancement when calling an Action with the `withState()` utility.

  This example calls a `like` action that accepts a `postId` and returns the number of likes. Pass this action to the `experimental_withState()` function to apply progressive enhancement info, and apply to `useActionState()` to track the result:

  ```tsx
  import { actions } from 'astro:actions';
  import { experimental_withState } from '@astrojs/react/actions';

  export function Like({ postId }: { postId: string }) {
    const [state, action, pending] = useActionState(
      experimental_withState(actions.like),
      0, // initial likes
    );

    return (
      <form action={action}>
        <input type="hidden" name="postId" value={postId} />
        <button disabled={pending}>{state} ❤️</button>
      </form>
    );
  }
  ```

  You can also access the state stored by `useActionState()` from your action `handler`. Call `experimental_getActionState()` with the API context, and optionally apply a type to the result:

  ```ts
  import { defineAction, z } from 'astro:actions';
  import { experimental_getActionState } from '@astrojs/react/actions';

  export const server = {
    like: defineAction({
      input: z.object({
        postId: z.string(),
      }),
      handler: async ({ postId }, ctx) => {
        const currentLikes = experimental_getActionState<number>(ctx);
        // write to database
        return currentLikes + 1;
      },
    }),
  };
  ```

- [#11101](https://github.com/withastro/astro/pull/11101) [`a6916e4`](https://github.com/withastro/astro/commit/a6916e4402bf5b7d74bab784a54eba63fd1d1179) Thanks [@linguofeng](https://github.com/linguofeng)! - Updates Astro's code for adapters to use the header `x-forwarded-for` to initialize the `clientAddress`.

  To take advantage of the new change, integration authors must upgrade the version of Astro in their adapter `peerDependencies` to `4.9.0`.

- [#11071](https://github.com/withastro/astro/pull/11071) [`8ca7c73`](https://github.com/withastro/astro/commit/8ca7c731dea894e77f84b314ebe3a141d5daa918) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds compatibility for Astro Actions in the React 19 beta. Actions can be passed to a `form action` prop directly, and Astro will automatically add metadata for progressive enhancement.

  ```tsx
  import { actions } from 'astro:actions';

  function Like() {
    return (
      <form action={actions.like}>
        {/* auto-inserts hidden input for progressive enhancement */}
        <button type="submit">Like</button>
      </form>
    );
  }
  ```

### Patch Changes

- [#11088](https://github.com/withastro/astro/pull/11088) [`9566fa0`](https://github.com/withastro/astro/commit/9566fa08608be766df355be17d72a39ea7b99ed0) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Allow actions to be called on the server. This allows you to call actions as utility functions in your Astro frontmatter, endpoints, and server-side UI components.

  Import and call directly from `astro:actions` as you would for client actions:

  ```astro
  ---
  // src/pages/blog/[postId].astro
  import { actions } from 'astro:actions';

  await actions.like({ postId: Astro.params.postId });
  ---
  ```

- [#11112](https://github.com/withastro/astro/pull/11112) [`29a8650`](https://github.com/withastro/astro/commit/29a8650375053cd5690a32bed4140f0fef11c705) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Deprecate the `getApiContext()` function. API Context can now be accessed from the second parameter to your Action `handler()`:

  ```diff
  // src/actions/index.ts
  import {
    defineAction,
    z,
  -  getApiContext,
  } from 'astro:actions';

  export const server = {
    login: defineAction({
      input: z.object({ id: z.string }),
  +    handler(input, context) {
        const user = context.locals.auth(input.id);
        return user;
      }
    }),
  }
  ```

## 4.8.7

### Patch Changes

- [#11073](https://github.com/withastro/astro/pull/11073) [`f5c8fee`](https://github.com/withastro/astro/commit/f5c8fee76c5e688ef23c18be79705b18f1750415) Thanks [@matthewp](https://github.com/matthewp)! - Prevent cache content from being left in dist folder

  When `contentCollectionsCache` is enabled temporary cached content is copied into the `outDir` for processing. This fixes it so that this content is cleaned out, along with the rest of the temporary build JS.

- [#11054](https://github.com/withastro/astro/pull/11054) [`f6b171e`](https://github.com/withastro/astro/commit/f6b171ed50eed253b8ac005bd5e9d1841a8003dd) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Respect error status when handling Actions with a progressive fallback.

- [#11092](https://github.com/withastro/astro/pull/11092) [`bfe9c73`](https://github.com/withastro/astro/commit/bfe9c73536f0794e4f5ede5040adabbe0e705984) Thanks [@duckycoding-dev](https://github.com/duckycoding-dev)! - Change `slot` attribute of `IntrinsicAttributes` to match the definition of `HTMLAttributes`'s own `slot` attribute of type `string | undefined | null`

- [#10875](https://github.com/withastro/astro/pull/10875) [`b5f95b2`](https://github.com/withastro/astro/commit/b5f95b2fb156152fabf2a22e150037a8255006f9) Thanks [@W1M0R](https://github.com/W1M0R)! - Fixes a typo in a JSDoc annotation

- [#11111](https://github.com/withastro/astro/pull/11111) [`a5d79dd`](https://github.com/withastro/astro/commit/a5d79ddeb2d592de9eb2468471fdcf3eea5ef730) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix unexpected `headers` warning on prerendered routes when using Astro Actions.

- [#11081](https://github.com/withastro/astro/pull/11081) [`af42e05`](https://github.com/withastro/astro/commit/af42e0552054b3b4ac784ed78c60f80bfc38d8ca) Thanks [@V3RON](https://github.com/V3RON)! - Correctly position inspection tooltip in RTL mode

  When RTL mode is turned on, the inspection tooltip tend to overflow the window on the left side.
  Additional check has been added to prevent that.

## 4.8.6

### Patch Changes

- [#11084](https://github.com/withastro/astro/pull/11084) [`9637014`](https://github.com/withastro/astro/commit/9637014b1495a5a41cb384c7de4de410348f4cc0) Thanks [@bluwy](https://github.com/bluwy)! - Fixes regression when handling hoisted scripts from content collections

## 4.8.5

### Patch Changes

- [#11065](https://github.com/withastro/astro/pull/11065) [`1f988ed`](https://github.com/withastro/astro/commit/1f988ed10f4737b5333c9978115ee531786eb539) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug in the Astro rewrite logic, where rewriting the index with parameters - `next("/?foo=bar")` - didn't work as expected.

- [#10924](https://github.com/withastro/astro/pull/10924) [`3a0c02a`](https://github.com/withastro/astro/commit/3a0c02ae0357c267881b30454b5320075378894b) Thanks [@Its-Just-Nans](https://github.com/Its-Just-Nans)! - Handle image-size errors by displaying a clearer message

- [#11058](https://github.com/withastro/astro/pull/11058) [`749a7ac`](https://github.com/withastro/astro/commit/749a7ac967146952450a4173dcb6a5494755460c) Thanks [@matthewp](https://github.com/matthewp)! - Fix streaming in Node.js fast path

- [#11052](https://github.com/withastro/astro/pull/11052) [`a05ca38`](https://github.com/withastro/astro/commit/a05ca38c2cf327ae9130ee1c139a0e510b9da50a) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes a case where rewriting would conflict with the actions internal middleware

- [#11062](https://github.com/withastro/astro/pull/11062) [`16f12e4`](https://github.com/withastro/astro/commit/16f12e426e5869721313bb771e2ec5b821c5452e) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where `astro build` didn't create custom `404.html` and `500.html` when a certain combination of i18n options was applied

- [#10965](https://github.com/withastro/astro/pull/10965) [`a8f0372`](https://github.com/withastro/astro/commit/a8f0372ea71479ef80c58e74201dea6a5a2b2ae4) Thanks [@Elias-Chairi](https://github.com/Elias-Chairi)! - Update generator.ts to allow %23 (#) in dynamic urls

- [#11069](https://github.com/withastro/astro/pull/11069) [`240a70a`](https://github.com/withastro/astro/commit/240a70a29f8e11d161da021845c208f982d64e5c) Thanks [@ematipico](https://github.com/ematipico)! - Improves debug logging for on-demand pages

## 4.8.4

### Patch Changes

- [#11026](https://github.com/withastro/astro/pull/11026) [`8dfb1a2`](https://github.com/withastro/astro/commit/8dfb1a23cc5996c410f7e33211d132dac36c9f77) Thanks [@bluwy](https://github.com/bluwy)! - Skips rendering script tags if it's inlined and empty when `experimental.directRenderScript` is enabled

- [#11043](https://github.com/withastro/astro/pull/11043) [`d0d1710`](https://github.com/withastro/astro/commit/d0d1710439ec281518b17d03126b5d9cd008a102) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes minor type issues in actions component example

- [#10999](https://github.com/withastro/astro/pull/10999) [`5f353e3`](https://github.com/withastro/astro/commit/5f353e39b2b9fb15e6c9d193b5b5101457fef002) Thanks [@bluwy](https://github.com/bluwy)! - The prefetch feature is updated to better support different browsers and different cache headers setup, including:
  1. All prefetch strategies will now always try to use `<link rel="prefetch">` if supported, or will fall back to `fetch()`.
  2. The `prefetch()` programmatic API's `with` option is deprecated in favour of an automatic approach that will also try to use `<link rel="prefetch>` if supported, or will fall back to `fetch()`.

  This change shouldn't affect most sites and should instead make prefetching more effective.

- [#11041](https://github.com/withastro/astro/pull/11041) [`6cc3fb9`](https://github.com/withastro/astro/commit/6cc3fb97ec01af5a7c2153f5b3c22e92675f1e56) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fixes 500 errors when sending empty params or returning an empty response from an action.

- [#11028](https://github.com/withastro/astro/pull/11028) [`771d1f7`](https://github.com/withastro/astro/commit/771d1f7654e18b657c3eacfabae52ed88c76fa99) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Throw on missing server output when using Astro Actions.

- [#11029](https://github.com/withastro/astro/pull/11029) [`bd34452`](https://github.com/withastro/astro/commit/bd34452a34e9d90c948b1e454d184085cd591871) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Actions: include validation error in thrown error message for debugging.

- [#11046](https://github.com/withastro/astro/pull/11046) [`086694a`](https://github.com/withastro/astro/commit/086694ac31a5f3412a3dcdbbd95f0187316699c5) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes `getViteConfig()` type definition to allow passing an inline Astro configuration as second argument

- [#11026](https://github.com/withastro/astro/pull/11026) [`8dfb1a2`](https://github.com/withastro/astro/commit/8dfb1a23cc5996c410f7e33211d132dac36c9f77) Thanks [@bluwy](https://github.com/bluwy)! - Fixes CSS handling if imported in a script tag in an Astro file when `experimental.directRenderScript` is enabled

- [#11020](https://github.com/withastro/astro/pull/11020) [`2e2d6b7`](https://github.com/withastro/astro/commit/2e2d6b7442063c8eb32533d45eaf021c3fa0f615) Thanks [@xsynaptic](https://github.com/xsynaptic)! - Add type declarations for `import.meta.env.ASSETS_PREFIX` when defined as an object for handling different file types.

- [#11030](https://github.com/withastro/astro/pull/11030) [`18e7f33`](https://github.com/withastro/astro/commit/18e7f33ccd145292224cbeffde9fc30d143d97fb) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Actions: Fix missing message for custom Action errors.

- [#10981](https://github.com/withastro/astro/pull/10981) [`ad9227c`](https://github.com/withastro/astro/commit/ad9227c7d1474881fac9b1db15aa7b5a888b42b8) Thanks [@mo](https://github.com/mo)! - Adds deprecated HTML attribute "name" to the list of valid attributes. This attribute has been replaced by the global `id` attribute in recent versions of HTML.

- [#11013](https://github.com/withastro/astro/pull/11013) [`4ea38e7`](https://github.com/withastro/astro/commit/4ea38e733344304f7e18c226d1db3e8ac236055f) Thanks [@QingXia-Ela](https://github.com/QingXia-Ela)! - Prevents unhandledrejection error when checking for latest Astro version

- [#11034](https://github.com/withastro/astro/pull/11034) [`5f2dd45`](https://github.com/withastro/astro/commit/5f2dd4518e707d37f6f886764ca9b31c0d451fd4) Thanks [@arganaphang](https://github.com/arganaphang)! - Add `popovertargetaction` to the attribute that can be passed to the `button` and `input` element

## 4.8.3

### Patch Changes

- [#11006](https://github.com/withastro/astro/pull/11006) [`7418bb0`](https://github.com/withastro/astro/commit/7418bb054cf74a131877497b4b70cf0980de4c6b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix `locals` access from action handlers

## 4.8.2

### Patch Changes

- [#10990](https://github.com/withastro/astro/pull/10990) [`4161a2a`](https://github.com/withastro/astro/commit/4161a2a3d095eaf4d109b4ac49f11f6762bed017) Thanks [@liruifengv](https://github.com/liruifengv)! - fix incorrect actions path on windows

- [#10979](https://github.com/withastro/astro/pull/10979) [`6fa89e8`](https://github.com/withastro/astro/commit/6fa89e84c917f487be9f62875d85c61974e71590) Thanks [@BryceRussell](https://github.com/BryceRussell)! - Fix loading of non-index routes that end with `index.html`

## 4.8.1

### Patch Changes

- [#10987](https://github.com/withastro/astro/pull/10987) [`05db5f7`](https://github.com/withastro/astro/commit/05db5f78187efb53c5732b28e499c7977ceee496) Thanks [@ematipico](https://github.com/ematipico)! - Fix a regression where the flag `experimental.rewriting` was marked mandatory. Is is now optional.

- [#10975](https://github.com/withastro/astro/pull/10975) [`6b640b3`](https://github.com/withastro/astro/commit/6b640b3bcb74d21903d303e268ff8ecef90097e7) Thanks [@bluwy](https://github.com/bluwy)! - Passes the scoped style attribute or class to the `<picture>` element in the `<Picture />` component so scoped styling can be applied to the `<picture>` element

## 4.8.0

### Minor Changes

- [#10935](https://github.com/withastro/astro/pull/10935) [`ddd8e49`](https://github.com/withastro/astro/commit/ddd8e49d1a179bec82310fb471f822a1567a6610) Thanks [@bluwy](https://github.com/bluwy)! - Exports `astro/jsx/rehype.js` with utilities to generate an Astro metadata object

- [#10625](https://github.com/withastro/astro/pull/10625) [`698c2d9`](https://github.com/withastro/astro/commit/698c2d9bb51e20b38de405b6076fd6488ddb5c2b) Thanks [@goulvenclech](https://github.com/goulvenclech)! - Adds the ability for multiple pages to use the same component as an `entrypoint` when building an Astro integration. This change is purely internal, and aligns the build process with the behaviour in the development server.

- [#10906](https://github.com/withastro/astro/pull/10906) [`7bbd664`](https://github.com/withastro/astro/commit/7bbd66459dd29a338ac1dfae0e4c984cb08f73b3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new radio checkbox component to the dev toolbar UI library (`astro-dev-toolbar-radio-checkbox`)

- [#10963](https://github.com/withastro/astro/pull/10963) [`61f47a6`](https://github.com/withastro/astro/commit/61f47a684235a049cbfc4f2cbb5edff3befeced7) Thanks [@delucis](https://github.com/delucis)! - Adds support for passing an inline Astro configuration object to `getViteConfig()`

  If you are using `getViteConfig()` to configure the Vitest test runner, you can now pass a second argument to control how Astro is configured. This makes it possible to configure unit tests with different Astro options when using [Vitest’s workspaces](https://vitest.dev/guide/workspace.html) feature.

  ```js
  // vitest.config.ts
  import { getViteConfig } from 'astro/config';

  export default getViteConfig(
    /* Vite configuration */
    { test: {} },
    /* Astro configuration */
    {
      site: 'https://example.com',
      trailingSlash: 'never',
    },
  );
  ```

- [#10867](https://github.com/withastro/astro/pull/10867) [`47877a7`](https://github.com/withastro/astro/commit/47877a75404ccc8786bbea2171015fb088dc01a1) Thanks [@ematipico](https://github.com/ematipico)! - Adds experimental rewriting in Astro with a new `rewrite()` function and the middleware `next()` function.

  The feature is available via an experimental flag in `astro.config.mjs`:

  ```js
  export default defineConfig({
    experimental: {
      rewriting: true,
    },
  });
  ```

  When enabled, you can use `rewrite()` to **render** another page without changing the URL of the browser in Astro pages and endpoints.

  ```astro
  ---
  // src/pages/dashboard.astro
  if (!Astro.props.allowed) {
    return Astro.rewrite('/');
  }
  ---
  ```

  ```js
  // src/pages/api.js
  export function GET(ctx) {
    if (!ctx.locals.allowed) {
      return ctx.rewrite('/');
    }
  }
  ```

  The middleware `next()` function now accepts a parameter with the same type as the `rewrite()` function. For example, with `next("/")`, you can call the next middleware function with a new `Request`.

  ```js
  // src/middleware.js
  export function onRequest(ctx, next) {
    if (!ctx.cookies.get('allowed')) {
      return next('/'); // new signature
    }
    return next();
  }
  ```

  > **NOTE**: please [read the RFC](https://github.com/withastro/roadmap/blob/feat/reroute/proposals/0047-rerouting.md) to understand the current expectations of the new APIs.

- [#10858](https://github.com/withastro/astro/pull/10858) [`c0c509b`](https://github.com/withastro/astro/commit/c0c509b6bf3f55562d22297fdcc2b3e57969734d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds experimental support for the Actions API. Actions let you define type-safe endpoints you can query from client components with progressive enhancement built in.

  Actions help you write type-safe backend functions you can call from anywhere. Enable server rendering [using the `output` property](https://docs.astro.build/en/basics/rendering-modes/#on-demand-rendered) and add the `actions` flag to the `experimental` object:

  ```js
  {
    output: 'hybrid', // or 'server'
    experimental: {
      actions: true,
    },
  }
  ```

  Declare all your actions in `src/actions/index.ts`. This file is the global actions handler.

  Define an action using the `defineAction()` utility from the `astro:actions` module. These accept the `handler` property to define your server-side request handler. If your action accepts arguments, apply the `input` property to validate parameters with Zod.

  This example defines two actions: `like` and `comment`. The `like` action accepts a JSON object with a `postId` string, while the `comment` action accepts [FormData](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects) with `postId`, `author`, and `body` strings. Each `handler` updates your database and return a type-safe response.

  ```ts
  // src/actions/index.ts
  import { defineAction, z } from 'astro:actions';

  export const server = {
    like: defineAction({
      input: z.object({ postId: z.string() }),
      handler: async ({ postId }) => {
        // update likes in db

        return likes;
      },
    }),
    comment: defineAction({
      accept: 'form',
      input: z.object({
        postId: z.string(),

        body: z.string(),
      }),
      handler: async ({ postId }) => {
        // insert comments in db

        return comment;
      },
    }),
  };
  ```

  Then, call an action from your client components using the `actions` object from `astro:actions`. You can pass a type-safe object when using JSON, or a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects) object when using `accept: 'form'` in your action definition:

  ```tsx "actions"
  // src/components/blog.tsx
  import { actions } from 'astro:actions';
  import { useState } from 'preact/hooks';

  export function Like({ postId }: { postId: string }) {
    const [likes, setLikes] = useState(0);
    return (
      <button
        onClick={async () => {
          const newLikes = await actions.like({ postId });
          setLikes(newLikes);
        }}
      >
        {likes} likes
      </button>
    );
  }

  export function Comment({ postId }: { postId: string }) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const result = await actions.blog.comment(formData);
          // handle result
        }}
      >
        <input type="hidden" name="postId" value={postId} />
        <label for="author">Author</label>
        <input id="author" type="text" name="author" />
        <textarea rows={10} name="body"></textarea>
        <button type="submit">Post</button>
      </form>
    );
  }
  ```

  For a complete overview, and to give feedback on this experimental API, see the [Actions RFC](https://github.com/withastro/roadmap/blob/actions/proposals/0046-actions.md).

- [#10906](https://github.com/withastro/astro/pull/10906) [`7bbd664`](https://github.com/withastro/astro/commit/7bbd66459dd29a338ac1dfae0e4c984cb08f73b3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `buttonBorderRadius` property to the `astro-dev-toolbar-button` component for the dev toolbar component library. This property can be useful to make a fully rounded button with an icon in the center.

### Patch Changes

- [#10977](https://github.com/withastro/astro/pull/10977) [`59571e8`](https://github.com/withastro/astro/commit/59571e8812ec637f5ea61be6c6adc0f45212d176) Thanks [@BryceRussell](https://github.com/BryceRussell)! - Improve error message when accessing `clientAddress` on prerendered routes

- [#10935](https://github.com/withastro/astro/pull/10935) [`ddd8e49`](https://github.com/withastro/astro/commit/ddd8e49d1a179bec82310fb471f822a1567a6610) Thanks [@bluwy](https://github.com/bluwy)! - Improves the error message when failed to render MDX components

- [#10917](https://github.com/withastro/astro/pull/10917) [`3412535`](https://github.com/withastro/astro/commit/3412535be4a0ec94cea18c5d186b7ffbd6f8209c) Thanks [@jakobhellermann](https://github.com/jakobhellermann)! - Fixes a case where the local server would crash when the host also contained the port, eg. with `X-Forwarded-Host: hostname:8080` and `X-Forwarded-Port: 8080` headers

- [#10959](https://github.com/withastro/astro/pull/10959) [`685fc22`](https://github.com/withastro/astro/commit/685fc22bc6247be69a34c3f6945dec058c19fd71) Thanks [@bluwy](https://github.com/bluwy)! - Refactors internal handling of styles and scripts for content collections to improve build performance

- [#10889](https://github.com/withastro/astro/pull/10889) [`4d905cc`](https://github.com/withastro/astro/commit/4d905ccef663f728fc981181f5bb9f1d157184ff) Thanks [@matthewp](https://github.com/matthewp)! - Preserve content modules properly in cache

- [#10955](https://github.com/withastro/astro/pull/10955) [`2978287`](https://github.com/withastro/astro/commit/2978287f92dbd135f5c3efc6a037ea1756064d35) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Handles `AstroUserError`s thrown while syncing content collections and exports `BaseSchema` and `CollectionConfig` types

## 4.7.1

### Patch Changes

- [#10911](https://github.com/withastro/astro/pull/10911) [`a86dc9d`](https://github.com/withastro/astro/commit/a86dc9d269fc4409c458cfa05dcfaeee12bade2f) Thanks [@bluwy](https://github.com/bluwy)! - Skips adding CSS dependencies of CSS Vite modules as style tags in the HTML

- [#10900](https://github.com/withastro/astro/pull/10900) [`36bb3b6`](https://github.com/withastro/astro/commit/36bb3b6025eb51f6e027a76a514cc7ebb29deb10) Thanks [@martrapp](https://github.com/martrapp)! - Detects overlapping navigation and view transitions and automatically aborts all but the most recent one.

- [#10933](https://github.com/withastro/astro/pull/10933) [`007d17f`](https://github.com/withastro/astro/commit/007d17fee072955d4acb846a06d9eb666e908ef6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `app.toggleState` not working correctly

- [#10931](https://github.com/withastro/astro/pull/10931) [`4ce5ced`](https://github.com/withastro/astro/commit/4ce5ced44d490f4c6df771995aef14e11910ec57) Thanks [@ktym4a](https://github.com/ktym4a)! - Fixes `toggleNotification()`'s parameter type for the notification level not using the proper levels

## 4.7.0

### Minor Changes

- [#10665](https://github.com/withastro/astro/pull/10665) [`7b4f284`](https://github.com/withastro/astro/commit/7b4f2840203fe220758934f1366485f788727f0d) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds new utilities to ease the creation of toolbar apps including `defineToolbarApp` to make it easier to define your toolbar app and `app` and `server` helpers for easier communication between the toolbar and the server. These new utilities abstract away some of the boilerplate code that is common in toolbar apps, and lower the barrier of entry for app authors.

  For example, instead of creating an event listener for the `app-toggled` event and manually typing the value in the callback, you can now use the `onAppToggled` method. Additionally, communicating with the server does not require knowing any of the Vite APIs anymore, as a new `server` object is passed to the `init` function that contains easy to use methods for communicating with the server.

  ```diff
  import { defineToolbarApp } from "astro/toolbar";

  export default defineToolbarApp({
    init(canvas, app, server) {

  -    app.addEventListener("app-toggled", (e) => {
  -      console.log(`App is now ${state ? "enabled" : "disabled"}`);.
  -    });

  +    app.onToggled(({ state }) => {
  +        console.log(`App is now ${state ? "enabled" : "disabled"}`);
  +    });

  -    if (import.meta.hot) {
  -      import.meta.hot.send("my-app:my-client-event", { message: "world" });
  -    }

  +    server.send("my-app:my-client-event", { message: "world" })

  -    if (import.meta.hot) {
  -      import.meta.hot.on("my-server-event", (data: {message: string}) => {
  -        console.log(data.message);
  -      });
  -    }

  +    server.on<{ message: string }>("my-server-event", (data) => {
  +      console.log(data.message); // data is typed using the type parameter
  +    });
    },
  })
  ```

  Server helpers are also available on the server side, for use in your integrations, through the new `toolbar` object:

  ```ts
  "astro:server:setup": ({ toolbar }) => {
    toolbar.on<{ message: string }>("my-app:my-client-event", (data) => {
      console.log(data.message);
      toolbar.send("my-server-event", { message: "hello" });
    });
  }
  ```

  This is a backwards compatible change and your your existing dev toolbar apps will continue to function. However, we encourage you to build your apps with the new helpers, following the [updated Dev Toolbar API documentation](https://docs.astro.build/en/reference/dev-toolbar-app-reference/).

- [#10734](https://github.com/withastro/astro/pull/10734) [`6fc4c0e`](https://github.com/withastro/astro/commit/6fc4c0e420da7629b4cfc28ee7efce1d614447be) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Astro will now automatically check for updates when you run the dev server. If a new version is available, a message will appear in the terminal with instructions on how to update. Updates will be checked once per 10 days, and the message will only appear if the project is multiple versions behind the latest release.

  This behavior can be disabled by running `astro preferences disable checkUpdates` or setting the `ASTRO_DISABLE_UPDATE_CHECK` environment variable to `false`.

- [#10762](https://github.com/withastro/astro/pull/10762) [`43ead8f`](https://github.com/withastro/astro/commit/43ead8fbd5112823118060175c7a4a22522cc325) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Enables type checking for JavaScript files when using the `strictest` TS config. This ensures consistency with Astro's other TS configs, and fixes type checking for integrations like Astro DB when using an `astro.config.mjs`.

  If you are currently using the `strictest` preset and would like to still disable `.js` files, set `allowJS: false` in your `tsconfig.json`.

### Patch Changes

- [#10861](https://github.com/withastro/astro/pull/10861) [`b673bc8`](https://github.com/withastro/astro/commit/b673bc850593d5af25793d0358c00797477fa373) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where `astro build` writes type declaration files to `outDir` when it's outside of root directory.

- [#10684](https://github.com/withastro/astro/pull/10684) [`8b59d5d`](https://github.com/withastro/astro/commit/8b59d5d078ff40576b8cbee432279c6ad044a1a9) Thanks [@PeterDraex](https://github.com/PeterDraex)! - Update sharp to 0.33 to fix issue with Alpine Linux

## 4.6.4

### Patch Changes

- [#10846](https://github.com/withastro/astro/pull/10846) [`3294f7a`](https://github.com/withastro/astro/commit/3294f7a343e036d2ad9ac8d5f792ad0d4f43a399) Thanks [@matthewp](https://github.com/matthewp)! - Prevent getCollection breaking in vitest

- [#10856](https://github.com/withastro/astro/pull/10856) [`30cf82a`](https://github.com/withastro/astro/commit/30cf82ac3e970a6a3c0f07db1340dd7152d1c35d) Thanks [@robertvanhoesel](https://github.com/robertvanhoesel)! - Prevents inputs with a name attribute of action or method to break ViewTransitions' form submission

- [#10833](https://github.com/withastro/astro/pull/10833) [`8d5f3e8`](https://github.com/withastro/astro/commit/8d5f3e8656027023f9fda51c66b0213ffe16d3a5) Thanks [@renovate](https://github.com/apps/renovate)! - Updates `esbuild` dependency to v0.20. This should not affect projects in most cases.

- [#10801](https://github.com/withastro/astro/pull/10801) [`204b782`](https://github.com/withastro/astro/commit/204b7820e6de22d97fa2a7b988180c42155c8387) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - Fixes an issue where images in MD required a relative specifier (e.g. `./`)

  Now, you can use the standard `![](relative/img.png)` syntax in MD files for images colocated in the same folder: no relative specifier required!

  There is no need to update your project; your existing images will still continue to work. However, you may wish to remove any relative specifiers from these MD images as they are no longer necessary:

  ```diff
  - ![A cute dog](./dog.jpg)
  + ![A cute dog](dog.jpg)
  <!-- This dog lives in the same folder as my article! -->
  ```

- [#10841](https://github.com/withastro/astro/pull/10841) [`a2df344`](https://github.com/withastro/astro/commit/a2df344bff15647c2bfb3f49e3f7b66aa069d6f4) Thanks [@martrapp](https://github.com/martrapp)! - Due to regression on mobile WebKit browsers, reverts a change made for JavaScript animations during view transitions.

## 4.6.3

### Patch Changes

- [#10799](https://github.com/withastro/astro/pull/10799) [`dc74afca9f5eebc2d61331298d6ef187d92051e0`](https://github.com/withastro/astro/commit/dc74afca9f5eebc2d61331298d6ef187d92051e0) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue with persisted non-text input fields that have the focus during view transition navigation.

- [#10773](https://github.com/withastro/astro/pull/10773) [`35e43ecdaae7adc4b9a0b974192a033568cfb3f0`](https://github.com/withastro/astro/commit/35e43ecdaae7adc4b9a0b974192a033568cfb3f0) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves performance for frequent use of small components.

- [#10763](https://github.com/withastro/astro/pull/10763) [`63132771373ce1510be3e8814897accc0bf62ef8`](https://github.com/withastro/astro/commit/63132771373ce1510be3e8814897accc0bf62ef8) Thanks [@matthewp](https://github.com/matthewp)! - Invalidate CC cache manifest when lockfile or config changes

- [#10811](https://github.com/withastro/astro/pull/10811) [`77822a822b04b5113726f713df104e8667333c59`](https://github.com/withastro/astro/commit/77822a822b04b5113726f713df104e8667333c59) Thanks [@AvinashReddy3108](https://github.com/AvinashReddy3108)! - Update list of available integrations in the `astro add` CLI help.

## 4.6.2

### Patch Changes

- [#10732](https://github.com/withastro/astro/pull/10732) [`a92e263beb6e0166f1f13c97803d1861793e2a99`](https://github.com/withastro/astro/commit/a92e263beb6e0166f1f13c97803d1861793e2a99) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - Correctly sets `build.assets` directory during `vite` config setup

- [#10776](https://github.com/withastro/astro/pull/10776) [`1607face67051b16d4648555f1001b2a9308e377`](https://github.com/withastro/astro/commit/1607face67051b16d4648555f1001b2a9308e377) Thanks [@fshafiee](https://github.com/fshafiee)! - Fixes cookies type inference

- [#10796](https://github.com/withastro/astro/pull/10796) [`90669472df3a05b33f0de46fd2d039e3eba7f7dd`](https://github.com/withastro/astro/commit/90669472df3a05b33f0de46fd2d039e3eba7f7dd) Thanks [@bluwy](https://github.com/bluwy)! - Disables streaming when rendering site with `output: "static"`

- [#10782](https://github.com/withastro/astro/pull/10782) [`b0589d05538fcc77dd3c38198bf93f3548362cd8`](https://github.com/withastro/astro/commit/b0589d05538fcc77dd3c38198bf93f3548362cd8) Thanks [@nektro](https://github.com/nektro)! - Handles possible null value when calling `which-pm` during dynamic package installation

- [#10774](https://github.com/withastro/astro/pull/10774) [`308b5d8c122f44e7724bb2f3ad3aa5c43a83e584`](https://github.com/withastro/astro/commit/308b5d8c122f44e7724bb2f3ad3aa5c43a83e584) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `astro add` sometimes modifying `baseUrl` unintentionally

- [#10783](https://github.com/withastro/astro/pull/10783) [`4dbd545304d1a8af903c8c97f237eb55c988c40b`](https://github.com/withastro/astro/commit/4dbd545304d1a8af903c8c97f237eb55c988c40b) Thanks [@jurajkapsz](https://github.com/jurajkapsz)! - Fixes Picture component specialFormatsFallback fallback check

- [#10775](https://github.com/withastro/astro/pull/10775) [`06843121450899ecf0390ca4efaff6c9a6fe0f75`](https://github.com/withastro/astro/commit/06843121450899ecf0390ca4efaff6c9a6fe0f75) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes assets endpoint in serverless returning 404 in certain situations where the website might be under a protected route

- [#10787](https://github.com/withastro/astro/pull/10787) [`699f4559a279b374bddb3e5e48c72afe2709e8e7`](https://github.com/withastro/astro/commit/699f4559a279b374bddb3e5e48c72afe2709e8e7) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a timing issue in the view transition simulation.

## 4.6.1

### Patch Changes

- [#10708](https://github.com/withastro/astro/pull/10708) [`742866c5669a2be4f8b5a4c861cadb933c381415`](https://github.com/withastro/astro/commit/742866c5669a2be4f8b5a4c861cadb933c381415) Thanks [@horo-fox](https://github.com/horo-fox)! - Limits parallel imports within `getCollection()` to prevent EMFILE errors when accessing files

- [#10755](https://github.com/withastro/astro/pull/10755) [`c6d59b6fb7db20af957a8706c8159c50619235ef`](https://github.com/withastro/astro/commit/c6d59b6fb7db20af957a8706c8159c50619235ef) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where the i18n fallback failed to correctly redirect to the index page with SSR enabled

## 4.6.0

### Minor Changes

- [#10591](https://github.com/withastro/astro/pull/10591) [`39988ef8e2c4c4888543c973e06d9b9939e4ac95`](https://github.com/withastro/astro/commit/39988ef8e2c4c4888543c973e06d9b9939e4ac95) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Adds a new dev toolbar settings option to change the horizontal placement of the dev toolbar on your screen: bottom left, bottom center, or bottom right.

- [#10689](https://github.com/withastro/astro/pull/10689) [`683d51a5eecafbbfbfed3910a3f1fbf0b3531b99`](https://github.com/withastro/astro/commit/683d51a5eecafbbfbfed3910a3f1fbf0b3531b99) Thanks [@ematipico](https://github.com/ematipico)! - Deprecate support for versions of Node.js older than `v18.17.1` for Node.js 18, older than `v20.0.3` for Node.js 20, and the complete Node.js v19 release line.

  This change is in line with Astro's [Node.js support policy](https://docs.astro.build/en/upgrade-astro/#support).

- [#10678](https://github.com/withastro/astro/pull/10678) [`2e53b5fff6d292b7acdf8c30a6ecf5e5696846a1`](https://github.com/withastro/astro/commit/2e53b5fff6d292b7acdf8c30a6ecf5e5696846a1) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new experimental security option to prevent [Cross-Site Request Forgery (CSRF) attacks](https://owasp.org/www-community/attacks/csrf). This feature is available only for pages rendered on demand:

  ```js
  import { defineConfig } from 'astro/config';
  export default defineConfig({
    experimental: {
      security: {
        csrfProtection: {
          origin: true,
        },
      },
    },
  });
  ```

  Enabling this setting performs a check that the "origin" header, automatically passed by all modern browsers, matches the URL sent by each `Request`.

  This experimental "origin" check is executed only for pages rendered on demand, and only for the requests `POST, `PATCH`, `DELETE`and`PUT`with one of the following`content-type` headers: 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'.

  It the "origin" header doesn't match the pathname of the request, Astro will return a 403 status code and won't render the page.

- [#10193](https://github.com/withastro/astro/pull/10193) [`440681e7b74511a17b152af0fd6e0e4dc4014025`](https://github.com/withastro/astro/commit/440681e7b74511a17b152af0fd6e0e4dc4014025) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new i18n routing option `manual` to allow you to write your own i18n middleware:

  ```js
  import { defineConfig } from 'astro/config';
  // astro.config.mjs
  export default defineConfig({
    i18n: {
      locales: ['en', 'fr'],
      defaultLocale: 'fr',
      routing: 'manual',
    },
  });
  ```

  Adding `routing: "manual"` to your i18n config disables Astro's own i18n middleware and provides you with helper functions to write your own: `redirectToDefaultLocale`, `notFound`, and `redirectToFallback`:

  ```js
  // middleware.js
  import { redirectToDefaultLocale } from 'astro:i18n';
  export const onRequest = defineMiddleware(async (context, next) => {
    if (context.url.startsWith('/about')) {
      return next();
    } else {
      return redirectToDefaultLocale(context, 302);
    }
  });
  ```

  Also adds a `middleware` function that manually creates Astro's i18n middleware. This allows you to extend Astro's i18n routing instead of completely replacing it. Run `middleware` in combination with your own middleware, using the `sequence` utility to determine the order:

  ```js title="src/middleware.js"
  import { defineMiddleware, sequence } from 'astro:middleware';
  import { middleware } from 'astro:i18n'; // Astro's own i18n routing config

  export const userMiddleware = defineMiddleware();

  export const onRequest = sequence(
    userMiddleware,
    middleware({
      redirectToDefaultLocale: false,
      prefixDefaultLocale: true,
    }),
  );
  ```

- [#10671](https://github.com/withastro/astro/pull/10671) [`9e14a78cb05667af9821948c630786f74680090d`](https://github.com/withastro/astro/commit/9e14a78cb05667af9821948c630786f74680090d) Thanks [@fshafiee](https://github.com/fshafiee)! - Adds the `httpOnly`, `sameSite`, and `secure` options when deleting a cookie

### Patch Changes

- [#10747](https://github.com/withastro/astro/pull/10747) [`994337c99f84304df1147a14504659439a9a7326`](https://github.com/withastro/astro/commit/994337c99f84304df1147a14504659439a9a7326) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where functions could not be used as named slots.

- [#10750](https://github.com/withastro/astro/pull/10750) [`7e825604ddf90c989537e07939a39dc249343897`](https://github.com/withastro/astro/commit/7e825604ddf90c989537e07939a39dc249343897) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Fixes a false positive for "Invalid `tabindex` on non-interactive element" rule for roleless elements ( `div` and `span` ).

- [#10745](https://github.com/withastro/astro/pull/10745) [`d51951ce6278d4b59deed938d65e1cb72b5102df`](https://github.com/withastro/astro/commit/d51951ce6278d4b59deed938d65e1cb72b5102df) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where CLI commands could not report the reason for failure before exiting.

- [#10661](https://github.com/withastro/astro/pull/10661) [`e2cd7f4291912dadd4a654bc7917856c58a72a97`](https://github.com/withastro/astro/commit/e2cd7f4291912dadd4a654bc7917856c58a72a97) Thanks [@liruifengv](https://github.com/liruifengv)! - Fixed errorOverlay theme toggle bug.

- Updated dependencies [[`ccafa8d230f65c9302421a0ce0a0adc5824bfd55`](https://github.com/withastro/astro/commit/ccafa8d230f65c9302421a0ce0a0adc5824bfd55), [`683d51a5eecafbbfbfed3910a3f1fbf0b3531b99`](https://github.com/withastro/astro/commit/683d51a5eecafbbfbfed3910a3f1fbf0b3531b99)]:
  - @astrojs/markdown-remark@5.1.0
  - @astrojs/telemetry@3.1.0

## 4.5.18

### Patch Changes

- [#10728](https://github.com/withastro/astro/pull/10728) [`f508c4b7d54316e737f454a3777204b23636d4a0`](https://github.com/withastro/astro/commit/f508c4b7d54316e737f454a3777204b23636d4a0) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where some very **specific** code rendered using `expressive-code` was not escaped properly.

- [#10737](https://github.com/withastro/astro/pull/10737) [`8a30f257b1f3618b01212a591b82ad7a63c82fbb`](https://github.com/withastro/astro/commit/8a30f257b1f3618b01212a591b82ad7a63c82fbb) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression where constructing and returning 404 responses from a middleware resulted in the dev server getting stuck in a loop.

- [#10719](https://github.com/withastro/astro/pull/10719) [`b21b3ba307235510707ee9f5bd49f71473a07004`](https://github.com/withastro/astro/commit/b21b3ba307235510707ee9f5bd49f71473a07004) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a false positive for `div` and `span` elements when running the Dev Toolbar accessibility audits.

  Those are special elements that don't have an interaction assigned by default. Instead, it is assigned through the `role` attribute. This means that cases like the following are now deemed correct:

  ```html
  <div role="tablist"></div>
  <span role="button" onclick="" onkeydown=""></span>
  ```

## 4.5.17

### Patch Changes

- [#10688](https://github.com/withastro/astro/pull/10688) [`799f6f3f29a3ef4f76347870a209ffa89651adfa`](https://github.com/withastro/astro/commit/799f6f3f29a3ef4f76347870a209ffa89651adfa) Thanks [@bluwy](https://github.com/bluwy)! - Marks renderer `jsxImportSource` and `jsxTransformOptions` options as deprecated as they are no longer used since Astro 3.0

- [#10657](https://github.com/withastro/astro/pull/10657) [`93d353528fa1a85b67e3f1e9514ed2a1b42dfd94`](https://github.com/withastro/astro/commit/93d353528fa1a85b67e3f1e9514ed2a1b42dfd94) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves the color contrast for notification badges on dev toolbar apps

- [#10693](https://github.com/withastro/astro/pull/10693) [`1d26e9c7f7d8f47e33bc68d3b30bbffce25c7b63`](https://github.com/withastro/astro/commit/1d26e9c7f7d8f47e33bc68d3b30bbffce25c7b63) Thanks [@apetta](https://github.com/apetta)! - Adds the `disableremoteplayback` attribute to MediaHTMLAttributes interface

- [#10695](https://github.com/withastro/astro/pull/10695) [`a15975e41cb5eaf6ed8eb3ebaee676a17e433052`](https://github.com/withastro/astro/commit/a15975e41cb5eaf6ed8eb3ebaee676a17e433052) Thanks [@bluwy](https://github.com/bluwy)! - Skips prerender chunk if building with static output

- [#10707](https://github.com/withastro/astro/pull/10707) [`5e044a5eafaa206d2ef8b62c37d1bcd37f0a4078`](https://github.com/withastro/astro/commit/5e044a5eafaa206d2ef8b62c37d1bcd37f0a4078) Thanks [@horo-fox](https://github.com/horo-fox)! - Logs an error when a page's `getStaticPaths` fails

- [#10686](https://github.com/withastro/astro/pull/10686) [`fa0f593890502faf5709ab881fe0e45519d2f7af`](https://github.com/withastro/astro/commit/fa0f593890502faf5709ab881fe0e45519d2f7af) Thanks [@bluwy](https://github.com/bluwy)! - Prevents inlining scripts if used by other chunks when using the `experimental.directRenderScript` option

## 4.5.16

### Patch Changes

- [#10679](https://github.com/withastro/astro/pull/10679) [`ca6bb1f31ef041e6ccf8ef974856fa945ff5bb31`](https://github.com/withastro/astro/commit/ca6bb1f31ef041e6ccf8ef974856fa945ff5bb31) Thanks [@martrapp](https://github.com/martrapp)! - Generates missing popstate events for Firefox when navigating to hash targets on the same page.

- [#10669](https://github.com/withastro/astro/pull/10669) [`0464563e527f821e53d78028d9bbf3c4e1050f5b`](https://github.com/withastro/astro/commit/0464563e527f821e53d78028d9bbf3c4e1050f5b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes Astro waiting infinitely in CI when a required package was not installed

## 4.5.15

### Patch Changes

- [#10666](https://github.com/withastro/astro/pull/10666) [`55ddb2ba4889480f776a8d29b9dcd531b9f5ab3e`](https://github.com/withastro/astro/commit/55ddb2ba4889480f776a8d29b9dcd531b9f5ab3e) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where forwarded requests did not include hostname on node-based adapters. This also makes error pages more reliable.

- [#10642](https://github.com/withastro/astro/pull/10642) [`4f5dc14f315eba7ea6ec5cc8e5dacb0cb81288dd`](https://github.com/withastro/astro/commit/4f5dc14f315eba7ea6ec5cc8e5dacb0cb81288dd) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Fixes typing issues when using `format` and `quality` options with remote images

- [#10616](https://github.com/withastro/astro/pull/10616) [`317d18ef8c9cf4fd13647518e3fd352774a86481`](https://github.com/withastro/astro/commit/317d18ef8c9cf4fd13647518e3fd352774a86481) Thanks [@NikolaRHristov](https://github.com/NikolaRHristov)! - This change disables the `sharp` `libvips` image cache as it errors when the
  file is too small and operations are happening too fast (runs into a race
  condition)

## 4.5.14

### Patch Changes

- [#10470](https://github.com/withastro/astro/pull/10470) [`320c309ca9fbe51c40e6ba846d04a0cb49aced5f`](https://github.com/withastro/astro/commit/320c309ca9fbe51c40e6ba846d04a0cb49aced5f) Thanks [@liruifengv](https://github.com/liruifengv)! - improves `client:only` error message

- [#10496](https://github.com/withastro/astro/pull/10496) [`ce985631129e49f7ea90e6ea690ef9f9cf0e6987`](https://github.com/withastro/astro/commit/ce985631129e49f7ea90e6ea690ef9f9cf0e6987) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Makes the warning less scary when adding 3rd-party integrations using `astro add`

## 4.5.13

### Patch Changes

- [#10495](https://github.com/withastro/astro/pull/10495) [`046d69d517118ab5c0e71604b321729d66ddffff`](https://github.com/withastro/astro/commit/046d69d517118ab5c0e71604b321729d66ddffff) Thanks [@satyarohith](https://github.com/satyarohith)! - This patch allows astro to run in node-compat mode in Deno. Deno doesn't support
  construction of response from async iterables in node-compat mode so we need to
  use ReadableStream.

- [#10605](https://github.com/withastro/astro/pull/10605) [`a16a829f4e25ad5c9a1b4557ec089fc8ab53320f`](https://github.com/withastro/astro/commit/a16a829f4e25ad5c9a1b4557ec089fc8ab53320f) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue with outdated page titles in browser history when using text fragments in view transition navigation.

- [#10584](https://github.com/withastro/astro/pull/10584) [`e648c5575a8774af739231cfa9fc27a32086aa5f`](https://github.com/withastro/astro/commit/e648c5575a8774af739231cfa9fc27a32086aa5f) Thanks [@duanwilliam](https://github.com/duanwilliam)! - Fixes a bug where JSX runtime would error on components with nullish prop values in certain conditions.

- [#10608](https://github.com/withastro/astro/pull/10608) [`e31bea0704890ff92ce4f9b0ce536c1c90715f2c`](https://github.com/withastro/astro/commit/e31bea0704890ff92ce4f9b0ce536c1c90715f2c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes bug with head content being pushed into body

- Updated dependencies [[`2cf116f80cb5e421ab5cc5eb4a654e7b78c1b8de`](https://github.com/withastro/astro/commit/2cf116f80cb5e421ab5cc5eb4a654e7b78c1b8de), [`374efcdff9625ca43309d89e3b9cfc9174351512`](https://github.com/withastro/astro/commit/374efcdff9625ca43309d89e3b9cfc9174351512)]:
  - @astrojs/markdown-remark@5.0.0

## 4.5.12

### Patch Changes

- [#10596](https://github.com/withastro/astro/pull/10596) [`20463a6c1e1271d8dc3cb0ab3419ee5c72abd218`](https://github.com/withastro/astro/commit/20463a6c1e1271d8dc3cb0ab3419ee5c72abd218) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add `removeBase` function

- Updated dependencies [[`20463a6c1e1271d8dc3cb0ab3419ee5c72abd218`](https://github.com/withastro/astro/commit/20463a6c1e1271d8dc3cb0ab3419ee5c72abd218)]:
  - @astrojs/internal-helpers@0.4.0

## 4.5.11

### Patch Changes

- [#10567](https://github.com/withastro/astro/pull/10567) [`fbdc10f90f7baa5c49f2f53e3e4ce8f453814c01`](https://github.com/withastro/astro/commit/fbdc10f90f7baa5c49f2f53e3e4ce8f453814c01) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes `astro:assets` not working when using complex config with `vite.build.rollupOptions.output.assetFileNames`

- [#10593](https://github.com/withastro/astro/pull/10593) [`61e283e5a0d95b6ef5d3c4c985d6ee78f74bbd8e`](https://github.com/withastro/astro/commit/61e283e5a0d95b6ef5d3c4c985d6ee78f74bbd8e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes Polymorphic type helper causing TypeScript errors in certain cases after the previous update

- [#10543](https://github.com/withastro/astro/pull/10543) [`0fd36bdb383297b32cc523b57d2442132da41595`](https://github.com/withastro/astro/commit/0fd36bdb383297b32cc523b57d2442132da41595) Thanks [@matthewp](https://github.com/matthewp)! - Fixes inline stylesheets with content collections cache

- [#10582](https://github.com/withastro/astro/pull/10582) [`a05953538fcf524786385830b99c0c5a015173e8`](https://github.com/withastro/astro/commit/a05953538fcf524786385830b99c0c5a015173e8) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where the dev server got stuck in a loop while routing responses with a 404 status code to the 404 route.

## 4.5.10

### Patch Changes

- [#10549](https://github.com/withastro/astro/pull/10549) [`54c2f9707f5d038630143f769e3075c698474654`](https://github.com/withastro/astro/commit/54c2f9707f5d038630143f769e3075c698474654) Thanks [@admirsaheta](https://github.com/admirsaheta)! - Updates the `HTMLAttributes` type exported from `astro` to allow data attributes

- [#10562](https://github.com/withastro/astro/pull/10562) [`348c1ca1323d0516c2dcf8e963343cd12cb5407f`](https://github.com/withastro/astro/commit/348c1ca1323d0516c2dcf8e963343cd12cb5407f) Thanks [@apetta](https://github.com/apetta)! - Fixes minor type issues inside the built-in components of Astro

- [#10550](https://github.com/withastro/astro/pull/10550) [`34fa8e131b85531e6629390307108ffc4adb7ed1`](https://github.com/withastro/astro/commit/34fa8e131b85531e6629390307108ffc4adb7ed1) Thanks [@Skn0tt](https://github.com/Skn0tt)! - Fixes bug where server builds would include unneeded assets in SSR Function, potentially leading to upload errors on Vercel, Netlify because of size limits

- Updated dependencies [[`c585528f446ccca3d4c643f4af5d550b93c18902`](https://github.com/withastro/astro/commit/c585528f446ccca3d4c643f4af5d550b93c18902)]:
  - @astrojs/markdown-remark@4.3.2

## 4.5.9

### Patch Changes

- [#10532](https://github.com/withastro/astro/pull/10532) [`8306ce1ff7b71a2a0d7908336c9be462a54d395a`](https://github.com/withastro/astro/commit/8306ce1ff7b71a2a0d7908336c9be462a54d395a) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a style issue of `client:only` components in DEV mode during view transitions.

- [#10473](https://github.com/withastro/astro/pull/10473) [`627e47d67af4846cea2acf26a96b4124001b26fc`](https://github.com/withastro/astro/commit/627e47d67af4846cea2acf26a96b4124001b26fc) Thanks [@bluwy](https://github.com/bluwy)! - Fixes and improves performance when rendering Astro JSX

## 4.5.8

### Patch Changes

- [#10504](https://github.com/withastro/astro/pull/10504) [`8e4e554cc211e59c329c0a5d110c839c886ff120`](https://github.com/withastro/astro/commit/8e4e554cc211e59c329c0a5d110c839c886ff120) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update Babel version to fix regression in Babel's `7.24.2`.

- Updated dependencies [[`19e42c368184013fc30d1e46753b9e9383bb2bdf`](https://github.com/withastro/astro/commit/19e42c368184013fc30d1e46753b9e9383bb2bdf)]:
  - @astrojs/markdown-remark@4.3.1

## 4.5.7

### Patch Changes

- [#10493](https://github.com/withastro/astro/pull/10493) [`e4a6462751725878bfe47632eeafa6854cad5bf2`](https://github.com/withastro/astro/commit/e4a6462751725878bfe47632eeafa6854cad5bf2) Thanks [@firefoxic](https://github.com/firefoxic)! - `<link>` tags created by astro for optimized stylesheets now do not include the closing forward slash. This slash is optional for void elements such as link, but made some html validation fail.

## 4.5.6

### Patch Changes

- [#10455](https://github.com/withastro/astro/pull/10455) [`c12666166db724915e42e37a048483c99f88e6d9`](https://github.com/withastro/astro/commit/c12666166db724915e42e37a048483c99f88e6d9) Thanks [@lilnasy](https://github.com/lilnasy)! - Adds a helpful error message that will be shown when an endpoint does not return a `Response`.

- [#10426](https://github.com/withastro/astro/pull/10426) [`6a9a35ee15069541c3144012385366a3c689240a`](https://github.com/withastro/astro/commit/6a9a35ee15069541c3144012385366a3c689240a) Thanks [@markgaze](https://github.com/markgaze)! - Fixes an issue with generating JSON schemas when the schema is a function

- [#10448](https://github.com/withastro/astro/pull/10448) [`fcece3658697248ab58f77b3d4a8b14d362f3c47`](https://github.com/withastro/astro/commit/fcece3658697248ab58f77b3d4a8b14d362f3c47) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where multiple rendering errors resulted in a crash of the SSR app server.

## 4.5.5

### Patch Changes

- [#10379](https://github.com/withastro/astro/pull/10379) [`3776ecf0aa9e08a992d3ae76e90682fd04093721`](https://github.com/withastro/astro/commit/3776ecf0aa9e08a992d3ae76e90682fd04093721) Thanks [@1574242600](https://github.com/1574242600)! - Fixes a routing issue with partially truncated dynamic segments.

- [#10442](https://github.com/withastro/astro/pull/10442) [`f8e0ad3c52a37b8a2175fe2f5ff2bd0cd738f499`](https://github.com/withastro/astro/commit/f8e0ad3c52a37b8a2175fe2f5ff2bd0cd738f499) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes small rendering issues with the dev toolbar in certain contexts

- [#10438](https://github.com/withastro/astro/pull/10438) [`5b48cc0fc8383b0659a595afd3a6ee28b28779c3`](https://github.com/withastro/astro/commit/5b48cc0fc8383b0659a595afd3a6ee28b28779c3) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Generate Astro DB types when running `astro sync`.

- [#10456](https://github.com/withastro/astro/pull/10456) [`1900a8f9bc337f3a882178d1770e10ab67fab0ce`](https://github.com/withastro/astro/commit/1900a8f9bc337f3a882178d1770e10ab67fab0ce) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an error when using `astro:transtions/client` without `<ViewTransitions/>`

## 4.5.4

### Patch Changes

- [#10427](https://github.com/withastro/astro/pull/10427) [`128c7a36397d99608dea918885b68bd302d00e7f`](https://github.com/withastro/astro/commit/128c7a36397d99608dea918885b68bd302d00e7f) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where error pages did not have access to the `Astro.locals` fields provided by the adapter.

## 4.5.3

### Patch Changes

- [#10410](https://github.com/withastro/astro/pull/10410) [`055fe293c6702dd27bcd6c4f59297c6d4385abb1`](https://github.com/withastro/astro/commit/055fe293c6702dd27bcd6c4f59297c6d4385abb1) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where configured redirects could not include certain characters in the target path.

- [#9820](https://github.com/withastro/astro/pull/9820) [`8edc42aa7c209b12d98ecf20cdecccddf7314af0`](https://github.com/withastro/astro/commit/8edc42aa7c209b12d98ecf20cdecccddf7314af0) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Prevents fully formed URLs in attributes from being escaped

## 4.5.2

### Patch Changes

- [#10400](https://github.com/withastro/astro/pull/10400) [`629c9d7c4d96ae5711d95601e738b3d31d268116`](https://github.com/withastro/astro/commit/629c9d7c4d96ae5711d95601e738b3d31d268116) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where dev toolbar x-ray didn't escape props content.

## 4.5.1

### Patch Changes

- [#10392](https://github.com/withastro/astro/pull/10392) [`02aeb01cb8b62b9cc4dfe6069857219404343b73`](https://github.com/withastro/astro/commit/02aeb01cb8b62b9cc4dfe6069857219404343b73) Thanks [@martrapp](https://github.com/martrapp)! - Fixes broken types for some functions of `astro:transitions/client`.

- [#10390](https://github.com/withastro/astro/pull/10390) [`236cdbb611587692d3c781850cb949604677ef82`](https://github.com/withastro/astro/commit/236cdbb611587692d3c781850cb949604677ef82) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds `--help` reference for new db and studio CLI commands

## 4.5.0

### Minor Changes

- [#10206](https://github.com/withastro/astro/pull/10206) [`dc87214141e7f8406c0fdf6a7f425dad6dea6d3e`](https://github.com/withastro/astro/commit/dc87214141e7f8406c0fdf6a7f425dad6dea6d3e) Thanks [@lilnasy](https://github.com/lilnasy)! - Allows middleware to run when a matching page or endpoint is not found. Previously, a `pages/404.astro` or `pages/[...catch-all].astro` route had to match to allow middleware. This is now not necessary.

  When a route does not match in SSR deployments, your adapter may show a platform-specific 404 page instead of running Astro's SSR code. In these cases, you may still need to add a `404.astro` or fallback route with spread params, or use a routing configuration option if your adapter provides one.

- [#9960](https://github.com/withastro/astro/pull/9960) [`c081adf998d30419fed97d8fccc11340cdc512e0`](https://github.com/withastro/astro/commit/c081adf998d30419fed97d8fccc11340cdc512e0) Thanks [@StandardGage](https://github.com/StandardGage)! - Allows passing any props to the `<Code />` component

- [#10102](https://github.com/withastro/astro/pull/10102) [`e3f02f5fb1cf0dae3c54beb3a4af3dbf3b06abb7`](https://github.com/withastro/astro/commit/e3f02f5fb1cf0dae3c54beb3a4af3dbf3b06abb7) Thanks [@bluwy](https://github.com/bluwy)! - Adds a new `experimental.directRenderScript` configuration option which provides a more reliable strategy to prevent scripts from being executed in pages where they are not used.

  This replaces the `experimental.optimizeHoistedScript` flag introduced in v2.10.4 to prevent unused components' scripts from being included in a page unexpectedly. That experimental option no longer exists and must be removed from your configuration, whether or not you enable `directRenderScript`:

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	experimental: {
  -		optimizeHoistedScript: true,
  +		directRenderScript: true
  	}
  });
  ```

  With `experimental.directRenderScript` configured, scripts are now directly rendered as declared in Astro files (including existing features like TypeScript, importing `node_modules`, and deduplicating scripts). You can also now conditionally render scripts in your Astro file.

  However, this means scripts are no longer hoisted to the `<head>` and multiple scripts on a page are no longer bundled together. If you enable this option, you should check that all your `<script>` tags behave as expected.

  This option will be enabled by default in Astro 5.0.

- [#10130](https://github.com/withastro/astro/pull/10130) [`5a9528741fa98d017b269c7e4f013058028bdc5d`](https://github.com/withastro/astro/commit/5a9528741fa98d017b269c7e4f013058028bdc5d) Thanks [@bluwy](https://github.com/bluwy)! - Stabilizes `markdown.shikiConfig.experimentalThemes` as `markdown.shikiConfig.themes`. No behaviour changes are made to this option.

- [#10189](https://github.com/withastro/astro/pull/10189) [`1ea0a25b94125e4f6f2ac82b42f638e22d7bdffd`](https://github.com/withastro/astro/commit/1ea0a25b94125e4f6f2ac82b42f638e22d7bdffd) Thanks [@peng](https://github.com/peng)! - Adds the option to pass an object to `build.assetsPrefix`. This allows for the use of multiple CDN prefixes based on the target file type.

  When passing an object to `build.assetsPrefix`, you must also specify a `fallback` domain to be used for all other file types not specified.

  Specify a file extension as the key (e.g. 'js', 'png') and the URL serving your assets of that file type as the value:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    build: {
      assetsPrefix: {
        js: 'https://js.cdn.example.com',
        mjs: 'https://js.cdn.example.com', // if you have .mjs files, you must add a new entry like this
        png: 'https://images.cdn.example.com',
        fallback: 'https://generic.cdn.example.com',
      },
    },
  });
  ```

- [#10252](https://github.com/withastro/astro/pull/10252) [`3307cb34f17159dfd3f03144697040fcaa10e903`](https://github.com/withastro/astro/commit/3307cb34f17159dfd3f03144697040fcaa10e903) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for emitting warning and info notifications from dev toolbar apps.

  When using the `toggle-notification` event, the severity can be specified through `detail.level`:

  ```ts
  eventTarget.dispatchEvent(
    new CustomEvent('toggle-notification', {
      detail: {
        level: 'warning',
      },
    }),
  );
  ```

- [#10186](https://github.com/withastro/astro/pull/10186) [`959ca5f9f86ef2c0a5a23080cc01c25f53d613a9`](https://github.com/withastro/astro/commit/959ca5f9f86ef2c0a5a23080cc01c25f53d613a9) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds the ability to set colors on all the included UI elements for dev toolbar apps. Previously, only badge and buttons could be customized.

- [#10136](https://github.com/withastro/astro/pull/10136) [`9cd84bd19b92fb43ae48809f575ee12ebd43ea8f`](https://github.com/withastro/astro/commit/9cd84bd19b92fb43ae48809f575ee12ebd43ea8f) Thanks [@matthewp](https://github.com/matthewp)! - Changes the default behavior of `transition:persist` to update the props of persisted islands upon navigation. Also adds a new view transitions option `transition:persist-props` (default: `false`) to prevent props from updating as needed.

  Islands which have the `transition:persist` property to keep their state when using the `<ViewTransitions />` router will now have their props updated upon navigation. This is useful in cases where the component relies on page-specific props, such as the current page title, which should update upon navigation.

  For example, the component below is set to persist across navigation. This component receives a `products` props and might have some internal state, such as which filters are applied:

  ```astro
  <ProductListing transition:persist products={products} />
  ```

  Upon navigation, this component persists, but the desired `products` might change, for example if you are visiting a category of products, or you are performing a search.

  Previously the props would not change on navigation, and your island would have to handle updating them externally, such as with API calls.

  With this change the props are now updated, while still preserving state.

  You can override this new default behavior on a per-component basis using `transition:persist-props=true` to persist both props and state during navigation:

  ```astro
  <ProductListing transition:persist-props="true" products={products} />
  ```

- [#9977](https://github.com/withastro/astro/pull/9977) [`0204b7de37bf626e1b97175b605adbf91d885386`](https://github.com/withastro/astro/commit/0204b7de37bf626e1b97175b605adbf91d885386) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Supports adding the `data-astro-rerun` attribute on script tags so that they will be re-executed after view transitions

  ```html
  <script is:inline data-astro-rerun>
    ...
  </script>
  ```

- [#10145](https://github.com/withastro/astro/pull/10145) [`65692fa7b5f4440c644c8cf3dd9bc50103d2c33b`](https://github.com/withastro/astro/commit/65692fa7b5f4440c644c8cf3dd9bc50103d2c33b) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Adds experimental JSON Schema support for content collections.

  This feature will auto-generate a JSON Schema for content collections of `type: 'data'` which can be used as the `$schema` value for TypeScript-style autocompletion/hints in tools like VSCode.

  To enable this feature, add the experimental flag:

  ```diff
  import { defineConfig } from 'astro/config';

  export default defineConfig({
  	experimental: {
  +		contentCollectionJsonSchema: true
  	}
  });
  ```

  This experimental implementation requires you to manually reference the schema in each data entry file of the collection:

  ```diff
  // src/content/test/entry.json
  {
  +  "$schema": "../../../.astro/collections/test.schema.json",
    "test": "test"
  }
  ```

  Alternatively, you can set this in your [VSCode `json.schemas` settings](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings):

  ```diff
  "json.schemas": [
    {
      "fileMatch": [
        "/src/content/test/**"
      ],
      "url": "../../../.astro/collections/test.schema.json"
    }
  ]
  ```

  Note that this initial implementation uses a library with [known issues for advanced Zod schemas](https://github.com/StefanTerdell/zod-to-json-schema#known-issues), so you may wish to consult these limitations before enabling the experimental flag.

- [#10130](https://github.com/withastro/astro/pull/10130) [`5a9528741fa98d017b269c7e4f013058028bdc5d`](https://github.com/withastro/astro/commit/5a9528741fa98d017b269c7e4f013058028bdc5d) Thanks [@bluwy](https://github.com/bluwy)! - Migrates `shikiji` to `shiki` 1.0

- [#10268](https://github.com/withastro/astro/pull/10268) [`2013e70bce16366781cc12e52823bb257fe460c0`](https://github.com/withastro/astro/commit/2013e70bce16366781cc12e52823bb257fe460c0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds support for page mutations to the audits in the dev toolbar. Astro will now rerun the audits whenever elements are added or deleted from the page.

- [#10217](https://github.com/withastro/astro/pull/10217) [`5c7862a9fe69954f8630538ebb7212cd04b8a810`](https://github.com/withastro/astro/commit/5c7862a9fe69954f8630538ebb7212cd04b8a810) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates the UI for dev toolbar audits with new information

### Patch Changes

- [#10360](https://github.com/withastro/astro/pull/10360) [`ac766647b0e6156b7c4a0bb9a11981fe168852d7`](https://github.com/withastro/astro/commit/ac766647b0e6156b7c4a0bb9a11981fe168852d7) Thanks [@nmattia](https://github.com/nmattia)! - Fixes an issue where some CLI commands attempted to directly read vite config files.

- [#10291](https://github.com/withastro/astro/pull/10291) [`8107a2721b6abb07c3120ac90e03c39f2a44ab0c`](https://github.com/withastro/astro/commit/8107a2721b6abb07c3120ac90e03c39f2a44ab0c) Thanks [@bluwy](https://github.com/bluwy)! - Treeshakes unused Astro component scoped styles

- [#10368](https://github.com/withastro/astro/pull/10368) [`78bafc5d661ff7dd071c241cb1303c4d8a774d21`](https://github.com/withastro/astro/commit/78bafc5d661ff7dd071c241cb1303c4d8a774d21) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updates the base `tsconfig.json` preset with `jsx: 'preserve'` in order to fix errors when importing Astro files inside `.js` and `.ts` files.

- Updated dependencies [[`c081adf998d30419fed97d8fccc11340cdc512e0`](https://github.com/withastro/astro/commit/c081adf998d30419fed97d8fccc11340cdc512e0), [`1ea0a25b94125e4f6f2ac82b42f638e22d7bdffd`](https://github.com/withastro/astro/commit/1ea0a25b94125e4f6f2ac82b42f638e22d7bdffd), [`5a9528741fa98d017b269c7e4f013058028bdc5d`](https://github.com/withastro/astro/commit/5a9528741fa98d017b269c7e4f013058028bdc5d), [`a31bbd7ff8f3ec62ee507f72d1d25140b82ffc18`](https://github.com/withastro/astro/commit/a31bbd7ff8f3ec62ee507f72d1d25140b82ffc18)]:
  - @astrojs/markdown-remark@4.3.0
  - @astrojs/internal-helpers@0.3.0

## 4.4.15

### Patch Changes

- [#10317](https://github.com/withastro/astro/pull/10317) [`33583e8b31ee8a33e26cf57f30bb422921f4745d`](https://github.com/withastro/astro/commit/33583e8b31ee8a33e26cf57f30bb422921f4745d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where elements slotted within interactive framework components disappeared after hydration.

## 4.4.14

### Patch Changes

- [#10355](https://github.com/withastro/astro/pull/10355) [`8ce9fffd44b0740621178d61fb1425bf4155c2d7`](https://github.com/withastro/astro/commit/8ce9fffd44b0740621178d61fb1425bf4155c2d7) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression where full dynamic routes were prioritized over partial dynamic routes. Now a route like `food-[name].astro` is matched **before** `[name].astro`.

- [#10356](https://github.com/withastro/astro/pull/10356) [`d121311a3f4b5345e344e31f75d4e7164d65f729`](https://github.com/withastro/astro/commit/d121311a3f4b5345e344e31f75d4e7164d65f729) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where `getCollection` might return `undefined` when content collection is empty

- [#10325](https://github.com/withastro/astro/pull/10325) [`f33cce8f6c3a2e17847658cdedb015bd93cc1ee3`](https://github.com/withastro/astro/commit/f33cce8f6c3a2e17847658cdedb015bd93cc1ee3) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where `ctx.site` included the configured `base` in API routes and middleware, unlike `Astro.site` in astro pages.

- [#10343](https://github.com/withastro/astro/pull/10343) [`f973aa9110592fa9017bbe84387f22c24a6d7159`](https://github.com/withastro/astro/commit/f973aa9110592fa9017bbe84387f22c24a6d7159) Thanks [@ematipico](https://github.com/ematipico)! - Fixes some false positive in the dev toolbar a11y audits, by adding the `a` element to the list of interactive elements.

- [#10295](https://github.com/withastro/astro/pull/10295) [`fdd5bf277e5c1cfa30c1bd2ca123f4e90e8d09d9`](https://github.com/withastro/astro/commit/fdd5bf277e5c1cfa30c1bd2ca123f4e90e8d09d9) Thanks [@rossrobino](https://github.com/rossrobino)! - Adds a prefetch fallback when using the `experimental.clientPrerender` option. If prerendering fails, which can happen if [Chrome extensions block prerendering](https://developer.chrome.com/blog/speculation-rules-improvements#chrome-limits), it will fallback to prefetching the URL. This works by adding a `prefetch` field to the `speculationrules` script, but does not create an extra request.

## 4.4.13

### Patch Changes

- [#10342](https://github.com/withastro/astro/pull/10342) [`a2e9b2b936666b2a4779feb00dcb8ff0ab82c2ec`](https://github.com/withastro/astro/commit/a2e9b2b936666b2a4779feb00dcb8ff0ab82c2ec) Thanks [@matthewp](https://github.com/matthewp)! - Fixes @astrojs/db loading TS in the fixtures

## 4.4.12

### Patch Changes

- [#10336](https://github.com/withastro/astro/pull/10336) [`f2e60a96754ed1d86001fe4d5d3a0c0ef657408d`](https://github.com/withastro/astro/commit/f2e60a96754ed1d86001fe4d5d3a0c0ef657408d) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fixes an issue where slotting interactive components within a "client:only" component prevented all component code in the page from running.

## 4.4.11

### Patch Changes

- [#10281](https://github.com/withastro/astro/pull/10281) [`9deb919ff95b1d2ffe5a5f70ec683e32ebfafd05`](https://github.com/withastro/astro/commit/9deb919ff95b1d2ffe5a5f70ec683e32ebfafd05) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where `404.astro` was ignored with `i18n` routing enabled.

- [#10279](https://github.com/withastro/astro/pull/10279) [`9ba3e2605daee3861e3bf6c5768f1d8bced4709d`](https://github.com/withastro/astro/commit/9ba3e2605daee3861e3bf6c5768f1d8bced4709d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where returning redirect responses resulted in missing files with certain adapters.

- [#10319](https://github.com/withastro/astro/pull/10319) [`19ecccedaab6d8fa0ff23711c88fa7d4fa34df38`](https://github.com/withastro/astro/commit/19ecccedaab6d8fa0ff23711c88fa7d4fa34df38) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where streaming SSR responses sometimes failed with "`iterator.result` is not a function" on node-based adapters.

- [#10302](https://github.com/withastro/astro/pull/10302) [`992537e79f1847b590a2e226aac88a47a6304f68`](https://github.com/withastro/astro/commit/992537e79f1847b590a2e226aac88a47a6304f68) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Fixes an issue that causes static entrypoints build to fail because of the path in certain conditions. Specifically, it failed if the path had an extension (like `.astro`, `.mdx` etc) and such extension would be also within the path (like `./.astro/index.astro`).

- [#10298](https://github.com/withastro/astro/pull/10298) [`819d20a89c0d269333c2d397c1080884f516307a`](https://github.com/withastro/astro/commit/819d20a89c0d269333c2d397c1080884f516307a) Thanks [@Fryuni](https://github.com/Fryuni)! - Fix an incorrect conflict resolution between pages generated from static routes and rest parameters

## 4.4.10

### Patch Changes

- [#10235](https://github.com/withastro/astro/pull/10235) [`4bc360cd5f25496aca3232f6efb3710424a14a34`](https://github.com/withastro/astro/commit/4bc360cd5f25496aca3232f6efb3710424a14a34) Thanks [@sanman1k98](https://github.com/sanman1k98)! - Fixes jerky scrolling on IOS when using view transitions.

## 4.4.9

### Patch Changes

- [#10278](https://github.com/withastro/astro/pull/10278) [`a548a3a99c2835c19662fc38636f92b2bda26614`](https://github.com/withastro/astro/commit/a548a3a99c2835c19662fc38636f92b2bda26614) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes original images sometimes being kept / deleted when they shouldn't in both MDX and Markdoc

- [#10280](https://github.com/withastro/astro/pull/10280) [`3488be9b59d1cb65325b0e087c33bcd74aaa4926`](https://github.com/withastro/astro/commit/3488be9b59d1cb65325b0e087c33bcd74aaa4926) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Finalize db API to a shared db/ directory.

## 4.4.8

### Patch Changes

- [#10275](https://github.com/withastro/astro/pull/10275) [`5e3e74b61daa2ba44c761c9ab5745818661a656e`](https://github.com/withastro/astro/commit/5e3e74b61daa2ba44c761c9ab5745818661a656e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes dev toolbar warning about using the proper loading attributes on images using `data:` URIs

## 4.4.7

### Patch Changes

- [#10274](https://github.com/withastro/astro/pull/10274) [`e556151603a2f0173059d0f98fdcbec0610b48ff`](https://github.com/withastro/astro/commit/e556151603a2f0173059d0f98fdcbec0610b48ff) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression introduced in v4.4.5 where image optimization did not work in dev mode when a base was configured.

- [#10263](https://github.com/withastro/astro/pull/10263) [`9bdbed723e0aa4243d7d6ee64d1c1df3b75b9aeb`](https://github.com/withastro/astro/commit/9bdbed723e0aa4243d7d6ee64d1c1df3b75b9aeb) Thanks [@martrapp](https://github.com/martrapp)! - Adds auto completion for `astro:` event names when adding or removing event listeners on `document`.

- [#10284](https://github.com/withastro/astro/pull/10284) [`07f89429a1ef5173d3321e0b362a9dc71fc74fe5`](https://github.com/withastro/astro/commit/07f89429a1ef5173d3321e0b362a9dc71fc74fe5) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes an issue where in Node SSR, the image endpoint could be used maliciously to reveal unintended information about the underlying system.

  Thanks to Google Security Team for reporting this issue.

## 4.4.6

### Patch Changes

- [#10247](https://github.com/withastro/astro/pull/10247) [`fb773c9161bf8faa5ebd7e115f3564c3359e56ea`](https://github.com/withastro/astro/commit/fb773c9161bf8faa5ebd7e115f3564c3359e56ea) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue where `transition:animate="none"` still allowed the browser-native morph animation.

- [#10248](https://github.com/withastro/astro/pull/10248) [`8ae5d99534fc09d650e10e64a09b61a2807574f2`](https://github.com/withastro/astro/commit/8ae5d99534fc09d650e10e64a09b61a2807574f2) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where multiple injected routes with the same `entrypoint` but different `pattern` were incorrectly cached, causing some of them not being rendered in the dev server.

- [#10250](https://github.com/withastro/astro/pull/10250) [`57655a99db34e20e9661c039fab253b867013318`](https://github.com/withastro/astro/commit/57655a99db34e20e9661c039fab253b867013318) Thanks [@log101](https://github.com/log101)! - Fixes the overwriting of localised index pages with redirects

- [#10239](https://github.com/withastro/astro/pull/10239) [`9c21a9df6b03e36bd78dc553e13c55b9ef8c44cd`](https://github.com/withastro/astro/commit/9c21a9df6b03e36bd78dc553e13c55b9ef8c44cd) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Improves the message of `MiddlewareCantBeLoaded` for clarity

- [#10222](https://github.com/withastro/astro/pull/10222) [`ade9759cae74ca262b988260250bcb202235e811`](https://github.com/withastro/astro/commit/ade9759cae74ca262b988260250bcb202235e811) Thanks [@martrapp](https://github.com/martrapp)! - Adds a warning in DEV mode when using view transitions on a device with prefer-reduced-motion enabled.

- [#10251](https://github.com/withastro/astro/pull/10251) [`9b00de0a76b4f4b5b808e8c78e4906a2497e8ecf`](https://github.com/withastro/astro/commit/9b00de0a76b4f4b5b808e8c78e4906a2497e8ecf) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes TypeScript type definitions for `Code` component `theme` and `experimentalThemes` props

## 4.4.5

### Patch Changes

- [#10221](https://github.com/withastro/astro/pull/10221) [`4db82d9c7dce3b73fe43b86020fcfa326c1357ec`](https://github.com/withastro/astro/commit/4db82d9c7dce3b73fe43b86020fcfa326c1357ec) Thanks [@matthewp](https://github.com/matthewp)! - Prevents errors in templates from crashing the server

- [#10219](https://github.com/withastro/astro/pull/10219) [`afcb9d331179287629b5ffce4020931258bebefa`](https://github.com/withastro/astro/commit/afcb9d331179287629b5ffce4020931258bebefa) Thanks [@matthewp](https://github.com/matthewp)! - Fix dynamic slots missing hydration scripts

- [#10220](https://github.com/withastro/astro/pull/10220) [`1eadb1c5290f2f4baf538c34889a09d5fcfb9bd4`](https://github.com/withastro/astro/commit/1eadb1c5290f2f4baf538c34889a09d5fcfb9bd4) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes some built-in apps of the dev toolbar not closing when clicking the page

- [#10154](https://github.com/withastro/astro/pull/10154) [`e64bd0740b44aed5cfaf67e5c37a1c56ed4442f4`](https://github.com/withastro/astro/commit/e64bd0740b44aed5cfaf67e5c37a1c56ed4442f4) Thanks [@Cherry](https://github.com/Cherry)! - Fixes an issue where `config.vite.build.assetsInlineLimit` could not be set as a function.

- [#10196](https://github.com/withastro/astro/pull/10196) [`8fb32f390d40cfa12a82c0645928468d27218866`](https://github.com/withastro/astro/commit/8fb32f390d40cfa12a82c0645928468d27218866) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where a warning about headers being accessed in static mode is unnecessarily shown when i18n is enabled.

- [#10199](https://github.com/withastro/astro/pull/10199) [`6aa660ae7abc6841d7a3396b29f10b9fb7910ce5`](https://github.com/withastro/astro/commit/6aa660ae7abc6841d7a3396b29f10b9fb7910ce5) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where prerendered pages had access to query params in dev mode.

## 4.4.4

### Patch Changes

- [#10195](https://github.com/withastro/astro/pull/10195) [`903eace233033998811b72e27a54c80d8e59ff37`](https://github.com/withastro/astro/commit/903eace233033998811b72e27a54c80d8e59ff37) Thanks [@1574242600](https://github.com/1574242600)! - Fix build failure caused by read-only files under /public (in the presence of client-side JS).

- [#10205](https://github.com/withastro/astro/pull/10205) [`459f74bc71748279fe7dce0688f38bd74b51c5c1`](https://github.com/withastro/astro/commit/459f74bc71748279fe7dce0688f38bd74b51c5c1) Thanks [@martrapp](https://github.com/martrapp)! - Adds an error message for non-string transition:name values

- [#10208](https://github.com/withastro/astro/pull/10208) [`8cd38f02456640c063552aef00b2b8a216b3935d`](https://github.com/withastro/astro/commit/8cd38f02456640c063552aef00b2b8a216b3935d) Thanks [@log101](https://github.com/log101)! - Fixes custom headers are not added to the Node standalone server responses in preview mode

## 4.4.3

### Patch Changes

- [#10143](https://github.com/withastro/astro/pull/10143) [`7c5fcd2fa817472f480bbfbbc11b9ed71a7210ab`](https://github.com/withastro/astro/commit/7c5fcd2fa817472f480bbfbbc11b9ed71a7210ab) Thanks [@bluwy](https://github.com/bluwy)! - Improves the default `optimizeDeps.entries` Vite config to avoid globbing server endpoints, and respect the `srcDir` option

- [#10197](https://github.com/withastro/astro/pull/10197) [`c856c729404196900a7386c8426b81e79684a6a9`](https://github.com/withastro/astro/commit/c856c729404196900a7386c8426b81e79684a6a9) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes errors being logged twice in some cases

- [#10166](https://github.com/withastro/astro/pull/10166) [`598f30c7cd6c88558e3806d9bc5a15d426d83992`](https://github.com/withastro/astro/commit/598f30c7cd6c88558e3806d9bc5a15d426d83992) Thanks [@bluwy](https://github.com/bluwy)! - Improves Astro style tag HMR when updating imported styles

- [#10194](https://github.com/withastro/astro/pull/10194) [`3cc20109277813ccb9578ca87a8b0d680a73c35c`](https://github.com/withastro/astro/commit/3cc20109277813ccb9578ca87a8b0d680a73c35c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes an issue related to content collections usage in browser context caused by `csssec`

## 4.4.2

### Patch Changes

- [#10169](https://github.com/withastro/astro/pull/10169) [`a46249173edde66b03c19441144272baa8394fb4`](https://github.com/withastro/astro/commit/a46249173edde66b03c19441144272baa8394fb4) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue with the `i18n.routing` types, where an internal transformation was causing the generation of incorrect types for integrations.

## 4.4.1

### Patch Changes

- [#9795](https://github.com/withastro/astro/pull/9795) [`5acc3135ba5309a566def466fbcbabd23f70cd68`](https://github.com/withastro/astro/commit/5acc3135ba5309a566def466fbcbabd23f70cd68) Thanks [@lilnasy](https://github.com/lilnasy)! - Refactors internals relating to middleware, endpoints, and page rendering.

- [#10105](https://github.com/withastro/astro/pull/10105) [`1f598b372410066c6fcd41cba9915f6aaf7befa8`](https://github.com/withastro/astro/commit/1f598b372410066c6fcd41cba9915f6aaf7befa8) Thanks [@negativems](https://github.com/negativems)! - Fixes an issue where some astro commands failed if the astro config file or an integration used the global `crypto` object.

- [#10165](https://github.com/withastro/astro/pull/10165) [`d50dddb71d87ce5b7928920f10eb4946a5339f86`](https://github.com/withastro/astro/commit/d50dddb71d87ce5b7928920f10eb4946a5339f86) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the `i18n.routing` object had all its fields defined as mandatory. Now they all are optionals and shouldn't break when using `astro.config.mts`.

- [#10132](https://github.com/withastro/astro/pull/10132) [`1da9c5f2f3fe70b0206d1b3e0c01744fa40d511c`](https://github.com/withastro/astro/commit/1da9c5f2f3fe70b0206d1b3e0c01744fa40d511c) Thanks [@bluwy](https://github.com/bluwy)! - Simplifies internal Vite preview server teardown

- [#10163](https://github.com/withastro/astro/pull/10163) [`b92d35f1026f3e99abb888d1a845bdda4efdc327`](https://github.com/withastro/astro/commit/b92d35f1026f3e99abb888d1a845bdda4efdc327) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where audit fails to initialize when encountered `<a>` inside `<svg>`

- [#10079](https://github.com/withastro/astro/pull/10079) [`80f8996514e6d0546e94bd927650cd4ab2f1fa2f`](https://github.com/withastro/astro/commit/80f8996514e6d0546e94bd927650cd4ab2f1fa2f) Thanks [@ktym4a](https://github.com/ktym4a)! - Fix integrationData fetch to always be called even if View Transition is enabled.

- [#10139](https://github.com/withastro/astro/pull/10139) [`3c73441eb2eaba767d6dad1b30c0353195d28791`](https://github.com/withastro/astro/commit/3c73441eb2eaba767d6dad1b30c0353195d28791) Thanks [@bluwy](https://github.com/bluwy)! - Fixes style-only change detection for Astro files if both the markup and styles are updated

## 4.4.0

### Minor Changes

- [#9614](https://github.com/withastro/astro/pull/9614) [`d469bebd7b45b060dc41d82ab1cf18ee6de7e051`](https://github.com/withastro/astro/commit/d469bebd7b45b060dc41d82ab1cf18ee6de7e051) Thanks [@matthewp](https://github.com/matthewp)! - Improves Node.js streaming performance.

  This uses an `AsyncIterable` instead of a `ReadableStream` to do streaming in Node.js. This is a non-standard enhancement by Node, which is done only in that environment.

- [#10001](https://github.com/withastro/astro/pull/10001) [`748b2e87cd44d8bcc1ab9d7e504703057e2000cd`](https://github.com/withastro/astro/commit/748b2e87cd44d8bcc1ab9d7e504703057e2000cd) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Removes content collection warning when a configured collection does not have a matching directory name. This should resolve `i18n` collection warnings for Starlight users.

  This also ensures configured collection names are always included in `getCollection()` and `getEntry()` types even when a matching directory is absent. We hope this allows users to discover typos during development by surfacing type information.

- [#10074](https://github.com/withastro/astro/pull/10074) [`7443929381b47db0639c49a4d32aec4177bd9102`](https://github.com/withastro/astro/commit/7443929381b47db0639c49a4d32aec4177bd9102) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add a UI showing the list of found problems when using the audit app in the dev toolbar

- [#10099](https://github.com/withastro/astro/pull/10099) [`b340f8fe3aaa81e38c4f1aa41498b159dc733d86`](https://github.com/withastro/astro/commit/b340f8fe3aaa81e38c4f1aa41498b159dc733d86) Thanks [@martrapp](https://github.com/martrapp)! - Fixes a regression where view transition names containing special characters such as spaces or punctuation stopped working.

  Regular use naming your transitions with `transition: name` is unaffected.

  However, this fix may result in breaking changes if your project relies on the particular character encoding strategy Astro uses to translate `transition:name` directives into values of the underlying CSS `view-transition-name` property. For example, `Welcome to Astro` is now encoded as `Welcome_20to_20Astro_2e`.

  This mainly affects spaces and punctuation marks but no Unicode characters with codes >= 128.

- [#9976](https://github.com/withastro/astro/pull/9976) [`91f75afbc642b6e73dd4ec18a1fe2c3128c68132`](https://github.com/withastro/astro/commit/91f75afbc642b6e73dd4ec18a1fe2c3128c68132) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Adds a new optional `astro:assets` image attribute `inferSize` for use with remote images.

  Remote images can now have their dimensions inferred just like local images. Setting `inferSize` to `true` allows you to use `getImage()` and the `<Image />` and `<Picture />` components without setting the `width` and `height` properties.

  ```astro
  ---
  import { Image, Picture, getImage } from 'astro:assets';
  const myPic = await getImage({ src: 'https://example.com/example.png', inferSize: true });
  ---

  <Image src="https://example.com/example.png" inferSize alt="" />
  <Picture src="https://example.com/example.png" inferSize alt="" />
  ```

  Read more about [using `inferSize` with remote images](https://docs.astro.build/en/guides/images/#infersize) in our documentation.

- [#10015](https://github.com/withastro/astro/pull/10015) [`6884b103c8314a43e926c6acdf947cbf812a21f4`](https://github.com/withastro/astro/commit/6884b103c8314a43e926c6acdf947cbf812a21f4) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds initial support for performance audits to the dev toolbar

### Patch Changes

- [#10116](https://github.com/withastro/astro/pull/10116) [`4bcc249a9f34aaac59658ca626c828bd6dbb8046`](https://github.com/withastro/astro/commit/4bcc249a9f34aaac59658ca626c828bd6dbb8046) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where the dev server froze when typescript aliases were used.

- [#10096](https://github.com/withastro/astro/pull/10096) [`227cd83a51bbd451dc223fd16f4cf1b87b8e44f8`](https://github.com/withastro/astro/commit/227cd83a51bbd451dc223fd16f4cf1b87b8e44f8) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes regression on routing priority for multi-layer index pages

  The sorting algorithm positions more specific routes before less specific routes, and considers index pages to be more specific than a dynamic route with a rest parameter inside of it.
  This means that `/blog` is considered more specific than `/blog/[...slug]`.

  But this special case was being applied incorrectly to indexes, which could cause a problem in scenarios like the following:
  - `/`
  - `/blog`
  - `/blog/[...slug]`

  The algorithm would make the following comparisons:
  - `/` is more specific than `/blog` (incorrect)
  - `/blog/[...slug]` is more specific than `/` (correct)
  - `/blog` is more specific than `/blog/[...slug]` (correct)

  Although the incorrect first comparison is not a problem by itself, it could cause the algorithm to make the wrong decision.
  Depending on the other routes in the project, the sorting could perform just the last two comparisons and by transitivity infer the inverse of the third (`/blog/[...slug` > `/` > `/blog`), which is incorrect.

  Now the algorithm doesn't have a special case for index pages and instead does the comparison soleley for rest parameter segments and their immediate parents, which is consistent with the transitivity property.

- [#10120](https://github.com/withastro/astro/pull/10120) [`787e6f52470cf07fb50c865948b2bc8fe45a6d31`](https://github.com/withastro/astro/commit/787e6f52470cf07fb50c865948b2bc8fe45a6d31) Thanks [@bluwy](https://github.com/bluwy)! - Updates and supports Vite 5.1

- [#10096](https://github.com/withastro/astro/pull/10096) [`227cd83a51bbd451dc223fd16f4cf1b87b8e44f8`](https://github.com/withastro/astro/commit/227cd83a51bbd451dc223fd16f4cf1b87b8e44f8) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes edge case on i18n fallback routes

  Previously index routes deeply nested in the default locale, like `/some/nested/index.astro` could be mistaked as the root index for the default locale, resulting in an incorrect redirect on `/`.

- [#10112](https://github.com/withastro/astro/pull/10112) [`476b79a61165d0aac5e98459a4ec90762050a14b`](https://github.com/withastro/astro/commit/476b79a61165d0aac5e98459a4ec90762050a14b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Renames the home Astro Devoolbar App to `astro:home`

- [#10117](https://github.com/withastro/astro/pull/10117) [`51b6ff7403c1223b1c399e88373075972c82c24c`](https://github.com/withastro/astro/commit/51b6ff7403c1223b1c399e88373075972c82c24c) Thanks [@hippotastic](https://github.com/hippotastic)! - Fixes an issue where `create astro`, `astro add` and `@astrojs/upgrade` would fail due to unexpected package manager CLI output.

## 4.3.7

### Patch Changes

- [#9857](https://github.com/withastro/astro/pull/9857) [`73bd900754365b006ee730df9f379ba924e5b3fa`](https://github.com/withastro/astro/commit/73bd900754365b006ee730df9f379ba924e5b3fa) Thanks [@iamyunsin](https://github.com/iamyunsin)! - Fixes false positives in the dev overlay audit when multiple `role` values exist.

- [#10075](https://github.com/withastro/astro/pull/10075) [`71273edbb429b5afdba6f8ee14681b66e4c09ecc`](https://github.com/withastro/astro/commit/71273edbb429b5afdba6f8ee14681b66e4c09ecc) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves error messages for island hydration.

- [#10072](https://github.com/withastro/astro/pull/10072) [`8106178043050d142bf385bed2990730518f28e2`](https://github.com/withastro/astro/commit/8106178043050d142bf385bed2990730518f28e2) Thanks [@lilnasy](https://github.com/lilnasy)! - Clarifies error messages in endpoint routing.

- [#9971](https://github.com/withastro/astro/pull/9971) [`d9266c4467ca0faa1213c1a5995164e5655ab375`](https://github.com/withastro/astro/commit/d9266c4467ca0faa1213c1a5995164e5655ab375) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Fixes an issue where ReadableStream wasn't canceled in dev mode

## 4.3.6

### Patch Changes

- [#10063](https://github.com/withastro/astro/pull/10063) [`dac759798c111494e76affd2c2504d63944871fe`](https://github.com/withastro/astro/commit/dac759798c111494e76affd2c2504d63944871fe) Thanks [@marwan-mohamed12](https://github.com/marwan-mohamed12)! - Moves `shikiji-core` from `devDependencies` to `dependencies` to prevent type errors

- [#10067](https://github.com/withastro/astro/pull/10067) [`989ea63bb2a5a670021541198aa70b8dc7c4bd2f`](https://github.com/withastro/astro/commit/989ea63bb2a5a670021541198aa70b8dc7c4bd2f) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression in the `astro:i18n` module, where the functions `getAbsoluteLocaleUrl` and `getAbsoluteLocaleUrlList` returned a URL with double slash with a certain combination of options.

- [#10060](https://github.com/withastro/astro/pull/10060) [`1810309e65c596266355c3b7bb36cdac70f3305e`](https://github.com/withastro/astro/commit/1810309e65c596266355c3b7bb36cdac70f3305e) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where custom client directives added by integrations broke builds with a custom root.

- [#9991](https://github.com/withastro/astro/pull/9991) [`8fb67c81bb84530b39df4a1449c0862def0854af`](https://github.com/withastro/astro/commit/8fb67c81bb84530b39df4a1449c0862def0854af) Thanks [@ktym4a](https://github.com/ktym4a)! - Increases compatibility with standard browser behavior by changing where view transitions occur on browser back navigation.

## 4.3.5

### Patch Changes

- [#10022](https://github.com/withastro/astro/pull/10022) [`3fc76efb2a8faa47edf67562a1f0c84a19be1b33`](https://github.com/withastro/astro/commit/3fc76efb2a8faa47edf67562a1f0c84a19be1b33) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression where types for the `astro:content` module did not include required exports, leading to typescript errors.

- [#10016](https://github.com/withastro/astro/pull/10016) [`037e4f12dd2f460d66f72c9f2d992b95e74d2da9`](https://github.com/withastro/astro/commit/037e4f12dd2f460d66f72c9f2d992b95e74d2da9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where routes with a name that start with the name of the `i18n.defaultLocale` were incorrectly returning a 404 response.

## 4.3.4

### Patch Changes

- [#10013](https://github.com/withastro/astro/pull/10013) [`e6b5306a7de779ce495d0ff076d302de0aa57eaf`](https://github.com/withastro/astro/commit/e6b5306a7de779ce495d0ff076d302de0aa57eaf) Thanks [@delucis](https://github.com/delucis)! - Fixes a regression in content collection types

- [#10003](https://github.com/withastro/astro/pull/10003) [`ce4283331f18c6178654dd705e3cf02efeef004a`](https://github.com/withastro/astro/commit/ce4283331f18c6178654dd705e3cf02efeef004a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds support for `.strict()` on content collection schemas when a custom `slug` is present.

## 4.3.3

### Patch Changes

- [#9998](https://github.com/withastro/astro/pull/9998) [`18ac0940ea1b49b6b0ddd9be1f96aef416e2d7ee`](https://github.com/withastro/astro/commit/18ac0940ea1b49b6b0ddd9be1f96aef416e2d7ee) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug in `Astro.currentLocale` that wasn't returning the correct locale when a locale is configured via `path`

- [#9998](https://github.com/withastro/astro/pull/9998) [`18ac0940ea1b49b6b0ddd9be1f96aef416e2d7ee`](https://github.com/withastro/astro/commit/18ac0940ea1b49b6b0ddd9be1f96aef416e2d7ee) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a regression in `Astro.currentLocale` where it stopped working properly with dynamic routes

- [#9956](https://github.com/withastro/astro/pull/9956) [`81acac24a3cac5a9143155c1d9f838ea84a70421`](https://github.com/withastro/astro/commit/81acac24a3cac5a9143155c1d9f838ea84a70421) Thanks [@matthewp](https://github.com/matthewp)! - Fixes HMR for MDX dependencies in Content Collections

- [#9999](https://github.com/withastro/astro/pull/9999) [`c53a31321a935e4be04809046d7e0ba3cc41b272`](https://github.com/withastro/astro/commit/c53a31321a935e4be04809046d7e0ba3cc41b272) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Rollbacks the feature which allowed to dynamically generate slots with variable slot names due to unexpected regressions.

- [#9906](https://github.com/withastro/astro/pull/9906) [`3c0876cbed5033e6b5b42cc2b9d8b393d7e5a55e`](https://github.com/withastro/astro/commit/3c0876cbed5033e6b5b42cc2b9d8b393d7e5a55e) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Improves the types for the `astro:content` module by making low fidelity types available before running `astro sync`

## 4.3.2

### Patch Changes

- [#9932](https://github.com/withastro/astro/pull/9932) [`9f0d89fa7e9e7c08c8600b0c49c2cce7489a7582`](https://github.com/withastro/astro/commit/9f0d89fa7e9e7c08c8600b0c49c2cce7489a7582) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where a warning was logged even when the feature `i18nDomains` wasn't enabled

- [#9907](https://github.com/withastro/astro/pull/9907) [`6c894af5ab79f290f4ff7feb68617a66e91febc1`](https://github.com/withastro/astro/commit/6c894af5ab79f290f4ff7feb68617a66e91febc1) Thanks [@ktym4a](https://github.com/ktym4a)! - Load 404.html on all non-existent paths on astro preview.

## 4.3.1

### Patch Changes

- [#9841](https://github.com/withastro/astro/pull/9841) [`27ea080e24e2c5cdc59b63b1dfe0a83a0c696597`](https://github.com/withastro/astro/commit/27ea080e24e2c5cdc59b63b1dfe0a83a0c696597) Thanks [@kristianbinau](https://github.com/kristianbinau)! - Makes the warning clearer when having a custom `base` and requesting a public URL without it

- [#9888](https://github.com/withastro/astro/pull/9888) [`9d2fdb293d6a7323e10126cebad18ef9a2ea2800`](https://github.com/withastro/astro/commit/9d2fdb293d6a7323e10126cebad18ef9a2ea2800) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves error handling logic for the `astro sync` command.

- [#9918](https://github.com/withastro/astro/pull/9918) [`d52529e09450c84933dd15d6481edb32269f537b`](https://github.com/withastro/astro/commit/d52529e09450c84933dd15d6481edb32269f537b) Thanks [@LarryIVC](https://github.com/LarryIVC)! - Adds the `name` attribute to the `<details>` tag type

- [#9938](https://github.com/withastro/astro/pull/9938) [`1568afb78a163db63a4cde146dec87785a83db1d`](https://github.com/withastro/astro/commit/1568afb78a163db63a4cde146dec87785a83db1d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression where middleware did not run for prerendered pages and endpoints.

- [#9931](https://github.com/withastro/astro/pull/9931) [`44674418965d658733d3602668a9354e18f8ef89`](https://github.com/withastro/astro/commit/44674418965d658733d3602668a9354e18f8ef89) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes a regression where a response created with `Response.redirect` or containing `null` as the body never completed in node-based adapters.

## 4.3.0

### Minor Changes

- [#9839](https://github.com/withastro/astro/pull/9839) [`58f9e393a188702eef5329e41deff3dcb65a3230`](https://github.com/withastro/astro/commit/58f9e393a188702eef5329e41deff3dcb65a3230) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new `ComponentProps` type export from `astro/types` to get the props type of an Astro component.

  ```astro
  ---
  import type { ComponentProps } from 'astro/types';
  import Button from './Button.astro';

  type myButtonProps = ComponentProps<typeof Button>;
  ---
  ```

- [#9159](https://github.com/withastro/astro/pull/9159) [`7d937c158959e76443a02f740b10e251d14dbd8c`](https://github.com/withastro/astro/commit/7d937c158959e76443a02f740b10e251d14dbd8c) Thanks [@bluwy](https://github.com/bluwy)! - Adds CLI shortcuts as an easter egg for the dev server:
  - `o + enter`: opens the site in your browser
  - `q + enter`: quits the dev server
  - `h + enter`: prints all available shortcuts

- [#9764](https://github.com/withastro/astro/pull/9764) [`fad4f64aa149086feda2d1f3a0b655767034f1a8`](https://github.com/withastro/astro/commit/fad4f64aa149086feda2d1f3a0b655767034f1a8) Thanks [@matthewp](https://github.com/matthewp)! - Adds a new `build.format` configuration option: `'preserve'`. This option will preserve your source structure in the final build.

  The existing configuration options, `file` and `directory`, either build all of your HTML pages as files matching the route name (e.g. `/about.html`) or build all your files as `index.html` within a nested directory structure (e.g. `/about/index.html`), respectively. It was not previously possible to control the HTML file built on a per-file basis.

  One limitation of `build.format: 'file'` is that it cannot create `index.html` files for any individual routes (other than the base path of `/`) while otherwise building named files. Creating explicit index pages within your file structure still generates a file named for the page route (e.g. `src/pages/about/index.astro` builds `/about.html`) when using the `file` configuration option.

  Rather than make a breaking change to allow `build.format: 'file'` to be more flexible, we decided to create a new `build.format: 'preserve'`.

  The new format will preserve how the filesystem is structured and make sure that is mirrored over to production. Using this option:
  - `about.astro` becomes `about.html`
  - `about/index.astro` becomes `about/index.html`

  See the [`build.format` configuration options reference](https://docs.astro.build/en/reference/configuration-reference/#buildformat) for more details.

- [#9143](https://github.com/withastro/astro/pull/9143) [`041fdd5c89920f7ccf944b095f29e451f78b0e28`](https://github.com/withastro/astro/commit/041fdd5c89920f7ccf944b095f29e451f78b0e28) Thanks [@ematipico](https://github.com/ematipico)! - Adds experimental support for a new i18n domain routing option (`"domains"`) that allows you to configure different domains for individual locales in entirely server-rendered projects.

  To enable this in your project, first configure your `server`-rendered project's i18n routing with your preferences if you have not already done so. Then, set the `experimental.i18nDomains` flag to `true` and add `i18n.domains` to map any of your supported `locales` to custom URLs:

  ```js
  //astro.config.mjs"
  import { defineConfig } from 'astro/config';
  export default defineConfig({
    site: 'https://example.com',
    output: 'server', // required, with no prerendered pages
    adapter: node({
      mode: 'standalone',
    }),
    i18n: {
      defaultLocale: 'en',
      locales: ['es', 'en', 'fr', 'ja'],
      routing: {
        prefixDefaultLocale: false,
      },
      domains: {
        fr: 'https://fr.example.com',
        es: 'https://example.es',
      },
    },
    experimental: {
      i18nDomains: true,
    },
  });
  ```

  With `"domains"` configured, the URLs emitted by `getAbsoluteLocaleUrl()` and `getAbsoluteLocaleUrlList()` will use the options set in `i18n.domains`.

  ```js
  import { getAbsoluteLocaleUrl } from 'astro:i18n';

  getAbsoluteLocaleUrl('en', 'about'); // will return "https://example.com/about"
  getAbsoluteLocaleUrl('fr', 'about'); // will return "https://fr.example.com/about"
  getAbsoluteLocaleUrl('es', 'about'); // will return "https://example.es/about"
  getAbsoluteLocaleUrl('ja', 'about'); // will return "https://example.com/ja/about"
  ```

  Similarly, your localized files will create routes at corresponding URLs:
  - The file `/en/about.astro` will be reachable at the URL `https://example.com/about`.
  - The file `/fr/about.astro` will be reachable at the URL `https://fr.example.com/about`.
  - The file `/es/about.astro` will be reachable at the URL `https://example.es/about`.
  - The file `/ja/about.astro` will be reachable at the URL `https://example.com/ja/about`.

  See our [Internationalization Guide](https://docs.astro.build/en/guides/internationalization/#domains-experimental) for more details and limitations on this experimental routing feature.

- [#9755](https://github.com/withastro/astro/pull/9755) [`d4b886141bb342ac71b1c060e67d66ca2ffbb8bd`](https://github.com/withastro/astro/commit/d4b886141bb342ac71b1c060e67d66ca2ffbb8bd) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Fixes an issue where images in Markdown required a relative specifier (e.g. `./`)

  Now, you can use the standard `![](img.png)` syntax in Markdown files for images colocated in the same folder: no relative specifier required!

  There is no need to update your project; your existing images will still continue to work. However, you may wish to remove any relative specifiers from these Markdown images as they are no longer necessary:

  ```diff
  - ![A cute dog](./dog.jpg)
  + ![A cute dog](dog.jpg)
  <!-- This dog lives in the same folder as my article! -->
  ```

### Patch Changes

- [#9908](https://github.com/withastro/astro/pull/9908) [`2f6d1faa6f2d6de2d4ccd2a48adf5adadc82e593`](https://github.com/withastro/astro/commit/2f6d1faa6f2d6de2d4ccd2a48adf5adadc82e593) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves http behavior relating to errors encountered while streaming a response.

- [#9877](https://github.com/withastro/astro/pull/9877) [`7be5f94dcfc73a78d0fb301eeff51614d987a165`](https://github.com/withastro/astro/commit/7be5f94dcfc73a78d0fb301eeff51614d987a165) Thanks [@fabiankachlock](https://github.com/fabiankachlock)! - Fixes the content config type path on windows

- [#9143](https://github.com/withastro/astro/pull/9143) [`041fdd5c89920f7ccf944b095f29e451f78b0e28`](https://github.com/withastro/astro/commit/041fdd5c89920f7ccf944b095f29e451f78b0e28) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where the function `getLocaleRelativeUrlList` wasn't normalising the paths by default

- [#9911](https://github.com/withastro/astro/pull/9911) [`aaedb848b1d6f683840035865528506a346ea659`](https://github.com/withastro/astro/commit/aaedb848b1d6f683840035865528506a346ea659) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes an issue where some adapters that do not include a `start()` export would error rather than silently proceed

## 4.2.8

### Patch Changes

- [#9884](https://github.com/withastro/astro/pull/9884) [`37369550ab57ca529fd6c796e5b0e96e897ca6e5`](https://github.com/withastro/astro/commit/37369550ab57ca529fd6c796e5b0e96e897ca6e5) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where multiple cookies were sent in a single Set-Cookie header in the dev mode.

- [#9876](https://github.com/withastro/astro/pull/9876) [`e9027f194b939ac5a4d795ee1a2c24e4a6fbefc0`](https://github.com/withastro/astro/commit/e9027f194b939ac5a4d795ee1a2c24e4a6fbefc0) Thanks [@friedemannsommer](https://github.com/friedemannsommer)! - Fixes an issue where using `Response.redirect` in an endpoint led to an error.

- [#9882](https://github.com/withastro/astro/pull/9882) [`13c3b712c7ba45d0081f459fc06f142216a4ec59`](https://github.com/withastro/astro/commit/13c3b712c7ba45d0081f459fc06f142216a4ec59) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves handling of YAML parsing errors

- [#9878](https://github.com/withastro/astro/pull/9878) [`a40a0ff5883c7915dd55881dcebd052b9f94a0eb`](https://github.com/withastro/astro/commit/a40a0ff5883c7915dd55881dcebd052b9f94a0eb) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where setting trailingSlash to "never" had no effect on `Astro.url`.

## 4.2.7

### Patch Changes

- [#9840](https://github.com/withastro/astro/pull/9840) [`70fdf1a5c660057152c1ca111dcc89ceda5c8840`](https://github.com/withastro/astro/commit/70fdf1a5c660057152c1ca111dcc89ceda5c8840) Thanks [@delucis](https://github.com/delucis)! - Expose `ContentConfig` type from `astro:content`

- [#9865](https://github.com/withastro/astro/pull/9865) [`00ba9f1947ca9016cd0ee4d8f6048027fab2ab9a`](https://github.com/withastro/astro/commit/00ba9f1947ca9016cd0ee4d8f6048027fab2ab9a) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug in `Astro.currentLocale` where the value was incorrectly computed during the build.

- [#9838](https://github.com/withastro/astro/pull/9838) [`0a06d87a1e2b94be00a954f350c184222fa0594d`](https://github.com/withastro/astro/commit/0a06d87a1e2b94be00a954f350c184222fa0594d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where `astro:i18n` could not be used in framework components.

- Updated dependencies [[`44c957f893c6bf5f5b7c78301de7b21c5975584d`](https://github.com/withastro/astro/commit/44c957f893c6bf5f5b7c78301de7b21c5975584d)]:
  - @astrojs/markdown-remark@4.2.1

## 4.2.6

### Patch Changes

- [#9825](https://github.com/withastro/astro/pull/9825) [`e4370e9e9dd862425eced25823c82e77d9516927`](https://github.com/withastro/astro/commit/e4370e9e9dd862425eced25823c82e77d9516927) Thanks [@tugrulates](https://github.com/tugrulates)! - Fixes false positive aria role errors on interactive elements

- [#9828](https://github.com/withastro/astro/pull/9828) [`a3df9d83ca92abb5f08f576631019c1604204bd9`](https://github.com/withastro/astro/commit/a3df9d83ca92abb5f08f576631019c1604204bd9) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a case where shared modules among pages and middleware were transformed to a no-op after the build.

- [#9834](https://github.com/withastro/astro/pull/9834) [`1885cea308a62b173a50967cf5a0b174b3c3f3f1`](https://github.com/withastro/astro/commit/1885cea308a62b173a50967cf5a0b174b3c3f3f1) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes third-party dev toolbar apps not loading correctly when using absolute paths on Windows

## 4.2.5

### Patch Changes

- [#9818](https://github.com/withastro/astro/pull/9818) [`d688954c5adba75b0d676694fbf5fb0da1c0af13`](https://github.com/withastro/astro/commit/d688954c5adba75b0d676694fbf5fb0da1c0af13) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Improves the wording of a few confusing error messages

- [#9680](https://github.com/withastro/astro/pull/9680) [`5d7db1dbb0ff06db98e08b0ca241ff09d0b8b44d`](https://github.com/withastro/astro/commit/5d7db1dbb0ff06db98e08b0ca241ff09d0b8b44d) Thanks [@loucyx](https://github.com/loucyx)! - Fixes types generation from Content Collections config file

- [#9822](https://github.com/withastro/astro/pull/9822) [`bd880e8437ea2df16f322f604865c1148a9fd4cf`](https://github.com/withastro/astro/commit/bd880e8437ea2df16f322f604865c1148a9fd4cf) Thanks [@liruifengv](https://github.com/liruifengv)! - Applies the correct escaping to identifiers used with `transition:name`.

- [#9830](https://github.com/withastro/astro/pull/9830) [`f3d22136e53fd902310024519fc4de83f0a58039`](https://github.com/withastro/astro/commit/f3d22136e53fd902310024519fc4de83f0a58039) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where 404 responses from endpoints were replaced with contents of 404.astro in dev mode.

- [#9816](https://github.com/withastro/astro/pull/9816) [`2a44c8f93201958fba2d1e83046eabcaef186b7c`](https://github.com/withastro/astro/commit/2a44c8f93201958fba2d1e83046eabcaef186b7c) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds telemetry for when apps are toggled in the dev toolbar. This data is completely anonymous and only the names of built-in apps are shared with us. This data will help us monitor how much the dev toolbar is used and which apps are used more. For more information on how Astro collects telemetry, visit the following page: https://astro.build/telemetry/

- [#9807](https://github.com/withastro/astro/pull/9807) [`b3f313138bb314e2b416c29cda507383c2a9f816`](https://github.com/withastro/astro/commit/b3f313138bb314e2b416c29cda507383c2a9f816) Thanks [@bluwy](https://github.com/bluwy)! - Fixes environment variables replacement for `export const prerender`

- [#9790](https://github.com/withastro/astro/pull/9790) [`267c5aa2c7706f0ea3447f20a09d85aa560866ad`](https://github.com/withastro/astro/commit/267c5aa2c7706f0ea3447f20a09d85aa560866ad) Thanks [@lilnasy](https://github.com/lilnasy)! - Refactors internals of the `astro:i18n` module to be more maintainable.

- [#9776](https://github.com/withastro/astro/pull/9776) [`dc75180aa698b298264362bab7f00391af427798`](https://github.com/withastro/astro/commit/dc75180aa698b298264362bab7f00391af427798) Thanks [@lilnasy](https://github.com/lilnasy)! - Simplifies internals that handle middleware.

## 4.2.4

### Patch Changes

- [#9792](https://github.com/withastro/astro/pull/9792) [`e22cb8b10c0ca9f6d88cab53cd2713f57875ab4b`](https://github.com/withastro/astro/commit/e22cb8b10c0ca9f6d88cab53cd2713f57875ab4b) Thanks [@tugrulates](https://github.com/tugrulates)! - Accept aria role `switch` on toolbar audit.

- [#9606](https://github.com/withastro/astro/pull/9606) [`e6945bcf23b6ad29388bbadaf5bb3cc31dd4a114`](https://github.com/withastro/astro/commit/e6945bcf23b6ad29388bbadaf5bb3cc31dd4a114) Thanks [@eryue0220](https://github.com/eryue0220)! - Fixes escaping behavior for `.html` files and components

- [#9786](https://github.com/withastro/astro/pull/9786) [`5b29550996a7f5459a0d611feea6e51d44e1d8ed`](https://github.com/withastro/astro/commit/5b29550996a7f5459a0d611feea6e51d44e1d8ed) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes a regression in routing priority for index pages in rest parameter folders and dynamic sibling trees.

  Considering the following tree:

  ```
  src/pages/
  ├── index.astro
  ├── static.astro
  ├── [dynamic_file].astro
  ├── [...rest_file].astro
  ├── blog/
  │   └── index.astro
  ├── [dynamic_folder]/
  │   ├── index.astro
  │   ├── static.astro
  │   └── [...rest].astro
  └── [...rest_folder]/
      ├── index.astro
      └── static.astro
  ```

  The routes are sorted in this order:

  ```
  /src/pages/index.astro
  /src/pages/blog/index.astro
  /src/pages/static.astro
  /src/pages/[dynamic_folder]/index.astro
  /src/pages/[dynamic_file].astro
  /src/pages/[dynamic_folder]/static.astro
  /src/pages/[dynamic_folder]/[...rest].astro
  /src/pages/[...rest_folder]/static.astro
  /src/pages/[...rest_folder]/index.astro
  /src/pages/[...rest_file]/index.astro
  ```

  This allows for index files to be used as overrides to rest parameter routes on SSR when the rest parameter matching `undefined` is not desired.

- [#9775](https://github.com/withastro/astro/pull/9775) [`075706f26d2e11e66ef8b52288d07e3c0fa97eb1`](https://github.com/withastro/astro/commit/075706f26d2e11e66ef8b52288d07e3c0fa97eb1) Thanks [@lilnasy](https://github.com/lilnasy)! - Simplifies internals that handle endpoints.

- [#9773](https://github.com/withastro/astro/pull/9773) [`9aa7a5368c502ae488d3a173e732d81f3d000e98`](https://github.com/withastro/astro/commit/9aa7a5368c502ae488d3a173e732d81f3d000e98) Thanks [@LunaticMuch](https://github.com/LunaticMuch)! - Raises the required vite version to address a vulnerability in `vite.server.fs.deny` that affected the dev mode.

- [#9781](https://github.com/withastro/astro/pull/9781) [`ccc05d54014e24c492ca5fddd4862f318aac8172`](https://github.com/withastro/astro/commit/ccc05d54014e24c492ca5fddd4862f318aac8172) Thanks [@stevenbenner](https://github.com/stevenbenner)! - Fix build failure when image file name includes special characters

## 4.2.3

### Patch Changes

- [#9768](https://github.com/withastro/astro/pull/9768) [`eed0e8757c35dde549707e71c45862438a043fb0`](https://github.com/withastro/astro/commit/eed0e8757c35dde549707e71c45862438a043fb0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix apps being able to crash the dev toolbar in certain cases

## 4.2.2

### Patch Changes

- [#9712](https://github.com/withastro/astro/pull/9712) [`ea6cbd06a2580527786707ec735079ff9abd0ec0`](https://github.com/withastro/astro/commit/ea6cbd06a2580527786707ec735079ff9abd0ec0) Thanks [@bluwy](https://github.com/bluwy)! - Improves HMR behavior for style-only changes in `.astro` files

- [#9739](https://github.com/withastro/astro/pull/9739) [`3ecb3ef64326a8f77aa170df1e3c89cb5c12cc93`](https://github.com/withastro/astro/commit/3ecb3ef64326a8f77aa170df1e3c89cb5c12cc93) Thanks [@ematipico](https://github.com/ematipico)! - Makes i18n redirects take the `build.format` configuration into account

- [#9762](https://github.com/withastro/astro/pull/9762) [`1fba85681e86aa83d24336d4209cafbc76b37607`](https://github.com/withastro/astro/commit/1fba85681e86aa83d24336d4209cafbc76b37607) Thanks [@ematipico](https://github.com/ematipico)! - Adds `popovertarget" to the attribute that can be passed to the `button` element

- [#9605](https://github.com/withastro/astro/pull/9605) [`8ce40a417c854d9e6a4fa7d5a85d50a6436b4a3c`](https://github.com/withastro/astro/commit/8ce40a417c854d9e6a4fa7d5a85d50a6436b4a3c) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Adds support for dynamic slot names

- [#9381](https://github.com/withastro/astro/pull/9381) [`9e01f9cc1efcfb938355829676d51b24818ab2bb`](https://github.com/withastro/astro/commit/9e01f9cc1efcfb938355829676d51b24818ab2bb) Thanks [@martrapp](https://github.com/martrapp)! - Improves the CLI output of `astro preferences list` to include additional relevant information

- [#9741](https://github.com/withastro/astro/pull/9741) [`73d74402007896204ee965f6553dc83b3dec8d2f`](https://github.com/withastro/astro/commit/73d74402007896204ee965f6553dc83b3dec8d2f) Thanks [@taktran](https://github.com/taktran)! - Fixes an issue where dot files were not copied over from the public folder to the output folder, when build command was run in a folder other than the root of the project.

- [#9730](https://github.com/withastro/astro/pull/9730) [`8d2e5db096f1e7b098511b4fe9357434a6ff0703`](https://github.com/withastro/astro/commit/8d2e5db096f1e7b098511b4fe9357434a6ff0703) Thanks [@Blede2000](https://github.com/Blede2000)! - Allow i18n routing utilities like getRelativeLocaleUrl to also get the default local path when redirectToDefaultLocale is false

- Updated dependencies [[`53c69dcc82cdf4000aff13a6c11fffe19096cf45`](https://github.com/withastro/astro/commit/53c69dcc82cdf4000aff13a6c11fffe19096cf45), [`2f81cffa9da9db0e2802d303f94feaee8d2f54ec`](https://github.com/withastro/astro/commit/2f81cffa9da9db0e2802d303f94feaee8d2f54ec), [`a505190933365268d48139a5f197a3cfb5570870`](https://github.com/withastro/astro/commit/a505190933365268d48139a5f197a3cfb5570870)]:
  - @astrojs/markdown-remark@4.2.0

## 4.2.1

### Patch Changes

- [#9726](https://github.com/withastro/astro/pull/9726) [`a4b696def3a7eb18c1ae48b10fd3758a1874b6fe`](https://github.com/withastro/astro/commit/a4b696def3a7eb18c1ae48b10fd3758a1874b6fe) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes a regression in routing priority between `index.astro` and dynamic routes with rest parameters

## 4.2.0

### Minor Changes

- [#9566](https://github.com/withastro/astro/pull/9566) [`165cfc154be477337037185c32b308616d1ed6fa`](https://github.com/withastro/astro/commit/165cfc154be477337037185c32b308616d1ed6fa) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Allows remark plugins to pass options specifying how images in `.md` files will be optimized

- [#9661](https://github.com/withastro/astro/pull/9661) [`d6edc7540864cf5d294d7b881eb886a3804f6d05`](https://github.com/withastro/astro/commit/d6edc7540864cf5d294d7b881eb886a3804f6d05) Thanks [@ematipico](https://github.com/ematipico)! - Adds new helper functions for adapter developers.
  - `Astro.clientAddress` can now be passed directly to the `app.render()` method.

  ```ts
  const response = await app.render(request, { clientAddress: '012.123.23.3' });
  ```

  - Helper functions for converting Node.js HTTP request and response objects to web-compatible `Request` and `Response` objects are now provided as static methods on the `NodeApp` class.

  ```ts
  http.createServer((nodeReq, nodeRes) => {
    const request: Request = NodeApp.createRequest(nodeReq);
    const response = await app.render(request);
    await NodeApp.writeResponse(response, nodeRes);
  });
  ```

  - Cookies added via `Astro.cookies.set()` can now be automatically added to the `Response` object by passing the `addCookieHeader` option to `app.render()`.

  ```diff
  -const response = await app.render(request)
  -const setCookieHeaders: Array<string> = Array.from(app.setCookieHeaders(webResponse));

  -if (setCookieHeaders.length) {
  -    for (const setCookieHeader of setCookieHeaders) {
  -        headers.append('set-cookie', setCookieHeader);
  -    }
  -}
  +const response = await app.render(request, { addCookieHeader: true })
  ```

- [#9638](https://github.com/withastro/astro/pull/9638) [`f1a61268061b8834f39a9b38bca043ae41caed04`](https://github.com/withastro/astro/commit/f1a61268061b8834f39a9b38bca043ae41caed04) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new `i18n.routing` config option `redirectToDefaultLocale` to disable automatic redirects of the root URL (`/`) to the default locale when `prefixDefaultLocale: true` is set.

  In projects where every route, including the default locale, is prefixed with `/[locale]/` path, this property allows you to control whether or not `src/pages/index.astro` should automatically redirect your site visitors from `/` to `/[defaultLocale]`.

  You can now opt out of this automatic redirection by setting `redirectToDefaultLocale: false`:

  ```js
  // astro.config.mjs
  export default defineConfig({
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'fr'],
      routing: {
        prefixDefaultLocale: true,
        redirectToDefaultLocale: false,
      },
    },
  });
  ```

- [#9671](https://github.com/withastro/astro/pull/9671) [`8521ff77fbf7e867701cc30d18253856914dbd1b`](https://github.com/withastro/astro/commit/8521ff77fbf7e867701cc30d18253856914dbd1b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Removes the requirement for non-content files and assets inside content collections to be prefixed with an underscore. For files with extensions like `.astro` or `.css`, you can now remove underscores without seeing a warning in the terminal.

  ```diff
  src/content/blog/
  post.mdx
  - _styles.css
  - _Component.astro
  + styles.css
  + Component.astro
  ```

  Continue to use underscores in your content collections to exclude individual content files, such as drafts, from the build output.

- [#9567](https://github.com/withastro/astro/pull/9567) [`3a4d5ec8001ebf95c917fdc0d186d29650533d93`](https://github.com/withastro/astro/commit/3a4d5ec8001ebf95c917fdc0d186d29650533d93) Thanks [@OliverSpeir](https://github.com/OliverSpeir)! - Improves the a11y-missing-content rule and error message for audit feature of dev-overlay. This also fixes an error where this check was falsely reporting accessibility errors.

- [#9643](https://github.com/withastro/astro/pull/9643) [`e9a72d9a91a3741566866bcaab11172cb0dc7d31`](https://github.com/withastro/astro/commit/e9a72d9a91a3741566866bcaab11172cb0dc7d31) Thanks [@blackmann](https://github.com/blackmann)! - Adds a new `markdown.shikiConfig.transformers` config option. You can use this option to transform the Shikiji hast (AST format of the generated HTML) to customize the final HTML. Also updates Shikiji to the latest stable version.

  See [Shikiji's documentation](https://shikiji.netlify.app/guide/transformers) for more details about creating your own custom transformers, and [a list of common transformers](https://shikiji.netlify.app/packages/transformers) you can add directly to your project.

- [#9644](https://github.com/withastro/astro/pull/9644) [`a5f1682347e602330246129d4666a9227374c832`](https://github.com/withastro/astro/commit/a5f1682347e602330246129d4666a9227374c832) Thanks [@rossrobino](https://github.com/rossrobino)! - Adds an experimental flag `clientPrerender` to prerender your prefetched pages on the client with the [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API).

  ```js
  // astro.config.mjs
  {
    prefetch: {
      prefetchAll: true,
      defaultStrategy: 'viewport',
    },
    experimental: {
      clientPrerender: true,
    },
  }
  ```

  Enabling this feature overrides the default `prefetch` behavior globally to prerender links on the client according to your `prefetch` configuration. Instead of appending a `<link>` tag to the head of the document or fetching the page with JavaScript, a `<script>` tag will be appended with the corresponding speculation rules.

  Client side prerendering requires browser support. If the Speculation Rules API is not supported, `prefetch` will fallback to the supported strategy.

  See the [Prefetch Guide](https://docs.astro.build/en/guides/prefetch/) for more `prefetch` options and usage.

- [#9439](https://github.com/withastro/astro/pull/9439) [`fd17f4a40b83d14350dce691aeb79d87e8fcaf40`](https://github.com/withastro/astro/commit/fd17f4a40b83d14350dce691aeb79d87e8fcaf40) Thanks [@Fryuni](https://github.com/Fryuni)! - Adds an experimental flag `globalRoutePriority` to prioritize redirects and injected routes equally alongside file-based project routes, following the same [route priority order rules](https://docs.astro.build/en/core-concepts/routing/#route-priority-order) for all routes.

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      globalRoutePriority: true,
    },
  });
  ```

  Enabling this feature ensures that all routes in your project follow the same, predictable route priority order rules. In particular, this avoids an issue where redirects or injected routes (e.g. from an integration) would always take precedence over local route definitions, making it impossible to override some routes locally.

  The following table shows which route builds certain page URLs when file-based routes, injected routes, and redirects are combined as shown below:
  - File-based route: `/blog/post/[pid]`
  - File-based route: `/[page]`
  - Injected route: `/blog/[...slug]`
  - Redirect: `/blog/tags/[tag]` -> `/[tag]`
  - Redirect: `/posts` -> `/blog`

  URLs are handled by the following routes:

  | Page               | Current Behavior                 | Global Routing Priority Behavior    |
  | ------------------ | -------------------------------- | ----------------------------------- |
  | `/blog/tags/astro` | Injected route `/blog/[...slug]` | Redirect to `/tags/[tag]`           |
  | `/blog/post/0`     | Injected route `/blog/[...slug]` | File-based route `/blog/post/[pid]` |
  | `/posts`           | File-based route `/[page]`       | Redirect to `/blog`                 |

  In the event of route collisions, where two routes of equal route priority attempt to build the same URL, Astro will log a warning identifying the conflicting routes.

### Patch Changes

- [#9719](https://github.com/withastro/astro/pull/9719) [`7e1db8b4ce2da9e044ea0393e533c6db2561ac90`](https://github.com/withastro/astro/commit/7e1db8b4ce2da9e044ea0393e533c6db2561ac90) Thanks [@bluwy](https://github.com/bluwy)! - Refactors Vite config to avoid Vite 5.1 warnings

- [#9439](https://github.com/withastro/astro/pull/9439) [`fd17f4a40b83d14350dce691aeb79d87e8fcaf40`](https://github.com/withastro/astro/commit/fd17f4a40b83d14350dce691aeb79d87e8fcaf40) Thanks [@Fryuni](https://github.com/Fryuni)! - Updates [Astro's routing priority rules](https://docs.astro.build/en/core-concepts/routing/#route-priority-order) to prioritize the most specifically-defined routes.

  Now, routes with **more defined path segments** will take precedence over less specific routes.

  For example, `/blog/posts/[pid].astro` (3 path segments) takes precedence over `/blog/[...slug].astro` (2 path segments). This means that:
  - `/pages/blog/posts/[id].astro` will build routes of the form `/blog/posts/1` and `/blog/posts/a`
  - `/pages/blog/[...slug].astro` will build routes of a variety of forms, including `blog/1` and `/blog/posts/1/a`, but will not build either of the previous routes.

  For a complete list of Astro's routing priority rules, please see the [routing guide](https://docs.astro.build/en/core-concepts/routing/#route-priority-order). This should not be a breaking change, but you may wish to inspect your built routes to ensure that your project is unaffected.

- [#9706](https://github.com/withastro/astro/pull/9706) [`1539e04a8e5865027b3a8718c6f142885e7c8d88`](https://github.com/withastro/astro/commit/1539e04a8e5865027b3a8718c6f142885e7c8d88) Thanks [@bluwy](https://github.com/bluwy)! - Simplifies HMR handling, improves circular dependency invalidation, and fixes Astro styles invalidation

- Updated dependencies [[`165cfc154be477337037185c32b308616d1ed6fa`](https://github.com/withastro/astro/commit/165cfc154be477337037185c32b308616d1ed6fa), [`e9a72d9a91a3741566866bcaab11172cb0dc7d31`](https://github.com/withastro/astro/commit/e9a72d9a91a3741566866bcaab11172cb0dc7d31)]:
  - @astrojs/markdown-remark@4.1.0

## 4.1.3

### Patch Changes

- [#9665](https://github.com/withastro/astro/pull/9665) [`d02a3c48a3ce204649d22e17b1e26fb5a6a60bcf`](https://github.com/withastro/astro/commit/d02a3c48a3ce204649d22e17b1e26fb5a6a60bcf) Thanks [@bluwy](https://github.com/bluwy)! - Disables internal file watcher for one-off Vite servers to improve start-up performance

- [#9664](https://github.com/withastro/astro/pull/9664) [`1bf0ddd2777ae5f9fde3fd854a9e75aa56c080f2`](https://github.com/withastro/astro/commit/1bf0ddd2777ae5f9fde3fd854a9e75aa56c080f2) Thanks [@bluwy](https://github.com/bluwy)! - Improves HMR for Astro style and script modules

- [#9668](https://github.com/withastro/astro/pull/9668) [`74008cc23853ed507b144efab02300202c5386ed`](https://github.com/withastro/astro/commit/74008cc23853ed507b144efab02300202c5386ed) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix the passthrough image service not generating `srcset` values properly

- [#9693](https://github.com/withastro/astro/pull/9693) [`d38b2a4fe827e956662fcf457d1f1f84832c2f15`](https://github.com/withastro/astro/commit/d38b2a4fe827e956662fcf457d1f1f84832c2f15) Thanks [@kidylee](https://github.com/kidylee)! - Disables View Transition form handling when the `action` property points to an external URL

- [#9678](https://github.com/withastro/astro/pull/9678) [`091097e60ef38dadb87d7c8c1fc9cb939a248921`](https://github.com/withastro/astro/commit/091097e60ef38dadb87d7c8c1fc9cb939a248921) Thanks [@ematipico](https://github.com/ematipico)! - Adds an error during the build phase in case `i18n.routing.prefixDefaultLocale` is set to `true` and the index page is missing.

- [#9659](https://github.com/withastro/astro/pull/9659) [`39050c6e1f77dc21e87716d95e627a654828ee74`](https://github.com/withastro/astro/commit/39050c6e1f77dc21e87716d95e627a654828ee74) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix Astro wrongfully deleting certain images imported with `?url` when used in tandem with `astro:assets`

- [#9685](https://github.com/withastro/astro/pull/9685) [`35d54b3ddb3310ab4c505d49bd4937b2d25e4078`](https://github.com/withastro/astro/commit/35d54b3ddb3310ab4c505d49bd4937b2d25e4078) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where anchor elements within a custom component could not trigger a view transition.

## 4.1.2

### Patch Changes

- [#9642](https://github.com/withastro/astro/pull/9642) [`cdb7bfa66260afc79b829b617492a01a709a86ef`](https://github.com/withastro/astro/commit/cdb7bfa66260afc79b829b617492a01a709a86ef) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue where View Transitions did not work when navigating to the 404 page

- [#9637](https://github.com/withastro/astro/pull/9637) [`5cba637c4ec39c06794146b0c7fd3225d26dcabb`](https://github.com/withastro/astro/commit/5cba637c4ec39c06794146b0c7fd3225d26dcabb) Thanks [@bluwy](https://github.com/bluwy)! - Improves environment variables replacement in SSR

- [#9658](https://github.com/withastro/astro/pull/9658) [`a3b5695176cd0280438938c1d6caef478a571415`](https://github.com/withastro/astro/commit/a3b5695176cd0280438938c1d6caef478a571415) Thanks [@martrapp](https://github.com/martrapp)! - Fixes an issue caused by trying to load text/partytown scripts during view transitions

- [#9657](https://github.com/withastro/astro/pull/9657) [`a4f90d95ff97abe59f2a1ef0956cab257ae36838`](https://github.com/withastro/astro/commit/a4f90d95ff97abe59f2a1ef0956cab257ae36838) Thanks [@ematipico](https://github.com/ematipico)! - Fixes a bug where the custom status code wasn't correctly computed in the dev server

- [#9627](https://github.com/withastro/astro/pull/9627) [`a700a20291e19cde23705e8e661e833aec7d3095`](https://github.com/withastro/astro/commit/a700a20291e19cde23705e8e661e833aec7d3095) Thanks [@lilnasy](https://github.com/lilnasy)! - Adds a warning when setting cookies will have no effect

- [#9652](https://github.com/withastro/astro/pull/9652) [`e72efd6a9a1e2a70488fd225529617ffd8418534`](https://github.com/withastro/astro/commit/e72efd6a9a1e2a70488fd225529617ffd8418534) Thanks [@bluwy](https://github.com/bluwy)! - Improves environment variables handling by using esbuild to perform replacements

- [#9560](https://github.com/withastro/astro/pull/9560) [`8b9c4844f7b302380835154fab1c3489979fc07d`](https://github.com/withastro/astro/commit/8b9c4844f7b302380835154fab1c3489979fc07d) Thanks [@bluwy](https://github.com/bluwy)! - Fixes tsconfig alias with import.meta.glob

- [#9653](https://github.com/withastro/astro/pull/9653) [`50f39183cfec4a4522c1f935d710e5d9b724993b`](https://github.com/withastro/astro/commit/50f39183cfec4a4522c1f935d710e5d9b724993b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Pin Sharp to 0.32.6 until we can raise our semver requirements. To use the latest version of Sharp, you can add it to your project's dependencies.

## 4.1.1

### Patch Changes

- [#9618](https://github.com/withastro/astro/pull/9618) [`401fd3e8c8957a3bed6469a622cd67b157ca303f`](https://github.com/withastro/astro/commit/401fd3e8c8957a3bed6469a622cd67b157ca303f) Thanks [@ldh3907](https://github.com/ldh3907)! - Adds a second generic parameter to `APIRoute` to type the `params`

- [#9600](https://github.com/withastro/astro/pull/9600) [`47b951b3888a5a8a708d2f9b974f12fba7ec9ed3`](https://github.com/withastro/astro/commit/47b951b3888a5a8a708d2f9b974f12fba7ec9ed3) Thanks [@jacobdalamb](https://github.com/jacobdalamb)! - Improves tailwind config file detection when adding the tailwind integration using `astro add tailwind`

  Tailwind config file ending in `.ts`, `.mts` or `.cts` will now be used instead of creating a new `tailwind.config.mjs` when the tailwind integration is added using `astro add tailwind`.

- [#9622](https://github.com/withastro/astro/pull/9622) [`5156c740506cbf6ec85c95e1663c14cbd438d75b`](https://github.com/withastro/astro/commit/5156c740506cbf6ec85c95e1663c14cbd438d75b) Thanks [@bluwy](https://github.com/bluwy)! - Fixes the Sharp image service `limitInputPixels` option type

## 4.1.0

### Minor Changes

- [#9513](https://github.com/withastro/astro/pull/9513) [`e44f6acf99195a3f29b8390fd9b2c06410551b74`](https://github.com/withastro/astro/commit/e44f6acf99195a3f29b8390fd9b2c06410551b74) Thanks [@wtto00](https://github.com/wtto00)! - Adds a `'load'` prefetch strategy to prefetch links on page load

- [#9377](https://github.com/withastro/astro/pull/9377) [`fe719e27a84c09e46b515252690678c174a25759`](https://github.com/withastro/astro/commit/fe719e27a84c09e46b515252690678c174a25759) Thanks [@bluwy](https://github.com/bluwy)! - Adds "Missing ARIA roles check" and "Unsupported ARIA roles check" audit rules for the dev toolbar

- [#9573](https://github.com/withastro/astro/pull/9573) [`2a8b9c56b9c6918531c57ec38b89474571331aee`](https://github.com/withastro/astro/commit/2a8b9c56b9c6918531c57ec38b89474571331aee) Thanks [@bluwy](https://github.com/bluwy)! - Allows passing a string to `--open` and `server.open` to open a specific URL on startup in development

- [#9544](https://github.com/withastro/astro/pull/9544) [`b8a6fa8917ff7babd35dafb3d3dcd9a58cee836d`](https://github.com/withastro/astro/commit/b8a6fa8917ff7babd35dafb3d3dcd9a58cee836d) Thanks [@bluwy](https://github.com/bluwy)! - Adds a helpful error for static sites when you use the `astro preview` command if you have not previously run `astro build`.

- [#9546](https://github.com/withastro/astro/pull/9546) [`08402ad5846c73b6887e74ed4575fd71a3e3c73d`](https://github.com/withastro/astro/commit/08402ad5846c73b6887e74ed4575fd71a3e3c73d) Thanks [@bluwy](https://github.com/bluwy)! - Adds an option for the Sharp image service to allow large images to be processed. Set `limitInputPixels: false` to bypass the default image size limit:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    image: {
      service: {
        entrypoint: 'astro/assets/services/sharp',
        config: {
          limitInputPixels: false,
        },
      },
    },
  });
  ```

- [#9596](https://github.com/withastro/astro/pull/9596) [`fbc26976533bbcf2de9d6dba1aa3ea3dc6ce0853`](https://github.com/withastro/astro/commit/fbc26976533bbcf2de9d6dba1aa3ea3dc6ce0853) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds the ability to set a [`rootMargin`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin) setting when using the `client:visible` directive. This allows a component to be hydrated when it is _near_ the viewport, rather than hydrated when it has _entered_ the viewport.

  ```astro
  <!-- Load component when it's within 200px away from entering the viewport -->
  <Component client:visible={{ rootMargin: '200px' }} />
  ```

- [#9063](https://github.com/withastro/astro/pull/9063) [`f33fe3190b482a42ebc68cc5275fd7f2c49102e6`](https://github.com/withastro/astro/commit/f33fe3190b482a42ebc68cc5275fd7f2c49102e6) Thanks [@alex-sherwin](https://github.com/alex-sherwin)! - Cookie encoding / decoding can now be customized

  Adds new `encode` and `decode` functions to allow customizing how cookies are encoded and decoded. For example, you can bypass the default encoding via `encodeURIComponent` when adding a URL as part of a cookie:

  ```astro
  ---
  import { encodeCookieValue } from './cookies';
  Astro.cookies.set('url', Astro.url.toString(), {
    // Override the default encoding so that URI components are not encoded
    encode: (value) => encodeCookieValue(value),
  });
  ---
  ```

  Later, you can decode the URL in the same way:

  ```astro
  ---
  import { decodeCookieValue } from './cookies';
  const url = Astro.cookies.get('url', {
    decode: (value) => decodeCookieValue(value),
  });
  ---
  ```

### Patch Changes

- [#9593](https://github.com/withastro/astro/pull/9593) [`3b4e629ac8c2fdb4b491bf01abc7794e2e100173`](https://github.com/withastro/astro/commit/3b4e629ac8c2fdb4b491bf01abc7794e2e100173) Thanks [@bluwy](https://github.com/bluwy)! - Improves `astro add` error reporting when the dependencies fail to install

- [#9563](https://github.com/withastro/astro/pull/9563) [`d48ab90fb41fbc0589cd2df711682a41382c03aa`](https://github.com/withastro/astro/commit/d48ab90fb41fbc0589cd2df711682a41382c03aa) Thanks [@martrapp](https://github.com/martrapp)! - Fixes back navigation to fragment links (e.g. `#about`) in Firefox when using view transitions

  Co-authored-by: Florian Lefebvre <69633530+florian-lefebvre@users.noreply.github.com>
  Co-authored-by: Sarah Rainsberger <sarah@rainsberger.ca>

- [#9597](https://github.com/withastro/astro/pull/9597) [`9fd24a546c45d48451da46637c14e7ed54dac76a`](https://github.com/withastro/astro/commit/9fd24a546c45d48451da46637c14e7ed54dac76a) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where configuring trailingSlash had no effect on API routes.

- [#9586](https://github.com/withastro/astro/pull/9586) [`82bad5d6205672ed3f6a49d4de53d3a68367433e`](https://github.com/withastro/astro/commit/82bad5d6205672ed3f6a49d4de53d3a68367433e) Thanks [@martrapp](https://github.com/martrapp)! - Fixes page titles in the browser's drop-down for back / forward navigation when using view transitions

- [#9575](https://github.com/withastro/astro/pull/9575) [`ab6049bd58e4d02f47d500f9db08a865bc7f09b8`](https://github.com/withastro/astro/commit/ab6049bd58e4d02f47d500f9db08a865bc7f09b8) Thanks [@bluwy](https://github.com/bluwy)! - Sets correct `process.env.NODE_ENV` default when using the JS API

- [#9587](https://github.com/withastro/astro/pull/9587) [`da307e4a080483f8763f1919a05fa2194bb14e22`](https://github.com/withastro/astro/commit/da307e4a080483f8763f1919a05fa2194bb14e22) Thanks [@jjenzz](https://github.com/jjenzz)! - Adds a `CSSProperties` interface that allows extending the style attribute

- [#9513](https://github.com/withastro/astro/pull/9513) [`e44f6acf99195a3f29b8390fd9b2c06410551b74`](https://github.com/withastro/astro/commit/e44f6acf99195a3f29b8390fd9b2c06410551b74) Thanks [@wtto00](https://github.com/wtto00)! - Ignores `3g` in slow connection detection. Only `2g` and `slow-2g` are considered slow connections.

## 4.0.9

### Patch Changes

- [#9571](https://github.com/withastro/astro/pull/9571) [`ec71f03cfd9b8195fb21c92dfda0eff63b6ebeed`](https://github.com/withastro/astro/commit/ec71f03cfd9b8195fb21c92dfda0eff63b6ebeed) Thanks [@bluwy](https://github.com/bluwy)! - Removes telemetry for unhandled errors in the dev server

- [#9548](https://github.com/withastro/astro/pull/9548) [`8049f0cd91b239c52e37d571e3ba3e703cf0e4cf`](https://github.com/withastro/astro/commit/8049f0cd91b239c52e37d571e3ba3e703cf0e4cf) Thanks [@bluwy](https://github.com/bluwy)! - Fixes error overlay display on URI malformed error

- [#9504](https://github.com/withastro/astro/pull/9504) [`8cc3d6aa46f438d668516539c34b48ad748ade39`](https://github.com/withastro/astro/commit/8cc3d6aa46f438d668516539c34b48ad748ade39) Thanks [@matiboux](https://github.com/matiboux)! - Implement i18n's `getLocaleByPath` function

- [#9547](https://github.com/withastro/astro/pull/9547) [`22f42d11a4fd2e154a0c5873c4f516584e383b70`](https://github.com/withastro/astro/commit/22f42d11a4fd2e154a0c5873c4f516584e383b70) Thanks [@bluwy](https://github.com/bluwy)! - Prevents ANSI codes from rendering in the error overlay

- [#9446](https://github.com/withastro/astro/pull/9446) [`ede3f7fef6b43a08c9371f7a2531e2eef858b94d`](https://github.com/withastro/astro/commit/ede3f7fef6b43a08c9371f7a2531e2eef858b94d) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Toggle dev toolbar hitbox height when toolbar is visible

- [#9572](https://github.com/withastro/astro/pull/9572) [`9f6453cf4972ac28eec4f07a1373feaa295c8864`](https://github.com/withastro/astro/commit/9f6453cf4972ac28eec4f07a1373feaa295c8864) Thanks [@bluwy](https://github.com/bluwy)! - Documents supported `--host` and `--port` flags in `astro preview --help`

- [#9540](https://github.com/withastro/astro/pull/9540) [`7f212f0831d8cd899a86fb94899a7cad8ec280db`](https://github.com/withastro/astro/commit/7f212f0831d8cd899a86fb94899a7cad8ec280db) Thanks [@matthewp](https://github.com/matthewp)! - Fixes remote images with encoded characters

- [#9559](https://github.com/withastro/astro/pull/9559) [`8b873bf1f343efc1f486d8ef53c38380e2373c08`](https://github.com/withastro/astro/commit/8b873bf1f343efc1f486d8ef53c38380e2373c08) Thanks [@sygint](https://github.com/sygint)! - Adds 'starlight' to the displayed options for `astro add`

- [#9537](https://github.com/withastro/astro/pull/9537) [`16e61fcacb98e6bd948ac240bc082659d70193a4`](https://github.com/withastro/astro/commit/16e61fcacb98e6bd948ac240bc082659d70193a4) Thanks [@walter9388](https://github.com/walter9388)! - `<Image />` srcset now parses encoded paths correctly

## 4.0.8

### Patch Changes

- [#9522](https://github.com/withastro/astro/pull/9522) [`bb1438d20d325acd15f3755c6e306e45a7c64bcd`](https://github.com/withastro/astro/commit/bb1438d20d325acd15f3755c6e306e45a7c64bcd) Thanks [@Zegnat](https://github.com/Zegnat)! - Add support for autocomplete attribute to the HTML button type.

- [#9531](https://github.com/withastro/astro/pull/9531) [`662f06fd9fae377bed1aaa49adbba3542cced087`](https://github.com/withastro/astro/commit/662f06fd9fae377bed1aaa49adbba3542cced087) Thanks [@bluwy](https://github.com/bluwy)! - Fixes duplicated CSS modules content when it's imported by both Astro files and framework components

- [#9501](https://github.com/withastro/astro/pull/9501) [`eb36e95596fcdb3db4a31744e910495e22e3af84`](https://github.com/withastro/astro/commit/eb36e95596fcdb3db4a31744e910495e22e3af84) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Export JSX namespace from `astro/jsx-runtime` for language tooling to consume

- [#9492](https://github.com/withastro/astro/pull/9492) [`89a2a07c2e411cda32244b7b05d3c79e93f7dd84`](https://github.com/withastro/astro/commit/89a2a07c2e411cda32244b7b05d3c79e93f7dd84) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves error message for the case where two similarly named files result in the same content entry.

- [#9532](https://github.com/withastro/astro/pull/9532) [`7224809b73d2c3ec8e8aee2fa07463dc3b57a7a2`](https://github.com/withastro/astro/commit/7224809b73d2c3ec8e8aee2fa07463dc3b57a7a2) Thanks [@bluwy](https://github.com/bluwy)! - Prevents unnecessary URI decoding when rendering a route

- [#9478](https://github.com/withastro/astro/pull/9478) [`dfef925e1fd07f3efb9fde6f4f23548f2af7dc75`](https://github.com/withastro/astro/commit/dfef925e1fd07f3efb9fde6f4f23548f2af7dc75) Thanks [@lilnasy](https://github.com/lilnasy)! - Improves errors in certain places to also report their causes.

- [#9463](https://github.com/withastro/astro/pull/9463) [`3b0eaed3b544ef8c4ec1f7b0d5a8f475bcfeb25e`](https://github.com/withastro/astro/commit/3b0eaed3b544ef8c4ec1f7b0d5a8f475bcfeb25e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update Sharp version to ^0.33.1

- [#9512](https://github.com/withastro/astro/pull/9512) [`1469e0e5a915e6b42b9953dbb48fe57a74518056`](https://github.com/withastro/astro/commit/1469e0e5a915e6b42b9953dbb48fe57a74518056) Thanks [@mingjunlu](https://github.com/mingjunlu)! - Prevents dev toolbar tooltip from overflowing outside of the screen

- [#9497](https://github.com/withastro/astro/pull/9497) [`7f7a7f1aeaec6b327ae0e5e7470a4f46174bf8ae`](https://github.com/withastro/astro/commit/7f7a7f1aeaec6b327ae0e5e7470a4f46174bf8ae) Thanks [@lilnasy](https://github.com/lilnasy)! - Adds a helpful warning message for when an exported API Route is not uppercase.

## 4.0.7

### Patch Changes

- [#9452](https://github.com/withastro/astro/pull/9452) [`e83b5095f`](https://github.com/withastro/astro/commit/e83b5095f164f48ba40fc715a805fc66a3e39dcf) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Upgrades vite to latest

- [#9352](https://github.com/withastro/astro/pull/9352) [`f515b1421`](https://github.com/withastro/astro/commit/f515b1421afa335b8d6e4491fbe24419df53bfeb) Thanks [@tmcw](https://github.com/tmcw)! - Add a more descriptive error message when image conversion fails

- [#9486](https://github.com/withastro/astro/pull/9486) [`f6714f677`](https://github.com/withastro/astro/commit/f6714f677cffa2484565f51d5eb55bd34309653b) Thanks [@martrapp](https://github.com/martrapp)! - Fixes View Transition's form submission prevention, allowing `preventDefault` to be used.

- [#9461](https://github.com/withastro/astro/pull/9461) [`429be8cc3`](https://github.com/withastro/astro/commit/429be8cc3ed0623df4fdca76f1531265f5ba5dfc) Thanks [@Skn0tt](https://github.com/Skn0tt)! - update import created for `astro create netlify`

- [#9464](https://github.com/withastro/astro/pull/9464) [`faf6c7e11`](https://github.com/withastro/astro/commit/faf6c7e1104ee247e847836020a3ce07a2053705) Thanks [@Fryuni](https://github.com/Fryuni)! - Fixes an edge case with view transitions where some spec-compliant `Content-Type` headers would cause a valid HTML response to be ignored.

- [#9400](https://github.com/withastro/astro/pull/9400) [`1e984389b`](https://github.com/withastro/astro/commit/1e984389bafd87b0a631ed4aba930447669234f8) Thanks [@bluwy](https://github.com/bluwy)! - Fixes importing dev toolbar apps from integrations on Windows

- [#9487](https://github.com/withastro/astro/pull/9487) [`19169db1f`](https://github.com/withastro/astro/commit/19169db1f1574d36cc284fd9a0319d9b1e92b49a) Thanks [@ematipico](https://github.com/ematipico)! - Improves logging of the generated pages during the build

- [#9460](https://github.com/withastro/astro/pull/9460) [`047d285be`](https://github.com/withastro/astro/commit/047d285be1ab764bc82f88b8553b46429c37efca) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix Astro failing to build on certain exotic platform that reports their CPU count incorrectly

- [#9466](https://github.com/withastro/astro/pull/9466) [`5062d27a1`](https://github.com/withastro/astro/commit/5062d27a186c5020522614b9d6f3da218f7afd96) Thanks [@knpwrs](https://github.com/knpwrs)! - Updates view transitions `form` handling with logic for the [`enctype`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/enctype) attribute

- [#9458](https://github.com/withastro/astro/pull/9458) [`fa3078ce9`](https://github.com/withastro/astro/commit/fa3078ce9f5eda408340a78c6d275f3e0b2437dc) Thanks [@ematipico](https://github.com/ematipico)! - Correctly handle the error in case the middleware throws a runtime error

- [#9089](https://github.com/withastro/astro/pull/9089) [`5ae657882`](https://github.com/withastro/astro/commit/5ae657882287645c967249aee91bd06497f6624d) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where redirects did not replace slugs when the target of the redirect rule was not a verbatim route in the project.

- [#9483](https://github.com/withastro/astro/pull/9483) [`c384f6924`](https://github.com/withastro/astro/commit/c384f6924edc161d3ff631e658f017a37e4207e3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix some false positive in the audit logic of the dev toolbar

- [#9437](https://github.com/withastro/astro/pull/9437) [`354a62c86`](https://github.com/withastro/astro/commit/354a62c86e9187af5d05540ed321bdc889384d97) Thanks [@dkobierski](https://github.com/dkobierski)! - Fixes incorrect hoisted script paths when custom rollup output file names are configured

- [#9475](https://github.com/withastro/astro/pull/9475) [`7ae4928f3`](https://github.com/withastro/astro/commit/7ae4928f303720d3b2f611474fc08d3b96c2e4af) Thanks [@ematipico](https://github.com/ematipico)! - Remove the manifest from the generated files in the `dist/` folder.

## 4.0.6

### Patch Changes

- [#9419](https://github.com/withastro/astro/pull/9419) [`151bd429b`](https://github.com/withastro/astro/commit/151bd429b11a73d236ca8f43e8f5072e7c29641e) Thanks [@matthewp](https://github.com/matthewp)! - Prevent Partytown from hijacking history APIs

- [#9426](https://github.com/withastro/astro/pull/9426) [`c01cc4e34`](https://github.com/withastro/astro/commit/c01cc4e3409ae3cf81db7384bf8e53424f21bb5c) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Fixes warning for external URL redirects

- [#9445](https://github.com/withastro/astro/pull/9445) [`f963d07f2`](https://github.com/withastro/astro/commit/f963d07f22f972938e1c9e8c95f9278efdff586b) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Upgrades Astro's compiler to a crash when sourcemaps try to map multibyte characters

- [#9126](https://github.com/withastro/astro/pull/9126) [`6d2d0e279`](https://github.com/withastro/astro/commit/6d2d0e279dd51e04099c86c4d900e2dd1d5fa837) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where error pages were not shown when trailingSlash was set to "always".

- [#9434](https://github.com/withastro/astro/pull/9434) [`c01580a2c`](https://github.com/withastro/astro/commit/c01580a2cd847ac82192d6717e9e823fba6ecb49) Thanks [@ematipico](https://github.com/ematipico)! - Improves the error message when a middleware doesn't return a `Response`

- [#9433](https://github.com/withastro/astro/pull/9433) [`fcc2fd5b0`](https://github.com/withastro/astro/commit/fcc2fd5b0f218ecfc7bbe3f48063221e5dd62757) Thanks [@ematipico](https://github.com/ematipico)! - Correctly merge headers from the original response when an error page is rendered

## 4.0.5

### Patch Changes

- [#9423](https://github.com/withastro/astro/pull/9423) [`bda1d294f`](https://github.com/withastro/astro/commit/bda1d294f2d50f31abfc9a32b5272fc9ac080e83) Thanks [@matthewp](https://github.com/matthewp)! - Error when getImage is passed an undefined src

- [#9424](https://github.com/withastro/astro/pull/9424) [`e1a5a2d36`](https://github.com/withastro/astro/commit/e1a5a2d36ac3637f5c94a27b69128a121541bae8) Thanks [@matthewp](https://github.com/matthewp)! - Prevents dev server from crashing on unhandled rejections, and adds a helpful error message

- [#9404](https://github.com/withastro/astro/pull/9404) [`8aa17a64b`](https://github.com/withastro/astro/commit/8aa17a64b46b8eaabfd1375fd6550ff93727aa81) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixed some newer HTML attributes not being included in our type definitions

- [#9414](https://github.com/withastro/astro/pull/9414) [`bebf38c0c`](https://github.com/withastro/astro/commit/bebf38c0cb539de04007f5e721bf459300b895a1) Thanks [@Skn0tt](https://github.com/Skn0tt)! - Adds the feature name to logs about feature deprecation / experimental status.

- [#9418](https://github.com/withastro/astro/pull/9418) [`2c168af67`](https://github.com/withastro/astro/commit/2c168af6745f5357e76ec323787595ef06d5fd73) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Fix broken link in CI instructions

- [#9407](https://github.com/withastro/astro/pull/9407) [`546d92c86`](https://github.com/withastro/astro/commit/546d92c862d08c69751039511a12c92ae38184c2) Thanks [@matthewp](https://github.com/matthewp)! - Allows file URLs as import specifiers

## 4.0.4

### Patch Changes

- [#9380](https://github.com/withastro/astro/pull/9380) [`ea0918259`](https://github.com/withastro/astro/commit/ea0918259964947523827bac6abe88ad3841dbb9) Thanks [@ematipico](https://github.com/ematipico)! - Correctly handle the rendering of i18n routes when `output: "hybrid"` is set

- [#9374](https://github.com/withastro/astro/pull/9374) [`65ddb0271`](https://github.com/withastro/astro/commit/65ddb027111514d41481f7455c0f0f03f8f608a8) Thanks [@bluwy](https://github.com/bluwy)! - Fixes an issue where prerendered route paths that end with `.mjs` were removed from the final build

- [#9375](https://github.com/withastro/astro/pull/9375) [`26f7023d6`](https://github.com/withastro/astro/commit/26f7023d6928de75c363df0fa759a6255cb73ef3) Thanks [@bluwy](https://github.com/bluwy)! - Prettifies generated route names injected by integrations

- [#9387](https://github.com/withastro/astro/pull/9387) [`a7c75b333`](https://github.com/withastro/astro/commit/a7c75b3339e6b1562d0d16ab6ef482840c51df68) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes an edge case with `astro add` that could install a prerelease instead of a stable release version.

  **Prior to this change**
  `astro add svelte` installs `svelte@5.0.0-next.22`

  **After this change**
  `astro add svelte` installs `svelte@4.2.8`

- Updated dependencies [[`270c6cc27`](https://github.com/withastro/astro/commit/270c6cc27f20995883fcdabbff9b56d7f041f9e4)]:
  - @astrojs/markdown-remark@4.0.1

## 4.0.3

### Patch Changes

- [#9342](https://github.com/withastro/astro/pull/9342) [`eb942942d`](https://github.com/withastro/astro/commit/eb942942d67508c07d7efaa859a7840f7c0223da) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix missing `is:inline` type for the `<slot />` element

- [#9343](https://github.com/withastro/astro/pull/9343) [`ab0281aee`](https://github.com/withastro/astro/commit/ab0281aee419e58c6079ca393987fe1ff0541dd5) Thanks [@martrapp](https://github.com/martrapp)! - Adds source file properties to HTML elements only if devToolbar is enabled

- [#9336](https://github.com/withastro/astro/pull/9336) [`c76901065`](https://github.com/withastro/astro/commit/c76901065545f6a8d3de3e44d1c8ee5456a8a77a) Thanks [@FredKSchott](https://github.com/FredKSchott)! - dev: fix issue where 404 and 500 responses were logged as 200

- [#9339](https://github.com/withastro/astro/pull/9339) [`0bb3d5322`](https://github.com/withastro/astro/commit/0bb3d532219fb90fc08bfb472fc981fab6543d16) Thanks [@morinokami](https://github.com/morinokami)! - Fixed the log message to correctly display 'enabled' and 'disabled' when toggling 'Disable notifications' in the Toolbar.

## 4.0.2

### Patch Changes

- [#9331](https://github.com/withastro/astro/pull/9331) [`cfb20550d`](https://github.com/withastro/astro/commit/cfb20550d346a33e76e23453d5dcd084e5065c4d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Updates an internal dependency ([`vitefu`](https://github.com/svitejs/vitefu)) to avoid a common `peerDependency` warning

- [#9327](https://github.com/withastro/astro/pull/9327) [`3878a91be`](https://github.com/withastro/astro/commit/3878a91be4879988c7235f433e50a6dc82e32288) Thanks [@doseofted](https://github.com/doseofted)! - Fixes an edge case for `<form method="dialog">` when using View Transitions. Forms with `method="dialog"` no longer require an additional `data-astro-reload` attribute.

## 4.0.1

### Patch Changes

- [#9315](https://github.com/withastro/astro/pull/9315) [`631e5d01b`](https://github.com/withastro/astro/commit/631e5d01b00efee6970466c38201cb0e67ec74cf) Thanks [@ematipico](https://github.com/ematipico)! - Fixes an issue where logs that weren't grouped together by route when building the app.

## 4.0.0

### Major Changes

- [#9138](https://github.com/withastro/astro/pull/9138) [`abf601233`](https://github.com/withastro/astro/commit/abf601233f8188d118a8cb063c777478d8d9f1a3) Thanks [@bluwy](https://github.com/bluwy)! - Updates the unified, remark, and rehype dependencies to latest. Make sure to update your custom remark and rehype plugins as well to be compatible with the latest versions.

  **Potentially breaking change:** The default value of `markdown.remarkRehype.footnoteBackLabel` is changed from `"Back to content"` to `"Back to reference 1"`. See the `mdast-util-to-hast` [commit](https://github.com/syntax-tree/mdast-util-to-hast/commit/56c88e45690be138fad9f0bf367b939d09816863) for more information.

- [#9181](https://github.com/withastro/astro/pull/9181) [`cdabf6ef0`](https://github.com/withastro/astro/commit/cdabf6ef02be7220fd2b6bdcef924ceca089381e) Thanks [@bluwy](https://github.com/bluwy)! - Removes support for returning simple objects from endpoints (deprecated since Astro 3.0). You should return a `Response` instead.

  `ResponseWithEncoding` is also removed. You can refactor the code to return a response with an array buffer instead, which is encoding agnostic.

  The types for middlewares have also been revised. To type a middleware function, you should now use `MiddlewareHandler` instead of `MiddlewareResponseHandler`. If you used `defineMiddleware()` to type the function, no changes are needed.

- [#9263](https://github.com/withastro/astro/pull/9263) [`3cbd8ea75`](https://github.com/withastro/astro/commit/3cbd8ea7534910e3beae396dcfa93ce87dcdd91f) Thanks [@bluwy](https://github.com/bluwy)! - Removes additional deprecated APIs:
  - The Astro preview server now returns a 404 status instead of a 301 redirect when requesting assets from the public directory without a base.
  - Removes special handling when referencing the `astro/client-image` type. You should use the `astro/client` type instead.
  - Removes deprecated built-in `rss` support in `getStaticPaths`. You should use `@astrojs/rss` instead.
  - Removes deprecated `Astro.request.params` support. You should use `Astro.params` instead.

- [#9271](https://github.com/withastro/astro/pull/9271) [`47604bd5b`](https://github.com/withastro/astro/commit/47604bd5b5bb2ea63922b657bac104c010575c20) Thanks [@matthewp](https://github.com/matthewp)! - Renames Dev Overlay to Dev Toolbar

  The previously named experimental Dev Overlay is now known as the Astro Dev Toolbar. Overlay plugins have been renamed as Toolbar Apps. All APIs have been updated to reflect this name change.

  To not break existing APIs, aliases for the Toolbar-based names have been created. The previous API names will continue to function but will be deprecated in the future. All documentation has been updated to reflect Toolbar-based names.

- [#9122](https://github.com/withastro/astro/pull/9122) [`1c48ed286`](https://github.com/withastro/astro/commit/1c48ed286538ab9e354eca4e4dcd7c6385c96721) Thanks [@bluwy](https://github.com/bluwy)! - Adds Vite 5 support. There are no breaking changes from Astro. Check the [Vite migration guide](https://vite.dev/guide/migration.html) for details of the breaking changes from Vite instead.

- [#9225](https://github.com/withastro/astro/pull/9225) [`c421a3d17`](https://github.com/withastro/astro/commit/c421a3d17911aeda29b5204f6d568ae87e329eaf) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Removes the opt-in `handleForms` property for `<ViewTransitions />`. Form submissions are now handled by default and this property is no longer necessary. This default behavior can be disabled by setting `data-astro-reload` on relevant `<form />` elements.

- [#9196](https://github.com/withastro/astro/pull/9196) [`37697a2c5`](https://github.com/withastro/astro/commit/37697a2c5511572dc29c0a4ea46f90c2f62be8e6) Thanks [@bluwy](https://github.com/bluwy)! - Removes support for Shiki custom language's `path` property. The language JSON file should be imported and passed to the option instead.

  ```diff
  // astro.config.js
  + import customLang from './custom.tmLanguage.json'

  export default defineConfig({
    markdown: {
      shikiConfig: {
        langs: [
  -       { path: './custom.tmLanguage.json' },
  +       customLang,
        ],
      },
    },
  })
  ```

- [#9199](https://github.com/withastro/astro/pull/9199) [`49aa215a0`](https://github.com/withastro/astro/commit/49aa215a01ee1c4805316c85bb0aea6cfbc25a31) Thanks [@lilnasy](https://github.com/lilnasy)! - This change only affects maintainers of third-party adapters. In the Integration API, the `app.render()` method of the `App` class has been simplified.

  Instead of two optional arguments, it now takes a single optional argument that is an object with two optional properties: `routeData` and `locals`.

  ```diff
   app.render(request)

  - app.render(request, routeData)
  + app.render(request, { routeData })

  - app.render(request, routeData, locals)
  + app.render(request, { routeData, locals })

  - app.render(request, undefined, locals)
  + app.render(request, { locals })
  ```

  The current signature is deprecated but will continue to function until next major version.

- [#9212](https://github.com/withastro/astro/pull/9212) [`c0383ea0c`](https://github.com/withastro/astro/commit/c0383ea0c102cb62b7235823c706a090ba08715f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removes deprecated `app.match()` option, `matchNotFound`

- [#9168](https://github.com/withastro/astro/pull/9168) [`153a5abb9`](https://github.com/withastro/astro/commit/153a5abb905042ac68b712514dc9ec387d3e6b17) Thanks [@bluwy](https://github.com/bluwy)! - Removes deprecated features from Astro 3.0
  - Adapters are now required to pass `supportedAstroFeatures` to specify a list of features they support.
  - The `build.split` and `build.excludeMiddleware` options are removed. Use `functionPerRoute` and `edgeMiddleware` from adapters instead.
  - The `markdown.drafts` option and draft feature is removed. Use content collections instead.
  - Lowercase endpoint names are no longer supported. Use uppercase endpoint names instead.
  - `getHeaders()` exported from markdown files is removed. Use `getHeadings()` instead.

### Minor Changes

- [#9105](https://github.com/withastro/astro/pull/9105) [`6201bbe96`](https://github.com/withastro/astro/commit/6201bbe96c2a083fb201e4a43a9bd88499821a3e) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update CLI logging experience

- [#9200](https://github.com/withastro/astro/pull/9200) [`b4b851f5a`](https://github.com/withastro/astro/commit/b4b851f5a46b32ee531db5dc39ccd2aa7af7bcfd) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new way to configure the `i18n.locales` array.

  Developers can now assign a custom URL path prefix that can span multiple language codes:

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      i18n: {
        defaultLocale: 'english',
        locales: ['de', { path: 'english', codes: ['en', 'en-US'] }, 'fr'],
      },
    },
  });
  ```

  With the above configuration, the URL prefix of the default locale will be `/english/`. When computing `Astro.preferredLocale`, Astro will use the `codes`.

- [#9115](https://github.com/withastro/astro/pull/9115) [`3b77889b4`](https://github.com/withastro/astro/commit/3b77889b47750ed6e17c7858780dc4aae9201b58) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Adds the `astro preferences` command to manage user preferences. User preferences are specific to individual Astro users, unlike the `astro.config.mjs` file which changes behavior for everyone working on a project.

  User preferences are scoped to the current project by default, stored in a local `.astro/settings.json` file. Using the `--global` flag, user preferences can also be applied to every Astro project on the current machine. Global user preferences are stored in an operating system-specific location.

  ```sh
  # Disable the dev overlay for the current user in the current project
  npm run astro preferences disable devOverlay
  # Disable the dev overlay for the current user in all Astro projects on this machine
  npm run astro preferences --global disable devOverlay

  # Check if the dev overlay is enabled for the current user
  npm run astro preferences list devOverlay
  ```

- [#9139](https://github.com/withastro/astro/pull/9139) [`459b26436`](https://github.com/withastro/astro/commit/459b2643666db08dbd29a100ce3d8697b451d3fe) Thanks [@bluwy](https://github.com/bluwy)! - Reworks Vite's logger to use Astro's logger to correctly log HMR messages

- [#9279](https://github.com/withastro/astro/pull/9279) [`6a9669b81`](https://github.com/withastro/astro/commit/6a9669b810ddfcae6c537165a438190ea1e7a4bc) Thanks [@martrapp](https://github.com/martrapp)! - Improves consistency between navigations with and without `<ViewTransitions>`. See [#9279](https://github.com/withastro/astro/pull/9279) for more details.

- [#9161](https://github.com/withastro/astro/pull/9161) [`bd0c2e9ae`](https://github.com/withastro/astro/commit/bd0c2e9ae3389a9d3085050c1e8134ae98dff299) Thanks [@bluwy](https://github.com/bluwy)! - Renames the `entryPoint` property of the `injectRoute` integrations API to `entrypoint` for consistency. A warning will be shown prompting you to update your code when using the old name.

- [#9129](https://github.com/withastro/astro/pull/9129) [`8bfc20511`](https://github.com/withastro/astro/commit/8bfc20511918d675202cdc100d4efab293e5cbac) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update error log formatting

### Patch Changes

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Redesign Dev Overlay main screen to show more information, such as the coolest integrations, your current Astro version and more.

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes an issue where links with the same pathname as the current page, but different search params, were not prefetched.

- [#9275](https://github.com/withastro/astro/pull/9275) [`0968cb1a3`](https://github.com/withastro/astro/commit/0968cb1a373b1101a649035d2ea2210d3d6412dc) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where html annotations relevant only to the dev server were included in the production build.

- [#9252](https://github.com/withastro/astro/pull/9252) [`7b74ec4ba`](https://github.com/withastro/astro/commit/7b74ec4ba48e363a19d20e322212d0d264927f1b) Thanks [@ematipico](https://github.com/ematipico)! - Consistently emit fallback routes in the correct folders, and emit routes that consider `trailingSlash`

- [#9222](https://github.com/withastro/astro/pull/9222) [`279e3c1b3`](https://github.com/withastro/astro/commit/279e3c1b3d06e7b48f01c0ef8285c3719ac74ace) Thanks [@matthewp](https://github.com/matthewp)! - Ensure the dev-overlay-window is anchored to the bottom

- [#9292](https://github.com/withastro/astro/pull/9292) [`5428b3da0`](https://github.com/withastro/astro/commit/5428b3da08493d933981c4646d5d132fb31f0d25) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves display for `astro preferences list` command

- [#9235](https://github.com/withastro/astro/pull/9235) [`9c2342c32`](https://github.com/withastro/astro/commit/9c2342c327a13d2f7d1eb387b743e81f431b9813) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix SVG icons not showing properly in the extended dropdown menu of the dev overlay

- [#9218](https://github.com/withastro/astro/pull/9218) [`f4401c8c1`](https://github.com/withastro/astro/commit/f4401c8c1fa203431b4e7b2e89381a91b4ef1ac6) Thanks [@matthewp](https://github.com/matthewp)! - Improve high contrast mode with the Dev Overlay

- [#9254](https://github.com/withastro/astro/pull/9254) [`b750a161e`](https://github.com/withastro/astro/commit/b750a161e0e059de9cf814ce271d5891e4e97cbe) Thanks [@matthewp](https://github.com/matthewp)! - Improve highlight/tooltip positioning when in fixed positions

- [#9230](https://github.com/withastro/astro/pull/9230) [`60cfa49e4`](https://github.com/withastro/astro/commit/60cfa49e445c926288612a6b1a30113ab988011c) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update the look and feel of the dev overlay

- [#9248](https://github.com/withastro/astro/pull/9248) [`43ddb5217`](https://github.com/withastro/astro/commit/43ddb5217691dc4112d8d98ae07511a8be6d4b94) Thanks [@martrapp](https://github.com/martrapp)! - Adds properties of the submit button (name, value) to the form data of a view transition

- [#9170](https://github.com/withastro/astro/pull/9170) [`8a228fce0`](https://github.com/withastro/astro/commit/8a228fce0114daeea2100e50ddc5cf2ea0a03b5d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Adds new accessibility audits to the Dev Toolbar's built-in Audits app.

  The audits Astro performs are non-exhaustive and only capable of detecting a handful of common accessibility issues. Please take care to perform a thorough, **manual** audit of your site to ensure compliance with the [Web Content Accessibility Guidelines (WCAG) international standard](https://www.w3.org/WAI/standards-guidelines/wcag/) _before_ publishing your site.

  🧡 Huge thanks to the [Svelte](https://github.com/sveltejs/svelte) team for providing the basis of these accessibility audits!

- [#9149](https://github.com/withastro/astro/pull/9149) [`0fe3a7ed5`](https://github.com/withastro/astro/commit/0fe3a7ed5d7bb1a9fce1623e84ba14104b51223c) Thanks [@bluwy](https://github.com/bluwy)! - Removes vendored Vite's `importMeta.d.ts` file in favour of Vite 5's new `vite/types/import-meta.d.ts` export

- [#9295](https://github.com/withastro/astro/pull/9295) [`3d2dbb0e5`](https://github.com/withastro/astro/commit/3d2dbb0e5d2bf67b38ff8533d4dd938c94433812) Thanks [@matthewp](https://github.com/matthewp)! - Remove aria-query package

  This is another CJS-only package that breaks usage.

- [#9274](https://github.com/withastro/astro/pull/9274) [`feaba2c7f`](https://github.com/withastro/astro/commit/feaba2c7fc0a48d3af7dd98e6b750ec1e8274e33) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fix routing prefixes when `prefixDefaultLocale` is `true`

- [#9273](https://github.com/withastro/astro/pull/9273) [`9887f2412`](https://github.com/withastro/astro/commit/9887f241241f800e2907afe7079db070f3bfcfab) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Exports type for Dev Toolbar App under correct name

- [#9150](https://github.com/withastro/astro/pull/9150) [`710be505c`](https://github.com/withastro/astro/commit/710be505c9ddf416e77a75343d8cae9c497d72c6) Thanks [@bluwy](https://github.com/bluwy)! - Refactors virtual modules exports. This should not break your project unless you import Astro's internal modules, including:
  - `astro/middleware/namespace`
  - `astro/transitions`
  - `astro/transitions/router`
  - `astro/transitions/events`
  - `astro/transitions/types`
  - `astro/prefetch`
  - `astro/i18n`

- [#9227](https://github.com/withastro/astro/pull/9227) [`4b8a42406`](https://github.com/withastro/astro/commit/4b8a42406bbdcc68604ea4ecc2a926721fbc4d52) Thanks [@matthewp](https://github.com/matthewp)! - Ensure overlay x-ray z-index is higher than the island

- [#9255](https://github.com/withastro/astro/pull/9255) [`9ea3e0b94`](https://github.com/withastro/astro/commit/9ea3e0b94f7c4813c52bffd78043f90fd87dffda) Thanks [@matthewp](https://github.com/matthewp)! - Adds instructions on how to hide the dev overlay

- [#9293](https://github.com/withastro/astro/pull/9293) [`cf5fa4376`](https://github.com/withastro/astro/commit/cf5fa437627ca6978ae3ff33c7894f278dfe75cd) Thanks [@matthewp](https://github.com/matthewp)! - Removes the 'a11y-role-has-required-aria-props' audit rule

  This audit rule depends on a CommonJS module. To prevent blocking the 4.0 release the rule is being removed temporarily.

- [#9214](https://github.com/withastro/astro/pull/9214) [`4fe523b00`](https://github.com/withastro/astro/commit/4fe523b0064b323ee46b2574339d96ea8bdb7b2d) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes a number of small user experience bugs with the dev overlay

- [#9013](https://github.com/withastro/astro/pull/9013) [`ff8eadb95`](https://github.com/withastro/astro/commit/ff8eadb95d34833baaf3ec7575bf4f293eae97da) Thanks [@bayssmekanique](https://github.com/bayssmekanique)! - Returns the updated config in the integration `astro:config:setup` hook's `updateConfig()` API

- Updated dependencies [[`abf601233`](https://github.com/withastro/astro/commit/abf601233f8188d118a8cb063c777478d8d9f1a3), [`addb57c8e`](https://github.com/withastro/astro/commit/addb57c8e80b7b67ec61224666f3a1db5c44410c), [`c7953645e`](https://github.com/withastro/astro/commit/c7953645eeaaf9e87c6db4494b0023d2c1878ff0)]:
  - @astrojs/markdown-remark@4.0.0

## 4.0.0-beta.7

### Patch Changes

- [#9295](https://github.com/withastro/astro/pull/9295) [`3d2dbb0e5`](https://github.com/withastro/astro/commit/3d2dbb0e5d2bf67b38ff8533d4dd938c94433812) Thanks [@matthewp](https://github.com/matthewp)! - Remove aria-query package

  This is another CJS-only package that breaks usage.

## 4.0.0-beta.6

### Patch Changes

- [#9275](https://github.com/withastro/astro/pull/9275) [`0968cb1a3`](https://github.com/withastro/astro/commit/0968cb1a373b1101a649035d2ea2210d3d6412dc) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where html annotations relevant only to the dev server were included in the production build.

- [#9292](https://github.com/withastro/astro/pull/9292) [`5428b3da0`](https://github.com/withastro/astro/commit/5428b3da08493d933981c4646d5d132fb31f0d25) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves display for `astro preferences list` command

- [#9293](https://github.com/withastro/astro/pull/9293) [`cf5fa4376`](https://github.com/withastro/astro/commit/cf5fa437627ca6978ae3ff33c7894f278dfe75cd) Thanks [@matthewp](https://github.com/matthewp)! - Removes the 'a11y-role-has-required-aria-props' audit rule

  This audit rule depends on a CommonJS module. To prevent blocking the 4.0 release the rule is being removed temporarily.

## 4.0.0-beta.5

### Minor Changes

- [#9279](https://github.com/withastro/astro/pull/9279) [`6a9669b81`](https://github.com/withastro/astro/commit/6a9669b810ddfcae6c537165a438190ea1e7a4bc) Thanks [@martrapp](https://github.com/martrapp)! - Improves consistency between navigations with and without `<ViewTransitions>`. See [#9279](https://github.com/withastro/astro/pull/9279) for more details.

### Patch Changes

- [#9170](https://github.com/withastro/astro/pull/9170) [`8a228fce0`](https://github.com/withastro/astro/commit/8a228fce0114daeea2100e50ddc5cf2ea0a03b5d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Adds new accessibility audits to the Dev Toolbar's built-in Audits app.

  The audits Astro performs are non-exhaustive and only capable of detecting a handful of common accessibility issues. Please take care to perform a thorough, **manual** audit of your site to ensure compliance with the [Web Content Accessibility Guidelines (WCAG) international standard](https://www.w3.org/WAI/standards-guidelines/wcag/) _before_ publishing your site.

  🧡 Huge thanks to the [Svelte](https://github.com/sveltejs/svelte) team for providing the basis of these accessibility audits!

- [#9274](https://github.com/withastro/astro/pull/9274) [`feaba2c7f`](https://github.com/withastro/astro/commit/feaba2c7fc0a48d3af7dd98e6b750ec1e8274e33) Thanks [@TheOtterlord](https://github.com/TheOtterlord)! - Fix routing prefixes when `prefixDefaultLocale` is `true`

- [#9273](https://github.com/withastro/astro/pull/9273) [`9887f2412`](https://github.com/withastro/astro/commit/9887f241241f800e2907afe7079db070f3bfcfab) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Exports type for Dev Toolbar App under correct name

## 4.0.0-beta.4

### Major Changes

- [#9271](https://github.com/withastro/astro/pull/9271) [`47604bd5b`](https://github.com/withastro/astro/commit/47604bd5b5bb2ea63922b657bac104c010575c20) Thanks [@matthewp](https://github.com/matthewp)! - Renames Dev Overlay to Dev Toolbar

  The previously named experimental Dev Overlay is now known as the Astro Dev Toolbar. Plugins have been renamed as Toolbar Apps. This updates our references to reflect.

  To not break existing APIs, aliases for the Toolbar-based names have been created. The previous API names will continue to function but will be deprecated in the future. All documentation has been updated to reflect Toolbar-based names.

## 4.0.0-beta.3

### Major Changes

- [#9263](https://github.com/withastro/astro/pull/9263) [`3cbd8ea75`](https://github.com/withastro/astro/commit/3cbd8ea7534910e3beae396dcfa93ce87dcdd91f) Thanks [@bluwy](https://github.com/bluwy)! - Removes additional deprecated APIs:
  - The Astro preview server now returns a 404 status instead of a 301 redirect when requesting assets from the public directory without a base.
  - Removes special handling when referencing the `astro/client-image` type. You should use the `astro/client` type instead.
  - Removes deprecated built-in `rss` support in `getStaticPaths`. You should use `@astrojs/rss` instead.
  - Removes deprecated `Astro.request.params` support. You should use `Astro.params` instead.

### Minor Changes

- [#9200](https://github.com/withastro/astro/pull/9200) [`b4b851f5a`](https://github.com/withastro/astro/commit/b4b851f5a46b32ee531db5dc39ccd2aa7af7bcfd) Thanks [@ematipico](https://github.com/ematipico)! - Adds a new way to configure the `i18n.locales` array.

  Developers can now assign a custom URL path prefix that can span multiple language codes:

  ```js
  // astro.config.mjs
  export default defineConfig({
    experimental: {
      i18n: {
        defaultLocale: 'english',
        locales: ['de', { path: 'english', codes: ['en', 'en-US'] }, 'fr'],
        routingStrategy: 'prefix-always',
      },
    },
  });
  ```

  With the above configuration, the URL prefix of the default locale will be `/english/`. When computing `Astro.preferredLocale`, Astro will use the `codes`.

- [#9139](https://github.com/withastro/astro/pull/9139) [`459b26436`](https://github.com/withastro/astro/commit/459b2643666db08dbd29a100ce3d8697b451d3fe) Thanks [@bluwy](https://github.com/bluwy)! - Reworks Vite's logger to use Astro's logger to correctly log HMR messages

### Patch Changes

- [#9252](https://github.com/withastro/astro/pull/9252) [`7b74ec4ba`](https://github.com/withastro/astro/commit/7b74ec4ba48e363a19d20e322212d0d264927f1b) Thanks [@ematipico](https://github.com/ematipico)! - Consistently emit fallback routes in the correct folders, and emit routes that
  consider `trailingSlash`

- [#9235](https://github.com/withastro/astro/pull/9235) [`9c2342c32`](https://github.com/withastro/astro/commit/9c2342c327a13d2f7d1eb387b743e81f431b9813) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix SVG icons not showing properly in the extended dropdown menu of the dev overlay

- [#9254](https://github.com/withastro/astro/pull/9254) [`b750a161e`](https://github.com/withastro/astro/commit/b750a161e0e059de9cf814ce271d5891e4e97cbe) Thanks [@matthewp](https://github.com/matthewp)! - Improve highlight/tooltip positioning when in fixed positions

- [#9230](https://github.com/withastro/astro/pull/9230) [`60cfa49e4`](https://github.com/withastro/astro/commit/60cfa49e445c926288612a6b1a30113ab988011c) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update the look and feel of the dev overlay

- [#9248](https://github.com/withastro/astro/pull/9248) [`43ddb5217`](https://github.com/withastro/astro/commit/43ddb5217691dc4112d8d98ae07511a8be6d4b94) Thanks [@martrapp](https://github.com/martrapp)! - Adds properties of the submit button (name, value) to the form data of a view transition

- [#9255](https://github.com/withastro/astro/pull/9255) [`9ea3e0b94`](https://github.com/withastro/astro/commit/9ea3e0b94f7c4813c52bffd78043f90fd87dffda) Thanks [@matthewp](https://github.com/matthewp)! - Adds instructions on how to hide the dev overlay

- [#9013](https://github.com/withastro/astro/pull/9013) [`ff8eadb95`](https://github.com/withastro/astro/commit/ff8eadb95d34833baaf3ec7575bf4f293eae97da) Thanks [@bayssmekanique](https://github.com/bayssmekanique)! - Returns the updated config in the integration `astro:config:setup` hook's `updateConfig()` API

## 4.0.0-beta.2

### Major Changes

- [#9225](https://github.com/withastro/astro/pull/9225) [`c421a3d17`](https://github.com/withastro/astro/commit/c421a3d17911aeda29b5204f6d568ae87e329eaf) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Removes the opt-in `handleForms` property for `<ViewTransitions />`. Form submissions are now handled by default and can be disabled by setting `data-astro-reload` on relevant `<form />` elements.

- [#9199](https://github.com/withastro/astro/pull/9199) [`49aa215a0`](https://github.com/withastro/astro/commit/49aa215a01ee1c4805316c85bb0aea6cfbc25a31) Thanks [@lilnasy](https://github.com/lilnasy)! - This change only affects maintainers of third-party adapters. In the Integration API, the `app.render()` method of the `App` class has been simplified.

  Instead of two optional arguments, it now takes a single optional argument that is an object with two optional properties: `routeData` and `locals`.

  ```diff
   app.render(request)

  - app.render(request, routeData)
  + app.render(request, { routeData })

  - app.render(request, routeData, locals)
  + app.render(request, { routeData, locals })

  - app.render(request, undefined, locals)
  + app.render(request, { locals })
  ```

  The current signature is deprecated but will continue to function until next major version.

- [#9212](https://github.com/withastro/astro/pull/9212) [`c0383ea0c`](https://github.com/withastro/astro/commit/c0383ea0c102cb62b7235823c706a090ba08715f) Thanks [@alexanderniebuhr](https://github.com/alexanderniebuhr)! - Removes deprecated `app.match()` option, `matchNotFound`

### Minor Changes

- [#9115](https://github.com/withastro/astro/pull/9115) [`3b77889b4`](https://github.com/withastro/astro/commit/3b77889b47750ed6e17c7858780dc4aae9201b58) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Adds the `astro preferences` command to manage user preferences. User preferences are specific to individual Astro users, unlike the `astro.config.mjs` file which changes behavior for everyone working on a project.

  User preferences are scoped to the current project by default, stored in a local `.astro/settings.json` file. Using the `--global` flag, user preferences can also be applied to every Astro project on the current machine. Global user preferences are stored in an operating system-specific location.

  ```sh
  # Disable the dev overlay for the current user in the current project
  npm run astro preferences disable devOverlay
  # Disable the dev overlay for the current user in all Astro projects on this machine
  npm run astro preferences --global disable devOverlay

  # Check if the dev overlay is enabled for the current user
  npm run astro preferences list devOverlay
  ```

- [#9129](https://github.com/withastro/astro/pull/9129) [`8bfc20511`](https://github.com/withastro/astro/commit/8bfc20511918d675202cdc100d4efab293e5cbac) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update error log formatting

### Patch Changes

- [#9222](https://github.com/withastro/astro/pull/9222) [`279e3c1b3`](https://github.com/withastro/astro/commit/279e3c1b3d06e7b48f01c0ef8285c3719ac74ace) Thanks [@matthewp](https://github.com/matthewp)! - Ensure the dev-overlay-window is anchored to the bottom

- [#9218](https://github.com/withastro/astro/pull/9218) [`f4401c8c1`](https://github.com/withastro/astro/commit/f4401c8c1fa203431b4e7b2e89381a91b4ef1ac6) Thanks [@matthewp](https://github.com/matthewp)! - Improve high contrast mode with the Dev Overlay

- [#9227](https://github.com/withastro/astro/pull/9227) [`4b8a42406`](https://github.com/withastro/astro/commit/4b8a42406bbdcc68604ea4ecc2a926721fbc4d52) Thanks [@matthewp](https://github.com/matthewp)! - Ensure overlay x-ray z-index is higher than the island

- [#9214](https://github.com/withastro/astro/pull/9214) [`4fe523b00`](https://github.com/withastro/astro/commit/4fe523b0064b323ee46b2574339d96ea8bdb7b2d) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes a number of small user experience bugs with the dev overlay

## 4.0.0-beta.1

### Patch Changes

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Redesign Dev Overlay main screen to show more information, such as the coolest integrations, your current Astro version and more.

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes an issue where links with the same pathname as the current page, but different search params, were not prefetched.

## 4.0.0-beta.0

### Major Changes

- [#9138](https://github.com/withastro/astro/pull/9138) [`abf601233`](https://github.com/withastro/astro/commit/abf601233f8188d118a8cb063c777478d8d9f1a3) Thanks [@bluwy](https://github.com/bluwy)! - Updates the unified, remark, and rehype dependencies to latest. Make sure to update your custom remark and rehype plugins as well to be compatible with the latest versions.

  **Potentially breaking change:** The default value of `markdown.remarkRehype.footnoteBackLabel` is changed from `"Back to content"` to `"Back to reference 1"`. See the `mdast-util-to-hast` [commit](https://github.com/syntax-tree/mdast-util-to-hast/commit/56c88e45690be138fad9f0bf367b939d09816863) for more information.

- [#9181](https://github.com/withastro/astro/pull/9181) [`cdabf6ef0`](https://github.com/withastro/astro/commit/cdabf6ef02be7220fd2b6bdcef924ceca089381e) Thanks [@bluwy](https://github.com/bluwy)! - Removes support for returning simple objects from endpoints (deprecated since Astro 3.0). You should return a `Response` instead.

  `ResponseWithEncoding` is also removed. You can refactor the code to return a response with an array buffer instead, which is encoding agnostic.

  The types for middlewares have also been revised. To type a middleware function, you should now use `MiddlewareHandler` instead of `MiddlewareResponseHandler`. If you used `defineMiddleware()` to type the function, no changes are needed.

- [#9122](https://github.com/withastro/astro/pull/9122) [`1c48ed286`](https://github.com/withastro/astro/commit/1c48ed286538ab9e354eca4e4dcd7c6385c96721) Thanks [@bluwy](https://github.com/bluwy)! - Adds Vite 5 support. There are no breaking changes from Astro. Check the [Vite migration guide](https://vite.dev/guide/migration.html) for details of the breaking changes from Vite instead.

- [#9196](https://github.com/withastro/astro/pull/9196) [`37697a2c5`](https://github.com/withastro/astro/commit/37697a2c5511572dc29c0a4ea46f90c2f62be8e6) Thanks [@bluwy](https://github.com/bluwy)! - Removes support for Shiki custom language's `path` property. The language JSON file should be imported and passed to the option instead.

  ```diff
  // astro.config.js
  + import customLang from './custom.tmLanguage.json'

  export default defineConfig({
    markdown: {
      shikiConfig: {
        langs: [
  -       { path: './custom.tmLanguage.json' },
  +       customLang,
        ],
      },
    },
  })
  ```

- [#9168](https://github.com/withastro/astro/pull/9168) [`153a5abb9`](https://github.com/withastro/astro/commit/153a5abb905042ac68b712514dc9ec387d3e6b17) Thanks [@bluwy](https://github.com/bluwy)! - Removes deprecated features from Astro 3.0
  - Adapters are now required to pass `supportedAstroFeatures` to specify a list of features they support.
  - The `build.split` and `build.excludeMiddleware` options are removed. Use `functionPerRoute` and `edgeMiddleware` from adapters instead.
  - The `markdown.drafts` option and draft feature is removed. Use content collections instead.
  - Lowercase endpoint names are no longer supported. Use uppercase endpoint names instead.
  - `getHeaders()` exported from markdown files is removed. Use `getHeadings()` instead.

### Minor Changes

- [#9105](https://github.com/withastro/astro/pull/9105) [`6201bbe96`](https://github.com/withastro/astro/commit/6201bbe96c2a083fb201e4a43a9bd88499821a3e) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update CLI logging experience

- [#9161](https://github.com/withastro/astro/pull/9161) [`bd0c2e9ae`](https://github.com/withastro/astro/commit/bd0c2e9ae3389a9d3085050c1e8134ae98dff299) Thanks [@bluwy](https://github.com/bluwy)! - Renames the `entryPoint` property of the `injectRoute` integrations API to `entrypoint` for consistency. A warning will be shown prompting you to update your code when using the old name.

### Patch Changes

- [#9149](https://github.com/withastro/astro/pull/9149) [`0fe3a7ed5`](https://github.com/withastro/astro/commit/0fe3a7ed5d7bb1a9fce1623e84ba14104b51223c) Thanks [@bluwy](https://github.com/bluwy)! - Removes vendored Vite's `importMeta.d.ts` file in favour of Vite 5's new `vite/types/import-meta.d.ts` export

- [#9150](https://github.com/withastro/astro/pull/9150) [`710be505c`](https://github.com/withastro/astro/commit/710be505c9ddf416e77a75343d8cae9c497d72c6) Thanks [@bluwy](https://github.com/bluwy)! - Refactors virtual modules exports. This should not break your project unless you import Astro's internal modules, including:
  - `astro/middleware/namespace`
  - `astro/transitions`
  - `astro/transitions/router`
  - `astro/transitions/events`
  - `astro/transitions/types`
  - `astro/prefetch`
  - `astro/i18n`

- Updated dependencies [[`abf601233`](https://github.com/withastro/astro/commit/abf601233f8188d118a8cb063c777478d8d9f1a3), [`addb57c8e`](https://github.com/withastro/astro/commit/addb57c8e80b7b67ec61224666f3a1db5c44410c), [`c7953645e`](https://github.com/withastro/astro/commit/c7953645eeaaf9e87c6db4494b0023d2c1878ff0)]:
  - @astrojs/markdown-remark@4.0.0-beta.0
