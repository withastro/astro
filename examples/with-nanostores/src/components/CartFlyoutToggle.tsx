import { useStore } from '@nanostores/preact';
import { isCartOpen } from '../cartStore';


export default function CartButton() {
  const $isCartOpen = useStore(isCartOpen)
  return (
    <button onClick={() => isCartOpen.set(!$isCartOpen)}>Cart</button>
  )
}