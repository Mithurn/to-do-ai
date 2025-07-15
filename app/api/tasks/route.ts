import { Task } from "@/app/data/Tasks";
import { NextResponse } from "next/server";
import { db } from "@/app/db/drizzle";
import { tasksTable } from "@/app/db/schema";
import { eq } from "drizzle-orm";

// Define the DB row type for tasks
interface DBTask extends Omit<Task, 'dependencies' | 'status' | 'estimated_time' | 'category'> {
  dependencies: string | null;
  status: 'pending' | 'in progress' | 'completed';
  estimated_time?: string | number | null;
  category?: string | null;
}

export async function GET(
  request: Request
): Promise<
  NextResponse<{ tasks?: Task[]; success: boolean; message: string }>
> {
  try {
    //Access to the userID from the URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    //If the userId is undefined, return success as false
    if (!userId) {
      return NextResponse.json({ success: false, message: "user ID required" });
    }

    //Get the tasks with the userId
    let dbTasks: DBTask[] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId));

    // Map DBTask to Task
    const tasks: Task[] = dbTasks.map(task => {
      let deps: string[] | undefined = undefined;
      if (task.dependencies !== null && typeof task.dependencies === 'string') {
        try {
          const parsed = JSON.parse(task.dependencies);
          if (Array.isArray(parsed)) deps = parsed;
        } catch {
          deps = undefined;
        }
      } else if (Array.isArray(task.dependencies)) {
        deps = task.dependencies as any;
      }
      return {
        ...task,
        description: task.description ?? undefined,
        estimated_time: task.estimated_time ?? undefined,
        category: task.category ?? undefined,
        status: task.status === 'in progress' || task.status === 'completed' ? task.status : 'in progress',
        dependencies: deps,
      };
    }).filter(task => task.status === 'in progress' || task.status === 'completed');

    //Return a success response
    return NextResponse.json({
      tasks,
      success: true,
      message: "Successfully fetched tasks",
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch tasks from the server.",
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "user is undefined",
      });
    }

    const body: { option: "delete" | "deleteAll"; task?: Task } =
      await request.json();

    const { option, task } = body;

    if (!option) {
      return NextResponse.json({
        success: false,
        message: "option is not defined",
      });
    }

    if (option === "delete") {
      if (task) {
        // Delete a specific task
        const deletedTask = await db
          .delete(tasksTable)
          .where(eq(tasksTable.id, task.id));

        if (!deletedTask) {
          return NextResponse.json({
            success: false,
            message: "Task not found or deletion failed",
          });
        }

        return NextResponse.json({
          success: true,
          message: "Task deleted successfully!",
        });
      }
    }

    if (option === "deleteAll") {
      const deletedAllTasks = await db
        .delete(tasksTable)
        .where(eq(tasksTable.userId, userId)); // Delete all tasks for the specified user

      if (!deletedAllTasks) {
        return NextResponse.json({
          success: false,
          message: "Failed to delete all tasks",
        });
      }

      return NextResponse.json({
        success: true,
        message: "deleting all task",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Invalid option provided",
    });
  } catch (error) {
    console.log(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body: Task = await request.json();

    // Destructure and check if all the fields are coming from the client
    const { id, name, priority, status } = body;

    // Update the task in the database
    const updatedTask = await db
      .update(tasksTable)
      .set({ name, priority, status })
      .where(eq(tasksTable.id, id))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({
        success: false,
        message: "Task not found or update failed",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
    });
  } catch (error) {
    console.log(error);
  }
}

export async function POST(
  request: Request
): Promise<NextResponse<{ success: boolean; message: string }>> {
  try {
    const body: Task = await request.json();

    // Destructure and check if all the fields are coming from the client
    const { id, name, priority, status, userId, startTime, due_date, description, estimated_time, category, dependencies, endTime } = body;

    if (!id || !name || !priority || !status || !userId || (!startTime && !due_date)) {
      return NextResponse.json({
        success: false,
        message: "All fields are required (including due_date or startTime)",
      });
    }

    // Build insert object, only including fields with values
    const insertData: any = {
      id,
      name,
      priority,
      status,
      userId,
      startTime: startTime || due_date,
      due_date: due_date || startTime,
      endTime: endTime ?? undefined,
    };
    if (description) insertData.description = description;
    if (estimated_time) insertData.estimated_time = estimated_time;
    if (category) insertData.category = category;
    if (dependencies) insertData.dependencies = JSON.stringify(dependencies);

    // Insert the task into the database
    const result = await db.insert(tasksTable).values(insertData);

    if (result) {
      return NextResponse.json({
        success: true,
        message: "Task has been added successfully!",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Task insertion failed!",
    });
  } catch (error) {
    console.error("Error inserting task:", error);
    return NextResponse.json({
      success: false,
      message: `Failed to create a task in the server`,
    });
  }
}
