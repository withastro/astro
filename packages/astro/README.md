<img src="https://github.com/snowpackjs/astro/blob/main/assets/social/banner.png?raw=true" />

**Astro** is a _fresh but familiar_ approach to building websites. Astro combines decades of proven performance best practices with the DX improvements of the component-oriented era. Use your favorite JavaScript framework and automatically ship the bare-minimum amount of JavaScript—by default. 

Learn more: https://astro.build/blog/introducing-astro

## Project Status

⚠️ **Astro is still an early beta, missing features and bugs are to be expected!** If you can stomach it, then Astro-built sites are production ready and several production websites built with Astro already exist in the wild. We will update this note once we get closer to a stable, v1.0 release.

## 🔧 Quick Start

> __Important__: Astro is built with [ESM modules](https://nodejs.org/api/esm.html) which are not supported in older version of Node.js. The minimum supported version is __14.15.1__.

```bash
# create your project
mkdir new-project-directory
cd new-project-directory
npm init astro

# install your dependencies
npm install

# start the dev server and open your browser
npm start
```

### 🚀 Build & Deployment

The default Astro project has the following `scripts` in the `/package.json` file:

```json
{
  "scripts": {
    "start": "astro dev",
    "build": "astro build"
  }
}
```

For local development, run:

```
npm run start
```

To build for production, run the following command:

```
npm run build
```

To deploy your Astro site to production, upload the contents of `/dist` to your favorite static site host.

## 🥾 Guides

### 🚀 Basic Usage

Even though nearly-everything [is configurable][docs-config], we recommend starting out by creating an `src/` folder in your project with the following structure:

```
├── src/
│   ├── components/
│   └── pages/
│       └── index.astro
├── public/
└── package.json
```

- `src/components/*`: where your reusable components go. You can place these anywhere, but we recommend a single folder to keep them organized.
- `src/pages/*`: this is a special folder where your [routing][routing] lives.

#### 🚦 Routing

Routing happens in `src/pages/*`. Every `.astro` or `.md` file in this folder corresponds with a public URL. For example:

| Local file                             | Public URL                      |
| :------------------------------------- | :------------------------------ |
| `src/pages/index.astro`                | `/index.html`                   |
| `src/pages/post/my-blog-post.md`       | `/post/my-blog-post/index.html` |

#### 🗂 Static Assets

Static assets should be placed in a `public/` folder in your project. You can place any images, fonts, files, or global CSS in here you need to reference.

#### 🪨 Generating HTML with Astro

Astro introduces a special `.astro` format, which combines the best of HTML with the best of JavaScript.

To learn more about `.astro` files, read our complete [Syntax Guide][docs-syntax].

#### ✍️ Markdown

Spend less time configuring your tooling and more time writing content. Astro has phenomenal Markdown support (powered by [`remark`][remark]) baked in!

Not only can you use local `.md` files as pages, but Astro also comes with a `<Markdown>` component to turn every page into a Markdown file. Using the `<Markdown>` component in an `.astro` file should feel very similar to [MDX][mdx], but with the ability to use components from any framework (with [partial hydration][partial-hydration], too)!

To learn more about use Markdown in Astro, read our [Markdown Guide][docs-markdown].

#### ⚡ Dynamic Components

TODO: Astro dynamic components guide

### 💧 Partial Hydration

By default, Astro outputs zero client-side JS. If you'd like to include an interactive component in the client output, you may use any of the following techniques.

- `<MyComponent />` will render an HTML-only version of `MyComponent` (default)
- `<MyComponent:load />` will render `MyComponent` on page load
- `<MyComponent:idle />` will use [requestIdleCallback()][mdn-ric] to render `MyComponent` as soon as main thread is free
- `<MyComponent:visible />` will use an [IntersectionObserver][mdn-io] to render `MyComponent` when the element enters the viewport

### ⚛️ State Management

Frontend state management depends on your framework of choice. Below is a list of popular frontend state management libraries, and their current support with Astro.

Our goal is to support all popular state management libraries, as long as there is no technical reason that we cannot.

- **React/Preact**
  - [ ] **Redux: Partial Support** (Note: You can access a Redux store directly, but full `react-redux` support requires the ability to set a custom `<Provider>` wrapper to every component island. Planned.)
  - [x] **Recoil: Full Support**
- **Svelte**
  - [x] **Svelte Stores: Full Support**
- **Vue:**
  - [ ] **Vuex: Partial Support** (Note: You can access a vuex store directly, but full `vuex` support requires the ability to set a custom `vue.use(store)` call to every component island. Planned.)

_Are we missing your favorite state management library? Add it to the list above in a PR (or create an issue)!_

### 💅 Styling

Styling in Astro is meant to be as flexible as you’d like it to be! The following options are all supported:

| Framework        | Global CSS | Scoped CSS | CSS Modules |
| :--------------- | :--------: | :--------: | :---------: |
| Astro (`.astro`) |     ✅     |     ✅     |    N/A¹     |
| React / Preact   |     ✅     |     ❌     |     ✅      |
| Vue              |     ✅     |     ✅     |     ✅      |
| Svelte           |     ✅     |     ✅     |     ❌      |

¹ _`.astro` files have no runtime, therefore Scoped CSS takes the place of CSS Modules (styles are still scoped to components, but don’t need dynamic values)_

To learn more about writing styles in Astro, see our [Styling Guide][docs-styling].

👉 [**Styling**][docs-styling]

### 🐶 Fetching Data

Fetching data is what Astro is all about! Whether your data lives remotely in an API or in your local project, Astro has got you covered.

For fetching from a remote API, use a native JavaScript `fetch()` ([docs][fetch-js]) as you are used to. For fetching local content, use `Astro.fetchContent()` ([docs][fetch-content]).

```js
// src/components/MyComponent.Astro

---
// Example 1: fetch remote data from your own API
const remoteData = await fetch('https://api.mysite.com/v1/people').then((res) => res.json());

// Example 2: load local markdown files
const localData = Astro.fetchContent('../post/*.md');
---
```

### 🗺️ Sitemap

Astro will automatically create a `/sitemap.xml` for you for SEO! Be sure to set `buildOptions.site` in your [Astro config][docs-config] so the URLs can be generated properly.

⚠️ Note that Astro won’t inject this into your HTML for you! You’ll have to add the tag yourself in your `<head>` on all pages that need it:

```html
<link rel="sitemap" href="/sitemap.xml" />
```

##### Examples

- [Blog Example][example-blog]
- TODO: Headless CMS Example

### 🍱 Collections (beta)

[Fetching data is easy in Astro](#-fetching-data). But what if you wanted to make a paginated blog? What if you wanted an easy way to sort data, or filter data based on part of the URL? Or generate an RSS 2.0 feed? When you need something a little more powerful than simple data fetching, Astro’s Collections API may be what you need.

👉 [**Collections API**][docs-collections]

### Publishing Astro components

Using Astro components in your project allows you to break up your pages into small reuseable units of functionality. If you want to share your Astro components you can do so by publishing them to npm.

👉 [**Publishing Astro components guide**][docs-publishing]

## ⚙️ Config

Configuration for Astro is done through the `astro.config.mjs` file at the root of your project. To learn more:

👉 [**`astro.config.mjs` Reference**][docs-config]

Astro uses __[Snowpack](https://www.snowpack.dev/)__ for module resolution. You can configure Snowpack by adding a `snowpack.config.mjs` file in the root of your project. You might need this to add loader plugins, for example. To learn more:

👉 [**`snowpack.config.mjs` Reference**][docs-snowpack-config]

## 🪄 Renderers

Astro is able to render [React](https://npm.im/@astrojs/renderer-react), [Svelte](https://npm.im/@astrojs/renderer-svelte), [Vue](https://npm.im/@astrojs/renderer-vue), and [Preact](https://npm.im/@astrojs/renderer-preact) components out of the box. If you'd like to add support for another framework, you can build a **renderer** plugin using the same interface as Astro's official renderers.

👉 [**Renderer Docs**][docs-renderer]

## 📚 API

👉 [**Full API Reference**][docs-api]

## 👩🏽‍💻 CLI

👉 [**Command Line Docs**][docs-cli]

## 🏗 Development Server

👉 [**Dev Server Docs**][docs-dev]

[docs-config]: ./docs/config.md
[docs-snowpack-config]: https://www.snowpack.dev/reference/configuration
[docs-syntax]: ./docs/syntax.md
[docs-api]: ./docs/api.md
[docs-renderer]: ./docs/renderers.md
[docs-collections]: ./docs/collections.md
[docs-markdown]: ./docs/markdown.md
[docs-dev]: ./docs/dev.md
[docs-styling]: ./docs/styling.md
[example-blog]: ./examples/blog
[fetch-content]: ./docs/api.md#fetchcontent
[fetch-js]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[remark]: https://github.com/remarkjs/remark
[mdx]: https://mdxjs.com/
[mdn-io]: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
[mdn-ric]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
[partial-hydration]: #-partial-hydration
[routing]: #-routing
[docs-cli]: ./docs/cli.md
[docs-publishing]: ./docs/publishing.md
