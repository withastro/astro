// const { hydration, isPage, props, propsWithoutTransitionAttributes } = extractDirectives(
// 	_props,
// 	clientDirectives
// );

import { expect } from 'chai';
import { extractDirectives } from '../../../dist/runtime/server/hydration.js';
const CLIENT_DIRECTIVES = new Map(
	Object.entries({
		load: 'fake-directive-code',
		idle: 'fake-directive-code',
		visible: 'fake-directive-code',
		media: 'fake-directive-code',
		customDirective: 'fake-directive-code',
	})
);

describe('Client directives `client:params` special directive', () => {
	describe('Skips the transform', () => {
		it('when it is null', async () => {
			const componentProps = { 'client:params': null, prop1: 'val1', prop2: 'val2' };
			const { hydration } = extractDirectives(componentProps, CLIENT_DIRECTIVES);
			expect(hydration.directive).to.equal('');
			expect(hydration.value).to.equal('');
		});
		it('when it is undefined', async () => {
			const componentProps = { 'client:params': undefined, prop1: 'val1', prop2: 'val2' };
			const { hydration } = extractDirectives(componentProps, CLIENT_DIRECTIVES);
			expect(hydration.directive).to.equal('');
			expect(hydration.value).to.equal('');
		});
	});

	describe('Errors', () => {
		it('when it is not an object', async () => {
			const componentProps = { 'client:params': 'not an object', prop1: 'val1', prop2: 'val2' };
			expect(() => extractDirectives(componentProps, CLIENT_DIRECTIVES)).to.throw(
				/Error: invalid `params` directive value/
			);
		});

		it('when it has an invalid key', async () => {
			const paramsDirectiveValue = { directive: 'load', value: true, invalidKey: 'val' };
			const componentProps = {
				'client:params': paramsDirectiveValue,
				prop1: 'val1',
				prop2: 'val2',
			};
			expect(() => extractDirectives(componentProps, CLIENT_DIRECTIVES)).to.throw(
				`Expected an object of the form \`{ directive: string, value?: any }\`, but got ${JSON.stringify(
					paramsDirectiveValue
				)}.`
			);
		});

		it('when `directive` key is not a string', async () => {
			const paramsDirectiveValue = { directive: 12345, value: true };
			const componentProps = {
				'client:params': paramsDirectiveValue,
				prop1: 'val1',
				prop2: 'val2',
			};
			expect(() => extractDirectives(componentProps, CLIENT_DIRECTIVES)).to.throw(
				/Error: expected `directive` to be a string, but got/
			);
		});
	});

	describe('Transforms to', async () => {
		it('`load` directive', () => {
			const paramsDirectiveValue = { directive: 'load', value: true };
			const componentProps = {
				'client:params': paramsDirectiveValue,
				prop1: 'val1',
				prop2: 'val2',
			};
			const { hydration } = extractDirectives(componentProps, CLIENT_DIRECTIVES);
			expect(hydration.directive).to.equal('load');
			expect(hydration.value).to.equal(true);
		});

		it('`idle` directive', () => {
			const paramsDirectiveValue = { directive: 'idle', value: true };
			const componentProps = {
				'client:params': paramsDirectiveValue,
				prop1: 'val1',
				prop2: 'val2',
			};
			const { hydration } = extractDirectives(componentProps, CLIENT_DIRECTIVES);
			expect(hydration.directive).to.equal('idle');
			expect(hydration.value).to.equal(true);
		});
		it('`visible` directive', () => {
			const paramsDirectiveValue = { directive: 'visible', value: true };
			const componentProps = {
				'client:params': paramsDirectiveValue,
				prop1: 'val1',
				prop2: 'val2',
			};
			const { hydration } = extractDirectives(componentProps, CLIENT_DIRECTIVES);
			expect(hydration.directive).to.equal('visible');
			expect(hydration.value).to.equal(true);
		});

		it('`media` directive', () => {
			const paramsDirectiveValue = { directive: 'media', value: '(max-width: 50em)' };
			const componentProps = {
				'client:params': paramsDirectiveValue,
				prop1: 'val1',
				prop2: 'val2',
			};
			const { hydration } = extractDirectives(componentProps, CLIENT_DIRECTIVES);
			expect(hydration.directive).to.equal('media');
			expect(hydration.value).to.equal('(max-width: 50em)');
		});

		it('`customDirective` directive', () => {
			const paramsDirectiveValue = { directive: 'customDirective', value: 'customDirectiveValue' };
			const componentProps = {
				'client:params': paramsDirectiveValue,
				prop1: 'val1',
				prop2: 'val2',
			};
			const { hydration } = extractDirectives(componentProps, CLIENT_DIRECTIVES);
			expect(hydration.directive).to.equal('customDirective');
			expect(hydration.value).to.equal('customDirectiveValue');
		});
	});
});
