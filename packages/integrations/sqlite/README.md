# @astrojs/sqlite

> **Experimental.** This package explores mirroring content collections into SQLite so they can be queried with an ORM-like API through a live collection. It is private and not published.

## What it does

The package is two things that work together:

- **An integration** that watches the content layer's data store and mirrors every content collection into a SQLite database: one table per collection with the entry data stored as JSON. In `astro dev` the database is refreshed whenever content changes. In `astro build` it is populated before prerendering, and a **driver** then ships the data wherever the deployed server reads it from.
- **A live loader** that turns `getLiveCollection()` / `getLiveEntry()` filters into SQL, so pages can select, filter, sort and paginate collection data instead of loading everything and filtering in JavaScript.

Content collections stay exactly as they are: the same `glob()`/`file()` loaders, the same schemas, the same `src/content.config.ts`. The SQLite side is purely derived from them.

## Usage

```js
// astro.config.mjs
import sqlite, { d1 } from '@astrojs/sqlite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    sqlite({
      // Optional, defaults to node(): ships the database as a file next to the server bundle.
      driver: d1({ binding: 'DB' }),
    }),
  ],
});
```

```ts
// src/live.config.ts
import { sqlite } from '@astrojs/sqlite/loader';
import { type CollectionEntry, defineLiveCollection } from 'astro:content';

export const collections = {
  // A live collection with the same name as a content collection reads that collection's table.
  posts: defineLiveCollection({ loader: sqlite<CollectionEntry<'posts'>['data']>() }),
  // Or point it at another collection explicitly.
  recentPosts: defineLiveCollection({
    loader: sqlite<CollectionEntry<'posts'>['data']>({ collection: 'posts' }),
  }),
};
```

```astro
---
import { getLiveCollection, getLiveEntry, render } from 'astro:content';

const { entries } = await getLiveCollection('posts', {
  select: ['title', 'pubDate'],
  where: {
    draft: false,
    tags: { includes: 'astro' },
    pubDate: { gt: new Date('2024-01-01') },
    author: { id: 'ada' },
    OR: [{ views: { gte: 100 } }, { meta: { featured: true } }],
  },
  orderBy: { pubDate: 'desc' },
  limit: 10,
  offset: 0,
});

const { entry } = await getLiveEntry('posts', 'hello-world');
const { Content } = await render(entry);
---
```

### Query API

| Option     | Description                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `select`   | Top-level `data` fields to return. Everything else is left out of `data`.                                                                                                                    |
| `where`    | Conditions, combined with `AND`. A plain value means equality. Nested objects filter nested fields, `id` is the entry ID, and `AND` / `OR` / `NOT` combine conditions.                       |
| `orderBy`  | `{ field: 'asc' \| 'desc' }`, or an array of those. Dotted paths (`'author.id'`) reach into nested data. Results are always tie-broken by `id`.                                              |
| `limit`    | Maximum number of entries.                                                                                                                                                                   |
| `offset`   | Number of entries to skip.                                                                                                                                                                   |
| `rendered` | Include the rendered HTML (`entry.rendered.html`) of each entry. Off by default for collections because it makes list queries heavy; single entries from `getLiveEntry()` always include it. |

Operators on scalar fields: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`, `like`, `startsWith`, `endsWith`, `contains`, `isNull`. Operators on array fields: `includes`, `includesAny`, `includesAll`, `isEmpty`. String matching uses SQL `LIKE`, which is case-insensitive for ASCII.

`getLiveEntry()` accepts an ID, or `{ where, orderBy?, select? }` to load the first match.

### Drivers

| Driver   | Runtime                                                           | Build                                                                                                                                                                                                            |
| -------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node()` | Node's built-in `node:sqlite`, reading a file.                    | Copies the database next to the server bundle (`dist/server/astro-sqlite.db`). The runtime locates it by walking up from the bundled module, so the output can be deployed anywhere.                             |
| `d1()`   | The Worker's D1 binding, through `env` from `cloudflare:workers`. | Pushes changed rows through the D1 REST API using `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID` and `CLOUDFLARE_API_TOKEN`. Without credentials it writes a SQL file to apply with `wrangler d1 execute`. |

Static builds never need a driver: pages are prerendered against the local database.

A driver is a small object (`SqliteDriver`): a runtime module exporting `createClient()` that returns `{ all(sql, params) }`, and an optional build-time `push()` that receives an incremental `sync(executor)` and a full `dump()`. Adding libSQL/Turso or Postgres-backed variants is a matter of implementing those two halves.

## How it works

```
content.config.ts ──content layer──▶ .astro/data-store.json
                                           │ (watched; also mtime-checked on every query)
                                    integration reads it, diffs row digests
                                           ▼
                                 node_modules/.astro/astro-sqlite/{dev,build}.db
                        ┌──────────────────┴─────────────────┐
                 dev / prerender                        astro:build:done
              (client via globalThis)                   driver.push()
                        │                                    │
                        ▼                                    ▼
      live loader ──▶ virtual:@astrojs/sqlite/client ──▶ driver runtime (node file / D1)
```

- **Table layout.** Each collection becomes `content_<name>` with columns `id`, `data` (JSON), `meta` (JSON, records which fields hold `Date`s so they survive the JSON round trip), `rendered` (HTML) and `digest`. Filters compile to `json_extract("data", '$.path')`; array operators use `json_each`; `select` projects with `json_object`. Every value is a bound parameter. This works unchanged on `node:sqlite` and D1.
- **Sync is incremental.** Rows are compared by a SHA-1 digest; only changed entries are written and removed entries deleted. The same algorithm runs against the local database and, through the `SqlExecutor` interface, against D1 at build time.
- **Build vs. runtime client.** The virtual client module checks a global the integration sets while `astro dev` or prerendering runs, and falls back to the driver's runtime client only in the deployed bundle. Build-time reads therefore never touch the production database.
- **Dev freshness.** The integration re-syncs when the data store file is written, and the loader additionally compares the store's mtime before each query, so a request that races the file watcher still sees fresh data.

## Findings from the experiment

Things that worked well:

- Reusing the content layer as the source of truth means zero new loaders and zero duplicated schemas. Everything `glob()`/`file()`/custom loaders produce is mirrored as-is.
- One JSON column plus `json_extract` avoids schema introspection entirely and still gives real SQL filtering, sorting and pagination on D1.
- Live collections are a good fit for the "same name shadows the content collection" pattern: `getCollection('posts')` errors and points to `getLiveCollection()`, and types come from `CollectionEntry<'posts'>['data']`.

Limitations and things core would need to make this clean:

- **No "content synced" hook.** The integration reads the data store from disk and reimplements the (small) on-disk format, including the chunked layout, and relies on the file watcher. A `astro:content:synced` hook (or a public `readDataStore()`), and ideally access to the `MutableDataStore` write notifications, would remove the parsing and the watcher race.
- **`select` cannot narrow types.** `LiveLoader<TData, ...>` fixes the data type per loader, so `getLiveCollection('posts', { select: ['title'] })` is still typed as the full data. Per-call projection types would need a generic `loadCollection` signature in core.
- **Live loaders have no request context.** The D1 client reads `env` from `cloudflare:workers` because there is no way to reach `Astro.locals` from a loader. Fine for Workers, but other platforms might need a `context` argument on `loadCollection()`.
- **No `astro:content` types for the loader's own generics.** The user has to write `sqlite<CollectionEntry<'posts'>['data']>()`; a `sqlite('posts')` form would need the loader to see the generated `ContentConfig` types.
- **Images and references are stored raw.** Image fields keep the content layer's import placeholders, and `reference()` fields are stored as `{ collection, id }` objects (which are queryable, but not resolved). `getEntries()` still works with them.
- **`node:sqlite`** is still marked experimental by Node (a warning is printed) and needs Node 22.13+. `better-sqlite3`/libSQL would be alternatives if that is a problem.
