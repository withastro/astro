# @astrojs/react

## 0.3.0

### Minor Changes

- [#3871](https://github.com/withastro/astro/pull/3871) [`1cc5b7890`](https://github.com/withastro/astro/commit/1cc5b78905633608e5b07ad291f916f54e67feb1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update supported `node` versions. Minimum versions are now `node@14.20.0` or `node@16.16.0`.

## 0.2.1

### Patch Changes

- [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.2.0

### Minor Changes

- [#3652](https://github.com/withastro/astro/pull/3652) [`7373d61c`](https://github.com/withastro/astro/commit/7373d61cdcaedd64bf5fd60521b157cfa4343558) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add support for passing named slots from `.astro` => framework components.

  Each `slot` is be passed as a top-level prop. For example:

  ```jsx
  // From .astro
  <Component>
    <h2 slot="title">Hello world!</h2>
    <h2 slot="slot-with-dash">Dash</h2>
    <div>Default</div>
  </Component>;

  // For .jsx
  export default function Component({ title, slotWithDash, children }) {
    return (
      <>
        <div id="title">{title}</div>
        <div id="slot-with-dash">{slotWithDash}</div>
        <div id="main">{children}</div>
      </>
    );
  }
  ```

## 0.1.3

### Patch Changes

- [#3455](https://github.com/withastro/astro/pull/3455) [`e9a77d86`](https://github.com/withastro/astro/commit/e9a77d861907adccfa75811f9aaa555f186d78f8) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update client hydration to check for `ssr` attribute. Requires `astro@^1.0.0-beta.36`.

## 0.1.2

### Patch Changes

- [#3337](https://github.com/withastro/astro/pull/3337) [`678c2b75`](https://github.com/withastro/astro/commit/678c2b7523c7f10cfdf2eb5a73aa2bbb7e5cbc07) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: remove hydration failures on React v18 by exposing the "client" directive from Astro core.

## 0.1.1

### Patch Changes

- [#3160](https://github.com/withastro/astro/pull/3160) [`ae9ac5cb`](https://github.com/withastro/astro/commit/ae9ac5cbdceba0687d83d56d9d5f80479ab88710) Thanks [@matthewp](https://github.com/matthewp)! - Allows using React.lazy, Suspense in SSR and with hydration

## 0.1.0

### Minor Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add support for React v18

## 0.0.2

### Patch Changes

- [#2885](https://github.com/withastro/astro/pull/2885) [`6b004363`](https://github.com/withastro/astro/commit/6b004363f99f27e581d1e2d53a2ebff39d7afb8a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add README across Astro built-in integrations

* [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site

## 0.0.2-next.0

### Patch Changes

- [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site
