import { expect } from 'chai';
import { describe, it } from 'mocha';
import { getCollectionChangeQueries } from '../../dist/core/cli/migration-queries.js';
import { setCollectionsMeta } from '../../dist/core/integration/index.js';
import { field, defineCollection, collectionSchema } from '../../dist/core/types.js';

let User = defineCollection({
	fields: {
		id: field.number({ primaryKey: true }),
		name: field.text(),
		age: field.number(),
		email: field.text({ unique: true }),
		mi: field.text({ optional: true }),
	},
});

let SentBox = defineCollection({
	fields: {
		to: field.text({ references: () => User.fields.id }),
		subject: field.text(),
		body: field.text(),
	},
});

// Set collection names for references to resolve.
// Avoid using collectionSchema.parse before this,
// since Zod will lose some object references.
setCollectionsMeta({ User, SentBox });
User = collectionSchema.parse(User);
SentBox = collectionSchema.parse(SentBox);

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
		collectionName: 'User',
		oldCollection,
		newCollection,
		ambiguityResponses,
	});
}

describe('reference queries', () => {
	it('adds references with lossless table recreate', async () => {
		const SentBoxInitial = collectionSchema.parse(
			defineCollection({
				fields: {
					...SentBox.fields,
					to: field.text(),
				},
			})
		);

		const { queries } = await userChangeQueries(SentBoxInitial, SentBox);

		expect(queries[0]).to.not.be.undefined;
		const tempTableName = getTempTableName(queries[0]);

		expect(queries).to.deep.equal([
			`CREATE TABLE \"${tempTableName}\" (_id INTEGER PRIMARY KEY, \"to\" text NOT NULL REFERENCES \"User\" (\"id\"), \"subject\" text NOT NULL, \"body\" text NOT NULL)`,
			`INSERT INTO \"${tempTableName}\" (\"_id\", \"to\", \"subject\", \"body\") SELECT \"_id\", \"to\", \"subject\", \"body\" FROM \"User\"`,
			'DROP TABLE "User"',
			`ALTER TABLE \"${tempTableName}\" RENAME TO \"User\"`,
		]);
	});

	it('removes references with lossless table recreate', async () => {
		const SentBoxFinal = collectionSchema.parse(
			defineCollection({
				fields: {
					...SentBox.fields,
					to: field.text(),
				},
			})
		);
		const { queries } = await userChangeQueries(SentBox, SentBoxFinal);

		expect(queries[0]).to.not.be.undefined;
		const tempTableName = getTempTableName(queries[0]);

		expect(queries).to.deep.equal([
			`CREATE TABLE \"${tempTableName}\" (_id INTEGER PRIMARY KEY, \"to\" text NOT NULL, \"subject\" text NOT NULL, \"body\" text NOT NULL)`,
			`INSERT INTO \"${tempTableName}\" (\"_id\", \"to\", \"subject\", \"body\") SELECT \"_id\", \"to\", \"subject\", \"body\" FROM \"User\"`,
			'DROP TABLE "User"',
			`ALTER TABLE \"${tempTableName}\" RENAME TO \"User\"`,
		]);
	});
});

/** @param {string} query */
function getTempTableName(query) {
	return query.match(/User_([a-z0-9]+)/)?.[0];
}
