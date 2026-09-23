import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import { fork } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';


describe('Missing secret', () => {
	let fixture: Fixture;
	const root = new URL('./fixtures/missing-env/', import.meta.url);
	const path = fileURLToPath(new URL(`./dist/server/entry.mjs?id=${Date.now()}`, root));
	const controller = new AbortController();

	before(async () => {
		fixture = await loadFixture({ root });
		await fixture.build();
	});

	after(() => {
		controller.abort();
	});

	it('ensure exitCode=1 when env not satisfied', async () => {
		const exitCode = await new Promise<number | null>((resolve) => {
			const process = fork(path, {
				env: {},
				signal: controller.signal,
			});
			process.addListener('exit', (code) => resolve(code));
		});
		assert.equal(exitCode, 1);
	});

	it('ensure does not exit when env satisfied', async () => {
		const exitCode = await Promise.race([
			new Promise<number | null>((resolve, reject) => {
				const process = fork(path, {
					env: {
						REQUIRED: 'non-empty-value',
					},
					signal: controller.signal,
				});
				process.addListener('exit', (code) => resolve(code));
				process.addListener('error', (err)=> {
					if (err?.name !== 'AbortError') {
						reject(err)
					}
				})
			}),
			setTimeout(5_000, null),
		]);
		assert.equal(exitCode, null);
	});
});
