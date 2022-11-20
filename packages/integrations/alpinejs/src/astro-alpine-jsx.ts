// Temporary While I'm Working On Alpine Attributes With Modifiers
type WorkInProgress = never;

interface XShowAttributes {
    'x-show': string | undefined | null;
    'x-show.important': string | undefined | null;
}

interface XModelAttributes {
    'x-model'?: string | undefined | null;
    'x-model.lazy'?: string | undefined | null;
    'x-model.number'?: string | undefined | null;
    'x-model.throttle'?: string | undefined | null;
    'x-model.debounce'?: string | undefined | null;
    [throttle: `x-model.throttle.${number}ms`]: string | undefined | null;
    [debounce: `x-model.debounce.${number}ms`]: string | undefined | null;
}

interface AlpineAttributes extends XShowAttributes, XModelAttributes {
    'x-data'?: string | boolean | undefined | null;
    'x-init'?: boolean | undefined | null;
    'x-bind'?: WorkInProgress;
    'x-on'?: WorkInProgress;
    'x-text'?: string | undefined | null;
    'x-html'?: string | undefined | null;
    'x-modelable'?: string | undefined | null;
    'x-for'?: string | undefined | null;
    'x-transition'?: WorkInProgress;
    'x-effect'?: string | undefined | null;
    'x-ignore'?: boolean | undefined | null;
    'x-ref'?: string | undefined | null;
    'x-cloak'?: boolean | undefined | null;
    'x-teleport'?: string | undefined | null;
    'x-if'?: string | undefined | null;
    'x-id'?: string | undefined | null;
}