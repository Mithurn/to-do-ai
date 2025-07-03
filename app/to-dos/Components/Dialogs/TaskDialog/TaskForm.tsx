"use client";

import { useTasksStore } from "@/app/stores/useTasksStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { FieldErrors, FieldValues, useFormContext } from "react-hook-form";
import { BiSolidError } from "react-icons/bi";
import { FaCircle } from "react-icons/fa6";

export function TaskForm() {
  return (
    <div className="flex flex-col gap-6 mt-8">
      <TaskName />
      <div className="grid grid-cols-2 gap-6">
        <TaskPriority />
        <TaskStatus />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <TaskDate />
        <TaskTime />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <EndDate />
        <EndTime />
      </div>
    </div>
  );
}

function TaskName() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <div>
      <Label htmlFor="taskName">Task Name</Label>
      <Input
        {...register("taskName")}
        id="taskName"
        type="text"
        placeholder="Enter a name of the task"
        className="mt-1"
      />
      {errors["taskName"] && <ShowError label="taskName" errors={errors} />}
    </div>
  );
}

function TaskPriority() {
  const {
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext();
  const { isTaskDialogOpened, taskSelected } = useTasksStore();
  const selectedPriority = watch("priority") || "low";

  useEffect(() => {
    if (isTaskDialogOpened && !taskSelected) {
      setValue("priority", "low");
      trigger("priority");
    }
  }, [isTaskDialogOpened, trigger]);

  const handlePriorityChange = (value: string) => {
    setValue("priority", value);
    trigger("priority");
  };

  return (
    <div>
      <Label className="mb-1">Priority</Label>
      <Select value={selectedPriority} onValueChange={handlePriorityChange}>
        <SelectTrigger className="w-full mt-1">
          <SelectValue placeholder="Select a priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="low">
              <div className="flex items-center gap-1">
                <FaCircle className="text-[12px] text-green-600" />
                <span>Low</span>
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-1">
                <FaCircle className="text-[12px] text-yellow-600" />
                <span>Medium</span>
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-1">
                <FaCircle className="text-[12px] text-red-600" />
                <span>High</span>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {errors["priority"] && <ShowError label="priority" errors={errors} />}
    </div>
  );
}

function TaskStatus() {
  const {
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext();
  const { isTaskDialogOpened, taskSelected } = useTasksStore();
  const selectedStatus = watch("status") || "in progress";

  useEffect(() => {
    if (isTaskDialogOpened && !taskSelected) {
      setValue("status", "in progress");
      trigger("status");
    }
  }, [isTaskDialogOpened, trigger]);

  function handleStatusChange(value: string) {
    setValue("status", value);
    trigger("status");
  }

  return (
    <div>
      <Label className="mb-1">Status</Label>
      <Select value={selectedStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full mt-1">
          <SelectValue placeholder="Select a status" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="in progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {errors["status"] && <ShowError label="status" errors={errors} />}
    </div>
  );
}

function TaskDate() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  
  const currentDate = watch("taskDate");
  
  return (
    <div>
      <Label htmlFor="taskDate">Start Date</Label>
      <Input
        {...register("taskDate", { required: "Start date is required" })}
        id="taskDate"
        type="date"
        className="mt-1"
        value={currentDate || ""}
      />
      {errors["taskDate"] && <ShowError label="taskDate" errors={errors} />}
    </div>
  );
}

function TaskTime() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  
  const currentTime = watch("taskTime");
  
  return (
    <div>
      <Label htmlFor="taskTime">Start Time</Label>
      <Input
        {...register("taskTime", { required: "Start time is required" })}
        id="taskTime"
        type="time"
        className="mt-1"
        step="60"
        pattern="[0-9]{2}:[0-9]{2}"
        value={currentTime || ""}
      />
      {errors["taskTime"] && <ShowError label="taskTime" errors={errors} />}
    </div>
  );
}

function EndDate() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <div>
      <Label htmlFor="endDate">End Date (Optional)</Label>
      <Input
        {...register("endDate")}
        id="endDate"
        type="date"
        className="mt-1"
      />
      {errors["endDate"] && <ShowError label="endDate" errors={errors} />}
    </div>
  );
}

function EndTime() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <div>
      <Label htmlFor="endTime">End Time (Optional)</Label>
      <Input
        {...register("endTime")}
        id="endTime"
        type="time"
        className="mt-1"
        step="60"
        pattern="[0-9]{2}:[0-9]{2}"
      />
      {errors["endTime"] && <ShowError label="endTime" errors={errors} />}
    </div>
  );
}

function ShowError({
  label,
  errors,
}: {
  errors: FieldErrors<FieldValues>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 text-red-500 mt-2">
      <BiSolidError className="text-sm" />
      <p className="text-red-500 text-sm">
        {typeof errors[label]?.message === "string" ? errors[label]?.message : "Invalid field"}
      </p>
    </div>
  );
}
