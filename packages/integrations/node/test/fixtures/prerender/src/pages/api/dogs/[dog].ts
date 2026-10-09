export const prerender = true;

export function getStaticPaths() {
	return [{ params: { dog: 'rover' } }];
}

export function GET({ params }: { params: { dog: string } }) {
	return Response.json({ dog: params.dog });
}
