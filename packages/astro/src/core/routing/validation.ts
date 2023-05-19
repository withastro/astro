import { bold } from 'kleur/colors';
import type { ComponentInstance, GetStaticPathsResult, RouteData } from '../../@types/astro';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { LogOptions } from '../logger/core';
import { warn } from '../logger/core.js';

const VALID_PARAM_TYPES = ['string', 'number', 'undefined'];

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

/** Warn or error for deprecated or malformed route components */
export function validateDynamicRouteModule(
	mod: ComponentInstance,
	{
		ssr,
		logging,
		route,
	}: {
		ssr: boolean;
		logging: LogOptions;
		route: RouteData;
	}
) {
	if (ssr && mod.getStaticPaths && !mod.prerender) {
		warn(
			logging,
			'getStaticPaths',
			`getStaticPaths() in ${bold(route.component)} is ignored when "output: server" is set.`
		);
	}
	if ((!ssr || mod.prerender) && !mod.getStaticPaths) {
		throw new AstroError({
			...AstroErrorData.GetStaticPathsRequired,
			location: { file: route.component },
		});
	}
}

/** Throw error and log warnings for malformed getStaticPaths() response */
export function validateGetStaticPathsResult(
	result: GetStaticPathsResult,
	logging: LogOptions,
	route: RouteData
) {
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
		if (
			pathObject.params === undefined ||
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

		if (typeof pathObject.params !== 'object') {
			throw new AstroError({
				...AstroErrorData.InvalidGetStaticPathParam,
				message: AstroErrorData.InvalidGetStaticPathParam.message(typeof pathObject.params),
				location: {
					file: route.component,
				},
			});
		}

		// TODO: Replace those with errors? They technically don't crash the build, but users might miss the warning. - erika, 2022-11-07
		for (const [key, val] of Object.entries(pathObject.params)) {
			if (!(typeof val === 'undefined' || typeof val === 'string' || typeof val === 'number')) {
				warn(
					logging,
					'getStaticPaths',
					`invalid path param: ${key}. A string, number or undefined value was expected, but got \`${JSON.stringify(
						val
					)}\`.`
				);
			}
			if (typeof val === 'string' && val === '') {
				warn(
					logging,
					'getStaticPaths',
					`invalid path param: ${key}. \`undefined\` expected for an optional param, but got empty string.`
				);
			}
		}
	});
}
