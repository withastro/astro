import type { PropagationHint, SSRResult } from '../../../../@types/astro';
import type { HeadAndContent } from './head-and-content';
import type { RenderTemplateResult } from './render-template';

import { HTMLParts } from '../common.js';
import { isHeadAndContent } from './head-and-content.js';
import { renderAstroTemplateResult } from './render-template.js';

export type AstroFactoryReturnValue = RenderTemplateResult | Response | HeadAndContent;

// The callback passed to to $$createComponent
export interface AstroComponentFactory {
	(result: any, props: any, slots: any): AstroFactoryReturnValue;
	isAstroComponentFactory?: boolean;
	moduleId?: string | undefined;
	propagation?: PropagationHint;
}

export function isAstroComponentFactory(obj: any): obj is AstroComponentFactory {
	return obj == null ? false : obj.isAstroComponentFactory === true;
}

// Calls a component and renders it into a string of HTML
export async function renderToString(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any
): Promise<string> {
	const factoryResult = await componentFactory(result, props, children);

	if (factoryResult instanceof Response) {
		const response = factoryResult;
		throw response;
	}

	let parts = new HTMLParts();
	const templateResult = isHeadAndContent(factoryResult) ? factoryResult.content : factoryResult;
	for await (const chunk of renderAstroTemplateResult(templateResult)) {
		parts.append(chunk, result);
	}

	return parts.toString();
}

export function isAPropagatingComponent(
	result: SSRResult,
	factory: AstroComponentFactory
): boolean {
	let hint: PropagationHint = factory.propagation || 'none';
	if (factory.moduleId && result.componentMetadata.has(factory.moduleId) && hint === 'none') {
		hint = result.componentMetadata.get(factory.moduleId)!.propagation;
	}
	return hint === 'in-tree' || hint === 'self';
}
