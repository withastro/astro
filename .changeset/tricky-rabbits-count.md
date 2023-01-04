---
'astro': major
---

Remove deprecated `Astro` global APIs, including `Astro.resolve`, `Astro.fetchContent`, and `Astro.canonicalURL`.

#### `Astro.resolve`

You can resolve asset paths using `import` instead. For example:

```astro
---
import 'style.css'
import imageUrl from './image.png'
---

<img src={imageUrl} />
```

See the [v0.25 migration guide](https://docs.astro.build/en/migrate/#deprecated-astroresolve) for more information.

#### `Astro.fetchContent`

Use `Astro.glob` instead to fetch markdown files, or migrate to the [Content Collections](https://docs.astro.build/en/guides/content-collections/) feature.

```js
let allPosts = await Astro.glob('./posts/*.md');
```

#### `Astro.canonicalURL`

Use `Astro.url` instead to construct the canonical URL.

```js
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
```
