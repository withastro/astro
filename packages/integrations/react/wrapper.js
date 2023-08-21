import { createPortal } from 'react-dom';

export function Portal({ children, host }) {
    return createPortal([children], host);
}
