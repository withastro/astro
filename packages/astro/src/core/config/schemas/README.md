# Config schemas

There are 3 zod schemas needed to validate the Astro config properly:

- `AstroConfigSchema` (base): a schema that matches the `AstroConfig` type
- `createRelativeSchema` (relative): a function that uses the base schema, and adds transformations relative to the project root. Transformations occur at runtime, and the paths are resolved against the `cwd` of the CLI.
- `AstroConfigRefinedSchema` (refined): a schema that handles extra validations. Due to constraints imposed by the Astro architecture, refinements can't run when the configuration is validated because the referiment changes the initial types of `AstroConfig`. The refinement phase can happen only after the user configuration is validated and every integration has run the hook `astro:config:setup`.