declare namespace Config {
	type DBUserConfig = import('./dist/core/types.js').DBUserConfig;
	export interface Database extends DBUserConfig {}
}
