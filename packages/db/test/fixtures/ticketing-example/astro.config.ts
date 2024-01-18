import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import simpleStackForm from "simple-stack-form";
import db, {
  defineCollection,
  defineWritableCollection,
  field,
} from "@astrojs/db";
import node from "@astrojs/node";

const Event = defineCollection({
  fields: {
    name: field.text(),
    description: field.text(),
    ticketPrice: field.number(),
    date: field.date(),
    location: field.text(),
  },
  data() {
    return [
      {
        name: "Sampha LIVE in Brooklyn",
        description:
          "Sampha is on tour with his new, flawless album Lahai. Come see the live performance outdoors in Prospect Park. Yes, there will be a grand piano 🎹",
        date: new Date("2024-01-01"),
        ticketPrice: 10000,
        location: "Brooklyn, NY",
      },
    ];
  },
});
const Ticket = defineWritableCollection({
  fields: {
    eventId: field.text(),
    email: field.text(),
    quantity: field.number(),
    newsletter: field.boolean({
      default: false,
    }),
  },
});

// https://astro.build/config
export default defineConfig({
  integrations: [preact(), simpleStackForm(), db()],
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  db: {
    studio: true,
    collections: {
      Event,
      Ticket,
    },
  },
});
