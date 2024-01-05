import type { App } from 'vue'
import Bar from './components/Bar.vue'
// Important! Test that styles here are injected to the page
import '/src/main.css'


export default function setup(app: App) {
	app.component('Bar', Bar);
}
