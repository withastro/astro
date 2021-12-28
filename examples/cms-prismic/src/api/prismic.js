import Prismic from '@prismicio/client'

const { Predicates } = Prismic;
const { PUBLIC_PRISMIC_ENDPOINT } = import.meta.env;
 
// https://prismic.io/docs/technologies/integrating-with-an-existing-project-javascript

// Initialize the Prismic api
function initApi(req){
  if (PUBLIC_PRISMIC_ENDPOINT) {
    return Prismic.client(PUBLIC_PRISMIC_ENDPOINT, {
      // accessToken: 'your-access-token', // uncomment this if your API needs a token
      req: req
    });
  }
  return null 
}

export {
    initApi,
    Predicates
}