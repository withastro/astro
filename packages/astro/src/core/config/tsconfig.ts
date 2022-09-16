import * as tsr from 'tsconfig-resolver';

export function loadTSConfig(cwd: string | undefined): tsr.TsConfigResult | undefined {
	for (const searchName of ['tsconfig.json', 'jsconfig.json']) {
		const config = tsr.tsconfigResolverSync({ cwd, searchName });
		if (config.exists) {
			return config;
		}
	}
	return undefined;
}
