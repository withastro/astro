import squoosh from 'astro/assets/services/squoosh';

const service = {
	validateOptions(options) {
		return squoosh.validateOptions(options);
	},
  getURL(options) {
		return squoosh.getURL(options);
  },
	getHTMLAttributes(options, serviceConfig) {
		options['data-service'] = 'my-custom-service';
		options['data-service-config'] = serviceConfig.foo;
		return squoosh.getHTMLAttributes(options);
	},
  parseURL(url) {
    return squoosh.parseURL(url);
  },
  transform(buffer, options) {
    return squoosh.transform(buffer, options);
  },
};

export default service;
