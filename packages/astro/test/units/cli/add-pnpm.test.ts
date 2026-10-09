import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPnpmBuildApproval, mergeAllowBuilds } from '../../../dist/cli/add/pnpm.js';

const noPnpm = async () => {
	throw new Error('pnpm should not be called');
};

describe('astro add with pnpm', () => {
	it('approves workerd builds via --allow-build with pnpm v11.23+', async () => {
		for (const version of ['11.23.0', '11.28.5', '12.10.1']) {
			const approval = await getPnpmBuildApproval(
				['react', 'cloudflare'],
				async () => version,
				noPnpm,
			);
			assert.deepEqual(approval.flags, ['--allow-build=workerd'], version);
			assert.equal(approval.approve, undefined, version);
		}
	});

	it('does not approve builds for pnpm versions before v11 or unknown versions', async () => {
		for (const version of ['10.34.6', '9.15.9', undefined]) {
			const approval = await getPnpmBuildApproval(['cloudflare'], async () => version, noPnpm);
			assert.deepEqual(approval, { flags: [] }, String(version));
		}
	});

	it('does not look up the pnpm version for integrations without build dependencies', async () => {
		const approval = await getPnpmBuildApproval(['react'], noPnpm, noPnpm);
		assert.deepEqual(approval, { flags: [] });
	});

	// pnpm v11.0-v11.22 `--allow-build` replaces the existing `allowBuilds` map instead of merging.
	describe('pnpm v11.0 - v11.22', () => {
		it('merges workerd into the existing allowBuilds config instead of passing --allow-build', async () => {
			const calls: string[][] = [];
			const approval = await getPnpmBuildApproval(
				['cloudflare'],
				async () => '11.5.1',
				async (args) => {
					calls.push(args);
					return args.includes('get') ? '{\n  "esbuild": true,\n  "sharp": false\n}\n' : '';
				},
			);
			assert.deepEqual(approval.flags, []);
			assert.equal(calls.length, 0, 'config is only changed once approve() is called');

			await approval.approve!();
			assert.deepEqual(calls, [
				['--workspace-root', 'config', 'get', 'allowBuilds', '--json'],
				[
					'--workspace-root',
					'config',
					'set',
					'--location',
					'project',
					'allowBuilds',
					'{"esbuild":true,"sharp":false,"workerd":true}',
					'--json',
				],
			]);
		});

		it('falls back to the current directory outside a pnpm workspace', async () => {
			const calls: string[][] = [];
			const approval = await getPnpmBuildApproval(
				['cloudflare'],
				async () => '11.0.0',
				async (args) => {
					calls.push(args);
					if (args.includes('--workspace-root')) {
						throw new Error('--workspace-root may only be used inside a workspace');
					}
					return '';
				},
			);
			await approval.approve!();
			assert.deepEqual(calls.at(-1), [
				'config',
				'set',
				'--location',
				'project',
				'allowBuilds',
				'{"workerd":true}',
				'--json',
			]);
		});
	});

	describe('mergeAllowBuilds', () => {
		it('keeps existing entries and approves the packages', () => {
			assert.deepEqual(mergeAllowBuilds('{"esbuild":true,"workerd":false}', ['workerd']), {
				esbuild: true,
				workerd: true,
			});
		});

		it('handles empty or invalid config output', () => {
			assert.deepEqual(mergeAllowBuilds('', ['workerd']), { workerd: true });
			assert.deepEqual(mergeAllowBuilds('undefined', ['workerd']), { workerd: true });
			assert.deepEqual(mergeAllowBuilds('[]', ['workerd']), { workerd: true });
		});
	});
});
