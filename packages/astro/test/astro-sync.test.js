import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { ACTIONS_TYPES_FILE } from '../dist/actions/consts.js';
import { CONTENT_TYPES_FILE } from '../dist/content/consts.js';
import { getContentPaths } from '../dist/content/utils.js';
import { loadFixture } from './test-utils.js';

describe('astro sync', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-collections/' });
	});

	it('Writes types to `.astro`', async () => {
		let writtenFiles = {};
		const fsMock = {
			...fs,
			promises: {
				...fs.promises,
				async writeFile(path, contents) {
					writtenFiles[path] = contents;
				},
			},
		};
		await fixture.sync({}, { fs: fsMock });

		const expectedTypesFile = new URL('.astro/types.d.ts', fixture.config.root).href;
		assert.equal(writtenFiles.hasOwnProperty(expectedTypesFile), true);
		// smoke test `astro check` asserts whether content types pass.
		assert.equal(
			writtenFiles[expectedTypesFile].includes(`declare module 'astro:content' {`),
			true,
			'Types file does not include `astro:content` module declaration'
		);
	});

	it('Adds type reference to `src/env.d.ts`', async () => {
		let writtenFiles = {};
		const typesEnvPath = getTypesEnvPath(fixture);
		const fsMock = {
			...fs,
			existsSync: createExistsSync(fixture, true),
			promises: {
				...fs.promises,
				async readFile(path) {
					if (path.toString() === typesEnvPath) {
						return `/// <reference path="astro/client" />`;
					} else {
						throw new Error(`Tried to read unexpected path: ${path}`);
					}
				},
				async writeFile(path, contents) {
					writtenFiles[path] = contents;
				},
			},
		};
		await fixture.sync({}, { fs: fsMock });

		assert.equal(
			writtenFiles.hasOwnProperty(typesEnvPath),
			true,
			'Did not try to update env.d.ts file.'
		);
		assert.equal(
			writtenFiles[typesEnvPath].includes(`/// <reference path="../.astro/types.d.ts" />`),
			true
		);
	});

	it('Writes `src/env.d.ts` if none exists', async () => {
		let writtenFiles = {};
		const typesEnvPath = getTypesEnvPath(fixture);
		const fsMock = {
			...fs,
			existsSync: createExistsSync(fixture, false),
			promises: {
				...fs.promises,
				async writeFile(path, contents) {
					writtenFiles[path] = contents;
				},
			},
		};
		await fixture.sync({}, { fs: fsMock });

		assert.equal(
			writtenFiles.hasOwnProperty(typesEnvPath),
			true,
			'Did not try to write env.d.ts file.'
		);
		assert.equal(
			writtenFiles[typesEnvPath].includes(`/// <reference types="astro/client" />`),
			true
		);
		assert.equal(
			writtenFiles[typesEnvPath].includes(`/// <reference path="../.astro/types.d.ts" />`),
			true
		);
	});
});

function getTypesEnvPath(fixture) {
	return new URL('env.d.ts', fixture.config.srcDir).href;
}

function createExistsSync(fixture, envDtsExists = false) {
	const { cacheDir } = getContentPaths(fixture.config);
	const paths = [
		new URL(CONTENT_TYPES_FILE, cacheDir).href,
		new URL(ACTIONS_TYPES_FILE, cacheDir).href,
		cacheDir.href,
	];
	if (envDtsExists) {
		paths.push(getTypesEnvPath(fixture));
	}

	return (path) => paths.includes(path.toString());
}
