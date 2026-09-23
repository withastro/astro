import {
	CORE_SCHEMA,
	loadAll,
	mergeTag,
	timestampTag,
	YAMLException,
	type LoadOptions,
} from 'js-yaml';

const schema = CORE_SCHEMA.withTags(timestampTag, mergeTag);

/**
 * Parse a single YAML document with the same semantics as `js-yaml` v4's `load()`:
 * - timestamps and merge keys are resolved
 * - empty or comment-only input returns `undefined` instead of throwing like `js-yaml` v5's `load()` does
 */
export function yamlLoad(source: string, options?: LoadOptions): unknown {
	const documents = loadAll(source, { schema, ...options });
	if (documents.length > 1) {
		throw new YAMLException('expected a single document in the stream, but found more');
	}
	return documents[0];
}

export type { YAMLException, LoadOptions };
