import { text, pgTable, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; 
// Define Enums for Priority and Status
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const statusEnum = pgEnum("status", ["pending", "in progress", "completed"]);

export const userTable = pgTable("userTable", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hash_password: text("hash_password").notNull(),
});

// Task Table (Using Enums for priority and status)
export const tasksTable = pgTable("tasksTable", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // New: Optional description for the task
  description: text("description"),
  priority: priorityEnum("priority").notNull(),
  status: statusEnum("status").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),

  // New: Due date (optional, ISO string)
  due_date: timestamp("due_date", { withTimezone: true, mode: "string" }),
  // New: Estimated time to complete (optional, as string for flexibility)
  estimated_time: text("estimated_time"),
  // New: Category (optional)
  category: text("category"),
  // New: Dependencies (optional, store as JSON string)
  dependencies: text("dependencies"),

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
