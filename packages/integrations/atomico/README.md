# @astrojs/atomico

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your [Atomicojs](https://atomicojs.dev/) custom elements.


## Installation

### Quick Install

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

```sh
# Using NPM
npm run astro add atomico
# Using Yarns;
yarn astro add atomico
# Using PNPM
pnpm astro add atomico
```

Then, restart the dev server by typing `CTRL-C` and then `npm run astro dev` in the terminal window that was running Astro.


### Manual Install

First, install the `@astrojs/atomico` package using your package manager. If you're using npm or aren't sure, run this in the terminal:

```sh
npm install @astrojs/atomico
```

Most package managers will install associated peer dependencies as well. Still, if you see a "Cannot find package 'atomico'" (or similar) warning when you start up Astro, you'll need to install atomico.js yourself:

```sh
npm install atomico 
```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import atomico from '@astrojs/atomico';

export default defineConfig({
  // ...
  integrations: [atomico()],
});
```

Finally, restart the dev server.

## Usage

Once the integration is installed you will be able to create or import your Atomico components into any Astro page or component.

Check our [Astro Integration Documentation][astro-integration] for more on integrations.

## webcomponent hydration

__`src/components/my-component.tsx`__

```js
import { c } from 'atomico';

function myComponent(){
  return <host>Hello world!</host> 
}

export const MyComponent = c(myComponent)

customElements.define("my-component", MyComponent);
```

### Example of hydration by attribute

```astro
<my-component client:idle></my-component>  
```

### Global hydration example

```astro
<script>import('./src/components/my-component.tsx')</script>

<my-component></my-component>  
```

## Configuration

The Atomicojs integration does not support any custom configuration at this time.

## Examples

- The [atomicojs.dev](https://atomicojs.dev) site has been created using Astro + Atomico, We invite you to see the site repository as an [example of use](https://github.com/atomicojs/atomicojs.dev)

## Troubleshooting

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
