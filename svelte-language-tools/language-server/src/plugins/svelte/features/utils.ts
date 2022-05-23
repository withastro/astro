import { AttributeContext } from '../../../lib/documents/parseHtml';
import { possiblyComponent } from '../../../utils';

export function attributeCanHaveEventModifier(attributeContext: AttributeContext) {
    return (
        !attributeContext.inValue &&
        !possiblyComponent(attributeContext.elementTag) &&
        attributeContext.name.startsWith('on:') &&
        attributeContext.name.includes('|')
    );
}
