import fsPromises from 'fs/promises';
import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import { it } from 'node:test';

const fixture_root = './fixtures/static-build-dir/';

describe('Static build: dir takes the URL path to the output directory', async () => {
	/** @type {URL} */
	let checkDir;
	/** @type {URL} */
	let checkGeneratedDir;
	before(async () => {
		const fixture = await loadFixture({
			root: fixture_root,
      vite: {
        build: {
          assetsInlineLimit: 0
        }
      },
			integrations: [
				{
					name: '@astrojs/dir',
					hooks: {
						'astro:build:generated': ({ dir }) => {
							checkGeneratedDir = dir;
						},
						'astro:build:done': ({ dir }) => {
							checkDir = dir;
						},
					},
				},
			],
		});
    try {
		  await fixture.build();
    }
    catch(er) {
      console.log("er: ", er);
    }
	});

	it('dir takes the URL path to the output directory', async () => {
		const removeTrailingSlash = (str) => str.replace(/\/$/, '');
		expect(removeTrailingSlash(checkDir.toString())).to.be.equal(
			removeTrailingSlash(new URL(`${fixture_root}dist`, import.meta.url).toString())
		);
		expect(checkDir.toString()).to.be.equal(checkGeneratedDir.toString());
	});

  it('cleans up nested empty folders', async () => {
    expect(await fsPromises.readdir(new URL(`${fixture_root}dist`, import.meta.url))).to.not.include('empty_dir_test');
  });

  it('copies a static file containing url encoded or special characters', async () => {
    expect(await fsPromises.readdir(new URL(`${fixture_root}dist`, import.meta.url))).to.include('test_%26_ü.txt');
  });
});
