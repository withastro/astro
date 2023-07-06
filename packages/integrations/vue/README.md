# @astrojs/vue 💚

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your [Vue 3](https://vuejs.org/) components.

## Installation

There are two ways to add integrations to your project. Let's try the most convenient option first!

### `astro add` command

Astro includes a CLI tool for adding first party integrations: `astro add`. This command will:

1. (Optionally) Install all necessary dependencies and peer dependencies
2. (Also optionally) Update your `astro.config.*` file to apply this integration

To install `@astrojs/vue`, run the following from your project directory and follow the prompts:

```sh
# Using NPM
npx astro add vue
# Using Yarn
yarn astro add vue
# Using PNPM
pnpm astro add vue
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Install dependencies manually

First, install the `@astrojs/vue` integration like so:

```sh
npm install @astrojs/vue
```

Most package managers will install associated peer dependencies as well. Still, if you see a "Cannot find package 'vue'" (or similar) warning when you start up Astro, you'll need to install Vue:

```sh
npm install vue
```

Now, apply this integration to your `astro.config.*` file using the `integrations` property:

```js ins={3} "vue()"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  // ...
  integrations: [vue()],
});
```

## Getting started

To use your first Vue component in Astro, head to our [UI framework documentation][astro-ui-frameworks]. You'll explore:

- 📦 how framework components are loaded,
- 💧 client-side hydration options, and
- 🤝 opportunities to mix and nest frameworks together

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components

## Options

This integration is powered by `@vitejs/plugin-vue`. To customize the Vue compiler, options can be provided to the integration. See the `@vitejs/plugin-vue` [docs](https://www.npmjs.com/package/@vitejs/plugin-vue) for more details.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  // ...
  integrations: [
    vue({
      template: {
        compilerOptions: {
          // treat any tag that starts with ion- as custom elements
          isCustomElement: (tag) => tag.startsWith('ion-'),
        },
      },
      // ...
    }),
  ],
});
```

### appEntrypoint

You can extend the Vue `app` instance setting the `appEntrypoint` option to a root-relative import specifier (for example, `appEntrypoint: "/src/pages/_app"`).

The default export of this file should be a function that accepts a Vue `App` instance prior to rendering, allowing the use of [custom Vue plugins](https://vuejs.org/guide/reusability/plugins.html), `app.use`, and other customizations for advanced use cases.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [vue({ appEntrypoint: '/src/pages/_app' })],
});
```

```js
// src/pages/_app.ts
import type { App } from 'vue';
import i18nPlugin from 'my-vue-i18n-plugin';

export default (app: App) => {
  app.use(i18nPlugin);
};
```

### jsx

You can use Vue JSX by setting `jsx: true`.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [vue({ jsx: true })],
});
```

This will enable rendering for both Vue and Vue JSX components. To customize the Vue JSX compiler, pass an options object instead of a boolean. See the `@vitejs/plugin-vue-jsx` [docs](https://www.npmjs.com/package/@vitejs/plugin-vue-jsx) for more details.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [
    vue({
      jsx: {
        // treat any tag that starts with ion- as custom elements
        isCustomElement: (tag) => tag.startsWith('ion-'),
      },
    }),
  ],
});
```
