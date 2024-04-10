type NotificationPayload = {
	state: true;
	level?: 'error' | 'warn' | 'info';
} | {
	state: false
};

type AppStatePayload = {
	state: boolean;
};

type AppToggledEvent = (opts: { state: boolean }) => void;

type ToolbarPlacementUpdatedEvent = (opts: { placement: 'bottom-left' | 'bottom-center' | 'bottom-right' }) => void;

export class ToolbarAppEventTarget extends EventTarget {
	constructor() {
		super();
	}

	toggleNotification(options: NotificationPayload) {
		this.dispatchEvent(
			new CustomEvent('toggle-notification', {
				detail: {
					state: options.state,
					level: options.state === true ? options.level : undefined,
				},
			})
		);
	}

	toggleAppState(options: AppStatePayload) {
		this.dispatchEvent(
			new CustomEvent('app-toggled', {
				detail: {
					state: options.state,
				},
			})
		);
	}

	onAppToggled(callback: AppToggledEvent) {
		this.addEventListener('app-toggled', (evt) => {
			if (!(evt instanceof CustomEvent)) return;
			callback(evt.detail);
		});
	}

	onToolbarPlacement(callback: ToolbarPlacementUpdatedEvent) {
		this.addEventListener('placement-updated', (evt) => {
			if (!(evt instanceof CustomEvent)) return;
			callback(evt.detail);
		});
	}
}

export const serverHelpers = {
	send: <T>(event: string, payload: T) => {
		if (import.meta.hot) {
			import.meta.hot.send(event, payload);
		}
	},
	on: <T>(event: string, cb: (data: T) => void) => {
		if (import.meta.hot) {
			import.meta.hot.on(event, cb);
		}
	},
};

export type ToolbarServerHelpers = typeof serverHelpers;
