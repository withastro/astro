import { expect } from 'chai';
import convert from '../vnode-children.js';

describe('experimental react children', () => {
	it('has undefined as children for direct children', () => {
		const [imgVNode] = convert('<img src="abc"></img>');
		expect(imgVNode.props).to.deep.include({ children: undefined });
	});

	it('has undefined as children for nested children', () => {
		const [divVNode] = convert('<div><img src="xyz"></img></div>');
		const [imgVNode] = divVNode.props.children;
		expect(imgVNode.props).to.deep.include({ children: undefined });
	});
});
