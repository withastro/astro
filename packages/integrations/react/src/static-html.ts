import { createElement as h, memo } from 'react';

/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * As a bonus, we can signal to React that this subtree is
 * entirely static and will never change via `shouldComponentUpdate`.
 */
const StaticHtml = ({
	value,
	name,
	hydrate = true,
}: {
	value: string | null;
	name?: string;
	hydrate?: boolean;
}) => {
	if (!value) return null;
	const tagName = hydrate ? 'astro-slot' : 'astro-static-slot';
	return h(tagName, {
		name,
		suppressHydrationWarning: true,
		dangerouslySetInnerHTML: { __html: value },
	});
};

/**
 * React.memo is the modern functional equivalent of shouldComponentUpdate.
 * 
 * By returning `true` in the comparison function (the second argument),
 * we tell React that the props are "equal" and it should skip re-rendering,
 * effectively making this subtree static.
 */
export default memo(StaticHtml, () => true);
