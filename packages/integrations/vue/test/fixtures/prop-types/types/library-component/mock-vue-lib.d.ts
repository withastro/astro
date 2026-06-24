import type { PropType } from 'vue';
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<{
    testProp: {
        type: PropType<'test'>;
        default: string;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    testProp: {
        type: PropType<'test'>;
        default: string;
    };
}>>, {
    testProp: 'test';
}, {}>, {
    default?: (_: {}) => any;
}>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
