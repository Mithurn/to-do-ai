import { useTasksStore } from "@/app/stores/useTasksStore";
import { DeleteDialog } from "../Dialogs/ClearAllDialog/DeleteDialog";

export function TasksFooter() {
  const { tasks } = useTasksStore();
  return (
    <footer className="w-full border-t border-border bg-card/90 px-8 py-5 flex justify-between items-center rounded-b-2xl shadow-lg mt-8 mb-2">
      <span className="text-muted-foreground text-base font-semibold tracking-wide">
        {tasks.length} Task{tasks.length !== 1 && "s"}
      </span>
      <DeleteDialog />
    </footer>
  );
}
