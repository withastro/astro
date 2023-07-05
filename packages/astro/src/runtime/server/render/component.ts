import type { AstroComponentMetadata, SSRLoadedRenderer, SSRResult } from '../../../@types/astro';
import type { RenderInstruction } from './types.js';

import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import { HTMLBytes, markHTMLString } from '../escape.js';
import { extractDirectives, generateHydrateScript } from '../hydration.js';
import { serializeProps } from '../serialize.js';
import { shorthash } from '../shorthash.js';
import { isPromise } from '../util.js';
import {
	createAstroComponentInstance,
	isAstroComponentFactory,
	isAstroComponentInstance,
	renderAstroTemplateResult,
	renderTemplate,
	type AstroComponentInstance,
} from './astro/index.js';
import { Fragment, Renderer, stringifyChunk } from './common.js';
import { componentIsHTMLElement, renderHTMLElement } from './dom.js';
import { renderSlots, renderSlotToString, type ComponentSlots } from './slot.js';
import { formatList, internalSpreadAttributes, renderElement, voidElementNames } from './util.js';

const rendererAliases = new Map([['solid', 'solid-js']]);

function guessRenderers(componentUrl?: string): string[] {
	const extname = componentUrl?.split('.').pop();
	switch (extname) {
		case 'svelte':
			return ['@astrojs/svelte'];
		case 'vue':
			return ['@astrojs/vue'];
		case 'jsx':
		case 'tsx':
			return ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js', '@astrojs/vue (jsx)'];
		default:
			return [
				'@astrojs/react',
				'@astrojs/preact',
				'@astrojs/solid-js',
				'@astrojs/vue',
				'@astrojs/svelte',
				'@astrojs/lit',
			];
	}
}

export type ComponentIterable = AsyncIterable<string | HTMLBytes | RenderInstruction>;

function isFragmentComponent(Component: unknown) {
	return Component === Fragment;
}

function isHTMLComponent(Component: unknown) {
	return Component && (Component as any)['astro:html'] === true;
}

const ASTRO_SLOT_EXP = /\<\/?astro-slot\b[^>]*>/g;
const ASTRO_STATIC_SLOT_EXP = /\<\/?astro-static-slot\b[^>]*>/g;
function removeStaticAstroSlot(html: string, supportsAstroStaticSlot: boolean) {
	const exp = supportsAstroStaticSlot ? ASTRO_STATIC_SLOT_EXP : ASTRO_SLOT_EXP;
	return html.replace(exp, '');
}

async function renderFrameworkComponent(
	result: SSRResult,
	displayName: string,
	Component: unknown,
	_props: Record<string | number, any>,
	slots: any = {}
): Promise<ComponentIterable> {
	if (!Component && !_props['client:only']) {
		throw new Error(
			`Unable to render ${displayName} because it is ${Component}!\nDid you forget to import the component or is it possible there is a typo?`
		);
	}

	const { renderers, clientDirectives } = result;
	const metadata: AstroComponentMetadata = {
		astroStaticSlot: true,
		displayName,
	};

	const { hydration, isPage, props } = extractDirectives(_props, clientDirectives);
	let html = '';
	let attrs: Record<string, string> | undefined = undefined;

	if (hydration) {
		metadata.hydrate = hydration.directive as AstroComponentMetadata['hydrate'];
		metadata.hydrateArgs = hydration.value;
		metadata.componentExport = hydration.componentExport;
		metadata.componentUrl = hydration.componentUrl;
	}

	const probableRendererNames = guessRenderers(metadata.componentUrl);
	const validRenderers = renderers.filter((r) => r.name !== 'astro:jsx');
	const { children, slotInstructions } = await renderSlots(result, slots);

	// Call the renderers `check` hook to see if any claim this component.
	let renderer: SSRLoadedRenderer | undefined;
	if (metadata.hydrate !== 'only') {
		// If this component ran through `__astro_tag_component__`, we already know
		// which renderer to match to and can skip the usual `check` calls.
		// This will help us throw most relevant error message for modules with runtime errors
		let isTagged = false;
		try {
			isTagged = Component && (Component as any)[Renderer];
		} catch {
			// Accessing `Component[Renderer]` may throw if `Component` is a Proxy that doesn't
			// return the actual read-only value. In this case, ignore.
		}
		if (isTagged) {
			const rendererName = (Component as any)[Renderer];
			renderer = renderers.find(({ name }) => name === rendererName);
		}

		if (!renderer) {
			let error;
			for (const r of renderers) {
				try {
					if (await r.ssr.check.call({ result }, Component, props, children)) {
						renderer = r;
						break;
					}
				} catch (e) {
					error ??= e;
				}
			}

			// If no renderer is found and there is an error, throw that error because
			// it is likely a problem with the component code.
			if (!renderer && error) {
				throw error;
			}
		}

		if (!renderer && typeof HTMLElement === 'function' && componentIsHTMLElement(Component)) {
			const output = renderHTMLElement(result, Component as typeof HTMLElement, _props, slots);

			return output;
		}
	} else {
		// Attempt: use explicitly passed renderer name
		if (metadata.hydrateArgs) {
			const passedName = metadata.hydrateArgs;
			const rendererName = rendererAliases.has(passedName)
				? rendererAliases.get(passedName)
				: passedName;
			renderer = renderers.find(
				({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
			);
		}
		// Attempt: user only has a single renderer, default to that
		if (!renderer && validRenderers.length === 1) {
			renderer = validRenderers[0];
		}
		// Attempt: can we guess the renderer from the export extension?
		if (!renderer) {
			const extname = metadata.componentUrl?.split('.').pop();
			renderer = renderers.filter(
				({ name }) => name === `@astrojs/${extname}` || name === extname
			)[0];
		}
	}

	// If no one claimed the renderer
	if (!renderer) {
		if (metadata.hydrate === 'only') {
			throw new AstroError({
				...AstroErrorData.NoClientOnlyHint,
				message: AstroErrorData.NoClientOnlyHint.message(metadata.displayName),
				hint: AstroErrorData.NoClientOnlyHint.hint(
					probableRendererNames.map((r) => r.replace('@astrojs/', '')).join('|')
				),
			});
		} else if (typeof Component !== 'string') {
			const matchingRenderers = validRenderers.filter((r) =>
				probableRendererNames.includes(r.name)
			);
			const plural = validRenderers.length > 1;
			if (matchingRenderers.length === 0) {
				throw new AstroError({
					...AstroErrorData.NoMatchingRenderer,
					message: AstroErrorData.NoMatchingRenderer.message(
						metadata.displayName,
						metadata?.componentUrl?.split('.').pop(),
						plural,
						validRenderers.length
					),
					hint: AstroErrorData.NoMatchingRenderer.hint(
						formatList(probableRendererNames.map((r) => '`' + r + '`'))
					),
				});
			} else if (matchingRenderers.length === 1) {
				// We already know that renderer.ssr.check() has failed
				// but this will throw a much more descriptive error!
				renderer = matchingRenderers[0];
				({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
					{ result },
					Component,
					props,
					children,
					metadata
				));
			} else {
				throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
			}
		}
	} else {
		if (metadata.hydrate === 'only') {
			html = await renderSlotToString(result, slots?.fallback);
		} else {
			({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
				{ result },
				Component,
				props,
				children,
				metadata
			));
		}
	}

	// HACK! The lit renderer doesn't include a clientEntrypoint for custom elements, allow it
	// to render here until we find a better way to recognize when a client entrypoint isn't required.
	if (
		renderer &&
		!renderer.clientEntrypoint &&
		renderer.name !== '@astrojs/lit' &&
		metadata.hydrate
	) {
		throw new AstroError({
			...AstroErrorData.NoClientEntrypoint,
			message: AstroErrorData.NoClientEntrypoint.message(
				displayName,
				metadata.hydrate,
				renderer.name
			),
		});
	}

	// This is a custom element without a renderer. Because of that, render it
	// as a string and the user is responsible for adding a script tag for the component definition.
	if (!html && typeof Component === 'string') {
		// Sanitize tag name because some people might try to inject attributes 🙄
		const Tag = sanitizeElementName(Component);
		const childSlots = Object.values(children).join('');
		const iterable = renderAstroTemplateResult(
			await renderTemplate`<${Tag}${internalSpreadAttributes(props)}${markHTMLString(
				childSlots === '' && voidElementNames.test(Tag) ? `/>` : `>${childSlots}</${Tag}>`
			)}`
		);
		html = '';
		for await (const chunk of iterable) {
			html += chunk;
		}
	}

	if (!hydration) {
		return (async function* () {
			if (slotInstructions) {
				yield* slotInstructions;
			}

			if (isPage || renderer?.name === 'astro:jsx') {
				yield html;
			} else if (html && html.length > 0) {
				yield markHTMLString(
					removeStaticAstroSlot(html, renderer?.ssr?.supportsAstroStaticSlot ?? false)
				);
			} else {
				yield '';
			}
		})();
	}

	// Include componentExport name, componentUrl, and props in hash to dedupe identical islands
	const astroId = shorthash(
		`<!--${metadata.componentExport!.value}:${metadata.componentUrl}-->\n${html}\n${serializeProps(
			props,
			metadata
		)}`
	);

	const island = await generateHydrateScript(
		{ renderer: renderer!, result, astroId, props, attrs },
		metadata as Required<AstroComponentMetadata>
	);

	// Render template if not all astro fragments are provided.
	let unrenderedSlots: string[] = [];
	if (html) {
		if (Object.keys(children).length > 0) {
			for (const key of Object.keys(children)) {
				let tagName = renderer?.ssr?.supportsAstroStaticSlot
					? !!metadata.hydrate
						? 'astro-slot'
						: 'astro-static-slot'
					: 'astro-slot';
				let expectedHTML = key === 'default' ? `<${tagName}>` : `<${tagName} name="${key}">`;
				if (!html.includes(expectedHTML)) {
					unrenderedSlots.push(key);
				}
			}
		}
	} else {
		unrenderedSlots = Object.keys(children);
	}
	const template =
		unrenderedSlots.length > 0
			? unrenderedSlots
					.map(
						(key) =>
							`<template data-astro-template${key !== 'default' ? `="${key}"` : ''}>${
								children[key]
							}</template>`
					)
					.join('')
			: '';

	island.children = `${html ?? ''}${template}`;

	if (island.children) {
		island.props['await-children'] = '';
	}

	async function* renderAll() {
		if (slotInstructions) {
			yield* slotInstructions;
		}
		yield { type: 'directive', hydration, result };
		yield markHTMLString(renderElement('astro-island', island, false));
	}

	return renderAll();
}

function sanitizeElementName(tag: string) {
	const unsafe = /[&<>'"\s]+/g;
	if (!unsafe.test(tag)) return tag;
	return tag.trim().split(unsafe)[0].trim();
}

async function renderFragmentComponent(result: SSRResult, slots: ComponentSlots = {}) {
	const children = await renderSlotToString(result, slots?.default);
	if (children == null) {
		return children;
	}
	return markHTMLString(children);
}

async function renderHTMLComponent(
	result: SSRResult,
	Component: unknown,
	_props: Record<string | number, any>,
	slots: any = {}
) {
	const { slotInstructions, children } = await renderSlots(result, slots);
	const html = (Component as any)({ slots: children });
	const hydrationHtml = slotInstructions
		? slotInstructions.map((instr) => stringifyChunk(result, instr)).join('')
		: '';
	return markHTMLString(hydrationHtml + html);
}

export function renderComponent(
	result: SSRResult,
	displayName: string,
	Component: unknown,
	props: Record<string | number, any>,
	slots: any = {}
): Promise<ComponentIterable> | ComponentIterable | AstroComponentInstance {
	if (isPromise(Component)) {
		return Promise.resolve(Component).then((Unwrapped) => {
			return renderComponent(result, displayName, Unwrapped, props, slots) as any;
		});
	}

	if (isFragmentComponent(Component)) {
		return renderFragmentComponent(result, slots);
	}

	// .html components
	if (isHTMLComponent(Component)) {
		return renderHTMLComponent(result, Component, props, slots);
	}

	if (isAstroComponentFactory(Component)) {
		return createAstroComponentInstance(result, displayName, Component, props, slots);
	}

	return renderFrameworkComponent(result, displayName, Component, props, slots);
}

export function renderComponentToIterable(
	result: SSRResult,
	displayName: string,
	Component: unknown,
	props: Record<string | number, any>,
	slots: any = {}
): Promise<ComponentIterable> | ComponentIterable {
	const renderResult = renderComponent(result, displayName, Component, props, slots);
	if (isAstroComponentInstance(renderResult)) {
		return renderResult.render();
	}
	return renderResult;
}
