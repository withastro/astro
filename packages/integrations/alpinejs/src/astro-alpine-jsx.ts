// Temporary While I'm Working On Alpine Attributes With Modifiers
type WorkInProgress = never;

interface XShowAttributes {
    'x-show': string | undefined | null;
    'x-show.important': string | undefined | null;
}


// Technically `x-bind` sets the native HTML attributes...
// So while this works, it's kind of just a quick fix
// As the key doesn't type check for valid HTML attributes
interface XBindAttributes {
    [key: `x-bind:${string}`]: string | undefined | null;
    [key: `:${string}`]: string | undefined | null;
}

interface XModelAttributes {
    'x-model'?: string | undefined | null;
    'x-model.lazy'?: string | undefined | null;
    'x-model.number'?: string | undefined | null;
    'x-model.throttle'?: string | undefined | null;
    'x-model.debounce'?: string | undefined | null;
    [key: `x-model.throttle.${number}ms`]: string | undefined | null;
    [key: `x-model.debounce.${number}ms`]: string | undefined | null;
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