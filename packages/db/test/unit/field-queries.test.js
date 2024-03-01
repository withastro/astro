import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
	getCollectionChangeQueries,
	getMigrationQueries,
} from '../../dist/core/cli/migration-queries.js';
import { getCreateTableQuery } from '../../dist/core/queries.js';
import { collectionSchema, column, defineReadableTable } from '../../dist/core/types.js';
import { NOW } from '../../dist/runtime/index.js';

const COLLECTION_NAME = 'Users';

// `parse` to resolve schema transformations
// ex. convert column.date() to ISO strings
const userInitial = collectionSchema.parse(
	defineReadableTable({
		columns: {
			name: column.text(),
			age: column.number(),
			email: column.text({ unique: true }),
			mi: column.text({ optional: true }),
		},
	})
);

const defaultAmbiguityResponses = {
	collectionRenames: {},
	columnRenames: {},
};

function userChangeQueries(
	oldCollection,
	newCollection,
	ambiguityResponses = defaultAmbiguityResponses
) {
	return getCollectionChangeQueries({
		collectionName: COLLECTION_NAME,
		oldCollection,
		newCollection,
		ambiguityResponses,
	});
}

function configChangeQueries(
	oldCollections,
	newCollections,
	ambiguityResponses = defaultAmbiguityResponses
) {
	return getMigrationQueries({
		oldSnapshot: { schema: oldCollections, experimentalVersion: 1 },
		newSnapshot: { schema: newCollections, experimentalVersion: 1 },
		ambiguityResponses,
	});
}

describe('column queries', () => {
	describe('getMigrationQueries', () => {
		it('should be empty when tables are the same', async () => {
			const oldCollections = { [COLLECTION_NAME]: userInitial };
			const newCollections = { [COLLECTION_NAME]: userInitial };
			const { queries } = await configChangeQueries(oldCollections, newCollections);
			expect(queries).to.deep.equal([]);
		});

		it('should create table for new tables', async () => {
			const oldCollections = {};
			const newCollections = { [COLLECTION_NAME]: userInitial };
			const { queries } = await configChangeQueries(oldCollections, newCollections);
			expect(queries).to.deep.equal([getCreateTableQuery(COLLECTION_NAME, userInitial)]);
		});

		it('should drop table for removed tables', async () => {
			const oldCollections = { [COLLECTION_NAME]: userInitial };
			const newCollections = {};
			const { queries } = await configChangeQueries(oldCollections, newCollections);
			expect(queries).to.deep.equal([`DROP TABLE "${COLLECTION_NAME}"`]);
		});

		it('should rename table for renamed tables', async () => {
			const rename = 'Peeps';
			const oldCollections = { [COLLECTION_NAME]: userInitial };
			const newCollections = { [rename]: userInitial };
			const { queries } = await configChangeQueries(oldCollections, newCollections, {
				...defaultAmbiguityResponses,
				collectionRenames: { [rename]: COLLECTION_NAME },
			});
			expect(queries).to.deep.equal([`ALTER TABLE "${COLLECTION_NAME}" RENAME TO "${rename}"`]);
		});
	});

	describe('getCollectionChangeQueries', () => {
		it('should be empty when tables are the same', async () => {
			const { queries } = await userChangeQueries(userInitial, userInitial);
			expect(queries).to.deep.equal([]);
		});

		it('should be empty when type updated to same underlying SQL type', async () => {
			const blogInitial = collectionSchema.parse({
				...userInitial,
				columns: {
					title: column.text(),
					draft: column.boolean(),
				},
			});
			const blogFinal = collectionSchema.parse({
				...userInitial,
				columns: {
					...blogInitial.columns,
					draft: column.number(),
				},
			});
			const { queries } = await userChangeQueries(blogInitial, blogFinal);
			expect(queries).to.deep.equal([]);
		});

		it('should respect user primary key without adding a hidden id', async () => {
			const user = collectionSchema.parse({
				...userInitial,
				columns: {
					...userInitial.columns,
					id: column.number({ primaryKey: true }),
				},
			});

			const userFinal = collectionSchema.parse({
				...user,
				columns: {
					...user.columns,
					name: column.text({ unique: true, optional: true }),
				},
			});

			const { queries } = await userChangeQueries(user, userFinal);
			expect(queries[0]).to.not.be.undefined;
			const tempTableName = getTempTableName(queries[0]);

			expect(queries).to.deep.equal([
				`CREATE TABLE \"${tempTableName}\" (\"name\" text UNIQUE, \"age\" integer NOT NULL, \"email\" text NOT NULL UNIQUE, \"mi\" text, \"id\" integer PRIMARY KEY)`,
				`INSERT INTO \"${tempTableName}\" (\"name\", \"age\", \"email\", \"mi\", \"id\") SELECT \"name\", \"age\", \"email\", \"mi\", \"id\" FROM \"Users\"`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
		});

		describe('ALTER RENAME COLUMN', () => {
			it('when renaming a column', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						...userInitial.columns,
					},
				};
				userFinal.columns.middleInitial = userFinal.columns.mi;
				delete userFinal.columns.mi;

				const { queries } = await userChangeQueries(userInitial, userFinal, {
					collectionRenames: {},
					columnRenames: { [COLLECTION_NAME]: { middleInitial: 'mi' } },
				});
				expect(queries).to.deep.equal([
					`ALTER TABLE "${COLLECTION_NAME}" RENAME COLUMN "mi" TO "middleInitial"`,
				]);
			});
		});

		describe('Lossy table recreate', () => {
			it('when changing a column type', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						...userInitial.columns,
						age: column.text(),
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);

				expect(queries).to.deep.equal([
					'DROP TABLE "Users"',
					`CREATE TABLE "Users" (_id INTEGER PRIMARY KEY, "name" text NOT NULL, "age" text NOT NULL, "email" text NOT NULL UNIQUE, "mi" text)`,
				]);
			});

			it('when adding a required column without a default', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						...userInitial.columns,
						phoneNumber: column.text(),
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);

				expect(queries).to.deep.equal([
					'DROP TABLE "Users"',
					`CREATE TABLE "Users" (_id INTEGER PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "email" text NOT NULL UNIQUE, "mi" text, "phoneNumber" text NOT NULL)`,
				]);
			});
		});

		describe('Lossless table recreate', () => {
			it('when adding a primary key', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						...userInitial.columns,
						id: column.number({ primaryKey: true }),
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries[0]).to.not.be.undefined;

				const tempTableName = getTempTableName(queries[0]);
				expect(queries).to.deep.equal([
					`CREATE TABLE \"${tempTableName}\" (\"name\" text NOT NULL, \"age\" integer NOT NULL, \"email\" text NOT NULL UNIQUE, \"mi\" text, \"id\" integer PRIMARY KEY)`,
					`INSERT INTO \"${tempTableName}\" (\"name\", \"age\", \"email\", \"mi\") SELECT \"name\", \"age\", \"email\", \"mi\" FROM \"Users\"`,
					'DROP TABLE "Users"',
					`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
				]);
			});

			it('when dropping a primary key', async () => {
				const user = {
					...userInitial,
					columns: {
						...userInitial.columns,
						id: column.number({ primaryKey: true }),
					},
				};

				const { queries } = await userChangeQueries(user, userInitial);
				expect(queries[0]).to.not.be.undefined;

				const tempTableName = getTempTableName(queries[0]);
				expect(queries).to.deep.equal([
					`CREATE TABLE \"${tempTableName}\" (_id INTEGER PRIMARY KEY, \"name\" text NOT NULL, \"age\" integer NOT NULL, \"email\" text NOT NULL UNIQUE, \"mi\" text)`,
					`INSERT INTO \"${tempTableName}\" (\"name\", \"age\", \"email\", \"mi\") SELECT \"name\", \"age\", \"email\", \"mi\" FROM \"Users\"`,
					'DROP TABLE "Users"',
					`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
				]);
			});

			it('when adding an optional unique column', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						...userInitial.columns,
						phoneNumber: column.text({ unique: true, optional: true }),
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries).to.have.lengthOf(4);

				const tempTableName = getTempTableName(queries[0]);
				expect(tempTableName).to.be.a('string');
				expect(queries).to.deep.equal([
					`CREATE TABLE "${tempTableName}" (_id INTEGER PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "email" text NOT NULL UNIQUE, "mi" text, "phoneNumber" text UNIQUE)`,
					`INSERT INTO "${tempTableName}" ("_id", "name", "age", "email", "mi") SELECT "_id", "name", "age", "email", "mi" FROM "Users"`,
					'DROP TABLE "Users"',
					`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
				]);
			});

			it('when dropping unique column', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						...userInitial.columns,
					},
				};
				delete userFinal.columns.email;

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries).to.have.lengthOf(4);

				const tempTableName = getTempTableName(queries[0]);
				expect(tempTableName).to.be.a('string');
				expect(queries).to.deep.equal([
					`CREATE TABLE "${tempTableName}" (_id INTEGER PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "mi" text)`,
					`INSERT INTO "${tempTableName}" ("_id", "name", "age", "mi") SELECT "_id", "name", "age", "mi" FROM "Users"`,
					'DROP TABLE "Users"',
					`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
				]);
			});

			it('when updating to a runtime default', async () => {
				const initial = collectionSchema.parse({
					...userInitial,
					columns: {
						...userInitial.columns,
						age: column.date(),
					},
				});

				const userFinal = collectionSchema.parse({
					...initial,
					columns: {
						...initial.columns,
						age: column.date({ default: NOW }),
					},
				});

				const { queries } = await userChangeQueries(initial, userFinal);
				expect(queries).to.have.lengthOf(4);

				const tempTableName = getTempTableName(queries[0]);
				expect(tempTableName).to.be.a('string');
				expect(queries).to.deep.equal([
					`CREATE TABLE "${tempTableName}" (_id INTEGER PRIMARY KEY, "name" text NOT NULL, "age" text NOT NULL DEFAULT CURRENT_TIMESTAMP, "email" text NOT NULL UNIQUE, "mi" text)`,
					`INSERT INTO "${tempTableName}" ("_id", "name", "age", "email", "mi") SELECT "_id", "name", "age", "email", "mi" FROM "Users"`,
					'DROP TABLE "Users"',
					`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
				]);
			});

			it('when adding a column with a runtime default', async () => {
				const userFinal = collectionSchema.parse({
					...userInitial,
					columns: {
						...userInitial.columns,
						birthday: column.date({ default: NOW }),
					},
				});

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries).to.have.lengthOf(4);

				const tempTableName = getTempTableName(queries[0]);
				expect(tempTableName).to.be.a('string');
				expect(queries).to.deep.equal([
					`CREATE TABLE "${tempTableName}" (_id INTEGER PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "email" text NOT NULL UNIQUE, "mi" text, "birthday" text NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
					`INSERT INTO "${tempTableName}" ("_id", "name", "age", "email", "mi") SELECT "_id", "name", "age", "email", "mi" FROM "Users"`,
					'DROP TABLE "Users"',
					`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
				]);
			});

			/**
			 * REASON: to follow the "expand" and "contract" migration model,
			 * you'll need to update the schema from NOT NULL to NULL.
			 * It's up to the user to ensure all data follows the new schema!
			 *
			 * @see https://planetscale.com/blog/safely-making-database-schema-changes#backwards-compatible-changes
			 */
			it('when changing a column to required', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						...userInitial.columns,
						mi: column.text(),
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);

				expect(queries).to.have.lengthOf(4);

				const tempTableName = getTempTableName(queries[0]);
				expect(tempTableName).to.be.a('string');
				expect(queries).to.deep.equal([
					`CREATE TABLE "${tempTableName}" (_id INTEGER PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "email" text NOT NULL UNIQUE, "mi" text NOT NULL)`,
					`INSERT INTO "${tempTableName}" ("_id", "name", "age", "email", "mi") SELECT "_id", "name", "age", "email", "mi" FROM "Users"`,
					'DROP TABLE "Users"',
					`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
				]);
			});

			it('when changing a column to unique', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						...userInitial.columns,
						age: column.number({ unique: true }),
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries).to.have.lengthOf(4);

				const tempTableName = getTempTableName(queries[0]);
				expect(tempTableName).to.be.a('string');
				expect(queries).to.deep.equal([
					`CREATE TABLE "${tempTableName}" (_id INTEGER PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL UNIQUE, "email" text NOT NULL UNIQUE, "mi" text)`,
					`INSERT INTO "${tempTableName}" ("_id", "name", "age", "email", "mi") SELECT "_id", "name", "age", "email", "mi" FROM "Users"`,
					'DROP TABLE "Users"',
					`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
				]);
			});
		});

		describe('ALTER ADD COLUMN', () => {
			it('when adding an optional column', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						...userInitial.columns,
						birthday: column.date({ optional: true }),
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries).to.deep.equal(['ALTER TABLE "Users" ADD COLUMN "birthday" text']);
			});

			it('when adding a required column with default', async () => {
				const defaultDate = new Date('2023-01-01');
				const userFinal = collectionSchema.parse({
					...userInitial,
					columns: {
						...userInitial.columns,
						birthday: column.date({ default: new Date('2023-01-01') }),
					},
				});

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries).to.deep.equal([
					`ALTER TABLE "Users" ADD COLUMN "birthday" text NOT NULL DEFAULT '${defaultDate.toISOString()}'`,
				]);
			});
		});

		describe('ALTER DROP COLUMN', () => {
			it('when removing optional or required columns', async () => {
				const userFinal = {
					...userInitial,
					columns: {
						name: userInitial.columns.name,
						email: userInitial.columns.email,
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries).to.deep.equal([
					'ALTER TABLE "Users" DROP COLUMN "age"',
					'ALTER TABLE "Users" DROP COLUMN "mi"',
				]);
			});
		});
	});
});

/** @param {string} query */
function getTempTableName(query) {
	// eslint-disable-next-line regexp/no-unused-capturing-group
	return query.match(/Users_([a-z\d]+)/)?.[0];
}
