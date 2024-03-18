import { expect } from 'chai';
import { loadFixture } from '../../astro/test/test-utils.js';

const foreignKeyConstraintError =
	'LibsqlError: SQLITE_CONSTRAINT_FOREIGNKEY: FOREIGN KEY constraint failed';

describe('astro:db - error handling', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/error-handling/', import.meta.url),
		});
	});

	describe('development', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Raises foreign key constraint LibsqlError', async () => {
			const json = await fixture.fetch('/foreign-key-constraint.json').then((res) => res.json());
			expect(json.error).to.equal(foreignKeyConstraintError);
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Raises foreign key constraint LibsqlError', async () => {
			const json = await fixture.readFile('/foreign-key-constraint.json');
			expect(JSON.parse(json).error).to.equal(foreignKeyConstraintError);
		});
	});
});
