import * as fs from 'node:fs';
import { expect } from 'chai';
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
		expect(writtenFiles).to.haveOwnProperty(expectedTypesFile);
		// smoke test `astro check` asserts whether content types pass.
		expect(writtenFiles[expectedTypesFile]).to.include(
			`declare module 'astro:content' {`,
			'Types file does not include `astro:content` module declaration'
		);
	});

	it('Adds type reference to `src/env.d.ts`', async () => {
		let writtenFiles = {};
		const typesEnvPath = new URL('env.d.ts', fixture.config.srcDir).href;
		const fsMock = {
			...fs,
			existsSync(path, ...args) {
				if (path.toString() === typesEnvPath) {
					return true;
				}
				return fs.existsSync(path, ...args);
			},
			promises: {
				...fs.promises,
				async readFile(path, ...args) {
					if (path.toString() === typesEnvPath) {
						return `/// <reference path="astro/client" />`;
					} else {
						return fs.promises.readFile(path, ...args);
					}
				},
				async writeFile(path, contents) {
					writtenFiles[path] = contents;
				},
			},
		};
		await fixture.sync({}, { fs: fsMock });

		expect(writtenFiles, 'Did not try to update env.d.ts file.').to.haveOwnProperty(typesEnvPath);
		expect(writtenFiles[typesEnvPath]).to.include(`/// <reference path="../.astro/types.d.ts" />`);
	});

	it('Writes `src/env.d.ts` if none exists', async () => {
		let writtenFiles = {};
		const typesEnvPath = new URL('env.d.ts', fixture.config.srcDir).href;
		const fsMock = {
			...fs,
			existsSync(path, ...args) {
				if (path.toString() === typesEnvPath) {
					return false;
				}
				return fs.existsSync(path, ...args);
			},
			promises: {
				...fs.promises,
				async writeFile(path, contents) {
					writtenFiles[path] = contents;
				},
			},
		};
		await fixture.sync({}, { fs: fsMock });

		expect(writtenFiles, 'Did not try to write env.d.ts file.').to.haveOwnProperty(typesEnvPath);
		expect(writtenFiles[typesEnvPath]).to.include(`/// <reference types="astro/client" />`);
		expect(writtenFiles[typesEnvPath]).to.include(`/// <reference path="../.astro/types.d.ts" />`);
	});
});
