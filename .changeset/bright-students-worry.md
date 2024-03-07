---
"@astrojs/db": minor
---

Changes the seed file format to require exporting a default function instead of running seed code at the top level.

To migrate a seed file, wrap your existing code in a default function export:

```diff
// db/seed.ts
import { db, Table } from 'astro:db';

+ export default async function() {
  await db.insert(Table).values({ foo: 'bar' });
+ }
```
