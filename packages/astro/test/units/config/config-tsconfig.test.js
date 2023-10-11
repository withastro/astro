import { expect } from 'chai';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTSConfig, updateTSConfigForFramework } from '../../../dist/core/config/index.js';

const cwd = fileURLToPath(new URL('../../fixtures/tsconfig-handling/', import.meta.url));

describe('TSConfig handling', () => {
	describe('tsconfig / jsconfig loading', () => {
		it('can load tsconfig.json', async () => {
			const config = await loadTSConfig(cwd);

			expect(config).to.not.be.undefined;
		});

		it('can resolve tsconfig.json up directories', async () => {
			const config = await loadTSConfig(cwd);

			expect(config).to.not.be.undefined;
			expect(config.tsconfigFile).to.equal(path.join(cwd, 'tsconfig.json'));
			expect(config.tsconfig.files).to.deep.equal(['im-a-test']);
		});

		it('can fallback to jsconfig.json if tsconfig.json does not exists', async () => {
			const config = await loadTSConfig(path.join(cwd, 'jsconfig'));

			expect(config).to.not.be.undefined;
			expect(config.tsconfigFile).to.equal(path.join(cwd, 'jsconfig', 'jsconfig.json'));
			expect(config.tsconfig.files).to.deep.equal(['im-a-test-js']);
		});

		it('properly return errors when not resolving', async () => {
			const invalidConfig = await loadTSConfig(path.join(cwd, 'invalid'));
			const missingConfig = await loadTSConfig(path.join(cwd, 'missing'));

			expect(invalidConfig).to.equal('invalid-config');
			expect(missingConfig).to.equal('missing-config');
		});
	});

	describe('tsconfig / jsconfig updates', () => {
		it('can update a tsconfig with a framework config', async () => {
			const config = await loadTSConfig(cwd);
			const updatedConfig = updateTSConfigForFramework(config.tsconfig, 'react');

			expect(config.tsconfig).to.not.equal('react-jsx');
			expect(updatedConfig.compilerOptions.jsx).to.equal('react-jsx');
		});

		it('produce no changes on invalid frameworks', async () => {
			const config = await loadTSConfig(cwd);
			const updatedConfig = updateTSConfigForFramework(config.tsconfig, 'doesnt-exist');

			expect(config.tsconfig).to.deep.equal(updatedConfig);
		});
	});
});
