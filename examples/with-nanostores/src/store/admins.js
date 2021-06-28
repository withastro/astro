import { createDerived } from 'nanostores';

import { users } from './users.js';

const admins = createDerived(users, (list) => list.filter((user) => user.isAdmin));

export { admins };
