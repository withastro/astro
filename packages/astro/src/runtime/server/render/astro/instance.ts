import type { SSRResult } from '../../../../types/public/internal.js';
import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import type { RenderDestination } from '../common.js';
import type { ComponentSlots } from '../slot.js';
import type { AstroComponentFactory, AstroFactoryReturnValue } from './factory.js';
import { isAPropagatingComponent } from './factory.js';
import { isHeadAndContent } from './head-and-content.js';

type ComponentProps = Record<string | number, any>;

const astroComponentInstanceSym = Symbol.for('astro.componentInstance');

export class AstroComponentInstance {
	[astroComponentInstanceSym] = true;

	private readonly result: SSRResult;
	private readonly props: ComponentProps;
	private readonly slotValues: ComponentSlots;
	private readonly factory: AstroComponentFactory;
	private returnValue: ReturnType<AstroComponentFactory> | undefined;
	constructor(
		result: SSRResult,
		props: ComponentProps,
		slots: ComponentSlots,
		factory: AstroComponentFactory,
	) {
		this.result = result;
		this.props = props;
		this.factory = factory;
		this.slotValues = {};
		for (const name in slots) {
			// prerender the slots eagerly to make collection entries propagate styles and scripts
			let didRender = false;
			let value = slots[name](result);
			this.slotValues[name] = () => {
				// use prerendered value only once
				if (!didRender) {
					didRender = true;
					return value;
				}
				// render afresh for the advanced use-case where the same slot is rendered multiple times
				return slots[name](result);
			};
		}
	}

	init(result: SSRResult): AstroFactoryReturnValue | Promise<AstroFactoryReturnValue> {
		if (this.returnValue !== undefined) {
			return this.returnValue;
		}

		this.returnValue = this.factory(result, this.props, this.slotValues);

		// Save the resolved value after promise is resolved for optimization
		if (isPromise(this.returnValue)) {
			this.returnValue
				.then((resolved) => {
					this.returnValue = resolved;
				})
				.catch(() => {
					// Ignore errors and appease unhandledrejection error
				});
		}
		return this.returnValue;
	}

	render(destination: RenderDestination): void | Promise<void> {
		const returnValue = this.init(this.result);

		if (isPromise(returnValue)) {
			return returnValue.then((x) => this.renderImpl(destination, x));
		}

		return this.renderImpl(destination, returnValue);
	}

	private renderImpl(destination: RenderDestination, returnValue: AstroFactoryReturnValue) {
		if (isHeadAndContent(returnValue)) {
			return returnValue.content.render(destination);
		} else {
			return renderChild(destination, returnValue);
		}
	}
}

// Issue warnings for invalid props for Astro components
function validateComponentProps(
	props: any,
	clientDirectives: SSRResult['clientDirectives'],
	displayName: string,
) {
	if (props != null) {
		const directives = [...clientDirectives.keys()].map((directive) => `client:${directive}`);
		for (const prop of Object.keys(props)) {
			if (directives.includes(prop)) {
				console.warn(
					`You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`,
				);
			}
		}
	}
}

export function createAstroComponentInstance(
	result: SSRResult,
	displayName: string,
	factory: AstroComponentFactory,
	props: ComponentProps,
	slots: any = {},
) {
	validateComponentProps(props, result.clientDirectives, displayName);
	const instance = new AstroComponentInstance(result, props, slots, factory);
	if (isAPropagatingComponent(result, factory)) {
		result._metadata.propagators.add(instance);
	}
	return instance;
}

export function isAstroComponentInstance(obj: unknown): obj is AstroComponentInstance {
	return typeof obj === 'object' && obj !== null && !!(obj as any)[astroComponentInstanceSym];
}
