import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { perf } from '../../../dist/runtime/client/dev-toolbar/apps/audit/rules/perf.js';

const useImageComponent = perf.find((rule) => rule.code === 'perf-use-image-component')!;

function createImg(src: string) {
	return {
		closest: () => null,
		getAttribute: (name: string) => (name === 'src' ? src : null),
	} as unknown as Element;
}

describe('dev toolbar audit: perf-use-image-component', () => {
	let fetchMock: ReturnType<typeof mock.fn>;

	beforeEach(() => {
		(globalThis as any).document = { baseURI: 'http://localhost:4321/' };
		fetchMock = mock.fn(async () => new Response(new Uint8Array(30000)));
		mock.method(globalThis, 'fetch', fetchMock);
	});

	afterEach(() => {
		mock.restoreAll();
		delete (globalThis as any).document;
	});

	it('reads the image size from Resource Timing without fetching the image again', async () => {
		mock.method(performance, 'getEntriesByName', (name: string) =>
			name === 'http://localhost:4321/ring.svg' ? [{ decodedBodySize: 742 }] : [],
		);

		assert.equal(await useImageComponent.match!(createImg('/ring.svg')), false);
		assert.equal(fetchMock.mock.callCount(), 0);
	});

	it('flags large images using the Resource Timing size', async () => {
		mock.method(performance, 'getEntriesByName', () => [{ decodedBodySize: 50000 }]);

		assert.equal(await useImageComponent.match!(createImg('/large.jpg')), true);
		assert.equal(fetchMock.mock.callCount(), 0);
	});

	it('falls back to fetching the image when no Resource Timing entry exists', async () => {
		mock.method(performance, 'getEntriesByName', () => []);

		assert.equal(await useImageComponent.match!(createImg('/large.jpg')), true);
		assert.equal(fetchMock.mock.callCount(), 1);
	});
});
