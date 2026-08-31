<!-- 
  **This template is reserved for Astro maintainers!**
  Any non-maintainer issues on this repo will be closed automatically.

  Instead, start a new discussion: https://github.com/withastro/roadmap/discussions/new
  See README for more information: https://github.com/withastro/roadmap
-->

- Accepted Date: 2026-08-26
- Reference Issues/Discussions: #1272, #1116
- Author: @florian-lefebvre
- Champion(s): @florian-lefebvre
- Implementation PR: <!-- leave empty -->

# Summary

Astro only supports zod as a validator. This proposal aims to decouple Astro from zod, allowing to use more validators at the same time.

# Background & Motivation

AFAIK Astro has been using zod for a long time, both internally and in its public APIS. This proposal only talks about the public APIs.

We've seen, while working on Astro 6, that being too tied to zod was a huge pain. It makes upgrading much harder and prevents users from using what they want.

I think we should make Astro agnostic in terms of schema validation. One problem is we can't only use Standard Schema (#1116) because we do things not covered by this spec. Affected areas are:

- The `astro/zod` module which re-exports astro's `zod` version
- Schemas in content collections
- Schemas in actions

# Goals

- Allow users to use other validators than zod
- Be backward compatible
- Ensure Astro's internal validator does not leak in the runtime

# Non-Goals

- Change Astro's internal validator for something else than zod

# Example

## `astro/zod`

If in the end we support several validation libraries, I think we should get rid of it. We could:

- Deprecate it in v7.x
- Ask users to install `zod` in their projects instead
- Update docs to show installing `zod`
- Remove in v8.0

## Content collections

The schema would need to implement https://standardschema.dev/schema and optionally https://standardschema.dev/json-schema.

Our current API is incompatible with supporting several validation libraries. We'd need to rethink `image()` and `reference()` entirely to allow this. An example of what it could look like:

```diff
import {
  defineCollection,
  reference,
+  image,
} from 'astro:content';
import { z } from 'zod';

const blogCollection = defineCollection({
-  schema: ({ image }) => z.object({
+  schema: (ctx) => z.object({
    title: z.string(),
-    cover: image(),
+    cover: z.string().transform(src => image(ctx, { src })),
    coverAlt: z.string(),
-	author: reference('authors'),
+	author: z.string().transform(id => reference('authors', id))
  }),
});

export const collections = {
  // ...
  blog: blogCollection,
};
```

This would solve 2 other complaints: schema transforms and validation on images in content collections (both lost with the content layer IIRC).

## Actions

JSON actions would just need to accept https://standardschema.dev/schema. Form actions are more complicated.

I think the best path here is to deprecate `schema` for form actions and defer to users (some complained that the current built-in logic is too opinionated). To make that easier we would work on a community package:

```diff
import { defineAction } from 'astro:actions';
import { z } from 'zod';
+import { parseFormData } from 'standard-schema-form';

const schema = z.object(/* ... */)

export const server = {
  comment: defineAction({
    accept: 'form',
-    input: schema,
    handler: async (rawInput) => {
+		const input = parseFormData(schema, rawInput)
		/* ... */
	},
  })
}
```