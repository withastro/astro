import { users } from './users.js';
import { computed } from 'nanostores';

const admins = computed(users, (list) => list.filter((user) => user.isAdmin));

export { admins };
