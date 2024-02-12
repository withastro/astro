// Important! Test that styles here are injected to the page
import '/src/main.css';

import type { App } from 'vue';
import Bar from './components/Bar.vue';

export default function setup(app: App) {
	app.component('Bar', Bar);
}
