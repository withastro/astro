import { computed } from 'nanostores';

import { users } from './users.js';

const admins = computed(users, (list) => list.filter((user) => user.isAdmin));

export { admins };
