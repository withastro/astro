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

Astro’s Collections API can be used for paginating content whether local `*.md` files or data from a headless CMS.

First, decide on a URL schema. For our example, perhaps you want all your paginated posts at `/posts/1`, `/posts/2`, etc. But in addition, you also wanted `/tag/[tag]` and `/year/[year]` collections where posts are filtered by tag or year.

Next, for each “owner” of a URL tree, create a `/astro/pages/$[collection].astro` file. So in our example, we‘d need 3:

```
└── astro/
    └── pages/
        ├── $posts.astro     -> /posts/1, /posts/2, …
        ├── $tag.astro       -> /tag/[tag]/1, /tag/[tag]/2, …
        └── $year.astro      -> /year/[year]/1, /year/[year]/2, …
```

Lastly, in each `$[collection].astro` file, add 2 things:

```js
export let collection: any;
```

```js
export async function createCollection() {
  return {
    async data() {
      // return data here to load (we‘ll cover how later)
    },
  };
}
```

These are important so your data is exposed to the page as a prop, and also Astro has everything it needs to gather your data and generate the proper routes. How it does this is more clear if we walk through a practical example.

##### Example 1: Simple pagination

Assume we have Markdown files that have `title`, `tag`, and `date` in their frontmatter, like so:

```md
---
title: My Blog Post
tag: javascript
date: 2021-03-01 09:34:00
---

# My Blog post

…
```

It‘s important to know that these could be anything! There’s no restrictions around what can go in your frontmatter, but these will explain values we see later. Assume nothing is “special“ or reserved; we named everything.

Also, assume we want the following final routes:

- Individual blog posts live at `/post/[slug]`.
- The paginated blog posts live at `/posts/1` for page 1, `/posts/2` for page 2, etc.
- We also want to add `/tag/[tag]/1` for tagged posts, page 1, or `/year/[year]/1` for posts by year. We’ll add these at the end.

Let’s start with paginated posts. Since we want `/posts/` to be the root, we’ll create a file at `/astro/pages/$posts.astro` (the `$` indicates that this is a multi-route page):

```html
// /astro/pages/$posts.astro
---
import Pagination from '../components/Pagination.astro';
import PostPreview from '../components/PostPreview.astro';

export let collection: any;

export async function createCollection() {
  const allPosts = await import.meta.glob('./post/*.md');       // load data that already lives at `/post/[slug]`
  allPosts.sort((a, b) => new Date(b.date) - new Date(a.date)); // sort newest -> oldest (we got "date" from frontmatter!)

  // (load more data here, if needed)

  return {
    async data() {
      return allPosts;
    },
    pageSize: 10, // how many we want to show per-page (default: 25)
  };
}
---
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Blog Posts: page {collection.page.current}</title>
    <link rel="canonical" href={collection.url.current} />
    <link rel="prev" href={collection.url.prev} />
    <link rel="next" href={collection.url.next} />
  </head>
  <body>
    <main>
      <h5>Results {collection.start + 1}–{collection.start + 1 + collection.page.size} of {collection.total}</h6>
      {collection.data.map((post) => (
        <PostPreview post={post} />
      )}
    </main>
    <footer>
      <Pagination
        currentPage={collection.page.current}
        totalPages={collection.page.last}
        prevURL={collection.url.prev}
        nextURL={collection.url.next}
      />
    </footer>
  </body>
</html>
```

Let’s walk through some of the key parts:

- `export let collection`: this is important because it exposes a prop to the page for Astro to return with all your data loaded. ⚠️ **It must be named `collection`**.
- `export async function createCollection()`: this is also required, **and must be named this exactly.** This is an async function that lets you load data from anywhere (even a remote API!). At the end, you must return an object with `{ data: yourData }`. There are other options such as `pageSize` we’ll cover later.
- `{collection.data.map((post) => (…`: this lets us iterate over all the markdown posts. This will take the shape of whatever you loaded in `createCollection()`. It will always be an array.
- `{collection.page.current}`: this, and other properties, simply return more info such as what page a user is on, what the URL is, etc. etc.

It should be noted that the above example shows `<PostPreview />` and `<Pagination />` components. Pretend those are custom components that you made to display the post data, and the pagination navigation. There’s nothing special about them; only consider those examples of how you‘d use collection data to display everything the way you‘d like.

##### Example 2: Advanced filtering & pagination

In our earlier example, we covered simple pagination for `/posts/1`, but we‘d still like to make `/tag/[tag]/1` and `/year/[year]/1`. To do that, we’ll create 2 more collections: `/astro/pages/$tag.astro` and `astro/pages/$year.astro`. Assume that the markup is the same, but we’ve expanded the `createCollection()` function with more data.

```diff
  // /astro/pages/$tag.astro
  ---
  import Pagination from '../components/Pagination.astro';
  import PostPreview from '../components/PostPreview.astro';

  export let collection: any;

  export async function createCollection() {
    const allPosts = await import.meta.glob('./post/*.md');
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
+   const allTags = [...new Set(allPosts.map((post) => post.tags).flat())];  // gather all unique tags (we got "tag" from frontmatter!)
+   allTags.sort((a, b) => a.localeCompare(b));                              // sort tags A -> Z
+   const routes = allTags.map((tag) => ({ tag }));                          // this is where we set { params: { tag } }

    return {
-     async data() {
-       return allPosts;
+     async data({ params }) {
+       return allPosts.filter((post) => post.tag === params.tag);           // filter post by "date" frontmatter, from params (we get `{ params }` from the routes array above)
      },
      pageSize: 10,
+     routes,
+     permalink: ({ params }) => `/tag/${params.tag}/`                       // important! the root must match (/tag/[tag] -> $tag.astro)
    };
  }
  ---
```

Some important concepts here:

- `routes = allTags.map((tag) => ({ tag }))`: Astro handles pagination for you automatically. But when it needs to generate multiple routes, this is where you tell Astro about all the possible routes. This way, when you run `astro build`, your static build isn‘t missing any pages.
- `permalink: ({ params }) => `/tag/${params.tag}/`: this is where you tell Astro what the generated URL should be. Note that while you have control over this, the root of this must match the filename (it‘s best **NOT** to use `/pages/$tag.astro`to generate`/year/$year.astro`; that should live at `/pages/$year.astro` as a separate file).
- `allPosts.filter((post) => post.tag === params.tag)`: we aren‘t returning all posts here; we‘re only returning posts with a matching tag. _What tag,_ you ask? The `routes` array has `[{ tag: 'javascript' }, { tag: '…`, and all the routes we need to gather. So we first need to query everything, but only return the `.filter()`ed posts at the very end.

Other things of note is that we are sorting like before, but we filter by the frontmatter `tag` property, and return those at URLs.

These are still paginated, too! But since there are other conditions applied, they live at a different URL.

Lastly, what about `/year/*`? Well hopefully you can figure that out from here. It follows the exact same pattern, except using `post.date` frontmatter. You‘ll grab the year from that date string, and sort probably newest to oldest rather than alphabetical. You‘ll also change `params.tag` to `params.year` (or whatever you name it), but otherwise most everything else should be the same.

##### Tips

- Having to load different collections in different `$[collection].astro` files might seem like a pain at first, until you remember **you can create reusable components!** Treat `/pages/*.astro` files as your one-off routing & data fetching logic, and treat `/components/*.astro` as your reusable markup. If you find yourself duplicating things too much, you can probably use a component instead!
- Stay true to `/pages/$[collection].astro` naming. If you have an `/all-posts/*` route, then use `/pages/$all-posts.astro` to manage that. Don‘t try and trick `permalink` to generate too many URL trees; it‘ll only result in pages being missed when it comes time to build.
- Need to load local markdown? Try `import.meta.glob('./data/*.md')`
- Need to load remote data? Simply `fetch()` to make it happen!

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
