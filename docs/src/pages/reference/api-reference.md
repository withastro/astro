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

A collection is any file in the `src/pages` directory that starts with a dollar sign (`$`) and includes an exported `createCollection` function in the component script.

Check out our [Astro Collections](/core-concepts/collections) guide for more information and examples.

### `createCollection()`

```jsx
---
export async function createCollection() {
  return { /* ... */ };
}
---
<!-- Your HTML template here. -->
```

⚠️ The `createCollection()` function executes in its own isolated scope before page loads. Therefore you can't reference anything from its parent scope, other than file imports. The compiler will warn if you break this requirement.

The `createCollection()` function should returns an object of the following shape:

| Name       |                   Type                   | Description                                                                                                                                                                                                                             |
| :--------- | :--------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `route`    |                 `string`                 | **Required.** A route pattern for matching URL requests. This is used to generate the page URL in your final build. It must begin with the file name: for example, `pages/$tags.astro` must return a `route` that starts with `/tags/`. |
| `paths`    |           `{params: Params}[]`           | Return an array of all URL to be generated.                                                                                                                                                                                             |
| `props`    | `async ({ params, paginate }) => object` | **Required.** Load data for the page that will get passed to the page component as props.                                                                                                                                               |
| `paginate` |                `boolean`                 | Optional: Enable automatic pagination. See next section.                                                                                                                                                                                |
| `rss`      | [RSS](/reference/api-reference#rss-feed) | Optional: generate an RSS 2.0 feed from this collection ([docs](/reference/api-reference#rss-feed))                                                                                                                                     |

### Pagination

Enable pagination for a collection by returning `paginate: true` from `createCollection()`. This passes a `paginate()` argument to `props()` that you can use to return paginated data in your HTML template via props.

The `paginate()` function that you use inside of `props()` has the following interface:

```ts
/* the "paginate()" passed to props({paginate}) */
type PaginateFunction = (
  data: any[],
  args?: {
    /* pageSize: set the number of items to be shown on every page. Defaults to 10. */
    pageSize?: number;
  }
) => PaginatedCollectionResult;

/* the paginated return value, aka the prop passed to every page in the collection. */
interface PaginatedCollectionResult {
  /** result */
  data: any[];

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

📚 Learn more about pagination (and see an example) in our [Astro Collections guide.](/core-concepts/collections).

### RSS

Create an RSS 2.0 feed for a collection by returning `paginate: true` & an `rss` object from `createCollection()`. The `rss` object will be used to generate the contents of the RSS XML file.

The `rss` object follows the `CollectionRSS`data type:

```ts
export interface CollectionRSS<T = any> {
  /** (required) Title of the RSS Feed */
  title: string;
  /** (required) Description of the RSS Feed */
  description: string;
  /** Specify arbitrary metadata on opening <xml> tag */
  xmlns?: Record<string, string>;
  /** Specify custom data in opening of file */
  customData?: string;
  /** Return data about each item */
  item: (item: T) => {
    /** (required) Title of item */
    title: string;
    /** (required) Link to item */
    link: string;
    /** Publication date of item */
    pubDate?: Date;
    /** Item description */
    description?: string;
    /** Append some other XML-valid data to this item */
    customData?: string;
  };
}
```

📚 Learn more about RSS feed generation (and see an example) in our [Astro Collections guide.](/core-concepts/collections).

## `import.meta`

> In this section we use `[dot]` to mean `.`. This is because of a bug in our build engine that is rewriting `import[dot]meta[dot]env` if we use `.` instead of `[dot]`.

All ESM modules include a `import.meta` property. Astro adds `import[dot]meta[dot]env` through [Snowpack](https://www.snowpack.dev/).

**`import[dot]meta[dot]env[dot]SSR`** can be used to know when rendering on the server. Sometimes you might want different logic, for example a component that should only be rendered in the client:

```jsx
import { h } from 'preact';

export default function () {
  // Note: rewrite "[dot]" to "." for this to to work in your project.
  return import[dot]meta[dot]env[dot]SSR ? <div class="spinner"></div> : <FancyComponent />;
}
```

[canonical]: https://en.wikipedia.org/wiki/Canonical_link_element
