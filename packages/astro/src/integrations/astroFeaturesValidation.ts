import type {
	AstroAdapterFeatures,
	AstroAssetsFeature,
	AstroConfig,
	AstroFeatureMap,
	SupportsKind,
} from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';

const STABLE = 'stable';
const DEPRECATED = 'deprecated';
const UNSUPPORTED = 'unsupported';
const EXPERIMENTAL = 'experimental';

const UNSUPPORTED_ASSETS_FEATURE: AstroAssetsFeature = {
	supportKind: UNSUPPORTED,
	isSquooshCompatible: false,
	isSharpCompatible: false,
};

type ValidationResult = {
	[Property in keyof AstroFeatureMap]: boolean;
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
	featureMap: AstroFeatureMap,
	config: AstroConfig,
	adapterFeatures: AstroAdapterFeatures | undefined,
	logger: Logger
): ValidationResult {
	const {
		assets = UNSUPPORTED_ASSETS_FEATURE,
		serverOutput = UNSUPPORTED,
		staticOutput = UNSUPPORTED,
		hybridOutput = UNSUPPORTED,
		i18nDomains = UNSUPPORTED,
	} = featureMap;
	const validationResult: ValidationResult = {};

	validationResult.staticOutput = validateSupportKind(
		staticOutput,
		adapterName,
		logger,
		'staticOutput',
		() => config?.output === 'static'
	);

	validationResult.hybridOutput = validateSupportKind(
		hybridOutput,
		adapterName,
		logger,
		'hybridOutput',
		() => config?.output === 'hybrid'
	);

	validationResult.serverOutput = validateSupportKind(
		serverOutput,
		adapterName,
		logger,
		'serverOutput',
		() => config?.output === 'server'
	);
	validationResult.assets = validateAssetsFeature(assets, adapterName, config, logger);

	if (i18nDomains && config?.experimental?.i18nDomains === true && !config.i18n?.domains) {
		validationResult.i18nDomains = validateSupportKind(
			i18nDomains,
			adapterName,
			logger,
			'i18nDomains',
			() => {
				return config?.output === 'server' && !config?.site;
			}
		);
		if (adapterFeatures?.functionPerRoute) {
			logger.error(
				'config',
				'The Astro feature `i18nDomains` is incompatible with the Adapter feature `functionPerRoute`'
			);
		}
	}

	return validationResult;
}

function validateSupportKind(
	supportKind: SupportsKind,
	adapterName: string,
	logger: Logger,
	featureName: string,
	hasCorrectConfig: () => boolean
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
	logger.error('config', `The feature "${featureName}" is not supported (used by ${adapterName}).`);
}

function featureIsExperimental(adapterName: string, logger: Logger, featureName: string) {
	logger.warn(
		'config',
		`The feature "${featureName}" is experimental and subject to change (used by ${adapterName}).`
	);
}

function featureIsDeprecated(adapterName: string, logger: Logger, featureName: string) {
	logger.warn(
		'config',
		`The feature "${featureName}" is deprecated and will be removed in the future (used by ${adapterName}).`
	);
}

const SHARP_SERVICE = 'astro/assets/services/sharp';
const SQUOOSH_SERVICE = 'astro/assets/services/squoosh';

function validateAssetsFeature(
	assets: AstroAssetsFeature,
	adapterName: string,
	config: AstroConfig,
	logger: Logger
): boolean {
	const {
		supportKind = UNSUPPORTED,
		isSharpCompatible = false,
		isSquooshCompatible = false,
	} = assets;
	if (config?.image?.service?.entrypoint === SHARP_SERVICE && !isSharpCompatible) {
		logger.warn(
			null,
			`The currently selected adapter \`${adapterName}\` is not compatible with the image service "Sharp".`
		);
		return false;
	}

	if (config?.image?.service?.entrypoint === SQUOOSH_SERVICE && !isSquooshCompatible) {
		logger.warn(
			null,
			`The currently selected adapter \`${adapterName}\` is not compatible with the image service "Squoosh".`
		);
		return false;
	}

	return validateSupportKind(supportKind, adapterName, logger, 'assets', () => true);
}
