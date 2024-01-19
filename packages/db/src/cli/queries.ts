import * as color from 'kleur/colors';
import type {
	BooleanField,
	DBCollection,
	DBCollections,
	DBField,
	DBFields,
	DateField,
	FieldType,
	JsonField,
	NumberField,
	TextField,
} from '../types.js';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import { customAlphabet } from 'nanoid';
import prompts from 'prompts';

const sqlite = new SQLiteAsyncDialect();
const genTempTableName = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);

interface PromptResponses {
	allowDataLoss: boolean;
	fieldRenames: Record<string, string | false>;
	collectionRenames: Record<string, string | false>;
}

export async function getMigrationQueries({
	oldCollections,
	newCollections,
	promptResponses,
}: {
	oldCollections: DBCollections;
	newCollections: DBCollections;
	promptResponses?: PromptResponses;
}) {
	const queries: string[] = [];
	let added = getAddedCollections(oldCollections, newCollections);
	let dropped = getDroppedCollections(oldCollections, newCollections);

	if (!isEmpty(added) && !isEmpty(dropped)) {
		const resolved = await resolveCollectionRenames(
			added,
			dropped,
			promptResponses?.collectionRenames,
		);
		added = resolved.added;
		dropped = resolved.dropped;
		for (const { from, to } of resolved.renamed) {
			const renameQuery = `ALTER TABLE ${sqlite.escapeName(from)} RENAME TO ${sqlite.escapeName(
				to,
			)}`;
			queries.push(renameQuery);
		}
	}

	for (const [collectionName, collection] of Object.entries(added)) {
		queries.push(getCreateTableQuery(collectionName, collection));
	}

	for (const [collectionName] of Object.entries(dropped)) {
		const dropQuery = `DROP TABLE ${sqlite.escapeName(collectionName)}`;
		queries.push(dropQuery);
	}

	for (const [collectionName, newCollection] of Object.entries(newCollections)) {
		const oldCollection = oldCollections[collectionName];
		if (!oldCollection) continue;
		const collectionChangeQueries = await getCollectionChangeQueries({
			collectionName,
			oldCollection,
			newCollection,
			promptResponses,
		});
		queries.push(...collectionChangeQueries);
	}
	return queries;
}

export async function getCollectionChangeQueries({
	collectionName,
	oldCollection,
	newCollection,
	promptResponses,
}: {
	collectionName: string;
	oldCollection: DBCollection;
	newCollection: DBCollection;
	promptResponses?: PromptResponses;
}): Promise<string[]> {
	const queries: string[] = [];
	const updated = getUpdatedFields(oldCollection.fields, newCollection.fields);
	let added = getAddedFields(oldCollection.fields, newCollection.fields);
	let dropped = getDroppedFields(oldCollection.fields, newCollection.fields);

	if (isEmpty(updated) && isEmpty(added) && isEmpty(dropped)) {
		return [];
	}
	if (!isEmpty(added) && !isEmpty(dropped)) {
		const resolved = await resolveFieldRenames(
			collectionName,
			added,
			dropped,
			promptResponses?.fieldRenames,
		);
		added = resolved.added;
		dropped = resolved.dropped;
		queries.push(...getFieldRenameQueries(collectionName, resolved.renamed));
	}
	if (
		isEmpty(updated) &&
		Object.values(dropped).every(canAlterTableDropColumn) &&
		Object.values(added).every(canAlterTableAddColumn)
	) {
		queries.push(...getAlterTableQueries(collectionName, added, dropped));
		return queries;
	}

	const dataLossCheck = canRecreateTableWithoutDataLoss(added, updated);
	if (dataLossCheck.dataLoss) {
		let allowDataLoss = promptResponses?.allowDataLoss;

		const nameMsg = `Type the collection name ${color.blue(
			collectionName,
		)} to confirm you want to delete all data:`;

		const { reason, fieldName } = dataLossCheck;
		const reasonMsgs: Record<DataLossReason, string> = {
			'added-required': `Adding required ${color.blue(
				color.bold(collectionName),
			)} field ${color.blue(color.bold(fieldName))}. ${color.red(
				'This will delete all existing data in the collection!',
			)} We recommend setting a default value to avoid data loss.`,
			'updated-required': `Changing ${color.blue(color.bold(collectionName))} field ${color.blue(
				color.bold(fieldName),
			)} to required. ${color.red('This will delete all existing data in the collection!')}`,
			'updated-unique': `Changing ${color.blue(color.bold(collectionName))} field ${color.blue(
				color.bold(fieldName),
			)} to unique. ${color.red('This will delete all existing data in the collection!')}`,
			'updated-type': `Changing the type of ${color.blue(
				color.bold(collectionName),
			)} field ${color.blue(color.bold(fieldName))}. ${color.red(
				'This will delete all existing data in the collection!',
			)}`,
		};

		if (allowDataLoss === undefined) {
			const res = await prompts({
				type: 'text',
				name: 'allowDataLoss',
				message: `${reasonMsgs[reason]} ${nameMsg}`,
				validate: (name) => name === collectionName || 'Incorrect collection name',
			});
			if (typeof res.allowDataLoss !== 'string') process.exit(0);
			allowDataLoss = !!res.allowDataLoss;
		}
		if (!allowDataLoss) {
			console.log('Exiting without changes 👋');
			process.exit(0);
		}
	}

	const recreateTableQueries = getRecreateTableQueries({
		unescCollectionName: collectionName,
		newCollection,
		added,
		hasDataLoss: dataLossCheck.dataLoss,
	});
	queries.push(...recreateTableQueries);
	return queries;
}

type Renamed = Array<{ from: string; to: string }>;

async function resolveFieldRenames(
	collectionName: string,
	mightAdd: DBFields,
	mightDrop: DBFields,
	renamePromptResponses?: PromptResponses['fieldRenames'],
): Promise<{ added: DBFields; dropped: DBFields; renamed: Renamed }> {
	const added: DBFields = {};
	const dropped: DBFields = {};
	const renamed: Renamed = [];

	for (const [fieldName, field] of Object.entries(mightAdd)) {
		const promptResponse = renamePromptResponses?.[fieldName];
		if (promptResponse === false) {
			added[fieldName] = field;
			continue;
		} else if (promptResponse) {
			renamed.push({ from: promptResponse, to: fieldName });
			continue;
		}

		const res = await prompts({
			type: 'toggle',
			name: 'isRename',
			message: `Is the field ${color.blue(color.bold(fieldName))} in collection ${color.blue(
				color.bold(collectionName),
			)} a new field, or renaming an existing field?`,
			initial: false,
			active: 'Rename',
			inactive: 'New field',
		});
		if (typeof res.isRename !== 'boolean') process.exit(0);
		if (!res.isRename) {
			added[fieldName] = field;
			continue;
		}

		const choices = Object.keys(mightDrop)
			.filter((key) => !(key in renamed))
			.map((key) => ({ title: key, value: key }));

		const { oldFieldName } = await prompts({
			type: 'select',
			name: 'oldFieldName',
			message: `Which field in ${color.blue(
				color.bold(collectionName),
			)} should be renamed to ${color.blue(color.bold(fieldName))}?`,
			choices,
		});
		if (typeof oldFieldName !== 'string') process.exit(0);
		renamed.push({ from: oldFieldName, to: fieldName });

		for (const [droppedFieldName, droppedField] of Object.entries(mightDrop)) {
			if (!renamed.find((r) => r.from === droppedFieldName)) dropped[droppedFieldName] = droppedField;
		}
	}

	return { added, dropped, renamed };
}

async function resolveCollectionRenames(
	mightAdd: DBCollections,
	mightDrop: DBCollections,
	renamePromptResponses?: PromptResponses['fieldRenames'],
): Promise<{ added: DBCollections; dropped: DBCollections; renamed: Renamed }> {
	const added: DBCollections = {};
	const dropped: DBCollections = {};
	const renamed: Renamed = [];

	for (const [collectionName, collection] of Object.entries(mightAdd)) {
		const promptResponse = renamePromptResponses?.[collectionName];
		if (promptResponse === false) {
			added[collectionName] = collection;
			continue;
		} else if (promptResponse) {
			renamed.push({ from: promptResponse, to: collectionName });
			continue;
		}

		const res = await prompts({
			type: 'toggle',
			name: 'isRename',
			message: `Is the collection ${color.blue(
				color.bold(collectionName),
			)} a new collection, or renaming an existing collection?`,
			initial: false,
			active: 'Rename',
			inactive: 'New collection',
		});
		if (typeof res.isRename !== 'boolean') process.exit(0);
		if (!res.isRename) {
			added[collectionName] = collection;
			continue;
		}

		const choices = Object.keys(mightDrop)
			.filter((key) => !(key in renamed))
			.map((key) => ({ title: key, value: key }));

		const { oldCollectionName } = await prompts({
			type: 'select',
			name: 'oldCollectionName',
			message: `Which collection should be renamed to ${color.blue(color.bold(collectionName))}?`,
			choices,
		});
		if (typeof oldCollectionName !== 'string') process.exit(0);
		renamed.push({ from: oldCollectionName, to: collectionName });

		for (const [droppedCollectionName, droppedCollection] of Object.entries(mightDrop)) {
			if (!renamed.find((r) => r.from === droppedCollectionName)) dropped[droppedCollectionName] = droppedCollection;
		}
	}

	return { added, dropped, renamed };
}

function getAddedCollections(oldCollections: DBCollections, newCollections: DBCollections) {
	const added: DBCollections = {};
	for (const [key, newCollection] of Object.entries(newCollections)) {
		if (!(key in oldCollections)) added[key] = newCollection;
	}
	return added;
}

function getDroppedCollections(oldCollections: DBCollections, newCollections: DBCollections) {
	const dropped: DBCollections = {};
	for (const [key, oldCollection] of Object.entries(oldCollections)) {
		if (!(key in newCollections)) dropped[key] = oldCollection;
	}
	return dropped;
}

function getFieldRenameQueries(unescCollectionName: string, renamed: Renamed): string[] {
	const queries: string[] = [];
	const collectionName = sqlite.escapeName(unescCollectionName);

	for (const { from, to } of renamed) {
		const q = `ALTER TABLE ${collectionName} RENAME COLUMN ${sqlite.escapeName(
			from,
		)} TO ${sqlite.escapeName(to)}`;
		queries.push(q);
	}

	return queries;
}

/**
 * Get ALTER TABLE queries to update the table schema. Assumes all added and dropped columns pass
 * `canUseAlterTableAddColumn` and `canAlterTableDropColumn` checks!
 */
function getAlterTableQueries(
	unescCollectionName: string,
	added: DBFields,
	dropped: DBFields,
): string[] {
	const queries: string[] = [];
	const collectionName = sqlite.escapeName(unescCollectionName);

	for (const [unescFieldName, field] of Object.entries(added)) {
		const fieldName = sqlite.escapeName(unescFieldName);
		const type = schemaTypeToSqlType(field.type);
		const q = `ALTER TABLE ${collectionName} ADD COLUMN ${fieldName} ${type}${getModifiers(
			fieldName,
			field,
		)}`;
		queries.push(q);
	}

	for (const unescFieldName of Object.keys(dropped)) {
		const fieldName = sqlite.escapeName(unescFieldName);
		const q = `ALTER TABLE ${collectionName} DROP COLUMN ${fieldName}`;
		queries.push(q);
	}

	return queries;
}

function getRecreateTableQueries({
	unescCollectionName,
	newCollection,
	added,
	hasDataLoss,
}: {
	unescCollectionName: string;
	newCollection: DBCollection;
	added: Record<string, DBField>;
	hasDataLoss: boolean;
}): string[] {
	const unescTempName = `${unescCollectionName}_${genTempTableName()}`;
	const tempName = sqlite.escapeName(unescTempName);
	const collectionName = sqlite.escapeName(unescCollectionName);
	const queries = [getCreateTableQuery(unescTempName, newCollection)];

	if (!hasDataLoss) {
		const newColumns = ['id', ...Object.keys(newCollection.fields)];
		const originalColumns = newColumns.filter((i) => !(i in added));
		const escapedColumns = originalColumns.map((c) => sqlite.escapeName(c)).join(', ');

		queries.push(
			`INSERT INTO ${tempName} (${escapedColumns}) SELECT ${escapedColumns} FROM ${collectionName}`,
		);
	}

	queries.push(`DROP TABLE ${collectionName}`);
	queries.push(`ALTER TABLE ${tempName} RENAME TO ${collectionName}`);
	return queries;
}

export function getCreateTableQuery(collectionName: string, collection: DBCollection) {
	let query = `CREATE TABLE ${sqlite.escapeName(collectionName)} (`;

	const colQueries = ['"id" text PRIMARY KEY'];
	for (const [columnName, column] of Object.entries(collection.fields)) {
		const colQuery = `${sqlite.escapeName(columnName)} ${schemaTypeToSqlType(
			column.type,
		)}${getModifiers(columnName, column)}`;
		colQueries.push(colQuery);
	}

	query += colQueries.join(', ') + ')';
	return query;
}

function getModifiers(columnName: string, column: DBField) {
	let modifiers = '';
	if (!column.optional) {
		modifiers += ' NOT NULL';
	}
	if (column.unique) {
		modifiers += ' UNIQUE';
	}
	if (hasDefault(column)) {
		modifiers += ` DEFAULT ${getDefaultValueSql(columnName, column)}`;
	}
	return modifiers;
}

function schemaTypeToSqlType(type: FieldType): 'text' | 'integer' {
	switch (type) {
		case 'date':
		case 'text':
		case 'json':
			return 'text';
		case 'number':
		case 'boolean':
			return 'integer';
	}
}

function isEmpty(obj: Record<string, unknown>) {
	return Object.keys(obj).length === 0;
}

/**
 * ADD COLUMN is preferred for O(1) table updates, but is only supported for _some_ column
 * definitions.
 *
 * @see https://www.sqlite.org/lang_altertable.html#alter_table_add_column
 */
function canAlterTableAddColumn(column: DBField) {
	if (column.unique) return false;
	if (hasRuntimeDefault(column)) return false;
	if (!column.optional && !hasDefault(column)) return false;
	return true;
}

function canAlterTableDropColumn(column: DBField) {
	if (column.unique) return false;
	return true;
}

type DataLossReason = 'added-required' | 'updated-required' | 'updated-unique' | 'updated-type';
type DataLossResponse =
	| { dataLoss: false }
	| { dataLoss: true; fieldName: string; reason: DataLossReason };

function canRecreateTableWithoutDataLoss(
	added: DBFields,
	updated: UpdatedFields,
): DataLossResponse {
	for (const [fieldName, a] of Object.entries(added)) {
		if (!a.optional && !hasDefault(a))
			return { dataLoss: true, fieldName, reason: 'added-required' };
	}
	for (const [fieldName, u] of Object.entries(updated)) {
		// Cannot respect default value when changing to NOT NULL
		// TODO: use UPDATE query to set default where IS NULL
		// @see https://dataschool.com/learn-sql/how-to-replace-nulls-with-0s/
		if (u.old.optional && !u.new.optional)
			return { dataLoss: true, fieldName, reason: 'updated-required' };
		if (!u.old.unique && u.new.unique)
			return { dataLoss: true, fieldName, reason: 'updated-unique' };
		if (u.old.type !== u.new.type && !canChangeTypeWithoutQuery(u.old, u.new))
			return { dataLoss: true, fieldName, reason: 'updated-type' };
	}
	return { dataLoss: false };
}

function getAddedFields(oldFields: DBFields, newFields: DBFields) {
	const added: DBFields = {};
	for (const [key, newField] of Object.entries(newFields)) {
		if (!(key in oldFields)) added[key] = newField;
	}
	return added;
}

function getDroppedFields(oldFields: DBFields, newFields: DBFields) {
	const dropped: DBFields = {};
	for (const [key, oldField] of Object.entries(oldFields)) {
		if (!(key in newFields)) dropped[key] = oldField;
	}
	return dropped;
}

type UpdatedFields = Record<string, { old: DBField; new: DBField }>;

function getUpdatedFields(oldFields: DBFields, newFields: DBFields): UpdatedFields {
	const updated: UpdatedFields = {};
	for (const [key, newField] of Object.entries(newFields)) {
		const oldField = oldFields[key];
		if (!oldField) continue;
		if (objShallowEqual(oldField, newField)) continue;

		const oldFieldSqlType = { ...oldField, type: schemaTypeToSqlType(oldField.type) };
		const newFieldSqlType = { ...newField, type: schemaTypeToSqlType(newField.type) };
		const isSafeTypeUpdate =
			objShallowEqual(oldFieldSqlType, newFieldSqlType) &&
			canChangeTypeWithoutQuery(oldField, newField);

		if (isSafeTypeUpdate) continue;

		updated[key] = { old: oldField, new: newField };
	}
	return updated;
}
const typeChangesWithoutQuery: Array<{ from: FieldType; to: FieldType }> = [
	{ from: 'boolean', to: 'number' },
	{ from: 'date', to: 'text' },
	{ from: 'json', to: 'text' },

	// TODO: decide on these. They *could* work with SQLite CAST
	// { from: 'boolean', to: 'text' },
	// { from: 'boolean', to: 'json' },
	// { from: 'number', to: 'text' },
	// { from: 'number', to: 'json' },
];

function canChangeTypeWithoutQuery(oldField: DBField, newField: DBField) {
	return typeChangesWithoutQuery.some(
		({ from, to }) => oldField.type === from && newField.type === to,
	);
}

// Using `DBField` will not narrow `default` based on the column `type`
// Handle each field separately
type WithDefaultDefined<T extends DBField> = T & Required<Pick<T, 'default'>>;
type DBFieldWithDefault =
	| WithDefaultDefined<TextField>
	| WithDefaultDefined<DateField>
	| WithDefaultDefined<NumberField>
	| WithDefaultDefined<BooleanField>
	| WithDefaultDefined<JsonField>;

// Type narrowing the default fails on union types, so use a type guard
function hasDefault(field: DBField): field is DBFieldWithDefault {
	return field.default !== undefined;
}

function hasRuntimeDefault(field: DBField): field is DBFieldWithDefault {
	return field.type === 'date' && field.default === 'now';
}

function getDefaultValueSql(columnName: string, column: DBFieldWithDefault): string {
	switch (column.type) {
		case 'boolean':
			return column.default ? 'TRUE' : 'FALSE';
		case 'number':
			return `${column.default}`;
		case 'text':
			return sqlite.escapeString(column.default);
		case 'date':
			return column.default === 'now' ? 'CURRENT_TIMESTAMP' : sqlite.escapeString(column.default);
		case 'json': {
			let stringified = '';
			try {
				stringified = JSON.stringify(column.default);
			} catch (e) {
				// eslint-disable-next-line no-console
				console.log(
					`Invalid default value for column ${color.bold(
						columnName,
					)}. Defaults must be valid JSON when using the \`json()\` type.`,
				);
				process.exit(0);
			}

			return sqlite.escapeString(stringified);
		}
	}
}

function objShallowEqual(a: Record<string, unknown>, b: Record<string, unknown>) {
	if (Object.keys(a).length !== Object.keys(b).length) return false;
	for (const [key, value] of Object.entries(a)) {
		if (JSON.stringify(b[key]) !== JSON.stringify(value)) {
			return false;
		}
	}
	return true;
}
