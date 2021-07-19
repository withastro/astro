---
layout: ~/layouts/Main.astro
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

`.fetchContent()` only takes one parameter: a relative URL glob of which local files you’d like to import. Currently only `*.md` files are supported. It’s synchronous, and returns an array of items of type:

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
      source: ''    // raw source of the markdown file
      html: ''      // rendered HTML of the markdown file
    },
    url: '' // the rendered path
  }[]
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
// Example: pages/$tags.astro
export async function createCollection() {
  // load data here
  return {
    route: '/tags/:tag',
    paths() {
      return [
        { params: {tag: 'movie'} }, 
        { params: {tag: 'television'} }, 
      ];
    },
    async props({ params }) {
      // load page-specific data here
      if (params.tag === 'movie') {
        return {items: ['Movie 1', 'Movie 2', 'Movie 3']};
      } else {
        return {items: ['TV 1', 'TV 2', 'TV 3']};
      }
    },
  };
}
```

When using the [Collections API](/core-concepts/collections), `createCollection()` is an async function that returns an object of the following shape:

| Name       |                   Type                   | Description                                                                                                                                                                                                                             |
| :--------- | :--------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `route`    |                 `string`                 | **Required.** A route pattern for matching URL requests. This is used to generate the page URL in your final build. It must begin with the file name: for example, `pages/$tags.astro` must return a `route` that starts with `/tags/`. |
| `paths`    |           `{params: Params}[]`           | Return an array of all URL to be generated.                                                                                                                                                                                             |
| `props`    | `async ({ params, paginate }) => object` | **Required.** Load data for the page that will get passed to the page component as props.                                                                                                                                               |
| `paginate` |                `boolean`                 | Optional: Enable automatic pagination.                                                                                                                                                                                                  |
| `rss`      | [RSS](/reference/api-reference#rss-feed) | Optional: generate an RSS 2.0 feed from this collection ([docs](/reference/api-reference#rss-feed))                                                                                                                                     |

⚠️ `createCollection()` executes in its own isolated scope before page loads. Therefore you can’t reference anything from its parent scope. If you need to load data you may fetch or use async `import()`s within the function body for anything you need (that’s why it’s `async`—to give you this ability). Therefore, duplicating imports between `createCollection()` and your Astro component is OK.

### Pagination

Automatic pagination is a first-class feature of Astro. Set `paginate: true` in your createCollection response to enable it.

The `paginate()` function that you use inside of `props()` returns a special `CollectionResult`data type. The `CollectionResult` object is the paginated prop that gets passed to your page component, and includes metadata about pagination. This can help you design UI for moving across pages, showing the current page size, etc.

📚 Learn more about pagination in our [Astro Collections guide.](/core-concepts/collections).

```ts
interface CollectionResult<T = any> {
  /** result */
  data: T[];

  /** metadata */
  /** the count of the first item on the page, starting from 0 */
  start: number;
  /** the count of the last item on the page, starting from 0 */
  end: number;
  /** total number of results */
  total: number;
  page: {
    /** the current page number, starting from 1 */
    current: number;
    /** number of items per page (default: 25) */
    size: number;
    /** number of last page */
    last: number;
  };
  url: {
    /** url of the current page */
    current: string;
    /** url of the previous page (if there is one) */
    prev: string | undefined;
    /** url of the next page (if there is one) */
    next: string | undefined;
  };
}
```

#### RSS Feed

You can generate an RSS 2.0 feed from the `createCollection()` result by adding an `rss` option. Here are all the options:

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
        pubDate: item.pubDate + 'Z', // enforce GMT timezone (otherwise it’ll be different based on where it’s built)
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

⚠️ Even though Astro will create the RSS feed for you, you’ll still need to add `<link>` tags manually in your `<head>` HTML:

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

**import.meta.env.SSR** can be used to know when rendering on the server. Some times you might want different logic, for example a component that should only be rendered in the client:

```jsx
import { h } from 'preact';

export default function () {
  return import.meta.env.SSR ? <div class="spinner"></div> : <FancyComponent />;
}
```

[canonical]: https://en.wikipedia.org/wiki/Canonical_link_element
