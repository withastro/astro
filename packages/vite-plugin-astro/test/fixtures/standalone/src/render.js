import { renderToString } from '@astrojs/vite-plugin-astro/render';
import Page from './components/Page.astro';

export function render(props) {
	return renderToString(Page, { props });
}
