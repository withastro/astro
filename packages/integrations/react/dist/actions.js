import { AstroError } from 'astro/errors';
function withState(action) {
	const callback = async function (state, formData) {
		formData.set('_astroActionState', JSON.stringify(state));
		return action(formData);
	};
	if (!('$$FORM_ACTION' in action)) return callback;
	callback.$$FORM_ACTION = action.$$FORM_ACTION;
	callback.$$IS_SIGNATURE_EQUAL = (incomingActionName) => {
		const actionName = new URLSearchParams(action.toString()).get('_action');
		return actionName === incomingActionName;
	};
	Object.defineProperty(callback, 'bind', {
		value: (...args) => injectStateIntoFormActionData(callback, ...args),
	});
	return callback;
}
async function getActionState({ request }) {
	const contentType = request.headers.get('Content-Type');
	if (!contentType || !isFormRequest(contentType)) {
		throw new AstroError(
			'`getActionState()` must be called with a form request.',
			"Ensure your action uses the `accept: 'form'` option.",
		);
	}
	const formData = await request.clone().formData();
	const state = formData.get('_astroActionState')?.toString();
	if (!state) {
		throw new AstroError(
			'`getActionState()` could not find a state object.',
			'Ensure your action was passed to `useActionState()` with the `withState()` wrapper.',
		);
	}
	return JSON.parse(state);
}
const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];
function isFormRequest(contentType) {
	const type = contentType.split(';')[0].toLowerCase();
	return formContentTypes.some((t) => type === t);
}
function injectStateIntoFormActionData(fn, ...args) {
	const boundFn = Function.prototype.bind.call(fn, ...args);
	Object.assign(boundFn, fn);
	const [, state] = args;
	if ('$$FORM_ACTION' in fn && typeof fn.$$FORM_ACTION === 'function') {
		const metadata = fn.$$FORM_ACTION();
		boundFn.$$FORM_ACTION = () => {
			const data = metadata.data ?? new FormData();
			data.set('_astroActionState', JSON.stringify(state));
			metadata.data = data;
			return metadata;
		};
	}
	return boundFn;
}
export { getActionState, withState };
