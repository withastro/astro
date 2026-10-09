import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
	KNOWN_LOCKFILES,
	LockfileFinder,
	LockfileHasher,
} from '../../../dist/core/build/lockfile/index.js';

/** In-memory fs that reports the given absolute paths as existing files. */
function fakeFs(files: Record<string, string>) {
	return {
		existsSync(p: string) {
			return Object.hasOwn(files, path.resolve(p));
		},
		readFileSync(p: string) {
			const contents = files[path.resolve(p)];
			if (contents === undefined) throw new Error(`ENOENT: ${p}`);
			return Buffer.from(contents);
		},
	};
}

describe('LockfileFinder', () => {
	it('finds a lockfile in the start directory', () => {
		const files = { [path.resolve('/project/pnpm-lock.yaml')]: 'a' };
		const finder = new LockfileFinder(fakeFs(files));
		assert.deepEqual(finder.find('/project'), [path.resolve('/project/pnpm-lock.yaml')]);
	});

	it('walks up to a workspace root to find the lockfile', () => {
		const files = { [path.resolve('/workspace/pnpm-lock.yaml')]: 'a' };
		const finder = new LockfileFinder(fakeFs(files));
		assert.deepEqual(finder.find('/workspace/apps/site'), [
			path.resolve('/workspace/pnpm-lock.yaml'),
		]);
	});

	it('returns every lockfile at the first level that has any', () => {
		const files = {
			[path.resolve('/project/pnpm-lock.yaml')]: 'a',
			[path.resolve('/project/package-lock.json')]: 'b',
		};
		const finder = new LockfileFinder(fakeFs(files));
		assert.deepEqual(finder.find('/project').sort(), [
			path.resolve('/project/package-lock.json'),
			path.resolve('/project/pnpm-lock.yaml'),
		]);
	});

	it('stops at the first directory with a lockfile and ignores higher ones', () => {
		const files = {
			[path.resolve('/workspace/pnpm-lock.yaml')]: 'root',
			[path.resolve('/workspace/apps/site/package-lock.json')]: 'nested',
		};
		const finder = new LockfileFinder(fakeFs(files));
		assert.deepEqual(finder.find('/workspace/apps/site'), [
			path.resolve('/workspace/apps/site/package-lock.json'),
		]);
	});

	it('returns an empty array when no lockfile exists', () => {
		const finder = new LockfileFinder(fakeFs({}));
		assert.deepEqual(finder.find('/project'), []);
	});
});

describe('LockfileHasher', () => {
	it('returns an empty string when there are no lockfiles', async () => {
		const hasher = new LockfileHasher(fakeFs({}));
		assert.equal(await hasher.hash([]), '');
	});

	it('produces a stable hash regardless of input order', async () => {
		const files = {
			[path.resolve('/project/pnpm-lock.yaml')]: 'a',
			[path.resolve('/project/package-lock.json')]: 'b',
		};
		const hasher = new LockfileHasher(fakeFs(files));
		const first = await hasher.hash([
			path.resolve('/project/pnpm-lock.yaml'),
			path.resolve('/project/package-lock.json'),
		]);
		const second = await hasher.hash([
			path.resolve('/project/package-lock.json'),
			path.resolve('/project/pnpm-lock.yaml'),
		]);
		assert.equal(first, second);
	});

	it('changes when lockfile contents change', async () => {
		const before = new LockfileHasher(fakeFs({ [path.resolve('/p/pnpm-lock.yaml')]: 'v1' }));
		const after = new LockfileHasher(fakeFs({ [path.resolve('/p/pnpm-lock.yaml')]: 'v2' }));
		assert.notEqual(
			await before.hash([path.resolve('/p/pnpm-lock.yaml')]),
			await after.hash([path.resolve('/p/pnpm-lock.yaml')]),
		);
	});
});

describe('KNOWN_LOCKFILES', () => {
	it('covers the supported package managers', () => {
		assert.deepEqual(
			[...KNOWN_LOCKFILES],
			['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lock', 'bun.lockb'],
		);
	});
});
