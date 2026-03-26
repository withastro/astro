// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	ActionError,
	ActionInputError,
	codeToStatusMap,
	isActionError,
	isInputError,
} from '../../../dist/actions/runtime/client.js';

describe('ActionError', () => {
	it('sets code, status, and message from constructor', () => {
		const error = new ActionError({ code: 'NOT_FOUND', message: 'Page not found' });
		assert.equal(error.code, 'NOT_FOUND');
		assert.equal(error.status, 404);
		assert.equal(error.message, 'Page not found');
		assert.equal(error.type, 'AstroActionError');
	});

	it('defaults message to empty string when omitted', () => {
		const error = new ActionError({ code: 'INTERNAL_SERVER_ERROR' });
		assert.equal(error.code, 'INTERNAL_SERVER_ERROR');
		assert.equal(error.status, 500);
		assert.equal(error.message, '');
	});

	it('preserves stack when provided', () => {
		const error = new ActionError({
			code: 'BAD_REQUEST',
			message: 'bad',
			stack: 'custom stack',
		});
		assert.equal(error.stack, 'custom stack');
	});

	it('is an instance of Error', () => {
		const error = new ActionError({ code: 'BAD_REQUEST' });
		assert.ok(error instanceof Error);
	});
});

describe('ActionError.codeToStatus', () => {
	it('maps all known codes to correct HTTP status', () => {
		for (const [code, status] of Object.entries(codeToStatusMap)) {
			assert.equal(ActionError.codeToStatus(code), status, `Expected ${code} to map to ${status}`);
		}
	});
});

describe('ActionError.statusToCode', () => {
	it('maps known statuses back to codes', () => {
		assert.equal(ActionError.statusToCode(400), 'BAD_REQUEST');
		assert.equal(ActionError.statusToCode(401), 'UNAUTHORIZED');
		assert.equal(ActionError.statusToCode(404), 'NOT_FOUND');
		assert.equal(ActionError.statusToCode(500), 'INTERNAL_SERVER_ERROR');
	});

	it('falls back to INTERNAL_SERVER_ERROR for unknown statuses', () => {
		assert.equal(ActionError.statusToCode(999), 'INTERNAL_SERVER_ERROR');
	});
});

describe('ActionError.fromJson', () => {
	it('reconstructs an ActionError from serialized JSON', () => {
		const error = ActionError.fromJson({
			type: 'AstroActionError',
			code: 'UNAUTHORIZED',
			message: 'Not logged in',
		});
		assert.ok(error instanceof ActionError);
		assert.equal(error.code, 'UNAUTHORIZED');
		assert.equal(error.message, 'Not logged in');
	});

	it('reconstructs an ActionInputError from serialized JSON', () => {
		const error = ActionError.fromJson({
			type: 'AstroActionInputError',
			issues: [{ code: 'invalid_type', message: 'Required', path: ['name'] }],
		});
		assert.ok(error instanceof ActionInputError);
		assert.ok(Array.isArray(error.issues));
	});

	it('returns a generic ActionError for unrecognized shapes', () => {
		const error = ActionError.fromJson({ something: 'random' });
		assert.ok(error instanceof ActionError);
		assert.equal(error.code, 'INTERNAL_SERVER_ERROR');
	});
});

describe('ActionInputError', () => {
	it('sets code to BAD_REQUEST and populates fields from issues', () => {
		const issues = [
			{ code: 'invalid_type', message: 'Expected string', path: ['name'] },
			{ code: 'too_small', message: 'Too short', path: ['name'] },
			{ code: 'invalid_type', message: 'Required', path: ['email'] },
		];
		const error = new ActionInputError(issues);
		assert.equal(error.code, 'BAD_REQUEST');
		assert.equal(error.status, 400);
		assert.equal(error.type, 'AstroActionInputError');
		assert.deepEqual(error.fields.name, ['Expected string', 'Too short']);
		assert.deepEqual(error.fields.email, ['Required']);
	});

	it('is an instance of ActionError', () => {
		const error = new ActionInputError([]);
		assert.ok(error instanceof ActionError);
		assert.ok(error instanceof Error);
	});

	it('handles issues without paths', () => {
		const issues = [{ code: 'custom', message: 'Something wrong', path: [] }];
		const error = new ActionInputError(issues);
		assert.deepEqual(error.fields, {});
	});
});

describe('isActionError', () => {
	it('returns true for ActionError instances', () => {
		assert.equal(isActionError(new ActionError({ code: 'BAD_REQUEST' })), true);
	});

	it('returns false for ActionInputError instances (different type field)', () => {
		assert.equal(isActionError(new ActionInputError([])), false);
	});

	it('returns true for plain objects with type AstroActionError', () => {
		assert.equal(isActionError({ type: 'AstroActionError', code: 'NOT_FOUND' }), true);
	});

	it('returns false for regular errors', () => {
		assert.equal(isActionError(new Error('nope')), false);
	});

	it('returns false for null/undefined', () => {
		assert.equal(isActionError(null), false);
		assert.equal(isActionError(undefined), false);
	});

	it('returns false for strings', () => {
		assert.equal(isActionError('error'), false);
	});
});

describe('isInputError', () => {
	it('returns true for ActionInputError instances', () => {
		const issues = [{ code: 'invalid_type', message: 'bad', path: ['x'] }];
		assert.equal(isInputError(new ActionInputError(issues)), true);
	});

	it('returns true for plain objects matching the shape', () => {
		assert.equal(
			isInputError({ type: 'AstroActionInputError', issues: [{ path: ['x'], message: 'bad' }] }),
			true,
		);
	});

	it('returns false for ActionError (non-input)', () => {
		assert.equal(isInputError(new ActionError({ code: 'BAD_REQUEST' })), false);
	});

	it('returns false for objects without issues array', () => {
		assert.equal(isInputError({ type: 'AstroActionInputError' }), false);
	});
});
