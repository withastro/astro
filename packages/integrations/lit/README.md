# @astrojs/lit 🔥

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your [Lit](https://lit.dev/) custom elements.

## Installation

There are two ways to add integrations to your project. Let's try the most convenient option first!

### `astro add` command

Astro includes a CLI tool for adding first party integrations: `astro add`. This command will:

1. (Optionally) Install all necessary dependencies and peer dependencies
2. (Also optionally) Update your `astro.config.*` file to apply this integration

To install `@astrojs/lit`, run the following from your project directory and follow the prompts:

```sh
# Using NPM
npx astro add lit
# Using Yarn
yarn astro add lit
# Using PNPM
pnpm astro add lit
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Install dependencies manually

First, install the `@astrojs/lit` integration like so:

```sh
npm install @astrojs/lit
```

Most package managers will install associated peer dependencies as well. Still, if you see a "Cannot find package 'lit'" (or similar) warning when you start up Astro, you'll need to install `lit` and `@webcomponents/template-shadowroot`:

```sh
npm install lit @webcomponents/template-shadowroot
```

Now, apply this integration to your `astro.config.*` file using the `integrations` property:

```js ins={3} "lit()"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';

export default defineConfig({
  // ...
  integrations: [lit()],
});
```

## Getting started

To use your first Lit component in Astro, head to our [UI framework documentation][astro-ui-frameworks]. This explains:

- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🤝 opportunities to mix and nest frameworks together

However, there's a key difference with Lit _custom elements_ over conventional _components_: you can use the element tag name directly.

Astro needs to know which tag is associated with which component script. We expose this through exporting a `tagName` variable from the component script. It looks like this:

```js
// src/components/my-element.js
import { LitElement, html } from 'lit';

const tagName = 'my-element';

export class MyElement extends LitElement {
  render() {
    return html` <p>Hello world! From my-element</p> `;
  }
}

customElements.define(tagName, MyElement);
```

> Note that exporting the `tagName` is **required** if you want to use the tag name in your templates. Otherwise you can export and use the constructor, like with non custom element frameworks.

In your Astro template import this component as a side-effect and use the element.

```astro
---
// src/pages/index.astro
import { MyElement } from '../components/my-element.js';
---

<MyElement />
```

> Note that Lit requires browser globals such as `HTMLElement` and `customElements` to be present. For this reason the Lit renderer shims the server with these globals so Lit can run. You _might_ run into libraries that work incorrectly because of this.

### Polyfills & Hydration

The renderer automatically handles adding appropriate polyfills for support in browsers that don't have Declarative Shadow DOM. The polyfill is about _1.5kB_. If the browser does support Declarative Shadow DOM then less than 250 bytes are loaded (to feature detect support).

Hydration is also handled automatically. You can use the same hydration directives such as `client:load`, `client:idle` and `client:visible` as you can with other libraries that Astro supports.

```astro
---
import { MyElement } from '../components/my-element.js';
---

<MyElement client:visible />
```

The above will only load the element's JavaScript when the user has scrolled it into view. Since it is server rendered they will not see any jank; it will load and hydrate transparently.

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

Common issues are listed below:

### Browser globals

The Lit integration's SSR works by adding a few browser global properties to the global environment. Some of the properties it adds includes `window`, `document`, and `location`.

These globals _can_ interfere with other libraries that might use the existence of these variables to detect that they are running in the browser, when they are actually running in the server. This can cause bugs with these libraries.

Because of this, the Lit integration might not be compatible with these types of libraries. One thing that can help is changing the order of integrations when Lit is interfering with other integrations:

```diff
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import lit from '@astrojs/lit';

export default defineConfig({
-  integrations: [vue(), lit()]
+  integrations: [lit(), vue()]
});
```

The correct order might be different depending on the underlying cause of the problem. This is not guaranteed to fix every issue however, and some libraries cannot be used if you are using the Lit integration because of this.

### Strict package managers

When using a [strict package manager](https://pnpm.io/pnpm-vs-npm#npms-flat-tree) like `pnpm`, you may get an error such as `ReferenceError: module is not defined` when running your site. To fix this, hoist Lit dependencies with an `.npmrc` file:

```ini title=".npmrc"
public-hoist-pattern[]=*lit*
```

### Limitations

The Lit integration is powered by `@lit-labs/ssr` which has some limitations. See their [limitations documentation](https://www.npmjs.com/package/@lit-labs/ssr#user-content-notes-and-limitations) to learn more.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
