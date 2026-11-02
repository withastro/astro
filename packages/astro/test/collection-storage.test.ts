import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

function readFilesRecursively(dir: URL): string {
	return fs
		.readdirSync(dir, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && /\.m?js$/.test(entry.name))
		.map((entry) => fs.readFileSync(`${entry.parentPath}/${entry.name}`, 'utf-8'))
		.join('\n');
}

describe('Collection storage drivers', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		// Read by the driver with `getSecret()` from `astro:env/server`
		process.env.JSON_DRIVER_SECRET = 'json-driver-secret';
		fixture = await loadFixture({
			root: './fixtures/collection-storage/',
			adapter: testAdapter(),
			outDir: './dist/collection-storage/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('prerenders pages from a stored collection', async () => {
		const $ = cheerio.load(await fixture.readFile('/client/docs/intro/index.html'));

		assert.equal($('#title').text(), 'Introduction');
		assert.equal($('#author').text(), 'Alice');
		assert.equal($('article h1').text(), 'Stored introduction');
		assert.ok(await fixture.readFile('/client/docs/setup/index.html'));
	});

	it('resolves images of a stored collection', async () => {
		const $ = cheerio.load(await fixture.readFile('/client/docs/intro/index.html'));

		assert.match($('#cover').attr('src')!, /^\/_astro\/cover\..+\.png$/);
	});

	it('renders deferred entries of a stored collection', async () => {
		const $ = cheerio.load(await fixture.readFile('/client/guides/deferred/index.html'));

		assert.equal($('#title').text(), 'Deferred guide');
		assert.equal($('article h1').text(), 'Stored deferred guide');
	});

	it('reads stored collections on demand, with and without content', async () => {
		const response = await app.render(new Request('http://example.com/entries.json'));
		assert.equal(response.status, 200);

		assert.deepEqual(await response.json(), {
			ids: ['intro', 'setup'],
			withoutContent: true,
			withContent: true,
			filtered: [{ id: 'setup', hasBody: true }],
			intro: { title: 'Introduction', hasBody: false },
			byReference: ['setup'],
			renderError: 'RenderEntryWithoutContentError',
			missing: null,
		});
	});

	it('does not bundle stored entries with the server', async () => {
		const server = readFilesRecursively(new URL('./server/', fixture.config.outDir));

		assert.doesNotMatch(server, /This paragraph lives in the storage driver/);
		// Bundled collections stay in the server
		assert.match(server, /Alice/);
	});

	it('writes a new snapshot on every build', async () => {
		const driverDir = new URL('./.astro/json-driver/', fixture.config.root);
		const snapshotsBefore = fs.readdirSync(driverDir);

		await fixture.build({});

		const snapshotsAfter = fs.readdirSync(driverDir);
		assert.equal(snapshotsAfter.length, snapshotsBefore.length + 1);
	});
});

describe('The content option without collection storage drivers', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-option-disabled/' });
		await fixture.build({});
	});

	it('throws', async () => {
		const $ = cheerio.load(await fixture.readFile('/index.html'));

		assert.equal($('#entry').text(), 'ContentOptionNotEnabled');
		assert.equal($('#collection').text(), 'ContentOptionNotEnabled');
		assert.equal($('#count').text(), '1');
	});

	it('is rejected by the types', () => {
		// Fails if an `@ts-expect-error` in src/type-checks.ts is unused
		execSync('npx tsc --noEmit', { cwd: fileURLToPath(fixture.config.root), stdio: 'pipe' });
	});
});
