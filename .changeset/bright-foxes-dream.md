---
'@astrojs/db': minor
---

Adds a new `getDbError()` helper exported from `astro:db`. It walks the error `.cause` chain and returns the underlying `LibsqlError`, or `undefined` if the error did not originate from libSQL. This is needed because `drizzle-orm` 0.44+ wraps query errors in a `DrizzleQueryError` whose `.cause` is the real `LibsqlError`.

#### Upgrading

Code that reads `.code` or `.message` after catching a database error should migrate from `isDbError()` to `getDbError()`:

```ts
// Before
import { isDbError } from 'astro:db';
try {
  await db.insert(MyTable).values({ ... });
} catch (e) {
  if (isDbError(e)) {
    console.error(e.code, e.message);
  }
}

// After
import { getDbError } from 'astro:db';
try {
  await db.insert(MyTable).values({ ... });
} catch (e) {
  const dbError = getDbError(e);
  if (dbError) {
    console.error(dbError.code, dbError.message);
  }
}
```

`isDbError()` is still exported and still returns `true` for wrapped errors, but its return type is now `boolean` instead of the `err is LibsqlError` type predicate. Code that relied on the narrowing to access `.code` or `.message` directly will now produce a TypeScript error pointing you to `getDbError()`.
