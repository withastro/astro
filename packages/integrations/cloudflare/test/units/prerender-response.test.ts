import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createFramedPrerenderResponse,
	PRERENDER_RESPONSE_CONTENT_TYPE,
	readFramedPrerenderResponse,
} from '../../dist/utils/prerender-response.js';

async function splitEveryByte(response: Response): Promise<Response> {
	const bytes = new Uint8Array(await response.arrayBuffer());
	return new Response(
		new ReadableStream({
			start(controller) {
				for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
				controller.close();
			},
		}),
		{ headers: response.headers },
	);
}

function createFrame(metadata: unknown, body: Uint8Array = new Uint8Array()): Response {
	const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
	const bytes = new Uint8Array(4 + metadataBytes.byteLength + body.byteLength);
	new DataView(bytes.buffer).setUint32(0, metadataBytes.byteLength);
	bytes.set(metadataBytes, 4);
	bytes.set(body, 4 + metadataBytes.byteLength);
	return new Response(bytes, {
		headers: { 'Content-Type': PRERENDER_RESPONSE_CONTENT_TYPE },
	});
}

describe('framed prerender response', () => {
	it('preserves response metadata and arbitrary bytes across chunk boundaries', async () => {
		const framed = createFramedPrerenderResponse(
			new Response(Uint8Array.from([0, 255, 128, 65]), {
				status: 404,
				statusText: 'Expected Not Found',
				headers: { 'x-response-header': 'preserved' },
			}),
			{
				contentEntryKeys: ['src/content/docs/one.mdx'],
				staticImages: [],
			},
		);

		const result = await readFramedPrerenderResponse(await splitEveryByte(framed));

		assert.equal(result.response.status, 404);
		assert.equal(result.response.statusText, 'Expected Not Found');
		assert.equal(result.response.headers.get('x-response-header'), 'preserved');
		assert.deepEqual(
			new Uint8Array(await result.response.arrayBuffer()),
			Uint8Array.from([0, 255, 128, 65]),
		);
		assert.deepEqual(result.metadata, {
			contentEntryKeys: ['src/content/docs/one.mdx'],
			staticImages: [],
		});
	});

	it('preserves a null body and unavailable metadata', async () => {
		const framed = createFramedPrerenderResponse(new Response(null), undefined);
		const result = await readFramedPrerenderResponse(framed);

		assert.equal(result.response.body, null);
		assert.equal(result.metadata, undefined);
	});

	it('preserves body bytes coalesced with the metadata frame', async () => {
		const body = Uint8Array.from([1, 2, 3, 4]);
		const framed = createFramedPrerenderResponse(new Response(body), {
			contentEntryKeys: [],
			staticImages: [],
		});
		const coalesced = new Response(await framed.arrayBuffer(), { headers: framed.headers });

		const result = await readFramedPrerenderResponse(coalesced);

		assert.deepEqual(new Uint8Array(await result.response.arrayBuffer()), body);
	});

	it('rejects truncated frames', async () => {
		await assert.rejects(
			readFramedPrerenderResponse(
				new Response(Uint8Array.of(0, 0, 0, 4, 123), {
					headers: { 'Content-Type': PRERENDER_RESPONSE_CONTENT_TYPE },
				}),
			),
			/The framed prerender response ended unexpectedly/,
		);
	});

	it('rejects oversized metadata before allocating it', async () => {
		await assert.rejects(
			readFramedPrerenderResponse(
				new Response(Uint8Array.of(255, 255, 255, 255), {
					headers: { 'Content-Type': PRERENDER_RESPONSE_CONTENT_TYPE },
				}),
			),
			/The framed prerender response metadata length is invalid/,
		);
	});

	it('rejects invalid response metadata', async () => {
		await assert.rejects(
			readFramedPrerenderResponse(createFrame({})),
			/The framed prerender response metadata is invalid/,
		);
	});
});
