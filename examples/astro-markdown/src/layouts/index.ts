type TypeGuard<T> = (value: unknown) => value is T;

interface PropOptions<T> {
  required?: boolean;
}
type PropFactory<T> = (options?: PropOptions<T>) => TypeGuard<T>;
type Prop<T> = PropFactory<T> | TypeGuard<T>;

type PropType<T extends Prop<any>> = T extends Prop<infer U> ? U : never;

type Props<T extends Record<string|number, Prop<any>>> = { 
  [Prop in keyof T]: PropType<T[Prop]>
}

interface Astro {
  props<T extends Record<string|number, any>>(): T;
}

interface TestProps {
  content: string;
}

declare var Astro: Astro;

const { content } = Astro.props<TestProps>();
