// Temporary While I'm Working On Alpine Attributes With Modifiers
type WorkInProgress = never;

interface AlpineAttributes {
    'x-data'?: string | boolean | undefined | null;
    'x-init'?: boolean | undefined | null;
    'x-show'?: WorkInProgress;
    'x-bind'?: WorkInProgress;
    'x-on'?: WorkInProgress;
    'x-text'?: string | undefined | null;
    'x-html'?: string | undefined | null;
    'x-model'?: WorkInProgress;
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