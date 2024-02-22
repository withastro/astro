import { expect } from 'chai';
import { describe, it } from 'mocha';
import { getCollectionChangeQueries } from '../../dist/core/cli/migration-queries.js';
import { collectionSchema, column } from '../../dist/core/types.js';

const userInitial = collectionSchema.parse({
	columns: {
		name: column.text(),
		age: column.number(),
		email: column.text({ unique: true }),
		mi: column.text({ optional: true }),
	},
	indexes: {},
	writable: false,
});

describe('index queries', () => {
	it('adds indexes', async () => {
		/** @type {import('../../dist/types.js').DBTable} */
		const userFinal = {
			...userInitial,
			indexes: {
				nameIdx: { on: ['name'], unique: false },
				emailIdx: { on: ['email'], unique: true },
			},
		};

		const { queries } = await getCollectionChangeQueries({
			collectionName: 'user',
			oldCollection: userInitial,
			newCollection: userFinal,
		});

		expect(queries).to.deep.equal([
			'CREATE INDEX "nameIdx" ON "user" ("name")',
			'CREATE UNIQUE INDEX "emailIdx" ON "user" ("email")',
		]);
	});

	it('drops indexes', async () => {
		/** @type {import('../../dist/types.js').DBTable} */
		const initial = {
			...userInitial,
			indexes: {
				nameIdx: { on: ['name'], unique: false },
				emailIdx: { on: ['email'], unique: true },
			},
		};

		/** @type {import('../../dist/types.js').DBTable} */
		const final = {
			...userInitial,
			indexes: {},
		};

		const { queries } = await getCollectionChangeQueries({
			collectionName: 'user',
			oldCollection: initial,
			newCollection: final,
		});

		expect(queries).to.deep.equal(['DROP INDEX "nameIdx"', 'DROP INDEX "emailIdx"']);
	});

	it('drops and recreates modified indexes', async () => {
		/** @type {import('../../dist/types.js').DBTable} */
		const initial = {
			...userInitial,
			indexes: {
				nameIdx: { on: ['name'], unique: false },
				emailIdx: { on: ['email'], unique: true },
			},
		};

		/** @type {import('../../dist/types.js').DBTable} */
		const final = {
			...userInitial,
			indexes: {
				nameIdx: { on: ['name'], unique: true },
				emailIdx: { on: ['email'] },
			},
		};

		const { queries } = await getCollectionChangeQueries({
			collectionName: 'user',
			oldCollection: initial,
			newCollection: final,
		});

		expect(queries).to.deep.equal([
			'DROP INDEX "nameIdx"',
			'DROP INDEX "emailIdx"',
			'CREATE UNIQUE INDEX "nameIdx" ON "user" ("name")',
			'CREATE INDEX "emailIdx" ON "user" ("email")',
		]);
	});
});
