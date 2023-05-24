import { Redirects } from '../dist/index.js';
import { expect } from 'chai';

describe('Printing', () => {
	it('Formats long lines in a pretty way', () => {
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
			input: '/some-pretty-long-input-line',
			target: '/b',
			weight: 0,
			status: 200
		});
		let out = _redirects.print();
		
		let [lineOne, lineTwo] = out.split('\n');

		expect(lineOne.indexOf('/b')).to.equal(lineTwo.indexOf('/b'), 'destinations lined up');
		expect(lineOne.indexOf('200')).to.equal(lineTwo.indexOf('200'), 'statuses lined up');
	});

	it('Properly prints dynamic routes', () => {
		const _redirects = new Redirects();
		_redirects.add({
			dynamic: true,
			input: '/pets/:cat',
			target: '/pets/:cat/index.html',
			status: 200,
			weight: 1
		});
		let out = _redirects.print();
		let parts = out.split(/\s+/);
		expect(parts).to.deep.equal([
			'/pets/:cat', '/pets/:cat/index.html', '200',
		])
	});
});
