type NotificationPayload = {
	state: boolean;
	level: 'error' | 'warn' | 'info';
};

type AppToggledEvent = (opts: { state: boolean }) => void;

export class ToolbarAppEventTarget extends EventTarget {
	constructor() {
		super();
	}

	notify(options: NotificationPayload) {
		this.dispatchEvent(
			new CustomEvent('toggle-notification', {
				detail: {
					state: options.state,
					level: options.level,
				},
			})
		);
	}

	changeAppState(state: boolean) {
		this.dispatchEvent(
			new CustomEvent('app-toggled', {
				detail: {
					state,
				},
			})
		);
	}

	onAppToggled(cb: AppToggledEvent) {
		this.addEventListener('app-toggled', (evt) => {
			if (!(evt instanceof CustomEvent)) return;
			cb(evt.detail);
		});
	}
}

export const serverHelpers = {
	send: (event: string, payload: Record<string, any>) => {
		if (import.meta.hot) {
			import.meta.hot.send(event, payload);
		}
	},
	receive: <T>(event: string, cb: (data: T) => void) => {
		if (import.meta.hot) {
			import.meta.hot.on(event, cb);
		}
	},
};

export type ToolbarServerHelpers = typeof serverHelpers;
