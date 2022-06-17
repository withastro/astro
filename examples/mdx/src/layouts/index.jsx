export default ({ children }) => (
	<html>
		<head>
			<title>Hello world!</title>
		</head>

		<body>
			<article style={{ maxWidth: '480px', margin: '0 auto' }}>
				{children}
			</article>
		</body>
	</html>
)
