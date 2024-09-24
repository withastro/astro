---
'astro': minor
---

Adds a new optional `parser` property to the built-in `file()` loader for content collections to support additional file types such as `toml` and `csv`.

The `file()` loader now accepts a second argument that defines a `parser` function. This allows you to specify a custom parser (e.g. `toml.parse` or `csv-parse`) to create a collection from a file's contents. The `file()` loader will automatically detect and parse JSON and YAML files (based on their file extension) with no need for a `parser`.

This works with any type of custom file formats including `csv` and `toml`. The following example defines a content collection `dogs` using a `.toml` file.
```toml
[[dogs]]
id = "..."
age = "..."

[[dogs]]
id = "..."
age = "..."
```
After importing TOML's parser, you can load the `dogs` collection into your project by passing both a file path and `parser` to the `file()` loader.
```typescript
import { defineCollection } from "astro:content"
import { file } from "astro/loaders"
import { parse as parseToml } from "toml"

const dogs = defineCollection({
  loader: file("src/data/dogs.toml", { parser: (text) => parseToml(text).dogs }),
  schema: /* ... */
})

// it also works with CSVs!
import { parse as parseCsv } from "csv-parse/sync";

const cats = defineCollection({
  loader: file("src/data/cats.csv", { parser: (text) => parseCsv(text, { columns: true, skipEmptyLines: true })})
});
```

The `parser` argument also allows you to load a single collection from a nested JSON document. For example, this JSON file contains multiple collections:
```json
{"dogs": [{}], "cats": [{}]}
```

You can seperate these collections by passing a custom `parser` to the `file()` loader like so:
```typescript
const dogs = defineCollection({
  loader: file("src/data/pets.json", { parser: (text) => JSON.parse(text).dogs })
});
const cats = defineCollection({
  loader: file("src/data/pets.json", { parser: (text) => JSON.parse(text).cats })
});
```

And it continues to work with maps of `id` to `data`
```yaml
bubbles:
  breed: "Goldfish"
  age: 2
finn:
  breed: "Betta"
  age: 1
```

```typescript
const fish = defineCollection({ 
  loader: file("src/data/fish.yaml"), 
  schema: z.object({ breed: z.string(), age: z.number() }) 
});
```
