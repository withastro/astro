import Counter from '../components/Counter';

export default async function Home() {
	return (
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width" />
				<title>Astro</title>
			</head>
			<body>
				<h1>Astro</h1>
				<Counter client:load>
					<div>
						<h1>Hello!</h1>
						<Counter client:load>
							<h2>No</h2>
						</Counter>
					</div>
				</Counter>
			</body>
		</html>
	)
}
