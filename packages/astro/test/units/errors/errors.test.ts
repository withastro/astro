import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	AggregateError,
	AstroError,
	AstroUserError,
	CompilerError,
	CSSError,
	InternalError,
	isAstroError,
	MarkdownError,
} from '../../../dist/core/errors/errors.js';

describe('Error type checking', () => {
	describe('AstroError.is()', () => {
		it('returns true for AstroError instances', () => {
			const error = new AstroError({ name: 'TestError', message: 'Test message' });
			assert.equal(AstroError.is(error), true);
		});

		it('returns false for non-AstroError instances', () => {
			const error = new Error('Regular error');
			assert.equal(AstroError.is(error), false);
		});

		it('returns false for null', () => {
			assert.equal(AstroError.is(null), false);
		});

		it('returns false for undefined', () => {
			assert.equal(AstroError.is(undefined), false);
		});

		it('returns false for primitive values', () => {
			assert.equal(AstroError.is('string'), false);
			assert.equal(AstroError.is(42), false);
			assert.equal(AstroError.is(true), false);
		});
	});

	describe('CompilerError.is()', () => {
		it('returns true for CompilerError instances', () => {
			const error = new CompilerError({ name: 'TestCompilerError', message: 'Test message' });
			assert.equal(CompilerError.is(error), true);
		});

		it('returns false for non-CompilerError instances', () => {
			const error = new AstroError({ name: 'TestError', message: 'Test message' });
			assert.equal(CompilerError.is(error), false);
		});

		it('returns false for null', () => {
			assert.equal(CompilerError.is(null), false);
		});

		it('returns false for undefined', () => {
			assert.equal(CompilerError.is(undefined), false);
		});
	});

	describe('CSSError.is()', () => {
		it('returns true for CSSError instances', () => {
			const error = new CSSError({ name: 'TestCSSError', message: 'Test message' });
			assert.equal(CSSError.is(error), true);
		});

		it('returns false for non-CSSError instances', () => {
			const error = new AstroError({ name: 'TestError', message: 'Test message' });
			assert.equal(CSSError.is(error), false);
		});

		it('returns false for null', () => {
			assert.equal(CSSError.is(null), false);
		});

		it('returns false for undefined', () => {
			assert.equal(CSSError.is(undefined), false);
		});
	});

	describe('MarkdownError.is()', () => {
		it('returns true for MarkdownError instances', () => {
			const error = new MarkdownError({ name: 'TestMarkdownError', message: 'Test message' });
			assert.equal(MarkdownError.is(error), true);
		});

		it('returns false for non-MarkdownError instances', () => {
			const error = new AstroError({ name: 'TestError', message: 'Test message' });
			assert.equal(MarkdownError.is(error), false);
		});

		it('returns false for null', () => {
			assert.equal(MarkdownError.is(null), false);
		});

		it('returns false for undefined', () => {
			assert.equal(MarkdownError.is(undefined), false);
		});
	});

	describe('InternalError.is()', () => {
		it('returns true for InternalError instances', () => {
			const error = new InternalError({ name: 'TestInternalError', message: 'Test message' });
			assert.equal(InternalError.is(error), true);
		});

		it('returns false for non-InternalError instances', () => {
			const error = new AstroError({ name: 'TestError', message: 'Test message' });
			assert.equal(InternalError.is(error), false);
		});

		it('returns false for null', () => {
			assert.equal(InternalError.is(null), false);
		});

		it('returns false for undefined', () => {
			assert.equal(InternalError.is(undefined), false);
		});
	});

	describe('AggregateError.is()', () => {
		it('returns true for AggregateError instances', () => {
			const error1 = new AstroError({ name: 'Error1', message: 'Message 1' });
			const error2 = new AstroError({ name: 'Error2', message: 'Message 2' });
			const aggregateError = new AggregateError({
				name: 'TestAggregateError',
				message: 'Multiple errors',
				errors: [error1, error2],
			});
			assert.equal(AggregateError.is(aggregateError), true);
		});

		it('returns false for non-AggregateError instances', () => {
			const error = new AstroError({ name: 'TestError', message: 'Test message' });
			assert.equal(AggregateError.is(error), false);
		});

		it('returns false for null', () => {
			assert.equal(AggregateError.is(null), false);
		});

		it('returns false for undefined', () => {
			assert.equal(AggregateError.is(undefined), false);
		});
	});

	describe('AstroUserError.is()', () => {
		it('returns true for AstroUserError instances', () => {
			const error = new AstroUserError('User error message', 'Helpful hint');
			assert.equal(AstroUserError.is(error), true);
		});

		it('returns false for non-AstroUserError instances', () => {
			const error = new AstroError({ name: 'TestError', message: 'Test message' });
			assert.equal(AstroUserError.is(error), false);
		});

		it('returns false for null', () => {
			assert.equal(AstroUserError.is(null), false);
		});

		it('returns false for undefined', () => {
			assert.equal(AstroUserError.is(undefined), false);
		});
	});

	describe('isAstroError()', () => {
		it('returns true for AstroError instances', () => {
			const error = new AstroError({ name: 'TestError', message: 'Test message' });
			assert.equal(isAstroError(error), true);
		});

		it('returns true for AstroError subclasses', () => {
			const compilerError = new CompilerError({ name: 'TestError', message: 'Test message' });
			const cssError = new CSSError({ name: 'TestError', message: 'Test message' });
			assert.equal(isAstroError(compilerError), true);
			assert.equal(isAstroError(cssError), true);
		});

		it('returns false for non-AstroError instances', () => {
			const error = new Error('Regular error');
			assert.equal(isAstroError(error), false);
		});

		it('returns false for null', () => {
			assert.equal(isAstroError(null), false);
		});

		it('returns false for undefined', () => {
			assert.equal(isAstroError(undefined), false);
		});
	});

	describe('Error inheritance', () => {
		it('CompilerError extends AstroError', () => {
			const error = new CompilerError({ name: 'TestError', message: 'Test message' });
			assert.equal(error instanceof AstroError, true);
			assert.equal(error instanceof CompilerError, true);
		});

		it('CSSError extends AstroError', () => {
			const error = new CSSError({ name: 'TestError', message: 'Test message' });
			assert.equal(error instanceof AstroError, true);
			assert.equal(error instanceof CSSError, true);
		});

		it('MarkdownError extends AstroError', () => {
			const error = new MarkdownError({ name: 'TestError', message: 'Test message' });
			assert.equal(error instanceof AstroError, true);
			assert.equal(error instanceof MarkdownError, true);
		});

		it('InternalError extends AstroError', () => {
			const error = new InternalError({ name: 'TestError', message: 'Test message' });
			assert.equal(error instanceof AstroError, true);
			assert.equal(error instanceof InternalError, true);
		});

		it('AggregateError extends AstroError', () => {
			const error = new AggregateError({
				name: 'TestError',
				message: 'Test message',
				errors: [],
			});
			assert.equal(error instanceof AstroError, true);
			assert.equal(error instanceof AggregateError, true);
		});
	});
});
