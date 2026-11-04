import type { RouteData, SSRResult } from '../../../types/public/internal.js';
import { isRoute404, isRoute500 } from '../../../core/routing/internal/route-errors.js';
import { isPropagatingHint } from '../../../core/head-propagation/resolver.js';
import { renderToAsyncIterable, renderToReadableStream, renderToString } from './astro/render.js';
import { encoder } from './common.js';
import { type NonAstroPageComponent, renderComponentToString } from './component.js';
import { renderCspContent } from './csp.js';
import { renderCspMetaTag } from './head.js';
import type { AstroComponentFactory } from './index.js';
import { isDeno, isNode, isWorkerd } from './util.js';
import { isAstroComponentFactory } from './astro/factory.js';

// Components rendered after the head can still insert CSP hashes, so for pages rendered to a
// string the head writes a placeholder that is replaced with the real `<meta>` element once the
// whole page has rendered (https://github.com/withastro/astro/issues/18479). It is set before
// rendering starts, because the head can already be rendered while buffering propagated head content.
function setCspMetaPlaceholder(result: SSRResult): string | undefined {
	if (result.shouldInjectCspMetaTags && result.cspDestination === 'meta') {
		result._metadata.cspMetaPlaceholder = `<!--astro-csp-meta-${crypto.randomUUID()}-->`;
	}
	return result._metadata.cspMetaPlaceholder;
}

const HTML_WHITESPACE = /[\t\n\f\r ]/;
const TAG_NAME_END = /[\t\n\f\r />]/;
const ATTR_NAME_END = /[\t\n\f\r />=]/;
const UNQUOTED_ATTR_VALUE_END = /[\t\n\f\r >]/;

interface StartTag {
	name: string;
	attributes: Map<string, string>;
	end: number;
}

/**
 * Reads the start tag at `start` following the HTML tokenizer rules, so that `>` inside quoted
 * attribute values does not end the tag. Returns `undefined` if there is no complete start tag
 * before `limit`.
 */
function readStartTag(html: string, start: number, limit: number): StartTag | undefined {
	if (html[start] !== '<' || !/[a-z]/i.test(html[start + 1] ?? '')) return undefined;
	let i = start + 1;
	while (i < limit && !TAG_NAME_END.test(html[i])) i++;
	const name = html.slice(start + 1, i).toLowerCase();
	const attributes = new Map<string, string>();
	while (i < limit) {
		if (HTML_WHITESPACE.test(html[i]) || html[i] === '/') {
			i++;
			continue;
		}
		if (html[i] === '>') return { name, attributes, end: i + 1 };
		const nameStart = i++;
		while (i < limit && !ATTR_NAME_END.test(html[i])) i++;
		const attributeName = html.slice(nameStart, i).toLowerCase();
		while (i < limit && HTML_WHITESPACE.test(html[i])) i++;
		let value = '';
		if (html[i] === '=') {
			i++;
			while (i < limit && HTML_WHITESPACE.test(html[i])) i++;
			const quote = html[i];
			if (quote === '"' || quote === "'") {
				const close = html.indexOf(quote, i + 1);
				if (close === -1 || close >= limit) return undefined;
				value = html.slice(i + 1, close);
				i = close + 1;
			} else {
				const valueStart = i;
				while (i < limit && !UNQUOTED_ATTR_VALUE_END.test(html[i])) i++;
				value = html.slice(valueStart, i);
			}
		}
		if (!attributes.has(attributeName)) attributes.set(attributeName, value);
	}
	return undefined;
}

/**
 * Returns the end of the comment, doctype or other markup declaration at `start`, or `undefined` if
 * there is none ending before `limit`. These are inert, so content can be inserted around them.
 */
function skipMarkupDeclaration(html: string, start: number, limit: number): number | undefined {
	let end = -1;
	if (html.startsWith('<!--', start)) {
		const contentStart = start + 4;
		if (html[contentStart] === '>') return contentStart + 1;
		if (html.startsWith('->', contentStart)) return contentStart + 2;
		const dashEnd = html.indexOf('-->', contentStart);
		const bangEnd = html.indexOf('--!>', contentStart);
		if (dashEnd !== -1 && (bangEnd === -1 || dashEnd < bangEnd)) end = dashEnd + 3;
		else if (bangEnd !== -1) end = bangEnd + 4;
	} else if (html.startsWith('<!', start) || html.startsWith('<?', start)) {
		// Doctype or bogus comment, both end at the first `>`.
		const close = html.indexOf('>', start);
		if (close !== -1) end = close + 1;
	}
	return end !== -1 && end <= limit ? end : undefined;
}

function isCharsetDeclaration(tag: StartTag): boolean {
	if (tag.name !== 'meta') return false;
	if (tag.attributes.has('charset')) return true;
	return (
		tag.attributes.get('http-equiv')?.toLowerCase() === 'content-type' &&
		/charset/i.test(tag.attributes.get('content') ?? '')
	);
}

/**
 * Finds where the CSP `<meta>` must go so the policy covers everything in `<head>`: right after the
 * `<head>` start tag, or after an encoding declaration that is the first element of `<head>` (it
 * must stay within the first 1024 bytes). Only the document prologue is read, as tokens rather than
 * raw text, so markup-like text in comments, attributes or scripts is never mistaken for a tag.
 * Returns `undefined` when `<head>` is not the first element before `limit`; the policy then stays
 * where `renderHead()` placed it.
 */
function findCspMetaInsertionIndex(html: string, limit: number): number | undefined {
	let headEnd: number | undefined;
	let i = 0;
	while (i < limit) {
		if (HTML_WHITESPACE.test(html[i])) {
			i++;
			continue;
		}
		const declarationEnd = skipMarkupDeclaration(html, i, limit);
		if (declarationEnd !== undefined) {
			i = declarationEnd;
			continue;
		}
		const tag = readStartTag(html, i, limit);
		if (headEnd !== undefined) {
			return tag && isCharsetDeclaration(tag) ? tag.end : headEnd;
		}
		if (tag?.name === 'html') {
			i = tag.end;
		} else if (tag?.name === 'head') {
			i = headEnd = tag.end;
		} else {
			return undefined;
		}
	}
	return headEnd;
}

// The placeholder sits where the compiler calls `renderHead()`, at the end of `<head>`. A `<meta>`
// policy only applies to content parsed after it, so the element is moved to the start of `<head>`
// to cover user head content. See https://github.com/withastro/astro/issues/18606
function replaceCspMetaPlaceholder(
	result: SSRResult,
	placeholder: string | undefined,
	html: string,
): string {
	if (!placeholder) return html;
	const placeholderIndex = html.indexOf(placeholder);
	if (placeholderIndex === -1) return html;
	const metaTag = renderCspMetaTag(result);
	const afterPlaceholder = html.slice(placeholderIndex + placeholder.length);
	const insertIndex = findCspMetaInsertionIndex(html, placeholderIndex) ?? placeholderIndex;
	return (
		html.slice(0, insertIndex) +
		metaTag +
		html.slice(insertIndex, placeholderIndex) +
		afterPlaceholder
	);
}

export async function renderPage(
	result: SSRResult,
	componentFactory: AstroComponentFactory | NonAstroPageComponent,
	props: any,
	children: any,
	streaming: boolean,
	route?: RouteData,
): Promise<Response> {
	if (!isAstroComponentFactory(componentFactory)) {
		const nonAstroMeta = result.componentMetadata.get((componentFactory as any).moduleId);
		result._metadata.headInTree = nonAstroMeta?.containsHead ?? false;
		result._metadata.routeHasPropagation = isPropagatingHint(nonAstroMeta?.propagation ?? 'none');

		const pageProps: Record<string, any> = { ...(props ?? {}), 'server:root': true };

		// Non-Astro page components (MDX, `.html`, and raw framework components
		// rendered through the Container API) go through `renderComponentToString`,
		// which dispatches to the correct renderer: the `astro:jsx` renderer for
		// MDX (which also wraps runtime errors with a helpful hint and streams the
		// content), the HTML renderer for `.html`, and framework renderers for
		// components. It also injects the `<head>` for layout-less MDX pages.
		const cspMetaPlaceholder = setCspMetaPlaceholder(result);
		let str = await renderComponentToString(
			result,
			(componentFactory as NonAstroPageComponent).name,
			componentFactory,
			pageProps,
			{},
			true,
			route,
		);
		str = replaceCspMetaPlaceholder(result, cspMetaPlaceholder, str);

		const bytes = encoder.encode(str);
		const headers = new Headers([
			['Content-Type', 'text/html'],
			['Content-Length', bytes.byteLength.toString()],
		]);
		if (
			result.shouldInjectCspMetaTags &&
			(result.cspDestination === 'header' || result.cspDestination === 'adapter')
		) {
			headers.set('content-security-policy', renderCspContent(result));
		}

		return new Response(bytes, {
			headers,
			status: result.response.status,
		});
	}

	// Mark if this page component contains a <head> within its tree. If it does
	// We avoid implicit head injection entirely.
	const pageMeta = result.componentMetadata.get(componentFactory.moduleId!);
	result._metadata.headInTree = pageMeta?.containsHead ?? false;
	// Only routes on a propagation path need to await async slot pre-renders
	// before flushing the head (see `collectPropagatedHeadParts`). Other routes
	// keep streaming without blocking the head on unrelated markup `await`s.
	result._metadata.routeHasPropagation = isPropagatingHint(pageMeta?.propagation ?? 'none');

	let body: BodyInit | Response;
	if (streaming) {
		// isNode is true in Deno's and workerd's node-compat modes, but their
		// Response constructors do not accept AsyncIterable bodies (a non-standard
		// Node.js extension). Deno falls back to ReadableStream entirely; workerd
		// keeps the faster AsyncIterable render path and wraps the result with
		// ReadableStream.from() so the Response constructor receives a standard type.
		if (isNode && !isDeno) {
			const nodeBody = await renderToAsyncIterable(
				result,
				componentFactory,
				props,
				children,
				true,
				route,
			);
			if (isWorkerd && !(nodeBody instanceof Response)) {
				// ReadableStream.from() is available in Node >= 20.6 and workerd but
				// is not yet in TypeScript's built-in DOM lib types.
				body = (ReadableStream as any).from(nodeBody);
			} else {
				// Node.js allows passing in an AsyncIterable to the Response constructor.
				// This is non-standard so using `any` here to preserve types everywhere else.
				body = nodeBody as any;
			}
		} else {
			body = await renderToReadableStream(result, componentFactory, props, children, true, route);
		}
	} else {
		const cspMetaPlaceholder = setCspMetaPlaceholder(result);
		body = await renderToString(result, componentFactory, props, children, true, route);
		if (typeof body === 'string') {
			body = replaceCspMetaPlaceholder(result, cspMetaPlaceholder, body);
		}
	}

	// If the Astro component returns a Response on init, return that response
	if (body instanceof Response) return body;

	// Create final response from body
	const init = result.response;
	const headers = new Headers(init.headers);
	if (
		(result.shouldInjectCspMetaTags && result.cspDestination === 'header') ||
		result.cspDestination === 'adapter'
	) {
		headers.set('content-security-policy', renderCspContent(result));
	}

	// For non-streaming, convert string to byte array to calculate Content-Length
	if (!streaming && typeof body === 'string') {
		body = encoder.encode(body);
		headers.set('Content-Length', body.byteLength.toString());
	}
	let status = init.status;
	let statusText = init.statusText;
	// Custom root 404.astro and 500.astro routes must return fixed status codes.
	if (route?.route && isRoute404(route.route)) {
		status = 404;
		if (statusText === 'OK') {
			statusText = 'Not Found';
		}
	} else if (route?.route && isRoute500(route.route)) {
		status = 500;
		if (statusText === 'OK') {
			statusText = 'Internal Server Error';
		}
	}

	if (status) {
		return new Response(body, { ...init, headers, status, statusText });
	} else {
		return new Response(body, { ...init, headers });
	}
}
