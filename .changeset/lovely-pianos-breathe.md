---
'astro': minor
---

Adds support for custom parsers to file loader

For example, with a toml file of this format:
```toml
[[dogs]]
id = "..."
age = "..."

[[dogs]]
id = "..."
age = "..."
```
a content collection using this file could look like this
```typescript
import { defineCollection } from "astro:content"
import { file } from "astro/loaders"
import { parse as parseToml } from "toml"
const dogs = defineCollection({
  loader: file("src/data/dogs.toml", { parser: (text) => parseToml(text).dogs }),
  schema: /* ... */
})
```

This also adds support for nested json documents. For example:
```json
{"dogs": [{}], "cats": [{}]}
```
can be consumed using
```typescript
const dogs = defineCollection({
  loader: file("src/data/pets.json", { parser: (text) => JSON.parse(text).dogs })
})
const cats = defineCollection({
  loader: file("src/data/pets.json", { parser: (text) => JSON.parse(text).cats })
})
```
