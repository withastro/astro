declare namespace Config {
	type DBUserConfig = import('./dist/config.js').DBUserConfig;
	export interface Database extends DBUserConfig {}
}
