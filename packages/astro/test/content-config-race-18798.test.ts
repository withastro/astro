import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

const fixturePath = './fixtures/content-config-race-18798/';
const fixtureRoot = path.resolve('test/fixtures/content-config-race-18798');
const initialConfig = `import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const theme = defineCollection({
	loader: glob({ pattern: 'theme.json', base: './src/content' }),
	schema: z.object({ colors: z.object({ text: z.string() }) }),
});

export const collections = { theme };
`;
const updatedConfig = `import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const theme = defineCollection({
	loader: glob({ pattern: 'theme.json', base: './src/content' }),
	schema: z.object({ colors: z.object({ text: z.string(), dark: z.string().optional() }) }),
});

export const collections = { theme };
`;

async function waitFor(condition: () => boolean | Promise<boolean>, timeout = 10000) {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		if (await condition()) return true;
		await delay(100);
	}
	return false;
}

describe('Content config/data race #18798', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fs.rmSync(path.join(fixtureRoot, '.astro'), { recursive: true, force: true });
		fs.writeFileSync(path.join(fixtureRoot, 'src/content.config.ts'), initialConfig);
		fs.writeFileSync(
			path.join(fixtureRoot, 'src/content/theme.json'),
			'{"colors":{"text":"#ffffff"}}',
		);
		fixture = await loadFixture({ root: fixturePath });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
		fs.writeFileSync(path.join(fixtureRoot, 'src/content.config.ts'), initialConfig);
		fs.writeFileSync(
			path.join(fixtureRoot, 'src/content/theme.json'),
			'{"colors":{"text":"#ffffff"}}',
		);
	});

	it('re-parses changed JSON with a simultaneously changed schema', async () => {
		const initial = await (await fixture.fetch('/')).text();
		assert.ok(initial.includes('DARK=MISSING'));

		// Write both files synchronously so the data event can race with the config change.
		fs.writeFileSync(
			path.join(fixtureRoot, 'src/content/theme.json'),
			'{"colors":{"text":"#ffffff","dark":"#101418"}}',
		);
		fs.writeFileSync(path.join(fixtureRoot, 'src/content.config.ts'), updatedConfig);

		const updated = await waitFor(async () =>
			(await (await fixture.fetch('/')).text()).includes('DARK=#101418'),
		);
		assert.ok(updated, 'entry did not update to the new schema and JSON value');
		// Let the watcher finish processing both file events before the server is stopped.
		await delay(500);
	});
});
