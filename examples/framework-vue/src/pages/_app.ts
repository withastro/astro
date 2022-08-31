import type { App } from 'vue';
import Test from "../components/Test.vue"

export default (app: App) => {
	app.component('Test', Test)
}
