import { lazy, Suspense } from 'react';

const Message = lazy(async () => import('./Message'));

const LazyMessage = () => {
	return (
		<Suspense fallback={null}>
			<Message text="lazy-message" />
		</Suspense>
	);
};

export default LazyMessage;
