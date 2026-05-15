import { AstroError, AstroErrorData } from '../errors/index.js';
function validateDynamicRouteModule(mod, { ssr, route }) {
	if ((!ssr || route.prerender) && !mod.getStaticPaths) {
		throw new AstroError({
			...AstroErrorData.GetStaticPathsRequired,
			location: { file: route.component },
		});
	}
}
function validateGetStaticPathsResult(result, route) {
	if (!Array.isArray(result)) {
		throw new AstroError({
			...AstroErrorData.InvalidGetStaticPathsReturn,
			message: AstroErrorData.InvalidGetStaticPathsReturn.message(typeof result),
			location: {
				file: route.component,
			},
		});
	}
	result.forEach((pathObject) => {
		if ((typeof pathObject === 'object' && Array.isArray(pathObject)) || pathObject === null) {
			throw new AstroError({
				...AstroErrorData.InvalidGetStaticPathsEntry,
				message: AstroErrorData.InvalidGetStaticPathsEntry.message(
					Array.isArray(pathObject) ? 'array' : typeof pathObject,
				),
			});
		}
		if (
			pathObject.params === void 0 ||
			pathObject.params === null ||
			(pathObject.params && Object.keys(pathObject.params).length === 0)
		) {
			throw new AstroError({
				...AstroErrorData.GetStaticPathsExpectedParams,
				location: {
					file: route.component,
				},
			});
		}
	});
}
export { validateDynamicRouteModule, validateGetStaticPathsResult };
