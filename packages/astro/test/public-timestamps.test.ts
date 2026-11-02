import assert from 'node:assert/strict';
import { mkdir, readFile, rm, stat, symlink, utimes, writeFile } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import testAdapter from './test-adapter.ts';
import { loadFixture } from './test-utils.ts';

const root = new URL('./fixtures/public-timestamps/', import.meta.url);
const publicDir = new URL('./public/', root);
const alternatePublicDir = new URL('./alternate/', root);
const modifiedAt = new Date('2020-01-01T00:00:00Z');
const generatedAt = new Date('2024-01-01T00:00:00Z');

// All generated files are given an explicit date so this also catches regressions
// on platforms where copyFile happens to preserve timestamps already.
describe('Public file timestamps', () => {
	before(async () => {
		await mkdir(new URL('./nested/', publicDir), { recursive: true });
		for (const name of ['plain.txt', 'nested/file.txt', 'overwritten.txt']) {
			const file = new URL(name, publicDir);
			await writeFile(file, 'public contents');
			await utimes(file, modifiedAt, modifiedAt);
		}
		if (process.platform !== 'win32') {
			await symlink('plain.txt', new URL('./linked.txt', publicDir));
			await symlink('nested', new URL('./linked-dir', publicDir), 'dir');
		}
		await mkdir(alternatePublicDir, { recursive: true });
		await writeFile(new URL('alternate.txt', alternatePublicDir), 'alternate public contents');
		await utimes(new URL('alternate.txt', alternatePublicDir), modifiedAt, modifiedAt);
	});

	after(async () => {
		await rm(publicDir, { recursive: true, force: true });
		await rm(alternatePublicDir, { recursive: true, force: true });
	});

	async function build(name: string, vite = {}, server = false) {
		const fixture = await loadFixture({
			root: './fixtures/public-timestamps/',
			outDir: `./dist/${name}/`,
			...(server ? ({ output: 'server', adapter: testAdapter() } as const) : {}),
			vite: {
				...vite,
				plugins: [
					{
						name: 'test:overwrite-public',
						applyToEnvironment(environment) {
							return environment.name === 'client';
						},
						configEnvironment(envName) {
							// Astro forces copying on by default in the client environment,
							// so disable it after its build config has been assembled.
							if (envName === 'client' && 'build' in vite) {
								return { build: { copyPublicDir: false } };
							}
						},
						async writeBundle(options) {
							if ('build' in vite) assert.equal(this.environment.config.build.copyPublicDir, false);
							const dir = pathToFileURL(`${options.dir}/`);
							await mkdir(dir, { recursive: true });
							// Same size, different bytes: a size-only comparison is not enough.
							await writeFile(new URL('overwritten.txt', dir), 'plugin contents');
							await utimes(new URL('overwritten.txt', dir), generatedAt, generatedAt);
							// Identical bytes still must not be timestamped when copying is disabled.
							if ('build' in vite || 'publicDir' in vite) {
								await writeFile(new URL('plain.txt', dir), 'public contents');
								await utimes(new URL('plain.txt', dir), generatedAt, generatedAt);
							}
						},
					},
				],
			},
		});
		await fixture.build();
		return server ? fixture.config.build.client : fixture.config.outDir;
	}

	it('preserves unchanged regular, nested, and symlinked public files', async () => {
		const outDir = await build('unchanged');
		const names = ['plain.txt', 'nested/file.txt'];
		if (process.platform !== 'win32') names.push('linked.txt', 'linked-dir/file.txt');
		for (const name of names) {
			assert.equal(await readFile(new URL(name, outDir), 'utf8'), 'public contents');
			assert.equal((await stat(new URL(name, outDir))).mtimeMs, modifiedAt.getTime(), name);
		}
	});

	it('preserves public timestamps in the server build client directory', async () => {
		const outDir = await build('server', {}, true);
		assert.equal((await stat(new URL('plain.txt', outDir))).mtimeMs, modifiedAt.getTime());
		assert.equal((await stat(new URL('overwritten.txt', outDir))).mtimeMs, generatedAt.getTime());
	});

	it('does not backdate a file overwritten by a build plugin', async () => {
		const outDir = await build('overwritten');
		assert.equal(await readFile(new URL('overwritten.txt', outDir), 'utf8'), 'plugin contents');
		assert.equal((await stat(new URL('overwritten.txt', outDir))).mtimeMs, generatedAt.getTime());
	});

	it('respects resolved build.copyPublicDir: false', async () => {
		const outDir = await build('copy-disabled', { build: { copyPublicDir: false } });
		assert.equal((await stat(new URL('plain.txt', outDir))).mtimeMs, generatedAt.getTime());
	});

	it('uses the resolved Vite publicDir instead of the default public directory', async () => {
		const outDir = await build('alternate', { publicDir: fileURLToPath(alternatePublicDir) });
		assert.equal((await stat(new URL('alternate.txt', outDir))).mtimeMs, modifiedAt.getTime());
	});

	it('respects vite.publicDir: false', async () => {
		const outDir = await build('public-disabled', { publicDir: false });
		assert.equal((await stat(new URL('plain.txt', outDir))).mtimeMs, generatedAt.getTime());
	});
});
