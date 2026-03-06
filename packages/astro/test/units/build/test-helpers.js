// @ts-check

/**
 * @param {object} options
 * @param {'static' | 'server'} options.buildOutput
 * @param {boolean} [options.preserveBuildClientDir]
 * @param {URL} [options.outDir]
 * @param {URL} [options.clientDir]
 * @param {'directory' | 'file' | 'preserve'} [options.buildFormat]
 */
export function createSettings({
	buildOutput,
	preserveBuildClientDir = false,
	outDir = new URL('file:///project/dist/'),
	clientDir = new URL('file:///project/dist/client/'),
	buildFormat = 'directory',
}) {
	return {
		buildOutput,
		adapter: preserveBuildClientDir
			? { adapterFeatures: { preserveBuildClientDir: true } }
			: undefined,
		config: {
			outDir,
			build: {
				client: clientDir,
				format: buildFormat,
			},
		},
	};
}
