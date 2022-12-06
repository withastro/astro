import type { SSRResult } from '../../../../@types/astro';
import type { AstroComponentFactory, AstroFactoryReturnValue } from './factory.js';

import { HydrationDirectiveProps } from '../../hydration.js';
import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import { isAPropagatingComponent } from './factory.js';
import { isHeadAndContent } from './head-and-content.js';

type ComponentProps = Record<string | number, any>;

const astroComponentInstanceSym = Symbol.for('astro.componentInstance');

export class AstroComponentInstance {
	[astroComponentInstanceSym] = true;

	private readonly result: SSRResult;
	private readonly props: ComponentProps;
	private readonly slots: any;
	private readonly factory: AstroComponentFactory;
	private returnValue: ReturnType<AstroComponentFactory> | undefined;
	constructor(
		result: SSRResult,
		props: ComponentProps,
		slots: any,
		factory: AstroComponentFactory
	) {
		this.result = result;
		this.props = props;
		this.slots = slots;
		this.factory = factory;
	}

	async init() {
		this.returnValue = this.factory(this.result, this.props, this.slots);
		return this.returnValue;
	}

	async *render() {
		if (this.returnValue === undefined) {
			await this.init();
		}

		let value: AstroFactoryReturnValue | undefined = this.returnValue;
		if (isPromise(value)) {
			value = await value;
		}
		if (isHeadAndContent(value)) {
			yield* value.content;
		} else {
			yield* renderChild(value);
		}
	}
}

// Issue warnings for invalid props for Astro components
function validateComponentProps(props: any, displayName: string) {
	if (props != null) {
		for (const prop of Object.keys(props)) {
			if (HydrationDirectiveProps.has(prop)) {
				// eslint-disable-next-line
				console.warn(
					`You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
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
	slots: any = {}
) {
	validateComponentProps(props, displayName);
	const instance = new AstroComponentInstance(result, props, slots, factory);
	if (isAPropagatingComponent(result, factory) && !result.propagators.has(factory)) {
		result.propagators.set(factory, instance);
	}
	return instance;
}

export function isAstroComponentInstance(obj: unknown): obj is AstroComponentInstance {
	return typeof obj === 'object' && !!(obj as any)[astroComponentInstanceSym];
}
