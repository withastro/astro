import { use } from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';

use(chaiJestSnapshot);

before(function () {
	chaiJestSnapshot.resetSnapshotRegistry();
});

beforeEach(function () {
	chaiJestSnapshot.configureUsingMochaContext(this);
});
