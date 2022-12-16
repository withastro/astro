import type { PropagationHint } from '../../@types/astro';
import type { AstroComponentFactory } from './render/index.js';

function baseCreateComponent(cb: AstroComponentFactory, moduleId?: string) {
	// Add a flag to this callback to mark it as an Astro component
	cb.isAstroComponentFactory = true;
	cb.moduleId = moduleId;
	return cb;
}

interface CreateComponentOptions {
	factory: AstroComponentFactory;
	moduleId?: string;
	propagation?: PropagationHint;
}

function createComponentWithOptions(opts: CreateComponentOptions) {
	const cb = baseCreateComponent(opts.factory, opts.moduleId);
	cb.propagation = opts.propagation;
	return cb;
}
// Used in creating the component. aka the main export.
export function createComponent(arg1: AstroComponentFactory | CreateComponentOptions, moduleId?: string) {
	if (typeof arg1 === 'function') {
		return baseCreateComponent(arg1, moduleId);
	} else {
		return createComponentWithOptions(arg1);
	}
}
