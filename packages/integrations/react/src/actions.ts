import { AstroError } from 'astro/errors';

type FormFn<T> = (formData: FormData) => Promise<T>;

export function withState<T>(action: FormFn<T>) {
	const callback = async function (state: T, formData: FormData) {
		formData.set('_astroActionState', JSON.stringify(state));
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

export async function getActionState<T>({ request }: { request: Request }): Promise<T> {
	const contentType = request.headers.get('Content-Type');
	if (!contentType || !isFormRequest(contentType)) {
		throw new AstroError(
			'`getActionState()` must be called with a form request.',
			"Ensure your action uses the `accept: 'form'` option."
		);
	}
	const formData = await request.clone().formData();
	const state = formData.get('_astroActionState')?.toString();
	if (!state) {
		throw new AstroError(
			'`getActionState()` could not find a state object.',
			'Ensure your action was passed to `useActionState()` with the `withState()` wrapper.'
		);
	}
	return JSON.parse(state) as T;
}

const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

function isFormRequest(contentType: string) {
	// Split off parameters like charset or boundary
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type#content-type_in_html_forms
	const type = contentType.split(';')[0].toLowerCase();

	return formContentTypes.some((t) => type === t);
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
