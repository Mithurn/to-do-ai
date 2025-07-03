import { text, pgTable, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; 
// Define Enums for Priority and Status
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const statusEnum = pgEnum("status", ["in progress", "completed"]);

export const userTable = pgTable("userTable", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hash_password: text("hash_password").notNull(),
});

// Task Table (Using Enums for priority and status)
export const tasksTable = pgTable("tasksTable", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priority: priorityEnum("priority").notNull(),
  status: statusEnum("status").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),

  // ✅ Safe timestamp columns with defaults
  startTime: timestamp("start_time", {
    withTimezone: true,
    mode: "string",
  }).notNull().defaultNow(), // defaults to current time

  endTime: timestamp("end_time", {
    withTimezone: true,
    mode: "string",
  }).notNull().default(sql`now() + interval '1 hour'`), // 1-hour later default
});



export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});
