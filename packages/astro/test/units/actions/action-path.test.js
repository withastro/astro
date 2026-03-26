// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	getActionPathFromString,
	getActionQueryString,
} from '../../../dist/actions/runtime/client.js';

describe('getActionQueryString', () => {
	it('encodes action name as _action query param', () => {
		const qs = getActionQueryString('subscribe');
		assert.equal(qs, '?_action=subscribe');
	});

	it('encodes nested action paths', () => {
		const qs = getActionQueryString('user.admins.auth');
		assert.equal(qs, '?_action=user.admins.auth');
	});

	it('encodes special characters', () => {
		const qs = getActionQueryString('with/slash');
		assert.equal(qs, '?_action=with%2Fslash');
	});
});

describe('getActionPathFromString', () => {
	it('returns the correct path for a simple action', () => {
		const qs = getActionQueryString('subscribe');
		const path = getActionPathFromString({
			baseUrl: '/',
			shouldAppendTrailingSlash: false,
			path: qs,
		});
		assert.equal(path, '/_actions/subscribe');
	});

	it('includes base path', () => {
		const qs = getActionQueryString('subscribe');
		const path = getActionPathFromString({
			baseUrl: '/base',
			shouldAppendTrailingSlash: false,
			path: qs,
		});
		assert.equal(path, '/base/_actions/subscribe');
	});

	it('strips trailing slash from base before building path', () => {
		const qs = getActionQueryString('subscribe');
		const path = getActionPathFromString({
			baseUrl: '/base/',
			shouldAppendTrailingSlash: false,
			path: qs,
		});
		assert.equal(path, '/base/_actions/subscribe');
	});

	it('appends trailing slash when configured', () => {
		const qs = getActionQueryString('subscribe');
		const path = getActionPathFromString({
			baseUrl: '/',
			shouldAppendTrailingSlash: true,
			path: qs,
		});
		assert.equal(path, '/_actions/subscribe/');
	});

	it('combines base path with trailing slash', () => {
		const qs = getActionQueryString('transformFormInput');
		const path = getActionPathFromString({
			baseUrl: '/base',
			shouldAppendTrailingSlash: true,
			path: qs,
		});
		assert.equal(path, '/base/_actions/transformFormInput/');
	});

	it('handles nested action names', () => {
		const qs = getActionQueryString('user.admins.auth');
		const path = getActionPathFromString({
			baseUrl: '/',
			shouldAppendTrailingSlash: false,
			path: qs,
		});
		assert.equal(path, '/_actions/user.admins.auth');
	});
});
