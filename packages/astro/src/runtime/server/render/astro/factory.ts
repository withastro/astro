import type { PropagationHint, SSRResult } from '../../../../types/public/internal.js';
import {
	getPropagationHint as getHint,
	isPropagatingHint,
} from '../../../../core/head-propagation/resolver.js';
import type { HeadAndContent, ThinHead } from './head-and-content.js';
import type { RenderTemplateResult } from './render-template.js';

export type AstroFactoryReturnValue = RenderTemplateResult | Response | HeadAndContent | ThinHead;

// The callback passed to $$createComponent
export interface AstroComponentFactory {
	(result: any, props: any, slots: any): AstroFactoryReturnValue | Promise<AstroFactoryReturnValue>;
	isAstroComponentFactory?: boolean;
	moduleId?: string | undefined;
	propagation?: PropagationHint;
}

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
