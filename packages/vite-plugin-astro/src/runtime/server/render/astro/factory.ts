import type { AstroComponentFactory } from '../../../../types.js';
import type { PropagationHint, SSRResult } from '../../../../types.js';
import {
	getPropagationHint as getHint,
	isPropagatingHint,
} from '../../../../core/head-propagation/resolver.js';

export type { AstroComponentFactory, AstroFactoryReturnValue } from '../../../../types.js';

export function isAstroComponentFactory(obj: any): obj is AstroComponentFactory {
	return obj == null ? false : obj.isAstroComponentFactory === true;
}

export function isAPropagatingComponent(
	result: SSRResult,
	factory: AstroComponentFactory,
): boolean {
	return isPropagatingHint(getPropagationHint(result, factory));
}

export function getPropagationHint(
	result: SSRResult,
	factory: AstroComponentFactory,
): PropagationHint {
	return getHint(result, factory);
}
