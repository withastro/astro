import type { SSRResult } from '../../../../@types/astro';
import type { AstroComponentFactory, AstroFactoryReturnValue } from './factory.js';
import type { renderTemplate } from './render-template.js';

import { HydrationDirectiveProps } from '../../hydration.js';
import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import { isAPropagatingComponent } from './factory.js';
import { isHeadAndContent } from './head-and-content.js';
import { addScopeFlag, removeScopeFlag, ScopeFlags } from '../scope.js';

type ComponentProps = Record<string | number, any>;
type ComponentSlotValue = () => ReturnType<typeof renderTemplate>;
export type ComponentSlots = Record<string, ComponentSlotValue>;
export type ComponentSlotsWithValues = Record<string, ReturnType<ComponentSlotValue>>;

const astroComponentInstanceSym = Symbol.for('astro.componentInstance');

export class AstroComponentInstance {
	[astroComponentInstanceSym] = true;

	private readonly result: SSRResult;
	private readonly props: ComponentProps;
	private readonly slotValues: ComponentSlotsWithValues;
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
		addScopeFlag(result, ScopeFlags.Slot);
		for (const name in slots) {
			this.slotValues[name] = slots[name]();
		}
	}

	async init() {
		this.returnValue = this.factory(this.result, this.props, this.slotValues);
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
