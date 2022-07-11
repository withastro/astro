# @astrojs/solid-js

## 0.3.0

### Minor Changes

- [#3871](https://github.com/withastro/astro/pull/3871) [`1cc5b7890`](https://github.com/withastro/astro/commit/1cc5b78905633608e5b07ad291f916f54e67feb1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update supported `node` versions. Minimum versions are now `node@14.20.0` or `node@16.16.0`.

## 0.2.1

### Patch Changes

- [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

* [`515e8765`](https://github.com/withastro/astro/commit/515e876598c391f3824a82b757042198e0729ca6) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update peerDependencies to "solid@^1.4.3"

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

## 0.1.4

### Patch Changes

- [#3505](https://github.com/withastro/astro/pull/3505) [`2b35650b`](https://github.com/withastro/astro/commit/2b35650b5dca28b5cd5dd7c9bb689d0eee6a2ddf) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix newline characters in SolidJS JSX attributes (ex: multiline CSS classes)

## 0.1.3

### Patch Changes

- [#3455](https://github.com/withastro/astro/pull/3455) [`e9a77d86`](https://github.com/withastro/astro/commit/e9a77d861907adccfa75811f9aaa555f186d78f8) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update client hydration to check for `ssr` attribute. Requires `astro@^1.0.0-beta.36`.

## 0.1.2

### Patch Changes

- [#3140](https://github.com/withastro/astro/pull/3140) [`5e28b790`](https://github.com/withastro/astro/commit/5e28b790950bd29f4f7067082ad13b759594509f) Thanks [@hippotastic](https://github.com/hippotastic)! - Fix location of SolidJS pre-hydration code

## 0.1.1

### Patch Changes

- [`815d62f1`](https://github.com/withastro/astro/commit/815d62f151a36fef7d09590d4962ca71bda61b32) Thanks [@FredKSchott](https://github.com/FredKSchott)! - no changes.

## 0.1.0

### Minor Changes

- [#3003](https://github.com/withastro/astro/pull/3003) [`13b782f4`](https://github.com/withastro/astro/commit/13b782f421871af36978f29154c715c66739d475) Thanks [@ryansolid](https://github.com/ryansolid)! - Improve nested hydration with Solid

## 0.0.4-beta.0

### Patch Changes

- [#3003](https://github.com/withastro/astro/pull/3003) [`13b782f4`](https://github.com/withastro/astro/commit/13b782f421871af36978f29154c715c66739d475) Thanks [@ryansolid](https://github.com/ryansolid)! - Improve nested hydration with Solid

## 0.0.3

### Patch Changes

- [#2889](https://github.com/withastro/astro/pull/2889) [`71c12b90`](https://github.com/withastro/astro/commit/71c12b9047c12158c6e4e67ce0494b8d30ac6387) Thanks [@zadeviggers](https://github.com/zadeviggers)! - Correct package name in README. Package is `@astrojs/solid-js`, not `@astrojs/solid`.

## 0.0.2

### Patch Changes

- [#2885](https://github.com/withastro/astro/pull/2885) [`6b004363`](https://github.com/withastro/astro/commit/6b004363f99f27e581d1e2d53a2ebff39d7afb8a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add README across Astro built-in integrations

* [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site

## 0.0.2-next.0

### Patch Changes

- [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site
