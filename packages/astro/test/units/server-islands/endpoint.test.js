import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getRequestData } from '../../../dist/core/server-islands/endpoint.js';

// #region Helpers

/**
 * Construct a minimal Request for testing getRequestData.
 */
function makeGetRequest(params = {}) {
	const url = new URL('http://localhost/_server-islands/Island');
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}
	return new Request(url.toString(), { method: 'GET' });
}

function makePostRequest(body) {
	return new Request('http://localhost/_server-islands/Island', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function makeMethodRequest(method) {
	return new Request('http://localhost/_server-islands/Island', { method });
}

// #endregion

describe('getRequestData', () => {
	// #region GET requests
	describe('GET requests', () => {
		it('returns RenderOptions when all required params are present', async () => {
			const req = makeGetRequest({ s: 'slots', e: 'export', p: 'props' });
			const result = await getRequestData(req);
			assert.ok(!(result instanceof Response), 'should not return a Response');
			assert.equal(result.encryptedSlots, 'slots');
			assert.equal(result.encryptedComponentExport, 'export');
			assert.equal(result.encryptedProps, 'props');
		});

		it('returns 400 when `s` is missing', async () => {
			const req = makeGetRequest({ e: 'export', p: 'props' });
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('returns 400 when `e` is missing', async () => {
			const req = makeGetRequest({ s: 'slots', p: 'props' });
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('returns 400 when `p` is missing', async () => {
			const req = makeGetRequest({ s: 'slots', e: 'export' });
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('returns 400 when all params are missing', async () => {
			const req = makeGetRequest();
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('accepts empty-string param values (empty props / slots are valid)', async () => {
			const req = makeGetRequest({ s: '', e: 'export', p: '' });
			const result = await getRequestData(req);
			assert.ok(!(result instanceof Response), 'should not return a Response');
			assert.equal(result.encryptedSlots, '');
			assert.equal(result.encryptedProps, '');
		});
	});
	// #endregion

	// #region POST requests
	describe('POST requests', () => {
		it('returns RenderOptions for a well-formed encrypted payload', async () => {
			const req = makePostRequest({
				encryptedComponentExport: 'encExport',
				encryptedProps: 'encProps',
				encryptedSlots: 'encSlots',
			});
			const result = await getRequestData(req);
			assert.ok(!(result instanceof Response), 'should not return a Response');
			assert.equal(result.encryptedComponentExport, 'encExport');
			assert.equal(result.encryptedProps, 'encProps');
			assert.equal(result.encryptedSlots, 'encSlots');
		});

		it('returns 400 when POST body contains plaintext `slots` object', async () => {
			const req = makePostRequest({
				encryptedComponentExport: 'encExport',
				encryptedProps: '',
				slots: { default: '<p>Hello</p>' },
			});
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
			assert.ok(
				result.statusText.toLowerCase().includes('plaintext slots'),
				`Expected 'plaintext slots' in statusText, got: ${result.statusText}`,
			);
		});

		it('returns 400 when POST body contains plaintext `componentExport` string', async () => {
			const req = makePostRequest({
				componentExport: 'default',
				encryptedProps: '',
				encryptedSlots: '',
			});
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
			assert.ok(
				result.statusText.toLowerCase().includes('plaintext componentexport'),
				`Expected 'plaintext componentExport' in statusText, got: ${result.statusText}`,
			);
		});

		it('returns 400 when POST body is malformed JSON', async () => {
			const req = new Request('http://localhost/_server-islands/Island', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: 'not valid json {{{',
			});
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('accepts empty strings for encryptedProps and encryptedSlots', async () => {
			const req = makePostRequest({
				encryptedComponentExport: 'encExport',
				encryptedProps: '',
				encryptedSlots: '',
			});
			const result = await getRequestData(req);
			assert.ok(!(result instanceof Response), 'should not return a Response');
			assert.equal(result.encryptedProps, '');
			assert.equal(result.encryptedSlots, '');
		});
	});
	// #endregion

	// #region Unsupported HTTP methods
	describe('unsupported HTTP methods', () => {
		for (const method of ['PUT', 'DELETE', 'PATCH', 'HEAD']) {
			it(`returns 405 for ${method}`, async () => {
				const req = makeMethodRequest(method);
				const result = await getRequestData(req);
				assert.ok(result instanceof Response);
				assert.equal(result.status, 405);
			});
		}
	});
	// #endregion
});
