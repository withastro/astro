# `@astrojs/db`

Astro DB helps you create a SQLite database with powerful query APIs.

## Installation

`@astrojs/db` is an Astro integration you can install with the `astro add` command:

```bash
# npm
npm run astro add db

# pnpm
pnpm astro add db
```

## Configure your first collection

“Collections” are database tables you can query from your Astro project. To create a collection, you can use the `defineCollection()` and `field` utilities provided by `@astrojs/db`. All collections should be applied to the `db` object in your `astro.config.mjs` file:
```js
import { defineCollection, field } from '@astrojs/db';
import { defineConfig } from 'astro/config';

const Author = defineCollection({
	fields: {
		name: field.text(),
		socialLink: field.text({ optional: true }),
		isFeatured: field.boolean(),
	}
});

export default defineConfig({
	db: {
		collections: { Author },
	}
});
```

📚 See the `defineCollection()` API reference for all supported fields and configuration options.

### Default `id` field

All collections will be created with a generated `id` field. This can be used to fetch individual entries or “join” related tables. This `id` will be be of type “text” with a generated [nanoid](https://www.npmjs.com/package/nanoid).

## Pass collection data

Collections are considered “read-only” by default. To set collection data, you can add the `data()` function to your collection config. This should return an array of objects to insert into the database, with keys matching your collection `fields`:

```js
import { defineCollection, field } from '@astrojs/db';
import { defineConfig } from 'astro/config';

const Author = defineCollection({
	fields: {…},
	data() {
		return [
			{ name: 'Fred K Schott' },
			{ name: 'Ben Holmes', isFeatured: true },
			{ name: 'ThePrimeagen', socialLink: 'https://twitch.tv/ThePrimeagen' },
		]
	}
});

export default defineConfig({
	db: {
		collections: { Author },
	}
});
```

### Glob data from the filesystem

You may want to glob a directory of files (say `.json`) to insert as database rows. You can install the `fast-glob` package to glob from your `astro.config.mjs` file:

```bash
# npm
npm i fast-glob
# pnpm
pnpm i fast-glob
```
Then, call `glob()` over your directory of choice, and parse each file’s contents using Node `readFile()` and `JSON.parse()`:

```js
import { glob } from 'fast-glob';
import { readFile } from 'node:fs/promises';
import { defineCollection, field } from '@astrojs/db';
import { defineConfig } from 'astro/config';

const Author = defineCollection({
	fields: {…},
	async data() {
		const authors = await glob(‘authors/**/*.json’);
		return Promise.all(authors.map(async (author => {
			const contents = await readfile(author);
			return JSON.parse(contents);		
		})));
	}
});

export default defineConfig({
	db: {
		collections: { Author },
	}
});
```

## Query data

You can query collection data using the `@astrojs/db` SQL ORM. This is powered by [Drizzle ORM](https://orm.drizzle.team/), exposing collections as Drizzle objects you can use to construct type-safe SQL queries. 

You can create queries using the `db` object provided by the `astro:db` module. This example selects all entries in the Authors collection and renders the results to a list:

```astro
---
import { db, Author } from 'astro:db';
const authors = await db.select().from(Author);
---

<h2>Authors</h2>
<ul>
	{authors.map(({ name, socialLink }) => (
    <li>
	    socialLink ? <a href={socialLink}>{name}</a> : name
    </li>
  ))}
</ul>
```

### Filter data

You can [filter entries](https://orm.drizzle.team/docs/select#filtering) using a `where()` clause. This accepts [conditional functions](https://orm.drizzle.team/docs/operators) like `eq()`, which can be used to assert a field has a particular value. This example filters for “featured” authors in the `Authors` collection:

```astro
---
import { db, eq, Author } from 'astro:db';

const authors = await db.select().from(Author).where(
  eq(Author.isFeatured, true),
);
---
```

### Join related data

You may want to join related collections by `id`. You can handle joins using [a SQL join operator](https://orm.drizzle.team/docs/joins#join-types) like `innerJoin()`. 
