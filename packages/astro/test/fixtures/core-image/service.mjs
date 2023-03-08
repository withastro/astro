import squoosh from 'astro/assets/services/squoosh';

const service = {
  getURL(options) {
		return squoosh.getURL(options);
  },
	getHTMLAttributes(options) {
		options['data-service'] = 'my-custom-service';
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
