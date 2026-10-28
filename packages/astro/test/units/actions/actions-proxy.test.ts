import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { APIContext } from '../../../dist/types/public/context.js';
import type { SafeResult } from '../../../dist/actions/runtime/types.js';
import { createActionsProxy, ActionError } from '../../../dist/actions/runtime/client.js';

// #region Helpers

interface SetupOptions {
	result?: SafeResult<any, any>;
}

interface CallRecord {
	param: unknown;
	path: string;
	context: APIContext | undefined;
}

function setup(opts: SetupOptions = {}) {
	const result: SafeResult<any, any> = opts.result ?? { data: 'ok', error: undefined };
	const calls: CallRecord[] = [];

	const handleAction = async (param: unknown, path: string, context: APIContext | undefined) => {
		calls.push({ param, path, context });
		return result;
	};

	const proxy = createActionsProxy({ handleAction });
	return { proxy, calls };
}

// #endregion

// #region Tests

describe('createActionsProxy', () => {
	describe('path building', () => {
		it('builds a top-level path from property access', async () => {
			const { proxy, calls } = setup();
			await proxy.subscribe({ channel: 'test' });
			assert.equal(calls.length, 1);
			assert.equal(calls[0].path, 'subscribe');
			assert.deepEqual(calls[0].param, { channel: 'test' });
		});

		it('builds a nested path with dot separators', async () => {
			const { proxy, calls } = setup();
			await proxy.user.admins.auth({ token: '123' });
			assert.equal(calls[0].path, 'user.admins.auth');
		});

		it('encodes dots in property names as %2E', async () => {
			const { proxy, calls } = setup();
			await proxy['my.action']('param');
			assert.equal(calls[0].path, 'my%2Eaction');
		});

		it('encodes special characters in property names', async () => {
			const { proxy, calls } = setup();
			await proxy['with/slash']('param');
			assert.equal(calls[0].path, 'with%2Fslash');
		});
	});

	describe('toString / queryString', () => {
		it('toString returns the action query string', () => {
			const { proxy } = setup();
			const str = proxy.subscribe.toString();
			assert.equal(str, '?_action=subscribe');
		});

		it('queryString matches toString', () => {
			const { proxy } = setup();
			assert.equal(proxy.subscribe.queryString, proxy.subscribe.toString());
		});

		it('nested action toString includes full path', () => {
			const { proxy } = setup();
			assert.equal(proxy.user.auth.toString(), '?_action=user.auth');
		});
	});

	describe('$$FORM_ACTION', () => {
		it('returns progressive enhancement info for React', () => {
			const { proxy } = setup();
			const formAction = proxy.subscribe.$$FORM_ACTION();
			assert.equal(formAction.method, 'POST');
			assert.equal(formAction.name, '_astroAction');
			assert.ok(formAction.action.includes('_action=subscribe'));
		});
	});

	describe('orThrow', () => {
		it('returns data on success', async () => {
			const { proxy } = setup({ result: { data: 42, error: undefined } });
			const data = await proxy.subscribe.orThrow('input');
			assert.equal(data, 42);
		});

		it('throws on error', async () => {
			const error = new ActionError({ code: 'UNAUTHORIZED', message: 'nope' });
			const { proxy } = setup({ result: { data: undefined, error } });
			await assert.rejects(
				() => proxy.subscribe.orThrow('input'),
				(err) => {
					assert.ok(err instanceof ActionError);
					assert.equal(err.code, 'UNAUTHORIZED');
					return true;
				},
			);
		});
	});

	describe('passthrough', () => {
		it('returns symbol properties from the target', () => {
			const sym = Symbol('test');
			const handleAction = async () => ({ data: null, error: undefined });
			const proxy = createActionsProxy({
				actionCallback: { [sym]: 'symbolValue' },
				handleAction,
			});
			assert.equal(proxy[sym], 'symbolValue');
		});

		it('returns own properties from the target', () => {
			const handleAction = async () => ({ data: null, error: undefined });
			const proxy = createActionsProxy({
				actionCallback: { existing: 'value' },
				handleAction,
			});
			assert.equal(proxy.existing, 'value');
		});
	});
});

// #endregion
