import './astro-jsx';
import type { AstroBuiltinAttributes } from './dist/@types/astro.js';
import type { Simplify } from './dist/type-utils.js';

/** Any supported HTML or SVG element name, as defined by the HTML specification */
export type HTMLTag = keyof astroHTML.JSX.DefinedIntrinsicElements;
/** The built-in attributes for any known HTML or SVG element name */
export type HTMLAttributes<Tag extends HTMLTag> = Omit<
	astroHTML.JSX.IntrinsicElements[Tag],
	keyof Omit<AstroBuiltinAttributes, 'class:list'>
>;

/**
 * All the CSS properties available, as defined by the CSS specification
 */
export type CSSProperty = keyof astroHTML.JSX.KebabCSSDOMProperties;

type PolymorphicAttributes<P extends { as: HTMLTag }> = Omit<P & HTMLAttributes<P['as']>, 'as'> & {
	as?: P['as'];
};
export type Polymorphic<P extends { as: HTMLTag }> = PolymorphicAttributes<
	Omit<P, 'as'> & { as: NonNullable<P['as']> }
>;

export type ComponentProps<T extends (args: any) => any> = Simplify<Parameters<T>[0]>;
