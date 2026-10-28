import type { TransitionAnimationValue } from '@astrojs/runtime/internal/types/public/view-transitions.js';

export interface AstroComponentDirectives extends Astro.ClientDirectives {
	'server:defer'?: boolean;
}

export type { AstroClientDirectives, ClientVisibleOptions } from '@astrojs/vite-plugin-astro';

export interface AstroBuiltinAttributes {
	'class:list'?:
		| Record<string, boolean>
		| Record<any, any>
		| Iterable<string>
		| Iterable<any>
		| string;
	'set:html'?: any;
	'set:text'?: any;
	'is:raw'?: boolean;
	'transition:animate'?: TransitionAnimationValue;
	'transition:name'?: string;
	'transition:persist'?: boolean | string;
}

export interface AstroDefineVarsAttribute {
	'define:vars'?: any;
}

export interface AstroStyleAttributes {
	'is:global'?: boolean;
	'is:inline'?: boolean;
}

export interface AstroScriptAttributes {
	'is:inline'?: boolean;
}

export interface AstroSlotAttributes {
	'is:inline'?: boolean;
}
