import type { PropagationHint, SSRResult } from '../../../../types/public/internal.js';
import type { HeadAndContent, ThinHead } from './head-and-content.js';
import type { RenderTemplateResult } from './render-template.js';
export type AstroFactoryReturnValue = RenderTemplateResult | Response | HeadAndContent | ThinHead;
export interface AstroComponentFactory {
	(result: any, props: any, slots: any): AstroFactoryReturnValue | Promise<AstroFactoryReturnValue>;
	isAstroComponentFactory?: boolean;
	moduleId?: string | undefined;
	propagation?: PropagationHint;
}
export declare function isAstroComponentFactory(obj: any): obj is AstroComponentFactory;
export declare function isAPropagatingComponent(
	result: SSRResult,
	factory: AstroComponentFactory,
): boolean;
export declare function getPropagationHint(
	result: SSRResult,
	factory: AstroComponentFactory,
): PropagationHint;
