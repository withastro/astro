const AdapterFeatureStability = {
	STABLE: 'stable',
	DEPRECATED: 'deprecated',
	UNSUPPORTED: 'unsupported',
	EXPERIMENTAL: 'experimental',
	LIMITED: 'limited',
};
function validateSupportedFeatures(adapterName, featureMap, settings, logger) {
	const {
		serverOutput = AdapterFeatureStability.UNSUPPORTED,
		staticOutput = AdapterFeatureStability.UNSUPPORTED,
		hybridOutput = AdapterFeatureStability.UNSUPPORTED,
		i18nDomains = AdapterFeatureStability.UNSUPPORTED,
		envGetSecret = AdapterFeatureStability.UNSUPPORTED,
		sharpImageService = AdapterFeatureStability.UNSUPPORTED,
	} = featureMap;
	const validationResult = {};
	validationResult.staticOutput = validateSupportKind(
		staticOutput,
		adapterName,
		logger,
		'staticOutput',
		() => settings.buildOutput === 'static',
	);
	validationResult.hybridOutput = validateSupportKind(
		hybridOutput,
		adapterName,
		logger,
		'hybridOutput',
		() => settings.config.output === 'static' && settings.buildOutput === 'server',
	);
	validationResult.serverOutput = validateSupportKind(
		serverOutput,
		adapterName,
		logger,
		'serverOutput',
		() => settings.config?.output === 'server' || settings.buildOutput === 'server',
	);
	if (settings.config.i18n?.domains) {
		validationResult.i18nDomains = validateSupportKind(
			i18nDomains,
			adapterName,
			logger,
			'i18nDomains',
			() => {
				return settings.config?.output === 'server' && !settings.config?.site;
			},
		);
	}
	validationResult.envGetSecret = validateSupportKind(
		envGetSecret,
		adapterName,
		logger,
		'astro:env getSecret',
		() => Object.keys(settings.config?.env?.schema ?? {}).length !== 0,
	);
	validationResult.sharpImageService = validateSupportKind(
		sharpImageService,
		adapterName,
		logger,
		'sharp',
		() => settings.config?.image?.service?.entrypoint === 'astro/assets/services/sharp',
	);
	return validationResult;
}
function unwrapSupportKind(supportKind) {
	if (!supportKind) {
		return void 0;
	}
	return typeof supportKind === 'object' ? supportKind.support : supportKind;
}
function getSupportMessage(supportKind) {
	return typeof supportKind === 'object' ? supportKind.message : void 0;
}
function getSupportMessageSuppression(supportKind) {
	return typeof supportKind === 'object' ? supportKind.suppress : void 0;
}
function validateSupportKind(supportKind, adapterName, logger, featureName, hasCorrectConfig) {
	const supportValue = unwrapSupportKind(supportKind);
	const message = getSupportMessage(supportKind);
	const suppress = getSupportMessageSuppression(supportKind);
	if (!supportValue) {
		return false;
	}
	if (supportValue === AdapterFeatureStability.STABLE) {
		return true;
	} else if (hasCorrectConfig()) {
		logFeatureSupport(adapterName, logger, featureName, supportValue, message, suppress);
	}
	return false;
}
function logFeatureSupport(
	adapterName,
	logger,
	featureName,
	supportKind,
	adapterMessage,
	suppress,
) {
	if (!suppress) {
		switch (supportKind) {
			case AdapterFeatureStability.STABLE:
				break;
			case AdapterFeatureStability.DEPRECATED:
				logger.warn(
					'config',
					`The adapter ${adapterName} has deprecated its support for "${featureName}", and future compatibility is not guaranteed. The adapter may completely remove support for this feature without warning.`,
				);
				break;
			case AdapterFeatureStability.EXPERIMENTAL:
				logger.warn(
					'config',
					`The adapter ${adapterName} provides experimental support for "${featureName}". You may experience issues or breaking changes until this feature is fully supported by the adapter.`,
				);
				break;
			case AdapterFeatureStability.LIMITED:
				logger.warn(
					'config',
					`The adapter ${adapterName} has limited support for "${featureName}". Certain features may not work as expected.`,
				);
				break;
			case AdapterFeatureStability.UNSUPPORTED:
				logger.error(
					'config',
					`The adapter ${adapterName} does not currently support the feature "${featureName}". Your project may not build correctly.`,
				);
				break;
		}
	}
	if (adapterMessage && suppress !== 'all') {
		logger.warn('adapter', adapterMessage);
	}
}
function getAdapterStaticRecommendation(adapterName) {
	return {
		'@astrojs/vercel/static':
			'Update your configuration to use `@astrojs/vercel/serverless` to unlock server-side rendering capabilities.',
	}[adapterName];
}
export {
	AdapterFeatureStability,
	getAdapterStaticRecommendation,
	getSupportMessage,
	unwrapSupportKind,
	validateSupportedFeatures,
};
