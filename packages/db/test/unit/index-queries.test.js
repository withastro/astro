import { expect } from 'chai';
import { describe, it } from 'mocha';
import { getTableChangeQueries } from '../../dist/core/cli/migration-queries.js';
import { tableSchema } from '../../dist/core/schemas.js';
import { column } from '../../dist/runtime/config.js';

const userInitial = tableSchema.parse({
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

		const { queries } = await getTableChangeQueries({
			tableName: 'user',
			oldTable: userInitial,
			newTable: userFinal,
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

		const { queries } = await getTableChangeQueries({
			tableName: 'user',
			oldTable: initial,
			newTable: final,
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

		const { queries } = await getTableChangeQueries({
			tableName: 'user',
			oldTable: initial,
			newTable: final,
		});

		expect(queries).to.deep.equal([
			'DROP INDEX "nameIdx"',
			'DROP INDEX "emailIdx"',
			'CREATE UNIQUE INDEX "nameIdx" ON "user" ("name")',
			'CREATE INDEX "emailIdx" ON "user" ("email")',
		]);
	});
});
