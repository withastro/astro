import { AstroConfigSchema } from '../core/config/schemas/index.js';
const EVENT_SESSION = 'ASTRO_CLI_SESSION_STARTED';
function measureIsDefined(val) {
	if (val === void 0) {
		return void 0;
	}
	return Boolean(val);
}
function measureStringLiteral(val) {
	return val;
}
function measureIntegration(val) {
	if (!val || !val.name) {
		return void 0;
	}
	return val.name;
}
function sanitizeConfigInfo(obj, validKeys) {
	if (!obj || validKeys.length === 0) {
		return {};
	}
	return validKeys.reduce((result, key) => {
		result[key] = measureIsDefined(obj[key]);
		return result;
	}, {});
}
function createAnonymousConfigInfo(userConfig) {
	const configInfo = {
		...sanitizeConfigInfo(userConfig, Object.keys(AstroConfigSchema.shape)),
		build: sanitizeConfigInfo(
			userConfig.build,
			Object.keys(AstroConfigSchema.shape.build._def.innerType.shape),
		),
		image: sanitizeConfigInfo(
			userConfig.image,
			Object.keys(AstroConfigSchema.shape.image._def.innerType.shape),
		),
		markdown: sanitizeConfigInfo(
			userConfig.markdown,
			Object.keys(AstroConfigSchema.shape.markdown._def.innerType.shape),
		),
		experimental: sanitizeConfigInfo(
			userConfig.experimental,
			Object.keys(AstroConfigSchema.shape.experimental._def.innerType.shape),
		),
		legacy: sanitizeConfigInfo(
			userConfig.legacy,
			Object.keys(AstroConfigSchema.shape.legacy._def.innerType.shape),
		),
		vite: userConfig.vite
			? sanitizeConfigInfo(userConfig.vite, Object.keys(userConfig.vite))
			: void 0,
	};
	configInfo.build.format = measureStringLiteral(userConfig.build?.format);
	const syntaxHighlight = userConfig.markdown?.syntaxHighlight;
	const syntaxHighlightType =
		typeof syntaxHighlight === 'object' ? syntaxHighlight.type : syntaxHighlight;
	configInfo.markdown.syntaxHighlight = measureStringLiteral(syntaxHighlightType);
	configInfo.output = measureStringLiteral(userConfig.output);
	configInfo.scopedStyleStrategy = measureStringLiteral(userConfig.scopedStyleStrategy);
	configInfo.trailingSlash = measureStringLiteral(userConfig.trailingSlash);
	configInfo.adapter = measureIntegration(userConfig.adapter);
	configInfo.integrations = userConfig.integrations
		?.flat(100)
		.map(measureIntegration)
		.filter(Boolean);
	return configInfo;
}
function eventCliSession(cliCommand, userConfig, flags) {
	const cliFlags = flags ? Object.keys(flags).filter((name) => name !== '_') : void 0;
	const payload = {
		cliCommand,
		config: createAnonymousConfigInfo(userConfig),
		flags: cliFlags,
	};
	return [{ eventName: EVENT_SESSION, payload }];
}
export { eventCliSession };
