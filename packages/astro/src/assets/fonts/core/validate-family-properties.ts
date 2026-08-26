import type { AstroLogger } from '../../../core/logger/core.js';
import type { FontResolver } from '../definitions.js';
import type { FontProperties, ResolvedFontFamily } from '../types.js';

/**
 * Keywords allowed by the `font-weight` descriptor, mapped to their numeric value.
 */
const WEIGHT_KEYWORDS: Record<string, number> = {
	normal: 400,
	bold: 700,
};

/**
 * Parses a weight (eg. `"400"`, `"bold"` or the variable range `"100 900"`) into a
 * `[min, max]` range. Returns `null` when the value can't be interpreted: in that case
 * we prefer staying silent over warning wrongly.
 */
function parseWeightRange(weight: string): [number, number] | null {
	const parts = weight.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0 || parts.length > 2) {
		return null;
	}
	const values = parts.map((part) => WEIGHT_KEYWORDS[part] ?? Number(part));
	if (values.some((value) => !Number.isFinite(value))) {
		return null;
	}
	return [values[0]!, values[1] ?? values[0]!];
}

/**
 * A weight is available if it's covered by one of the weights the provider exposes.
 * Providers may expose variable ranges, so `500` is available if `100 900` is.
 */
function isWeightAvailable(weight: string, availableWeights: Array<string>): boolean {
	const range = parseWeightRange(weight);
	if (!range) {
		return true;
	}
	return availableWeights.some((availableWeight) => {
		const availableRange = parseWeightRange(availableWeight);
		if (!availableRange) {
			return true;
		}
		return range[0] >= availableRange[0] && range[1] <= availableRange[1];
	});
}

/**
 * Warns about values configured for a family that its provider can't serve, eg. a weight
 * or a subset a font family does not have. We only check values that are explicitly
 * configured: defaults are handled by providers themselves.
 */
export async function validateFamilyProperties({
	family,
	fontResolver,
	logger,
	bold,
}: {
	family: ResolvedFontFamily;
	fontResolver: FontResolver;
	logger: AstroLogger;
	bold: (input: string) => string;
}): Promise<void> {
	// Providers are not required to implement this, and they return no properties for
	// families they don't know about. In both cases, there's nothing to check against.
	const properties = await fontResolver.getFontProperties({
		familyName: family.name,
		provider: family.provider,
	});
	if (!properties) {
		return;
	}

	const check = (
		key: keyof FontProperties,
		configured: Array<string> | undefined,
		isAvailable: (value: string, available: Array<string>) => boolean,
	) => {
		const available = properties[key];
		if (!configured || !available || available.length === 0) {
			return;
		}
		const unsupported = configured.filter((value) => !isAvailable(value, available));
		if (unsupported.length === 0) {
			return;
		}
		logger.warn(
			'assets',
			`The ${bold(family.name)} font family does not support the following ${key}: ${unsupported.join(', ')}. Available ${key}: ${available.join(', ')}. Review your configuration.`,
		);
	};

	const includes = (value: string, available: Array<string>) => available.includes(value);

	check('weights', family.weights, isWeightAvailable);
	check('styles', family.styles, includes);
	check('subsets', family.subsets, includes);
	check('formats', family.formats, includes);
}
