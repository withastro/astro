import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getProxyCode } from '../../../dist/assets/utils/proxy.js';

const metadata = {
	src: '/_astro/image.hash.png',
	width: 1,
	height: 1,
	format: 'png' as const,
	fsPath: '/abs/project/src/image.png',
};

describe('getProxyCode', () => {
	it('serializes an fsPath override instead of the absolute source path', () => {
		const code = getProxyCode(metadata, true, 'src/image.png');
		assert.ok(!code.includes(metadata.fsPath), 'the absolute fsPath must not be serialized');
		assert.ok(code.includes('fsPath":"src/image.png"'), 'the override must be serialized');
	});

	it('keeps the metadata fsPath when no override is given', () => {
		const code = getProxyCode(metadata, true);
		assert.ok(code.includes(`fsPath":${JSON.stringify(metadata.fsPath)}`));
	});
});
