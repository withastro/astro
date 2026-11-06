import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createImageResponse } from '../../../dist/assets/endpoint/response.js';

const SVG = new TextEncoder().encode(
	'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>',
);
// 1×1 PNG
const PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
	'base64',
);

describe('createImageResponse', () => {
	it('serves SVG bytes labelled svg as image/svg+xml', async () => {
		const response = createImageResponse(SVG, 'svg');
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('content-type'), 'image/svg+xml');
		assert.deepEqual(new Uint8Array(await response.arrayBuffer()), SVG);
	});

	it('rejects PNG bytes labelled svg', async () => {
		const response = createImageResponse(PNG, 'svg');
		assert.equal(response.status, 403);
		assert.equal(await response.text(), 'Cannot convert non-SVG source to SVG format');
	});

	it('rejects bytes of no recognised image type when labelled svg', () => {
		const response = createImageResponse(new TextEncoder().encode('not an image'), 'svg');
		assert.equal(response.status, 403);
	});

	it('serves what the sharp service returns for a PNG source requested as svg', async () => {
		const sharpService = (await import('../../../dist/assets/services/sharp.js')).default;
		const { data, format } = await sharpService.transform(
			PNG,
			{ src: 'pixel.png', format: 'svg' },
			{ service: { entrypoint: '', config: {} } } as any,
			{ info() {}, warn() {}, error() {} },
		);
		const response = createImageResponse(data, format);
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('content-type'), 'image/png');
	});
});
