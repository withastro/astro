import Component from '../../../Component';
import Block from '../../Block';
import BindingWrapper from '../Element/Binding';
import { Identifier } from 'estree';
export default function bind_this(component: Component, block: Block, binding: BindingWrapper, variable: Identifier): import("estree").Node[];
