import { renderToString } from '@astrojs/runtime';
import Page from './components/Page.astro';

export function render() {
	return renderToString(Page);
}
