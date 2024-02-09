import * as color from 'kleur/colors';
import deepDiff from 'deep-diff';
import type {
	BooleanField,
	DBCollection,
	DBCollections,
	DBField,
	DBFields,
	DBSnapshot,
	DateField,
	FieldType,
	Indexes,
	JsonField,
	NumberField,
	TextField,
} from '../types.js';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import { customAlphabet } from 'nanoid';
import prompts from 'prompts';
import {
	getCreateIndexQueries,
	getCreateTableQuery,
	getModifiers,
	getReferencesConfig,
	hasDefault,
	schemaTypeToSqlType,
} from '../queries.js';
import { hasPrimaryKey } from '../../runtime/index.js';
import { isSerializedSQL } from '../../runtime/types.js';

const sqlite = new SQLiteAsyncDialect();
const genTempTableName = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);

/** Dependency injected for unit testing */
type AmbiguityResponses = {
	collectionRenames: Record<string, string>;
	fieldRenames: {
		[collectionName: string]: Record<string, string>;
	};
};

export async function getMigrationQueries({
	oldSnapshot,
	newSnapshot,
	ambiguityResponses,
}: {
	oldSnapshot: DBSnapshot;
	newSnapshot: DBSnapshot;
	ambiguityResponses?: AmbiguityResponses;
}): Promise<{ queries: string[]; confirmations: string[] }> {
	const queries: string[] = [];
	const confirmations: string[] = [];
	let added = getAddedCollections(oldSnapshot, newSnapshot);
	let dropped = getDroppedCollections(oldSnapshot, newSnapshot);
	if (!isEmpty(added) && !isEmpty(dropped)) {
		const resolved = await resolveCollectionRenames(added, dropped, ambiguityResponses);
		added = resolved.added;
		dropped = resolved.dropped;
		for (const { from, to } of resolved.renamed) {
			const renameQuery = `ALTER TABLE ${sqlite.escapeName(from)} RENAME TO ${sqlite.escapeName(
				to
			)}`;
			queries.push(renameQuery);
		}
	}

	for (const [collectionName, collection] of Object.entries(added)) {
		queries.push(getCreateTableQuery(collectionName, collection));
		queries.push(...getCreateIndexQueries(collectionName, collection));
	}

	for (const [collectionName] of Object.entries(dropped)) {
		const dropQuery = `DROP TABLE ${sqlite.escapeName(collectionName)}`;
		queries.push(dropQuery);
	}

	for (const [collectionName, newCollection] of Object.entries(newSnapshot.schema)) {
		const oldCollection = oldSnapshot.schema[collectionName];
		if (!oldCollection) continue;
		const result = await getCollectionChangeQueries({
			collectionName,
			oldCollection,
			newCollection,
		});
		queries.push(...result.queries);
		confirmations.push(...result.confirmations);
	}
	return { queries, confirmations };
}

export async function getCollectionChangeQueries({
	collectionName,
	oldCollection,
	newCollection,
	ambiguityResponses,
}: {
	collectionName: string;
	oldCollection: DBCollection;
	newCollection: DBCollection;
	ambiguityResponses?: AmbiguityResponses;
}): Promise<{ queries: string[]; confirmations: string[] }> {
	const queries: string[] = [];
	const confirmations: string[] = [];
	const updated = getUpdatedFields(oldCollection.fields, newCollection.fields);
	let added = getAdded(oldCollection.fields, newCollection.fields);
	let dropped = getDropped(oldCollection.fields, newCollection.fields);
	/** Any foreign key changes require a full table recreate */
	const hasForeignKeyChanges = Boolean(
		deepDiff(oldCollection.foreignKeys, newCollection.foreignKeys)
	);

	if (!hasForeignKeyChanges && isEmpty(updated) && isEmpty(added) && isEmpty(dropped)) {
		return {
			queries: getChangeIndexQueries({
				collectionName,
				oldIndexes: oldCollection.indexes,
				newIndexes: newCollection.indexes,
			}),
			confirmations,
		};
	}
	if (!hasForeignKeyChanges && !isEmpty(added) && !isEmpty(dropped)) {
		const resolved = await resolveFieldRenames(collectionName, added, dropped, ambiguityResponses);
		added = resolved.added;
		dropped = resolved.dropped;
		queries.push(...getFieldRenameQueries(collectionName, resolved.renamed));
	}
	if (
		!hasForeignKeyChanges &&
		isEmpty(updated) &&
		Object.values(dropped).every(canAlterTableDropColumn) &&
		Object.values(added).every(canAlterTableAddColumn)
	) {
		queries.push(
			...getAlterTableQueries(collectionName, added, dropped),
			...getChangeIndexQueries({
				collectionName,
				oldIndexes: oldCollection.indexes,
				newIndexes: newCollection.indexes,
			})
		);
		return { queries, confirmations };
	}

	const dataLossCheck = canRecreateTableWithoutDataLoss(added, updated);
	if (dataLossCheck.dataLoss) {
		const { reason, fieldName } = dataLossCheck;
		const reasonMsgs: Record<DataLossReason, string> = {
			'added-required': `New field ${color.bold(
				collectionName + '.' + fieldName
			)} is required with no default value.\nThis requires deleting existing data in the ${color.bold(
				collectionName
			)} collection.`,
			'added-unique': `New field ${color.bold(
				collectionName + '.' + fieldName
			)} is marked as unique.\nThis requires deleting existing data in the ${color.bold(
				collectionName
			)} collection.`,
			'updated-type': `Updated field ${color.bold(
				collectionName + '.' + fieldName
			)} cannot convert data to new field data type.\nThis requires deleting existing data in the ${color.bold(
				collectionName
			)} collection.`,
		};
		confirmations.push(reasonMsgs[reason]);
	}

	const primaryKeyExists = Object.entries(newCollection.fields).find(([, field]) =>
		hasPrimaryKey(field)
	);
	const droppedPrimaryKey = Object.entries(dropped).find(([, field]) => hasPrimaryKey(field));

	const recreateTableQueries = getRecreateTableQueries({
		collectionName,
		newCollection,
		added,
		hasDataLoss: dataLossCheck.dataLoss,
		migrateHiddenPrimaryKey: !primaryKeyExists && !droppedPrimaryKey,
	});
	queries.push(...recreateTableQueries, ...getCreateIndexQueries(collectionName, newCollection));
	return { queries, confirmations };
}

function getChangeIndexQueries({
	collectionName,
	oldIndexes = {},
	newIndexes = {},
}: {
	collectionName: string;
	oldIndexes?: Indexes;
	newIndexes?: Indexes;
}) {
	const added = getAdded(oldIndexes, newIndexes);
	const dropped = getDropped(oldIndexes, newIndexes);
	const updated = getUpdated(oldIndexes, newIndexes);

	Object.assign(dropped, updated);
	Object.assign(added, updated);

	const queries: string[] = [];
	for (const indexName of Object.keys(dropped)) {
		const dropQuery = `DROP INDEX ${sqlite.escapeName(indexName)}`;
		queries.push(dropQuery);
	}
	queries.push(...getCreateIndexQueries(collectionName, { indexes: added }));
	return queries;
}

type Renamed = Array<{ from: string; to: string }>;

async function resolveFieldRenames(
	collectionName: string,
	mightAdd: DBFields,
	mightDrop: DBFields,
	ambiguityResponses?: AmbiguityResponses
): Promise<{ added: DBFields; dropped: DBFields; renamed: Renamed }> {
	const added: DBFields = {};
	const dropped: DBFields = {};
	const renamed: Renamed = [];

	for (const [fieldName, field] of Object.entries(mightAdd)) {
		let oldFieldName = ambiguityResponses
			? ambiguityResponses.fieldRenames[collectionName]?.[fieldName] ?? '__NEW__'
			: undefined;
		if (!oldFieldName) {
			const res = await prompts(
				{
					type: 'select',
					name: 'fieldName',
					message:
						'New field ' +
						color.blue(color.bold(`${collectionName}.${fieldName}`)) +
						' detected. Was this renamed from an existing field?',
					choices: [
						{ title: 'New field (not renamed from existing)', value: '__NEW__' },
						...Object.keys(mightDrop)
							.filter((key) => !(key in renamed))
							.map((key) => ({ title: key, value: key })),
					],
				},
				{
					onCancel: () => {
						process.exit(1);
					},
				}
			);
			oldFieldName = res.fieldName as string;
		}

		if (oldFieldName === '__NEW__') {
			added[fieldName] = field;
		} else {
			renamed.push({ from: oldFieldName, to: fieldName });
		}
	}
	for (const [droppedFieldName, droppedField] of Object.entries(mightDrop)) {
		if (!renamed.find((r) => r.from === droppedFieldName)) {
			dropped[droppedFieldName] = droppedField;
		}
	}

	return { added, dropped, renamed };
}

async function resolveCollectionRenames(
	mightAdd: DBCollections,
	mightDrop: DBCollections,
	ambiguityResponses?: AmbiguityResponses
): Promise<{ added: DBCollections; dropped: DBCollections; renamed: Renamed }> {
	const added: DBCollections = {};
	const dropped: DBCollections = {};
	const renamed: Renamed = [];

	for (const [collectionName, collection] of Object.entries(mightAdd)) {
		let oldCollectionName = ambiguityResponses
			? ambiguityResponses.collectionRenames[collectionName] ?? '__NEW__'
			: undefined;
		if (!oldCollectionName) {
			const res = await prompts(
				{
					type: 'select',
					name: 'collectionName',
					message:
						'New collection ' +
						color.blue(color.bold(collectionName)) +
						' detected. Was this renamed from an existing collection?',
					choices: [
						{ title: 'New collection (not renamed from existing)', value: '__NEW__' },
						...Object.keys(mightDrop)
							.filter((key) => !(key in renamed))
							.map((key) => ({ title: key, value: key })),
					],
				},
				{
					onCancel: () => {
						process.exit(1);
					},
				}
			);
			oldCollectionName = res.collectionName as string;
		}

		if (oldCollectionName === '__NEW__') {
			added[collectionName] = collection;
		} else {
			renamed.push({ from: oldCollectionName, to: collectionName });
		}
	}

	for (const [droppedCollectionName, droppedCollection] of Object.entries(mightDrop)) {
		if (!renamed.find((r) => r.from === droppedCollectionName)) {
			dropped[droppedCollectionName] = droppedCollection;
		}
	}

	return { added, dropped, renamed };
}

function getAddedCollections(
	oldCollections: DBSnapshot,
	newCollections: DBSnapshot
): DBCollections {
	const added: DBCollections = {};
	for (const [key, newCollection] of Object.entries(newCollections.schema)) {
		if (!(key in oldCollections.schema)) added[key] = newCollection;
	}
	return added;
}

function getDroppedCollections(
	oldCollections: DBSnapshot,
	newCollections: DBSnapshot
): DBCollections {
	const dropped: DBCollections = {};
	for (const [key, oldCollection] of Object.entries(oldCollections.schema)) {
		if (!(key in newCollections.schema)) dropped[key] = oldCollection;
	}
	return dropped;
}

function getFieldRenameQueries(unescapedCollectionName: string, renamed: Renamed): string[] {
	const queries: string[] = [];
	const collectionName = sqlite.escapeName(unescapedCollectionName);

	for (const { from, to } of renamed) {
		const q = `ALTER TABLE ${collectionName} RENAME COLUMN ${sqlite.escapeName(
			from
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
	unescapedCollectionName: string,
	added: DBFields,
	dropped: DBFields
): string[] {
	const queries: string[] = [];
	const collectionName = sqlite.escapeName(unescapedCollectionName);

	for (const [unescFieldName, field] of Object.entries(added)) {
		const fieldName = sqlite.escapeName(unescFieldName);
		const type = schemaTypeToSqlType(field.type);
		const q = `ALTER TABLE ${collectionName} ADD COLUMN ${fieldName} ${type}${getModifiers(
			fieldName,
			field
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
	collectionName: unescCollectionName,
	newCollection,
	added,
	hasDataLoss,
	migrateHiddenPrimaryKey,
}: {
	collectionName: string;
	newCollection: DBCollection;
	added: Record<string, DBField>;
	hasDataLoss: boolean;
	migrateHiddenPrimaryKey: boolean;
}): string[] {
	const unescTempName = `${unescCollectionName}_${genTempTableName()}`;
	const tempName = sqlite.escapeName(unescTempName);
	const collectionName = sqlite.escapeName(unescCollectionName);

	if (hasDataLoss) {
		return [
			`DROP TABLE ${collectionName}`,
			getCreateTableQuery(unescCollectionName, newCollection),
		];
	}
	const newColumns = [...Object.keys(newCollection.fields)];
	if (migrateHiddenPrimaryKey) {
		newColumns.unshift('_id');
	}
	const escapedColumns = newColumns
		.filter((i) => !(i in added))
		.map((c) => sqlite.escapeName(c))
		.join(', ');

	return [
		getCreateTableQuery(unescTempName, newCollection),
		`INSERT INTO ${tempName} (${escapedColumns}) SELECT ${escapedColumns} FROM ${collectionName}`,
		`DROP TABLE ${collectionName}`,
		`ALTER TABLE ${tempName} RENAME TO ${collectionName}`,
	];
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
function canAlterTableAddColumn(field: DBField) {
	if (field.unique) return false;
	if (hasRuntimeDefault(field)) return false;
	if (!field.optional && !hasDefault(field)) return false;
	if (hasPrimaryKey(field)) return false;
	if (getReferencesConfig(field)) return false;
	return true;
}

function canAlterTableDropColumn(field: DBField) {
	if (field.unique) return false;
	if (hasPrimaryKey(field)) return false;
	return true;
}

type DataLossReason = 'added-required' | 'added-unique' | 'updated-type';
type DataLossResponse =
	| { dataLoss: false }
	| { dataLoss: true; fieldName: string; reason: DataLossReason };

function canRecreateTableWithoutDataLoss(
	added: DBFields,
	updated: UpdatedFields
): DataLossResponse {
	for (const [fieldName, a] of Object.entries(added)) {
		if (hasPrimaryKey(a) && a.type !== 'number' && !hasDefault(a)) {
			return { dataLoss: true, fieldName, reason: 'added-required' };
		}
		if (!a.optional && !hasDefault(a)) {
			return { dataLoss: true, fieldName, reason: 'added-required' };
		}
		if (!a.optional && a.unique) {
			return { dataLoss: true, fieldName, reason: 'added-unique' };
		}
	}
	for (const [fieldName, u] of Object.entries(updated)) {
		if (u.old.type !== u.new.type && !canChangeTypeWithoutQuery(u.old, u.new)) {
			return { dataLoss: true, fieldName, reason: 'updated-type' };
		}
	}
	return { dataLoss: false };
}

function getAdded<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const added: Record<string, T> = {};
	for (const [key, value] of Object.entries(newObj)) {
		if (!(key in oldObj)) added[key] = value;
	}
	return added;
}

function getDropped<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const dropped: Record<string, T> = {};
	for (const [key, value] of Object.entries(oldObj)) {
		if (!(key in newObj)) dropped[key] = value;
	}
	return dropped;
}

function getUpdated<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const updated: Record<string, T> = {};
	for (const [key, value] of Object.entries(newObj)) {
		const oldValue = oldObj[key];
		if (!oldValue) continue;
		if (deepDiff(oldValue, value)) updated[key] = value;
	}
	return updated;
}

type UpdatedFields = Record<string, { old: DBField; new: DBField }>;

function getUpdatedFields(oldFields: DBFields, newFields: DBFields): UpdatedFields {
	const updated: UpdatedFields = {};
	for (const [key, newField] of Object.entries(newFields)) {
		const oldField = oldFields[key];
		if (!oldField) continue;

		const diff = deepDiff(oldField, newField, (path, objKey) => {
			const isTypeKey = objKey === 'type' && path.length === 0;
			return (
				// If we can safely update the type without a SQL query, ignore the diff
				isTypeKey &&
				oldField.type !== newField.type &&
				canChangeTypeWithoutQuery(oldField, newField)
			);
		});

		if (diff) {
			updated[key] = { old: oldField, new: newField };
		}
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
		({ from, to }) => oldField.type === from && newField.type === to
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

function hasRuntimeDefault(field: DBField): field is DBFieldWithDefault {
	return !!(field.default && isSerializedSQL(field.default));
}
