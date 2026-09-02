# @standard-community/standard-form

Parse `FormData` with any [Standard Schema](https://standardschema.dev) validator.

```ts
import { parseFormData } from '@standard-community/standard-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
  newsletter: z.boolean(),
  address: z.object({ city: z.string() }),
});

const result = await parseFormData(schema, formData);
if (result.issues) {
  // `result.issues` is a `StandardSchemaV1.Issue[]`
} else {
  result.value; // { name: string, age: number, newsletter: boolean, address: { city: string } }
}
```

`FormData` is flat and stringly typed, and the Standard Schema spec deliberately covers
validation only — not introspection. There is no portable way to ask a schema "is this
field a number?", which is what turning `age=25` into `{ age: 25 }` requires. Each
validator therefore contributes a handler that does the coercion; validation itself goes
through the spec.

Handlers are resolved from the schema's `~standard.vendor` and imported lazily, so a
project only needs the validators it actually uses installed.

| Vendor | Status                      |
| ------ | --------------------------- |
| `zod`  | Built in (Zod 4 and higher) |

Anything else throws an `UnsupportedVendorError` until you register a handler:

```ts
import { loadVendor } from '@standard-community/standard-form';

loadVendor('valibot', (schema, formData) => {
  /* ... */
});
```

`loadVendor` also overrides a built-in handler:

```ts
import { loadVendor } from '@standard-community/standard-form';
import zodHandler from '@standard-community/standard-form/zod';

loadVendor('zod', await zodHandler());
```

> [!NOTE]
> This package is a placeholder living in the Astro monorepo. It is not published, and it
> is expected to move to the [standard-community](https://github.com/standard-community)
> organization alongside its sibling
> [`standard-json`](https://github.com/standard-community/standard-json).
