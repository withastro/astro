import { renderToString } from '@astrojs/runtime';
import Page from './components/Page.astro';
import Plain from './components/Plain.astro';

export function render() {
	return renderToString(Page);
}

export function renderPlain() {
	return renderToString(Plain);
}
