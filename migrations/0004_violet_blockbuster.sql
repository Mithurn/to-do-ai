ALTER TYPE "public"."status" ADD VALUE 'pending' BEFORE 'in progress';--> statement-breakpoint
ALTER TABLE "tasksTable" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tasksTable" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasksTable" ADD COLUMN "estimated_time" text;--> statement-breakpoint
ALTER TABLE "tasksTable" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "tasksTable" ADD COLUMN "dependencies" text;--> statement-breakpoint
ALTER TABLE "tasksTable" ADD COLUMN "start_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tasksTable" ADD COLUMN "end_time" timestamp with time zone DEFAULT now() + interval '1 hour' NOT NULL;