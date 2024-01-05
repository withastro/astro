/// <reference path="astro-jsx.d.ts" />

declare module 'astro/jsx-runtime' {
	export import JSX = astroHTML.JSX;
}
