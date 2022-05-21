const config = {
	testMatch: 'e2e/*.test.js',
  projects: [
    {
      name: 'Chrome Stable',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
      },
    },
  ],
};

export default config;
