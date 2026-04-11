---
'@astrojs/db': patch
---

Updates `drizzle-orm` to `^0.45.2` to patch GHSA-gpj5-g38j-94v9 (CVE-2026-39356), a SQL injection vulnerability in drizzle-orm's identifier escaping.

**Action required for error-handling code.** Drizzle ORM 0.44+ wraps query errors in a `DrizzleQueryError` whose `.cause` is the original `LibsqlError`. This means the error caught by a `try { await db.insert(...) } catch (e) { ... }` block is no longer a `LibsqlError` directly: `e.message` is `"Failed query: ..."` and `e.code` is `undefined`. A new `getDbError()` helper is exported from `astro:db` that walks the `.cause` chain and returns the underlying `LibsqlError` (or `undefined` if the error did not originate from libSQL). Any code that reads `err.code` or `err.message` after catching a database error must migrate:

```ts
// Before
import { isDbError } from 'astro:db';
try { await db.insert(...); } catch (e) {
  if (isDbError(e)) {
    console.error(e.code, e.message); // now silently wrong: undefined, "Failed query: ..."
  }
}

// After
import { getDbError } from 'astro:db';
try { await db.insert(...); } catch (e) {
  const dbError = getDbError(e);
  if (dbError) {
    console.error(dbError.code, dbError.message);
  }
}
```

`isDbError()` continues to be exported and now walks the `.cause` chain so it still returns `true` for drizzle-wrapped libSQL errors, but its return type has been relaxed from the `err is LibsqlError` type predicate to a plain `boolean`. The previous predicate narrowed `err` to `LibsqlError`, which is no longer accurate at runtime when drizzle wraps the error. Code that relied on the narrowing to access `.code` / `.message` directly on `err` will now produce a TypeScript error and should migrate to `getDbError()` as shown above. This is the intended migration path; compiling code that *silently* returns wrong values is the worse outcome the type change prevents.
