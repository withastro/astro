export {
  describe,
  describe as suite,
  it,
  it as test,
  after,
  afterEach,
  before,
  beforeEach,
	
} from "jsr:@std/testing/bdd";

import { configureGlobalSanitizers } from "jsr:@std/testing/unstable-bdd";

configureGlobalSanitizers({
	sanitizeOps: false,
	sanitizeResources: false,
 });
 