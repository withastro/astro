import { z } from 'zod';

declare const defaultSchemaFileResolved: {
	schema: {
		parse: (mod) => any;
	};
};
export declare const contentMap: {
	// GENERATED_CONTENT_MAP_ENTRIES
};
export declare const schemaMap: {
	// GENERATED_SCHEMA_MAP_ENTRIES
};
export declare function fetchContentByEntry<
	C extends keyof typeof contentMap,
	E extends keyof typeof contentMap[C]
>(collection: C, entryKey: E): Promise<typeof contentMap[C][E]>;
export declare function fetchContent<
	C extends keyof typeof contentMap,
	E extends keyof typeof contentMap[C]
>(
	collection: C,
	filter?: (data: typeof contentMap[C][E]) => boolean
): Promise<typeof contentMap[C][keyof typeof contentMap[C]][]>;
