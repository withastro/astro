/**
 * Validates npm package names to prevent command injection attacks in CLI tools.
 *
 * This regex follows npm naming rules and blocks shell metacharacters that could
 * be used for command injection attacks.
 *
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#name
 */
export const NPM_PACKAGE_NAME_REGEX = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/**
 * Validates a package name for use in CLI commands.
 *
 * @param packageName - The package name to validate
 * @returns true if the package name is valid, false otherwise
 *
 * @example
 * ```ts
 * validatePackageName('react'); // true
 * validatePackageName('@astrojs/tailwind'); // true
 * validatePackageName('react; whoami'); // false
 * validatePackageName('react$(whoami)'); // false
 * ```
 */
export function validatePackageName(packageName: string): boolean {
	return NPM_PACKAGE_NAME_REGEX.test(packageName);
}

/**
 * Validates a package name and throws an error if invalid.
 *
 * @param packageName - The package name to validate
 * @throws {Error} If the package name is invalid
 *
 * @example
 * ```ts
 * assertValidPackageName('react'); // OK
 * assertValidPackageName('react; whoami'); // throws Error
 * ```
 */
export function assertValidPackageName(packageName: string): asserts packageName is string {
	if (!validatePackageName(packageName)) {
		throw new Error(
			`Invalid package name "${packageName}". Package names must follow npm naming rules: ` +
				`lowercase letters, numbers, hyphens, underscores, and dots. ` +
				`Scoped packages like @org/package are also supported.`,
		);
	}
}
