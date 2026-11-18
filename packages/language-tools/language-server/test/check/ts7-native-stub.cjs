// Mimics the TypeScript 7 native compiler, which only exposes `version` and
// `versionMajorMinor` and none of the programmatic Language Service API
// (`ts.sys`, `ts.findConfigFile`, …) that `astro check` relies on.
// Used to exercise the guard in `AstroCheck` without installing TypeScript 7.
module.exports = {
	version: '7.0.2',
	versionMajorMinor: '7.0',
};
