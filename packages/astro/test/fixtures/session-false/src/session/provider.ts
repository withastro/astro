// Decoy: user code shaped exactly like the path the
// astro:session-provider plugin intercepts, to prove the plugin does
// not hijack unrelated `./session/provider.js` imports under
// `session: false`.
export const USER_PROVIDER_SENTINEL = 'user-provider-was-not-hijacked';
