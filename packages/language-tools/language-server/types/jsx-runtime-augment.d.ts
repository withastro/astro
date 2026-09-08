/// <reference types="astro/astro-jsx" />

declare module 'astro/jsx-runtime' {
	export import JSX = astroHTML.JSX;
}
