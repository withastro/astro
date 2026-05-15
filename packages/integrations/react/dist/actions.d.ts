type FormFn<T> = (formData: FormData) => Promise<T>;
/**
 * Use an Astro Action with React `useActionState()`.
 * This function matches your action to the expected types,
 * and preserves metadata for progressive enhancement.
 * To read state from your action handler, use {@linkcode getActionState}.
 */
export declare function withState<T>(action: FormFn<T>): {
	(state: T, formData: FormData): Promise<T>;
	$$FORM_ACTION: unknown;
	$$IS_SIGNATURE_EQUAL(incomingActionName: string): boolean;
};
/**
 * Retrieve the state object from your action handler when using `useActionState()`.
 * To ensure this state is retrievable, use the {@linkcode withState} helper.
 */
export declare function getActionState<T>({ request }: { request: Request }): Promise<T>;
export {};
