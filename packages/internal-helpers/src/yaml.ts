import {
	YAMLException,
	type LoadOptions,
	CORE_SCHEMA,
	timestampTag,
	mergeTag,
	loadAll,
} from 'js-yaml';

// `js-yaml` v5 defaults to the YAML 1.2 core schema, which no longer resolves the
// `!!timestamp` and `!!merge` tags that the `js-yaml` v4 default schema handled.
// Frontmatter and data files rely on both: unquoted dates must become `Date`
// objects so that `z.date()` collection schemas keep working, and `<<:` merge
// keys must keep merging.
const schema = CORE_SCHEMA.withTags(timestampTag, mergeTag);

/**
 * Parse a single YAML document with the same semantics as `js-yaml` v4's `load()`:
 * - timestamps and merge keys are resolved
 * - empty or comment-only input returns `undefined` instead of throwing like `js-yaml` v5's `load()` does.
 */
export function yamlLoad(source: string, options?: LoadOptions): unknown {
	const documents = loadAll(source, { schema, ...options });
	if (documents.length > 1) {
		// Error message copied from `js-yaml` v5's `load()` implementation:
		// https://github.com/nodeca/js-yaml/blob/5.2.1/src/load.ts#L66
		throw new YAMLException('expected a single document in the stream, but found more');
	}
	return documents[0];
}

export type { YAMLException, LoadOptions };
