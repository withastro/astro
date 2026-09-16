# Config schemas

There are 3 zod schemas needed to validate the Astro config properly:

- `AstroConfigSchema` (base): a schema that matches the `AstroConfig` type
- `createRelativeSchema` (relative): a function that uses the base schema, and adds transformations relative to the project root. Transformations occur at runtime, and the paths are resolved against the `cwd` of the CLI.
- `AstroConfigRefinedSchema` (refined): a schema that handles extra validations. Due to constraints imposed by the Astro architecture, refinements can't be done on the `AstroConfig` schema because integrations deal with the output of the `AstroConfig` schema. As a result, this schema runs after parsing the user config and after every integration `astro:config:setup` hook (to make sure `updateConfig() has been called with valid config)`.
