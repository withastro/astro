// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	isFontType,
	extractFontType,
	createCache,
	createURLProxy,
} from '../../../../dist/assets/fonts/utils.js';

function createSpyCache() {
	/** @type {Map<string, Buffer>} */
	const store = new Map();

	const storage = {
		/**
		 * @param {string} key
		 * @returns {Promise<Buffer | null>}
		 */
		getItemRaw: async (key) => {
			return store.get(key) ?? null;
		},
		/**
		 * @param {string} key
		 * @param {Buffer} value
		 * @returns {Promise<void>}
		 */
		setItemRaw: async (key, value) => {
			store.set(key, value);
		},
	};
	const cache = createCache(
		// @ts-expect-error we only mock the required hooks
		storage,
	);

	return { cache, getKeys: () => Array.from(store.keys()) };
}

/**
 *
 * @param {string} id
 * @param {string} value
 */
function proxyURLSpy(id, value) {
	/** @type {Parameters<Parameters<typeof createURLProxy>[0]['collect']>[0]} */
	let collected = /** @type {any} */ (undefined);
	const proxyURL = createURLProxy({
		hashString: () => id,
		collect: (data) => {
			collected = data;
			return 'base/' + data.hash;
		},
	});
	const url = proxyURL(value);

	return {
		url,
		collected,
	};
}

describe('fonts utils', () => {
	it('isFontType()', () => {
		assert.equal(isFontType('woff2'), true);
		assert.equal(isFontType('woff'), true);
		assert.equal(isFontType('otf'), true);
		assert.equal(isFontType('ttf'), true);
		assert.equal(isFontType('eot'), true);
		assert.equal(isFontType(''), false);
	});

	it('extractFontType', () => {
		/** @type {Array<[string, false | string]>} */
		const data = [
			['', false],
			['.', false],
			['test.', false],
			['https://foo.bar/file', false],
			[
				'https://fonts.gstatic.com/s/roboto/v47/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkC3kaSTbQWt4N.woff2',
				'woff2',
			],
			['/home/documents/project/font.ttf', 'ttf'],
		];

		for (const [input, check] of data) {
			try {
				const res = extractFontType(input);
				if (check) {
					assert.equal(res, check);
				} else {
					assert.fail(`String ${JSON.stringify(input)} should not be valid`);
				}
			} catch (e) {
				if (check) {
					assert.fail(`String ${JSON.stringify(input)} should be valid`);
				} else {
					assert.equal(e instanceof Error, true);
					assert.equal(e.message, "Can't extract font type");
				}
			}
		}
	});

	it('createCache()', async () => {
		const { cache, getKeys } = createSpyCache();

		assert.deepStrictEqual(getKeys(), []);

		let buffer = Buffer.from('foo');
		let res = await cache('foo', async () => buffer);
		assert.equal(res.cached, false);
		assert.equal(res.data, buffer);

		assert.deepStrictEqual(getKeys(), ['foo']);

		res = await cache('foo', async () => buffer);
		assert.equal(res.cached, true);
		assert.equal(res.data, buffer);

		assert.deepStrictEqual(getKeys(), ['foo']);
	});

	it('createURLProxy()', () => {
		let { url, collected } = proxyURLSpy(
			'foo',
			'https://fonts.gstatic.com/s/roboto/v47/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkC3kaSTbQWt4N.woff2',
		);
		assert.equal(url, 'base/foo.woff2');
		assert.deepStrictEqual(collected, {
			hash: 'foo.woff2',
			type: 'woff2',
			value:
				'https://fonts.gstatic.com/s/roboto/v47/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkC3kaSTbQWt4N.woff2',
		});

		({ url, collected } = proxyURLSpy('bar', '/home/documents/project/font.ttf'));
		assert.equal(url, 'base/bar.ttf');
		assert.deepStrictEqual(collected, {
			hash: 'bar.ttf',
			type: 'ttf',
			value: '/home/documents/project/font.ttf',
		});
	});
});
