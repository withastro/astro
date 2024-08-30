import type { Logger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';
import type {
	AdapterSupportsKind,
	AstroAdapterFeatureMap,
	AstroAdapterFeatures,
	AstroAssetsFeature,
} from '../types/public/integrations.js';

const STABLE = 'stable';
const DEPRECATED = 'deprecated';
const UNSUPPORTED = 'unsupported';
const EXPERIMENTAL = 'experimental';

const UNSUPPORTED_ASSETS_FEATURE: AstroAssetsFeature = {
	supportKind: UNSUPPORTED,
	isSharpCompatible: false,
};

type ValidationResult = {
	[Property in keyof AstroAdapterFeatureMap]: boolean;
};

/**
 * Checks whether an adapter supports certain features that are enabled via Astro configuration.
 *
 * If a configuration is enabled and "unlocks" a feature, but the adapter doesn't support, the function
 * will throw a runtime error.
 *
 */
export function validateSupportedFeatures(
	adapterName: string,
	featureMap: AstroAdapterFeatureMap,
	settings: AstroSettings,
	adapterFeatures: AstroAdapterFeatures | undefined,
	logger: Logger,
): ValidationResult {
	const {
		assets = UNSUPPORTED_ASSETS_FEATURE,
		serverOutput = UNSUPPORTED,
		staticOutput = UNSUPPORTED,
		hybridOutput = UNSUPPORTED,
		i18nDomains = UNSUPPORTED,
		envGetSecret = UNSUPPORTED,
	} = featureMap;
	const validationResult: ValidationResult = {};

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
		() => settings.config.output == 'static' && settings.buildOutput === 'server',
	);

	validationResult.serverOutput = validateSupportKind(
		serverOutput,
		adapterName,
		logger,
		'serverOutput',
		() => settings.config?.output === 'server',
	);
	validationResult.assets = validateAssetsFeature(assets, adapterName, settings.config, logger);

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

	return validationResult;
}

function validateSupportKind(
	supportKind: AdapterSupportsKind,
	adapterName: string,
	logger: Logger,
	featureName: string,
	hasCorrectConfig: () => boolean,
): boolean {
	if (supportKind === STABLE) {
		return true;
	} else if (supportKind === DEPRECATED) {
		featureIsDeprecated(adapterName, logger, featureName);
	} else if (supportKind === EXPERIMENTAL) {
		featureIsExperimental(adapterName, logger, featureName);
	}

	if (hasCorrectConfig() && supportKind === UNSUPPORTED) {
		featureIsUnsupported(adapterName, logger, featureName);
		return false;
	} else {
		return true;
	}
}

function featureIsUnsupported(adapterName: string, logger: Logger, featureName: string) {
	logger.error(
		'config',
		`The adapter ${adapterName} doesn't currently support the feature "${featureName}".`,
	);
}

function featureIsExperimental(adapterName: string, logger: Logger, featureName: string) {
	logger.warn(
		'config',
		`The adapter ${adapterName} provides experimental support for "${featureName}". You may experience issues or breaking changes until this feature is fully supported by the adapter.`,
	);
}

function featureIsDeprecated(adapterName: string, logger: Logger, featureName: string) {
	logger.warn(
		'config',
		`The adapter ${adapterName} has deprecated its support for "${featureName}", and future compatibility is not guaranteed. The adapter may completely remove support for this feature without warning.`,
	);
}

const SHARP_SERVICE = 'astro/assets/services/sharp';

function validateAssetsFeature(
	assets: AstroAssetsFeature,
	adapterName: string,
	config: AstroConfig,
	logger: Logger,
): boolean {
	const { supportKind = UNSUPPORTED, isSharpCompatible = false } = assets;
	if (config?.image?.service?.entrypoint === SHARP_SERVICE && !isSharpCompatible) {
		logger.warn(
			null,
			`The currently selected adapter \`${adapterName}\` is not compatible with the image service "Sharp".`,
		);
		return false;
	}

	return validateSupportKind(supportKind, adapterName, logger, 'assets', () => true);
}
