import Attribute from '../../../nodes/Attribute';
import Block from '../../Block';
import AttributeWrapper from './Attribute';
import ElementWrapper from '../Element';
import Expression from '../../../nodes/shared/Expression';
import Text from '../../../nodes/Text';
export interface StyleProp {
  key: string;
  value: Array<Text | Expression>;
  important: boolean;
}
export default class StyleAttributeWrapper extends AttributeWrapper {
  node: Attribute;
  parent: ElementWrapper;
  render(block: Block): void;
}
