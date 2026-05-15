import {
	getPropagationHint as getHint,
	isPropagatingHint,
} from '../../../../core/head-propagation/resolver.js';
function isAstroComponentFactory(obj) {
	return obj == null ? false : obj.isAstroComponentFactory === true;
}
function isAPropagatingComponent(result, factory) {
	return isPropagatingHint(getPropagationHint(result, factory));
}
function getPropagationHint(result, factory) {
	return getHint(result, factory);
}
export { getPropagationHint, isAPropagatingComponent, isAstroComponentFactory };
