import { expect } from 'chai';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/directory-mode/', import.meta.url);
describe('Directory mode', () => {
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');
	});

	it('generates functions folder inside the project root', () => {
		const testURL = new URL('functions', root);
		expect(existsSync(fileURLToPath(testURL))).to.be.true;
	});

	it('generates functions file inside the project root', () => {
		const testURL = new URL('functions/[[path]].js', root);
		expect(existsSync(fileURLToPath(testURL))).to.be.true;
	});

	it('generates a redirects file', () => {
		const testURL = new URL('dist/_redirects', root);
		try {
			let _redirects = readFileSync(fileURLToPath(testURL), 'utf-8');
			let parts = _redirects.split(/\s+/);
			expect(parts).to.deep.equal(['/old', '/', '301']);
		} catch (e) {
			expect(false).to.equal(true);
		}
	});
});
