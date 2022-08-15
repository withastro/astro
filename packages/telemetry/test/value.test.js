import { expect } from 'chai';
import { isEmptyPrimitive } from '../dist/value.js';

describe('isEmptyPrimitive', () => {
	describe('returns true for', () => {
		describe('empty value', () => {
			it('undefined', () => {
				const result = isEmptyPrimitive(undefined);
				expect(result).to.equal(true);
			});
			it('null', () => {
				const result = isEmptyPrimitive(null);
				expect(result).to.equal(true);
			});
			it('empty string', () => {
				const result = isEmptyPrimitive('');
				expect(result).to.equal(true);
			});
		});
	});

	describe('returns false for', () => {
		describe('non-empty, falsey, value', () => {
			it('boolean', () => {
				const result = isEmptyPrimitive(false);
				expect(result).to.equal(false);
			});
			it('number', () => {
				const result = isEmptyPrimitive(0);
				expect(result).to.equal(false);
			});
		});

		describe('non-empty, value', () => {
			it('string', () => {
				const result = isEmptyPrimitive('string');
				expect(result).to.equal(false);
			});
			it('boolean', () => {
				const result = isEmptyPrimitive(true);
				expect(result).to.equal(false);
			});
			it('number', () => {
				const result = isEmptyPrimitive(1);
				expect(result).to.equal(false);
			});
		});

		describe('objects', () => {
			it('object', () => {
				const result = isEmptyPrimitive({});
				expect(result).to.equal(false);
			});
			it('array', () => {
				const result = isEmptyPrimitive([]);
				expect(result).to.equal(false);
			});
		});
	});
});
