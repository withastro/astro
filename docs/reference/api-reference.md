---
layout: ~/layouts/MainLayout.astro
title: API Reference
---

## `Astro` global

The `Astro` global is available in all contexts in `.astro` files. It has the following functions:

### `Astro.fetchContent()`

`Astro.fetchContent()` is a way to load local `*.md` files into your static site setup. You can either use this on its own, or within [Astro Collections](/core-concepts/collections).

```jsx
// ./src/components/my-component.astro
---
const data = Astro.fetchContent('../pages/post/*.md'); // returns an array of posts that live at ./src/pages/post/*.md
---

<div>
{data.slice(0, 3).map((post) => (
  <article>
    <h1>{post.title}</h1>
    <p>{post.description}</p>
    <a href={post.url}>Read more</a>
  </article>
))}
</div>
```

`.fetchContent()` only takes one parameter: a relative URL glob of which local files you'd like to import. Currently only `*.md` files are supported. It's synchronous, and returns an array of items of type:

```js
{
   /** frontmatter from the post.. example frontmatter:
    title: '',
    tag: '',
    date: '',
    image: '',
    author: '',
    description: '',
   **/
    astro: {
      headers: [],  // an array of h1...h6 elements in the markdown file
      source: '',    // raw source of the markdown file
      html: ''      // rendered HTML of the markdown file
    },
    url: '' // the rendered path
  }[]
```

### `Astro.slots`

`Astro.slots` returns an object with any slotted regions passed into the current Astro file.

```js
const {
  heading as headingSlot, // true or undefined, based on whether `<* slot="heading">` was used.
  default as defaultSlot, // true or undefined, based on whether `<* slot>` or `<* default>` was used.
} = Astro.slots;
```

### `Astro.request`

`Astro.request` returns an object with the following properties:

| Name           | Type  | Description                                     |
| :------------- | :---- | :---------------------------------------------- |
| `url`          | `URL` | The URL of the request being rendered.          |
| `canonicalURL` | `URL` | [Canonical URL][canonical] of the current page. |

⚠️ Temporary restriction: this is only accessible in top-level pages and not in sub-components.

### `Astro.site`

`Astro.site` returns a `URL` made from `buildOptions.site` in your Astro config. If undefined, this will return a URL generated from `localhost`.

## Collections API

### `collection` prop

```jsx
const { collection } = Astro.props;
```

When using the [Collections API](/core-concepts/collections), `collection` is a prop exposed to the page with the following shape:

| Name                      |         Type          | Description                                                                                                                       |
| :------------------------ | :-------------------: | :-------------------------------------------------------------------------------------------------------------------------------- |
| `collection.data`         |        `Array`        | Array of data returned from `data()` for the current page.                                                                        |
| `collection.start`        |       `number`        | Index of first item on current page, starting at `0` (e.g. if `pageSize: 25`, this would be `0` on page 1, `25` on page 2, etc.). |
| `collection.end`          |       `number`        | Index of last item on current page.                                                                                               |
| `collection.total`        |       `number`        | The total number of items across all pages.                                                                                       |
| `collection.page.current` |       `number`        | The current page number, starting with `1`.                                                                                       |
| `collection.page.size`    |       `number`        | How many items per-page.                                                                                                          |
| `collection.page.last`    |       `number`        | The total number of pages.                                                                                                        |
| `collection.url.current`  |       `string`        | Get the URL of the current page (useful for canonical URLs)                                                                       |
| `collection.url.prev`     | `string \| undefined` | Get the URL of the previous page (will be `undefined` if on page 1).                                                              |
| `collection.url.next`     | `string \| undefined` | Get the URL of the next page (will be `undefined` if no more pages).                                                              |
| `collection.params`       |       `object`        | If page params were used, this returns a `{ key: value }` object of all values.                                                   |

### `createCollection()`

```jsx
export async function createCollection() {
  return {
    async data({ params }) {
      // load data
    },
    pageSize: 25,
    routes: [{ tag: 'movie' }, { tag: 'television' }],
    permalink: ({ params }) => `/tag/${params.tag}`,
  };
}
```

When using the [Collections API](/core-concepts/collections), `createCollection()` is an async function that returns an object of the following shape:

| Name        |                   Type                   | Description                                                                                                |
| :---------- | :--------------------------------------: | :--------------------------------------------------------------------------------------------------------- |
| `data`      |      `async ({ params }) => any[]`       | **Required.** Load an array of data with this function to be returned.                                     |
| `pageSize`  |                 `number`                 | Specify number of items per page (default: `25`).                                                          |
| `routes`    |                `params[]`                | **Required for URL Params.** Return an array of all possible URL `param` values in `{ name: value }` form. |
| `permalink` |         `({ params }) => string`         | **Required for URL Params.** Given a `param` object of `{ name: value }`, generate the final URL.\*        |
| `rss`       | [RSS](/reference/api-reference#rss-feed) | Optional: generate an RSS 2.0 feed from this collection ([docs](/reference/api-reference#rss-feed))        |

_\* Note: don't create confusing URLs with `permalink`, e.g. rearranging params conditionally based on their values._

⚠️ `createCollection()` executes in its own isolated scope before page loads. Therefore you can't reference anything from its parent scope. If you need to load data you may fetch or use async `import()`s within the function body for anything you need (that's why it's `async`—to give you this ability). If it wasn't isolated, then `collection` would be undefined! Therefore, duplicating imports between `createCollection()` and your Astro component is OK.

#### RSS Feed

You can optionally generate an RSS 2.0 feed from `createCollection()` by adding an `rss` option. Here are all the options:

```jsx
export async function createCollection() {
  return {
    async data({ params }) {
      // load data
    },
    pageSize: 25,
    rss: {
      title: 'My RSS Feed',
      description: 'Description of the feed',
      /** (optional) add xmlns:* properties to root element */
      xmlns: {
        itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        content: 'http://purl.org/rss/1.0/modules/content/',
      },
      /** (optional) add arbitrary XML to <channel> */
      customData: `<language>en-us</language>
<itunes:author>The Sunset Explorers</itunes:author>`,
      /** Format each item from things returned in data() */
      item: (item) => ({
        title: item.title,
        description: item.description,
        pubDate: item.pubDate + 'Z', // enforce GMT timezone (otherwise it'll be different based on where it's built)
        /** (optional) add arbitrary XML to each <item> */
        customData: `<itunes:episodeType>${item.type}</itunes:episodeType>
<itunes:duration>${item.duration}</itunes:duration>
<itunes:explicit>${item.explicit || false}</itunes:explicit>`,
      }),
    },
  };
}
```

Astro will generate an RSS 2.0 feed at `/feed/[collection].xml` (for example, `/src/pages/$podcast.xml` would generate `/feed/podcast.xml`).

⚠️ Even though Astro will create the RSS feed for you, you'll still need to add `<link>` tags manually in your `<head>` HTML:

```html
<link
  rel="alternate"
  type="application/rss+xml"
  title="My RSS Feed"
  href="/feed/podcast.xml"
/>
```

## `import.meta`

All ESM modules include a `import.meta` property. Astro adds `import.meta.env` through [Snowpack](https://www.snowpack.dev/).

**import.meta.env.SSR** can be used to know when rendering on the server. Sometimes you might want different logic, for example a component that should only be rendered in the client:

```jsx
import { h } from 'preact';

export default function () {
  return import.meta.env.SSR ? <div class="spinner"></div> : <FancyComponent />;
}
```

[canonical]: https://en.wikipedia.org/wiki/Canonical_link_element
