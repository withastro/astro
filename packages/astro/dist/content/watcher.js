function createWatcherWrapper(watcher) {
	const listeners = /* @__PURE__ */ new Map();
	const handler = {
		get(target, prop, receiver) {
			if (prop === 'on') {
				return function (event, callback) {
					if (!listeners.has(event)) {
						listeners.set(event, /* @__PURE__ */ new Set());
					}
					listeners.get(event).add(callback);
					return Reflect.get(target, prop, receiver).call(target, event, callback);
				};
			}
			if (prop === 'off') {
				return function (event, callback) {
					listeners.get(event)?.delete(callback);
					return Reflect.get(target, prop, receiver).call(target, event, callback);
				};
			}
			if (prop === 'removeAllTrackedListeners') {
				return function () {
					for (const [event, callbacks] of listeners.entries()) {
						for (const callback of callbacks) {
							target.off(event, callback);
						}
						callbacks.clear();
					}
					listeners.clear();
				};
			}
			return Reflect.get(target, prop, receiver);
		},
	};
	return new Proxy(watcher, handler);
}
export { createWatcherWrapper };
