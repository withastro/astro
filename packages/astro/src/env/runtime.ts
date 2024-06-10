import { AstroError, AstroErrorData } from '../core/errors/index.js';
export { validateEnvVariable } from './validators.js';

export type GetEnv = (key: string) => string | undefined;

let _getEnv: GetEnv = (key) => process.env[key];

export function setGetEnv(fn: GetEnv, reset = false) {
	_getEnv = fn;

	eventEmitter.publish(reset);
}

export function getEnv(...args: Parameters<GetEnv>) {
	return _getEnv(...args);
}

export function createInvalidVariableError(
	...args: Parameters<typeof AstroErrorData.EnvInvalidVariable.message>
) {
	return new AstroError({
		...AstroErrorData.EnvInvalidVariable,
		message: AstroErrorData.EnvInvalidVariable.message(...args),
	});
}

class EventEmitter extends EventTarget {
	publish(reset: boolean) {
		this.dispatchEvent(new CustomEvent('update', { detail: { reset } }));
	}
	subscribe(cb: (reset: boolean) => void) {
		this.addEventListener('update', (e) => cb((e as any).detail.reset));
	}
}

export const eventEmitter = new EventEmitter();
