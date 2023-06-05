import { Redirects } from '../dist/index.js';
import { expect } from 'chai';

describe('Weight', () => {
	it('Puts higher weighted definitions on top', () => {
		const _redirects = new Redirects();
		_redirects.add({
			dynamic: false,
			input: '/a',
			target: '/b',
			weight: 0,
			status: 200
		});
		_redirects.add({
			dynamic: false,
			input: '/c',
			target: '/d',
			weight: 0,
			status: 200
		});
		_redirects.add({
			dynamic: false,
			input: '/e',
			target: '/f',
			weight: 1,
			status: 200
		});
		const firstDefn = _redirects.definitions[0];
		expect(firstDefn.weight).to.equal(1);
		expect(firstDefn.input).to.equal('/e');
	});
});
