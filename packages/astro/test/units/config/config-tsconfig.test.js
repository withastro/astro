import { expect } from 'chai';
import { fileURLToPath } from 'node:url';
import { loadTSConfig, updateTSConfigForFramework } from '../../../dist/core/config/index.js';
import * as path from 'node:path';
import * as tsr from 'tsconfig-resolver';

const cwd = fileURLToPath(new URL('../../fixtures/tsconfig-handling/', import.meta.url));

describe('TSConfig handling', () => {
	beforeEach(() => {
		// `tsconfig-resolver` has a weird internal cache that only vaguely respect its own rules when not resolving
		// so we need to clear it before each test or we'll get false positives. This should only be relevant in tests.
		tsr.clearCache();
	});

	describe('tsconfig / jsconfig loading', () => {
		it('can load tsconfig.json', () => {
			const config = loadTSConfig(cwd);

			expect(config.exists).to.equal(true);
			expect(config.config.files).to.deep.equal(['im-a-test']);
		});

		it('can resolve tsconfig.json up directories', () => {
			const config = loadTSConfig(path.join(cwd, 'nested-folder'));

			expect(config.exists).to.equal(true);
			expect(config.path).to.equal(path.join(cwd, 'tsconfig.json'));
			expect(config.config.files).to.deep.equal(['im-a-test']);
		});

		it('can fallback to jsconfig.json if tsconfig.json does not exists', () => {
			const config = loadTSConfig(path.join(cwd, 'jsconfig'), false);

			expect(config.exists).to.equal(true);
			expect(config.path).to.equal(path.join(cwd, 'jsconfig', 'jsconfig.json'));
			expect(config.config.files).to.deep.equal(['im-a-test-js']);
		});

		it('properly return errors when not resolving', () => {
			const invalidConfig = loadTSConfig(path.join(cwd, 'invalid'), false);
			const missingConfig = loadTSConfig(path.join(cwd, 'missing'), false);

			expect(invalidConfig.exists).to.equal(false);
			expect(invalidConfig.reason).to.equal('invalid-config');

			expect(missingConfig.exists).to.equal(false);
			expect(missingConfig.reason).to.equal('not-found');
		});
	});

	describe('tsconfig / jsconfig updates', () => {
		it('can update a tsconfig with a framework config', () => {
			const config = loadTSConfig(cwd);
			const updatedConfig = updateTSConfigForFramework(config.config, 'react');

			expect(config.config).to.not.equal('react-jsx');
			expect(updatedConfig.compilerOptions.jsx).to.equal('react-jsx');
		});

		it('produce no changes on invalid frameworks', () => {
			const config = loadTSConfig(cwd);
			const updatedConfig = updateTSConfigForFramework(config.config, 'doesnt-exist');

			expect(config.config).to.deep.equal(updatedConfig);
		});
	});
});
