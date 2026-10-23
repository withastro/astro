import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HostRoutes } from '../dist/index.js';

describe('Weight', () => {
	it('Puts higher weighted definitions on top', () => {
		const _redirects = new HostRoutes();
		_redirects.add({
			dynamic: false,
			input: '/a',
			target: '/b',
			weight: 0,
			status: 200,
		});
		_redirects.add({
			dynamic: false,
			input: '/c',
			target: '/d',
			weight: 0,
			status: 200,
		});
		_redirects.add({
			dynamic: false,
			input: '/e',
			target: '/f',
			weight: 1,
			status: 200,
		});
		const firstDefn = _redirects.definitions[0];
		assert.equal(firstDefn.weight, 1);
		assert.equal(firstDefn.input, '/e');
	});

	it('Keeps definitions with a weight of 0 below higher weighted definitions', () => {
		const _redirects = new HostRoutes();
		_redirects.add({ dynamic: false, input: '/a', target: '/b', weight: 2, status: 200 });
		_redirects.add({ dynamic: true, input: '/*', target: '/404', weight: 0, status: 404 });
		_redirects.add({ dynamic: false, input: '/c', target: '/d', weight: 1, status: 200 });
		assert.deepEqual(
			_redirects.definitions.map((d) => d.input),
			['/a', '/c', '/*'],
		);
	});
});
