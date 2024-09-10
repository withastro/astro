import { defineAction } from "astro:actions";
import { db, eq, Todo } from "astro:db";
import { z } from 'astro:schema'

export const server = {
  addTodo: defineAction({
    accept: "form",
    input: z.object({
      task: z.string()
    }),
    handler: async ({ task }) => {
      await db.insert(Todo).values({ task, created: new Date() })
    }
  }),
  deleteTodo: defineAction({
    accept: "form",
    input: z.object({
      id: z.number()
    }),
    handler: async ({ id }) => {
      const todo = await db.select().from(Todo).where(eq(Todo.id, id)).get();
      if (!todo) {
        throw new Error("Id not found.");
      }

      await db.delete(Todo).where(eq(Todo.id, id));
    }
  }),
  toggleTodo: defineAction({
    
    accept: "form",
    input: z.object({
      id: z.number()
    }),
    handler: async ({ id }, context) => {
      const todo = await db.select().from(Todo).where(eq(Todo.id, id)).get();
      if (!todo) {
        throw new Error("Id not found.");
      }

      await db.update(Todo).set({
        completed: todo.completed ? null : new Date()
      })
      .where(
        eq(Todo.id, id)
      )
    }
  })
}