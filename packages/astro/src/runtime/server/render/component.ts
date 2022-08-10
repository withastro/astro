import type { AstroComponentMetadata, SSRLoadedRenderer, SSRResult } from '../../../@types/astro';
import type { RenderInstruction } from './types.js';

import { markHTMLString } from '../escape.js';
import { extractDirectives, generateHydrateScript } from '../hydration.js';
import { serializeProps } from '../serialize.js';
import { shorthash } from '../shorthash.js';
import { renderSlot } from './any.js';
import { renderAstroComponent, renderTemplate, renderToIterable } from './astro.js';
import { Fragment, Renderer } from './common.js';
import { componentIsHTMLElement, renderHTMLElement } from './dom.js';
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
			return ['@astrojs/react', '@astrojs/preact'];
		default:
			return ['@astrojs/react', '@astrojs/preact', '@astrojs/vue', '@astrojs/svelte'];
	}
}

type ComponentType = 'fragment' | 'html' | 'astro-factory' | 'unknown';

function getComponentType(Component: unknown): ComponentType {
	if (Component === Fragment) {
		return 'fragment';
	}
	if (Component && typeof Component === 'object' && (Component as any)['astro:html']) {
		return 'html';
	}
	if (Component && (Component as any).isAstroComponentFactory) {
		return 'astro-factory';
	}
	return 'unknown';
}

export async function renderComponent(
	result: SSRResult,
	displayName: string,
	Component: unknown,
	_props: Record<string | number, any>,
	slots: any = {}
): Promise<string | AsyncIterable<string | RenderInstruction>> {
	Component = await Component;

	switch (getComponentType(Component)) {
		case 'fragment': {
			const children = await renderSlot(result, slots?.default);
			if (children == null) {
				return children;
			}
			return markHTMLString(children);
		}

		// .html components
		case 'html': {
			const children: Record<string, string> = {};
			if (slots) {
				await Promise.all(
					Object.entries(slots).map(([key, value]) =>
						renderSlot(result, value as string).then((output) => {
							children[key] = output;
						})
					)
				);
			}
			const html = (Component as any).render({ slots: children });
			return markHTMLString(html);
		}

		case 'astro-factory': {
			async function* renderAstroComponentInline(): AsyncGenerator<
				string | RenderInstruction,
				void,
				undefined
			> {
				let iterable = await renderToIterable(result, Component as any, displayName, _props, slots);
				yield* iterable;
			}

			return renderAstroComponentInline();
		}
	}

	if (!Component && !_props['client:only']) {
		throw new Error(
			`Unable to render ${displayName} because it is ${Component}!\nDid you forget to import the component or is it possible there is a typo?`
		);
	}

	const { renderers } = result._metadata;
	const metadata: AstroComponentMetadata = { displayName };

	const { hydration, isPage, props } = extractDirectives(_props);
	let html = '';
	let attrs: Record<string, string> | undefined = undefined;

	if (hydration) {
		metadata.hydrate = hydration.directive as AstroComponentMetadata['hydrate'];
		metadata.hydrateArgs = hydration.value;
		metadata.componentExport = hydration.componentExport;
		metadata.componentUrl = hydration.componentUrl;
	}
	const probableRendererNames = guessRenderers(metadata.componentUrl);

	if (
		Array.isArray(renderers) &&
		renderers.length === 0 &&
		typeof Component !== 'string' &&
		!componentIsHTMLElement(Component)
	) {
		const message = `Unable to render ${metadata.displayName}!

There are no \`integrations\` set in your \`astro.config.mjs\` file.
Did you mean to add ${formatList(probableRendererNames.map((r) => '`' + r + '`'))}?`;
		throw new Error(message);
	}

	const children: Record<string, string> = {};
	if (slots) {
		await Promise.all(
			Object.entries(slots).map(([key, value]) =>
				renderSlot(result, value as string).then((output) => {
					children[key] = output;
				})
			)
		);
	}

	// Call the renderers `check` hook to see if any claim this component.
	let renderer: SSRLoadedRenderer | undefined;
	if (metadata.hydrate !== 'only') {
		// If this component ran through `__astro_tag_component__`, we already know
		// which renderer to match to and can skip the usual `check` calls.
		// This will help us throw most relevant error message for modules with runtime errors
		if (Component && (Component as any)[Renderer]) {
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
		if (!renderer && renderers.length === 1) {
			renderer = renderers[0];
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
			// TODO: improve error message
			throw new Error(`Unable to render ${metadata.displayName}!

Using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.
Did you mean to pass <${metadata.displayName} client:only="${probableRendererNames
				.map((r) => r.replace('@astrojs/', ''))
				.join('|')}" />
`);
		} else if (typeof Component !== 'string') {
			const matchingRenderers = renderers.filter((r) => probableRendererNames.includes(r.name));
			const plural = renderers.length > 1;
			if (matchingRenderers.length === 0) {
				throw new Error(`Unable to render ${metadata.displayName}!

There ${plural ? 'are' : 'is'} ${renderers.length} renderer${
					plural ? 's' : ''
				} configured in your \`astro.config.mjs\` file,
but ${plural ? 'none were' : 'it was not'} able to server-side render ${metadata.displayName}.

Did you mean to enable ${formatList(probableRendererNames.map((r) => '`' + r + '`'))}?`);
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
			html = await renderSlot(result, slots?.fallback);
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
		throw new Error(
			`${metadata.displayName} component has a \`client:${metadata.hydrate}\` directive, but no client entrypoint was provided by ${renderer.name}!`
		);
	}

	// This is a custom element without a renderer. Because of that, render it
	// as a string and the user is responsible for adding a script tag for the component definition.
	if (!html && typeof Component === 'string') {
		const childSlots = Object.values(children).join('');
		const iterable = renderAstroComponent(
			await renderTemplate`<${Component}${internalSpreadAttributes(props)}${markHTMLString(
				childSlots === '' && voidElementNames.test(Component)
					? `/>`
					: `>${childSlots}</${Component}>`
			)}`
		);
		html = '';
		for await (const chunk of iterable) {
			html += chunk;
		}
	}

	if (!hydration) {
		if (isPage || renderer?.name === 'astro:jsx') {
			return html;
		}
		return markHTMLString(html.replace(/\<\/?astro-slot\>/g, ''));
	}

	// Include componentExport name, componentUrl, and props in hash to dedupe identical islands
	const astroId = shorthash(
		`<!--${metadata.componentExport!.value}:${metadata.componentUrl}-->\n${html}\n${serializeProps(
			props
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
				if (!html.includes(key === 'default' ? `<astro-slot>` : `<astro-slot name="${key}">`)) {
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
		yield { type: 'directive', hydration, result };
		yield markHTMLString(renderElement('astro-island', island, false));
	}

	return renderAll();
}
