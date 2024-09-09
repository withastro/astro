---
'astro': patch
---

Adds support for array patterns in the built-in `glob()` content collections loader

The glob loader can now accept an array of multiple patterns as well as string patterns. This allows you to more easily combine multiple patterns into a single collection, and also means you can use negative matches to exclude files from the collection.

```ts
const probes = defineCollection({
  // Load all markdown files in the space-probes directory, except for those that start with "voyager-"
  loader: glob({ pattern: ['*.md', '!voyager-*'], base: 'src/data/space-probes' }),
  schema: z.object({
    name: z.string(),
    type: z.enum(['Space Probe', 'Mars Rover', 'Comet Lander']),
    launch_date: z.date(),
    status: z.enum(['Active', 'Inactive', 'Decommissioned']),
    destination: z.string(),
    operator: z.string(),
    notable_discoveries: z.array(z.string()),
  }),
});
```
