# Config schemas

There are 3 zod schemas needed to validate the Astro config properly:

- `AstroConfigSchema` (base): a schema that matches the `AstroConfig` type
- `createRelativeSchema` (relative): a function that uses the base schema but adds transforms relative to the project root
- `AstroConfigRefinedSchema` (refined): a schema that handles extra validations. It runs after the user config is validated and for every integration