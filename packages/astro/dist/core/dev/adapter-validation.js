import { getAdapterStaticRecommendation } from '../../integrations/features-validation.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
let hasWarnedMissingAdapter = false;
function warnMissingAdapter(logger, settings) {
	if (hasWarnedMissingAdapter) return;
	if (settings.buildOutput === 'server' && !settings.config.adapter) {
		logger.warn(
			'config',
			'This project contains server-rendered routes, but no adapter is installed. This is fine for development, but an adapter will be required to build your site for production.',
		);
		hasWarnedMissingAdapter = true;
	}
}
function validateSetAdapter(logger, settings, adapter, maybeConflictingIntegration, command) {
	if (settings.adapter && settings.adapter.name !== adapter.name) {
		throw new Error(
			`Integration "${maybeConflictingIntegration}" conflicts with "${settings.adapter.name}". You can only configure one deployment integration.`,
		);
	}
	if (settings.buildOutput === 'server' && adapter.adapterFeatures?.buildOutput === 'static') {
		if (command === 'build') {
			const adapterRecommendation = getAdapterStaticRecommendation(adapter.name);
			throw new AstroError({
				...AstroErrorData.AdapterSupportOutputMismatch,
				message: AstroErrorData.AdapterSupportOutputMismatch.message(adapter.name),
				hint: adapterRecommendation ? adapterRecommendation : void 0,
			});
		} else if (command === 'dev') {
			logger.warn(
				null,
				`The adapter ${adapter.name} does not support emitting a server output, but the project contain server-rendered pages. Your project will not build correctly.`,
			);
		}
	}
	if (adapter.entrypointResolution === void 0) {
		logger.warn(
			null,
			`The adapter ${adapter.name} uses \`entrypointResolution: "explicit"\` by default, which is deprecated and will be removed in a future major version.`,
		);
		logger.warn(
			null,
			'Update your adapter to use `entrypointResolution: "auto"` or contact the maintainers to update.',
		);
	}
}
export { validateSetAdapter, warnMissingAdapter };
