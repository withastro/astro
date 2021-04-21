## 📚 API

### `Astro` global

The `Astro` global is available in all contexts in `.astro` files. It has the following functions:

#### `config`

`Astro.config` returns an object with the following properties:

| Name   | Type     | Description                                                                                                |
| :----- | :------- | :--------------------------------------------------------------------------------------------------------- |
| `site` | `string` | Your website’s public root domain. Set it with `site: "https://mysite.com"` in your [Astro config][config] |

#### `fetchContent()`

`Astro.fetchContent()` is a way to load local `*.md` files into your static site setup. You can either use this on its own, or within [Astro Collections][docs-collections].

```jsx
// ./astro/components/my-component.astro
---
const data = Astro.fetchContent('../pages/post/*.md'); // returns an array of posts that live at ./astro/pages/post/*.md
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

```
{
  url: string;     // the URL of this item (if it’s in pages/)
  content: string; // the HTML of this item
  // frontmatter data expanded here
}[];
```

### `collection`

```jsx
export let collection;
```

When using the [Collections API][docs-collections], `collection` is a prop exposed to the page with the following shape:

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

When using the [Collections API][docs-collections], `createCollection()` is an async function that returns an object of the following shape:

| Name        |             Type              | Description                                                                                                |
| :---------- | :---------------------------: | :--------------------------------------------------------------------------------------------------------- |
| `data`      | `async ({ params }) => any[]` | **Required.** Load data with this function to be returned.                                                 |
| `pageSize`  |           `number`            | Specify number of items per page (default: `25`).                                                          |
| `routes`    |          `params[]`           | **Required for URL Params.** Return an array of all possible URL `param` values in `{ name: value }` form. |
| `permalink` |   `({ params }) => string`    | **Required for URL Params.** Given a `param` object of `{ name: value }`, generate the final URL.\*        |

_\* Note: don’t create confusing URLs with `permalink`, e.g. rearranging params conditionally based on their values._

⚠️ `createCollection()` executes in its own isolated scope before page loads. Therefore you can’t reference anything from its parent scope. If you need to load data you may fetch or use async `import()`s within the function body for anything you need (that’s why it’s `async`—to give you this ability). If it wasn’t isolated, then `collection` would be undefined! Therefore, duplicating imports between `createCollection()` and your Astro component is OK.

[config]: ../README.md#%EF%B8%8F-configuration
[docs-collections]: ./collections.md
