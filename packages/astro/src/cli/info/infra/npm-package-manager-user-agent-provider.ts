import type { PackageManagerUserAgentProvider } from '../definitions.js';

export function createNpmPackageManagerUserAgentProvider(): PackageManagerUserAgentProvider {
	return {
		getUserAgent() {
            // https://docs.npmjs.com/cli/v8/using-npm/config#user-agent
			return process.env.npm_config_user_agent ?? null;
		},
	};
}
