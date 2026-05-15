class ProcessPackageManagerUserAgentProvider {
	// https://docs.npmjs.com/cli/v8/using-npm/config#user-agent
	userAgent = process.env.npm_config_user_agent ?? null;
}
export { ProcessPackageManagerUserAgentProvider };
