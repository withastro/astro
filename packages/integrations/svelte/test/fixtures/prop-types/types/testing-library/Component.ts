import { render } from '@testing-library/svelte';
import type { Component as SvelteComponent } from 'svelte';
import Component from './Component.svelte';

/**
 * Passing the component to Testing Library's render function.
 * Reproduces the original issue where Astro's wrapped component type
 * is incompatible with the expected Svelte component type.
 */
render(Component);

/**
 * Direct assignment to Svelte 5's standard Component type.
 * Ensures the component can be treated as a standard Svelte component.
 */
const testAssign: SvelteComponent<any, any, any> = Component;

/**
 * Reference the variable to satisfy the compiler and ensure type checking
 */
export function useVariables() {
	console.log(testAssign);
}
