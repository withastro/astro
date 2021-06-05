# 🪄 Renderers

Astro is able to render [React](https://npm.im/@astrojs/renderer-react), [Svelte](https://npm.im/@astrojs/renderer-svelte), [Vue](https://npm.im/@astrojs/renderer-vue), and [Preact](https://npm.im/@astrojs/renderer-preact) components out of the box. This is because Astro's [default configuration][astro-config] relies on **renderers** for those frameworks.

If you'd like to add support for another framework, you can build a **renderer** plugin using the same interface as Astro's official renderers.

## What is a renderer?

A renderer is an NPM package that has two responsiblities—the first is to _render a component to a static string of HTML_ at build time and the second is to _rehydrate that HTML_ to an interactive component on the client.

Without getting too much further, it might be helpful to take a look at Astro's built-in [`renderers`](https://github.com/snowpackjs/astro/tree/main/packages/renderers). We'll go into more detail in the following sections.

## Enabling a new renderer

To enable a new renderer, add the dependency to your project and update the `renderers` array to include it.

```diff
 export default {
   renderers: [
+    'my-custom-renderer',
     '@astrojs/renderer-svelte',
     '@astrojs/renderer-vue',
     '@astrojs/renderer-react',
     '@astrojs/renderer-preact',
   ],
 }
```

## Building a new renderer

A simple renderer only needs a few files.

```
/renderer-xxx/
├── package.json
├── index.js
├── server.js
└── client.js
```

Two quick notes before we dive into these files individually.

1. We'd love for you to contribute any renderer you build directly to the Astro repo. This will allow us to publish it under `@astrojs/renderer-xxx`! Feel free to open a pull request.
2. Your renderer doesn't need to be written in ESM, but it's pretty straightforward! Add `"type": "module"` to your `package.json` file and be sure to [define a valid `export` map](https://nodejs.org/api/packages.html#packages_package_entry_points).

## Renderer Entrypoint (`index.js`)

The main entrypoint of a renderer is a simple JS file which exports a manifest for the renderer. The required values are `name`, `server`, and `client`.

Additionally, this entrypoint can optionally define a [Snowpack plugin](https://www.snowpack.dev/guides/plugins) that should be used to load non-JavaScript files.

```js
export default {
  name: '@astrojs/renderer-xxx', // the renderer name
  client: './client.js', // relative path to the client entrypoint
  server: './server.js', // relative path to the server entrypoint
  snowpackPlugin: '@snowpack/plugin-xxx', // optional, the name of a snowpack plugin to inject
  snowpackPluginOptions: { example: true }, // optional, any options to be forwarded to the snowpack plugin
};
```

## Server entrypoint (`server.js`)

The server entrypoint of a renderer is responsible for checking if a component should use this renderer, and if so, how that component should be rendered to a string of static HTML.

```js
export default {
  // should Component use this renderer?
  check(Component, props, childHTML) {},
  // Component => string of static HTML
  renderToStaticMarkup(Component, props, childHTML) {},
};
```

### `check`

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

### `renderToStaticMarkup`

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

## Client entrypoint (`client.js`)

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
