import { renderToString } from '@astrojs/runtime';
import Page from './components/Page.astro';

export function render(props) {
	return renderToString(Page, { props });
}
