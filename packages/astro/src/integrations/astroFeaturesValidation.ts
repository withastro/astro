import type {
	AstroAssetsFeature,
	AstroConfig,
	AstroFeatureMap,
	SupportsKind,
} from '../@types/astro';
import { error, warn, type LogOptions } from '../core/logger/core.js';

const STABLE = 'stable';
const DEPRECATED = 'deprecated';
const UNSUPPORTED = 'unsupported';
const EXPERIMENTAL = 'experimental';

const UNSUPPORTED_ASSETS_FEATURE: AstroAssetsFeature = {
	supportKind: UNSUPPORTED,
	isSquooshCompatible: false,
	isSharpCompatible: false,
};

// NOTE: remove for Astro 4.0
const ALL_UNSUPPORTED: Required<AstroFeatureMap> = {
	serverOutput: UNSUPPORTED,
	staticOutput: UNSUPPORTED,
	hybridOutput: UNSUPPORTED,
	assets: UNSUPPORTED_ASSETS_FEATURE,
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
	featureMap: AstroFeatureMap = ALL_UNSUPPORTED,
	config: AstroConfig,
	logging: LogOptions
): ValidationResult {
	const {
		assets = UNSUPPORTED_ASSETS_FEATURE,
		serverOutput = UNSUPPORTED,
		staticOutput = UNSUPPORTED,
		hybridOutput = UNSUPPORTED,
	} = featureMap;
	const validationResult: ValidationResult = {};

	validationResult.staticOutput = validateSupportKind(
		staticOutput,
		adapterName,
		logging,
		'staticOutput',
		() => config?.output === 'static'
	);

	validationResult.hybridOutput = validateSupportKind(
		hybridOutput,
		adapterName,
		logging,
		'hybridOutput',
		() => config?.output === 'hybrid'
	);

	validationResult.serverOutput = validateSupportKind(
		serverOutput,
		adapterName,
		logging,
		'serverOutput',
		() => config?.output === 'server'
	);
	validationResult.assets = validateAssetsFeature(assets, adapterName, config, logging);

	return validationResult;
}

function validateSupportKind(
	supportKind: SupportsKind,
	adapterName: string,
	logging: LogOptions,
	featureName: string,
	hasCorrectConfig: () => boolean
): boolean {
	if (supportKind === STABLE) {
		return true;
	} else if (supportKind === DEPRECATED) {
		featureIsDeprecated(adapterName, logging);
	} else if (supportKind === EXPERIMENTAL) {
		featureIsExperimental(adapterName, logging);
	}

	if (hasCorrectConfig() && supportKind === UNSUPPORTED) {
		featureIsUnsupported(adapterName, logging, featureName);
		return false;
	} else {
		return true;
	}
}

function featureIsUnsupported(adapterName: string, logging: LogOptions, featureName: string) {
	error(
		logging,
		`${adapterName}`,
		`The feature ${featureName} is not supported by the adapter ${adapterName}.`
	);
}

function featureIsExperimental(adapterName: string, logging: LogOptions) {
	warn(logging, `${adapterName}`, 'The feature is experimental and subject to issues or changes.');
}

function featureIsDeprecated(adapterName: string, logging: LogOptions) {
	warn(
		logging,
		`${adapterName}`,
		'The feature is deprecated and will be moved in the next release.'
	);
}

const SHARP_SERVICE = 'astro/assets/services/sharp';
const SQUOOSH_SERVICE = 'astro/assets/services/squoosh';

function validateAssetsFeature(
	assets: AstroAssetsFeature,
	adapterName: string,
	config: AstroConfig,
	logging: LogOptions
): boolean {
	const {
		supportKind = UNSUPPORTED,
		isSharpCompatible = false,
		isSquooshCompatible = false,
	} = assets;
	if (config?.image?.service?.entrypoint === SHARP_SERVICE && !isSharpCompatible) {
		error(
			logging,
			'astro',
			`The currently selected adapter \`${adapterName}\` is not compatible with the image service "Sharp".`
		);
		return false;
	}

	if (config?.image?.service?.entrypoint === SQUOOSH_SERVICE && !isSquooshCompatible) {
		error(
			logging,
			'astro',
			`The currently selected adapter \`${adapterName}\` is not compatible with the image service "Squoosh".`
		);
		return false;
	}

	return validateSupportKind(supportKind, adapterName, logging, 'assets', () => true);
}
