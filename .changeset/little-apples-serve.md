---
'@astrojs/db': minor
---

Adds support for enum support for text columns in Astro DB tables.

```ts
import { column, defineTable } from 'astro:db';

// Table definition
const UserTable = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text(),
        rank: column.text({ enum: ['user', 'mod', 'admin'] }),
	},
});

// Resulting type definition
type UserTableInferInsert = {
    id: string;
    name: string;
    rank: "user" | "mod" | "admin";
}
```