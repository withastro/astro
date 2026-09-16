import type { JSX } from 'astro/jsx-runtime';

export type AstroClientDirectives = JSX.AstroComponentDirectives;

export type PropsWithHTMLAttributes<T> = T & astroHTML.JSX.HTMLAttributes & AstroClientDirectives;
