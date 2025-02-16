import deepDiff from "deep-diff";
import type { BooleanColumn, DateColumn, DBColumn, JsonColumn, NumberColumn, TextColumn } from "../types.js";
import { hasPrimaryKey } from "../../runtime/utils.js";
import { isSerializedSQL } from "../../runtime/types.js";

export function getAdded<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const added: Record<string, T> = {};
	for (const [key, value] of Object.entries(newObj)) {
		if (!(key in oldObj)) added[key] = value;
	}
	return added;
}

export function getDropped<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const dropped: Record<string, T> = {};
	for (const [key, value] of Object.entries(oldObj)) {
		if (!(key in newObj)) dropped[key] = value;
	}
	return dropped;
}

export function getUpdated<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const updated: Record<string, T> = {};
	for (const [key, value] of Object.entries(newObj)) {
		const oldValue = oldObj[key];
		if (!oldValue) continue;
		if (deepDiff(oldValue, value)) updated[key] = value;
	}
	return updated;
}

// Using `DBColumn` will not narrow `default` based on the column `type`
// Handle each column separately
type WithDefaultDefined<T extends DBColumn> = T & {
	schema: Required<Pick<T['schema'], 'default'>>;
};
export type DBColumnWithDefault =
	| WithDefaultDefined<TextColumn>
	| WithDefaultDefined<DateColumn>
	| WithDefaultDefined<NumberColumn>
	| WithDefaultDefined<BooleanColumn>
	| WithDefaultDefined<JsonColumn>;

export function hasDefault(column: DBColumn): column is DBColumnWithDefault {
	if (column.schema.default !== undefined) {
		return true;
	}
	if (hasPrimaryKey(column) && column.type === 'number') {
		return true;
	}
	return false;
}

export function hasRuntimeDefault(column: DBColumn): column is DBColumnWithDefault {
	return !!(column.schema.default && isSerializedSQL(column.schema.default));
}

export function getReferencesConfig(column: DBColumn) {
	const canHaveReferences = column.type === 'number' || column.type === 'text';
	if (!canHaveReferences) return undefined;
	return column.schema.references;
}
