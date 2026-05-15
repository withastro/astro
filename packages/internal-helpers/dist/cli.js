const NPM_PACKAGE_NAME_REGEX = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
function validatePackageName(packageName) {
	return NPM_PACKAGE_NAME_REGEX.test(packageName);
}
function assertValidPackageName(packageName) {
	if (!validatePackageName(packageName)) {
		throw new Error(
			`Invalid package name "${packageName}". Package names must follow npm naming rules: lowercase letters, numbers, hyphens, underscores, and dots. Scoped packages like @org/package are also supported.`,
		);
	}
}
export { NPM_PACKAGE_NAME_REGEX, assertValidPackageName, validatePackageName };
