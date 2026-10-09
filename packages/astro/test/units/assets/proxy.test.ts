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

/** Extracts the object literal passed as the proxy target from the generated code. */
function proxyTarget(code: string): Record<string, unknown> {
	const start = code.indexOf('new Proxy(') + 'new Proxy('.length;
	const end = code.indexOf(', {', start);
	return JSON.parse(code.slice(start, end));
}

describe('getProxyCode', () => {
	it('keeps fsPath out of the serialized target and returns the override from the getter', () => {
		const code = getProxyCode(metadata, true, 'src/image.png');
		assert.equal('fsPath' in proxyTarget(code), false, 'fsPath must not be an own target property');
		assert.ok(!code.includes(metadata.fsPath), 'the absolute fsPath must not be serialized');
		assert.ok(code.includes('return "src/image.png"'), 'the override is returned by the getter');
	});

	it('returns the metadata fsPath from the getter when no override is given', () => {
		const code = getProxyCode(metadata, true);
		assert.equal('fsPath' in proxyTarget(code), false);
		assert.ok(code.includes(`return ${JSON.stringify(metadata.fsPath)}`));
	});
});
