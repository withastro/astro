# 👩‍🚀 Astro

A next-generation static-site generator with partial hydration. Use your favorite JS framework and ship bare-minimum JS (or none at all!).

## 🔧 Setup

```
npm install astro
```

## 🧞 Development

Add a `dev` npm script to your `/package.json` file:

```json
{
  "scripts": {
    "dev": "astro dev ."
  }
}
```

Then run:

```
npm run dev
```

### ⚙️ Configuration

To configure Astro, add a `astro.config.mjs` file in the root of your project. All of the options can be omitted. Here are the defaults:

```js
export default {
  /** Where to resolve all URLs relative to. Useful if you have a monorepo project. */
  projectRoot: '.',
  /** Path to Astro components, pages, and data */
  astroRoot: './astro',
  /** When running `astro build`, path to final static output */
  dist: './_site',
  /** A folder of static files Astro will copy to the root. Useful for favicons, images, and other files that don‘t need processing. */
  public: './public',
  /** Extension-specific handlings */
  extensions: {
    /** Set this to "preact" or "react" to determine what *.jsx files should load */
    '.jsx': 'react',
  },
};
```

### 💧 Partial Hydration

By default, Astro outputs zero client-side JS. If you'd like to include an interactive component in the client output, you may use any of the following techniques.

- `<MyComponent />` will render an HTML-only version of `MyComponent` (default)
- `<MyComponent:load />` will render `MyComponent` on page load
- `<MyComponent:idle />` will use [requestIdleCallback()][request-idle-cb] to render `MyComponent` as soon as main thread is free
- `<MyComponent:visible />` will use an [IntersectionObserver][intersection-observer] to render `MyComponent` when the element enters the viewport

### 💅 Styling

If you‘ve used [Svelte][svelte]’s styles before, Astro works almost the same way. In any `.astro` file, start writing styles in a `<style>` tag like so:

```html
<style>
  .scoped {
    font-weight: bold;
  }
</style>

<div class="scoped">I’m a scoped style</div>
```

#### 👓 Sass

Astro also supports [Sass][sass] out-of-the-box; no configuration needed:

```html
<style lang="scss">
  @use "../tokens" as *;

  .title {
    color: $color.gray;
  }
</style>

<h1 class="title">Title</h1>
```

Supports:

- `lang="scss"`: load as the `.scss` extension
- `lang="sass"`: load as the `.sass` extension (no brackets; indent-style)

#### 🦊 Autoprefixer

We also automatically add browser prefixes using [Autoprefixer][autoprefixer]. By default, Astro loads the default values, but you may also specify your own by placing a [Browserslist][browserslist] file in your project root.

#### 🍃 Tailwind

Astro can be configured to use [Tailwind][tailwind] easily! Install the dependencies:

```
npm install @tailwindcss/jit tailwindcss
```

And also create a `tailwind.config.js` in your project root:

```
module.exports = {
  // your options here
}
```

_Note: a Tailwind config file is currently required to enable Tailwind in Astro, even if you use the default options._

Then write Tailwind in your project just like you‘re used to:

```html
<style>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
```

#### 🍱 Collections (beta)

Astro’s Collections API is useful for grabbing collections of content. Currently only `*.md` files are supported.

##### 🔽 Markdown

```jsx
// pages/blog.astro
---
import PostPreview from '../components/PostPreview.astro';

const blogPosts = import.meta.collections('./post/*.md');
---

<main>
  <h1>Blog Posts</h1>
  {blogPosts.map((post) => (
    <PostPreview post={post} />
  )}
</main>
```

This will load all markdown files located in `/pages/post/*.md`, compile them into an array, then expose them to the page.

If you were to inspect the array, you‘d find the following schema:

```js
const blogPosts = [
  {
    content: string, // Markdown converted to HTML
    // all other frontmatter data
  },
  // …
];
```

##### 🧑‍🍳 Advanced usage

All of the following options are supported under the 2nd parameter of `import.meta.collections()`:

```js
const collection = import.meta.collections('./post/*.md', {
  /** If `page` is omitted, all results are returned */
  page: 1, // ⚠️ starts at 1, not 0
  /** How many items should be returned per-page (ignored if `page` is missing; default: 25) */
  perPage: 25,
  /** How items should be sorted (default: no sort) */
  sort(a, b) {
    return new Date(b.date) - new Date(a.date); // sort newest first, by `date` in frontmatter
  }
  /** Should items be filtered by their frontmatter data? */
  filter(post) {
    return post.tag === 'movie'; // (optional) only return posts tagged "movie"
  }
});
```

## 🚀 Build & Deployment

Add a `build` npm script to your `/package.json` file:

```json
{
  "scripts": {
    "dev": "astro dev .",
    "build": "astro build ."
  }
}
```

Then run:

```
npm run build
```

Now upload the contents of `/_site_` to your favorite static site host.

[autoprefixer]: https://github.com/postcss/autoprefixer
[browserslist]: https://github.com/browserslist/browserslist
[intersection-observer]: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
[request-idle-cb]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
[sass]: https://sass-lang.com/
[svelte]: https://svelte.dev
[tailwind]: https://tailwindcss.com
