class ToolbarAppEventTarget extends EventTarget {
	constructor() {
		super();
	}
	/**
	 * Toggle the notification state of the toolbar
	 * @param options - The notification options
	 * @param options.state - The state of the notification
	 * @param options.level - The level of the notification, optional when state is false
	 */
	toggleNotification(options) {
		this.dispatchEvent(
			new CustomEvent('toggle-notification', {
				detail: {
					state: options.state,
					level: options.state === true ? options.level : void 0,
				},
			}),
		);
	}
	/**
	 * Toggle the app state on or off
	 * @param options - The app state options
	 * @param options.state - The new state of the app
	 */
	toggleState(options) {
		this.dispatchEvent(
			new CustomEvent('toggle-app', {
				detail: {
					state: options.state,
				},
			}),
		);
	}
	/**
	 * Fired when the app is toggled on or off
	 * @param callback - The callback to run when the event is fired, takes an object with the new state
	 */
	onToggled(callback) {
		this.addEventListener('app-toggled', (evt) => {
			if (!(evt instanceof CustomEvent)) return;
			callback(evt.detail);
		});
	}
	/**
	 * Fired when the toolbar placement is updated by the user
	 * @param callback - The callback to run when the event is fired, takes an object with the new placement
	 */
	onToolbarPlacementUpdated(callback) {
		this.addEventListener('placement-updated', (evt) => {
			if (!(evt instanceof CustomEvent)) return;
			callback(evt.detail);
		});
	}
}
const serverHelpers = {
	/**
	 * Send a message to the server, the payload can be any serializable data.
	 *
	 * The server can listen for this message in the `astro:server:config` hook of an Astro integration, using the `toolbar.on` method.
	 *
	 * @param event - The event name
	 * @param payload - The payload to send
	 */
	send: (event, payload) => {
		if (import.meta.hot) {
			import.meta.hot.send(event, payload);
		}
	},
	/**
	 * Receive a message from the server.
	 * @param event - The event name
	 * @param callback - The callback to run when the event is received.
	 * The payload's content will be passed to the callback as an argument
	 */
	on: (event, callback) => {
		if (import.meta.hot) {
			import.meta.hot.on(event, callback);
		}
	},
};
export { ToolbarAppEventTarget, serverHelpers };
