import { useTasksStore } from "@/app/stores/useTasksStore";
import { DeleteDialog } from "../Dialogs/ClearAllDialog/DeleteDialog";

export function TasksFooter() {
  const { tasks } = useTasksStore();
  return (
    <div className="flex justify-between items-center py-3 gap-4 w-full">
      <p className="text-muted-foreground text-sm font-medium">{tasks.length} Tasks</p>
      <DeleteDialog />
    </div>
  );
}
