import './astro-jsx';
import { AstroBuiltinAttributes } from './dist/@types/astro';

/** Any supported HTML or SVG element name, as defined by the HTML specification */
export type HTMLTag = keyof astroHTML.JSX.DefinedIntrinsicElements;
/** The built-in attributes for any known HTML or SVG element name */
export type HTMLAttributes<Tag extends HTMLTag> = Omit<
	astroHTML.JSX.IntrinsicElements[Tag],
	keyof Omit<AstroBuiltinAttributes, 'class:list'>
>;

type PolymorphicAttributes<P extends { as: HTMLTag }> = Omit<P & HTMLAttributes<P['as']>, 'as'> & {
	as?: P['as'];
};
export type Polymorphic<P extends { as: HTMLTag }> = PolymorphicAttributes<
	Omit<P, 'as'> & { as: NonNullable<P['as']> }
>;
