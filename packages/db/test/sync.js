// @ts-nocheck
import { D1Database, D1DatabaseAPI } from '@miniflare/d1';
import { createSQLiteDB } from '@miniflare/shared';
import { expect } from 'chai';
import { collectionSchema } from 'circle-rhyme-yes-measure';
import { describe, it } from 'mocha';
import { z } from 'zod';
import {
	getCollectionChangeQueries,
	getCreateTableQuery,
	getMigrationQueries,
} from '../dist/cli/sync/queries.js';
import { field } from '../dist/config.js';

const COLLECTION_NAME = 'Users';

const userInitial = collectionSchema.parse({
	fields: {
		name: field.text(),
		age: field.number(),
		email: field.text({ unique: true }),
		mi: field.text({ optional: true }),
	},
});

const defaultPromptResponse = {
	allowDataLoss: false,
	fieldRenames: new Proxy(
		{},
		{
			get: () => false,
		},
	),
	collectionRenames: new Proxy(
		{},
		{
			get: () => false,
		},
	),
};

function userChangeQueries(oldCollection, newCollection, promptResponses = defaultPromptResponse) {
	return getCollectionChangeQueries({
		collectionName: COLLECTION_NAME,
		oldCollection,
		newCollection,
		promptResponses,
	});
}

function configChangeQueries(
	oldCollections,
	newCollections,
	promptResponses = defaultPromptResponse,
) {
	return getMigrationQueries({
		oldCollections,
		newCollections,
		promptResponses,
	});
}

describe('getMigrationQueries', () => {
	it('should be empty when collections are the same', async () => {
		const oldCollections = { [COLLECTION_NAME]: userInitial };
		const newCollections = { [COLLECTION_NAME]: userInitial };
		const queries = await configChangeQueries(oldCollections, newCollections);
		expect(queries).to.deep.equal([]);
	});

	it('should create table for new collections', async () => {
		const oldCollections = {};
		const newCollections = { [COLLECTION_NAME]: userInitial };
		const queries = await configChangeQueries(oldCollections, newCollections);
		expect(queries).to.deep.equal([getCreateTableQuery(COLLECTION_NAME, userInitial)]);
	});

	it('should drop table for removed collections', async () => {
		const oldCollections = { [COLLECTION_NAME]: userInitial };
		const newCollections = {};
		const queries = await configChangeQueries(oldCollections, newCollections);
		expect(queries).to.deep.equal([`DROP TABLE "${COLLECTION_NAME}"`]);
	});

	it('should rename table for renamed collections', async () => {
		const rename = 'Peeps';
		const oldCollections = { [COLLECTION_NAME]: userInitial };
		const newCollections = { [rename]: userInitial };
		const queries = await configChangeQueries(oldCollections, newCollections, {
			...defaultPromptResponse,
			collectionRenames: { [rename]: COLLECTION_NAME },
		});
		expect(queries).to.deep.equal([`ALTER TABLE "${COLLECTION_NAME}" RENAME TO "${rename}"`]);
	});
});

describe('getCollectionChangeQueries', () => {
	it('should be empty when collections are the same', async () => {
		const queries = await userChangeQueries(userInitial, userInitial);
		expect(queries).to.deep.equal([]);
	});

	it('should be empty when type updated to same underlying SQL type', async () => {
		const blogInitial = collectionSchema.parse({
			fields: {
				title: field.text(),
				draft: field.boolean(),
			},
		});
		const blogFinal = collectionSchema.parse({
			fields: {
				...blogInitial.fields,
				draft: field.number(),
			},
		});
		const queries = await userChangeQueries(blogInitial, blogFinal);
		expect(queries).to.deep.equal([]);
	});

	describe('ALTER RENAME COLUMN', () => {
		it('when renaming a field', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
				},
			};
			userFinal.fields.middleInitial = userFinal.fields.mi;
			delete userFinal.fields.mi;

			const queries = await userChangeQueries(userInitial, userFinal, {
				...defaultPromptResponse,
				fieldRenames: { middleInitial: 'mi' },
			});
			expect(queries).to.deep.equal([
				`ALTER TABLE "${COLLECTION_NAME}" RENAME COLUMN "mi" TO "middleInitial"`,
			]);
			await runsOnD1WithoutFailing({ queries });
		});
	});

	describe('Lossy table recreate', () => {
		it('when changing a field type', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
					age: field.text(),
				},
			};

			const queries = await userChangeQueries(userInitial, userFinal, {
				...defaultPromptResponse,
				allowDataLoss: true,
			});
			expect(queries).to.have.lengthOf(3);

			const tempTableName = getTempTableName(queries[0]);
			expect(tempTableName).to.be.a('string');
			expect(queries).to.deep.equal([
				`CREATE TABLE "${tempTableName}" ("id" text PRIMARY KEY, "name" text NOT NULL, "age" text NOT NULL, "email" text NOT NULL UNIQUE, "mi" text)`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
			await runsOnD1WithoutFailing({ queries, allowDataLoss: true });
		});

		it('when changing a field to unique', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
					age: field.text({ unique: true }),
				},
			};

			const queries = await userChangeQueries(userInitial, userFinal, {
				...defaultPromptResponse,
				allowDataLoss: true,
			});
			expect(queries).to.have.lengthOf(3);

			const tempTableName = getTempTableName(queries[0]);
			expect(tempTableName).to.be.a('string');
			expect(queries).to.deep.equal([
				`CREATE TABLE "${tempTableName}" ("id" text PRIMARY KEY, "name" text NOT NULL, "age" text NOT NULL UNIQUE, "email" text NOT NULL UNIQUE, "mi" text)`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
			await runsOnD1WithoutFailing({ queries, allowDataLoss: true });
		});

		it('when changing a field to required without default', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
					mi: field.text(),
				},
			};

			const queries = await userChangeQueries(userInitial, userFinal, {
				...defaultPromptResponse,
				allowDataLoss: true,
			});

			expect(queries).to.have.lengthOf(3);

			const tempTableName = getTempTableName(queries[0]);
			expect(tempTableName).to.be.a('string');
			expect(queries).to.deep.equal([
				`CREATE TABLE "${tempTableName}" ("id" text PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "email" text NOT NULL UNIQUE, "mi" text NOT NULL)`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
			await runsOnD1WithoutFailing({ queries, allowDataLoss: true });
		});

		it('when changing a field to required with default', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
					mi: field.text({ default: 'A' }),
				},
			};

			const queries = await userChangeQueries(userInitial, userFinal, {
				...defaultPromptResponse,
				allowDataLoss: true,
			});

			expect(queries).to.have.lengthOf(3);

			const tempTableName = getTempTableName(queries[0]);
			expect(tempTableName).to.be.a('string');
			expect(queries).to.deep.equal([
				`CREATE TABLE "${tempTableName}" ("id" text PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "email" text NOT NULL UNIQUE, "mi" text NOT NULL DEFAULT 'A')`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
			await runsOnD1WithoutFailing({ queries, allowDataLoss: true });
		});

		it('when adding a required field without a default', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
					phoneNumber: field.text(),
				},
			};

			const queries = await userChangeQueries(userInitial, userFinal, {
				...defaultPromptResponse,
				allowDataLoss: true,
			});
			expect(queries).to.have.lengthOf(3);

			const tempTableName = getTempTableName(queries[0]);
			expect(tempTableName).to.be.a('string');
			expect(queries).to.deep.equal([
				`CREATE TABLE "${tempTableName}" ("id" text PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "email" text NOT NULL UNIQUE, "mi" text, "phoneNumber" text NOT NULL)`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
			await runsOnD1WithoutFailing({ queries, allowDataLoss: true });
		});
	});

	describe('Lossless table recreate', () => {
		it('when adding an optional unique field', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
					phoneNumber: field.text({ unique: true, optional: true }),
				},
			};

			const queries = await userChangeQueries(userInitial, userFinal, {
				...defaultPromptResponse,
				allowDataLoss: true,
			});
			expect(queries).to.have.lengthOf(4);

			const tempTableName = getTempTableName(queries[0]);
			expect(tempTableName).to.be.a('string');
			expect(queries).to.deep.equal([
				`CREATE TABLE "${tempTableName}" ("id" text PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "email" text NOT NULL UNIQUE, "mi" text, "phoneNumber" text UNIQUE)`,
				`INSERT INTO "${tempTableName}" ("id", "name", "age", "email", "mi") SELECT "id", "name", "age", "email", "mi" FROM "Users"`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
			await runsOnD1WithoutFailing({ queries });
		});

		it('when dropping unique column', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
				},
			};
			delete userFinal.fields.email;

			const queries = await userChangeQueries(userInitial, userFinal);
			expect(queries).to.have.lengthOf(4);

			const tempTableName = getTempTableName(queries[0]);
			expect(tempTableName).to.be.a('string');
			expect(queries).to.deep.equal([
				`CREATE TABLE "${tempTableName}" ("id" text PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "mi" text)`,
				`INSERT INTO "${tempTableName}" ("id", "name", "age", "mi") SELECT "id", "name", "age", "mi" FROM "Users"`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
			await runsOnD1WithoutFailing({ queries });
		});

		it('when updating to a runtime default', async () => {
			const initial = collectionSchema.parse({
				fields: {
					...userInitial.fields,
					age: field.date(),
				},
			});

			const userFinal = {
				fields: {
					...initial.fields,
					age: field.date({ default: 'now' }),
				},
			};

			const queries = await userChangeQueries(initial, userFinal);
			expect(queries).to.have.lengthOf(4);

			const tempTableName = getTempTableName(queries[0]);
			expect(tempTableName).to.be.a('string');
			expect(queries).to.deep.equal([
				`CREATE TABLE "${tempTableName}" ("id" text PRIMARY KEY, "name" text NOT NULL, "age" text NOT NULL DEFAULT CURRENT_TIMESTAMP, "email" text NOT NULL UNIQUE, "mi" text)`,
				`INSERT INTO "${tempTableName}" ("id", "name", "age", "email", "mi") SELECT "id", "name", "age", "email", "mi" FROM "Users"`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
			await runsOnD1WithoutFailing({ queries });
		});

		it('when adding a field with a runtime default', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
					birthday: field.date({ default: 'now' }),
				},
			};

			const queries = await userChangeQueries(userInitial, userFinal);
			expect(queries).to.have.lengthOf(4);

			const tempTableName = getTempTableName(queries[0]);
			expect(tempTableName).to.be.a('string');
			expect(queries).to.deep.equal([
				`CREATE TABLE "${tempTableName}" ("id" text PRIMARY KEY, "name" text NOT NULL, "age" integer NOT NULL, "email" text NOT NULL UNIQUE, "mi" text, "birthday" text NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
				`INSERT INTO "${tempTableName}" ("id", "name", "age", "email", "mi") SELECT "id", "name", "age", "email", "mi" FROM "Users"`,
				'DROP TABLE "Users"',
				`ALTER TABLE "${tempTableName}" RENAME TO "Users"`,
			]);
			await runsOnD1WithoutFailing({ queries });
		});
	});

	describe('ALTER ADD COLUMN', () => {
		it('when adding an optional field', async () => {
			const userFinal = {
				fields: {
					...userInitial.fields,
					birthday: field.date({ optional: true }),
				},
			};

			const queries = await userChangeQueries(userInitial, userFinal);
			expect(queries).to.deep.equal(['ALTER TABLE "Users" ADD COLUMN "birthday" text']);
			await runsOnD1WithoutFailing({ queries });
		});

		it('when adding a required field with default', async () => {
			const defaultDate = new Date('2023-01-01');
			const userFinal = collectionSchema.parse({
				fields: {
					...userInitial.fields,
					birthday: field.date({ default: new Date('2023-01-01') }),
				},
			});

			const queries = await userChangeQueries(userInitial, userFinal);
			expect(queries).to.deep.equal([
				`ALTER TABLE "Users" ADD COLUMN "birthday" text NOT NULL DEFAULT '${defaultDate.toISOString()}'`,
			]);
			await runsOnD1WithoutFailing({ queries });
		});
	});

	describe('ALTER DROP COLUMN', () => {
		it('when removing optional or required fields', async () => {
			const userFinal = {
				fields: {
					name: userInitial.fields.name,
					email: userInitial.fields.email,
				},
			};

			const queries = await userChangeQueries(userInitial, userFinal);
			expect(queries).to.deep.equal([
				'ALTER TABLE "Users" DROP COLUMN "age"',
				'ALTER TABLE "Users" DROP COLUMN "mi"',
			]);
			await runsOnD1WithoutFailing({ queries });
		});
	});
});

/** @param {string} query */
function getTempTableName(query) {
	return query.match(/Users_([a-z0-9]+)/)?.[0];
}

/** @param {{ queries: string[]; oldCollection?: typeof userInitial; allowDataLoss?: boolean }} queries */
async function runsOnD1WithoutFailing({
	queries,
	oldCollection = userInitial,
	allowDataLoss = false,
}) {
	const sqlite = await createSQLiteDB(':memory:');
	const d1 = new D1Database(new D1DatabaseAPI(sqlite));

	const createTable = getCreateTableQuery(COLLECTION_NAME, oldCollection);
	const insertExampleEntries = [
		`INSERT INTO "Users" ("id", "name", "age", "email") VALUES ('1', 'John', 20, 'john@test.gov')`,
		`INSERT INTO "Users" ("id", "name", "age", "email") VALUES ('2', 'Jane', 21, 'jane@test.club')`,
	];
	await d1.batch([createTable, ...insertExampleEntries].map((q) => d1.prepare(q)));

	try {
		await d1.batch(queries.map((q) => d1.prepare(q)));
		const userQuery = d1.prepare(`SELECT * FROM "Users"`);
		const { results } = await userQuery.all();
		expect(results).to.have.lengthOf(allowDataLoss ? 0 : insertExampleEntries.length);
		sqlite.close();
		expect(true).to.be.true;
	} catch (err) {
		expect.fail(getErrorMessage(err));
	}
}

const d1ErrorValidator = z.object({
	message: z.string().refine((s) => s.startsWith('D1_')),
	cause: z.object({ message: z.string() }),
});

/**
 * @param {unknown} e
 * @returns {string}
 */
function getErrorMessage(e) {
	if (e instanceof Error) {
		const d1Error = d1ErrorValidator.safeParse(e);
		if (d1Error.success) return d1Error.data.cause.message;
		return e.message;
	}
	return JSON.stringify(e);
}
