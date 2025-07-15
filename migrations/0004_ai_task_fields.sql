-- Migration: Add AI task fields to tasksTable
ALTER TABLE "tasksTable" ADD COLUMN "description" text;
ALTER TABLE "tasksTable" ADD COLUMN "due_date" timestamp with time zone;
ALTER TABLE "tasksTable" ADD COLUMN "estimated_time" text;
ALTER TABLE "tasksTable" ADD COLUMN "category" text;
ALTER TABLE "tasksTable" ADD COLUMN "dependencies" text;
-- All new fields are nullable and optional for draft/AI tasks 