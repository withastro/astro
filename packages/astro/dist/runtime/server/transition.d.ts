import type { SSRResult } from '../../types/public/internal.js';
import type {
	TransitionAnimation,
	TransitionAnimationPair,
	TransitionAnimationValue,
} from '../../types/public/view-transitions.js';
export declare function createTransitionScope(result: SSRResult, hash: string): string;
export declare function reEncode(s: string): string;
export declare function renderTransition(
	result: SSRResult,
	hash: string,
	animationName: TransitionAnimationValue | undefined,
	transitionName: string,
): string;
/** @deprecated This will be removed in Astro 7 */
export declare function createAnimationScope(
	transitionName: string,
	animations: Record<string, TransitionAnimationPair>,
): {
	scope: string;
	styles: string;
};
export declare class ViewTransitionStyleSheet {
	private modern;
	private fallback;
	private scope;
	private name;
	constructor(scope: string, name: string);
	toString(): string;
	private layer;
	private addRule;
	addAnimationRaw(image: 'old' | 'new' | 'group', animation: string): void;
	addModern(image: 'old' | 'new' | 'group', animation: string): void;
	addFallback(image: 'old' | 'new' | 'group', animation: string): void;
	addAnimationPair(
		direction: 'forwards' | 'backwards' | string,
		image: 'old' | 'new',
		rules: TransitionAnimation | TransitionAnimation[],
	): void;
}
export declare function stringifyAnimation(
	anim: TransitionAnimation | TransitionAnimation[],
): string;
export declare function stringifyAnimations(anims: TransitionAnimation[]): string;
export declare function toTimeValue(num: number | string): string;
