import { z } from 'zod';

export declare const entryMap: {
	// @@ENTRY_MAP@@
};
export declare const schemaMap: {
	// @@SCHEMA_MAP@@
};
export declare function getEntry<
	C extends keyof typeof entryMap,
	E extends keyof typeof entryMap[C]
>(collection: C, entryKey: E): Promise<typeof entryMap[C][E]>;
export declare function getCollection<
	C extends keyof typeof entryMap,
	E extends keyof typeof entryMap[C]
>(
	collection: C,
	filter?: (data: typeof entryMap[C][E]) => boolean
): Promise<typeof entryMap[C][keyof typeof entryMap[C]][]>;
export declare function renderEntry<
	C extends keyof typeof entryMap,
	E extends keyof typeof entryMap[C]
>(entry: { collection: C; id: E }): Promise<{ Content: any }>;
