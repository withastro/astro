import { registerSW } from 'virtual:pwa-register';
import { pwaInfo } from 'virtual:pwa-info';

const updateSW = registerSW({
	onNeedRefresh() {},
	onOfflineReady() {
		console.log('Offline ready');
	},
});

updateSW();

console.log(pwaInfo)

