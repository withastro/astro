import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { serializeActionResult } from '../../../dist/actions/runtime/server.js';
import { ActionError } from '../../../dist/actions/runtime/client.js';
import type { ActionErrorCode } from '../../../dist/actions/runtime/types.js';
import { createTestApp, createPage } from '../mocks.ts';

function makeLocalsWithError(code: ActionErrorCode) {
	const error = new ActionError({ code });
	const actionResult = serializeActionResult({ error, data: undefined });
	return { _actionPayload: { actionName: 'testAction', actionResult } };
}

function makeLocalsWithData(data: unknown = null) {
	const actionResult = serializeActionResult({ data, error: undefined });
	return { _actionPayload: { actionName: 'testAction', actionResult } };
}

describe('action result status computation', () => {
	it('uses default status when no action payload is present', async () => {
		let capturedStatus: number | undefined;
		const page = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			capturedStatus = Astro.response.status;
			return render`<p>ok</p>`;
		});

		const app = createTestApp([createPage(page, { route: '/test', prerender: false })]);
		await app.render(new Request('http://example.com/test'));

		assert.equal(capturedStatus, 200);
	});

	it('uses the error status code when an action error result is in locals', async () => {
		let capturedStatus: number | undefined;
		const page = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			capturedStatus = Astro.response.status;
			return render`<p>ok</p>`;
		});

		const app = createTestApp([createPage(page, { route: '/test', prerender: false })]);
		const request = new Request('http://example.com/test');

		await app.render(request, { locals: makeLocalsWithError('UNPROCESSABLE_CONTENT') });

		assert.equal(capturedStatus, 422);
	});

	it('uses default status for a successful action data result', async () => {
		let capturedStatus: number | undefined;
		const page = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			capturedStatus = Astro.response.status;
			return render`<p>ok</p>`;
		});

		const app = createTestApp([createPage(page, { route: '/test', prerender: false })]);
		const request = new Request('http://example.com/test');

		await app.render(request, { locals: makeLocalsWithData() });

		assert.equal(capturedStatus, 200);
	});
});
