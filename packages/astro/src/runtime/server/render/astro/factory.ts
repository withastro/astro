import type { PropagationHint, SSRResult } from '../../../../types/public/internal.js';
import {
	getPropagationHint as getHint,
	isPropagatingHint,
} from '../../../../core/head-propagation/resolver.js';
import type { HeadAndContent, ThinHead } from './head-and-content.js';
import type { RenderTemplateResult } from './render-template.js';

export type AstroFactoryReturnValue = RenderTemplateResult | Response | HeadAndContent | ThinHead;

export interface AstroContainerAssets {
	styles: string[];
	scripts: string[];
}

// The callback passed to $$createComponent
export interface AstroComponentFactory {
	(result: any, props: any, slots: any): AstroFactoryReturnValue | Promise<AstroFactoryReturnValue>;
	isAstroComponentFactory?: boolean;
	moduleId?: string | undefined;
	propagation?: PropagationHint;
	/**
	 * Inline assets extracted by the compiler. They should be used only by the container,
	 * as these assets aren't the ones computed via vite.
	 */
	containerAssets?: AstroContainerAssets;
}

export function setComponentAssets(
	factory: AstroComponentFactory,
	assets: AstroContainerAssets,
): void {
	Object.defineProperty(factory, 'assets', { value: assets });
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
