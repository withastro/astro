const NO_SCHEMA_MSG = (/** @type {string} */ collection) =>
  `${collection} does not have a ~schema file. We suggest adding one for type safety!`;

const defaultSchemaFileResolved = { schema: { parse: (mod) => mod } };
/** Used to stub out `schemaMap` entries that don't have a `~schema.ts` file */
const defaultSchemaFile = (/** @type {string} */ collection) =>
  new Promise((/** @type {(value: typeof defaultSchemaFileResolved) => void} */ resolve) => {
    console.warn(NO_SCHEMA_MSG(collection));
    resolve(defaultSchemaFileResolved);
  });

export const contentMap = {
  // GENERATED_CONTENT_MAP_ENTRIES
};

export const schemaMap = {
  // GENERATED_SCHEMA_MAP_ENTRIES
};
