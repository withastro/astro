# @astrojs/rss 📖

This package brings fast RSS feed generation to blogs and other content sites built with [Astro](https://astro.build/). For more information about RSS feeds in general, see [aboutfeeds.com](https://aboutfeeds.com/).

## Installation

Install the `@astrojs/rss` package into any Astro project using your preferred package manager:

```bash
# npm
npm i @astrojs/rss
# yarn
yarn add @astrojs/rss
# pnpm
pnpm i @astrojs/rss
```

## Example usage

The `@astrojs/rss` package provides helpers for generating RSS feeds within [Astro endpoints][astro-endpoints]. This unlocks both static builds _and_ on-demand generation when using an [SSR adapter](https://docs.astro.build/en/guides/server-side-rendering/#enabling-ssr-in-your-project).

For instance, say you need to generate an RSS feed for all posts under `src/content/blog/` using content collections.

Start by [adding a `site` to your project's `astro.config` for link generation](https://docs.astro.build/en/reference/configuration-reference/#site). Then, create an `rss.xml.js` file under your project's `src/pages/` directory, and [use `getCollection()`](https://docs.astro.build/en/guides/content-collections/#getcollection) to generate a feed from all documents in the `blog` collection:

```js
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function get(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'Buzz’s Blog',
    description: 'A humble Astronaut’s guide to the stars',
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#contextsite
    site: context.site,
    items: posts.map(post => ({
      // Assumes all RSS feed item properties are in post frontmatter
      ...post.data,
      // Generate a `url` from each post `slug`
      // This assumes all blog posts are rendered as `/blog/[slug]` routes
      // https://docs.astro.build/en/guides/content-collections/#generating-pages-from-content-collections
      link: `/blog/${post.slug}/`,
    }))
  });
}
```

Read **[Astro's RSS docs][astro-rss]** for more on using content collections, and instructions for globbing entries in `/src/pages/`.

## `rss()` configuration options

The `rss` default export offers a number of configuration options. Here's a quick reference:

```js
export function get(context) {
  return rss({
    // `<title>` field in output xml
    title: 'Buzz’s Blog',
    // `<description>` field in output xml
    description: 'A humble Astronaut’s guide to the stars',
    // provide a base URL for RSS <item> links
    site: context.site,
    // list of `<item>`s in output xml
    items: [...],
    // include draft posts in the feed (default: false)
    drafts: true,
    // (optional) absolute path to XSL stylesheet in your project
    stylesheet: '/rss-styles.xsl',
    // (optional) inject custom xml
    customData: '<language>en-us</language>',
    // (optional) add arbitrary metadata to opening <rss> tag
    xmlns: { h: 'http://www.w3.org/TR/html4/' },
  });
}
```

### title

Type: `string (required)`

The `<title>` attribute of your RSS feed's output xml.

### description

Type: `string (required)`

The `<description>` attribute of your RSS feed's output xml.

### site

Type: `string (required)`

The base URL to use when generating RSS item links. We recommend using the [endpoint context object](https://docs.astro.build/en/reference/api-reference/#contextsite), which includes the `site` configured in your project's `astro.config.*`:

```ts
import rss from '@astrojs/rss';

export const get = (context) => rss({
    site: context.site,
    ...
  });
```

### items

Type: `RSSFeedItem[] (required)`

A list of formatted RSS feed items. See [Astro's RSS items documentation](https://docs.astro.build/en/guides/rss/#generating-items) for usage examples to choose the best option for you.

When providing a formatted RSS item list, see the `RSSFeedItem` type reference below:

```ts
type RSSFeedItem = {
	/** Link to item */
	link: string;
	/** Title of item */
	title: string;
	/** Publication date of item */
	pubDate: Date;
	/** Item description */
	description?: string;
	/** Full content of the item, should be valid HTML */
	content?: string;
	/** Append some other XML-valid data to this item */
	customData?: string;
};
```

### drafts

Type: `boolean (optional)`

Set `drafts: true` to include [draft posts](https://docs.astro.build/en/guides/markdown-content/#draft-pages) in the feed output. By default, this option is `false` and draft posts are not included.

### stylesheet

Type: `string (optional)`

An absolute path to an XSL stylesheet in your project. If you don’t have an RSS stylesheet in mind, we recommend the [Pretty Feed v3 default stylesheet](https://github.com/genmon/aboutfeeds/blob/main/tools/pretty-feed-v3.xsl), which you can download from GitHub and save into your project's `public/` directory.

### customData

Type: `string (optional)`

A string of valid XML to be injected between your feed's `<description>` and `<item>` tags. This is commonly used to set a language for your feed:

```js
import rss from '@astrojs/rss';

export const get = () => rss({
    ...
    customData: '<language>en-us</language>',
  });
```

### xmlns

Type: `Record<string, string> (optional)`

An object mapping a set of `xmlns` suffixes to strings of metadata on the opening `<rss>` tag.

For example, this object:

```js
rss({
  ...
  xmlns: { h: 'http://www.w3.org/TR/html4/' },
})
```

Will inject the following XML:

```xml
<rss xmlns:h="http://www.w3.org/TR/html4/"...
```

### content

The `content` key contains the full content of the post as HTML. This allows you to make your entire post content available to RSS feed readers.

**Note:** Whenever you're using HTML content in XML, we suggest using a package like [`sanitize-html`](https://www.npmjs.com/package/sanitize-html) in order to make sure that your content is properly sanitized, escaped, and encoded.

[See our RSS documentation](https://docs.astro.build/en/guides/rss/#including-full-post-content) for examples using content collections and glob imports.

## `rssSchema`

When using content collections, you can configure your collection schema to enforce expected [`RSSFeedItem`](#items) properties. Import and apply `rssSchema` to ensure that each collection entry produces a valid RSS feed item:

```ts "schema: rssSchema,"
import { defineCollection } from 'astro:content';
import { rssSchema } from '@astrojs/rss';

const blog = defineCollection({
  schema: rssSchema,
});

export const collections = { blog };
```

If you have an existing schema, you can merge extra properties using `extends()`:

```ts ".extends({ extraProperty: z.string() }),"
import { defineCollection } from 'astro:content';
import { rssSchema } from '@astrojs/rss';

const blog = defineCollection({
  schema: rssSchema.extends({ extraProperty: z.string() }),
});
```

## `pagesGlobToRssItems()`

To create an RSS feed from documents in `src/pages/`, use the `pagesGlobToRssItems()` helper. This accepts an `import.meta.glob` result ([see Vite documentation](https://vitejs.dev/guide/features.html#glob-import)) and outputs an array of valid [`RSSFeedItem`s](#items).

This function assumes, but does not verify, you are globbing for items inside `src/pages/`, and all necessary feed properties are present in each document's frontmatter. If you encounter errors, verify each page frontmatter manually.

```ts "pagesGlobToRssItems"
// src/pages/rss.xml.js
import rss, { pagesGlobToRssItems } from '@astrojs/rss';

export async function get(context) {
  return rss({
    title: 'Buzz’s Blog',
    description: 'A humble Astronaut’s guide to the stars',
    site: context.site,
    items: await pagesGlobToRssItems(
      import.meta.glob('./blog/*.{md,mdx}'),
    ),
  });
}
```

---

For more on building with Astro, [visit the Astro docs][astro-rss].

[astro-rss]: https://docs.astro.build/en/guides/rss/#using-astrojsrss-recommended
[astro-endpoints]: https://docs.astro.build/en/core-concepts/astro-pages/#non-html-pages
