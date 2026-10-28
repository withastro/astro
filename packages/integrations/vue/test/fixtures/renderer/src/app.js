import './app.css';
import Greeting from './components/Greeting.vue';

export default (app) => {
	app.component('Greeting', Greeting);
};
