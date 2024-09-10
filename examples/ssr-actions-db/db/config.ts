import { column, defineDb, defineTable } from 'astro:db';

const Todo = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    task: column.text(),
    created: column.date(),
    completed: column.date({ optional: true }),
  }
})

// https://astro.build/db/config
export default defineDb({
  tables: { Todo }
});
