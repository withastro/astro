import { expect } from 'chai';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/function-per-route/', import.meta.url);

describe('Function per Route', () => {
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');
	});

	it('generates functions folder inside the project root', () => {
		const testURL = new URL('functions', root);
		expect(existsSync(fileURLToPath(testURL))).to.be.true;
	});

	it('generates functions bundles for each page', () => {
		expect(existsSync(fileURLToPath(new URL('functions/index.js', root)))).to.be.true;
		expect(existsSync(fileURLToPath(new URL('functions/blog/cool.js', root)))).to.be.true;
		expect(existsSync(fileURLToPath(new URL('functions/blog/[post].js', root)))).to.be.true;
		expect(existsSync(fileURLToPath(new URL('functions/[person]/[car].js', root)))).to.be.true;
		expect(existsSync(fileURLToPath(new URL('functions/files/[[path]].js', root)))).to.be.true;
		expect(existsSync(fileURLToPath(new URL('functions/[language]/files/[[path]].js', root)))).to.be.true;
		expect(existsSync(fileURLToPath(new URL('functions/trpc/[trpc].js', root)))).to.be.true;
		expect(existsSync(fileURLToPath(new URL('functions/javascript.js', root)))).to.be.true;
		expect(existsSync(fileURLToPath(new URL('functions/test.json.js', root)))).to.be.true;
	});

	it('generates html files for pre-rendered routes', () => {
		expect(existsSync(fileURLToPath(new URL('dist/prerender/index.html', root)))).to.be.true;
	});
});
