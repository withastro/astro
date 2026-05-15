/**
 * React.memo is the modern functional equivalent of shouldComponentUpdate.
 *
 * By returning `true` in the comparison function (the second argument),
 * we tell React that the props are "equal" and it should skip re-rendering,
 * effectively making this subtree static.
 */
declare const _default: import('react').MemoExoticComponent<
	({ value, name, hydrate }: { value: string | null; name?: string; hydrate?: boolean }) =>
		| import('react').DOMElement<
				{
					name: string | undefined;
					suppressHydrationWarning: boolean;
					dangerouslySetInnerHTML: {
						__html: string;
					};
				},
				Element
		  >
		| null
>;
export default _default;
