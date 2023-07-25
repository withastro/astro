import type { SSRResult } from '../../../../@types/astro';
import type { ComponentSlots } from '../slot.js';
import type { AstroComponentFactory, AstroFactoryReturnValue } from './factory.js';

import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import type { RenderDestination } from '../common.js';
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
		factory: AstroComponentFactory
	) {
		this.result = result;
		this.props = props;
		this.factory = factory;
		this.slotValues = {};
		for (const name in slots) {
			const value = slots[name](result);
			this.slotValues[name] = () => value;
		}
	}

	async init(result: SSRResult) {
		this.returnValue = this.factory(result, this.props, this.slotValues);
		return this.returnValue;
	}

	async render(destination: RenderDestination) {
		if (this.returnValue === undefined) {
			await this.init(this.result);
		}

		let value: AstroFactoryReturnValue | undefined = this.returnValue;
		if (isPromise(value)) {
			value = await value;
		}
		if (isHeadAndContent(value)) {
			await value.content.render(destination);
		} else {
			await renderChild(destination, value);
		}
	}
}

// Issue warnings for invalid props for Astro components
function validateComponentProps(props: any, displayName: string) {
	if (props != null) {
		for (const prop of Object.keys(props)) {
			if (prop.startsWith('client:')) {
				// eslint-disable-next-line
				console.warn(
					`You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
				);
			}
		}
	}
}

export async function createAstroComponentInstance(
	result: SSRResult,
	displayName: string,
	factory: AstroComponentFactory,
	props: ComponentProps,
	slots: any = {}
) {
	validateComponentProps(props, displayName);
	const instance = new AstroComponentInstance(result, props, slots, factory);

	if (isAPropagatingComponent(result, factory) && !result._metadata.propagators.has(factory)) {
		result._metadata.propagators.set(factory, instance);
		// Call component instances that might have head content to be propagated up.
		const returnValue = await instance.init(result);
		if (isHeadAndContent(returnValue)) {
			result._metadata.extraHead.push(returnValue.head);
		}
	}

	return instance;
}

export function isAstroComponentInstance(obj: unknown): obj is AstroComponentInstance {
	return typeof obj === 'object' && !!(obj as any)[astroComponentInstanceSym];
}
