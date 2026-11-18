import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPattern } from '../../../dist/core/routing/pattern.js';

describe('getPattern', () => {
	describe('root route (empty segments)', () => {
		it('should produce a pattern matching "/" with trailingSlash: "never" and base: "/"', () => {
			const pattern = getPattern([], '/', 'never');
			assert.ok(pattern.test('/'), `pattern /${pattern.source}/ should match "/"`);
			assert.ok(!pattern.test(''), `pattern /${pattern.source}/ should not match ""`);
		});

		// When trailingSlash === 'never' and base !== '/', getPattern() set initial = ''
		// Root route, pathname is already '', the regex became ^$ instead of ^\/$, causing a 404
		it('should produce a pattern matching "/" with trailingSlash: "never" and base: "/mybase"', () => {
			const pattern = getPattern([], '/mybase', 'never');
			assert.ok(pattern.test('/'), `pattern /${pattern.source}/ should match "/"`);
			assert.ok(!pattern.test(''), `pattern /${pattern.source}/ should not match ""`);
		});
	});

	describe('non-root routes with trailingSlash: "never" and base path', () => {
		it('should preserve pathname for non-root routes when base !== "/"', () => {
			// Non-root routes have pathname = '/about' (not empty), so initial = ''
			// doesn't cause problems. The regex becomes \/about$ which correctly
			// matches '/about' after base-stripping in the router.
			const pattern = getPattern(
				[[{ content: 'about', dynamic: false, spread: false }]],
				'/mybase',
				'never',
			);
			assert.ok(pattern.test('/about'), `pattern /${pattern.source}/ should match "/about"`);
			assert.ok(!pattern.test('/about/'), `pattern /${pattern.source}/ should not match "/about/"`);
		});
	});
});
