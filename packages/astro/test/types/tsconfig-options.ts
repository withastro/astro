import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type { TSConfig } from '../../dist/core/config/tsconfig.js';

describe('TSConfig JSON options', () => {
	it('accepts JSON compiler and acquisition settings', () => {
		expectTypeOf<{
			compilerOptions: {
				jsx: 'react-jsx';
				module: 'NodeNext';
				moduleResolution: 'bundler';
				strict: true;
			};
			typeAcquisition: { enable: true; include: ['node']; exclude: ['jquery'] };
			extends: ['base.json', 'strict.json'];
		}>().toExtend<TSConfig>();
	});

	it('rejects invalid compiler settings', () => {
		expectTypeOf<{ compilerOptions: { strict: 'true' } }>().not.toExtend<TSConfig>();
		expectTypeOf<{ compilerOptions: { jsx: 'invalid-jsx' } }>().not.toExtend<TSConfig>();
	});

	it('rejects invalid acquisition settings', () => {
		expectTypeOf<{ typeAcquisition: { enable: 'true' } }>().not.toExtend<TSConfig>();
	});
});
