import './astro-jsx';
import { AstroBuiltinAttributes } from './dist/@types/astro';

export type HTMLTag = keyof astroHTML.JSX.IntrinsicElements;
export type HTMLAttributes<Tag extends HTMLTag> = Omit<astroHTML.JSX.IntrinsicElements[Tag], keyof AstroBuiltinAttributes>;

type PolymorphicAttributes<P extends { as: HTMLTag }> = Omit<(P & HTMLAttributes<P['as']>), 'as'> & { as?: P['as'] };
export type Polymorphic<P extends { as: HTMLTag }> = PolymorphicAttributes<Omit<P, 'as'> & { as: NonNullable<P['as']>}>;
