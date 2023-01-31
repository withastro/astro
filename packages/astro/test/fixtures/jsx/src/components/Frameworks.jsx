import 'astro/jsx-runtime';
import { Test } from "./Test";

import PreactCounter from "./PreactCounter";
import ReactCounter from "./ReactCounter";
import SolidCounter from "./SolidCounter";
import SvelteCounter from "./SvelteCounter.svelte";
import VueCounter from "./VueCounter.vue";

export function Preact() {
	return <Test case="has-preact"><PreactCounter /></Test>
}

export function React() {
	return <Test case="has-react"><ReactCounter /></Test>
}

export function Solid() {
	return <Test case="has-solid"><SolidCounter /></Test>
}

export function Svelte() {
	return <Test case="has-svelte"><SvelteCounter /></Test>
}

export function Vue() {
	return <Test case="has-vue"><VueCounter /></Test>
}
