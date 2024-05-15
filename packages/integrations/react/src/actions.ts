type FormFn<T> = (formData: FormData) => Promise<T>;

export function withState<T>(action: FormFn<T>) {
	const callback = async function (state: T, formData: FormData) {
		return action(formData);
	};
	if (!('$$FORM_ACTION' in action)) return callback;

	callback.$$FORM_ACTION = action.$$FORM_ACTION;
	callback.$$IS_SIGNATURE_EQUAL = (actionName: string) => {
		return action.toString() === actionName;
	};

	Object.defineProperty(callback, 'bind', {
		value: (...args: Parameters<typeof callback>) =>
			injectStateIntoFormActionData(callback, ...args),
	});
	return callback;
}

function injectStateIntoFormActionData<R extends [this: unknown, state: unknown, ...unknown[]]>(
	fn: (...args: R) => unknown,
	...args: R
) {
	const boundFn = Function.prototype.bind.call(fn, ...args);
	Object.assign(boundFn, fn);
	const [, state] = args;

	if ('$$FORM_ACTION' in fn && typeof fn.$$FORM_ACTION === 'function') {
		const metadata = fn.$$FORM_ACTION();
		boundFn.$$FORM_ACTION = () => {
			const data = (metadata.data as FormData) ?? new FormData();
			data.set('_astroActionState', JSON.stringify(state));
			metadata.data = data;

			return metadata;
		};
	}
	return boundFn;
}
