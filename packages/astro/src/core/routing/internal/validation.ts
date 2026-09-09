import { AstroError, AstroErrorData } from '../../errors/index.js';

const VALID_PARAM_TYPES = ['string', 'undefined'];

/** Throws error for invalid parameter in getStaticPaths() response */
export function validateGetStaticPathsParameter([key, value]: [string, any], route: string) {
	if (!VALID_PARAM_TYPES.includes(typeof value)) {
		throw new AstroError({
			...AstroErrorData.GetStaticPathsInvalidRouteParam,
			message: AstroErrorData.GetStaticPathsInvalidRouteParam.message(key, value, typeof value),
			location: {
				file: route,
			},
		});
	}
}
