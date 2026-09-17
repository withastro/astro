import { createHash } from 'node:crypto';
import type { EntryMeta } from '../runtime/query.js';
import type { StoredEntry } from './data-store.js';

/** A content entry, flattened into the columns of its collection table. */
export interface EntryRow {
	id: string;
	data: string;
	meta: string;
	rendered: string | null;
	digest: string;
}

export function serializeEntry(entry: StoredEntry): EntryRow {
	const dates: EntryMeta['dates'] = [];
	const data = JSON.stringify(toJson(entry.data, [], dates));
	const meta = JSON.stringify(dates.length > 0 ? { dates } : {});
	const rendered = entry.rendered?.html ?? null;
	const digest = createHash('sha1')
		.update(data)
		.update(meta)
		.update(rendered ?? '')
		.digest('hex');
	return { id: entry.id, data, meta, rendered, digest };
}

function toJson(
	value: unknown,
	path: Array<string | number>,
	dates: NonNullable<EntryMeta['dates']>,
): unknown {
	if (value instanceof Date) {
		dates.push(path);
		return value.toISOString();
	}
	if (Array.isArray(value)) {
		return value.map((item, index) => toJson(item, [...path, index], dates));
	}
	if (value && typeof value === 'object') {
		const proto = Object.getPrototypeOf(value);
		if (proto === Object.prototype || proto === null) {
			const result: Record<string, unknown> = {};
			for (const [key, item] of Object.entries(value)) {
				if (item === undefined) continue;
				result[key] = toJson(item, [...path, key], dates);
			}
			return result;
		}
	}
	if (typeof value === 'bigint') return value.toString();
	return value;
}
