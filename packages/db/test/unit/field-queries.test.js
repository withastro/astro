import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
	getCollectionChangeQueries,
	getMigrationQueries,
} from '../../dist/core/cli/migration-queries.js';
import { getCreateTableQuery } from '../../dist/core/queries.js';
import { field, defineCollection, collectionSchema } from '../../dist/core/types.js';

const COLLECTION_NAME = 'Users';

// `parse` to resolve schema transformations
// ex. convert field.date() to ISO strings
const userInitial = collectionSchema.parse(
	defineCollection({
		fields: {
			name: field.text(),
			age: field.number(),
			email: field.text({ unique: true }),
			mi: field.text({ optional: true }),
		},
	})
);

const defaultAmbiguityResponses = {
	collectionRenames: {},
	fieldRenames: {},
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

describe('field queries', () => {
	describe('getMigrationQueries', () => {
		it('should be empty when collections are the same', async () => {
			const oldCollections = { [COLLECTION_NAME]: userInitial };
			const newCollections = { [COLLECTION_NAME]: userInitial };
			const { queries } = await configChangeQueries(oldCollections, newCollections);
			expect(queries).to.deep.equal([]);
		});

		it('should create table for new collections', async () => {
			const oldCollections = {};
			const newCollections = { [COLLECTION_NAME]: userInitial };
			const { queries } = await configChangeQueries(oldCollections, newCollections);
			expect(queries).to.deep.equal([getCreateTableQuery(COLLECTION_NAME, userInitial)]);
		});

		it('should drop table for removed collections', async () => {
			const oldCollections = { [COLLECTION_NAME]: userInitial };
			const newCollections = {};
			const { queries } = await configChangeQueries(oldCollections, newCollections);
			expect(queries).to.deep.equal([`DROP TABLE "${COLLECTION_NAME}"`]);
		});

		it('should rename table for renamed collections', async () => {
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
		it('should be empty when collections are the same', async () => {
			const { queries } = await userChangeQueries(userInitial, userInitial);
			expect(queries).to.deep.equal([]);
		});

		it('should be empty when type updated to same underlying SQL type', async () => {
			const blogInitial = collectionSchema.parse({
				...userInitial,
				fields: {
					title: field.text(),
					draft: field.boolean(),
				},
			});
			const blogFinal = collectionSchema.parse({
				...userInitial,
				fields: {
					...blogInitial.fields,
					draft: field.number(),
				},
			});
			const { queries } = await userChangeQueries(blogInitial, blogFinal);
			expect(queries).to.deep.equal([]);
		});

		describe('ALTER RENAME COLUMN', () => {
			it('when renaming a field', async () => {
				const userFinal = {
					...userInitial,
					fields: {
						...userInitial.fields,
					},
				};
				userFinal.fields.middleInitial = userFinal.fields.mi;
				delete userFinal.fields.mi;

				const { queries } = await userChangeQueries(userInitial, userFinal, {
					collectionRenames: {},
					fieldRenames: { [COLLECTION_NAME]: { middleInitial: 'mi' } },
				});
				expect(queries).to.deep.equal([
					`ALTER TABLE "${COLLECTION_NAME}" RENAME COLUMN "mi" TO "middleInitial"`,
				]);
			});
		});

		describe('Lossy table recreate', () => {
			it('when changing a field type', async () => {
				const userFinal = {
					...userInitial,
					fields: {
						...userInitial.fields,
						age: field.text(),
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);

				expect(queries).to.deep.equal([
					'DROP TABLE "Users"',
					`CREATE TABLE "Users" (_id INTEGER PRIMARY KEY, "name" text NOT NULL, "age" text NOT NULL, "email" text NOT NULL UNIQUE, "mi" text)`,
				]);
			});

			it('when adding a required field without a default', async () => {
				const userFinal = {
					...userInitial,
					fields: {
						...userInitial.fields,
						phoneNumber: field.text(),
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
			it('when adding an optional unique field', async () => {
				const userFinal = {
					...userInitial,
					fields: {
						...userInitial.fields,
						phoneNumber: field.text({ unique: true, optional: true }),
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
					fields: {
						...userInitial.fields,
					},
				};
				delete userFinal.fields.email;

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
					fields: {
						...userInitial.fields,
						age: field.date(),
					},
				});

				const userFinal = collectionSchema.parse({
					...initial,
					fields: {
						...initial.fields,
						age: field.date({ default: 'now' }),
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

			it('when adding a field with a runtime default', async () => {
				const userFinal = collectionSchema.parse({
					...userInitial,
					fields: {
						...userInitial.fields,
						birthday: field.date({ default: 'now' }),
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
			it('when changing a field to required', async () => {
				const userFinal = {
					...userInitial,
					fields: {
						...userInitial.fields,
						mi: field.text(),
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

			it('when changing a field to unique', async () => {
				const userFinal = {
					...userInitial,
					fields: {
						...userInitial.fields,
						age: field.number({ unique: true }),
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
			it('when adding an optional field', async () => {
				const userFinal = {
					...userInitial,
					fields: {
						...userInitial.fields,
						birthday: field.date({ optional: true }),
					},
				};

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries).to.deep.equal(['ALTER TABLE "Users" ADD COLUMN "birthday" text']);
			});

			it('when adding a required field with default', async () => {
				const defaultDate = new Date('2023-01-01');
				const userFinal = collectionSchema.parse({
					...userInitial,
					fields: {
						...userInitial.fields,
						birthday: field.date({ default: new Date('2023-01-01') }),
					},
				});

				const { queries } = await userChangeQueries(userInitial, userFinal);
				expect(queries).to.deep.equal([
					`ALTER TABLE "Users" ADD COLUMN "birthday" text NOT NULL DEFAULT '${defaultDate.toISOString()}'`,
				]);
			});
		});

		describe('ALTER DROP COLUMN', () => {
			it('when removing optional or required fields', async () => {
				const userFinal = {
					...userInitial,
					fields: {
						name: userInitial.fields.name,
						email: userInitial.fields.email,
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
	return query.match(/Users_([a-z0-9]+)/)?.[0];
}
