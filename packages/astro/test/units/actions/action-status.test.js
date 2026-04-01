// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { serializeActionResult } from '../../../dist/actions/runtime/server.js';
import { createTestApp, createPage } from '../mocks.js';

// Build locals with an _actionPayload to simulate an action having run.
// Mirrors the shape of ActionsLocals from src/actions/runtime/types.ts.
// We use serializeActionResult from the server runtime to produce
// properly-formatted payloads that deserializeActionResult can parse.

// Minimal ActionError-compatible object — ActionError class is not exported from
// the dist client bundle so we construct the shape it expects directly.
function makeActionError(code, message = 'test error') {
	const codeToStatus = {
		BAD_REQUEST: 400,
		UNPROCESSABLE_CONTENT: 422,
		NOT_FOUND: 404,
		UNAUTHORIZED: 401,
		FORBIDDEN: 403,
		INTERNAL_SERVER_ERROR: 500,
	};
	return { type: 'AstroActionError', code, message, status: codeToStatus[code] ?? 500 };
}

function makeLocalsWithError(code) {
	const actionResult = serializeActionResult({ error: makeActionError(code), data: undefined });
	return { _actionPayload: { actionName: 'testAction', actionResult } };
}

function makeLocalsWithData(data = null) {
	const actionResult = serializeActionResult({ data, error: undefined });
	return { _actionPayload: { actionName: 'testAction', actionResult } };
}

describe('action result status computation', () => {
	it('uses default status when no action payload is present', async () => {
		let capturedStatus;
		const page = createComponent((result, props, slots) => {
			const Astro = result.createAstro(props, slots);
			capturedStatus = Astro.response.status;
			return render`<p>ok</p>`;
		});

		const app = createTestApp([createPage(page, { route: '/test', prerender: false })]);
		await app.render(new Request('http://example.com/test'));

		assert.equal(capturedStatus, 200);
	});

	it('uses the error status code when an action error result is in locals', async () => {
		let capturedStatus;
		const page = createComponent((result, props, slots) => {
			const Astro = result.createAstro(props, slots);
			capturedStatus = Astro.response.status;
			return render`<p>ok</p>`;
		});

		const app = createTestApp([createPage(page, { route: '/test', prerender: false })]);
		const request = new Request('http://example.com/test');

		// Simulate middleware having set the action payload on locals
		await app.render(request, { locals: makeLocalsWithError('UNPROCESSABLE_CONTENT') });

		assert.equal(capturedStatus, 422);
	});

	it('uses default status for a successful action data result', async () => {
		let capturedStatus;
		const page = createComponent((result, props, slots) => {
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
