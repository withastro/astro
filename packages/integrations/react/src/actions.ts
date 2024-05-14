import { createContext, useContext } from 'react';

type FormFn<T> = (formData: FormData) => Promise<T>;

export const GetActionResultContext = createContext<
	undefined | ((action: FormFn<unknown>) => unknown)
>(undefined);

export function withState<T>(action: FormFn<T>) {
	const { $$FORM_ACTION } = action as any;
	const getActionResult = useContext(GetActionResultContext);
	console.log('getActionResult', getActionResult);

	const callback = async function (state: T, formData: FormData) {
		formData.set('state', JSON.stringify(state));
		return action(formData);
	};
	Object.assign(callback, {
		$$FORM_ACTION: () => {
			const formActionMetadata = $$FORM_ACTION();
			if (!getActionResult) return formActionMetadata;
			const result = getActionResult(action);
			if (!result) return formActionMetadata;

			const data = formActionMetadata.data ?? new FormData();
			data.set('state', JSON.stringify(result));
			Object.assign(formActionMetadata, { data });

			return formActionMetadata;
		},
	});
	Object.defineProperty(callback, 'bind', {
		value: (...args: Parameters<typeof callback>) => preserveFormActions(callback, ...args),
	});
	return callback;
}

function preserveFormActions<R extends [this: unknown, ...unknown[]]>(
	fn: (...args: R) => unknown,
	...args: R
) {
	const boundFn = Function.prototype.bind.call(fn, ...args);
	Object.assign(boundFn, fn);
	return boundFn;
}
