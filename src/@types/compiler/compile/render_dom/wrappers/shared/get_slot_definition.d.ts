import Let from '../../../nodes/Let';
import Block from '../../Block';
import TemplateScope from '../../../nodes/shared/TemplateScope';
export declare function get_slot_definition(block: Block, scope: TemplateScope, lets: Let[]): {
    block: Block;
    scope: TemplateScope;
    get_context?: undefined;
    get_changes?: undefined;
} | {
    block: Block;
    scope: TemplateScope;
    get_context: import("estree").Expression;
    get_changes: import("estree").Expression;
};
