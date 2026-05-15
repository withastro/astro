import { clsx } from 'clsx';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import { escapeHTML, markHTMLString } from '../escape.js';
import { extractDirectives, generateHydrateScript } from '../hydration.js';
import { serializeProps } from '../serialize.js';
import { shorthash } from '../shorthash.js';
import { isPromise } from '../util.js';
import { isAstroComponentFactory } from './astro/factory.js';
import { renderTemplate } from './astro/index.js';
import { createAstroComponentInstance } from './astro/instance.js';
import { bufferHeadContent } from './astro/render.js';
import { chunkToString, Fragment, Renderer } from './common.js';
import { componentIsHTMLElement, renderHTMLElement } from './dom.js';
import { maybeRenderHead } from './head.js';
import { createRenderInstruction } from './instruction.js';
import { containsServerDirective, ServerIslandComponent } from './server-islands.js';
import { renderSlot, renderSlots, renderSlotToString } from './slot.js';
import { formatList, internalSpreadAttributes, renderElement, voidElementNames } from './util.js';
const needsHeadRenderingSymbol = /* @__PURE__ */ Symbol.for('astro.needsHeadRendering');
const rendererAliases = /* @__PURE__ */ new Map([['solid', 'solid-js']]);
const clientOnlyValues = /* @__PURE__ */ new Set(['solid-js', 'react', 'preact', 'vue', 'svelte']);
function guessRenderers(componentUrl) {
	const extname = componentUrl?.split('.').pop();
	switch (extname) {
		case 'svelte':
			return ['@astrojs/svelte'];
		case 'vue':
			return ['@astrojs/vue'];
		case 'jsx':
		case 'tsx':
			return ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js', '@astrojs/vue (jsx)'];
		case void 0:
		default:
			return [
				'@astrojs/react',
				'@astrojs/preact',
				'@astrojs/solid-js',
				'@astrojs/vue',
				'@astrojs/svelte',
			];
	}
}
function isFragmentComponent(Component) {
	return Component === Fragment;
}
function isHTMLComponent(Component) {
	return Component && Component['astro:html'] === true;
}
const ASTRO_SLOT_EXP = /<\/?astro-slot\b[^>]*>/g;
const ASTRO_STATIC_SLOT_EXP = /<\/?astro-static-slot\b[^>]*>/g;
function removeStaticAstroSlot(html, supportsAstroStaticSlot = true) {
	const exp = supportsAstroStaticSlot ? ASTRO_STATIC_SLOT_EXP : ASTRO_SLOT_EXP;
	return html.replace(exp, '');
}
async function renderFrameworkComponent(result, displayName, Component, _props, slots = {}) {
	if (!Component && 'client:only' in _props === false) {
		throw new Error(
			`Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`,
		);
	}
	const { renderers, clientDirectives } = result;
	const metadata = {
		astroStaticSlot: true,
		displayName,
	};
	const { hydration, isPage, props, propsWithoutTransitionAttributes } = extractDirectives(
		_props,
		clientDirectives,
	);
	let html = '';
	let attrs = void 0;
	if (hydration) {
		metadata.hydrate = hydration.directive;
		metadata.hydrateArgs = hydration.value;
		metadata.componentExport = hydration.componentExport;
		metadata.componentUrl = hydration.componentUrl;
	}
	const probableRendererNames = guessRenderers(metadata.componentUrl);
	const validRenderers = renderers.filter((r) => r.name !== 'astro:jsx');
	const { children, slotInstructions } = await renderSlots(result, slots);
	let renderer;
	if (metadata.hydrate !== 'only') {
		let isTagged = false;
		try {
			isTagged = Component && Component[Renderer];
		} catch {}
		if (isTagged) {
			const rendererName = Component[Renderer];
			renderer = renderers.find(({ name }) => name === rendererName);
		}
		if (!renderer) {
			let error;
			for (const r of renderers) {
				try {
					if (await r.ssr.check.call({ result }, Component, props, children, metadata)) {
						renderer = r;
						break;
					}
				} catch (e) {
					error ??= e;
				}
			}
			if (!renderer && error) {
				throw error;
			}
		}
		if (!renderer && typeof HTMLElement === 'function' && componentIsHTMLElement(Component)) {
			const output = await renderHTMLElement(result, Component, _props, slots);
			return {
				render(destination) {
					destination.write(output);
				},
			};
		}
	} else {
		if (metadata.hydrateArgs) {
			const rendererName = rendererAliases.has(metadata.hydrateArgs)
				? rendererAliases.get(metadata.hydrateArgs)
				: metadata.hydrateArgs;
			if (clientOnlyValues.has(rendererName)) {
				renderer = renderers.find(
					({ name }) => name === `@astrojs/${rendererName}` || name === rendererName,
				);
			}
		}
		if (!renderer && validRenderers.length === 1) {
			renderer = validRenderers[0];
		}
		if (!renderer) {
			const extname = metadata.componentUrl?.split('.').pop();
			renderer = renderers.find(({ name }) => name === `@astrojs/${extname}` || name === extname);
		}
		if (!renderer && metadata.hydrateArgs) {
			const rendererName = metadata.hydrateArgs;
			if (typeof rendererName === 'string') {
				renderer = renderers.find(({ name }) => name === rendererName);
			}
		}
	}
	let componentServerRenderEndTime;
	if (!renderer) {
		if (metadata.hydrate === 'only') {
			const rendererName = rendererAliases.has(metadata.hydrateArgs)
				? rendererAliases.get(metadata.hydrateArgs)
				: metadata.hydrateArgs;
			if (clientOnlyValues.has(rendererName)) {
				const plural = validRenderers.length > 1;
				throw new AstroError({
					...AstroErrorData.NoMatchingRenderer,
					message: AstroErrorData.NoMatchingRenderer.message(
						metadata.displayName,
						metadata?.componentUrl?.split('.').pop(),
						plural,
						validRenderers.length,
					),
					hint: AstroErrorData.NoMatchingRenderer.hint(
						formatList(probableRendererNames.map((r) => '`' + r + '`')),
					),
				});
			} else {
				throw new AstroError({
					...AstroErrorData.NoClientOnlyHint,
					message: AstroErrorData.NoClientOnlyHint.message(metadata.displayName),
					hint: AstroErrorData.NoClientOnlyHint.hint(
						probableRendererNames.map((r) => r.replace('@astrojs/', '')).join('|'),
					),
				});
			}
		} else if (typeof Component !== 'string') {
			const matchingRenderers = validRenderers.filter((r) =>
				probableRendererNames.includes(r.name),
			);
			const plural = validRenderers.length > 1;
			if (matchingRenderers.length === 0) {
				throw new AstroError({
					...AstroErrorData.NoMatchingRenderer,
					message: AstroErrorData.NoMatchingRenderer.message(
						metadata.displayName,
						metadata?.componentUrl?.split('.').pop(),
						plural,
						validRenderers.length,
					),
					hint: AstroErrorData.NoMatchingRenderer.hint(
						formatList(probableRendererNames.map((r) => '`' + r + '`')),
					),
				});
			} else if (matchingRenderers.length === 1) {
				renderer = matchingRenderers[0];
				({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
					{ result },
					Component,
					propsWithoutTransitionAttributes,
					children,
					metadata,
				));
			} else {
				throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.
3. If using multiple JSX frameworks at the same time (e.g. React + Preact), pass the correct \`include\`/\`exclude\` options to integrations.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
			}
		}
	} else {
		if (metadata.hydrate === 'only') {
			html = await renderSlotToString(result, slots?.fallback);
		} else {
			const componentRenderStartTime = performance.now();
			({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
				{ result },
				Component,
				propsWithoutTransitionAttributes,
				children,
				metadata,
			));
			if (process.env.NODE_ENV === 'development')
				componentServerRenderEndTime = performance.now() - componentRenderStartTime;
		}
	}
	if (!html && typeof Component === 'string') {
		const Tag = sanitizeElementName(Component);
		const childSlots = Object.values(children).join('');
		const renderTemplateResult = renderTemplate`<${Tag}${internalSpreadAttributes(
			props,
			true,
			Tag,
		)}${markHTMLString(
			childSlots === '' && voidElementNames.test(Tag) ? `/>` : `>${childSlots}</${Tag}>`,
		)}`;
		html = '';
		const destination = {
			write(chunk) {
				if (chunk instanceof Response) return;
				html += chunkToString(result, chunk);
			},
		};
		await renderTemplateResult.render(destination);
	}
	if (!hydration) {
		return {
			render(destination) {
				if (slotInstructions) {
					for (const instruction of slotInstructions) {
						destination.write(instruction);
					}
				}
				if (isPage || renderer?.name === 'astro:jsx') {
					destination.write(html);
				} else if (html && html.length > 0) {
					destination.write(
						markHTMLString(removeStaticAstroSlot(html, renderer?.ssr?.supportsAstroStaticSlot)),
					);
				}
			},
		};
	}
	const astroId = shorthash(
		`<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(props, metadata)}`,
	);
	const island = await generateHydrateScript({ renderer, result, astroId, props, attrs }, metadata);
	if (componentServerRenderEndTime && process.env.NODE_ENV === 'development')
		island.props['server-render-time'] = componentServerRenderEndTime;
	let unrenderedSlots = [];
	if (html) {
		if (Object.keys(children).length > 0) {
			for (const key of Object.keys(children)) {
				let tagName = renderer?.ssr?.supportsAstroStaticSlot
					? !!metadata.hydrate
						? 'astro-slot'
						: 'astro-static-slot'
					: 'astro-slot';
				let expectedHTML =
					key === 'default' ? `<${tagName}>` : `<${tagName} name="${escapeHTML(key)}">`;
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
							`<template data-astro-template${key !== 'default' ? `="${escapeHTML(key)}"` : ''}>${children[key]}</template>`,
					)
					.join('')
			: '';
	island.children = `${html ?? ''}${template}`;
	if (island.children) {
		island.props['await-children'] = '';
		island.children += `<!--astro:end-->`;
	}
	return {
		render(destination) {
			if (slotInstructions) {
				for (const instruction of slotInstructions) {
					destination.write(instruction);
				}
			}
			destination.write(createRenderInstruction({ type: 'directive', hydration }));
			if (hydration.directive !== 'only' && renderer?.ssr.renderHydrationScript) {
				destination.write(
					createRenderInstruction({
						type: 'renderer-hydration-script',
						rendererName: renderer.name,
						render: renderer.ssr.renderHydrationScript,
					}),
				);
			}
			const renderedElement = renderElement('astro-island', island, false);
			destination.write(markHTMLString(renderedElement));
		},
	};
}
function sanitizeElementName(tag) {
	const unsafe = /[&<>'"\s]+/;
	if (!unsafe.test(tag)) return tag;
	return tag.trim().split(unsafe)[0].trim();
}
function renderFragmentComponent(result, slots = {}) {
	const slot = slots?.default;
	return {
		render(destination) {
			if (slot == null) return;
			return renderSlot(result, slot).render(destination);
		},
	};
}
async function renderHTMLComponent(result, Component, _props, slots = {}) {
	const { slotInstructions, children } = await renderSlots(result, slots);
	const html = Component({ slots: children });
	const hydrationHtml = slotInstructions
		? slotInstructions.map((instr) => chunkToString(result, instr)).join('')
		: '';
	return {
		render(destination) {
			destination.write(markHTMLString(hydrationHtml + html));
		},
	};
}
function renderAstroComponent(result, displayName, Component, props, slots = {}) {
	if (containsServerDirective(props)) {
		const serverIslandComponent = new ServerIslandComponent(result, props, slots, displayName);
		result._metadata.propagators.add(serverIslandComponent);
		return serverIslandComponent;
	}
	const instance = createAstroComponentInstance(result, displayName, Component, props, slots);
	return {
		render(destination) {
			return instance.render(destination);
		},
	};
}
function renderComponent(result, displayName, Component, props, slots = {}) {
	if (isPromise(Component)) {
		return Component.catch(handleCancellation).then((x) => {
			return renderComponent(result, displayName, x, props, slots);
		});
	}
	if (isFragmentComponent(Component)) {
		return renderFragmentComponent(result, slots);
	}
	props = normalizeProps(props);
	if (isHTMLComponent(Component)) {
		return renderHTMLComponent(result, Component, props, slots).catch(handleCancellation);
	}
	if (isAstroComponentFactory(Component)) {
		return renderAstroComponent(result, displayName, Component, props, slots);
	}
	return renderFrameworkComponent(result, displayName, Component, props, slots).catch(
		handleCancellation,
	);
	function handleCancellation(e) {
		if (result.cancelled)
			return {
				render() {},
			};
		throw e;
	}
}
function normalizeProps(props) {
	if (props['class:list'] !== void 0) {
		const value = props['class:list'];
		delete props['class:list'];
		props['class'] = clsx(props['class'], value);
		if (props['class'] === '') {
			delete props['class'];
		}
	}
	return props;
}
async function renderComponentToString(
	result,
	displayName,
	Component,
	props,
	slots = {},
	isPage = false,
	route,
) {
	let str = '';
	let renderedFirstPageChunk = false;
	let head = '';
	if (isPage && !result.partial && nonAstroPageNeedsHeadInjection(Component)) {
		head += chunkToString(result, maybeRenderHead());
	}
	try {
		const destination = {
			write(chunk) {
				if (isPage && !result.partial && !renderedFirstPageChunk) {
					renderedFirstPageChunk = true;
					if (!/<!doctype html/i.test(String(chunk))) {
						const doctype = result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n';
						str += doctype + head;
					}
				}
				if (chunk instanceof Response) return;
				str += chunkToString(result, chunk);
			},
		};
		const renderInstance = await renderComponent(result, displayName, Component, props, slots);
		if (containsServerDirective(props)) {
			await bufferHeadContent(result);
		}
		await renderInstance.render(destination);
	} catch (e) {
		if (AstroError.is(e) && !e.loc) {
			e.setLocation({
				file: route?.component,
			});
		}
		throw e;
	}
	return str;
}
function nonAstroPageNeedsHeadInjection(pageComponent) {
	return !!pageComponent?.[needsHeadRenderingSymbol];
}
export { renderComponent, renderComponentToString };
