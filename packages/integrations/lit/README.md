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
pnpx astro add lit
```

If you run into any hiccups, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

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

__`astro.config.mjs`__

```js
import lit from '@astrojs/lit';

export default {
  // ...
  integrations: [lit()],
}
```

## Getting started

To use your first Lit component in Astro, head to our [UI framework documentation][astro-ui-frameworks]. This explains:
- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🪆 opportunities to mix and nest frameworks together

However, there's a key difference with Lit _custom elements_ over conventional _components_: you can use the element tag name directly.

Astro needs to know which tag is associated with which component script. We expose this through exporting a `tagName` variable from the component script. It looks like this:

__`src/components/my-element.js`__

```js
import { LitElement, html } from 'lit';

export const tagName = 'my-element';

class MyElement extends LitElement {
  render() {
    return html` <p>Hello world! From my-element</p> `;
  }
}

customElements.define(tagName, MyElement);
```

> Note that exporting the `tagName` is __required__ if you want to use the tag name in your templates. Otherwise you can export and use the constructor, like with non custom element frameworks.

In your Astro template import this component as a side-effect and use the element.

__`src/pages/index.astro`__

```astro
---
import '../components/my-element.js';
---

<my-element></my-element>
```

> Note that Lit requires browser globals such as `HTMLElement` and `customElements` to be present. For this reason the Lit renderer shims the server with these globals so Lit can run. You *might* run into libraries that work incorrectly because of this.

### Polyfills & Hydration

The renderer automatically handles adding appropriate polyfills for support in browsers that don't have Declarative Shadow DOM. The polyfill is about *1.5kB*. If the browser does support Declarative Shadow DOM then less than 250 bytes are loaded (to feature detect support).

Hydration is also handled automatically. You can use the same hydration directives such as `client:load`, `client:idle` and `client:visible` as you can with other libraries that Astro supports.

```astro
---
import '../components/my-element.js';
---

<my-element client:visible />
```

The above will only load the element's JavaScript when the user has scrolled it into view. Since it is server rendered they will not see any jank; it will load and hydrate transparently.

### More documentation

Check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
