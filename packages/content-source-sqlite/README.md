# `@astrojs/content-source-sqlite`

SQLite storage for Astro content collections. This package is intended for adapter authors implementing Astro's `contentCollectionStorage` API.

## Use with an adapter

Call `createContentCollectionStorage()` with a libSQL-compatible database URL and assign the result to the adapter's `contentCollectionStorage` property:

```js
import { createContentCollectionStorage } from '@astrojs/content-source-sqlite';

export default function myAdapter() {
  return {
    name: 'my-adapter',
    serverEntrypoint: 'my-adapter/server.js',
    contentCollectionStorage: createContentCollectionStorage({
      url: 'file:.astro/content.db',
    }),
  };
}
```

Pass `token` when the database requires authentication:

```js
createContentCollectionStorage({
  url: process.env.CONTENT_DATABASE_URL,
  token: process.env.CONTENT_DATABASE_TOKEN,
});
```

## Reader and writer

The lower-level factories are available when an adapter needs to compose its own storage entrypoints:

```js
import { createContentReader, createContentWriter } from '@astrojs/content-source-sqlite';

const config = { url: 'file:.astro/content.db' };
const reader = createContentReader(config);
const writer = createContentWriter(config);

await writer.write(
	new Map([
		['posts', new Map([['welcome', { id: 'welcome', data: { title: 'Welcome' } }]])]],
	]),
);

const post = await reader.get('posts', 'welcome');
```

Each writer call replaces the complete stored content snapshot.
