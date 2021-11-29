

// https://github.com/vitejs/vite/discussions/5109#discussioncomment-1450726
export function isSSR(options: undefined | { ssr?: boolean }): boolean {
  if (options === undefined) {
    return false;
  }
  if (typeof options == 'object') {
    return !!options.ssr;
  }
  return false;
}