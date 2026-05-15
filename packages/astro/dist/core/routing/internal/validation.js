import { AstroError, AstroErrorData } from '../../errors/index.js';
const VALID_PARAM_TYPES = ['string', 'undefined'];
function validateGetStaticPathsParameter([key, value], route) {
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
export { validateGetStaticPathsParameter };
