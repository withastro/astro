---
layout: ~/layouts/Main.astro
title: UI Renderers
---

Astro is designed to support your favorite UI frameworks. [React](https://npm.im/@astrojs/renderer-react), [Svelte](https://npm.im/@astrojs/renderer-svelte), [Vue](https://npm.im/@astrojs/renderer-vue), and [Preact](https://npm.im/@astrojs/renderer-preact) are all built-in to Astro and supported out of the box. No configuration is needed to enable these.

Internally, each framework is supported via a framework **renderer.** A renderer is a type of Astro plugin that adds support for a framework. Some are built-in, but you can also provide your own third-party renderers to add Astro support for new frameworks.

## What is a renderer?

A renderer is an NPM package that has two responsiblities:

1. _render a component to a static string of HTML_ at build time
2. _rehydrate that HTML to create an interactive component_ on the client.

Take a look at any one of Astro's built-in [`renderers`](https://github.com/snowpackjs/astro/tree/main/packages/renderers) to see this in action. We'll go into more detail in the following sections.

## Add a renderer to Astro

Astro enables a few popular framework renderers by default. If you want to add a new renderer to your project, you first need to set the built-in renderers that you care about.

```js
// astro.config.js
export default {
  renderers: [
    // Add the framework renderers that you want to enable for your project.
    // If you set an empty array here, no UI frameworks will work.
    //  '@astrojs/renderer-svelte',
    //  '@astrojs/renderer-vue',
    //  '@astrojs/renderer-react',
    //  '@astrojs/renderer-preact',
  ],
};
```

To add a new custom renderer, install the npm package dependency in your project and then update the `renderers` array to include it:

```js
// astro.config.js
export default {
  renderers: ['my-custom-renderer', '@astrojs/renderer-svelte', '@astrojs/renderer-vue', '@astrojs/renderer-react', '@astrojs/renderer-preact'],
};
```

#### Managing Framework Versions

In Astro, the renderer plugin defines which version of your framework to use with Astro. This should be set to as wide of a range as possible, but often will be pinned to a specific major version:

- `@astrojs/renderer-vue`: `"vue": "^3.0.0"`
- `@astrojs/renderer-react`: `"react": "^17.0.0"`
- See all: https://github.com/snowpackjs/astro/tree/main/packages/renderers

This is required because the renderer itself also uses these packages and requires a specific API to work. For example, If the user updated from Vue 2 to Vue 3 (or vice versa) then the renderer itself would break since the `vue` package would have changed.

**What if I want to use a beta framework (ex: react@next)?** Check to see if the renderer has a `@next` version that you could manually install and use. If one doesn't exist, feel free to request it: https://github.com/snowpackjs/astro/issues/new/choose

**What if I need to override the framework version in my project?** You can use the "resolutions" feature of many npm package managers to override or pin the framework version for your entire project. Just be sure to select a version that is compatible with your renderer:

- **yarn:** https://classic.yarnpkg.com/en/docs/selective-version-resolutions/
- **pnpm:** https://pnpm.io/package_json#pnpmoverrides
- **npm:** see https://stackoverflow.com/questions/15806152/how-do-i-override-nested-npm-dependency-versions

## Building Your Own Renderer

> **Building a renderer?** We'd love for you to contribute renderers for popular frameworks back to the Astro repo. Feel free to open an issue or pull request to discuss.

A simple renderer only needs a few files:

```
/my-custom-renderer/
├── package.json
├── index.js
├── server.js
└── client.js
```

### Package Manifest (`package.json`)

A renderer should include any framework dependencies as package dependencies. For example, `@astrojs/renderer-react` includes `react` & `react-dom` as dependencies in the `package.json` manifest.

```js
// package.json
"name": "@astrojs/renderer-react",
"dependencies": {
  "react": "^17.0.0",
  "react-dom": "^17.0.0"
}
```

This means that Astro users don't need to install the UI framework packages themselves. The renderer is the only package that your users will need to install.

### Renderer Entrypoint (`index.js`)

The main entrypoint of a renderer is a simple JS file which exports a manifest for the renderer. The required values are `name`, `server`, and `client`.

Additionally, this entrypoint can define a [Snowpack plugin](https://www.snowpack.dev/guides/plugins) that should be used to load non-JavaScript files.

```js
export default {
  name: '@astrojs/renderer-xxx', // the renderer name
  client: './client.js', // relative path to the client entrypoint
  server: './server.js', // relative path to the server entrypoint
  snowpackPlugin: '@snowpack/plugin-xxx', // optional, the name of a snowpack plugin to inject
  snowpackPluginOptions: { example: true }, // optional, any options to be forwarded to the snowpack plugin
  knownEntrypoint: ['framework'], // optional, entrypoint modules that will be used by compiled source
};
```

### Server Entrypoint (`server.js`)

The server entrypoint of a renderer is responsible for checking if a component should use this renderer, and if so, how that component should be rendered to a string of static HTML.

```js
export default {
  // should Component use this renderer?
  check(Component, props, childHTML) {},
  // Component => string of static HTML
  renderToStaticMarkup(Component, props, childHTML) {},
};
```

#### `check`

`check` is a function that determines whether a Component should be "claimed" by this renderer.

In it's simplest form, it can check for the existence of a flag on Object-based components.

```js
function check(Component) {
  return Component.isMyFrameworkComponent;
}
```

In more complex scenarios, like when a Component is a `Function` without any flags, you may need to use `try/catch` to attempt a full render. This result is cached so that it only runs once per-component.

```js
function check(Component, props, childHTML) {
  try {
    const { html } = renderToStaticMarkup(Component, props, childHTML);
    return Boolean(html);
  } catch (e) {}
  return false;
}
```

#### `renderToStaticMarkup`

`renderToStaticMarkup` is a function that renders a Component to a static string of HTML. There's usually a method exported by frameworks named something like `renderToString`.

```js
import { renderToString } from 'xxx';

function renderToStaticMarkup(Component, props, childHTML) {
  const html = renderToString(h(Component, { ...props, innerHTML: childHTML }));
  return { html };
}
```

Note that `childHTML` is an HTML string representing this component's children. If your framework does not support rendering HTML directly, you are welcome to use a wrapper component. By convention, Astro uses the `astro-fragment` custom element to inject `childHTML` into. Your renderer should use that, too.

```js
import { h, renderToString } from 'xxx';

const Wrapper = ({ value }) => h('astro-fragment', { dangerouslySetInnerHTML: { __html: value } });

function renderToStaticMarkup(Component, props, childHTML) {
  const html = renderToString(h(Component, props, h(Wrapper, { value: childHTML })));
  return { html };
}
```

### Client Entrypoint (`client.js`)

The client entrypoint of a renderer is responsible for rehydrating static HTML (the result of `renderToStaticMarkup`) back into a fully interactive component. Its `default` export should be a `function` which accepts the host element of the Component, an `astro-root` custom element.

> If your framework supports non-destructive component hydration (as opposed to a destructive `render` method), be sure to use that! Following your framework's Server Side Rendering (SSR) guide should point you in the right direction.

```js
import { hydrate } from 'xxx';

export default (element) => {
  return (Component, props, childHTML) => {
    hydrate(h(Component, { ...props, innerHTML: childHTML }), element);
  };
};
```

Note that `childHTML` is an HTML string representing this component's children. If your framework does not support rendering HTML directly, you should use the same wrapper component you used for the server entrypoint.

```js
import { h, hydrate } from 'xxx';
import SharedWrapper from './SharedWrapper.js';

export default (element) => {
  return (Component, props, childHTML) => {
    hydrate(h(Component, props, h(SharedWrapper, { value: childHTML })), element);
  };
};
```

[astro-config]: ./config.md
