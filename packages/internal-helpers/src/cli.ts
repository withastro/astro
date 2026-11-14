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
 * Validates a package name with an optional tag or version and throws an error if invalid.
 *
 * @param packageName - The package name and optional tag or version to validate
 * @throws {Error} If the package name, tag, or version is invalid
 *
 * @example
 * ```ts
 * assertValidPackageName('react'); // OK
 * assertValidPackageName('react@latest'); // OK
 * assertValidPackageName('react; whoami'); // throws Error
 * ```
 */
export function assertValidPackageName(packageName: string): asserts packageName is string {
	const tagSeparator = packageName.lastIndexOf('@');
	const hasTag = tagSeparator > 0;
	const untaggedPackageName = hasTag ? packageName.slice(0, tagSeparator) : packageName;
	const tag = hasTag ? packageName.slice(tagSeparator + 1) : undefined;

	if (
		!validatePackageName(untaggedPackageName) ||
		(tag !== undefined && !validatePackageName(tag))
	) {
		throw new Error(
			`Invalid package name "${packageName}". Package names must follow npm naming rules: ` +
				`lowercase letters, numbers, hyphens, underscores, and dots. ` +
				`Scoped packages like @org/package are also supported.`,
		);
	}
}
