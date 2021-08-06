---
layout: ~/layouts/MainLayout.astro
title: Routing
---

Astro uses **file-based routing** to generate your build URLs based on the file layout of your project `src/pages` directory. When a file is added to the `src/pages` directory of your project, it is automatically available as a route based on its filename.

## Static routes

Astro Components (`.astro`) and Markdown Files (`.md`) are the only currently supported formats for routes. Other file types (like a `.jsx` React component) are not supported as routes in the `src/pages` directory, but you can use any UI component inside of an `.astro` file to achieve a similar result.

The file path within the `src/pages` directory decides the final URL that the page is built to:

```bash
# Examples
src/pages/index.astro       -> mysite.com/
src/pages/about.astro       -> mysite.com/about
src/pages/about/index.astro -> mysite.com/about
src/pages/about/me.astro    -> mysite.com/about/me
src/pages/posts/1.md        -> mysite.com/posts/1
```

## Dynamic parameters

Sometimes, you will need to generate many URLs from a single page component. Astro supports this with **dynamic parameters** in the page filename.

Dynamic parameters are encoded into the filename using `[bracket]` notation:

- `pages/blog/[slug].astro` → `/blog/:slug` (`/blog/hello-world`, `/blog/post-2`, etc.)
- `pages/[username]/settings.astro` → (`/fred/settings`, `/drew/settings`, etc.)
- `pages/[lang]-[version]/info.astro` → (`/en-v1/info`, `/fr-v2/info`, etc.)

#### Example: Dynamic parameters

Consider the following page `pages/post/[pid].astro`:

```jsx
---
// Example: src/pages/post/[pid].astro
const {pid} = Astro.request.params;
---
<p>Post: {pid}</p>
```

Any route like `/post/1`, `/post/abc`, etc. will be matched by `pages/post/[pid].astro`. The matched path parameter will be sent as a query parameter to the page.

For example, the route `/post/abc` will have the following `Astro.request.params` object available:

```json
{ "pid": "abc" }
```

Multiple dynamic route segments can be combined to work the same way. The page `pages/post/[pid]/[comment].astro` will match the route `/post/abc/a-comment` and its `query` object will be:

```json
{ "pid": "abc", "comment": "a-comment" }
```

## Rest parameters

If you need more flexibility in your URL routing, you can use a rest parameter as a universal catch-all. You do this by adding three dots (`...`) inside your brackets. For example:

- `pages/post/[...slug].astro` → (`/post/a`, `/post/a/b`, `/post/a/b/c`, etc.)

Matched parameters will be sent as a query parameter (`slug` in the example) to the page. In the example above, the path `/post/a/b/c` will have the following `query` object:

```json
{ "slug": "a/b/c" }
```

You can use names other than `slug`, such as: `[...param]` or `[...name]`.

Rest parameters are optional by default, so `pages/post/[...slug].astro` could match `/post/` as well.

#### Example: Rest parameters

For a real-world example, you might implement GitHub's file viewer like so:

```
/[org]/[repo]/tree/[branch]/[...file]
```

In this example, a request for `/snowpackjs/astro/tree/main/docs/public/favicon.svg` would result in the following parameters being available to the page:

```js
{
	org: 'snowpackjs',
	repo: 'astro',
	branch: 'main',
	file: 'docs/public/favicon.svg'
}
```

## Caveats

- Static routes without path params will take precedence over all other routes, and named path params over catch all path params. Take a look at the following examples:
  - `pages/post/create.astro` - Will match `/post/create`
  - `pages/post/[pid].astro` - Will match `/post/1`, `/post/abc`, etc. But not `/post/create`
  - `pages/post/[...slug].astro` - Will match `/post/1/2`, `/post/a/b/c`, etc. But not `/post/create`, `/post/abc`
