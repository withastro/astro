import { AstroError, AstroErrorData } from '../../core/errors/index.js';
function validateArgs(args) {
	if (args.length !== 3) return false;
	if (!args[0] || typeof args[0] !== 'object') return false;
	return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
	const name = moduleId?.split('/').pop()?.replace('.astro', '') ?? '';
	const fn = (...args) => {
		if (!validateArgs(args)) {
			throw new AstroError({
				...AstroErrorData.InvalidComponentArgs,
				message: AstroErrorData.InvalidComponentArgs.message(name),
			});
		}
		return cb(...args);
	};
	Object.defineProperty(fn, 'name', { value: name, writable: false });
	fn.isAstroComponentFactory = true;
	fn.moduleId = moduleId;
	fn.propagation = propagation;
	return fn;
}
function createComponentWithOptions(opts) {
	const cb = baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
	return cb;
}
function createComponent(arg1, moduleId, propagation) {
	if (typeof arg1 === 'function') {
		return baseCreateComponent(arg1, moduleId, propagation);
	} else {
		return createComponentWithOptions(arg1);
	}
}
export { createComponent };
