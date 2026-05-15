/**
 * Validates npm package names to prevent command injection attacks in CLI tools.
 *
 * This regex follows npm naming rules and blocks shell metacharacters that could
 * be used for command injection attacks.
 *
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#name
 */
export declare const NPM_PACKAGE_NAME_REGEX: RegExp;
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
export declare function validatePackageName(packageName: string): boolean;
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
export declare function assertValidPackageName(packageName: string): asserts packageName is string;
