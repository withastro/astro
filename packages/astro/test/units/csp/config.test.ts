import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { allowedDirectivesSchema } from '../../../dist/core/csp/config.js';

describe('CSP Level 3 config validation', () => {
	it('should accept script-src-elem as a valid directive', () => {
		const result = allowedDirectivesSchema.safeParse("script-src-elem 'self'");
		assert.ok(result.success, 'script-src-elem should be a valid directive');
	});

	it('should accept script-src-attr as a valid directive', () => {
		const result = allowedDirectivesSchema.safeParse("script-src-attr 'none'");
		assert.ok(result.success, 'script-src-attr should be a valid directive');
	});

	it('should accept style-src-elem as a valid directive', () => {
		const result = allowedDirectivesSchema.safeParse("style-src-elem 'self'");
		assert.ok(result.success, 'style-src-elem should be a valid directive');
	});

	it('should accept style-src-attr as a valid directive', () => {
		const result = allowedDirectivesSchema.safeParse("style-src-attr 'unsafe-inline'");
		assert.ok(result.success, 'style-src-attr should be a valid directive');
	});

	it('should accept style-src-attr with values', () => {
		const result = allowedDirectivesSchema.safeParse("style-src-attr 'unsafe-inline' 'self'");
		assert.ok(result.success, 'style-src-attr with multiple values should be valid');
	});

	it('should reject invalid directive names', () => {
		const result = allowedDirectivesSchema.safeParse("invalid-directive 'self'");
		assert.ok(!result.success, 'invalid-directive should be rejected');
	});

	it('should reject script-src as an allowed directive (handled separately)', () => {
		const result = allowedDirectivesSchema.safeParse("script-src 'self'");
		assert.ok(!result.success, 'script-src should not be in allowed directives');
	});

	it('should reject style-src as an allowed directive (handled separately)', () => {
		const result = allowedDirectivesSchema.safeParse("style-src 'self'");
		assert.ok(!result.success, 'style-src should not be in allowed directives');
	});
});
