/** */
export function __astro_slot_content({ name }: { name: string }, ...children: any[]) {
  return { $slot: name, children };
}

export const __astro_slot = ({ name = 'default' }: { name: string }, _children: any, ...fallback: string[]) => {
  if (name === 'default' && typeof _children === 'string') {
    return _children ? _children : fallback;
  }
  if (!_children.$slots) {
    throw new Error(`__astro_slot encountered an unexpected child:\n${JSON.stringify(_children)}`);
  }
  const children = _children.$slots[name];
  return children ? children : fallback;
};
